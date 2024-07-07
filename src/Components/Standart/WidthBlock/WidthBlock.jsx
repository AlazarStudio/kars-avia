import React from "react";
import classes from './WidthBlock.module.css';

function WidthBlock({ children, ...props }) {
    return ( 
        <>
            <div {...props} className={classes.WidthBlock}>
                {children}
            </div>
        </>
     );
}

export default WidthBlock;