import React from "react";

export default function ArchiveIcon({ onClick, ...props }) {
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
      <rect
        x="1.75"
        y="2.25"
        width="15.5"
        height="4"
        rx="1.25"
        stroke="#545873"
        strokeWidth={strokeWidth}
      />
      <path
        d="M3.25 6.25V14.25C3.25 15.6307 4.36929 16.75 5.75 16.75H13.25C14.6307 16.75 15.75 15.6307 15.75 14.25V6.25"
        stroke="#545873"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 9.75H11.5"
        stroke="#545873"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
