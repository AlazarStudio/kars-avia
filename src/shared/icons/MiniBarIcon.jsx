// minibar — compact fridge with handle
export default function MiniBarIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <rect x="5" y="2.5" width="14" height="19" rx="2" />
      <path d="M5 9h14" />
      <path d="M8 5.5v2" />
      <path d="M8 12v3" />
    </svg>
  );
}
