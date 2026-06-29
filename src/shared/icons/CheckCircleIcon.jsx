import React from "react";

export default function CheckCircleIcon({ width = 16, height = 16, color = "#22C55E", ...rest }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <circle cx="8" cy="8" r="8" fill={color} />
      <path
        d="M4.75 8.25 7 10.5l4.25-4.5"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
