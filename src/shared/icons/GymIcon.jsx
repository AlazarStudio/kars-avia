// gym — dumbbell
export default function GymIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <path d="M3 9v6" />
      <rect x="5" y="6.5" width="3.5" height="11" rx="1.2" />
      <path d="M8.5 12h7" />
      <rect x="15.5" y="6.5" width="3.5" height="11" rx="1.2" />
      <path d="M21 9v6" />
    </svg>
  );
}
