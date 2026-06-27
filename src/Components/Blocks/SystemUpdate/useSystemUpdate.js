import { useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  SYSTEM_UPDATE,
  MARK_SYSTEM_UPDATE_SEEN,
  SYSTEM_UPDATE_PUBLISHED,
} from "../../../../graphQL_requests";

// enabled — фактор авторизации/типа субъекта (см. SystemUpdateGate).
// Пока enabled=false: query пропущен, подписки нет, мутации не вызываются.
export function useSystemUpdate({ enabled }) {
  const { data, subscribeToMore } = useQuery(SYSTEM_UPDATE, {
    skip: !enabled,
    fetchPolicy: "cache-and-network",
  });

  // Real-time: пишем результат подписки в кэш того же query.
  // Гейт на enabled + cleanup гарантируют отписку при logout/размонтировании.
  useEffect(() => {
    if (!enabled) return undefined;
    const unsubscribe = subscribeToMore({
      document: SYSTEM_UPDATE_PUBLISHED,
      updateQuery: (prev, { subscriptionData }) => {
        const updated = subscriptionData?.data?.systemUpdatePublished;
        if (!updated) return prev;
        return { systemUpdate: updated };
      },
    });
    return () => unsubscribe();
  }, [enabled, subscribeToMore]);

  // Закрытие: мутация + локальный апдейт кэша (мёрджим, форсим shouldShow:false).
  const [markSeen, { loading: dismissing }] = useMutation(
    MARK_SYSTEM_UPDATE_SEEN,
    {
      update(cache, { data: mutationData }) {
        const seen = mutationData?.markSystemUpdateSeen;
        if (!seen) return;
        let existing = null;
        try {
          existing = cache.readQuery({ query: SYSTEM_UPDATE })?.systemUpdate;
        } catch {
          existing = null;
        }
        cache.writeQuery({
          query: SYSTEM_UPDATE,
          data: {
            systemUpdate: { ...(existing || {}), ...seen, shouldShow: false },
          },
        });
      },
    }
  );

  const systemUpdate = data?.systemUpdate || null;
  const isOpen = Boolean(systemUpdate?.shouldShow);
  const dismiss = () => markSeen().catch(() => {});

  return { systemUpdate, isOpen, dismissing, dismiss };
}
