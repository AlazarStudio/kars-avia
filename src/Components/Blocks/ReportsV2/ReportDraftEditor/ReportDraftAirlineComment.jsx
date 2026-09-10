import PropTypes from "prop-types";
import classes from "./ReportDraftAirlineComment.module.css";
import { convertToDate } from "../../../../../graphQL_requests";

// Последний комментарий авиакомпании к черновику — плашкой между шапкой и
// сводкой. Чисто UI: note собирает draftAirlineNote (reportDraftComment.js),
// кто смотрит — решает ReportsV2.
export default function ReportDraftAirlineComment({ note, isAirlineViewer = false }) {
  if (!note) return null;

  // Возвращённый черновик — DRAFT, и бэк его авиакомпании не отдаёт; но между
  // ответом мутации возврата и закрытием экрана кэш уже несёт rejectedAt —
  // в этот миг ей говорим «вы», а не «авиакомпания».
  const title = note.rejected
    ? isAirlineViewer
      ? "Вы вернули отчёт на доработку"
      : "Авиакомпания вернула отчёт на доработку"
    : isAirlineViewer
      ? "Ваш комментарий при прошлом возврате"
      : "Комментарий авиакомпании при прошлом возврате";
  // Пустое значение отсекаем до вызова: convertToDate(null) даёт «01.01.1970».
  const date = note.at ? convertToDate(note.at) : "";

  return (
    <div className={`${classes.note} ${note.rejected ? classes.rejected : ""}`}>
      <div className={classes.head}>
        <span className={classes.title}>{title}</span>
        {date && <span className={classes.date}>{date}</span>}
      </div>
      <div className={classes.text}>{note.text}</div>
    </div>
  );
}

ReportDraftAirlineComment.propTypes = {
  note: PropTypes.shape({
    rejected: PropTypes.bool.isRequired,
    text: PropTypes.string.isRequired,
    at: PropTypes.string,
  }),
  isAirlineViewer: PropTypes.bool,
};
