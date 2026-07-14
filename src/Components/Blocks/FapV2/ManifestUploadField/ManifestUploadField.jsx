import React, { useState } from "react";
import classes from "./ManifestUploadField.module.css";
import { parseManifestXlsx } from "../../../../utils/parseManifestXlsx.js";
import CategoryBadge from "../CategoryBadge/CategoryBadge.jsx";
import ChevronIcon from "../../../../shared/icons/ChevronIcon.jsx";
import FileDropzone from "../../FileDropzone/FileDropzone.jsx";

const plural = (n, forms) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

// Загрузка пассажирского манифеста (форма ПМ) с превью.
// parsed = { people, flightNumber, fileName } | null — владеет родитель.
export default function ManifestUploadField({ parsed, onParsed, onClear }) {
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
    { label: "РМ", value: counts.INFANT || 0 },
  ].filter((c) => c.value > 0);

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
