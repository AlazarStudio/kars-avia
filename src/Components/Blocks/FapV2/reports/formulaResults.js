// Итоги книг ФАП — формулы (SUM, SUMPRODUCT, «Y7+K12+K17»), а exceljs пишет в
// xlsx только <f> без <v>. Excel на компьютере пересчитает их сам, но защищённый
// просмотр скачанного файла, превью Windows/Outlook/мессенджеров и мобильные
// просмотрщики формулы не считают — там итоги пустые. Поэтому перед выгрузкой
// формулы считаются здесь и результат ложится кешем (<v>): формула остаётся
// живой, а итог виден везде.
//
// Вычислитель нарочно крошечный — ровно то, что пишет buildReportSheets: числа,
// ссылки A1 / $A$1, диапазоны A1:B10, «+» и «-» между слагаемыми, SUM(…) и
// SUMPRODUCT(диапазон, диапазон). Всё остальное (другие функции, ссылки на
// другие листы, «*», «/», скобки) — ячейка остаётся без кеша, её посчитает Excel.
// Модуль без импортов: его гоняет node --test.

const fail = () => {
  throw new Error("unsupported formula");
};

const isFormula = (v) => v != null && typeof v === "object" && typeof v.formula === "string";

// Деньги — максимум копейки: округление убирает хвосты вида 0.30000000000000004.
// «+ 0» превращает -0 в 0.
const round = (x) => Math.round(x * 100) / 100 + 0;

const colNumber = (letters) =>
  letters.toUpperCase().split("").reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);

// Токены: ссылка (не часть имени, листа или функции), имя функции перед «(»,
// число, знак.
const TOKEN_RE =
  /\s*(?:\$?([A-Za-z]{1,3})\$?(\d+)(?![\w.!(])|([A-Za-z_][\w.]*)(?=\s*\()|(\d+(?:\.\d+)?)|([-+(),:]))/y;

function tokenize(formula) {
  const src = formula.trim();
  const tokens = [];
  TOKEN_RE.lastIndex = 0;
  while (TOKEN_RE.lastIndex < src.length) {
    const m = TOKEN_RE.exec(src);
    if (!m) fail();
    if (m[1]) tokens.push({ type: "ref", col: colNumber(m[1]), row: Number(m[2]) });
    else if (m[3]) tokens.push({ type: "func", name: m[3].toUpperCase() });
    else if (m[4]) tokens.push({ type: "num", value: Number(m[4]) });
    else tokens.push({ type: "op", text: m[5] });
  }
  return tokens;
}

// Обход диапазона: fn(row, col) для каждой ячейки.
const eachInArea = (area, fn) => {
  for (let r = area.top; r <= area.bottom; r += 1) {
    for (let c = area.left; c <= area.right; c += 1) fn(r, c);
  }
};

const FUNCTIONS = {
  // SUM, как в Excel, пропускает текст и пустые ячейки.
  SUM: (args, valueAt) =>
    args.reduce((sum, arg) => {
      if (!arg.area) return sum + arg.number;
      let s = sum;
      eachInArea(arg.area, (r, c) => {
        const v = valueAt(r, c);
        if (v != null) s += v;
      });
      return s;
    }, 0),
  // SUMPRODUCT двух диапазонов одной формы; не число в ячейке — ноль, как в Excel.
  SUMPRODUCT: (args, valueAt) => {
    const [a, b] = args;
    if (args.length !== 2 || !a.area || !b.area) fail();
    const height = a.area.bottom - a.area.top;
    const width = a.area.right - a.area.left;
    if (height !== b.area.bottom - b.area.top || width !== b.area.right - b.area.left) fail();
    let sum = 0;
    eachInArea(a.area, (r, c) => {
      const x = valueAt(r, c) ?? 0;
      const y = valueAt(b.area.top + r - a.area.top, b.area.left + c - a.area.left) ?? 0;
      sum += x * y;
    });
    return sum;
  },
};

// Разбор и счёт одной формулы. valueAt(row, col) → число или null (не число).
function evaluate(formula, valueAt) {
  const tokens = tokenize(formula);
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++] ?? fail();
  const expectOp = (text) => {
    if (next().text !== text) fail();
  };

  // Ссылка или диапазон — как прямоугольник.
  const area = () => {
    const from = next();
    if (from.type !== "ref") fail();
    let to = from;
    if (peek()?.text === ":") {
      i += 1;
      to = next();
      if (to.type !== "ref") fail();
    }
    return {
      top: Math.min(from.row, to.row),
      bottom: Math.max(from.row, to.row),
      left: Math.min(from.col, to.col),
      right: Math.max(from.col, to.col),
    };
  };

  const argList = () => {
    expectOp("(");
    const args = [];
    for (;;) {
      const t = peek();
      if (t?.type === "num") {
        i += 1;
        args.push({ number: t.value });
      } else {
        args.push({ area: area() });
      }
      if (peek()?.text !== ",") break;
      i += 1;
    }
    expectOp(")");
    return args;
  };

  const term = () => {
    const t = next();
    if (t.type === "num") return t.value;
    if (t.type === "func") {
      const fn = FUNCTIONS[t.name];
      if (!fn) fail();
      return fn(argList(), valueAt);
    }
    if (t.type !== "ref" || peek()?.text === ":") fail(); // голый диапазон вне функции
    // Не число в слагаемом — ноль. Excel на тексте дал бы #VALUE!, но в книгах
    // такие ссылки всегда смотрят на числовые итоги (пустой итог — пустая ячейка).
    return valueAt(t.row, t.col) ?? 0;
  };

  let result = term();
  while (i < tokens.length) {
    const op = next().text;
    if (op === "+") result += term();
    else if (op === "-") result -= term();
    else fail();
  }
  return result;
}

// Счёт формул одного листа: формула, на которую ссылаются, считается
// рекурсивно с памятью; цикл или неподдержанная формула — ошибка вверх.
function sheetEvaluator(ws) {
  const memo = new Map(); // адрес → число | FAILED
  const FAILED = Symbol("failed");
  const inProgress = new Set();

  const formulaValue = (cell, formula) => {
    const key = cell.address;
    if (memo.has(key)) {
      const v = memo.get(key);
      return v === FAILED ? fail() : v;
    }
    if (inProgress.has(key)) fail(); // цикл
    inProgress.add(key);
    try {
      const v = round(evaluate(formula, valueAt));
      memo.set(key, v);
      return v;
    } catch (e) {
      memo.set(key, FAILED);
      throw e;
    } finally {
      inProgress.delete(key);
    }
  };

  const valueAt = (row, col) => {
    const cell = ws.findRow(row)?.findCell(col);
    // Подчинённая ячейка объединения в Excel пуста, а геттер exceljs вернул бы
    // значение мастера — сабхедер «Гостиница: …» во всю ширину попал бы в SUM.
    if (!cell || cell.master !== cell) return null;
    const v = cell.value;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (isFormula(v)) return formulaValue(cell, v.formula);
    if (v != null && typeof v === "object") {
      if (typeof v.result === "number") return v.result;
      if ("sharedFormula" in v) fail(); // общих формул книги не пишут
    }
    return null; // пусто, текст, дата, булево
  };

  return formulaValue;
}

export function fillFormulaResults(workbook) {
  workbook.eachSheet((ws) => {
    const formulaValue = sheetEvaluator(ws);
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        const v = cell.value;
        if (cell.master !== cell || !isFormula(v)) return;
        try {
          cell.value = { ...v, result: formulaValue(cell, v.formula) };
        } catch {
          // Не посчитать — формула остаётся без кеша, Excel посчитает сам.
        }
      });
    });
  });
  // Кеш — для просмотрщиков; Excel всё равно пересчитает книгу при открытии.
  workbook.calcProperties = { ...(workbook.calcProperties || {}), fullCalcOnLoad: true };
}
