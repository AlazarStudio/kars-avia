const LOGIN_PATH = "/login";

// Куда нельзя возвращать после входа: страницы входа/сброса пароля и публичные
// роуты, которые работают без сессии (в /external-login после обычного входа
// нельзя — он сотрёт токены и попробует внешний токен заново).
const NO_RETURN_PATHS = new Set([
  "/login",
  "/reset-to-email",
  "/reset-password",
  "/verify-email",
  "/external-login",
  "/hotel-preview",
]);

function normalizePath(pathname) {
  return (pathname || "").toLowerCase().replace(/\/+$/, "") || "/";
}

function isReturnable(pathname) {
  const p = normalizePath(pathname);
  return p !== "/" && !NO_RETURN_PATHS.has(p);
}

/**
 * Куда вести неавторизованного: `/login` или `/login?next=<pathname+search>`.
 * Принимает `location` роутера или `window.location` — читает только pathname/search.
 */
export function buildLoginPath({ pathname, search } = {}) {
  if (!isReturnable(pathname)) return LOGIN_PATH;
  return `${LOGIN_PATH}?next=${encodeURIComponent(`${pathname}${search || ""}`)}`;
}

/** Куда идти после входа: безопасный `next` из строки запроса или `/`. */
export function resolveLoginTarget(search) {
  const next = new URLSearchParams(search || "").get("next");
  if (!next) return "/";
  // Только относительный путь того же origin: не "//host", не "/\host" (браузер
  // нормализует обратный слэш в прямой), не абсолютный URL.
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  if (!isReturnable(next.split(/[?#]/)[0])) return "/";
  return next;
}
