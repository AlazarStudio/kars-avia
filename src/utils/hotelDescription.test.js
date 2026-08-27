import test from "node:test";
import assert from "node:assert/strict";
import {
  parseHotelDescription,
  extractAmenities,
  hasRichText,
  plainText,
} from "./hotelDescription.js";

// Формат «Азии»: двоеточие внутри жирного, внутри значения — свои жирные куски.
const AZIA = [
  "<p><b>Название гостиницы:</b> Азия</p>",
  "<p><b>Локация:</b> г. Абакан, ул. Кирова, 114</p>",
  "<p><b>Инфраструктура:</b> Парк, магазин <b>Альпина маркет</b>, ресторан</p>",
].join("");

test("пункты конвенции разбираются, inline-разметка значения сохраняется", () => {
  const { items, restHtml, parsed } = parseHotelDescription(AZIA);
  assert.equal(parsed, true);
  assert.equal(restHtml, "");
  assert.deepEqual(
    items.map((i) => i.label),
    ["Название гостиницы", "Локация", "Инфраструктура"]
  );
  assert.equal(items[0].valueHtml, "Азия");
  assert.equal(
    items[2].valueHtml,
    "Парк, магазин <b>Альпина маркет</b>, ресторан"
  );
});

test("двоеточие после закрывающего тега — тот же пункт", () => {
  const { items, parsed } = parseHotelDescription(
    "<p><b>Локация</b>: г. Абакан</p><p><b>Лифт</b>: есть</p>"
  );
  assert.equal(parsed, true);
  assert.deepEqual(items, [
    { label: "Локация", valueHtml: "г. Абакан" },
    { label: "Лифт", valueHtml: "есть" },
  ]);
});

test("двоеточие, завёрнутое в свой тег, тоже снимается", () => {
  const { items, parsed } = parseHotelDescription(
    "<p><strong>Локация</strong><strong>:</strong> Абакан</p>" +
      "<p><strong>Питание</strong><strong>:</strong> завтрак</p>"
  );
  assert.equal(parsed, true);
  assert.deepEqual(
    items.map((i) => i.label),
    ["Локация", "Питание"]
  );
  assert.equal(plainText(items[0].valueHtml), "Абакан");
});

test("strong с висячим пробелом и &nbsp; в значении", () => {
  const { items, parsed } = parseHotelDescription(
    "<p><strong>Название гостиницы: </strong>Азия</p>" +
      "<p><strong>Локация:</strong>&nbsp;Абакан</p>"
  );
  assert.equal(parsed, true);
  assert.equal(items[0].label, "Название гостиницы");
  assert.equal(items[0].valueHtml, "Азия");
  assert.equal(items[1].label, "Локация");
  assert.equal(plainText(items[1].valueHtml), "Абакан");
});

test("заголовки читаются как обычные абзацы, атрибуты тегов не мешают", () => {
  const { items, parsed } = parseHotelDescription(
    '<h2 class="ql-align-center"><b>Локация:</b> Абакан</h2>' +
      '<p class="x"><b style="color:#000">Лифт:</b> есть</p>'
  );
  assert.equal(parsed, true);
  assert.equal(items.length, 2);
});

test("меньше двух пунктов — не конвенция", () => {
  const one = parseHotelDescription(
    "<p><b>Локация:</b> Абакан</p><p>Просто текст про гостиницу.</p>"
  );
  assert.equal(one.parsed, false);
  assert.equal(one.items.length, 1);
});

test("свободный текст без конвенции не даёт пунктов", () => {
  const { items, parsed } = parseHotelDescription(
    "<p>Уютная гостиница рядом с парком.</p><p>Работает круглосуточно.</p>"
  );
  assert.equal(parsed, false);
  assert.deepEqual(items, []);
});

test("жирный ран без двоеточия — не пункт", () => {
  const { items, parsed } = parseHotelDescription(
    "<p><b>Внимание</b> — идёт ремонт</p><p><b>Скидки</b> действуют до конца года</p>"
  );
  assert.equal(parsed, false);
  assert.deepEqual(items, []);
});

test("пустые абзацы пропускаются и не попадают в хвост", () => {
  const { items, restHtml, parsed } = parseHotelDescription(
    "<p></p><p><br></p><p>&nbsp;</p>" +
      "<p><b>Локация:</b> Абакан</p>" +
      "<p><br></p>" +
      "<p><b>Лифт:</b> есть</p>"
  );
  assert.equal(parsed, true);
  assert.equal(items.length, 2);
  assert.equal(restHtml, "");
});

test("лейбл без значения уходит в хвост, слова не теряются", () => {
  const { items, restHtml, parsed } = parseHotelDescription(
    "<p><b>Локация:</b> Абакан</p><p><b>Инфраструктура:</b></p><p><b>Лифт:</b> есть</p>"
  );
  assert.equal(parsed, true);
  assert.equal(items.length, 2);
  assert.equal(restHtml, "<p><b>Инфраструктура:</b></p>");
});

test("хвост собирается в исходном порядке, списки не парсятся", () => {
  const { items, restHtml, parsed } = parseHotelDescription(
    "<p><b>Локация:</b> Абакан</p>" +
      "<ul><li><b>Пункт:</b> значение</li></ul>" +
      "<p><b>Лифт:</b> есть</p>" +
      "<p>Заезд с 14:00.</p>"
  );
  assert.equal(parsed, true);
  assert.equal(items.length, 2);
  assert.equal(
    restHtml,
    "<ul><li><b>Пункт:</b> значение</li></ul><p>Заезд с 14:00.</p>"
  );
});

test("незакрытый абзац не теряет текст", () => {
  const { items, restHtml } = parseHotelDescription(
    "<p><b>Локация:</b> Абакан</p><p>Хвост без закрытия"
  );
  assert.equal(items.length, 1);
  assert.equal(restHtml, "<p>Хвост без закрытия");
});

test("битая числовая сущность не роняет разбор", () => {
  // String.fromCodePoint вне диапазона Unicode бросает RangeError, а разбор
  // зовут прямо из рендера — такая сущность обязана остаться текстом.
  for (const entity of ["&#x110000;", "&#1114112;", "&#99999999999999999999;"]) {
    const html = `<p>${entity}</p>`;
    assert.equal(plainText(html), entity, entity);
    assert.equal(hasRichText(html), true, entity);
    assert.equal(parseHotelDescription(html).parsed, false, entity);
    assert.deepEqual(extractAmenities(html), [], entity);
  }
  assert.equal(plainText("<p>&#1055;&#x41;</p>"), "ПA");
});

test("кавычки в незакрытом теге не вешают парсер", () => {
  // Неоднозначность в разборе атрибутов давала катастрофический бэктрекинг:
  // такой вход считался секундами.
  const started = performance.now();
  const result = parseHotelDescription("<p " + '"'.repeat(60));
  assert.equal(result.parsed, false);
  assert.ok(performance.now() - started < 200);
});

test("пустой вход не роняет парсер", () => {
  for (const value of [undefined, null, "", "   ", 0, {}]) {
    const result = parseHotelDescription(value);
    assert.equal(result.parsed, false);
    assert.deepEqual(result.items, []);
    assert.equal(result.restHtml, "");
  }
});

test("hasRichText: пусто, разметка без текста, картинка", () => {
  assert.equal(hasRichText(""), false);
  assert.equal(hasRichText(undefined), false);
  assert.equal(hasRichText("<p><br></p>"), false);
  assert.equal(hasRichText("<p>&nbsp;</p>"), false);
  assert.equal(hasRichText('<p><img src="a.png"></p>'), true);
  assert.equal(hasRichText("<p>текст</p>"), true);
});

/* ===== Удобства ===== */

test("удобства ловятся в словоформах", () => {
  const keys = extractAmenities(
    "<p>Гости пользуются сауной и бассейном, есть парковка для автобусов, " +
      "работает ресторан с баром, номера с кондиционерами и сейфами, " +
      "в тренажёрном зале — новые тренажёры, услуги прачечной и глажки, " +
      "лифты на все этажи, конференц-залы, трансфер и завтраки, Wi-Fi.</p>"
  ).map((a) => a.key);

  assert.deepEqual(keys, [
    "wifi",
    "restaurant",
    "bar",
    "sauna",
    "pool",
    "gym",
    "parking",
    "airConditioning",
    "laundry",
    "transfer",
    "safe",
    "conference",
    "elevator",
  ]);
});

test("завтрак чипа не даёт — рядом свой блок «Питание»", () => {
  assert.deepEqual(
    extractAmenities("<p>Завтраки с 07:00, работает сауна.</p>").map((a) => a.key),
    ["sauna"]
  );
});

test("мини-бар не считается баром", () => {
  assert.deepEqual(
    extractAmenities("<p>В номерах мини-бар и сейф.</p>").map((a) => a.key),
    ["minibar", "safe"]
  );
  assert.deepEqual(
    extractAmenities("<p>Лобби-бар и минибар в номере.</p>").map((a) => a.key),
    ["bar", "minibar"]
  );
});

test("дубли схлопываются, порядок — по словарю", () => {
  assert.deepEqual(
    extractAmenities("<p>Бассейн, сауна, бассейн, Wi-Fi, сауна</p>"),
    [
      { key: "wifi", label: "Wi-Fi" },
      { key: "sauna", label: "Сауна" },
      { key: "pool", label: "Бассейн" },
    ]
  );
});

test("Wi-Fi во всех написаниях", () => {
  for (const text of ["Wi-Fi", "WiFi", "wi fi", "вай-фай", "Вайфай"]) {
    assert.deepEqual(
      extractAmenities(`<p>Есть ${text} на этажах</p>`).map((a) => a.key),
      ["wifi"],
      text
    );
  }
});

test("похожие слова не дают ложных чипов", () => {
  assert.deepEqual(extractAmenities("<p>Барбекю на террасе</p>"), []);
  assert.deepEqual(extractAmenities("<p>Саундтрек в лобби</p>"), []);
  assert.deepEqual(extractAmenities("<p>Барон и барс на гербе</p>"), []);
  assert.deepEqual(extractAmenities("<p>Лифтёр не предусмотрен</p>"), []);
});

test("отрицание слева гасит чип", () => {
  assert.deepEqual(extractAmenities("<p>Гостиница без парковки.</p>"), []);
  assert.deepEqual(extractAmenities("<p>Нет ресторана и бара.</p>"), []);
  assert.deepEqual(extractAmenities("<p>Гостиница не имеет бассейна.</p>"), []);
  assert.deepEqual(extractAmenities("<p>Сауна отсутствует.</p>").map((a) => a.key), [
    "sauna",
  ]);
  // Оговорка: «нет» справа страже не видно — окно только левое.
  assert.deepEqual(
    extractAmenities("<p>Ресторана нет.</p>").map((a) => a.key),
    ["restaurant"]
  );
  // Гасится упоминание рядом с отрицанием, а не весь текст: за окном чипы живут.
  assert.deepEqual(
    extractAmenities(
      "<p>Без парковки. На территории работает сауна.</p>"
    ).map((a) => a.key),
    ["sauna"]
  );
});

test("стоянка такси парковкой не считается", () => {
  assert.deepEqual(extractAmenities("<p>Рядом стоянка такси.</p>"), []);
  assert.deepEqual(
    extractAmenities("<p>Автостоянка и парковочные места.</p>").map((a) => a.key),
    ["parking"]
  );
});

test("пустое описание — чипов нет", () => {
  assert.deepEqual(extractAmenities(""), []);
  assert.deepEqual(extractAmenities(undefined), []);
  assert.deepEqual(extractAmenities("<p><br></p>"), []);
});

test("текст «Азии» даёт чипы по фактам описания", () => {
  assert.deepEqual(
    extractAmenities(AZIA).map((a) => a.key),
    ["restaurant"]
  );
});
