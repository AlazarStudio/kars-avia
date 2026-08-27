// sauna — heated stones with rising steam
export default function SaunaIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <path d="M8 9c1.2-1 1.2-2.2 0-3.2S6.8 3.6 8 2.6" />
      <path d="M12.5 9c1.2-1 1.2-2.2 0-3.2s-1.2-2.2 0-3.2" />
      <path d="M17 9c1.2-1 1.2-2.2 0-3.2s-1.2-2.2 0-3.2" />
      <rect x="3" y="12" width="18" height="9" rx="2" />
      <path d="M3 16h18" />
    </svg>
  );
}
