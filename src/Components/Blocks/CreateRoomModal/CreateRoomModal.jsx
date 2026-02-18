import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "../../Standart/Button/Button";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { getCookie, UPDATE_HOTEL } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";

const categories = [
  { value: "onePlace", label: "Одноместный" },
  { value: "twoPlace", label: "Двухместный" },
  { value: "threePlace", label: "Трехместный" },
  { value: "fourPlace", label: "Четырехместный" },
  { value: "fivePlace", label: "Пятиместный" },
  { value: "sixPlace", label: "Шестиместный" },
  { value: "sevenPlace", label: "Семиместный" },
  { value: "eightPlace", label: "Восьмиместный" },
];

const bedsCategories = [
  { value: 1.0, label: "Одна кровать" },
  { value: 2.0, label: "Две кровати" },
  { value: 3.0, label: "Три кровати" },
  { value: 4.0, label: "Четыре кровати" },
  { value: 5.0, label: "Пять кроватей" },
  { value: 6.0, label: "Шесть кроватей" },
  { value: 7.0, label: "Семь кроватей" },
  { value: 8.0, label: "Восемь кроватей" },
];

const CreateRoomModal = ({ open, onClose, hotelId, setNewRoom }) => {
  const token = getCookie("token");

  const [formData, setFormData] = useState({
    nomerName: "",
    category: "",
    beds: "",
    reserve: "",
  });

  const [updateHotel] = useMutation(UPDATE_HOTEL, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutocompleteChange = (
    field,
    newValue,
    optionsArray,
    isNumeric = false
  ) => {
    if (isNumeric) {
      const selected = optionsArray.find((item) => item.label === newValue);
      setFormData((prev) => ({
        ...prev,
        [field]: selected ? selected.value : "",
      }));
    } else {
      const selected = optionsArray.find((item) => item.label === newValue);
      setFormData((prev) => ({
        ...prev,
        [field]: selected ? selected.value : "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nomerName.trim() || !formData.category) {
      alert("Пожалуйста, заполните обязательные поля.");
      return;
    }
    try {
      // Если выбран режим "Резерв", можно добавить пометку к названию
      let nomerName = formData.nomerName;
      if (formData.reserve === "Резерв") {
        nomerName = `${formData.nomerName} (резерв)`;
      }
      const response = await updateHotel({
        variables: {
          updateHotelId: hotelId,
          input: {
            rooms: [
              {
                name: nomerName,
                category: formData.category,
                beds: parseFloat(formData.beds),
                reserve: formData.reserve === "Резерв",
              },
            ],
          },
        },
      });
      // console.log(response.data.updateHotel.rooms.at(-1));

      if (response.data) {
        onClose();
        setNewRoom(response.data.updateHotel.rooms.at(-1));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!open) {
      setFormData({
        nomerName: "",
        category: "",
        beds: "",
        reserve: "",
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ textAlign: "center" }}>Создать номер</DialogTitle>
      <DialogContent>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <label>Квота или резерв</label>
          <MUIAutocomplete
            dropdownWidth="100%"
            label="Выберите тип"
            options={["Квота", "Резерв"]}
            value={formData.reserve}
            onChange={(event, newValue) => {
              setFormData((prev) => ({ ...prev, reserve: newValue }));
            }}
          />

          <label>Название номера</label>
          <input
            type="text"
            name="nomerName"
            value={formData.nomerName}
            onChange={handleChange}
            placeholder="Введите название номера"
          />

          <label>Категория</label>
          <MUIAutocomplete
            listboxHeight={"120px"}
            dropdownWidth="100%"
            label="Выберите категорию"
            options={categories.map((cat) => cat.label)}
            value={
              categories.find((cat) => cat.value === formData.category)
                ?.label || ""
            }
            onChange={(event, newValue) =>
              handleAutocompleteChange("category", newValue, categories)
            }
          />

          <label>Количество кроватей</label>
          <MUIAutocomplete
            dropdownWidth="100%"
            label="Выберите количество кроватей"
            options={bedsCategories.map((bed) => bed.label)}
            value={
              bedsCategories.find((bed) => bed.value === formData.beds)
                ?.label || ""
            }
            onChange={(event, newValue) =>
              handleAutocompleteChange("beds", newValue, bedsCategories, true)
            }
          />
        </form>
      </DialogContent>
      <DialogActions
        sx={{ justifyContent: "space-between", padding: "0 24px 12px" }}
      >
        <Button onClick={onClose} width="48%">
          Отмена
        </Button>
        <Button onClick={handleSubmit} width="48%">
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateRoomModal;
