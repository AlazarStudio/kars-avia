import React from "react";
import classes from "./MUITextField.module.css";
import { TextField } from "@mui/material";

function MUITextField({
  children,
  value,
  onChange,
  className,
  label,
  ...props
}) {
  return (
    <>
      <TextField
        type="search"
        label={label}
        className={className}
        value={value}
        onChange={onChange}
        sx={{
          bgcolor: "white",
          height: "40px",
          borderRadius: "10px !important",
          "& .MuiOutlinedInput-root": {
            height: "40px", // Устанавливаем фиксированную высоту
            borderRadius: "5px",
            fontFamily: "Inter",
            // padding: "0 10px",
            fontSize: "14px",
            borderRadius: "10px !important",
          },

          "& label": {
            top: "50%",
            padding: "0 12px",
            transform: "translateY(-50%)",
            transition: "all 0.1s ease-out", // Плавная анимация при фокусе
            fontSize: "14px",
          },
          "& .MuiInputBase-root": {
            minHeight: "40px",
            display: "flex",
            alignItems: "center",
            fontSize: "14px",
            padding: "0",
            borderRadius: "10px !important",
          },
          "& .MuiOutlinedInput-root": {
            padding: "0 8px",
          },
          "& .MuiInputLabel-shrink": {
            padding: "0",
            top: "0px",
            transform: "translate(14px, -9px) scale(0.75)", // Обычное поведение при фокусе
          },
        }}
      />
    </>
  );
}

export default MUITextField;
