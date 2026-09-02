// Файл манифеста во вложениях заявки (`PassengerRequest.files`): как назвать
// его при загрузке и как разобрать обратно то, что вернул бэк.
//
// Бэк режет имя через safeSlug (остаётся только [a-z0-9-_.]), поэтому кириллица
// и заглавные из «Манифест FV6346.xlsx» просто исчезнут, а чисто русское имя
// схлопнется в пустое. Имя нормализуем здесь, ДО отправки — иначе по списку
// файлов заявки нельзя будет отличить манифест от любого другого вложения.

// Ведущий timestamp, который бэк приписывает файлу при сохранении: Date.now() в
// миллисекундах и дефис. Это единственный источник времени загрузки — метаданных
// у `files` нет.
const TIMESTAMP_RE = /^(\d+)-/;

// Сегменты каталога /YYYY/MM/DD/ из пути загрузки — запасной источник даты,
// если имя пришло без timestamp.
const DATE_PATH_RE = /\/(\d{4})\/(\d{2})\/(\d{2})\//;

const baseNameOf = (path) => String(path ?? "").split(/[\\/]/).pop() || "";

// Имя без ведущего timestamp: с ним сравниваем префикс «manifest».
const withoutTimestamp = (base) => base.replace(TIMESTAMP_RE, "");

// Расширение исходного файла в нижнем регистре, без точки. Имя без точки (или с
// точкой в начале, как у dotfile) расширения не даёт.
const extensionOf = (originalName) => {
  const base = baseNameOf(originalName);
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return "";
  return base.slice(dot + 1).toLowerCase();
};

// Номер рейса в [a-z0-9-]: латиница в нижний регистр, всё прочее (в том числе
// кириллица) → дефис, повторы схлопнуть, края срезать.
const flightSlug = (flightNumber) =>
  String(flightNumber ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Имя, под которым манифест уходит на бэк: manifest-<рейс>.<ext>.
// Timestamp и уникальность — за бэком.
export function manifestUploadName(originalName, flightNumber) {
  const slug = flightSlug(flightNumber);
  const ext = extensionOf(originalName);
  const stem = slug ? `manifest-${slug}` : "manifest";
  return ext ? `${stem}.${ext}` : stem;
}

// Наше ли это вложение: имя без ведущего timestamp начинается с «manifest».
export function isManifestFile(path) {
  return withoutTimestamp(baseNameOf(path)).toLowerCase().startsWith("manifest");
}

// Разбор пути вложения: время загрузки берём из timestamp в имени, иначе — из
// каталога /YYYY/MM/DD/ (только дата, без времени), иначе даты нет вовсе.
// hasTime говорит подписи, чем форматировать: formatDateTime или formatDate.
export function parseManifestFile(path) {
  const str = String(path ?? "");
  const stamp = TIMESTAMP_RE.exec(baseNameOf(str));
  if (stamp) {
    const date = new Date(Number(stamp[1]));
    if (!Number.isNaN(date.getTime())) {
      return { path: str, uploadedAt: date, hasTime: true };
    }
  }
  const byPath = DATE_PATH_RE.exec(str);
  if (byPath) {
    const date = new Date(
      Number(byPath[1]),
      Number(byPath[2]) - 1,
      Number(byPath[3])
    );
    if (!Number.isNaN(date.getTime())) {
      return { path: str, uploadedAt: date, hasTime: false };
    }
  }
  return { path: str, uploadedAt: null, hasTime: false };
}

// Манифесты заявки, новые сверху. Файлы без распознанной даты — в конце: порядок
// между ними бэк не гарантирует, выдумывать его нельзя.
export function manifestFilesNewestFirst(files) {
  return (Array.isArray(files) ? files : [])
    .filter(isManifestFile)
    .map(parseManifestFile)
    .sort((a, b) => {
      if (a.uploadedAt && b.uploadedAt) return b.uploadedAt - a.uploadedAt;
      if (a.uploadedAt) return -1;
      if (b.uploadedAt) return 1;
      return 0;
    });
}

// Копия исходного File под нормализованным именем — переименовать File на месте
// нельзя, name у него только на чтение.
export function buildManifestUpload(file, flightNumber) {
  if (!file) return null;
  return new File([file], manifestUploadName(file.name, flightNumber), {
    type: file.type,
  });
}
