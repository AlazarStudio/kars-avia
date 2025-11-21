import React from "react";
import Svg from "./Svg.jsx";

export default function CopyIcon({ onClick, ...props }) {
  return (
    <svg
      width="18"
      height="20"
      viewBox="0 0 16 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.5 12.1667V2.16667C0.5 1.24619 1.24619 0.5 2.16667 0.5H10.5M5.5 17.1667H13C13.9205 17.1667 14.6667 16.4205 14.6667 15.5V5.5C14.6667 4.57952 13.9205 3.83333 13 3.83333H5.5C4.57952 3.83333 3.83333 4.57952 3.83333 5.5V15.5C3.83333 16.4205 4.57952 17.1667 5.5 17.1667Z"
        stroke="var(--blue)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
