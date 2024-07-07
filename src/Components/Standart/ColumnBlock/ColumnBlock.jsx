import React from "react";
import classes from './ColumnBlock.module.css';

function ColumnBlock({ children, ...props }) {
    return (
        <>
            <div className={classes.ColumnBlock} style={{
                width: props.width,
                height: props.height,
                padding: props.padding,
                gap: props.gap,
                background: `url(${props.background})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                justifyContent: props.justifyContent,
                borderRadius: props.borderRadius
            }}>
                {children}
            </div>
        </>
    );
}

export default ColumnBlock;