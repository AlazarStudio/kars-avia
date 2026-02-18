import { roles } from "../roles.js";

export const safeAccessMenu = (accessMenu) => accessMenu || {};

export const isSuperAdmin = (user) => user?.role === roles.superAdmin;

export const isDispatcherAdmin = (user) => user?.role === roles.dispatcerAdmin;

export const isDispatcherModerator = (user) =>
  user?.role === roles.dispatcherModerator;

export const isDispatcherRole = (user) =>
  isDispatcherAdmin(user) || isDispatcherModerator(user);

export const isAirlineAdmin = (user) => user?.role === roles.airlineAdmin;

export const isAirlineModerator = (user) =>
  user?.role === roles.airlineModerator;

export const isAirlineRole = (user) =>
  isAirlineAdmin(user) || isAirlineModerator(user);

export const hasAccessMenu = (accessMenu, key) => {
  if (!key) return true;
  const safeMenu = safeAccessMenu(accessMenu);
  return !!safeMenu[key];
};

export const canAccessMenu = (accessMenu, key, user) =>
  isSuperAdmin(user) || hasAccessMenu(accessMenu, key);

export const getDispatcherAccess = (accessMenu, key, user) => {
  if (!isDispatcherRole(user)) return undefined;
  return hasAccessMenu(accessMenu, key);
};

export const canCreateRequest = (user, accessMenu) => {
  if (isSuperAdmin(user)) return true;
  if (isDispatcherRole(user)) return hasAccessMenu(accessMenu, "requestCreate");
  if (user?.airlineId) return hasAccessMenu(accessMenu, "requestCreate");
  return true;
};
