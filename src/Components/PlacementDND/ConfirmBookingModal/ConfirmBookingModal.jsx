import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import { convertToDate } from "../../../../graphQL_requests";

const ConfirmBookingModal = ({ isOpen, onClose, onConfirm, request }) => {
    return (
        <Dialog open={isOpen} onClose={onClose} disableScrollLock={true}>
            <DialogTitle>Подтверждение бронирования</DialogTitle>
            <DialogContent>
                <Typography variant="body1">
                    Вы уверены, что хотите забронировать заявку для гостя{" "}
                    <b>{request?.guest}</b> с {convertToDate(request?.checkInDate)} по {convertToDate(request?.checkOutDate)}?
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отмена</Button>
                <Button onClick={() => onConfirm(request)} color="primary">
                    Подтвердить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmBookingModal;
