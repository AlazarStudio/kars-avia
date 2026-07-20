import React from "react";
import classes from "./FapRegistryButton.module.css";
import PeopleCountIcon from "../../../../shared/icons/PeopleCountIcon";

// Кнопка-чип «Реестр» с иконкой людей и счётчиком-бейджем.
export default function FapRegistryButton({ count = 0, onClick }) {
  return (
    <button type="button" className={classes.btn} onClick={onClick}>
      <span className={classes.icon}>
        <PeopleCountIcon />
      </span>
      <span className={classes.label}>Реестр</span>
      {count > 0 && <span className={classes.badge}>{count}</span>}
    </button>
  );
}
