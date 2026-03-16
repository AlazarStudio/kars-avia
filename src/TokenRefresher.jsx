import React, { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { decodeJWT } from "../graphQL_requests";
import { REFRESH_TOKEN } from "../graphQL_requests";
import { authService } from "./services/authService";

const LEAD_TIME_MS = 4 * 3600 * 1000; // за 4 часа до истечения

export function TokenRefresher() {
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN);
  const timerRef = useRef(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const rawToken = authService.getAccessToken();
    const rawRefresh = authService.getRefreshToken();
    if (!rawToken || !rawRefresh) return;

    let decoded;
    try {
      decoded = decodeJWT(rawToken);
    } catch {
      return;
    }
    const exp = decoded?.exp;
    if (typeof exp !== "number") return;

    const msUntilExp = exp * 1000 - Date.now();
    const delay = Math.max(msUntilExp - LEAD_TIME_MS, 0);

    timerRef.current = setTimeout(async () => {
      try {
        let fingerprint = authService.getFingerprint();
        if (!fingerprint) {
          const fpObj = await FingerprintJS.load();
          const { visitorId } = await fpObj.get();
          fingerprint = visitorId;
          authService.setFingerprint(fingerprint);
        }

        const { data } = await refreshTokenMutation({
          variables: {
            refreshToken: rawRefresh,
            fingerprint,
          },
        });

        const { token: newToken, refreshToken: newRefresh } =
          data?.refreshToken || {};
        if (newToken && newRefresh) {
          authService.setTokens({ token: newToken, refreshToken: newRefresh });
          setRefreshTrigger((t) => t + 1);
        }
      } catch (err) {
        console.error("[TokenRefresher] Refresh failed:", err);
      }
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [refreshTokenMutation, refreshTrigger]);

  return null;
}
