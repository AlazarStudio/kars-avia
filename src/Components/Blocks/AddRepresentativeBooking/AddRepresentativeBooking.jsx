import React, { useState, useCallback } from "react";
import { useMutation } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "../../Standart/Button/Button.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import {
  ADD_PASSENGER_REQUEST_HOTEL_PERSON,
  GET_PASSENGER_REQUEST,
  getCookie,
} from "../../../../graphQL_requests.js";
import classes from "./AddRepresentativeBooking.module.css";

function AddRepresentativeBooking({
  open,
  onClose,
  requestId,
  hotelIndex,
  onSuccess,
  addNotification,
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    gender: "",
    roomNumber: "",
  });

  const token = getCookie("token");

  const [addHotelPerson, { loading }] = useMutation(
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
      awaitRefetchQueries: true,
    }
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleClose = useCallback(() => {
    setFormData({
      fullName: "",
      phone: "",
      gender: "",
      roomNumber: "",
    });
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
      gender: formData.gender?.trim() || null,
      roomNumber: formData.roomNumber?.trim() || null,
    };

    try {
      await addHotelPerson({
        variables: {
          requestId,
          hotelIndex,
          person,
        },
      });
      addNotification?.("Бронь добавлена.", "success");
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error(error);
      const message =
        error?.graphQLErrors?.[0]?.message || error?.message || "Ошибка при добавлении брони.";
      addNotification?.(message, "error");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: "15px" } }}>
      <DialogTitle className={classes.title}>Добавить бронь</DialogTitle>
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
        <label className={classes.label}>Пол</label>
        <MUIAutocomplete
          dropdownWidth="100%"
          label="Выберите пол"
          options={["Мужской", "Женский"]}
          value={formData.gender}
          onChange={(event, newValue) =>
            setFormData((prev) => ({ ...prev, gender: newValue ?? "" }))
          }
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
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddRepresentativeBooking;
