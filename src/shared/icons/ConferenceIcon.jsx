// conference hall — presentation board with a stand
export default function ConferenceIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <rect x="3" y="3" width="18" height="12" rx="2" />
      <path d="M7 11l3-3 2.5 2 3.5-4" />
      <path d="M12 15v3" />
      <path d="M8.5 21l3.5-3 3.5 3" />
    </svg>
  );
}
