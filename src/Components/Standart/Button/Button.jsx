import React from "react";
import classes from './Button.module.css';
import { Link } from "react-router-dom";

function Button({ children, timeLeft, ...props }) {
    const buttonStyles = {
        width: props.width, 
        height: props.height, 
        cursor: props.cursor, 
        opacity: props.opacity,
    };

    if (timeLeft > 0) {
        buttonStyles.cursor = 'not-allowed';
        buttonStyles.opacity = '0.5';
    }

    return (
        <Link to={props.link} className={classes.Button} style={buttonStyles} {...props}>
            {children}
        </Link>
    );
}

export default Button;
