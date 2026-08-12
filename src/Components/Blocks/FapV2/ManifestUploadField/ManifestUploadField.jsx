import React, { useState } from "react";
import classes from "./ManifestUploadField.module.css";
import { parseManifestXlsx, isSameFlight } from "../../../../utils/parseManifestXlsx.js";
import CategoryBadge from "../CategoryBadge/CategoryBadge.jsx";
import ChevronIcon from "../../../../shared/icons/ChevronIcon.jsx";
import FileDropzone from "../../FileDropzone/FileDropzone.jsx";
import { plural } from "../../../../utils/plural.js";

// Загрузка пассажирского манифеста (форма ПМ) с превью.
// parsed = { people, flightNumber, lapInfants, fileName } | null — владеет родитель.
// expectedFlightNumber — рейс заявки: при расхождении с рейсом файла показываем плашку.
export default function ManifestUploadField({
  parsed,
  onParsed,
  onClear,
  expectedFlightNumber,
}) {
  const [error, setError] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleFile = async (file) => {
    setParsing(true);
    setError(null);
    let result;
    try {
      result = await parseManifestXlsx(file);
    } catch {
      setError("Не удалось прочитать файл");
      return;
    } finally {
      setParsing(false);
    }
    if (result.error) {
      setError(result.error);
      return;
    }
    setExpanded(false);
    onParsed({
      people: result.people,
      flightNumber: result.flightNumber,
      lapInfants: result.lapInfants,
      fileName: file.name,
    });
  };

  const handleClear = () => {
    setError(null);
    setExpanded(false);
    onClear();
  };

  const counts = (parsed?.people || []).reduce((acc, p) => {
    acc[p.personCategory] = (acc[p.personCategory] || 0) + 1;
    return acc;
  }, {});

  const chips = [
    { label: "взр", value: counts.ADULT || 0 },
    { label: "РБ", value: counts.CHILD || 0 },
    { label: "инф", value: counts.INFANT || 0 },
  ].filter((c) => c.value > 0);

  const flightMismatch =
    !!parsed?.flightNumber &&
    !!expectedFlightNumber &&
    !isSameFlight(parsed.flightNumber, expectedFlightNumber);

  const meta = parsed && (
    <>
      <span>
        {parsed.people.length}{" "}
        {plural(parsed.people.length, ["пассажир", "пассажира", "пассажиров"])}
      </span>
      {chips.map((c) => (
        <span key={c.label} className={classes.chip}>
          {c.label} {c.value}
        </span>
      ))}
    </>
  );

  return (
    <div className={classes.wrapper}>
      <FileDropzone
        accept=".xlsb,.xlsx,.xls"
        hint="Формат файла XLSB, XLSX, XLS"
        fileName={parsed?.fileName}
        meta={meta}
        parsing={parsing}
        error={error}
        onFile={handleFile}
        onClear={handleClear}
      />

      {flightMismatch && (
        <div className={classes.flightWarn}>
          ⚠ В манифесте рейс <b>{parsed.flightNumber}</b>, в заявке —{" "}
          <b>{expectedFlightNumber}</b>
        </div>
      )}

      {/* Инфанты на руках: собственных строк в файле у них нет, есть только отметка
          в колонке «РМ» у сопровождающего. Что «РМ» — это инфант, подтвердила
          авиакомпания (2026-07-31). В список они добавляются с временным именем
          «‹сопровождающий› (инфант)» — см. expandLapInfants в parseManifestXlsx.js. */}
      {parsed?.lapInfants?.count > 0 && (
        <div className={classes.flightWarn}>
          ⚠ В манифесте {parsed.lapInfants.count}{" "}
          {plural(parsed.lapInfants.count, ["инфант", "инфанта", "инфантов"])} на
          руках — своих строк у них нет, отметка в колонке «РМ» стоит у
          {parsed.lapInfants.carriers?.length
            ? `: ${parsed.lapInfants.carriers.map((c) => c.name).join(", ")}`
            : " части пассажиров"}
          . Они добавлены с временными именами вида «Фамилия Имя (инфант)» —
          поправьте ФИО в реестре, когда будут данные.
        </div>
      )}

      {parsed?.people?.length > 0 && (
        <>
          <button
            type="button"
            className={classes.toggle}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? "Скрыть список" : "Показать список"}
            <ChevronIcon
              className={expanded ? classes.chevronUp : classes.chevron}
            />
          </button>

          {expanded && (
            <div className={classes.list}>
              {parsed.people.map((p, i) => (
                <div key={i} className={classes.personRow}>
                  <span className={classes.personIndex}>{i + 1}</span>
                  <span className={classes.personName}>{p.fullName}</span>
                  {p.seat && (
                    <span className={classes.personSeat}>{p.seat}</span>
                  )}
                  <CategoryBadge category={p.personCategory} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
