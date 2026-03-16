/**
 * Apollo error link: при 401 / UNAUTHENTICATED / UNAUTHORIZED — один refresh (single-flight),
 * один retry запроса. При неудаче refresh или при MALFORMED_TOKEN/INVALID_TOKEN — logout.
 */

import { onError } from "@apollo/client/link/error";
import { print } from "graphql";
import { authService } from "./authService";
import { server } from "../../graphQL_requests";
import { REFRESH_TOKEN } from "../../graphQL_requests";

const AUTH_CODES_NO_RETRY = ["MALFORMED_TOKEN", "INVALID_TOKEN", "MISSING_TOKEN"];
const AUTH_CODES_REFRESH = [
  "TOKEN_EXPIRED",
  "SESSION_MISMATCH",
  "MISSING_SESSION_TOKEN",
  "SUBJECT_NOT_FOUND",
  "EXTERNAL_SESSION_EXPIRED",
  "UNAUTHENTICATED",
  "UNAUTHORIZED",
];

function isAuthError(graphQLErrors, networkError) {
  if (networkError?.statusCode === 401) return true;
  if (!Array.isArray(graphQLErrors)) return false;
  return graphQLErrors.some(
    (e) =>
      e.extensions?.code === "UNAUTHENTICATED" ||
      e.extensions?.code === "UNAUTHORIZED"
  );
}

function shouldLogoutImmediately(graphQLErrors) {
  if (!Array.isArray(graphQLErrors)) return false;
  const code =
    graphQLErrors[0]?.extensions?.authCode ||
    graphQLErrors[0]?.extensions?.code;
  return AUTH_CODES_NO_RETRY.includes(code);
}

function isRefreshOrLogin(operation) {
  const name = (operation?.operationName || "").toLowerCase();
  return (
    name.includes("refresh") ||
    name.includes("signin") ||
    name.includes("transfersignin")
  );
}

let refreshPromise = null;

async function doRefresh() {
  const refreshToken = authService.getRefreshToken();
  const fingerprint = authService.getFingerprint() || "";
  if (!refreshToken) {
    throw new Error("No refresh token");
  }
  const res = await fetch(`${server}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: print(REFRESH_TOKEN),
      variables: { refreshToken, fingerprint },
    }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    const msg = json.errors[0]?.message || "Refresh failed";
    throw new Error(msg);
  }
  const data = json.data?.refreshToken;
  if (!data?.token || !data?.refreshToken) {
    throw new Error("Invalid refresh response");
  }
  authService.setTokens({
    token: data.token,
    refreshToken: data.refreshToken,
  });
  return data;
}

function singleFlightRefresh() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * @param {{ onLogout?: () => void }} options - onLogout вызывается после clear() для редиректа
 */
export function createAuthErrorLink(options = {}) {
  const { onLogout } = options;

  return onError(({ graphQLErrors, networkError, operation, forward }) => {
    if (!isAuthError(graphQLErrors, networkError)) {
      return forward(operation);
    }

    if (shouldLogoutImmediately(graphQLErrors)) {
      authService.clear();
      onLogout?.();
      return forward(operation);
    }

    if (isRefreshOrLogin(operation)) {
      authService.clear();
      onLogout?.();
      return forward(operation);
    }

    return singleFlightRefresh()
      .then(() => forward(operation))
      .catch(() => {
        authService.clear();
        onLogout?.();
        return forward(operation);
      });
  });
}
