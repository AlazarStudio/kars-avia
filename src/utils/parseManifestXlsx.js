import * as XLSX from "xlsx";
import { detectProfile, extractPeople, expandLapInfants } from "./manifestCore.js";
import { PROFILES } from "./manifestProfiles.js";

// Ре-экспорт для потребителей (AddRepresentativeService.jsx импортирует отсюда).
export { manifestNameKey, isSameFlight } from "./manifestCore.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ

// Возвращает { people: [{ fullName, seat, personCategory }], flightNumber, lapInfants, error }.
// Формат (PM / PNL / PLI) определяется автоматически по заголовкам (см. manifestProfiles.js).
// lapInfants = { count, carriers: [{ name, count }] } | null — инфанты на руках, если
// формат их вообще выделяет. Они попадают и в people (см. expandLapInfants).
export async function parseManifestXlsx(file) {
  if (file.size > MAX_FILE_SIZE) {
    return { people: [], flightNumber: "", error: "Файл больше 10 МБ" };
  }

  let wb;
  try {
    const buf = await file.arrayBuffer();
    wb = XLSX.read(buf, { type: "array" });
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
        "Файл не распознан как манифест (ведомость ПМ, список PNL или выгрузка PLI)",
    };
  }

  const people = extractPeople(rows, detected.profile, detected.cols);
  if (!people.length) {
    return {
      people: [],
      flightNumber: "",
      error: "В файле не найдено ни одного пассажира",
    };
  }

  const lapInfants = detected.profile.lapInfants?.(rows, detected.cols) ?? null;

  return {
    people: [...people, ...expandLapInfants(lapInfants)],
    flightNumber: detected.profile.flight(rows),
    // Отдаём и отдельно — плашка называет сопровождающих поимённо.
    lapInfants,
    error: null,
  };
}
