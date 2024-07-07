import React from "react";
import classes from './Input.module.css';

function Input({ children, ...props }) {
    return (
        <div className={classes.input} style={{ width: props.width ? props.width : null }}>
            <input type={props.type ? props.type : 'text'} style={{ 
                background: props.background ? props.background : null,
                padding: props.needSearchButton ? '8px 35px 8px 15px' : '8px 15px'
                }} />
            {props.needSearchButton ?
                <img className={classes.search} src="/searchButton.png" alt="" />
                : null}
        </div>
    );
}

export default Input;