import PropTypes from "prop-types";

// Знак процента: наклонная линия + два кружка. color задаёт цвет линии.
export default function PercentIcon({ size = 18, color = "#545873", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <line x1="19" y1="5" x2="5" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="6.5" cy="6.5" r="2.5" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="17.5" cy="17.5" r="2.5" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  );
}

PercentIcon.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  color: PropTypes.string,
};
