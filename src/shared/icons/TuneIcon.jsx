import React from "react";

// Иконка «фильтры» — горизонтальные слайдеры.
export default function TuneIcon({ onClick, ...props }) {
  return (
    <svg
      width={props.width ? props.width : "20"}
      height={props.height ? props.height : "18"}
      viewBox="0 0 20 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick ? onClick : null}
      cursor={props.cursor ? props.cursor : "default"}
    >
      <path
        d="M5 18H3V16H0V14H3V12H5V18ZM20 16H7V14H20V16ZM15 12H13V10H0V8H13V6.012H15V12ZM20 10H17V8H20V10ZM9 6H7V4H0V2H7V0H9V6ZM20 4H11V2H20V4Z"
        fill="#545873"
      />
    </svg>
  );
}
