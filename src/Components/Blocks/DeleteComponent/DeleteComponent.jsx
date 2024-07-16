import React from "react";
import classes from './DeleteComponent.module.css';

function DeleteComponent({ children, ...props }) {
    return (
        <div className={classes.deleteCenter}>
            <div className={classes.delete}>
                <div className={classes.delete_title}>{props.title}</div>
                <div className={classes.delete_btns}>
                    <div className={classes.delete_btns_cancel}>Отмена</div>
                    <div className={classes.delete_btns_delete}>Удалить</div>
                </div>
            </div>
        </div>
    );
}

export default DeleteComponent;