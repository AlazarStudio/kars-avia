import React from "react";
import classes from "./MUIAutocomplete.module.css";
import { Autocomplete, TextField } from "@mui/material";

function MUIAutocomplete({
  label,
  options,
  value,
  onChange,
  dropdownWidth,
  children,
  ...props
}) {
  return (
    <>
      <Autocomplete
        options={options ? options : []}
        disablePortal
        slotProps={{
          popper: {
            modifiers: [
              {
                name: "preventOverflow",
                options: {
                  boundary: "window",
                },
              },
            ],
          },
          listbox: {
            sx: {
              fontSize: "14px", // Уменьшаем размер шрифта списка
              padding: "0",
            },
          },
          paper: {
            sx: {
              "& .MuiAutocomplete-noOptions": {
                fontSize: "14px", // Уменьшаем шрифт текста "Нет вариантов"
                textAlign: "center",
                color: "gray", // Можно поменять цвет текста
                padding: "8px", // Добавляем отступ для удобства
              },
            },
          },
        }}
        value={value}
        onChange={onChange}
        noOptionsText="Ничего не найдено."
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant="outlined"
            sx={{
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
              },
              "& .MuiOutlinedInput-root": {
                padding: "0 px",
              },
              "& .MuiInputLabel-shrink": {
                padding: "0",
                top: "0px",
                transform: "translate(14px, -9px) scale(0.8)", // Обычное поведение при фокусе
              },
            }}
          />
        )}
        sx={{
          width: dropdownWidth ? dropdownWidth : "",
          bgcolor: "white",
          // Стили для самого Autocomplete
          "& .MuiOutlinedInput-root": {
            // уменьшаем высоту
            minHeight: "40px",
            // настраиваем внутренние отступы
            padding: "0 8px",
            // уменьшаем размер шрифта
            fontSize: "14px",
          },
          // уменьшаем иконку (стрелку)
          "& .MuiSvgIcon-root": {
            fontSize: "18px",
          },
          // стили для списка опций
          "& .MuiAutocomplete-listbox": {
            fontSize: "10px",
          },
        }}
        //   style={{ width: dropdownWidth, marginBottom: "10px" }}
      />
    </>
  );
}

export default MUIAutocomplete;
