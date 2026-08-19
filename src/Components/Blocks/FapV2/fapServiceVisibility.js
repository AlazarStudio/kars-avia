import { isHotelScoped } from "../../../utils/access.js";

// Единственное правило «какие услуги заявки видит гостиница».
//
// Гостиница, которая сама трансфер не возит (в её карточке не выставлено ни
// одной цены — см. hotelProvidesTransfer), к трансферу заявки отношения не
// имеет: там чужие водители, чужие рейсы и чужие деньги. Пряталось это только
// глазами, поэтому правило одно на два места — плитки услуг в деталке заявки
// (FapDetail) и прямой адрес /far/:id/service/transfer (FapServicePage).
//
// Гейт по isHotelScoped, а не по роли: под правило попадает и вход по
// магик-ссылке (scope HOTEL) — у него ровно та же гостиница и та же причина.
// Всех остальных (диспетчер, авиакомпания, водитель по ссылке) правило не
// касается: для них предикат всегда возвращает «видно».

export const TRANSFER_SERVICE_KEYS = ["transfer", "transferDeparture"];

/**
 * Скрыта ли услуга от этого пользователя.
 *
 * `providesTransfer` — возит ли трансфер ЕГО СОБСТВЕННАЯ гостиница. Значение
 * приходит снаружи: цена лежит в карточке гостиницы, а не в заявке.
 *
 * ⚠️ Пока цена не загружена, вызывающий передаёт `false` — услуга прячется.
 * Обратный порядок (сначала показать, потом убрать) давал бы вспышку плитки
 * трансфера у гостиницы, которой он не положен.
 */
export function isServiceHiddenForUser(serviceKey, user, providesTransfer) {
  if (!TRANSFER_SERVICE_KEYS.includes(serviceKey)) return false;
  if (!isHotelScoped(user)) return false;
  return !providesTransfer;
}

/** Те же ключи в том же порядке, без скрытых. */
export function visibleServiceKeys(serviceKeys, user, providesTransfer) {
  return (serviceKeys ?? []).filter(
    (key) => !isServiceHiddenForUser(key, user, providesTransfer)
  );
}
