// DateRangeModalSelector.jsx
import React, { useState, useEffect } from "react";
import { Button, Dialog, DialogContent, TextField, Box } from "@mui/material";
import { DateRangePicker } from "react-date-range";
import { ru } from "date-fns/locale";
import format from "date-fns/format";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function DateRangeModalSelector({
  initialRange,
  onChange,
  width,
}) {
  // Локальное состояние диапазона
  const [range, setRange] = useState([
    {
      startDate: initialRange?.startDate || null,
      endDate: initialRange?.endDate || null,
      key: "selection",
    },
  ]);
  const [open, setOpen] = useState(false);

  // Если initialRange из родителя поменялся (например, сбросили),
  // синхронизируем локальный state
  useEffect(() => {
    setRange([
      {
        startDate: initialRange?.startDate || null,
        endDate: initialRange?.endDate || null,
        key: "selection",
      },
    ]);
  }, [initialRange]);

  // Выбор в календаре
  const handleSelect = (ranges) => {
    setRange([ranges.selection]);
  };

  // Нажали «Применить»
  const handleApply = () => {
    setOpen(false);
    onChange?.(range[0].startDate, range[0].endDate);
  };
  // Нажали «Сбросить»
  const handleReset = () => {
    setOpen(false);
    onChange?.(null, null);
  };

  // Формат для TextField: либо пустая строка, либо "DD.MM.YYYY — DD.MM.YYYY"
  const formatted =
    range[0].startDate && range[0].endDate
      ? `${format(range[0].startDate, "dd.MM.yyyy")} — ${format(
          range[0].endDate,
          "dd.MM.yyyy"
        )}`
      : "";

  const ButtonStyles = {
    padding: "5px 20px",
    fontSize: "14px",
    borderRadius: "10px"
  };

  return (
    <>
      {/* Поле ввода, по клику открывает окно */}
      <TextField
        label="Диапазон дат"
        // placeholder="Выберите диапазон"
        value={formatted}
        onClick={() => setOpen(true)}
        autoComplete="new-password"
        fullWidth
        sx={{
          bgcolor: "white",
          height: "40px",
          width: width,
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

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogContent>
          {/* Кнопки сверху */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Button
              onClick={handleReset}
              sx={ButtonStyles}
            >
              Сбросить
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              sx={ButtonStyles}
            >
              Применить
            </Button>
          </Box>

          {/* Сам календарь */}
          <DateRangePicker
            className="no-sidebar"
            startDatePlaceholder="Начало"
            endDatePlaceholder="Конец"
            locale={ru}
            ranges={range}
            onChange={handleSelect}
            showSelectionPreview={true}
            moveRangeOnFirstSelection={false}
            months={1}
            direction="horizontal"
            staticRanges={[]} // если не нужны пресеты
            inputRanges={[]} // если не нужны инпуты вида "days up to today"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
