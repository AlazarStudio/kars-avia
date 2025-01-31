import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

const EditReserveDate = ({ isOpen, onClose, onSave, request }) => {
    // console.log(request);
    
    // Функция для разделения даты и времени
    const parseDateTime = (dateTime) => {
        if (!dateTime) return { date: "", time: "" };
        const dateObj = new Date(dateTime);
        return {
            date: dateObj.toISOString().split("T")[0], // YYYY-MM-DD
            time: dateObj.toISOString().split("T")[1].slice(0, 5), // HH:MM
        };
    };

    // Используем lazy initialization для стейта, чтобы он не сбрасывался
    const [localRequest, setLocalRequest] = useState(() => ({
        checkInDate: request ? parseDateTime(request.arrival).date : "",
        checkInTime: request ? parseDateTime(request.arrival).time : "",
        checkOutDate: request ? parseDateTime(request.departure).date : "",
        checkOutTime: request ? parseDateTime(request.departure).time : "",
    }));

    // Этот useEffect срабатывает ТОЛЬКО когда модалка ОТКРЫВАЕТСЯ ВПЕРВЫЕ, а не на каждый ререндер
    useEffect(() => {
        if (isOpen) {
            setLocalRequest({
                checkInDate: request ? parseDateTime(request.arrival).date : "",
                checkInTime: request ? parseDateTime(request.arrival).time : "",
                checkOutDate: request ? parseDateTime(request.departure).date : "",
                checkOutTime: request ? parseDateTime(request.departure).time : "",
            });
        }
    }, [isOpen]); // Теперь зависимости зависят только от открытия модалки

    // Функция для обновления полей
    const handleChange = (field, value) => {
        setLocalRequest((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSave = () => {
        onSave({
            ...request,
            arrival: `${localRequest.checkInDate}T${localRequest.checkInTime}:00.000Z`,
            departure: `${localRequest.checkOutDate}T${localRequest.checkOutTime}:00.000Z`,
        });
        onClose(); // Закрываем модалку после сохранения
    };

    return (
        <Dialog open={isOpen} onClose={onClose} disableScrollLock={true}>
            <DialogTitle>Редактирование дат бронирования</DialogTitle>
            <DialogContent>
                <TextField
                    label="Дата заезда"
                    type="date"
                    value={localRequest.checkInDate}
                    onChange={(e) => handleChange("checkInDate", e.target.value)}
                    fullWidth
                    margin="dense"
                />
                <TextField
                    label="Время заезда"
                    type="time"
                    value={localRequest.checkInTime}
                    onChange={(e) => handleChange("checkInTime", e.target.value)}
                    fullWidth
                    margin="dense"
                />
                <TextField
                    label="Дата выезда"
                    type="date"
                    value={localRequest.checkOutDate}
                    onChange={(e) => handleChange("checkOutDate", e.target.value)}
                    fullWidth
                    margin="dense"
                />
                <TextField
                    label="Время выезда"
                    type="time"
                    value={localRequest.checkOutTime}
                    onChange={(e) => handleChange("checkOutTime", e.target.value)}
                    fullWidth
                    margin="dense"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отмена</Button>
                <Button onClick={handleSave} color="primary">
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditReserveDate;
