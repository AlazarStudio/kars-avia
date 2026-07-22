// group kind GROUP — three figures
export default function GroupTeamIcon({ size = 14, strokeWidth = 1.8, ...props }) {
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
      <circle cx="12" cy="8" r="2.6" />
      <path d="M8 19v-1.2a4 4 0 0 1 8 0V19" />
      <circle cx="5" cy="10" r="1.9" />
      <path d="M2 18v-.8a3 3 0 0 1 3.6-2.9" />
      <circle cx="19" cy="10" r="1.9" />
      <path d="M22 18v-.8a3 3 0 0 0-3.6-2.9" />
    </svg>
  );
}
