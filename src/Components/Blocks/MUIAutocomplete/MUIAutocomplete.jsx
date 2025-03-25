import React from "react";
import classes from "./MUIAutocomplete.module.css";
import { Autocomplete, TextField } from "@mui/material";

function MUIAutocomplete({
  label,
  options,
  value,
  onChange,
  dropdownWidth,
  isDisabled,
  listboxHeight,
  children,
  ...props
}) {
  return (
    <>
      <Autocomplete
        options={options ? options : []}
        disablePortal
        disabled={isDisabled ? isDisabled : false}
        clearText="Очистить"
        openText="Открыть"
        closeText="Закрыть"
        // autoComplete={false}
        // aria-autocomplete="none"
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
              borderRadius: "10px !important",
              ...(listboxHeight && { maxHeight: listboxHeight }),
            },
          },
          paper: {
            sx: {
              borderRadius: "10px !important",
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
            // slotProps={{
            //   htmlInput: {
            //     "aria-autocomplete": "none",
            //   },
            // }}
            sx={{
              "& label": {
                top: "50%",
                padding: "0 12px",
                transform: "translateY(-50%)",
                transition: "all 0.1s ease-out", // Плавная анимация при фокусе
                fontSize: "14px",
              },
              "& .MuiInputBase-root": {
                // minHeight: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                borderRadius: "10px !important",
              },
              "& .MuiOutlinedInput-root": {
                padding: "0 px",
                borderRadius: "10px !important",
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
          borderRadius: "10px !important",
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
