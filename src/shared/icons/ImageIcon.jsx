import React from "react";

export default function ImageIcon({ width = 20, height = 20, color = "#9E9E9E", ...rest }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="3"
        stroke={color}
        strokeWidth="1.6"
      />
      <circle cx="8.5" cy="8.5" r="1.6" fill={color} />
      <path
        d="m4 17 4.5-4.5a1.5 1.5 0 0 1 2 0L17 19M14 16l1.5-1.5a1.5 1.5 0 0 1 2 0L20 16.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
