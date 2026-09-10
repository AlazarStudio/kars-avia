import {
  hotelReportSubmittedAt,
  hotelReportPricingApprovedAt,
  hotelReportAirlineApprovedAt,
  hotelReportAirlineComment,
  isHotelReportAirlineRevoked,
  visibleHotelIndexes,
} from "./fapReportAccess.js";

// Стадии отчёта по гостинице для списка заявок ФАП.
//
// Шаги идут строго по порядку: диспетчер отправил отчёт → согласовал цены →
// авиакомпания утвердила. На бэке согласование от отправки независимо (см.
// fapReportAccess.js), но неотправленный отчёт авиакомпания не видит — он
// остаётся на нулевой стадии, как и в шапке страницы гостиницы, где цепочка
// до отправки не рисуется.

// Подписи шагов — те же, что в цепочке шапки FapHotelPage. У шага
// авиакомпании есть третья подпись: она отозвала утверждение, и отчёт ждёт
// уже не её, а исправлений диспетчера и гостиницы.
export const REPORT_STEPS = [
  { done: "Отправлен", wait: "Не отправлен" },
  { done: "Цены согласованы", wait: "Цены не согласованы" },
  { done: "Утверждён АК", wait: "Ждёт утверждения АК", revoked: "Утверждение отозвано" },
];

export const REPORT_STAGE_DONE = REPORT_STEPS.length;

// Стадия, подпись которой меняет отзыв: цены согласованы, подписи АК нет.
export const REPORT_STAGE_AIRLINE = REPORT_STAGE_DONE - 1;

// Имена стадий в схеме бэка (enum PassengerReportStage) по тому же порядку
// шагов: индекс имени и есть стадия. Через них ходит фильтр списка, поэтому он
// и чип обязаны говорить об одном и том же.
export const REPORT_STAGE_NAMES = [
  "NOT_SUBMITTED",
  "SUBMITTED",
  "PRICING_APPROVED",
  "AIRLINE_APPROVED",
];

// Даты шагов по порядку REPORT_STEPS; непройденный шаг — null.
function reportDates(request, hotelIndex) {
  return [
    hotelReportSubmittedAt(request, hotelIndex),
    hotelReportPricingApprovedAt(request, hotelIndex),
    hotelReportAirlineApprovedAt(request, hotelIndex),
  ];
}

// Число пройденных шагов подряд с первого: 0 — не отправлен, 3 — утверждён АК.
export function hotelReportStage(request, hotelIndex) {
  const firstPending = reportDates(request, hotelIndex).findIndex((d) => d == null);
  return firstPending === -1 ? REPORT_STAGE_DONE : firstPending;
}

// Текст стадии: первый непройденный шаг, у пройденного отчёта — последний
// шаг; на шаге авиакомпании после её отзыва — «Утверждение отозвано».
export function reportStageLabel(stage, revoked = false) {
  if (stage >= REPORT_STAGE_DONE) return REPORT_STEPS[REPORT_STAGE_DONE - 1].done;
  if (revoked && stage === REPORT_STAGE_AIRLINE) return REPORT_STEPS[stage].revoked;
  return REPORT_STEPS[stage].wait;
}

// Подпись стадии в фильтре списка. Отзыв утверждения АК отдельной стадией бэк
// не считает — это та же PRICING_APPROVED (цены согласованы, подписи нет),
// поэтому пункт шага авиакомпании прямо говорит, что в нём и отозванные.
export function reportStageFilterLabel(stage) {
  return stage === REPORT_STAGE_AIRLINE
    ? `${REPORT_STEPS[stage].wait} / отозвано`
    : reportStageLabel(stage);
}

// Сводка для карточки списка по гостиницам, которые пользователь вправе видеть
// (visibleHotelIndexes — то же правило, что у выгрузок отчёта). null — чипа нет.
// stage — самая отстающая гостиница, laggingCount — сколько гостиниц на ней.
export function requestReportSummary(request, user) {
  const indexes = visibleHotelIndexes(request, user);
  if (indexes.length === 0) return null;

  const hotels = indexes.map((index) => ({
    index,
    name: request.livingService.hotels[index]?.name || "Гостиница",
    stage: hotelReportStage(request, index),
    dates: reportDates(request, index),
    revoked: isHotelReportAirlineRevoked(request, index),
    comment: hotelReportAirlineComment(request, index)?.text ?? null,
  }));
  const stage = Math.min(...hotels.map((h) => h.stage));

  return {
    stage,
    laggingCount: hotels.filter((h) => h.stage === stage).length,
    total: hotels.length,
    // «Отозвано» — только если отзыв есть у гостиницы на самой отстающей
    // стадии: отзыв у обогнавшей гостиницы подпись чипа не меняет.
    revoked:
      stage === REPORT_STAGE_AIRLINE &&
      hotels.some((h) => h.stage === stage && h.revoked),
    hotels,
  };
}
