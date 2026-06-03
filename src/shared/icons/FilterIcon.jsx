import React from "react";

export default function FilterIcon({ onClick, ...props }) {
  const strokeWidth = props.strokeWidth ?? "var(--svg-stroke-width)";
  const stroke = props.stroke ?? "#545873";
  return (
    <svg
      width={props.width ? props.width : "18"}
      height={props.height ? props.height : "18"}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick ? onClick : null}
      cursor={props.cursor ? props.cursor : "default"}
    >
      <path
        d="M2.5 4.16667H17.5L12.5 10.8333V16.6667L7.5 14.1667V10.8333L2.5 4.16667Z"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
