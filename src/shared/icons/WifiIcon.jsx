// wifi — three signal arcs over a dot
export default function WifiIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <path d="M2.5 8.5a15 15 0 0 1 19 0" />
      <path d="M5.5 12.2a10.5 10.5 0 0 1 13 0" />
      <path d="M8.5 15.9a6 6 0 0 1 7 0" />
      <circle cx="12" cy="19.3" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
