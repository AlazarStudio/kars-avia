import * as XLSX from "xlsx";
import { detectProfile, extractPeople, expandLapInfants } from "./manifestCore.js";
import { PROFILES } from "./manifestProfiles.js";

// Ре-экспорт для потребителей (AddRepresentativeService.jsx импортирует отсюда).
export { manifestNameKey, isSameFlight } from "./manifestCore.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ

// CSV узнаём по расширению: на Windows у .csv MIME часто application/vnd.ms-excel.
export function isCsvFile(file) {
  const name = String(file?.name ?? "").toLowerCase();
  return name.endsWith(".csv") || file?.type === "text/csv";
}

// Текст из байтов: UTF-8 (с BOM или без), иначе windows-1251 — так выгружают
// «Руслайн» и большинство российских DCS.
export function decodeTextBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const hasBom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const body = hasBom ? bytes.subarray(3) : bytes;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    return new TextDecoder("windows-1251").decode(body);
  }
}

let cp1251Bytes;
const cp1251ByteOf = (ch) => {
  if (!cp1251Bytes) {
    const decoder = new TextDecoder("windows-1251");
    cp1251Bytes = new Map();
    for (let byte = 0; byte < 256; byte++) {
      cp1251Bytes.set(decoder.decode(Uint8Array.of(byte)), byte);
    }
  }
  return cp1251Bytes.get(ch);
};

// UTF-8 CSV, открытый в Excel как windows-1251 и пересохранённый в XLSX:
// «Заказ» → «Р—Р°РєР°Р·». Обратно без потерь: символы → байты windows-1251 → UTF-8.
// Строка, которая так не перекодируется, — не кракозябры, отдаём как есть.
export function repairCp1251Mojibake(text) {
  const bytes = [];
  for (const ch of text) {
    const byte = cp1251ByteOf(ch);
    if (byte === undefined) return text;
    bytes.push(byte);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
  } catch {
    return text;
  }
}

const repairRows = (rows) =>
  rows.map((row) =>
    (row || []).map((cell) =>
      typeof cell === "string" ? repairCp1251Mojibake(cell) : cell
    )
  );

// Возвращает { people: [{ fullName, seat, personCategory }], flightNumber, lapInfants, error }.
// Формат файла — XLSB/XLSX/XLS/CSV; CSV декодируем сами (UTF-8 → windows-1251), разделитель
// SheetJS угадывает. Формат манифеста (восемь профилей) определяется автоматически по
// заголовкам (см. manifestProfiles.js). lapInfants = { count, carriers: [{ name, count }] } |
// null — инфанты на руках, если формат их вообще выделяет. Они попадают и в people (см.
// expandLapInfants).
export async function parseManifestXlsx(file) {
  if (file.size > MAX_FILE_SIZE) {
    return { people: [], flightNumber: "", error: "Файл больше 10 МБ" };
  }

  let wb;
  try {
    const buf = await file.arrayBuffer();
    wb = isCsvFile(file)
      ? XLSX.read(decodeTextBuffer(buf), { type: "string", raw: true })
      : XLSX.read(buf, { type: "array" });
  } catch {
    return { people: [], flightNumber: "", error: "Не удалось прочитать файл" };
  }

  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) {
    return { people: [], flightNumber: "", error: "Файл пустой" };
  }

  let rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });

  let detected = detectProfile(rows, PROFILES);
  if (!detected) {
    // Последняя попытка — кракозябры после пересохранения CSV через Excel.
    const repaired = repairRows(rows);
    detected = detectProfile(repaired, PROFILES);
    if (detected) rows = repaired;
  }
  if (!detected) {
    return {
      people: [],
      flightNumber: "",
      error:
        "Файл не распознан как манифест (ведомость ПМ, текстовая ведомость, манифест ИКАО, список PNL, выгрузка PLI, выгрузка «Руслайн», текстовый манифест «Азимута» или выгрузка FlyDubai)",
    };
  }

  // Профиль мог привести файл к таблице сам (текстовая ведомость). Дальше по
  // файлу ходим только через source: и люди, и номер рейса читаются оттуда же.
  const source = detected.rows ?? rows;
  const people = extractPeople(source, detected.profile, detected.cols);
  if (!people.length) {
    return {
      people: [],
      flightNumber: "",
      error: "В файле не найдено ни одного пассажира",
    };
  }

  const lapInfants = detected.profile.lapInfants?.(source, detected.cols) ?? null;

  return {
    people: [...people, ...expandLapInfants(lapInfants)],
    flightNumber: detected.profile.flight(source),
    // Отдаём и отдельно — плашка называет сопровождающих поимённо.
    lapInfants,
    error: null,
  };
}
