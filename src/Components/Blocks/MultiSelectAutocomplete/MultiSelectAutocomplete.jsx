import React from "react";
import classes from "./MultiSelectAutocomplete.module.css";
import { Autocomplete, TextField, Checkbox } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

function MultiSelectAutocomplete({
  label,
  options,
  value,
  onChange,
  dropdownWidth,
  isDisabled,
  isMultiple,
  listboxHeight,
  children,
  ...props
}) {
  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;

  return (
    <Autocomplete
      multiple={isMultiple || false}
      options={options ? options : []}
      // Используем getOptionLabel для преобразования объекта в строку
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.label
      }
      limitTags={2}
      disablePortal
      disabled={isDisabled || false}
      clearText="Очистить"
      openText="Открыть"
      closeText="Закрыть"
      slotProps={{
        chip: {
          size: "small",
          sx: {
            margin: "2px",
            borderRadius: "8px",
          },
        },
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
          sx={{
            // overflow:'hidden',
            "& label": {
              top: "50%",
              padding: "0 12px",
              transform: "translateY(-50%)",
              transition: "all 0.1s ease-out", // Плавная анимация при фокусе
              fontSize: "14px",
            },
            "& .MuiInputBase-root": {
              // height: "40px",
              display: "flex",
              alignItems: "center",
              padding: "5px 10px",
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
          transition: "all 0.3s ease-in-out",
        },
        "& .MuiSvgIcon-root": {
          fontSize: "18px",
        },
        "& .MuiAutocomplete-listbox": {
          fontSize: "10px",
        },
      }}
      {...props}
      renderOption={
        isMultiple
          ? (optionProps, option, { selected }) => (
              <li {...optionProps} key={option.id}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.label}
              </li>
            )
          : undefined
      }
    />
  );
}

export default MultiSelectAutocomplete;
