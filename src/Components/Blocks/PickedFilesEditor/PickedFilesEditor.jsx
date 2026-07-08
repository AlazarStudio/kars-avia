import React from "react";
import classes from "./PickedFilesEditor.module.css";
import FileIcon from "../../../shared/icons/FileIcon.jsx";
import DeleteIcon from "../../../shared/icons/DeleteIcon.jsx";
import { fileNameWithoutExt } from "../../../utils/fileName.js";

// Список выбранных (ещё не сохранённых) файлов с редактируемым именем.
// names — массив полных имён (base + .ext), выровнен по массиву File-объектов в родителе.
// onChange отдаёт обновлённый массив имён; onRemove(index) убирает файл.
// Расширение не редактируется — показывается статичным суффиксом.
export default function PickedFilesEditor({
  names = [],
  onChange,
  onRemove,
  disabled,
}) {
  if (!names.length) return null;

  const rename = (index, base) => {
    const name = names[index];
    const ext = name.slice(fileNameWithoutExt(name).length); // ".pdf" (сохраняем регистр) или ""
    const next = names.map((n, i) => (i === index ? base + ext : n));
    onChange?.(next);
  };

  return (
    <div className={classes.list}>
      {names.map((name, index) => {
        const ext = name.slice(fileNameWithoutExt(name).length);
        return (
          <div key={index} className={classes.row}>
            <FileIcon
              name={name}
              width={38}
              height={43}
              style={{ flexShrink: 0 }}
            />
            <div className={classes.field}>
              <input
                type="text"
                className={classes.input}
                value={fileNameWithoutExt(name)}
                onChange={(e) => rename(index, e.target.value)}
                placeholder={`файл №${index + 1}`}
                disabled={disabled}
              />
              {ext && <span className={classes.ext}>{ext}</span>}
            </div>
            {!disabled && onRemove && (
              <div
                className={classes.remove}
                onClick={() => onRemove(index)}
                title="Убрать файл"
              >
                <DeleteIcon cursor="pointer" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
