import { useEffect, useRef, useState } from "react";
import classes from "./ServiceFooter.module.css";
import TimeIcon from "../../../shared/icons/TimeIcon";
import Button from "../../Standart/Button/Button";

export default function ServiceFooter({
  statusText,
  onHistory,
  ctaLabel,
  onCta,
  disabled,
  history = [],
}) {
  const [show, setShow] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (show) {
      const handleClickOutside = (event) => {
        if (bottomRef.current && !bottomRef.current.contains(event.target)) {
          setShow(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [show]);
  return (
    <div style={{ position: "relative" }}>
      <div className={classes.serviceFooter}>
        <div
          className={classes.historyBtn}
          onClick={(e) => {
            e.preventDefault();
            setShow((v) => !v);
          }}
        >
          {/* История <TimeIcon /> */}
        <div className={classes.statusLine}>
          <span className={classes.statusDot} />
          Статус услуги: {statusText}
        </div>
        </div>
        {ctaLabel && (
          <Button onClick={onCta} disabled={disabled}>
            {ctaLabel}
          </Button>
        )}
      </div>
      {history.length > 0 && (
        <div
          ref={bottomRef}
          className={`${classes.historyPopup} ${show && classes.show}`}
        >
          {history.map((h, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "12px 1fr auto",
                gap: 8,
                alignItems: "center",
                padding: "20px",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 8,
                  background: h.dot,
                }}
              />
              <span>{h.label}</span>
              <span style={{ color: "#8792A2" }}>{h.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
