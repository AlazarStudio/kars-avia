import PropTypes from "prop-types";
import classes from "./FapAirlineCommentNote.module.css";
import { formatDateTime } from "../fapConstants";

// Последнее слово авиакомпании по отчёту гостиницы — плашкой под шапкой
// страницы, чтобы её видели на любой вкладке. Чисто UI: что показывать и
// кому, решает FapHotelPage.
export default function FapAirlineCommentNote({ comment, revoked = false, isAirlineViewer = false }) {
  if (!comment?.text) return null;

  const title = revoked
    ? isAirlineViewer
      ? "Вы отозвали утверждение отчёта"
      : "Авиакомпания отозвала утверждение отчёта"
    : "Комментарий авиакомпании";

  return (
    <div className={`${classes.note} ${revoked ? classes.revoked : ""}`}>
      <div className={classes.head}>
        <span className={classes.title}>{title}</span>
        {comment.at && <span className={classes.date}>{formatDateTime(comment.at)}</span>}
      </div>
      <div className={classes.text}>{comment.text}</div>
    </div>
  );
}

FapAirlineCommentNote.propTypes = {
  // { text, at } из hotelReportAirlineComment (fapReportAccess.js)
  comment: PropTypes.shape({
    text: PropTypes.string.isRequired,
    at: PropTypes.string,
  }),
  revoked: PropTypes.bool,
  isAirlineViewer: PropTypes.bool,
};
