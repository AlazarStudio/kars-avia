import { findRowIndexForPerson } from "./reports/reportRowMatch.js";

// Интерим «деньги отчёта проживания скрыты от гостиницы»: пока гостиница
// заполняет только факт, её сохранение не должно переписывать деньги диспетчера.
// Одного экранного гейта тут мало — buildReportRows пересчитывает суммы по ценам
// СМОТРЯЩЕГО (у гостиницы это её собственный прайс, без наценки Kars Avia), а
// отчёт один на пару «заявка + гостиница»: upsert перезаписывает массив строк
// целиком, версий нет. Поэтому скрытие идёт парой с заморозкой денежных полей.

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Число ланчбоксов строки отчёта: новое поле lunchboxCount; иначе легаси —
// число тумблеров. Единственное определение на весь ФАП: его читают экран
// (computePdFood), выгрузка (buildReportSheets) и пересчёт питания ниже — при
// расхождении семантики флагов суммы этих трёх мест разъезжаются.
export const lunchboxCountOf = (row) =>
  row?.lunchboxCount != null
    ? toNum(row.lunchboxCount)
    : (row?.breakfastLunchbox ? 1 : 0) +
      (row?.lunchLunchbox ? 1 : 0) +
      (row?.dinnerLunchbox ? 1 : 0);

// Питание строки: Σ(ставка × количество приёма) + ланчбоксы × цена ланчбокса.
// Построчный двойник computePdFood из FapHotelPage: там цена ланчбокса берётся
// из живого тарифа, а в строке уже лежит применённый снимок этой цены.
export const rowFoodCost = (row) =>
  toNum(row?.breakfast) * toNum(row?.breakfastCount) +
  toNum(row?.lunch) * toNum(row?.lunchCount) +
  toNum(row?.dinner) * toNum(row?.dinnerCount) +
  lunchboxCountOf(row) * toNum(row?.lunchboxPrice);

// Гостевая строка отличается от теневой тарифной непустым ФИО — тем же
// признаком, по которому их разбирает восстановление отчёта. personId добавлен
// как страховка: гость без ФИО иначе выглядел бы теневой строкой и его правки
// не доехали бы до сейва вовсе.
const isPersonRow = (row) =>
  Boolean((row?.fullName ?? "").trim() || (row?.personId ?? "").toString().trim());

// Замораживаемые поля сохранённой строки — в тех же формах, что кладёт
// buildReportRows: числа числами, accommodationDiscount nullable, tariffName
// строкой.
//
// Кроме собственно денег сюда входят две величины, из которых деньги выводятся
// при печати:
//   placementKind — снимок вида размещения, по которому посчитана цена (ручной
//     выбор гостиницы остаётся в placementKindOverride и не морозится);
//   daysCount — множитель цены: книга печатает скидку как
//     1 − стоимость / (цена за сутки × сутки), и разъехавшиеся сутки при
//     замороженной стоимости печатали бы диспетчеру выдуманный процент.
// Поэтому «Сут.» под гейтом read-only — см. FapHotelPage.
const frozenFieldsOf = (row) => ({
  breakfast: toNum(row?.breakfast),
  lunch: toNum(row?.lunch),
  dinner: toNum(row?.dinner),
  lunchboxPrice: toNum(row?.lunchboxPrice),
  accommodationCost: toNum(row?.accommodationCost),
  pricePerDay: toNum(row?.pricePerDay),
  placementKind: Number(row?.placementKind) || 0,
  daysCount: toNum(row?.daysCount),
  tariffName: row?.tariffName ?? "",
  accommodationDiscount:
    row?.accommodationDiscount != null ? toNum(row.accommodationDiscount) : null,
});

// Сохранённые строки приходят из кэша Apollo — с __typename, которого во входном
// типе мутации нет.
const withoutTypename = (row) => {
  const next = { ...row };
  delete next.__typename;
  return next;
};

// Построенные строки отчёта, где деньги взяты из уже сохранённых.
// Факт (номер, счётчики приёмов, ручной вид размещения) — из построенных.
//
// Единственный пересчёт — foodCost: питание линейно и ручных переопределений в
// нём нет, поэтому оно считается замороженными ставками по НОВЫМ счётчикам.
// Иначе «Итого:» книги спорит само с собой: «Стоимость питания» суммирует
// замороженное поле, а колонки приёмов — SUMPRODUCT новых счётчиков на те же
// ставки. Проживание так не пересчитывается: там вид размещения, скидки и
// ручной ввод — то есть решения диспетчера, а не арифметика.
export function preserveMoneyFields(builtRows, savedRows) {
  const built = Array.isArray(builtRows) ? builtRows : [];
  const saved = Array.isArray(savedRows) ? savedRows : [];
  // Отчёта в базе ещё нет — переносить нечего, ничьи деньги не затираются.
  if (saved.length === 0) return built;

  const savedPeople = saved.filter(isPersonRow);
  const consumed = new Set();
  const personRows = built.filter(isPersonRow).map((row) => {
    const idx = findRowIndexForPerson(savedPeople, row, consumed);
    // Гость появился после последнего сейва: денег в базе нет, отдаём строку
    // билдера как есть — морозить нечего, заполнит диспетчер.
    if (idx < 0) return row;
    consumed.add(idx);
    const merged = { ...row, ...frozenFieldsOf(savedPeople[idx]) };
    return { ...merged, foodCost: rowFoodCost(merged) };
  });

  // Теневые тарифные строки целиком денежные (цены по видам размещения, ставки
  // питания, цена ланчбокса) — не пересобираем, отдаём как лежат.
  return [...personRows, ...saved.filter((r) => !isPersonRow(r)).map(withoutTypename)];
}

// Разошлись ли деньги сохранённого отчёта с тем, что показывает экран.
//
// Экран считает строки живьём (buildReportRows), а в базу они попадают только
// при сохранении — простое открытие страницы отчёт не переписывает. Поэтому
// после смены правил расчёта (например, деления цены номера между жильцами)
// экран показывает новую раскладку, а заявочная выгрузка печатает СТАРУЮ: она
// берёт строки из базы. Этот предикат — сигнал «сохранённое устарело».
//
// Сравниваем ровно три величины, из которых печатается проживание: цену за
// сутки, стоимость и вид размещения. Питание, номер и счётчики сюда не входят —
// их синхронизируют собственные пути (правка гостя, присвоение номера), и
// лишний сейв на каждое их расхождение только гасил бы отметку отправки.
//
// Матчинг тот же, что в preserveMoneyFields: personId → ФИО, с consumed-сетом,
// иначе однофамильцы сравнивались бы с одной и той же строкой.
export function reportMoneyDiffers(builtRows, savedRows) {
  const built = Array.isArray(builtRows) ? builtRows : [];
  const saved = Array.isArray(savedRows) ? savedRows : [];
  // Отчёта в базе нет — расходиться не с чем. Создание отчёта остаётся за
  // штатными путями: синхронизация не должна заводить его сама.
  if (saved.length === 0) return false;

  const builtPeople = built.filter(isPersonRow);
  const savedPeople = saved.filter(isPersonRow);
  // Состав строк разъехался (гость добавлен или выселен) — деньги в базе точно
  // не те, что на экране.
  if (builtPeople.length !== savedPeople.length) return true;

  const consumed = new Set();
  return builtPeople.some((row) => {
    const idx = findRowIndexForPerson(savedPeople, row, consumed);
    // Гость есть на экране, а строки под него в базе нет.
    if (idx < 0) return true;
    consumed.add(idx);
    const was = savedPeople[idx];
    return (
      toNum(row?.pricePerDay) !== toNum(was?.pricePerDay) ||
      toNum(row?.accommodationCost) !== toNum(was?.accommodationCost) ||
      (Number(row?.placementKind) || 0) !== (Number(was?.placementKind) || 0)
    );
  });
}
