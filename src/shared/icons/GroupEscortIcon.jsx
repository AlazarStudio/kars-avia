// group kind ESCORT — open palm holding a heart
export default function GroupEscortIcon({ size = 14, strokeWidth = 1.8, ...props }) {
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
      <path d="M12 9.2 11.3 8.5a1.8 1.8 0 0 0-2.6 2.5L12 14l3.3-3a1.8 1.8 0 0 0-2.6-2.5z" />
      <path d="M4 16v-3a1.2 1.2 0 0 1 2.4 0v2" />
      <path d="M6.4 16.5V15a1.2 1.2 0 0 1 2.4 0v1.5" />
      <path d="M4 16c0 2.8 2.4 4.5 5.5 4.5h5c3 0 5.5-1.7 5.5-4.5" />
    </svg>
  );
}
