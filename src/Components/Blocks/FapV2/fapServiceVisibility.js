import { isHotelScoped } from "../../../utils/access.js";

// Единственное правило «какие услуги заявки видит гостиница».
//
// Гостиница, которая сама трансфер не возит (в её карточке не выставлено ни
// одной цены — см. hotelProvidesTransfer), к этим услугам заявки отношения
// не имеет: там чужие водители, чужие рейсы и чужие деньги. Правило одно на
// шесть мест — все они ходят сюда через хук useHotelServiceVisibility:
//   1. плитки услуг в деталке заявки (FapDetail);
//   2. книга отчёта по кнопке «Скачать отчёт» в шапке заявки (FapDetail);
//   3. та же книга из меню «⋯» внутренних страниц (FapHeaderActions);
//   4. прямой адрес /far/:id/service/:key (FapServicePage);
//   5. /far/:id/service/:key/driver/:i (FapDriverDetailPage);
//   6. /far/:id/service/baggage/trip/:i (FapBaggageTripDetailPage).
// Правка списка ключей ниже задевает разом все шесть.
//
// Багаж (baggage) в списке по той же причине, хоть доставка багажа — не
// трансфер: своего признака «возит ли гостиница багаж» в данных нет и
// заводить его не будем (решение владельца 25.08.2026) — используем тот же
// критерий hotelProvidesTransfer. Гостиница-перевозчик видит обе услуги
// разом, гостиница без трансфера — не видит ни одной.
//
// Гейт по isHotelScoped, а не по роли: под правило попадает и вход по
// магик-ссылке (scope HOTEL) — у него ровно та же гостиница и та же причина.
// Всех остальных (диспетчер, авиакомпания, водитель по ссылке) правило не
// касается: для них предикат всегда возвращает «видно».

export const HOTEL_RESTRICTED_SERVICE_KEYS = ["transfer", "transferDeparture", "baggage"];

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
  if (!HOTEL_RESTRICTED_SERVICE_KEYS.includes(serviceKey)) return false;
  if (!isHotelScoped(user)) return false;
  return !providesTransfer;
}

/** Те же ключи в том же порядке, без скрытых. */
export function visibleServiceKeys(serviceKeys, user, providesTransfer) {
  return (serviceKeys ?? []).filter(
    (key) => !isServiceHiddenForUser(key, user, providesTransfer)
  );
}
