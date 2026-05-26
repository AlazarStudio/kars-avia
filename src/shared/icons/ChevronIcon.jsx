import React from "react";

// Шеврон вниз. Поворотом (rotate) используется для аккордеонов и нав-карточек.
export default function ChevronIcon(props) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
