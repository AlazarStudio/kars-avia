import React from "react";

// Горизонтальное «⋯» (три точки). color задаёт цвет точек.
export default function DotsIcon({ size = 18, color = "#545873", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="5" cy="12" r="1.7" fill={color} />
      <circle cx="12" cy="12" r="1.7" fill={color} />
      <circle cx="19" cy="12" r="1.7" fill={color} />
    </svg>
  );
}
