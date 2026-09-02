import { isAirlineRole, isHotelScoped, scopedHotelId } from "../../../utils/access.js";

// Единственное правило «кому какой отчёт по гостинице виден».
//
// Отчёт скрыт от авиакомпании, пока диспетчер не отправил его на проверку.
// Гейт по РОЛИ, а не по canEdit: canEdit считается по-разному на разных экранах,
// а деталка заявки, багаж и вода/питание его для отчёта вовсе не считают —
// протаскивать его туда значит размазать правило по пяти местам.
//
// Внешние пользователи (scope HOTEL) под правило не попадают: гостиница отчёт
// заполняет, а выгрузки внешним и так закрыты в FapHeaderActions.

// hotelIndex может прийти строкой из useParams — сравниваем числами.
function findHotelReport(request, hotelIndex) {
  return (
    (request?.hotelReports ?? []).find(
      (r) => Number(r?.hotelIndex) === Number(hotelIndex)
    ) ?? null
  );
}

// Дата отправки отчёта по гостинице или null.
export function hotelReportSubmittedAt(request, hotelIndex) {
  return findHotelReport(request, hotelIndex)?.submittedAt ?? null;
}

export function isHotelReportSubmitted(request, hotelIndex) {
  return hotelReportSubmittedAt(request, hotelIndex) != null;
}

// Дата согласования ценообразования или null. Флаг независим от отправки:
// отправленный отчёт авиакомпания видит составом, а суммы бэк отдаёт ей
// только после согласования — до него стоимости приходят как null.
export function hotelReportPricingApprovedAt(request, hotelIndex) {
  return findHotelReport(request, hotelIndex)?.pricingApprovedAt ?? null;
}

export function isHotelReportPricingApproved(request, hotelIndex) {
  return hotelReportPricingApprovedAt(request, hotelIndex) != null;
}

// Индексы гостиниц, отчёты которых этот пользователь имеет право видеть.
// Диспетчер — все; авиакомпания — только отправленные; гостиница — только свою.
//
// Через эту функцию проходят ВСЕ выгрузки: кнопка в шапке заявки (FapDetail),
// меню внутренних страниц (FapHeaderActions), отчёт по проживанию
// (FapLivingPage) и книга аналитики пассажиров — поэтому гостиничное правило
// достаточно завести здесь, отдельного гейта в каждой выгрузке не нужно.
export function visibleHotelIndexes(request, user) {
  const hotels = request?.livingService?.hotels ?? [];
  const all = hotels.map((_, i) => i);
  if (isHotelScoped(user)) {
    const ownId = scopedHotelId(user);
    // Без привязки не видно ничего. Сравнение строками иначе склеило бы
    // `undefined` пользователя с `undefined` гостиницы и показало бы аккаунту
    // без привязки как раз те гостиницы, у которых hotelId не проставлен.
    if (ownId == null) return [];
    return all.filter((i) => String(hotels[i]?.hotelId) === String(ownId));
  }
  if (!isAirlineRole(user)) return all;
  return all.filter((i) => isHotelReportSubmitted(request, i));
}

// Прятать ли деньги отчётов от этого пользователя из-за несогласованных цен.
// Бэк отдаёт авиакомпании несогласованный отчёт со стоимостями null, поэтому
// восстановленные из таких строк суммы были бы нулями — печатаем книгу без
// денег вовсе.
//
// Достаточно одного несогласованного видимого отчёта: книга одна на заявку,
// пер-гостиничного гейта денег у построителя нет. Единая точка для всех
// выгрузок — как visibleHotelIndexes.
export function airlineMoneyHidden(request, user) {
  if (!isAirlineRole(user)) return false;
  return visibleHotelIndexes(request, user).some(
    (i) => !isHotelReportPricingApproved(request, i)
  );
}
