import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

const EditRequestModalV2 = ({ isOpen, onClose, onSave, request }) => {
  const [checkInDate, setCheckInDate] = useState(request?.checkInDate);
  const [checkInTime, setCheckInTime] = useState(request?.checkInTime);
  const [checkOutDate, setCheckOutDate] = useState(request?.checkOutDate);
  const [checkOutTime, setCheckOutTime] = useState(request?.checkOutTime);

  useEffect(() => {
    if (request) {
      setCheckInDate(request.checkInDate);
      setCheckInTime(request.checkInTime);
      setCheckOutDate(request.checkOutDate);
      setCheckOutTime(request.checkOutTime);
    }
  }, [request]);

  const handleSave = () => {
    const checkInDateTime = new Date(`${checkInDate}T${checkInTime}`);
    const checkOutDateTime = new Date(`${checkOutDate}T${checkOutTime}`);

    if (checkOutDateTime < checkInDateTime) {
      alert("Дата и время выезда не могут быть раньше даты и времени заезда.");
      return;
    }

    onSave({
      ...request,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
    });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} disableScrollLock={true}>
      <DialogTitle>Изменить заявку</DialogTitle>
      <DialogContent>
        <TextField
          label="Дата заезда"
          type="date"
          value={checkInDate}
          onChange={(e) => setCheckInDate(e.target.value)}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Время заезда"
          type="time"
          value={checkInTime}
          onChange={(e) => setCheckInTime(e.target.value)}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Дата выезда"
          type="date"
          value={checkOutDate}
          onChange={(e) => setCheckOutDate(e.target.value)}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Время выезда"
          type="time"
          value={checkOutTime}
          onChange={(e) => setCheckOutTime(e.target.value)}
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

export default EditRequestModalV2;
