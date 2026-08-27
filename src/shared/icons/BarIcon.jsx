// bar — cocktail glass with straw
export default function BarIcon({ size = 18, strokeWidth = 1.8, ...props }) {
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
      <path d="M4 5h16l-8 8z" />
      <path d="M12 13v7" />
      <path d="M8.5 20h7" />
      <path d="M15 8l3-4" />
    </svg>
  );
}
