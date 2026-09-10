import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyHotelAbout,
  parseHotelAbout,
  buildHotelAboutHtml,
  aboutLocationLine,
  FACILITY_ITEMS,
  ROOM_ITEMS,
  RARE_ITEM_KEYS,
} from "./hotelAbout.js";
import { parseHotelDescription, extractAmenities } from "./hotelDescription.js";

// Реальный текст «Азии» с дев-стенда: жирные лейблы и жирные вставки в значениях.
const AZIA = [
  "<p><strong>Название гостиницы:</strong> Азия 4*</p>",
  "<p><strong>Локация:</strong> Абакан, ул. Кирова, 114.</p>",
  "<p><strong>Инфраструктура:</strong> Парк, магазин <strong>Альпина маркет, Красное и Белое,</strong> кафе <strong>Кира, Чайхана, Мадрид</strong>.</p>",
  "<p><strong>Оснащение объекта:</strong> На территории отеля есть ресторан <strong>«Food&amp;Bar 114»</strong>, лобби-бар, тренажёрный зал, сауна с бассейном.</p>",
  "<p><strong>Оснащение номерного фонда:</strong> Удобная, эргономичная мебель, система кондиционирования, спутниковое телевидение, высокоскоростной <strong>Wi-Fi</strong>, мини-бар, <strong>сейф</strong>, принадлежности для чая и кофе – во всех номерах отеля.</p>",
  "<p><strong>Услуги прачечной/глажки:</strong> Услуги прачечной предоставляются/глажка - на каждом этаже гладильная комната.</p>",
].join("");

// «Паллада»: списки через запятую, почти всё — пункты словаря.
const PALLADA = [
  "<p><strong>Название гостиницы:</strong> Паллада</p>",
  "<p><strong>Локация:</strong> г.Новокузнецк, ул. Лазов, 18.</p>",
  "<p><strong>Оснащение объекта:</strong> Спортивный зал, сауна с бассейном, салон красоты и здоровья, конференц-зал, парковка, лифт, комната отдыха.</p>",
  "<p><strong>Оснащение номерного фонда:</strong> Кровать, постельное белье, санузел, раковина, шторы black-out, тумбочки, шкаф, вешалки, письменный стол, кресла, светильник, Wi-Fi, спутниковое телевидение, душевая кабина.</p>",
].join("");

// Шаблон редактора без жирного, варианты лейблов, чужой раздел и абзац без лейбла.
const PLAIN = [
  "<p>Название объекта: Волна</p>",
  "<p>Локация: </p>",
  "<p>Оснащение номеров: Фен, чайник</p>",
  "<p>Услуги прачечной/стирки: На территории гостиницы есть прачечная, так же предоставляют услуги глажки.</p>",
  "<p>Проживание с животными: разрешено</p>",
  "<p>Описание</p>",
].join("");

const EMPTY_TEMPLATE =
  "<p>Название гостиницы: </p><p>Локация: </p><p>Инфраструктура: </p><p>Оснащение объекта: </p><p>Оснащение номерного фонда: </p><p>Услуги прачечной/глажки: </p>";

const LAUNDRY_NEGATIVE =
  "<p><strong>Название гостиницы:</strong> Х</p><p><strong>Услуги прачечной/глажки:</strong> отсутствуют</p>";

test("«Азия»: галки — только целые совпадения, остальное дословно", () => {
  assert.deepEqual(parseHotelAbout(AZIA), {
    infrastructure: {
      checked: ["park"],
      extra: "Магазин Альпина маркет, Красное и Белое, кафе Кира, Чайхана, Мадрид.",
    },
    facility: {
      checked: ["bar", "gym"],
      extra: "На территории отеля есть ресторан «Food&Bar 114», сауна с бассейном.",
    },
    rooms: {
      checked: ["wifi", "tv", "airConditioning", "minibar", "safe"],
      extra: "Удобная, эргономичная мебель, принадлежности для чая и кофе – во всех номерах отеля.",
    },
    laundry: {
      laundry: false,
      ironing: false,
      extra: "Услуги прачечной предоставляются/глажка - на каждом этаже гладильная комната.",
    },
    other: "",
  });
});

test("«Паллада»: синонимы сводятся к пунктам, порядок — словаря", () => {
  const state = parseHotelAbout(PALLADA);
  assert.deepEqual(state.facility, {
    checked: ["parking", "conference", "elevator", "gym"],
    extra: "сауна с бассейном, салон красоты и здоровья, комната отдыха.",
  });
  assert.deepEqual(state.rooms, {
    checked: [
      "bed", "wardrobe", "nightstands", "desk", "armchairs", "hangers",
      "wifi", "tv", "bathroom", "shower", "sink", "linen", "blackout", "lamps",
    ],
    extra: "",
  });
});

test("лейблы без жирного, варианты лейблов, чужие разделы — в «Прочее»", () => {
  const state = parseHotelAbout(PLAIN);
  assert.deepEqual(state.rooms, { checked: ["kettle", "hairdryer"], extra: "" });
  assert.deepEqual(state.laundry, { laundry: true, ironing: true, extra: "" });
  assert.equal(state.other, "Проживание с животными: разрешено\nОписание");
  assert.deepEqual(state.infrastructure, { checked: [], extra: "" });
});

test("незаполненный шаблон — пустое состояние", () => {
  assert.deepEqual(parseHotelAbout(EMPTY_TEMPLATE), emptyHotelAbout());
  assert.equal(
    buildHotelAboutHtml(parseHotelAbout(EMPTY_TEMPLATE), { name: "Сочи", location: "" }),
    "<p><strong>Название гостиницы:</strong> Сочи</p>"
  );
});

test("прачечная «отсутствуют» — переключатели выключены, раздел не пишется", () => {
  const state = parseHotelAbout(LAUNDRY_NEGATIVE);
  assert.deepEqual(state.laundry, { laundry: false, ironing: false, extra: "" });
  assert.equal(
    buildHotelAboutHtml(state, { name: "Х" }),
    "<p><strong>Название гостиницы:</strong> Х</p>"
  );
});

test("сборка: порядок разделов, текстовый вид галок, гейт чипов", () => {
  const state = {
    ...emptyHotelAbout(),
    facility: { checked: ["parking", "wifi"], extra: "бильярдная комната" },
    laundry: { laundry: true, ironing: false, extra: "круглосуточно" },
  };
  const html = buildHotelAboutHtml(state, {
    name: "Паллада",
    location: "Новокузнецк, ул. Лазо, 18",
  });
  assert.equal(
    html,
    "<p><strong>Название гостиницы:</strong> Паллада</p>" +
      "<p><strong>Локация:</strong> Новокузнецк, ул. Лазо, 18</p>" +
      "<p><strong>Оснащение объекта:</strong> парковка, Wi-Fi, бильярдная комната</p>" +
      "<p><strong>Услуги прачечной/глажки:</strong> есть прачечная. Круглосуточно</p>"
  );
  assert.equal(parseHotelDescription(html).parsed, true);
  const keys = extractAmenities(html).map((a) => a.key);
  assert.ok(keys.includes("parking"));
  assert.ok(keys.includes("wifi"));
});

test("текст пользователя экранируется и читается обратно", () => {
  const state = { ...emptyHotelAbout(), other: '<b>x</b> & "y"' };
  const html = buildHotelAboutHtml(state);
  assert.equal(html, "<p><strong>Прочее:</strong> &lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;</p>");
  assert.equal(parseHotelAbout(html).other, '<b>x</b> & "y"');
});

test("«Прочее» в несколько строк переживает сборку", () => {
  const state = { ...emptyHotelAbout(), other: "Строка 1\nСтрока 2" };
  const html = buildHotelAboutHtml(state);
  assert.equal(html, "<p><strong>Прочее:</strong> Строка 1<br>Строка 2</p>");
  assert.equal(parseHotelAbout(html).other, "Строка 1\nСтрока 2");
});

test("цикл: разобранное состояние после сборки читается тем же", () => {
  const meta = { name: "Гостиница", location: "Город, улица, 1" };
  for (const html of [AZIA, PALLADA, PLAIN, EMPTY_TEMPLATE, LAUNDRY_NEGATIVE]) {
    const first = parseHotelAbout(html);
    assert.deepEqual(parseHotelAbout(buildHotelAboutHtml(first, meta)), first);
  }
});

test("локация — город и адрес карточки", () => {
  assert.equal(
    aboutLocationLine({ information: { city: "Абакан", address: "ул. Кирова, 114" } }),
    "Абакан, ул. Кирова, 114"
  );
  assert.equal(
    aboutLocationLine({ information: { city: "" }, location: { address: "ул. Мира, 1" } }),
    "ул. Мира, 1"
  );
  assert.equal(aboutLocationLine(undefined), "");
});

test("пустое и не-строка — пустое состояние", () => {
  assert.deepEqual(parseHotelAbout(""), emptyHotelAbout());
  assert.deepEqual(parseHotelAbout(null), emptyHotelAbout());
  assert.deepEqual(parseHotelAbout(undefined), emptyHotelAbout());
});

test("прачечная: частые фразы стенда включают переключатели", () => {
  const on = parseHotelAbout(
    "<p><strong>Услуги прачечной/глажки:</strong> Услуги прачечной и глажки предоставляются.</p>"
  );
  assert.deepEqual(on.laundry, { laundry: true, ironing: true, extra: "" });
  const off = parseHotelAbout("<p><strong>Услуги прачечной/глажки:</strong> не предоставляют</p>");
  assert.deepEqual(off.laundry, { laundry: false, ironing: false, extra: "" });
});

test("оснащение объекта: добранные синонимы и пункты", () => {
  const state = parseHotelAbout(
    "<p><strong>Оснащение объекта:</strong> Телефон, массажный кабинет, spa-центр, предоставление ланч-боксов, кафе-бар, кулеры на этажах, летняя веранда.</p>"
  );
  assert.deepEqual(state.facility, {
    checked: ["bar", "spa", "cooler", "terrace", "phone", "massage", "lunchbox"],
    extra: "",
  });
});

test("номерной фонд: добранные синонимы и пункты", () => {
  const state = parseHotelAbout(
    "<p><strong>Оснащение номерного фонда:</strong> Гигиенические средства, набор полотенец, стаканы, ковровое покрытие, подушки, банный халат, журнальный столик, тумба, утюг, шкаф/гардероб, настенное зеркало.</p>"
  );
  assert.deepEqual(state.rooms, {
    checked: [
      "wardrobe", "nightstands", "mirror", "coffeeTable", "iron",
      "towels", "bathrobes", "toiletries", "glassware", "carpet", "pillows",
    ],
    extra: "",
  });
});

test("редкие пункты — существующие ключи своих словарей", () => {
  const facilityKeys = new Set(FACILITY_ITEMS.map((entry) => entry.key));
  const roomKeys = new Set(ROOM_ITEMS.map((entry) => entry.key));
  RARE_ITEM_KEYS.facility.forEach((key) => assert.ok(facilityKeys.has(key), key));
  RARE_ITEM_KEYS.rooms.forEach((key) => assert.ok(roomKeys.has(key), key));
});
