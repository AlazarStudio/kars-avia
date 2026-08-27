// air conditioning — wall unit with airflow
export default function AirConditionerIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <rect x="2.5" y="4" width="19" height="7" rx="2" />
      <path d="M6 8h12" />
      <path d="M7 14c0 1.5 1.5 1.5 1.5 3" />
      <path d="M12 14c0 1.5 1.5 1.5 1.5 3" />
      <path d="M17 14c0 1.5-1.5 1.5-1.5 3" />
    </svg>
  );
}
