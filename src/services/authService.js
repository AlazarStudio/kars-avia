/**
 * Единый слой работы с auth (playbook: authStore).
 * Хранит accessToken, refreshToken в cookie; fingerprint в sessionStorage.
 * Логика logout: clear + уведомление подписчиков (редирект на логин).
 */

const COOKIE_TOKEN = "token";
const COOKIE_REFRESH = "refreshToken";
const STORAGE_FINGERPRINT = "auth_fingerprint";
const COOKIE_OPTS = "SameSite=Lax; Path=/";
const TOKEN_MAX_AGE = 86400; // 24h
const REFRESH_MAX_AGE = 30 * 24 * 3600;

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length < 2) return undefined;
  const v = parts.pop().split(";").shift();
  return v === undefined ? undefined : (v || undefined);
}

function setCookie(name, value, maxAge) {
  const part = `${name}=${value}; ${COOKIE_OPTS}; Max-Age=${maxAge}`;
  document.cookie = part;
}

function clearCookie(name) {
  document.cookie = `${name}=; Max-Age=0; Path=/`;
}

const logoutListeners = new Set();

export const authService = {
  getAccessToken() {
    return getCookie(COOKIE_TOKEN);
  },

  getRefreshToken() {
    return getCookie(COOKIE_REFRESH);
  },

  getFingerprint() {
    try {
      return sessionStorage.getItem(STORAGE_FINGERPRINT) || undefined;
    } catch {
      return undefined;
    }
  },

  setFingerprint(fingerprint) {
    try {
      if (fingerprint) sessionStorage.setItem(STORAGE_FINGERPRINT, fingerprint);
      else sessionStorage.removeItem(STORAGE_FINGERPRINT);
    } catch (_) {}
  },

  /**
   * @param {{ token: string; refreshToken: string; subjectType?: string }} payload
   */
  setTokens(payload) {
    if (payload.token) setCookie(COOKIE_TOKEN, payload.token, TOKEN_MAX_AGE);
    if (payload.refreshToken)
      setCookie(COOKIE_REFRESH, payload.refreshToken, REFRESH_MAX_AGE);
  },

  clear() {
    clearCookie(COOKIE_TOKEN);
    clearCookie(COOKIE_REFRESH);
    try {
      sessionStorage.removeItem(STORAGE_FINGERPRINT);
    } catch (_) {}
    logoutListeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error("[authService] logout listener error", e);
      }
    });
  },

  addLogoutListener(callback) {
    logoutListeners.add(callback);
    return () => logoutListeners.delete(callback);
  },

  hasAuth() {
    return Boolean(getCookie(COOKIE_TOKEN) && getCookie(COOKIE_REFRESH));
  },
};
