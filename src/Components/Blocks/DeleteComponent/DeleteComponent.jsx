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
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      close?.();
    }
  };

  return (
    <div className={classes.deleteCenter} onClick={handleOverlayClick}>
      <div className={classes.delete} onClick={(event) => event.stopPropagation()}>
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
