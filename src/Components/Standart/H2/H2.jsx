import React from "react";
import classes from './H2.module.css';

function H2({ children, ...props }) {
    return (
        <>
            <h2 style={{
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
            </h2>
        </>
    );
}

export default H2;