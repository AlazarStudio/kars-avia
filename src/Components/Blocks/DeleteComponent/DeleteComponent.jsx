import React from "react";
import classes from "./DeleteComponent.module.css";

function DeleteComponent({
  children,
  remove,
  close,
  index,
  isCancel,
  ...props
}) {
  return (
    <div className={classes.deleteCenter}>
      <div className={classes.delete}>
        <div className={classes.delete_title}>{props.title}</div>
        <div className={classes.delete_btns}>
          <div className={classes.delete_btns_cancel} onClick={close}>
            {isCancel ? "Нет" : "Отмена"}
          </div>
          <div
            className={classes.delete_btns_delete}
            onClick={() => remove(index)}
          >
            {isCancel ? "Да" : "Удалить"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteComponent;
