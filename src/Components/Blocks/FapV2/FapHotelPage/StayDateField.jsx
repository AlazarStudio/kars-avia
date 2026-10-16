import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fromLocalInputValue, toLocalInputValue } from "../fapConstants";

// Ячейка заезда/выезда в редакторе отчёта. Нативный datetime-local отдаёт ""
// и на очистку, и на недонабранное значение, поэтому наверх уходит только
// полное значение, а пустое — на blur: очищенная ячейка возвращает дату по плану.
export default function StayDateField({ value, onCommit, readOnly = false, className, title }) {
  const [draft, setDraft] = useState(toLocalInputValue(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(toLocalInputValue(value));
  }, [value, focused]);

  return (
    <input
      type="datetime-local"
      className={className}
      value={draft}
      readOnly={readOnly}
      title={title}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const next = e.target.value;
        setDraft(next);
        const iso = fromLocalInputValue(next);
        if (iso && next !== toLocalInputValue(value)) onCommit(iso);
      }}
      onBlur={(e) => {
        setFocused(false);
        if (!readOnly && !e.target.value) onCommit(null);
      }}
    />
  );
}

StayDateField.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onCommit: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  className: PropTypes.string,
  title: PropTypes.string,
};
