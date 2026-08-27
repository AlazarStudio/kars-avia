// safe — strongbox with combination dial
export default function SafeIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <rect x="3" y="4" width="18" height="15" rx="2" />
      <circle cx="10.5" cy="11.5" r="3.5" />
      <path d="M10.5 9.5v2" />
      <path d="M17 9.5v4" />
      <path d="M6 19v2M18 19v2" />
    </svg>
  );
}
