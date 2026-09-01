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
 * initialTake — разовое стартовое окно: первый базовый запрос берёт его вместо take.
 */
export default function useInfiniteScroll(query, options) {
  const {
    take = 25,
    initialTake,
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
  // Фактический take последнего базового запроса (page-0). Отличается от take
  // только после refreshWindow(), когда одним запросом перечитано несколько страниц.
  const requestedTakeRef = useRef(initialTake || take);
  // Разовое стартовое окно (восстановление списка после возврата): первый
  // базовый запрос берёт initialTake вместо take; после refresh() или смены
  // фильтров действует обычный take.
  const initialTakeRef = useRef(initialTake);

  // Свежие колбэки/опции без пере-подписки эффектов
  const cfgRef = useRef(null);
  cfgRef.current = { buildVariables, getItems, getPageInfo, getKey, take };

  const { data, error, refetch, fetchMore, networkStatus } = useQuery(query, {
    skip: !enabled,
    context,
    variables: enabled
      ? buildVariables(0, initialTakeRef.current || take)
      : undefined,
    notifyOnNetworkStatusChange: true,
  });

  const loading =
    networkStatus === NetworkStatus.loading && items.length === 0;

  // Страница 0: initial / refetch / refreshWindow / смена переменных базового запроса
  useEffect(() => {
    if (!data) return;
    const { getItems, getPageInfo, getKey, take } = cfgRef.current;
    const arr = dedupe(getItems(data) ?? [], getKey);
    itemsRef.current = arr;
    setItems(arr);
    // После refreshWindow в data может лежать несколько страниц сразу —
    // восстанавливаем номер последней, чтобы догрузка продолжилась с верного skip.
    currentPageRef.current = Math.max(0, Math.ceil(arr.length / take) - 1);
    const requested = requestedTakeRef.current || take;
    const pageInfo = getPageInfo?.(data);
    setHasMore(
      computeHasMore({
        pageInfo,
        loadedPages: currentPageRef.current + 1,
        loadedCount: arr.length,
        lastChunkLen: arr.length,
        take: requested,
      })
    );
  }, [data]);

  const refresh = useCallback(() => {
    initialTakeRef.current = null;
    const { buildVariables, take } = cfgRef.current;
    currentPageRef.current = 0;
    requestedTakeRef.current = take;
    setHasMore(true);
    return refetch(buildVariables(0, take));
  }, [refetch]);

  // Перезапрос всего загруженного окна одним запросом (страницы 0..N).
  // Для realtime-обновлений: список не схлопывается к первой странице,
  // позиция скролла сохраняется.
  const refreshWindow = useCallback(() => {
    const { buildVariables, take } = cfgRef.current;
    const pages = Math.max(1, Math.ceil(itemsRef.current.length / take));
    requestedTakeRef.current = pages * take;
    return refetch(buildVariables(0, pages * take));
  }, [refetch]);

  // Сброс на стр.0 при смене фильтров. ВАЖНО: значения resetKeys должны также
  // участвовать в buildVariables, иначе базовый запрос не перезапросится и items останутся старыми.
  // Сравниваем сигнатуры, а не «пропускаем первый вызов»: под StrictMode эффект
  // на маунте выполняется дважды, и паттерн firstResetRef вторым прогоном
  // выполнял сброс — обнулял initialTakeRef до того, как базовый запрос успел
  // получить данные.
  const resetSignature = JSON.stringify(resetKeys);
  const prevResetSigRef = useRef(resetSignature);
  useEffect(() => {
    if (prevResetSigRef.current === resetSignature) return;
    prevResetSigRef.current = resetSignature;
    currentPageRef.current = 0;
    requestedTakeRef.current = cfgRef.current.take;
    initialTakeRef.current = null;
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
    refreshWindow,
  };
}
