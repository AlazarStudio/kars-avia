import React, { memo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { isLeapYear, startOfYear, addDays, endOfMonth, isSameDay, isToday, differenceInMilliseconds, differenceInCalendarDays } from "date-fns";

// Функция для преобразования даты и времени в объект Date
const parseDateTime = (dateString, timeString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const [hours, minutes] = timeString.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes);
};

// Проверка конца месяца
const isEndOfMonth = (date) => isSameDay(date, endOfMonth(date));

const RoomRow = memo(({ dayWidth, weekendColor, monthColor, room, requests, onRequestMove }) => {
    const rowRef = useRef(null);
    const [magnetPlaceholder, setMagnetPlaceholder] = useState(null); // Временный блок для "магнита"

    // Drag-and-Drop обработчики
    const handleDragStart = (event, request) => {
        event.dataTransfer.setData("application/json", JSON.stringify(request));
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const data = event.dataTransfer.getData("application/json");
        if (!data) return;

        const request = JSON.parse(data);
        const rect = rowRef.current.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;

        const startDate = startOfYear(new Date());
        const newCheckInDay = Math.floor(offsetX / dayWidth); // Привязка к ближайшему дню
        const newCheckIn = addDays(startDate, newCheckInDay); // Новый check-in на основе позиции

        const checkIn = parseDateTime(request.checkInDate, request.checkInTime);
        const checkOut = parseDateTime(request.checkOutDate, request.checkOutTime);
        const duration = differenceInMilliseconds(checkOut, checkIn); // Длительность сохраняется

        const newCheckOut = new Date(newCheckIn.getTime() + duration); // Новый check-out

        onRequestMove(
            {
                ...request,
                checkInDate: newCheckIn.toISOString().split("T")[0],
                checkInTime: `${newCheckIn.getHours().toString().padStart(2, "0")}:${newCheckIn
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`,
                checkOutDate: newCheckOut.toISOString().split("T")[0],
                checkOutTime: `${newCheckOut.getHours().toString().padStart(2, "0")}:${newCheckOut
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`,
            },
            room
        );

        setMagnetPlaceholder(null); // Убираем визуальный блок
    };

    const handleDragOver = (event) => {
        event.preventDefault(); // Разрешает drop
        const data = event.dataTransfer.getData("application/json");
        if (!data) return; // Если данных нет, ничего не делаем

        const request = JSON.parse(data);
        const checkIn = parseDateTime(request.checkInDate, request.checkInTime);
        const checkOut = parseDateTime(request.checkOutDate, request.checkOutTime);

        const durationDays = differenceInCalendarDays(checkOut, checkIn) + 1; // Длительность заявки в днях
        const rect = rowRef.current.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;

        // Рассчитываем позицию и размер заглушки
        const placeholderPosition = Math.floor(offsetX / dayWidth) * dayWidth;
        setMagnetPlaceholder({ left: placeholderPosition, width: durationDays * dayWidth });
    };

    const daysInYear = isLeapYear(new Date()) ? 366 : 365;
    const startDate = startOfYear(new Date());

    return (
        <Box
            ref={rowRef}
            sx={{
                display: "flex",
                position: "relative",
                borderBottom: "1px solid #ddd",
                height: "30px",
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {/* Рендерим ячейки года */}
            {Array.from({ length: daysInYear }).map((_, index) => {
                const currentDate = addDays(startDate, index);
                const isEndOfMonthCheck = isEndOfMonth(currentDate);
                const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                const isCurrentDay = isToday(currentDate);

                return (
                    <Box
                        key={index}
                        sx={{
                            width: `${dayWidth}px`,
                            borderRight: isEndOfMonthCheck ? `3px solid ${monthColor}` : "1px solid #ddd",
                            backgroundColor: isCurrentDay
                                ? "#f3f292"
                                : isWeekend
                                    ? weekendColor
                                    : "#f9f9f9",
                        }}
                    />
                );
            })}

            {/* Рендерим "магнитящийся" блок */}
            {magnetPlaceholder && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "2px",
                        left: `${magnetPlaceholder.left}px`,
                        width: `${magnetPlaceholder.width}px`,
                        height: "25px",
                        backgroundColor: "rgba(0, 0, 255, 0.5)", // Полупрозрачный индикатор
                        border: "1px dashed blue",
                        borderRadius: "4px",
                        zIndex: 1,
                    }}
                />
            )}

            {/* Рендерим заявки */}
            {requests.map((request, index) => {
                const checkIn = parseDateTime(request.checkInDate, request.checkInTime);
                const checkOut = parseDateTime(request.checkOutDate, request.checkOutTime);

                const checkInOffset = (differenceInMilliseconds(checkIn, startDate) / (24 * 60 * 60 * 1000)) * dayWidth;
                const duration = (differenceInMilliseconds(checkOut, checkIn) / (24 * 60 * 60 * 1000)) * dayWidth;

                return (
                    <Box
                        key={index}
                        draggable
                        onDragStart={(event) => handleDragStart(event, request)}
                        sx={{
                            position: "absolute",
                            top: "2px",
                            left: `${checkInOffset}px`,
                            width: `${duration}px`,
                            height: "25px",
                            backgroundColor: "#439846",
                            border: "1px solid #439846",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            color: "white",
                            fontSize: "11px",
                            zIndex: 2,
                            cursor: "grab",
                        }}
                    >
                        {request.guest}
                    </Box>
                );
            })}
        </Box>
    );
});

export default RoomRow;
