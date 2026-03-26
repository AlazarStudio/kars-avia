import { roles } from "../../../roles";

export const DEFAULT_DOCUMENTATION_FILTER = "dispatcher";

export const DOCUMENTATION_FILTER_OPTIONS = [
  { label: "Диспетчер", value: "dispatcher", apiType: "DISPATCHER" },
  { label: "Авиакомпания", value: "airline", apiType: "AIRLINE" },
  { label: "Гостиница", value: "hotel", apiType: "HOTEL" },
  {
    label: "Представительство",
    value: "representation",
    apiType: "REPRESENTATION",
  },
];

const FILTER_OPTION_MAP = new Map(
  DOCUMENTATION_FILTER_OPTIONS.map(option => [option.value, option])
);

function normalizeRoleValue(rawValue) {
  return String(rawValue || "").trim().toUpperCase();
}

export function normalizeDocumentationFilter(rawValue) {
  if (rawValue == null) return null;

  const value = String(rawValue).trim().toLowerCase();
  if (!value) return null;

  if (
    value === "dispatcher" ||
    value === "dispatch" ||
    value === "dispetcher" ||
    value.includes("dispatch")
  ) {
    return "dispatcher";
  }

  if (value === "hotel" || value === "hotels" || value.includes("hotel")) {
    return "hotel";
  }

  if (
    value === "airline" ||
    value === "aviacompany" ||
    value === "aircompany" ||
    value.includes("airline") ||
    value.includes("avia")
  ) {
    return "airline";
  }

  if (
    value === "representation" ||
    value === "representative" ||
    value.includes("represent")
  ) {
    return "representation";
  }

  return null;
}

export function getDocumentationFilterOption(rawValue) {
  const normalizedValue = normalizeDocumentationFilter(rawValue);
  if (!normalizedValue) return null;
  return FILTER_OPTION_MAP.get(normalizedValue) || null;
}

export function mapDocumentationFilterToApiType(rawValue) {
  return getDocumentationFilterOption(rawValue)?.apiType || null;
}

export function hasDocumentationFilterSwitcherAccess(user) {
  return user?.role === roles.superAdmin;
}

export function isDocumentationManageRole(user) {
  const normalizedRole = normalizeRoleValue(user?.role);
  return (
    normalizedRole === normalizeRoleValue(roles.superAdmin) ||
    normalizedRole === "SUPER_ADMIN"
  );
}

export function resolveDocumentationFilterForUser(user) {
  if (!user) return DEFAULT_DOCUMENTATION_FILTER;

  const normalizedRole = normalizeRoleValue(user.role);
  if (
    normalizedRole.includes("REPRESENT") ||
    user?.representationId ||
    user?.representativeId ||
    user?.representativeOfficeId
  ) {
    return "representation";
  }

  if (
    normalizedRole === normalizeRoleValue(roles.hotelAdmin) ||
    normalizedRole === normalizeRoleValue(roles.hotelModerator)
  ) {
    return "hotel";
  }

  if (
    normalizedRole === normalizeRoleValue(roles.airlineAdmin) ||
    normalizedRole === normalizeRoleValue(roles.airlineModerator)
  ) {
    return "airline";
  }

  if (
    normalizedRole === normalizeRoleValue(roles.dispatcerAdmin) ||
    normalizedRole === normalizeRoleValue(roles.dispatcherModerator)
  ) {
    return "dispatcher";
  }

  if (user?.hotelId && !user?.airlineId) {
    return "hotel";
  }

  if (user?.airlineId) {
    return "airline";
  }

  return DEFAULT_DOCUMENTATION_FILTER;
}
