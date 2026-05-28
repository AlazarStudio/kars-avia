// baggage — suitcase with handle, latch and divider
export default function BaggageIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M9 8V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" />
      <path d="M3 12h18" />
      <path d="M8 14v4M16 14v4" />
      <path d="M11 6h2" />
    </svg>
  );
}
