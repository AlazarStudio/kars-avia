import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestAirlineCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { getCookie, UPDATE_AIRLINE_USER } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";

function EditRequestAirlineCompany({
  show,
  onClose,
  user,
  department,
  onSubmit,
  addTarif,
  id,
}) {
  const token = getCookie("token");

  const [uploadFile, { data, loading, error }] = useMutation(
    UPDATE_AIRLINE_USER,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Apollo-Require-Preflight": "true",
        },
      },
    }
  );

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    images: null,
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "",
    position: user?.position || "",
    login: user?.login || "",
    password: "",
    department: department || "",
  });

  const sidebarRef = useRef();

  useEffect(() => {
    if (show && user && department) {
      setFormData({
        images: null,
        name: user?.name || "",
        email: user?.email || "",
        role: user?.role || "",
        position: user?.position || "",
        login: user?.login || "",
        password: "",
        department: department || "",
      });
    }
  }, [show, department, user]);

  const resetForm = useCallback(() => {
    setFormData({
      images: null,
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "",
      position: user?.position || "",
      login: user?.login || "",
      password: "",
      department: department || "",
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
  }, [isEdited, onClose]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    // Проверяем размер файла (2 МБ = 2 * 1024 * 1024 байт)
    const maxSizeInBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxSizeInBytes) {
      alert("Размер файла не должен превышать 2 МБ!");
      setFormData((prevState) => ({
        ...prevState,
        images: null,
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Сброс значения в DOM-элементе
      }
      return;
    }

    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        images: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const selectedDepartment = addTarif.find(
            (dept) => dept.name === formData.department
        );

        let response_update_user = await uploadFile({
            variables: {
                input: {
                    id: user.id,
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    position: formData.position,
                    login: formData.login,
                    password: formData.password,
                    airlineId: id,
                    airlineDepartmentId: selectedDepartment?.id,
                },
                images: formData.images,
            },
        });

        // console.log("Response from uploadFile:", response_update_user);

        if (response_update_user) {
            const updatedUser = response_update_user.data.updateUser;

            const updatedTarif = addTarif.map((department) => {
                // Если пользователь находится в этом отделе
                if (department.users.some((u) => u.id === user.id)) {
                    // Если это старый отдел и отдел изменился, удаляем пользователя
                    if (department.name !== formData.department) {
                        return {
                            ...department,
                            users: department.users.filter((u) => u.id !== user.id),
                        };
                    } else {
                        // Если отдел не изменился, просто обновляем данные пользователя
                        return {
                            ...department,
                            users: department.users.map((u) =>
                                u.id === updatedUser.id ? { ...u, ...updatedUser } : u
                            ),
                        };
                    }
                }

                // Если это новый отдел, добавляем пользователя
                if (department.name === formData.department) {
                    return {
                        ...department,
                        users: [
                            ...department.users,
                            { ...user, ...updatedUser },
                        ].sort((a, b) => a.name.localeCompare(b.name)),
                    };
                }

                // Если отдел не связан с изменениями, возвращаем как есть
                return department;
            });

            // console.log("Updated Tarif:", updatedTarif);

            onSubmit(updatedTarif); // Обновляем состояние в родительском компоненте
            resetForm();
            onClose();
        }
    } catch (err) {
        console.error("Error during update:", err);
        alert("Произошла ошибка при обновлении пользователя");
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
        <div className={classes.requestTitle_name}>Редактировать</div>
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

          <label>Отдел</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
          >
            {addTarif.map((department, index) => (
              <option key={index} value={department.name}>
                {department.name}
              </option>
            ))}
          </select>

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
            type="text"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Введите пароль"
          />

          <label>Аватар</label>
          <input type="file" name="images" onChange={handleFileChange} ref={fileInputRef} />
        </div>
      </div>

      <div className={classes.requestButton}>
        <Button type="submit" onClick={handleSubmit}>
          Сохранить изменения
        </Button>
      </div>
    </Sidebar>
  );
}

export default EditRequestAirlineCompany;
