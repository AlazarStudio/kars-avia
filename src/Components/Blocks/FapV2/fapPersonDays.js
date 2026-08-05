import { calculateCostDaysByDuration } from "../../../utils/effectiveCostDays.js";

// Сутки проживания одного гостя в конкретной гостинице заявки.
//
// Единственная реализация на оба экрана отчёта — диспетчерский FapHotelPage и
// представительский RepresentativeHotelReportPage. Раньше это были две копии, и
// они разъехались: первая считала по ДЛИТЕЛЬНОСТИ, вторая осталась на прежних
// «эффективных сутках» с надбавками за время заезда и выезда. На одном и том же
// госте (заезд 12:21, выезд на следующий день 12:12) получалось 1 против 2, а
// сохраняют отчёт оба экрана одной и той же мутацией — чьё число уцелеет,
// решал порядок сохранения. Правило по длительности — принятое, второе ушло.
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
