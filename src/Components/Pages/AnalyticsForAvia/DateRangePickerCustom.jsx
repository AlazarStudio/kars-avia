import React from "react";
import { DateRange } from "react-date-range";
import { addDays } from "date-fns";
import ru from "date-fns/locale/ru";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

function DateRangePickerCustom({ onChange, onClose, value }) {
  const [range, setRange] = React.useState([
    value || {
      startDate: addDays(new Date(), -7),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const overlayStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalStyles = {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    position: "relative",
  };

  const footerStyles = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "10px",
    gap: "10px",
  };

  const buttonStyles = {
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
  };

  const applyButtonStyles = {
    ...buttonStyles,
    backgroundColor: "#1d4ed8",
    color: "#fff",
  };

  const cancelButtonStyles = {
    ...buttonStyles,
    backgroundColor: "#e5e7eb",
    color: "#111827",
  };

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        <DateRange
          editableDateInputs={true}
          onChange={(item) => setRange([item.selection])}
          moveRangeOnFirstSelection={false}
          ranges={range}
          locale={ru}
          months={2}
          direction="horizontal"
        />
        <div style={footerStyles}>
          <button
            style={cancelButtonStyles}
            onClick={onClose}
          >
            Отменить
          </button>
          <button
            style={applyButtonStyles}
            onClick={() => onChange(range[0])}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

export default DateRangePickerCustom;
