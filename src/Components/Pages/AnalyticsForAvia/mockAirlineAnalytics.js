// src/.../mockAirlineAnalytics.js
import { eachDayOfInterval, startOfDay, endOfDay, formatISO } from "date-fns";

// простая детерминированная ГПСЧ по seed
function seededRng(seedNum = 1) {
  let s = seedNum % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * Генерит структуру как у бэка:
 * {
 *   analyticsEntityRequests: {
 *     createdByPeriod: [{ date: 'YYYY-MM-DD', count_created, count_canceled }, ...],
 *     statusCounts: { created, extended, done, earlyStart, transferred, reduced, archiving, archived },
 *     totalCreatedRequests,
 *     totalCancelledRequests
 *   }
 * }
 */
export function getDispatcherAnalyticsMock({
  personId = 1,
  startDate,
  endDate,
}) {
  const start = startOfDay(new Date(startDate));
  const end = endOfDay(new Date(endDate));

  // seed берём из personId, чтобы у разных диспетчеров были разные ряды
  const numericSeed =
    Number(String(personId).replace(/\D/g, "").slice(-9)) || 1;
  const rand = seededRng(numericSeed);

  const days = eachDayOfInterval({ start, end });

  const createdByPeriod = days.map((d) => {
    const base = Math.floor(rand() * 25) + 5; // 5..29
    const weekendBoost = [0, 6].includes(d.getDay())
      ? Math.floor(rand() * 10)
      : 0;
    const count_created = base + weekendBoost;
    const count_canceled = Math.floor(count_created * (rand() * 0.35)); // до 35%
    return {
      __typename: "PeriodCount",
      date: formatISO(d, { representation: "date" }),
      count_created,
      count_canceled,
    };
  });

  const sum = (key) => createdByPeriod.reduce((a, i) => a + i[key], 0);

  const totalCreatedRequests = sum("count_created");
  const totalCancelledRequests = sum("count_canceled");

  // распределим созданные по статусам
  const buckets = [
    "created",
    "extended",
    "done",
    "earlyStart",
    "transferred",
    "reduced",
    "archiving",
    "archived",
  ];
  let remaining = totalCreatedRequests;
  const statusCounts = {};
  buckets.forEach((b, idx) => {
    if (idx === buckets.length - 1) {
      statusCounts[b] = remaining;
    } else {
      const piece = Math.floor(remaining * (0.05 + rand() * 0.2)); // 5–25% остатка
      statusCounts[b] = piece;
      remaining -= piece;
    }
  });

  return {
    analyticsEntityRequests: {
      __typename: "Analytics",
      createdByPeriod,
      statusCounts,
      totalCreatedRequests,
      totalCancelledRequests,
    },
  };
}


// src/mocks/dispatcherAnalytics.mock.js

// export const DISPATCHER_ANALYTICS_MOCK = {
//   analyticsEntityRequests: {
//     __typename: "Analytics",

//     // то, что ты мапишь в createdRequests
//     createdByPeriod: [
//       { __typename: "PeriodCount", date: "2025-08-01", count_created: 4,  count_canceled: 2 },
//       { __typename: "PeriodCount", date: "2025-08-04", count_created: 29, count_canceled: 1 },
//       { __typename: "PeriodCount", date: "2025-08-05", count_created: 22, count_canceled: 1 },
//       { __typename: "PeriodCount", date: "2025-08-08", count_created: 14, count_canceled: 2 },
//       { __typename: "PeriodCount", date: "2025-08-10", count_created: 6,  count_canceled: 0 },
//       // подправил до 17, чтобы сошлось с totalCreatedRequests = 92
//       { __typename: "PeriodCount", date: "2025-08-11", count_created: 17, count_canceled: 0 },
//     ],

//     // суммарные показатели
//     statusCounts: {
//       archiving: 40,
//       canceled: 6,
//       done: 33,
//       extended: 2,
//       opened: 7,
//       transferred: 1,
//     },
//     totalCancelledRequests: 6,
//     totalCreatedRequests: 92,
//   },
// };


// export const airlineAnalyticsMock = {
//   "1": {
//     name: "Азимут",
//     createdRequests: [
//       { date: "2025-08-01T00:00:00Z", count: 11 },
//       { date: "2025-08-02T00:00:00Z", count: 0 },
//       { date: "2025-08-03T00:00:00Z", count: 6 },
//       { date: "2025-08-04T00:00:00Z", count: 8 },
//       { date: "2025-08-05T00:00:00Z", count: 9 },
//       { date: "2025-08-06T00:00:00Z", count: 6 },
//       { date: "2025-08-07T00:00:00Z", count: 7 },
//       { date: "2025-08-08T00:00:00Z", count: 8 },
//       { date: "2025-08-09T00:00:00Z", count: 9 },
//       { date: "2025-08-10T00:00:00Z", count: 10 },
//       { date: "2025-08-11T00:00:00Z", count: 11 },
//       { date: "2025-08-12T00:00:00Z", count: 5 },
//       { date: "2025-08-13T00:00:00Z", count: 6 },
//       { date: "2025-08-14T00:00:00Z", count: 8 },
//       { date: "2025-08-15T00:00:00Z", count: 9 },
//       { date: "2025-08-16T00:00:00Z", count: 6 },
//       { date: "2025-08-17T00:00:00Z", count: 7 },
//       { date: "2025-08-18T00:00:00Z", count: 8 },
//       { date: "2025-08-19T00:00:00Z", count: 9 },
//       { date: "2025-08-20T00:00:00Z", count: 10 },
//       { date: "2025-08-21T00:00:00Z", count: 11 }
//     ],
//     duplicatedRequests: [
//       { date: "2025-08-12T00:00:00Z", count: 1 },
//       { date: "2025-08-13T00:00:00Z", count: 1 },
//       { date: "2025-08-14T00:00:00Z", count: 2 },
//       { date: "2025-08-15T00:00:00Z", count: 3 },
//       { date: "2025-08-16T00:00:00Z", count: 2 },
//       { date: "2025-08-17T00:00:00Z", count: 1 },
//       { date: "2025-08-18T00:00:00Z", count: 1 },
//       { date: "2025-08-19T00:00:00Z", count: 3 },
//       { date: "2025-08-20T00:00:00Z", count: 2 },
//       { date: "2025-08-21T00:00:00Z", count: 1 }
//     ],
//     averageProcessingTime: [
//       { date: "2025-08-01T00:00:00.000Z", hours: 3.1 },
//       { date: "2025-08-02T00:00:00.000Z", hours: 2.8 },
//       { date: "2025-08-03T00:00:00.000Z", hours: 5.6 },
//       { date: "2025-08-04T00:00:00.000Z", hours: 3.3 },
//       { date: "2025-08-05T00:00:00.000Z", hours: 6.1 },
//       { date: "2025-08-06T00:00:00.000Z", hours: 4.7 },
//       { date: "2025-08-07T00:00:00.000Z", hours: 7.1 },
//       { date: "2025-08-08T00:00:00.000Z", hours: 3.1 },
//       { date: "2025-08-09T00:00:00.000Z", hours: 2.8 },
//       { date: "2025-08-10T00:00:00.000Z", hours: 5.6 },
//       { date: "2025-08-11T00:00:00.000Z", hours: 3.3 },
//       { date: "2025-08-12T00:00:00.000Z", hours: 6.1 },
//       { date: "2025-08-13T00:00:00.000Z", hours: 4.7 },
//       { date: "2025-08-14T00:00:00.000Z", hours: 7.1 },
//       { date: "2025-08-15T00:00:00.000Z", hours: 3.1 },
//       { date: "2025-08-16T00:00:00.000Z", hours: 2.8 },
//       { date: "2025-08-17T00:00:00.000Z", hours: 5.6 },
//       { date: "2025-08-18T00:00:00.000Z", hours: 3.3 },
//       { date: "2025-08-19T00:00:00.000Z", hours: 6.1 },
//       { date: "2025-08-20T00:00:00.000Z", hours: 4.7 },
//       { date: "2025-08-21T00:00:00.000Z", hours: 7.1 },
//     ],
//     cancelledRatio: {
//       created: 20, 
//       extended: 14, 
//       booked: 25, 
//       early_checkin: 19,
//       rescheduled: 17, 
//       shortened: 17, 
//       ready_to_archive: 30, 
//       archived: 50
//     }
//   }
// }

/**
 * Пример ответа `airlineAnalytics` (nested: period → services → details).
 * Для ручных тестов / MSW: data.airlineAnalytics = NESTED_AIRLINE_ANALYTICS_MOCK
 */
export const NESTED_AIRLINE_ANALYTICS_MOCK = {
  period1: {
    dateFrom: "2025-01-01",
    dateTo: "2025-01-31",
    services: [
      {
        service: "LIVING",
        totalRequests: 12,
        uniquePeopleCount: 10,
        totalBudget: 120000,
        usedRoomsCount: 8,
        airports: [
          {
            airportId: "a1",
            airportName: "Пулково",
            airportCode: "LED",
            requestsCount: 8,
            uniquePeopleCount: 7,
            budget: 80000,
            usedRoomsCount: 5,
          },
        ],
        positions: [
          {
            positionId: "p1",
            positionName: "Пилот",
            count: 6,
            percent: 50,
            budget: 60000,
          },
        ],
        requests: [
          {
            requestId: "r1",
            requestNumber: "АЗ-10042",
            personId: "u1",
            personName: "Иванов",
            positionId: "p1",
            positionName: "Пилот",
            airportId: "a1",
            airportName: "Пулково",
            airportCode: "LED",
            budget: 10000,
            livingBudget: 9000,
            mealBudget: 500,
            transferBudget: 500,
          },
        ],
        transfers: [],
      },
      {
        service: "MEAL",
        totalRequests: 5,
        uniquePeopleCount: 5,
        totalBudget: 15000,
        usedRoomsCount: null,
        airports: [],
        positions: [],
        requests: [],
        transfers: [],
      },
      {
        service: "TRANSFER",
        totalRequests: 3,
        uniquePeopleCount: 3,
        totalBudget: 9000,
        usedRoomsCount: null,
        airports: [],
        positions: [],
        requests: [],
        transfers: [
          {
            transferId: "t1",
            requestNumber: "REQ-1",
            fromAddress: "А",
            toAddress: "Б",
            passengersCount: 2,
            uniquePeopleCount: 2,
            budget: 3000,
          },
        ],
      },
    ],
  },
  period2: null,
};
