import React, { useMemo, useState } from "react";
import classes from "./MUIAutocompleteColor.module.css";
import { Autocomplete, TextField } from "@mui/material";
import {
  buildAutocompleteRunnerIds,
  SCRIPT_RUNNER_ID_ATTR,
} from "../../../utils/scriptRunnerSelectors";

function MUIAutocompleteColor({
  label,
  labelOnFocus,
  hideLabelOnFocus = true,
  options,
  value,
  onChange,
  dropdownWidth,
  isDisabled,
  listboxHeight,
  // Новый пропс: если true, то разделяем строку и меняем цвета
  isColor,
  scriptRunnerId,
  children,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const fieldName = props.name || props.id;
  const placeholder = props.placeholder;
  const runnerIds = useMemo(
    () =>
      buildAutocompleteRunnerIds({
        explicitId: scriptRunnerId,
        label,
        fieldName,
        placeholder,
        autocompleteType: "color",
      }),
    [scriptRunnerId, label, fieldName, placeholder]
  );
  const optionPropsFactory = (option) => ({
    [SCRIPT_RUNNER_ID_ATTR]: buildAutocompleteRunnerIds({
      explicitId: scriptRunnerId,
      label,
      fieldName,
      placeholder,
      autocompleteType: "color",
      option,
    }).optionId,
  });

  return (
    <Autocomplete
      {...props}
      {...{ [SCRIPT_RUNNER_ID_ATTR]: runnerIds.rootId }}
      options={options ? options : []}
      disablePortal
      disabled={isDisabled ? isDisabled : false}
      clearText="Очистить"
      openText="Открыть"
      closeText="Закрыть"
      slotProps={{
        ...(props.slotProps || {}),
        popper: {
          ...(props.slotProps?.popper || {}),
          modifiers: [
            {
              name: "preventOverflow",
              options: { boundary: "window" },
            },
            ...((props.slotProps?.popper?.modifiers) || []),
          ],
        },
        listbox: {
          ...(props.slotProps?.listbox || {}),
          [SCRIPT_RUNNER_ID_ATTR]: runnerIds.listboxId,
          sx: {
            ...(props.slotProps?.listbox?.sx || {}),
            fontSize: "14px", // Уменьшаем размер шрифта списка
            padding: "0",
            borderRadius: "10px !important",
            whiteSpace: 'nowrap',
            ...(listboxHeight && { maxHeight: listboxHeight }),
          },
        },
        paper: {
          ...(props.slotProps?.paper || {}),
          [SCRIPT_RUNNER_ID_ATTR]: runnerIds.paperId,
          sx: {
            ...(props.slotProps?.paper?.sx || {}),
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
      renderOption={(optionProps, option, state, ownerState) => {
        const mergedOptionProps = {
          ...optionProps,
          ...optionPropsFactory(option),
        };

        if (props.renderOption) {
          return props.renderOption(mergedOptionProps, option, state, ownerState);
        }

        if (!isColor) {
          const optionLabel =
            typeof option === "string"
              ? option
              : option?.label ?? option?.name ?? "";

          return (
            <li
              {...mergedOptionProps}
              key={option?.id ?? option?.value ?? option?.label ?? optionLabel}
            >
              {optionLabel}
            </li>
          );
        }

        const labelText =
          typeof option === "string"
            ? option
            : option.label
              ? option.label
              : option.name
                ? `${option.name} ${option.position}`
                : "";
        const words = labelText.split(" ");

        return (
          <li {...mergedOptionProps} key={labelText}>
            {words.map((word, index) => (
              <span
                key={index}
                style={{
                  color:
                    index === 0
                      ? "black"
                      : index === 1
                        ? "gray"
                        : "green",
                  marginRight: "4px",
                }}
              >
                {word}
              </span>
            ))}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps,
            [SCRIPT_RUNNER_ID_ATTR]: runnerIds.inputId,
          }}
          label={
            hideLabelOnFocus && (focused || value)
              ? ""
              : labelOnFocus
                ? (focused || value ? labelOnFocus : label)
                : label
          }
          onFocus={() => {
            (labelOnFocus || hideLabelOnFocus) ? setFocused(true) : null;
          }}
          onBlur={() => {
            (labelOnFocus || hideLabelOnFocus) ? setFocused(false) : null;
          }}
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
              transform: "translate(14px, -9px) scale(0.8)",
            },
          }}
        />
      )}
      sx={{
        width: dropdownWidth ? dropdownWidth : "",
        bgcolor: "transparent",
        borderRadius: "10px !important",
        "& .MuiOutlinedInput-root": {
          minHeight: "40px",
          padding: "0 8px",
          fontSize: "14px",
          backgroundColor: "transparent",
          transition: "all 0.3s ease-in-out",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.23)",
            // transition: "all 0.3s ease-in-out",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.23)",
            // borderColor: "#fff",
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
        "& .MuiSvgIcon-root": {
          fontSize: "18px",
        },
        "& .MuiAutocomplete-listbox": {
          fontSize: "10px",
        },
      }}
    />
  );
}

export default MUIAutocompleteColor;
