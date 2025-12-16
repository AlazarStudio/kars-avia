import React from "react";
import classes from "./Button.module.css";
import { Link } from "react-router-dom";

function Button({ children, timeLeft, dataObject, ...props }) {
  const buttonStyles = {
    // Используем CSS-переменные
    "--button-padding": props.padding || "0 30px",
    // ...(props.flex ? {'--button-flex': props.flex} : null),
    ...(props.flex ? { flex: props.flex } : null),
    "--button-min-width": props.minwidth,
    "--button-max-width": props.maxWidth,
    // '--button-width': props.width,
    "--button-height": props.height || "40px",
    // '--button-display': "flex",
    // '--button-justify-content': "center",
    // '--button-align-items': "center",
    // '--button-transition': "all 0.3s ease-in-out",
    "--button-cursor": props.cursor || "pointer",
    // '--button-opacity': props.opacity || "0.8",
    "--button-bg-color": props.backgroundcolor || "#0057C3",
    "--button-color": props.color || "#fff",
    "--button-font-size": props.fontSize || "15px",
    "--button-font-weight": props.fontWeight || "400",
    "--button-border": props.border || "none",
  };

  if (timeLeft > 0) {
    buttonStyles["--button-cursor"] = "not-allowed";
    buttonStyles["--button-opacity"] = "0.5";
  }

  return props.link ? (
    <Link
      to={props.link}
      state={dataObject ? { dataObject } : {}}
      className={classes.Button}
      style={buttonStyles}
      {...props}
    >
      {children}
    </Link>
  ) : (
    <button className={classes.Button} style={buttonStyles} {...props}>
      {children}
    </button>
  );
}

export default Button;

// import React from "react";
// import classes from './Button.module.css';
// import { Link } from "react-router-dom";

// function Button({ children, timeLeft, dataObject, ...props }) {
//     const buttonStyles = {
//         padding: props.padding,
//         minWidth: props.minwidth,
//         maxWidth: props.maxWidth,
//         width: props.width,
//         height: props.height,
//         cursor: props.cursor || "pointer",
//         opacity: props.opacity,
//         backgroundColor: props.backgroundColor,
//         color: props.color,
//         disabled: props.disabled,
//         userSelect: props.userSelect,
//         border: "none",
//     };

//     if (timeLeft > 0) {
//         buttonStyles.cursor = 'not-allowed';
//         buttonStyles.opacity = '0.5';
//     }

//     return (
//         props.link ?
//         <Link to={props.link} state={dataObject ? { dataObject } : {}} className={classes.Button} style={buttonStyles} {...props}>
//             {children}
//         </Link>
//         :
//         <button className={classes.Button} style={buttonStyles} {...props}>
//             {children}
//         </button>
//     );
// }

// export default Button;
