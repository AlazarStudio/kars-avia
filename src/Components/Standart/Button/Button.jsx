import React from "react";
import classes from './Button.module.css';
import { Link } from "react-router-dom";

function Button({ children, timeLeft, dataObject, ...props }) {
    const buttonStyles = {
        width: props.width,
        height: props.height,
        cursor: props.cursor,
        opacity: props.opacity,
        backgroundColor: props.backgroundColor
    };

    if (timeLeft > 0) {
        buttonStyles.cursor = 'not-allowed';
        buttonStyles.opacity = '0.5';
    }

    return (
        <Link to={props.link} state={dataObject ? { dataObject } : {}} className={classes.Button} style={buttonStyles} {...props}>
            {children}
        </Link>
    );
}

export default Button;
