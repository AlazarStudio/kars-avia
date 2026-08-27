// pool — ladder over water waves
export default function PoolIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <path d="M8 14V5a2 2 0 0 1 4 0" />
      <path d="M15 14V5a2 2 0 0 1 4 0" />
      <path d="M8 8.5h7" />
      <path d="M8 11.5h7" />
      <path d="M2 17.5c1.6 0 1.6 1.5 3.2 1.5s1.6-1.5 3.2-1.5 1.6 1.5 3.2 1.5 1.6-1.5 3.2-1.5 1.6 1.5 3.2 1.5 1.6-1.5 3.2-1.5" />
    </svg>
  );
}
