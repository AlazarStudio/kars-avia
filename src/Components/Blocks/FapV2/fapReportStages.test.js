import test from "node:test";
import assert from "node:assert/strict";
import {
  REPORT_STEPS,
  hotelReportStage,
  reportStageLabel,
  requestReportSummary,
} from "./fapReportStages.js";

const dispatcher = { role: "DISPATCHERADMIN" };
const airline = { role: "AIRLINEADMIN" };

const SENT = "2026-09-09T09:58:00.000Z";
const PRICED = "2026-09-09T09:58:30.000Z";
const APPROVED = "2026-09-09T11:29:00.000Z";

const oneHotel = (report) => ({
  livingService: { hotels: [{ hotelId: "h-1", name: "Анзас" }] },
  hotelReports: report ? [{ hotelIndex: 0, ...report }] : [],
});

test("стадия — число пройденных шагов подряд", () => {
  assert.equal(hotelReportStage(oneHotel(null), 0), 0);
  assert.equal(hotelReportStage(oneHotel({ submittedAt: SENT }), 0), 1);
  assert.equal(
    hotelReportStage(oneHotel({ submittedAt: SENT, pricingApprovedAt: PRICED }), 0),
    2
  );
  assert.equal(
    hotelReportStage(
      oneHotel({ submittedAt: SENT, pricingApprovedAt: PRICED, airlineApprovedAt: APPROVED }),
      0
    ),
    3
  );
});

test("согласование цен без отправки не засчитывается", () => {
  // На бэке согласование от отправки независимо, но неотправленный отчёт
  // авиакомпания не видит — стадия остаётся нулевой.
  assert.equal(
    hotelReportStage(oneHotel({ submittedAt: null, pricingApprovedAt: PRICED }), 0),
    0
  );
});

test("строковый индекс гостиницы работает так же", () => {
  assert.equal(hotelReportStage(oneHotel({ submittedAt: SENT }), "0"), 1);
});

test("текст стадии — первый непройденный шаг, у пройденного отчёта — последний", () => {
  assert.equal(REPORT_STEPS.length, 3);
  assert.equal(reportStageLabel(0), "Не отправлен");
  assert.equal(reportStageLabel(1), "Цены не согласованы");
  assert.equal(reportStageLabel(2), "Ждёт утверждения АК");
  assert.equal(reportStageLabel(3), "Утверждён АК");
});

test("нет гостиниц — сводки нет", () => {
  assert.equal(requestReportSummary({}, dispatcher), null);
  assert.equal(requestReportSummary({ livingService: { hotels: [] } }, dispatcher), null);
});

test("одна гостиница — её стадия, имя и даты по шагам", () => {
  const summary = requestReportSummary(
    oneHotel({ submittedAt: SENT, pricingApprovedAt: PRICED }),
    dispatcher
  );
  assert.deepEqual(summary, {
    stage: 2,
    laggingCount: 1,
    total: 1,
    revoked: false,
    hotels: [
      {
        index: 0,
        name: "Анзас",
        stage: 2,
        dates: [SENT, PRICED, null],
        revoked: false,
        comment: null,
      },
    ],
  });
});

test("гостиница без имени подписывается «Гостиница»", () => {
  const summary = requestReportSummary({ livingService: { hotels: [{}] } }, dispatcher);
  assert.equal(summary.hotels[0].name, "Гостиница");
});

test("несколько гостиниц — отстающая стадия и сколько гостиниц на ней", () => {
  const request = {
    livingService: {
      hotels: [{ name: "Анзас" }, { name: "Каспий" }, { name: "Волна" }],
    },
    hotelReports: [
      { hotelIndex: 0, submittedAt: SENT, pricingApprovedAt: PRICED },
      { hotelIndex: 2, submittedAt: SENT },
    ],
  };
  const summary = requestReportSummary(request, dispatcher);
  assert.equal(summary.stage, 0);
  assert.equal(summary.laggingCount, 1);
  assert.equal(summary.total, 3);
  assert.deepEqual(
    summary.hotels.map((h) => h.stage),
    [2, 0, 1]
  );
});

test("авиакомпании — только отправленные; ни одного отправленного — сводки нет", () => {
  const request = {
    livingService: { hotels: [{ name: "Анзас" }, { name: "Каспий" }] },
    hotelReports: [
      {
        hotelIndex: 0,
        submittedAt: SENT,
        pricingApprovedAt: PRICED,
        airlineApprovedAt: APPROVED,
      },
    ],
  };
  const summary = requestReportSummary(request, airline);
  assert.equal(summary.stage, 3);
  assert.equal(summary.total, 1);
  assert.deepEqual(
    summary.hotels.map((h) => h.name),
    ["Анзас"]
  );
  assert.equal(requestReportSummary({ ...request, hotelReports: [] }, airline), null);
});

test("гостинице — только своя, даже неотправленная", () => {
  const request = {
    livingService: {
      hotels: [
        { hotelId: "h-1", name: "Анзас" },
        { hotelId: "h-2", name: "Каспий" },
      ],
    },
    hotelReports: [{ hotelIndex: 0, submittedAt: SENT }],
  };
  const summary = requestReportSummary(request, { role: "HOTELADMIN", hotelId: "h-2" });
  assert.equal(summary.total, 1);
  assert.deepEqual(
    summary.hotels.map((h) => [h.name, h.stage]),
    [["Каспий", 0]]
  );
});

// ── Отзыв утверждения авиакомпанией ──
const REVOKED = {
  submittedAt: SENT,
  pricingApprovedAt: PRICED,
  airlineApprovedAt: null,
  airlineComment: "Неверные даты выезда",
  airlineCommentAt: APPROVED,
};

test("подпись «Утверждение отозвано» — только на шаге авиакомпании", () => {
  assert.equal(reportStageLabel(2, true), "Утверждение отозвано");
  assert.equal(reportStageLabel(2, false), "Ждёт утверждения АК");
  assert.equal(reportStageLabel(1, true), "Цены не согласованы");
  assert.equal(reportStageLabel(3, true), "Утверждён АК");
});

test("отозванный отчёт — revoked и комментарий у гостиницы и в сводке", () => {
  const summary = requestReportSummary(oneHotel(REVOKED), dispatcher);
  assert.equal(summary.stage, 2);
  assert.equal(summary.revoked, true);
  assert.equal(summary.hotels[0].revoked, true);
  assert.equal(summary.hotels[0].comment, "Неверные даты выезда");
});

test("утверждённый с комментарием — не отзыв", () => {
  const summary = requestReportSummary(
    oneHotel({ ...REVOKED, airlineApprovedAt: APPROVED }),
    dispatcher
  );
  assert.equal(summary.stage, 3);
  assert.equal(summary.revoked, false);
  assert.equal(summary.hotels[0].revoked, false);
});

test("отзыв у обогнавшей гостиницы не перекрашивает отстающую стадию", () => {
  const request = {
    livingService: { hotels: [{ name: "Анзас" }, { name: "Каспий" }] },
    hotelReports: [
      { hotelIndex: 0, ...REVOKED },
      { hotelIndex: 1, submittedAt: SENT },
    ],
  };
  const summary = requestReportSummary(request, dispatcher);
  assert.equal(summary.stage, 1);
  assert.equal(summary.revoked, false);
  assert.equal(summary.hotels[0].revoked, true);
});

test("отзыв, а затем снятое согласование цен: стадия 1, причина остаётся у гостиницы", () => {
  // Бэк при снятии цен гасит airlineApprovedAt, но комментарий АК не трогает:
  // чип стоит на «Цены не согласованы», а гостиница в подсказке помнит отзыв.
  const summary = requestReportSummary(
    oneHotel({ ...REVOKED, pricingApprovedAt: null }),
    dispatcher
  );
  assert.equal(summary.stage, 1);
  assert.equal(summary.revoked, false);
  assert.equal(reportStageLabel(summary.stage, summary.revoked), "Цены не согласованы");
  assert.equal(summary.hotels[0].revoked, true);
  assert.equal(summary.hotels[0].comment, "Неверные даты выезда");
});
