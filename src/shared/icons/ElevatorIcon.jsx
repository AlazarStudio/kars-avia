// elevator — shaft with up/down arrows
export default function ElevatorIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <rect x="4" y="2.5" width="16" height="19" rx="2" />
      <path d="M12 2.5v19" />
      <path d="M6.5 11l2-2.5 2 2.5" />
      <path d="M15.5 13l2 2.5 2-2.5" />
    </svg>
  );
}
