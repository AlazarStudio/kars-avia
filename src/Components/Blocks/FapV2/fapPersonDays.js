import { calculateCostDaysByDuration } from "../../../utils/effectiveCostDays.js";

// Сутки проживания одного гостя в конкретной гостинице заявки.
//
// Единственная реализация правила. Раньше копий было две — в диспетчерском
// FapHotelPage и в устаревшем представительском экране отчёта, — и они
// разъехались: первая считала по ДЛИТЕЛЬНОСТИ, вторая осталась на прежних
// «эффективных сутках» с надбавками за время заезда и выезда. На одном и том же
// госте (заезд 12:21, выезд на следующий день 12:12) выходило 1 против 2, а
// сохраняли отчёт оба экрана одной и той же мутацией. Правило по длительности —
// принятое; второй экран впоследствии удалён целиком.
//
// ⚠️ Прежнее правило `calculateEffectiveCostDays` живо и НЕ является легаси:
// по нему считает Эскадрилья (ExistRequest). Правило по длительности — только
// для ФАП.
//
// Приоритет источника дат:
//   1) закрытый интервал accommodationChesses этой гостиницы;
//   2) плановый период проживания услуги.
// ⚠️ У гостя, который сейчас в гостинице, интервал ОТКРЫТ (endAt === null), и
// ветка (1) не срабатывает — сутки берутся из плана. Закрытым интервал делают
// только переселение и выселение, а они убирают гостя из hotel.people. Поэтому
// (1) — это фактически ветка «переселили туда и обратно», а не основной путь.
export function getPersonDays(person, hotelIndex, plan) {
  const chesses = person?.accommodationChesses ?? [];
  const chess =
    chesses.find((c) => c != null && Number(c.hotelIndex) === Number(hotelIndex)) ||
    chesses[0];

  if (chess?.startAt && chess?.endAt) {
    return calculateCostDaysByDuration(chess.startAt, chess.endAt);
  }

  const planStart = plan?.plannedFromAt || plan?.plannedAt;
  const planEnd = plan?.plannedToAt;
  if (planStart && planEnd) {
    return calculateCostDaysByDuration(planStart, planEnd);
  }

  return 0;
}

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Даты заезда и выезда гостя (Date или null) — то, что печатает книга и
// показывает редактор отчёта. Приоритет:
//   1) правка в строке отчёта (row.arrival/departure) — снимок отчёта, гостя
//      услуги она не меняет (так поле описано и на бэке);
//   2) person.arrival/departure — явное переопределение у гостя;
//   3) плановый период проживания услуги;
//   4) accommodationChesses этой гостиницы — ИСТОРИЯ операций (когда заселили и
//      выселили), а не плановые даты, поэтому только последний шанс.
// Границы выбираются независимо: можно поправить один выезд.
export function getPersonStay(person, hotelIndex, plan, row = null) {
  let inAt = toDate(row?.arrival) || toDate(person?.arrival);
  let outAt = toDate(row?.departure) || toDate(person?.departure);

  // plannedFromAt первичен (начало периода проживания) — симметрично getPersonDays.
  if (!inAt) inAt = toDate(plan?.plannedFromAt || plan?.plannedAt);
  if (!outAt) outAt = toDate(plan?.plannedToAt);

  if (!inAt || !outAt) {
    const chesses = person?.accommodationChesses ?? [];
    const chess =
      chesses.find((c) => c != null && Number(c.hotelIndex) === Number(hotelIndex)) ||
      chesses[0];
    if (!inAt) inAt = toDate(chess?.startAt);
    if (!outAt) outAt = toDate(chess?.endAt);
  }

  return { inAt, outAt };
}
