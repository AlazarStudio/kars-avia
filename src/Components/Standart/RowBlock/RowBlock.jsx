import React from "react";
import classes from './RowBlock.module.css';

function RowBlock({ children, ...props }) {
    return ( 
        <>
            <div className={classes.RowBlock} style={{
                width: props.width,
                height: props.height,
                gap: props.gap,
                background: `url(${props.background})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover'
            }}>
                {children}
            </div>
        </>
     );
}

export default RowBlock;