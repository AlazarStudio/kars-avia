import React from "react";

// Иконка пролонгации (круговая стрелка обновления).
export default function ProlongIcon({
  onClick,
  color = "#545873",
  width = 20,
  height = 20,
  strokeWidth = "var(--svg-stroke-width)",
  ...props
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick ?? null}
      cursor={props.cursor ?? "default"}
    >
      <path
        d="M15.6 6.3A6.5 6.5 0 1 0 16.9 12.4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M15.9 3v3.6h-3.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
