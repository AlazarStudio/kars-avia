import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, NetworkStatus } from "@apollo/client";

const defaultGetKey = (item) => item?.id;

function dedupe(list, getKey) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = getKey(item);
    if (key != null) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(item);
  }
  return out;
}

function computeHasMore({ pageInfo, loadedPages, loadedCount, lastChunkLen, take }) {
  if (typeof pageInfo?.totalPages === "number") {
    return loadedPages < pageInfo.totalPages;
  }
  if (typeof pageInfo?.totalCount === "number") {
    return loadedCount < pageInfo.totalCount;
  }
  return lastChunkLen === take;
}

/**
 * Универсальный инфинит-скролл для Apollo-списков.
 * Контракт пагинации делегируется консьюмеру через buildVariables/getItems/getPageInfo.
 */
export default function useInfiniteScroll(query, options) {
  const {
    take = 25,
    enabled = true,
    context,
    buildVariables,
    getItems,
    getPageInfo,
    getKey = defaultGetKey,
    resetKeys = [],
    rootMargin = "200px",
    threshold = 0.1,
  } = options;

  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const itemsRef = useRef([]);
  const currentPageRef = useRef(0);
  const loadingRef = useRef(false); // in-flight guard от двойных запросов
  const wrapperRef = useRef(null); // скролл-контейнер = root для observer
  const sentinelRef = useRef(null); // якорь внизу списка

  // Свежие колбэки/опции без пере-подписки эффектов
  const cfgRef = useRef(null);
  cfgRef.current = { buildVariables, getItems, getPageInfo, getKey, take };

  const { data, error, refetch, fetchMore, networkStatus } = useQuery(query, {
    skip: !enabled,
    context,
    variables: enabled ? buildVariables(0, take) : undefined,
    notifyOnNetworkStatusChange: true,
  });

  const loading =
    networkStatus === NetworkStatus.loading && items.length === 0;

  // Страница 0: initial / refetch / смена переменных базового запроса
  useEffect(() => {
    if (!data) return;
    const { getItems, getPageInfo, getKey, take } = cfgRef.current;
    const arr = dedupe(getItems(data) ?? [], getKey);
    itemsRef.current = arr;
    setItems(arr);
    currentPageRef.current = 0;
    const pageInfo = getPageInfo?.(data);
    setHasMore(
      computeHasMore({
        pageInfo,
        loadedPages: 1,
        loadedCount: arr.length,
        lastChunkLen: arr.length,
        take,
      })
    );
  }, [data]);

  const refresh = useCallback(() => {
    const { buildVariables, take } = cfgRef.current;
    currentPageRef.current = 0;
    setHasMore(true);
    return refetch(buildVariables(0, take));
  }, [refetch]);

  // Сброс на стр.0 при смене фильтров. ВАЖНО: значения resetKeys должны также
  // участвовать в buildVariables, иначе базовый запрос не перезапросится и items останутся старыми.
  const resetSignature = JSON.stringify(resetKeys);
  const firstResetRef = useRef(true);
  useEffect(() => {
    if (firstResetRef.current) {
      firstResetRef.current = false;
      return;
    }
    currentPageRef.current = 0;
    setHasMore(true);
  }, [resetSignature]);

  // Свежие данные с головы при повторном открытии
  const prevEnabledRef = useRef(enabled);
  useEffect(() => {
    if (enabled && !prevEnabledRef.current && itemsRef.current.length > 0) {
      refresh();
    }
    prevEnabledRef.current = enabled;
  }, [enabled, refresh]);

  // Ленивый догрузчик
  useEffect(() => {
    const rootEl = wrapperRef.current;
    const targetEl = sentinelRef.current;
    if (!enabled || !rootEl || !targetEl) return;

    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        if (!hasMore || loadingRef.current) return;

        const { buildVariables, getItems, getPageInfo, getKey, take } =
          cfgRef.current;
        const nextPage = currentPageRef.current + 1;

        try {
          loadingRef.current = true;
          setLoadingMore(true);

          const { data: more } = await fetchMore({
            variables: buildVariables(nextPage, take),
            updateQuery: (prev) => prev, // кэш не трогаем — копим в локальном state
          });

          const chunk = getItems(more) ?? [];
          const merged = dedupe([...itemsRef.current, ...chunk], getKey);
          itemsRef.current = merged;
          currentPageRef.current = nextPage;
          setItems(merged);

          const pageInfo = getPageInfo?.(more);
          setHasMore(
            computeHasMore({
              pageInfo,
              loadedPages: nextPage + 1,
              loadedCount: merged.length,
              lastChunkLen: chunk.length,
              take,
            })
          );
        } finally {
          loadingRef.current = false;
          setLoadingMore(false);
        }
      },
      { root: rootEl, rootMargin, threshold }
    );

    io.observe(targetEl);
    return () => io.disconnect();
    // items.length в deps намеренно: sentinel рендерится условно (после загрузки),
    // и пере-навешивание observer'а после его ремаунта зависит от смены длины списка.
  }, [enabled, hasMore, fetchMore, rootMargin, threshold, items.length]);

  return {
    items,
    hasMore,
    loading,
    loadingMore,
    error,
    wrapperRef,
    sentinelRef,
    refresh,
  };
}
