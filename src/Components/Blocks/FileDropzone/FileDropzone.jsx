import React, { useRef, useState } from "react";
import classes from "./FileDropzone.module.css";
import FileIcon from "../../../shared/icons/FileIcon.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";

// Зона загрузки файла: drag-and-drop + выбор с диска.
// Файлом владеет родитель: fileName задан → показывается карточка файла.
// meta — узел с краткой сводкой по разобранному файлу (строки, пассажиры и т.п.).
export default function FileDropzone({
  accept,
  hint,
  iconExt = "XLS",
  fileName,
  meta,
  parsing = false,
  error,
  onFile,
  onClear,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const handleInput = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // позволяет выбрать тот же файл повторно
    if (file) onFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (parsing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      onChange={handleInput}
      style={{ display: "none" }}
    />
  );

  const errorNode = error && (
    <div className={classes.error} role="alert">
      {error}
    </div>
  );

  if (!fileName) {
    return (
      <div className={classes.wrapper}>
        <div
          className={[
            classes.dropzone,
            dragging ? classes.dragging : "",
            error ? classes.invalid : "",
            parsing ? classes.busy : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role="button"
          tabIndex={parsing ? -1 : 0}
          aria-label="Загрузить файл"
          onClick={() => !parsing && openPicker()}
          onKeyDown={(e) => {
            if (parsing) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!parsing) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {parsing ? (
            <>
              <span className={classes.spinner} />
              <span className={classes.title}>Чтение файла…</span>
            </>
          ) : (
            <>
              <FileIcon ext={iconExt} tone="#007AFF" width={30} height={34} />
              <span className={classes.title}>
                Перетащите файл или{" "}
                <span className={classes.link}>выберите на компьютере</span>
              </span>
              {hint && <span className={classes.hint}>{hint}</span>}
            </>
          )}
        </div>
        {input}
        {errorNode}
      </div>
    );
  }

  return (
    <div className={classes.wrapper}>
      <div className={`${classes.card} ${error ? classes.invalid : ""}`}>
        <FileIcon
          name={fileName}
          tone="#007AFF"
          width={30}
          height={34}
          style={{ flexShrink: 0 }}
        />
        <div className={classes.cardMain}>
          <div className={classes.fileName} title={fileName}>
            {fileName}
          </div>
          {meta && <div className={classes.metaRow}>{meta}</div>}
        </div>
        <button
          type="button"
          className={classes.replace}
          onClick={openPicker}
          disabled={parsing}
        >
          {parsing ? "Чтение…" : "Заменить"}
        </button>
        {onClear && (
          <button
            type="button"
            className={classes.clear}
            title="Убрать файл"
            aria-label="Убрать файл"
            onClick={onClear}
          >
            <CloseIcon color="#545873" />
          </button>
        )}
      </div>
      {input}
      {errorNode}
    </div>
  );
}
