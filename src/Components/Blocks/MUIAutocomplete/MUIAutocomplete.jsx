import React, { useState } from "react";
import classes from "./MUIAutocomplete.module.css";
import { Autocomplete, TextField } from "@mui/material";

function MUIAutocomplete({
  label,
  labelOnFocus,
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
  const [focused, setFocused] = useState(false);
  return (
    <>
      <Autocomplete
        // multiple={isMultiple ? isMultiple : false}
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
            label={labelOnFocus ? (focused || value ? labelOnFocus : label) : label}
            onFocus={() => {
              labelOnFocus ? setFocused(true) : null;
            }}
            onBlur={() => {
              labelOnFocus ? setFocused(false) : null;
            }}
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
                height: "40px",
                maxHeight: "40px",
                display: "flex",
                alignItems: "center",
                borderRadius: "10px !important",
                backgroundColor: "transparent",
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
          bgcolor: "transparent",
          borderRadius: "10px !important",
          // Стили для самого Autocomplete
          "& .MuiOutlinedInput-root": {
            minHeight: "40px",
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

// import React from "react";
// import classes from "./MUIAutocomplete.module.css";
// import { Autocomplete, TextField } from "@mui/material";

// function MUIAutocomplete({
//   label,
//   options,
//   value,
//   onChange,
//   dropdownWidth,
//   isDisabled,
//   listboxHeight,
//   // Новый пропс: если true, то разделяем строку и меняем цвета
//   isColor,
//   children,
//   ...props
// }) {
//   return (
//     <Autocomplete
//       options={options ? options : []}
//       disablePortal
//       disabled={isDisabled ? isDisabled : false}
//       clearText="Очистить"
//       openText="Открыть"
//       closeText="Закрыть"
//       slotProps={{
//         popper: {
//           modifiers: [
//             {
//               name: "preventOverflow",
//               options: { boundary: "window" },
//             },
//           ],
//         },
//         listbox: {
//           sx: {
//             fontSize: "14px", // Уменьшаем размер шрифта списка
//             padding: "0",
//             borderRadius: "10px !important",
//             ...(listboxHeight && { maxHeight: listboxHeight }),
//           },
//         },
//         paper: {
//           sx: {
//             borderRadius: "10px !important",
//             "& .MuiAutocomplete-noOptions": {
//               fontSize: "14px", // Уменьшаем шрифт текста "Нет вариантов"
//               textAlign: "center",
//               color: "gray",
//               padding: "8px", // Добавляем отступ для удобства
//             },
//           },
//         },
//       }}
//       value={value}
//       onChange={onChange}
//       noOptionsText="Ничего не найдено."
//       renderInput={(params) => (
//         <TextField
//           {...params}
//           label={label}
//           variant="outlined"
//           sx={{
//             "& label": {
//               top: "50%",
//               padding: "0 12px",
//               transform: "translateY(-50%)",
//               transition: "all 0.1s ease-out",
//               fontSize: "14px",
//             },
//             "& .MuiInputBase-root": {
//               height: "40px",
//               display: "flex",
//               alignItems: "center",
//               borderRadius: "10px !important",
//             },
//             "& .MuiOutlinedInput-root": {
//               padding: "0 px",
//               borderRadius: "10px !important",
//             },
//             "& .MuiInputLabel-shrink": {
//               padding: "0",
//               top: "0px",
//               transform: "translate(14px, -9px) scale(0.8)",
//             },
//           }}
//         />
//       )}
//       sx={{
//         width: dropdownWidth ? dropdownWidth : "",
//         bgcolor: "white",
//         borderRadius: "10px !important",
//         "& .MuiOutlinedInput-root": {
//           minHeight: "40px",
//           padding: "0 8px",
//           fontSize: "14px",
//         },
//         "& .MuiSvgIcon-root": {
//           fontSize: "18px",
//         },
//         "& .MuiAutocomplete-listbox": {
//           fontSize: "10px",
//         },
//       }}
//       // Если isColor true, используем кастомный renderOption, который разделяет строку и меняет цвета слов.
//       renderOption={
//         isColor
//           ? (optionProps, option) => {
//               const labelText =
//                 typeof option === "string"
//                   ? option
//                   : option.label
//                   ? option.label
//                   : option.name
//                   ? `${option.name} ${option.position}`
//                   : "";
//               // Разбиваем строку по пробелу (можно изменить на другой разделитель, если нужно)
//               const words = labelText.split(" ");
//               return (
//                 <li {...optionProps} key={labelText}>
//                   {words.map((word, index) => (
//                     <span
//                       key={index}
//                       style={{
//                         color:
//                           index === 0 ? "black" : index === 1 ? "gray" : "green",
//                         marginRight: "4px",
//                       }}
//                     >
//                       {word}
//                     </span>
//                   ))}
//                 </li>
//               );
//             }
//           : undefined
//       }
//       {...props}
//     />
//   );
// }

// export default MUIAutocomplete;
