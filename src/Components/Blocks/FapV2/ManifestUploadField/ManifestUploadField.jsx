import React, { useRef, useState } from "react";
import classes from "./ManifestUploadField.module.css";
import { parseManifestXlsx } from "../../../../utils/parseManifestXlsx.js";
import CategoryBadge from "../CategoryBadge/CategoryBadge.jsx";
import CloseIcon from "../../../../shared/icons/CloseIcon.jsx";

// Загрузка пассажирского манифеста (форма ПМ) с превью.
// parsed = { people, flightNumber, fileName } | null — владеет родитель.
export default function ManifestUploadField({ parsed, onParsed, onClear }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [parsing, setParsing] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // позволяет выбрать тот же файл повторно
    if (!file) return;
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
    onParsed({
      people: result.people,
      flightNumber: result.flightNumber,
      fileName: file.name,
    });
  };

  const handleClear = () => {
    setError(null);
    onClear();
  };

  if (!parsed) {
    return (
      <div className={classes.wrapper}>
        <button
          type="button"
          className={classes.uploadButton}
          onClick={() => inputRef.current?.click()}
          disabled={parsing}
        >
          {parsing ? "Чтение файла…" : "Загрузить файл"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsb,.xlsx,.xls"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        {error && <div className={classes.error}>{error}</div>}
      </div>
    );
  }

  const counts = parsed.people.reduce((acc, p) => {
    acc[p.personCategory] = (acc[p.personCategory] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={classes.wrapper}>
      <div className={classes.fileRow}>
        <span className={classes.fileName}>{parsed.fileName}</span>
        <button
          type="button"
          className={classes.clear}
          title="Убрать файл"
          onClick={handleClear}
        >
          <CloseIcon color="#545873" />
        </button>
      </div>
      <div className={classes.summary}>
        Пассажиров: {parsed.people.length} (взр {counts.ADULT || 0} · РБ{" "}
        {counts.CHILD || 0} · РМ {counts.INFANT || 0})
      </div>
      <div className={classes.list}>
        {parsed.people.map((p, i) => (
          <div key={i} className={classes.personRow}>
            <span className={classes.personName}>{p.fullName}</span>
            {p.seat && <span className={classes.personSeat}>{p.seat}</span>}
            <CategoryBadge category={p.personCategory} />
          </div>
        ))}
      </div>
    </div>
  );
}
