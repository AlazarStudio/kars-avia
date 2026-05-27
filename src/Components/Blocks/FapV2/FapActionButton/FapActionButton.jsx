import React from "react";
import classes from "./FapActionButton.module.css";

// Единая кнопка действий ФАП v2.
// variant: "primary" | "secondary" | "danger"
// onDark: стиль для тёмного баннера; active: подсветка toggle (напр. История)
export default function FapActionButton({
  variant = "secondary",
  onDark = false,
  active = false,
  className = "",
  children,
  ...props
}) {
  const cls = [
    classes.btn,
    classes[variant],
    onDark ? classes.onDark : "",
    active ? classes.active : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}
