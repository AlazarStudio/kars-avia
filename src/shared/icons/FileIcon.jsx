import React from "react";
import { fileExt } from "../../utils/fileName.js";

// Иконка файла (дизайн «Иконки файлов»): документ с загнутым углом +
// плашка с расширением белым. По умолчанию плашка серая (#545873),
// опционально цвет по типу через tone. Подпись авто-подгоняется под длину.
export default function FileIcon({
  name,
  ext,
  tone = "#545873",
  width = 32,
  height = 36,
  style,
  ...props
}) {
  const raw = ext != null ? ext : fileExt(name);
  const label = (raw ? String(raw) : "FILE").toUpperCase();
  const textLength = label.length >= 5 ? 26.5 : label.length === 4 ? 25 : 23;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 31 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible", ...style }}
      {...props}
    >
      <path
        d="M4 0.7H20.5L28.2 8.35V33.3Q28.2 34.3 27.2 34.3H3.9Q2.9 34.3 2.9 33.3V1.7Q2.9 0.7 3.9 0.7Z"
        fill="#ffffff"
        stroke="#545873"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 0.85V8.35H28.05"
        fill="none"
        stroke="#545873"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="0" y="12" width="31" height="15" rx="2" fill={tone} />
      <text
        x="15.5"
        y="23.4"
        textAnchor="middle"
        textLength={textLength}
        lengthAdjust="spacingAndGlyphs"
        fill="#ffffff"
        fontFamily="'Open Sans', Arial, sans-serif"
        fontSize="11"
        fontWeight="800"
      >
        {label}
      </text>
    </svg>
  );
}
