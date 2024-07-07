import React from "react";
import classes from './H1.module.css';

function H1({ children, ...props }) {
    return (
        <>
            <h1 style={{
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
            }}>
                {children}
            </h1>
        </>
    );
}

export default H1;