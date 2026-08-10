import PropTypes from "prop-types";

// Инлайн-SVG иконки раздела «Отчёты v2» — рисуются под конкретные размеры и
// цвета макета (stroke="currentColor", чтобы цвет управлялся из CSS через
// `color`). Отдельный файл вместо `src/shared/icons/` — задача ограничена
// правками внутри `ReportsV2/`, а готовых иконок под эти формы там нет.

const iconPropTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
};

export function SearchIcon({ size = 17, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 17 17"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="7.4" cy="7.4" r="5.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 15L11.6 11.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
SearchIcon.propTypes = iconPropTypes;

export function GearIcon({ size = 17, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 17 17"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8.5" cy="8.5" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.1 8.5H14.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.05 11.05L12.88 12.88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 12.1V14.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.95 11.05L4.12 12.88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.9 8.5H2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.95 5.95L4.12 4.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 4.9V2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.05 5.95L12.88 4.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
GearIcon.propTypes = iconPropTypes;

export function TrashIcon({ size = 17, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M7 5V3.5C7 3 7.4 2.5 8 2.5H10C10.6 2.5 11 3 11 3.5V5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 5L5.1 14.2C5.15 14.9 5.7 15.5 6.4 15.5H11.6C12.3 15.5 12.85 14.9 12.9 14.2L13.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.3 8V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.7 8V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
TrashIcon.propTypes = iconPropTypes;

export function DocIcon({ size = 34, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 3H20L27 10V29C27 30.1 26.1 31 25 31H9C7.9 31 7 30.1 7 29V5C7 3.9 7.9 3 9 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M20 3V8C20 9.1 20.9 10 22 10H27" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11.5 17H22.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.5 21.5H22.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.5 26H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
DocIcon.propTypes = iconPropTypes;
