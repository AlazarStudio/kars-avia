import React from "react";
import classes from "./PersonTypeToggle.module.css";
import { PERSON_TYPE_CONFIG } from "../fapConstants";

const ORDER = ["PASSENGER", "CREW"];

export default function PersonTypeToggle({ value, onChange }) {
  return (
    <div className={classes.toggle}>
      {ORDER.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`${classes.option} ${value === key ? classes.optionActive : ""}`}
        >
          {PERSON_TYPE_CONFIG[key].label}
        </button>
      ))}
    </div>
  );
}
