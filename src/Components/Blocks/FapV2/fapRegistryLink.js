// Параметр адреса /far/registries, которым открывается реестр. Имя задаёт бэк
// (services/email/frontendEntityLinks.js buildRegistryUrl) — переименовывать парой.
export const REGISTRY_PARAM = "registryid";

export function readRegistryLink(searchParams) {
  return searchParams.get(REGISTRY_PARAM) || null;
}

// Новая строка запроса с открытым реестром (или без него при id = null);
// чужие параметры не трогаются, исходный объект не мутируется.
export function withRegistryLink(searchParams, id) {
  const params = new URLSearchParams(searchParams);
  params.delete(REGISTRY_PARAM);
  if (id) params.set(REGISTRY_PARAM, id);
  return params;
}
