// water — bottle of water with cap and label bands
export default function WaterIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <path d="M9 2h6" />
      <path d="M10 2v3M14 2v3" />
      <path d="M8 9c0-2 1.5-4 4-4s4 2 4 4v10a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V9Z" />
      <path d="M8 12h8M8 16h8" />
    </svg>
  );
}
