import PropTypes from "prop-types";

// «Открыть на экране» — документ с лупой. Нарисована в той же системе, что
// DeleteIcon и DownloadReportIcon рядом с ней в строке отчёта: viewBox 19×19,
// цвет #545873, толщина обводки из токена --svg-stroke-width, скруглённые концы.
//
// Глиф выбран из пяти вариантов: он единственный говорит одновременно «отчёт»
// и «посмотреть». Общий EyeIcon сюда не годится дважды — он и про «смотреть
// вообще», без документа, и нарисован в другой системе (свои пропсы size/color,
// фиксированная толщина линии), отчего в ряду с тонкими корзиной и загрузкой
// читался жирнее и мельче соседей.
//
// cursor по умолчанию НЕ выставляется: атрибут на <svg> перебивает курсор
// кнопки-обёртки, и над иконкой стрелка переставала превращаться в руку. Так же
// сделан DownloadReportIcon — у него атрибута нет, и он наследует pointer.
export default function ViewReportIcon({
  onClick,
  color = "#545873",
  width = 19,
  height = 19,
  strokeWidth = "var(--svg-stroke-width)",
  cursor,
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 19 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick ?? null}
      {...(cursor ? { cursor } : null)}
    >
      {/* Лист: правый край обрывается на 8.2 — дальше его перекрывает лупа. */}
      <path
        d="M11.6 1.2H4.6C3.9 1.2 3.3 1.8 3.3 2.5V16.5C3.3 17.2 3.9 17.8 4.6 17.8H10.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6 1.2L15.2 4.9V8.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Три строки текста разной длины — они и делают лист «реестром». */}
      <path
        d="M6 5.6H9.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 8.4H11.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 11.2H8.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.4 13.1C16.4 15 14.9 16.5 13 16.5C11.1 16.5 9.6 15 9.6 13.1C9.6 11.2 11.1 9.7 13 9.7C14.9 9.7 16.4 11.2 16.4 13.1Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 15.7L17.9 18.1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

ViewReportIcon.propTypes = {
  onClick: PropTypes.func,
  color: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  strokeWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  cursor: PropTypes.string,
};
