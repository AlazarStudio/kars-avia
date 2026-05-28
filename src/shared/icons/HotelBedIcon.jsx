// living — bed with pillow + headboard. Reads as hotel room.
export default function HotelBedIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <path d="M3 20v-9a2 2 0 0 1 2-2h6v6" />
      <path d="M11 15h10v5" />
      <path d="M3 17h18" />
      <rect x="5" y="11" width="5" height="3" rx="1" />
      <path d="M3 20v1M21 20v1" />
    </svg>
  );
}
