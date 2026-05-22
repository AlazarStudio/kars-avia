import React from "react";

export default function RestoreIcon({ onClick, ...props }) {
  const strokeWidth = props.strokeWidth ?? "var(--svg-stroke-width)";
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick ?? null}
      cursor={props.cursor ?? "default"}
    >
      <path
        d="M3.5 9.5C3.5 6.04822 6.29822 3.25 9.75 3.25C13.2018 3.25 16 6.04822 16 9.5C16 12.9518 13.2018 15.75 9.75 15.75C7.4 15.75 5.35 14.46 4.27 12.55"
        stroke="#545873"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 6.5L3.5 9.75L6.75 8.25"
        stroke="#545873"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
