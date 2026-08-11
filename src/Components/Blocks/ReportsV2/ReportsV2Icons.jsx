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
