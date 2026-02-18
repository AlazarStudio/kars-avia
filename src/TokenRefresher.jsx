import React, { useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { decodeJWT, getCookie } from "../graphQL_requests";
import { REFRESH_TOKEN } from "../graphQL_requests";

export function TokenRefresher() {
  const [refreshToken] = useMutation(REFRESH_TOKEN);
  const timerRef = useRef(null);

  useEffect(() => {
    const rawToken = getCookie("token");
    const rawRefresh = getCookie("refreshToken");
    if (!rawToken || !rawRefresh) return;

    // Декодируем exp из JWT
    const { exp } = decodeJWT(rawToken);
    const msUntilExp = exp * 1000 - Date.now();

    // === ВАРИАНТЫ ТАЙМАУТА ===

    // 1) ДЛЯ ТЕСТА — через ровно 1 минуту после монтирования:
    // const delay = 1 * 60 * 1000;

    // 2) ДЛЯ ПРОДА — за 4 часа до истечения:
    const leadTimeMs = 4 * 3600 * 1000;
    const delay = Math.max(msUntilExp - leadTimeMs, 0);

    // 3) ПО СРОКУ JWT — ровно в момент exp (или сразу, если уже истекло):
    // const delay = Math.max(msUntilExp, 0);

    // =========================


    // console.log("TokenRefresher запланирует refresh через (ms):", delay);

    timerRef.current = setTimeout(async () => {
      // console.log("⏰ Выполняем REFRESH_TOKEN");
      try {
        // Берём свежий fingerprint
        const fpObj = await FingerprintJS.load();
        const { visitorId } = await fpObj.get();

        // console.log(visitorId)

        // Посылаем мутацию
        const { data } = await refreshToken({
          variables: {
            refreshToken: rawRefresh,
            fingerprint: visitorId,
          },
        });

        // Сохраняем новые куки
        const { token: newToken, refreshToken: newRefresh } = data.refreshToken;

        document.cookie = "token=; Max-Age=0; Path=/;";
        document.cookie = "refreshToken=; Max-Age=0; Path=/;";

        document.cookie = `token=${newToken}; SameSite=Lax; Max-Age=86400; Path=/;`;
        document.cookie = `refreshToken=${newRefresh}; SameSite=Lax; Max-Age=${
          30 * 24 * 3600
        }; Path=/;`;

        // console.log("✅ Токен обновлён:", data);
      } catch (err) {
        console.error("❌ Не удалось обновить токен:", err);
      }
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [refreshToken]);

  return null;
}
