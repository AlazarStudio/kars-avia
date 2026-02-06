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
          bgcolor: "transparent",
          height: "40px",
          borderRadius: "10px !important",
          "& .MuiOutlinedInput-root": {
            height: "40px", // Устанавливаем фиксированную высоту
            borderRadius: "10px !important",
            fontFamily: "Inter",
            padding: "0 8px",
            fontSize: "14px",
            backgroundColor: "transparent",
            transition: "all 0.3s ease-in-out",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0, 0, 0, 0.23)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0, 0, 0, 0.23)",
            },
            "&:hover": {
              backgroundColor: "white",
            },
            "&.Mui-focused": {
              backgroundColor: "white",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
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
