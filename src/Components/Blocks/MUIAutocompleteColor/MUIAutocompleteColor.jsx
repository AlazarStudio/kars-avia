import React from "react";
import classes from "./MUIAutocompleteColor.module.css";
import { Autocomplete, TextField } from "@mui/material";

function MUIAutocompleteColor({
  label,
  options,
  value,
  onChange,
  dropdownWidth,
  isDisabled,
  listboxHeight,
  // Новый пропс: если true, то разделяем строку и меняем цвета
  isColor,
  children,
  ...props
}) {
  return (
    <Autocomplete
      options={options ? options : []}
      disablePortal
      disabled={isDisabled ? isDisabled : false}
      clearText="Очистить"
      openText="Открыть"
      closeText="Закрыть"
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "preventOverflow",
              options: { boundary: "window" },
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
              color: "gray",
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
              transition: "all 0.1s ease-out",
              fontSize: "14px",
            },
            "& .MuiInputBase-root": {
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
              transform: "translate(14px, -9px) scale(0.8)",
            },
          }}
        />
      )}
      sx={{
        width: dropdownWidth ? dropdownWidth : "",
        bgcolor: "white",
        borderRadius: "10px !important",
        "& .MuiOutlinedInput-root": {
          minHeight: "40px",
          padding: "0 8px",
          fontSize: "14px",
        },
        "& .MuiSvgIcon-root": {
          fontSize: "18px",
        },
        "& .MuiAutocomplete-listbox": {
          fontSize: "10px",
        },
      }}
      // Если isColor true, используем кастомный renderOption, который разделяет строку и меняет цвета слов.
      renderOption={
        isColor
          ? (optionProps, option) => {
              const labelText =
                typeof option === "string"
                  ? option
                  : option.label
                  ? option.label
                  : option.name
                  ? `${option.name} ${option.position}`
                  : "";
              // Разбиваем строку по пробелу (можно изменить на другой разделитель, если нужно)
              const words = labelText.split(" ");
              return (
                <li {...optionProps} key={labelText}>
                  {words.map((word, index) => (
                    <span
                      key={index}
                      style={{
                        color:
                          index === 0 ? "black" : index === 1 ? "gray" : "green",
                        marginRight: "4px",
                      }}
                    >
                      {word}
                    </span>
                  ))}
                </li>
              );
            }
          : undefined
      }
      {...props}
    />
  );
}

export default MUIAutocompleteColor;
