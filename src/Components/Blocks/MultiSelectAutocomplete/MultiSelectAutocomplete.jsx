import React, { useMemo } from "react";
import classes from "./MultiSelectAutocomplete.module.css";
import { Autocomplete, TextField, Checkbox } from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import {
  buildAutocompleteRunnerIds,
  SCRIPT_RUNNER_ID_ATTR,
} from "../../../utils/scriptRunnerSelectors";

const SELECT_ALL_OPTION = {
  id: "__select_all__",
  label: "Выбрать всё",
  isSelectAll: true,
};

const defaultFilter = createFilterOptions();

function MultiSelectAutocomplete({
  label,
  options,
  flexWrap = false,
  value,
  onChange,
  dropdownWidth,
  isDisabled,
  isMultiple,
  listboxHeight,
  limitTags,
  children,
  showSelectAll = false,
  scriptRunnerId,
  ...props
}) {
  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;
  const fieldName = props.name || props.id;
  const placeholder = props.placeholder;
  const fieldLabel = label;
  const runnerIds = useMemo(
    () =>
      buildAutocompleteRunnerIds({
        explicitId: scriptRunnerId,
        label: fieldLabel,
        fieldName,
        placeholder,
        autocompleteType: "multi",
      }),
    [scriptRunnerId, fieldLabel, fieldName, placeholder]
  );

  const baseOptions = options ?? [];
  const hasObjectOptions =
    baseOptions.length > 0 &&
    typeof baseOptions[0] === "object" &&
    baseOptions[0] != null &&
    ("id" in baseOptions[0] || "value" in baseOptions[0]);
  const useSelectAll = showSelectAll && (isMultiple || false) && hasObjectOptions;

  const filterOptions = (optionsToFilter, state) => {
    const filterFn = props.filterOptions ?? defaultFilter;
    const filtered = filterFn(optionsToFilter, state);
    if (useSelectAll) {
      return [SELECT_ALL_OPTION, ...filtered];
    }
    return filtered;
  };

  const handleChange = (event, newValue, reason, details) => {
    if (details?.option?.isSelectAll) {
      const allSelected =
        (value?.length ?? 0) === baseOptions.length && baseOptions.length > 0;
      onChange?.(event, allSelected ? [] : [...baseOptions], reason, details);
      return;
    }
    const cleanedValue = Array.isArray(newValue)
      ? newValue.filter((opt) => opt?.id !== SELECT_ALL_OPTION.id)
      : newValue;
    onChange?.(event, cleanedValue, reason, details);
  };

  const getOptionLabel = (option) => {
    if (option?.isSelectAll) return option.label;
    return typeof option === "string" ? option : option?.label ?? "";
  };

  const isOptionEqualToValue = (option, val) => {
    if (option?.isSelectAll) return false;
    if (typeof option === "string" && typeof val === "string") return option === val;
    if (option && val && typeof option === "object" && typeof val === "object") {
      if (option.id != null && val.id != null) return option.id === val.id;
      if (option.value != null && val.value != null) return option.value === val.value;
      return option.id === val.id;
    }
    return false;
  };

  return (
    <Autocomplete
      {...props}
      {...{ [SCRIPT_RUNNER_ID_ATTR]: runnerIds.rootId }}
      multiple={isMultiple || false}
      options={baseOptions}
      filterOptions={filterOptions}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      limitTags={limitTags || 2}
      disablePortal
      disabled={isDisabled || false}
      clearText="Очистить"
      openText="Открыть"
      closeText="Закрыть"
      slotProps={{
        ...(props.slotProps || {}),
        chip: {
          ...(props.slotProps?.chip || {}),
          size: "small",
          sx: {
            ...(props.slotProps?.chip?.sx || {}),
            margin: "2px",
            borderRadius: "8px",
          },
        },
        popper: {
          ...(props.slotProps?.popper || {}),
          modifiers: [
            {
              name: "preventOverflow",
              options: {
                boundary: "window",
              },
            },
            ...((props.slotProps?.popper?.modifiers) || []),
          ],
        },
        listbox: {
          ...(props.slotProps?.listbox || {}),
          [SCRIPT_RUNNER_ID_ATTR]: runnerIds.listboxId,
          sx: {
            ...(props.slotProps?.listbox?.sx || {}),
            fontSize: "14px",
            padding: "0",
            borderRadius: "10px !important",
            "& .MuiAutocomplete-option": {
              padding: "4px 8px",
              minHeight: "unset",
            },
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
              color: "gray", // Можно поменять цвет текста
              padding: "8px", // Добавляем отступ для удобства
            },
          },
        },
      }}
      value={value}
      onChange={handleChange}
      noOptionsText="Ничего не найдено."
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps,
            [SCRIPT_RUNNER_ID_ATTR]: runnerIds.inputId,
          }}
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
              padding: "0 8px",
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
          alignItems: "center",
        },
        "& .MuiAutocomplete-inputRoot:not(.Mui-focused)": {
          ...(flexWrap && { flexWrap: "nowrap !important" }),
          overflow: "hidden",
        },
        "& .MuiAutocomplete-inputRoot:not(.Mui-focused) .MuiAutocomplete-input": {
          minWidth: "0 !important",
          width: "1px",
          flexGrow: 0,
          padding: "0 !important",
        },
        "& .MuiAutocomplete-inputRoot:not(.Mui-focused) .MuiAutocomplete-tag": {
          maxWidth: "calc(100% - 26px)",
        },
        "& .MuiSvgIcon-root": {
          fontSize: "18px",
        },
      }}
      renderOption={
        isMultiple
          ? (optionProps, option, { selected }) => {
              const isSelectAllOption = option?.isSelectAll;
              const checked = isSelectAllOption
                ? (value?.length ?? 0) === baseOptions.length &&
                  baseOptions.length > 0
                : selected;
              const label =
                typeof option === "string" ? option : option?.label ?? "";
              return (
                <li
                  {...optionProps}
                  {...{
                    [SCRIPT_RUNNER_ID_ATTR]: buildAutocompleteRunnerIds({
                      explicitId: scriptRunnerId,
                      label: fieldLabel,
                      fieldName,
                      placeholder,
                      autocompleteType: "multi",
                      option,
                    }).optionId,
                  }}
                  key={option?.id ?? option?.value ?? option?.label ?? label}
                >
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    size="small"
                    sx={{ p: 0.25, mr: 0.5 }}
                    checked={checked}
                  />
                  {label}
                </li>
              );
            }
          : (optionProps, option, state, ownerState) => {
              const mergedOptionProps = {
                ...optionProps,
                [SCRIPT_RUNNER_ID_ATTR]: buildAutocompleteRunnerIds({
                  explicitId: scriptRunnerId,
                  label: fieldLabel,
                  fieldName,
                  placeholder,
                  autocompleteType: "multi",
                  option,
                }).optionId,
              };

              if (props.renderOption) {
                return props.renderOption(mergedOptionProps, option, state, ownerState);
              }

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
      }
    />
  );
}

export default MultiSelectAutocomplete;
