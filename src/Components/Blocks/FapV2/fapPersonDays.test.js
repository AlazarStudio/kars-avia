import test from "node:test";
import assert from "node:assert/strict";
import { getPersonDays } from "./fapPersonDays.js";

const plan = {
  plannedFromAt: "2026-08-01T08:00:00.000Z",
  plannedToAt: "2026-08-04T12:00:00.000Z", // 76 ч → 3.5 суток по длительности
};

test("закрытый интервал своей гостиницы считается по длительности", () => {
  const person = {
    accommodationChesses: [
      {
        hotelIndex: 0,
        startAt: "2026-08-01T10:00:00.000Z",
        endAt: "2026-08-03T10:00:00.000Z", // ровно 48 ч
      },
    ],
  };
  assert.equal(getPersonDays(person, 0, plan), 2);
});

test("правило — по длительности, а не по времени заезда и выезда", () => {
  // Тот случай, на котором два экрана расходились: заезд 12:21, выезд на
  // следующий день 12:12. Прежние «эффективные сутки» давали 2 (сутки + 0.5 за
  // заезд до 14:00 + 0.5 за выезд после 12:00), длительность даёт 1.
  const person = {
    accommodationChesses: [
      {
        hotelIndex: 0,
        startAt: "2026-07-29T12:21:00.000Z",
        endAt: "2026-07-30T12:12:00.000Z", // 23 ч 51 мин
      },
    ],
  };
  assert.equal(getPersonDays(person, 0, plan), 1);
});

test("открытый интервал не считается — сутки берутся из плана", () => {
  // Гость, который сейчас живёт в гостинице, всегда имеет ОТКРЫТЫЙ интервал:
  // закрывают его только переселение и выселение, а они убирают гостя из
  // hotel.people. Это основной путь, а не исключение.
  const person = {
    accommodationChesses: [
      { hotelIndex: 0, startAt: "2026-08-01T10:00:00.000Z", endAt: null },
    ],
  };
  assert.equal(getPersonDays(person, 0, plan), 3.5);
});

test("hotelIndex сравнивается численно, строка из useParams подходит", () => {
  const person = {
    accommodationChesses: [
      {
        hotelIndex: 1,
        startAt: "2026-08-01T10:00:00.000Z",
        endAt: "2026-08-03T10:00:00.000Z",
      },
    ],
  };
  assert.equal(getPersonDays(person, "1", plan), 2);
});

test("без интервалов и без плана — ноль", () => {
  assert.equal(getPersonDays({ accommodationChesses: [] }, 0, null), 0);
  assert.equal(getPersonDays({}, 0, {}), 0);
  assert.equal(getPersonDays(undefined, 0, undefined), 0);
});

test("plannedAt подхватывается, когда plannedFromAt не задан", () => {
  const legacyPlan = {
    plannedAt: "2026-08-01T08:00:00.000Z",
    plannedToAt: "2026-08-02T08:00:00.000Z", // 24 ч
  };
  assert.equal(getPersonDays({}, 0, legacyPlan), 1);
});
