import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestAirlineCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  decodeJWT,
  getCookie,
  CREATE_AIRLINE_USER,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import DropDownListObj from "../DropDownListObj/DropDownListObj";

function CreateRequestAirlineCompany({
  show,
  onClose,
  id,
  addTarif,
  setAddTarif,
}) {
  const [userRole, setUserRole] = useState();
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const token = getCookie("token");

  useEffect(() => {
    setUserRole(decodeJWT(token).role);
  }, [token]);

  const [formData, setFormData] = useState({
    images: "",
    name: "",
    email: "",
    role: "",
    position: "",
    login: "",
    password: "",
    department: "",
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      images: "",
      name: "",
      email: "",
      role: "",
      position: "",
      login: "",
      password: "",
      department: "",
    });
    setIsEdited(false); // Сброс флага изменений
  }, []);

  const closeButton = useCallback(() => {
    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }

    if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
      resetForm();
      onClose();
    }
  }, [isEdited, resetForm, onClose]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        images: file,
      }));
    }
  };

  const [createAirlineUser] = useMutation(CREATE_AIRLINE_USER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const isFormValid = () => {
    return (
      formData.name &&
      formData.email &&
      formData.role &&
      formData.position &&
      formData.login &&
      formData.password &&
      formData.department &&
      formData.images
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      alert('Пожалуйста, заполните все обязательные поля.')
      return;
    }

    // Проверяем обязательные поля
    // const requiredFields = [
    //   "name",
    //   "email",
    //   "role",
    //   "position",
    //   "login",
    //   "password",
    //   "department",
    // ];
    // const emptyFields = requiredFields.filter(
    //   (field) => !formData[field]?.trim()
    // );

    // if (emptyFields.length > 0) {
    //   alert("Пожалуйста, заполните все обязательные поля.");
    //   return;
    // }

    // if (!formData.images) {
    //   alert("Пожалуйста, загрузите файл аватара.");
    //   return;
    // }

    try {
      let request = await createAirlineUser({
        variables: {
          input: {
            name: formData.name,
            role: formData.role,
            position: formData.position,
            airlineId: id,
            email: formData.email,
            hotelId: null,
            login: formData.login,
            password: formData.password,
            airlineDepartmentId: formData.department,
          },
          images: formData.images,
        },
      });
      if (request) {
        const newUser = {
          id: request.data.registerUser.id, // Если возвращается ID созданного пользователя
          name: request.data.registerUser.name,
          role: request.data.registerUser.role,
          position: request.data.registerUser.position,
          images: request.data.registerUser.images,
          email: request.data.registerUser.email,
          login: request.data.registerUser.login,
          password: request.data.registerUser.password,
        };

        const updatedTarifs = addTarif.map((department) => {
          if (department.id === formData.department) {
            const updatedUsers = [...department.users, newUser].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
            return {
              ...department,
              users: updatedUsers,
            };
          }
          return department;
        });

        setAddTarif(updatedTarifs);
        resetForm();
        onClose();
      }
    } catch (err) {
      alert("Произошла ошибка при сохранении данных");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current?.contains(event.target) // Клик в боковой панели
      ) {
        return; // Если клик внутри, ничего не делаем
      }

      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, closeButton]);

  const positions = ["Директор", "Заместитель директора", "Сотрудник"];

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить аккаунт</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="Close" />
        </div>
      </div>

      <div className={classes.requestMiddle}>
        <div className={classes.requestData}>
          <label>ФИО</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Введите ФИО"
          />

          <label>Почта</label>
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Введите email"
          />

          <label>Роль</label>
          <DropDownList
            placeholder="Выберите роль"
            searchable={false}
            options={["AIRLINEADMIN"]}
            initialValue={formData.role}
            onSelect={(value) => {
              setFormData((prevFormData) => ({
                ...prevFormData,
                role: value,
              }));
              setIsEdited(true);
            }}
          />

          <label>Должность</label>
          <DropDownList
            placeholder="Выберите должность"
            searchable={false}
            options={positions}
            initialValue={formData.position}
            onSelect={(value) => {
              setFormData((prevFormData) => ({
                ...prevFormData,
                position: value,
              }));
              setIsEdited(true);
            }}
          />

          <label>Логин</label>
          <input
            type="text"
            name="login"
            value={formData.login}
            onChange={handleChange}
            placeholder="Введите логин"
          />

          <label>Пароль</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Введите пароль"
          />

          <label>Отдел</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
          >
            <option value="" disabled>
              Выберите отдел
            </option>
            {addTarif.map((category, index) => (
              <option key={index} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <label>Аватар</label>
          <input type="file" name="images" onChange={handleFileChange} />
        </div>
      </div>

      <div className={classes.requestButton}>
        <Button type="submit" onClick={handleSubmit}>
          Добавить
        </Button>
      </div>
    </Sidebar>
  );
}

export default CreateRequestAirlineCompany;
