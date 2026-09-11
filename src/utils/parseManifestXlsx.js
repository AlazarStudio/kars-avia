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

// Возвращает { people: [{ fullName, seat, personCategory }], flightNumber, lapInfants, error }.
// Формат файла — XLSB/XLSX/XLS/CSV; CSV декодируем сами (UTF-8 → windows-1251), разделитель
// SheetJS угадывает. Формат манифеста (семь профилей) определяется автоматически по
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

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });

  const detected = detectProfile(rows, PROFILES);
  if (!detected) {
    return {
      people: [],
      flightNumber: "",
      error:
        "Файл не распознан как манифест (ведомость ПМ, текстовая ведомость, манифест ИКАО, список PNL, выгрузка PLI, выгрузка «Руслайн» или текстовый манифест «Азимута»)",
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
