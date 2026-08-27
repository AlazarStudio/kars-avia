// laundry — washing machine with drum
export default function LaundryIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <rect x="4" y="2.5" width="16" height="19" rx="2.5" />
      <path d="M4 7h16" />
      <circle cx="12" cy="14" r="4.5" />
      <path d="M8.5 13c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0" />
      <path d="M7 4.8h2" />
    </svg>
  );
}
