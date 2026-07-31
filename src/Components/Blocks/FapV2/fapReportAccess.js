import { isAirlineRole } from "../../../utils/access.js";

// Единственное правило «кому какой отчёт по гостинице виден».
//
// Отчёт скрыт от авиакомпании, пока диспетчер не отправил его на проверку.
// Гейт по РОЛИ, а не по canEdit: canEdit считается по-разному на разных экранах,
// а деталка заявки, багаж и вода/питание его для отчёта вовсе не считают —
// протаскивать его туда значит размазать правило по пяти местам.
//
// Внешние пользователи (scope HOTEL) под правило не попадают: гостиница отчёт
// заполняет, а выгрузки внешним и так закрыты в FapHeaderActions.

// Дата отправки отчёта по гостинице или null. hotelIndex может прийти строкой из useParams.
export function hotelReportSubmittedAt(request, hotelIndex) {
  const report = (request?.hotelReports ?? []).find(
    (r) => Number(r?.hotelIndex) === Number(hotelIndex)
  );
  return report?.submittedAt ?? null;
}

export function isHotelReportSubmitted(request, hotelIndex) {
  return hotelReportSubmittedAt(request, hotelIndex) != null;
}

// Индексы гостиниц, отчёты которых этот пользователь имеет право видеть.
// Диспетчер и гостиница — все; авиакомпания — только отправленные.
export function visibleHotelIndexes(request, user) {
  const all = (request?.livingService?.hotels ?? []).map((_, i) => i);
  if (!isAirlineRole(user)) return all;
  return all.filter((i) => isHotelReportSubmitted(request, i));
}
