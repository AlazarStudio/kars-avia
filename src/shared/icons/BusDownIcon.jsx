// transferDeparture (to airport) — shuttle van with DOWN arrow
export default function BusDownIcon({ size = 18, strokeWidth = 1.8, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2" y="6" width="13" height="10" rx="2" />
      <path d="M2 12h13" />
      <path d="M5 6V4h7v2" />
      <circle cx="5.5" cy="18" r="1.3" />
      <circle cx="12" cy="18" r="1.3" />
      <path d="M19 8v8" />
      <path d="M16 13l3 3 3-3" />
    </svg>
  );
}
