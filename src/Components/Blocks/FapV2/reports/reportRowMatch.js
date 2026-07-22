// Единый матчинг строк отчёта к гостям (restore в FapHotelPage + оба листа XLSX).
// Строка с personId матчится ТОЛЬКО по personId (гость удалён → строка не «крадёт»
// тёзку); строка без personId (старые отчёты) — по ФИО. consumed-сет общий.
const pid = (v) => (v ?? "").toString().trim();
const nm = (v) => (v ?? "").trim();

export const findRowIndexForPerson = (rows, person, consumed) => {
  const id = pid(person?.personId);
  if (id) {
    const byId = rows.findIndex(
      (r, i) => !consumed.has(i) && pid(r?.personId) === id
    );
    if (byId >= 0) return byId;
  }
  const name = nm(person?.fullName);
  return rows.findIndex(
    (r, i) => !consumed.has(i) && !pid(r?.personId) && nm(r?.fullName) === name
  );
};

export const findPersonIndexForRow = (people, row, consumed) => {
  const id = pid(row?.personId);
  if (id) {
    return people.findIndex(
      (p, i) => !consumed.has(i) && pid(p?.personId) === id
    );
  }
  const name = nm(row?.fullName);
  return people.findIndex(
    (p, i) => !consumed.has(i) && nm(p?.fullName) === name
  );
};
