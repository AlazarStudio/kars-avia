// Фильтр опций FapSelect по строке поиска (проп searchable). Опции — уже
// нормализованные { value, label } и заголовки групп { groupLabel }.
// Совпал заголовок группы — группа остаётся целиком; иначе остаются только
// совпавшие опции под своим заголовком. Группы без совпадений выпадают.
export function filterSelectOptions(options, query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return options;
  const out = [];
  let group = null;
  let groupMatched = false;
  let groupEmitted = false;
  for (const o of options) {
    if (o.groupLabel) {
      group = o;
      groupMatched = String(o.groupLabel).toLowerCase().includes(q);
      groupEmitted = false;
      continue;
    }
    const label = typeof o.label === "string" ? o.label : String(o.value ?? "");
    if (groupMatched || label.toLowerCase().includes(q)) {
      if (group && !groupEmitted) {
        out.push(group);
        groupEmitted = true;
      }
      out.push(o);
    }
  }
  return out;
}
