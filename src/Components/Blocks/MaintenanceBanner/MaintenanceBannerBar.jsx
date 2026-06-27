import React, { useEffect } from "react";
import { useQuery } from "@apollo/client";
import classes from "./MaintenanceBannerBar.module.css";
import {
  MAINTENANCE_BANNER,
  MAINTENANCE_BANNER_UPDATED,
} from "../../../../graphQL_requests";
import {
  useMaintenanceCountdown,
  formatCountdown,
} from "./useMaintenanceCountdown";

function MaintenanceBannerBar() {
  const { data, subscribeToMore } = useQuery(MAINTENANCE_BANNER, {
    fetchPolicy: "cache-and-network",
    pollInterval: 5 * 60 * 1000,
  });

  // Real-time обновление плашки через подписку.
  // Пишем в кэш того же query — синхронно обновляются и плашка, и форма настроек.
  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: MAINTENANCE_BANNER_UPDATED,
      updateQuery: (prev, { subscriptionData }) => {
        const updated = subscriptionData?.data?.maintenanceBannerUpdated;
        if (!updated) return prev;
        return { maintenanceBanner: updated };
      },
    });
    return () => unsubscribe();
  }, [subscribeToMore]);

  const banner = data?.maintenanceBanner;
  const endsAt = banner?.endsAt || null;
  const left = useMaintenanceCountdown(endsAt);

  const message = banner?.message?.trim();
  // Сервер сам учитывает enabled и истечение endsAt в isVisible.
  // Локально дополнительно скрываем, когда таймер истёк (до ближайшего refetch).
  const expiredLocally = endsAt != null && left === 0;
  const show = banner?.isVisible === true && !!message && !expiredLocally;

  if (!show) return null;

  return (
    <div className={classes.banner} role="status" aria-live="polite">
      <div className={classes.inner}>
        <svg
          className={classes.icon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 0 0 3.53 21H20.47A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span className={classes.message}>{message}</span>

        {endsAt && left != null && (
          <span className={classes.timer}>{formatCountdown(left)}</span>
        )}
      </div>
    </div>
  );
}

export default MaintenanceBannerBar;
