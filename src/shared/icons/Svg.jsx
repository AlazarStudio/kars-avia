import React from "react";

export default function Svg({
  width = 18,
  height = 18,
  title,
  children,
  ...rest
}) {
  return (
    <svg
      onClick={rest.onClick}
      width={width}
      height={height}
      // viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      // cursor={rest.cursorPointer && "pointer"}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
