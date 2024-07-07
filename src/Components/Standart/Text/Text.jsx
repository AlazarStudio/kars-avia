import React from "react";
import classes from './Text.module.css';

function Text({ children, ...props }) {
    return (
        <>
            <div className={classes.Text} style={{
                fontFamily: props.font_family,
                fontSize: props.font_size,
                fontWeight: props.font_weight,
                textAlign: props.text_align,
                lineHeight: props.line_height,
                letterSpacing: props.letter_spacing,
                width: props.width,
                height: props.height,
                padding: props.padding,
                margin: props.margin,
                display: props.display,
                color: props.color,
            }}>
                {children}
            </div>
        </>
    );
}

export default Text;