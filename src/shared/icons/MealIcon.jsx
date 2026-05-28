// meal — covered serving tray (room service dome)
export default function MealIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <path d="M3 19h18" />
      <path d="M4 19a8 8 0 0 1 16 0" />
      <path d="M12 11V8" />
      <circle cx="12" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M8 16h8" />
    </svg>
  );
}
