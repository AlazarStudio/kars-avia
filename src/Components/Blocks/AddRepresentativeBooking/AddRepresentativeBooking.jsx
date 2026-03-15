import React, { useState, useCallback, useEffect } from "react";
import { useMutation } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "../../Standart/Button/Button.jsx";
import {
  ADD_PASSENGER_REQUEST_HOTEL_PERSON,
  UPDATE_PASSENGER_REQUEST_HOTEL_PERSON,
  GET_PASSENGER_REQUEST,
  getCookie,
} from "../../../../graphQL_requests.js";
import classes from "./AddRepresentativeBooking.module.css";

const emptyForm = {
  fullName: "",
  phone: "",
  roomNumber: "",
};

function AddRepresentativeBooking({
  open,
  onClose,
  requestId,
  hotelIndex,
  initialPerson,
  personIndex,
  onSuccess,
  addNotification,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const isEditMode = initialPerson != null && personIndex != null;

  useEffect(() => {
    if (open) {
      if (initialPerson) {
        setFormData({
          fullName: initialPerson.fullName ?? "",
          phone: initialPerson.phone ?? "",
          roomNumber: initialPerson.roomNumber ?? "",
        });
      } else {
        setFormData(emptyForm);
      }
    }
  }, [open, initialPerson]);

  const token = getCookie("token");

  const [addHotelPerson, { loading: adding }] = useMutation(
    ADD_PASSENGER_REQUEST_HOTEL_PERSON,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      refetchQueries: [
        {
          query: GET_PASSENGER_REQUEST,
          variables: { passengerRequestId: requestId },
        },
      ],
      awaitRefetchQueries: false,
    }
  );

  const [updateHotelPerson, { loading: updating }] = useMutation(
    UPDATE_PASSENGER_REQUEST_HOTEL_PERSON,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      refetchQueries: [
        {
          query: GET_PASSENGER_REQUEST,
          variables: { passengerRequestId: requestId },
        },
      ],
      awaitRefetchQueries: false,
    }
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleClose = useCallback(() => {
    setFormData(emptyForm);
    onClose();
  }, [onClose]);

  const handleSubmit = async () => {
    const fullName = formData.fullName?.trim();
    if (!fullName) {
      addNotification?.("Укажите ФИО пассажира.", "error");
      return;
    }

    const person = {
      fullName,
      phone: formData.phone?.trim() || null,
      roomNumber: formData.roomNumber?.trim() || null,
    };

    try {
      if (isEditMode) {
        await updateHotelPerson({
          variables: {
            requestId,
            hotelIndex,
            personIndex,
            person,
          },
        });
        addNotification?.("Бронь обновлена.", "success");
      } else {
        await addHotelPerson({
          variables: {
            requestId,
            hotelIndex,
            person,
          },
        });
        addNotification?.("Бронь добавлена.", "success");
      }
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error(error);
      const firstGql = error?.graphQLErrors?.[0];
      const message =
        (typeof firstGql?.message === "string" && firstGql.message) ||
        (typeof error?.message === "string" && error.message) ||
        "Ошибка при сохранении брони.";
      addNotification?.(message, "error");
    }
  };

  const loading = adding || updating;

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: "15px" } }}>
      <DialogTitle className={classes.title}>
        {isEditMode ? "Редактировать бронь" : "Добавить бронь"}
      </DialogTitle>
      <DialogContent className={classes.content}>
        <label className={classes.label}>ФИО пассажира</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="ФИО пассажира"
          className={classes.input}
        />
        <label className={classes.label}>Номер телефона</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Номер телефона"
          className={classes.input}
        />
        <label className={classes.label}>Номер комнаты</label>
        <input
          type="text"
          name="roomNumber"
          value={formData.roomNumber}
          onChange={handleChange}
          placeholder="Номер комнаты"
          className={classes.input}
        />
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button onClick={handleClose}>
          Отмена
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {isEditMode ? "Сохранить" : "Добавить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddRepresentativeBooking;
