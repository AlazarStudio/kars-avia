// Утилиты для имён файлов договоров/ДС.

// Расширение файла в нижнем регистре без точки ("Договор.PDF" -> "pdf").
export function fileExt(name) {
  const m = /\.([^.\\/]+)$/.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}

// Имя файла без расширения ("Договор №1.pdf" -> "Договор №1").
export function fileNameWithoutExt(name) {
  return (name || "").replace(/\.[^.\\/]+$/, "");
}
