// DateRangeModalSelector.jsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, TextField, Box } from "@mui/material";
import { DateRangePicker } from "react-date-range";
import { ru } from "date-fns/locale";
import format from "date-fns/format";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  addDays,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  isSameDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";
import Button from "../../Standart/Button/Button";

export default function DateRangeModalSelector({
  initialRange,
  onChange,
  width,
}) {
  const defaultSelection = {
    startDate: initialRange?.startDate || null,
    endDate: initialRange?.endDate || null,
    key: "selection",
  } || {
    startDate: addDays(new Date(), -7),
    endDate: new Date(),
    key: "selection",
  };

  // Локальное состояние диапазона
  // const [range, setRange] = useState([
  //   {
  //     startDate: initialRange?.startDate || null,
  //     endDate: initialRange?.endDate || null,
  //     key: "selection",
  //   },
  // ]);
  const [range, setRange] = useState([defaultSelection]);
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
  const LAST_N_DAYS = 7;

  const makeStatic = (label, getter) => ({
    label,
    range: () => {
      const { startDate, endDate } = getter();
      return { startDate, endDate };
    },
    isSelected: (r) => {
      const { startDate, endDate } = getter();
      return (
        r && isSameDay(r.startDate, startDate) && isSameDay(r.endDate, endDate)
      );
    },
  });

  // хелпер: последние N дней ТЕКУЩЕГО МЕСЯЦА (конец = конец месяца, старт ограничен началом месяца)
  const lastNDaysUpToToday = (n) => {
    const end = new Date(); // сегодня
    const start = addDays(end, -(n - 1)); // N-1 дней назад
    return { startDate: start, endDate: end };
  };

  const staticRanges = [
    makeStatic("Задать свой", () => lastNDaysUpToToday(LAST_N_DAYS)),

    // makeStatic("Задать свой", () => ({
    //   startDate: defaultSelection.startDate,
    //   endDate: defaultSelection.endDate,
    // })),
    makeStatic("Последние 7 дней", () => ({
      startDate: addDays(new Date(), -7),
      endDate: new Date(),
    })),
    makeStatic("Последние 30 дней", () => ({
      startDate: addDays(new Date(), -30),
      endDate: new Date(),
    })),
    makeStatic("Текущий месяц", () => ({
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    })),
    makeStatic("Прошлый месяц", () => {
      const d = subMonths(new Date(), 1);
      return { startDate: startOfMonth(d), endDate: endOfMonth(d) };
    }),
    makeStatic("Текущий квартал", () => ({
      startDate: startOfQuarter(new Date()),
      endDate: endOfQuarter(new Date()),
    })),
    makeStatic("Прошлый квартал", () => {
      const d = subQuarters(new Date(), 1);
      return { startDate: startOfQuarter(d), endDate: endOfQuarter(d) };
    }),
    makeStatic("Текущий год", () => ({
      startDate: startOfYear(new Date()),
      endDate: endOfYear(new Date()),
    })),
    makeStatic("Прошлый год", () => {
      const d = subYears(new Date(), 1);
      return { startDate: startOfYear(d), endDate: endOfYear(d) };
    }),
  ];

  // Формат для TextField: либо пустая строка, либо "DD.MM.YYYY — DD.MM.YYYY"
  const formatted =
    range[0].startDate && range[0].endDate
      ? `${format(range[0].startDate, "dd.MM.yyyy")} — ${format(
          range[0].endDate,
          "dd.MM.yyyy"
        )}`
      : "";

  const buttonStyles = {
    padding: "0 30px",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    cursor: "pointer",
  };
  const ButtonStyles = {
    padding: "5px 20px",
    fontSize: "14px",
    borderRadius: "10px",
  };
  const cancelButtonStyles = {
    ...buttonStyles,
    backgroundColor: "#e5e7eb",
    color: "#111827",
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

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth={false} // отключаем дефолтный кап
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 926,
            borderRadius: "12px",
          },
        }}
      >
        <DialogContent>
          {/* Сам календарь */}
          <DateRangePicker
            // className="no-sidebar"
            startDatePlaceholder="Начало"
            endDatePlaceholder="Конец"
            locale={ru}
            ranges={range}
            onChange={handleSelect}
            showSelectionPreview={true}
            moveRangeOnFirstSelection={false}
            showDateDisplay={false}
            months={2}
            direction="horizontal"
            staticRanges={staticRanges} // если не нужны пресеты
            inputRanges={[]} // если не нужны инпуты вида "days up to today"
          />

          {/* Кнопки сверху */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button style={cancelButtonStyles} onClick={handleReset}>
              Отменить
            </button>

            <Button onClick={handleApply}>Применить</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
