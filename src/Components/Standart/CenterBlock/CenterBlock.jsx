import React from "react";
import classes from './CenterBlock.module.css';

function CenterBlock({ children, ...props }) {
    return ( 
        <>
            <div {...props} className={classes.CenterBlock} style={{
                width: props.width,
                height: props.height,
                gap: props.gap,
                background: `url(${props.background})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                margin: props.margin,
                padding: props.padding,
            }}>
                {children}
            </div>
        </>
     );
}

export default CenterBlock;