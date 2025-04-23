import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestAirlineOtdel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_AIRLINE_DEPARTMERT,
  decodeJWT,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";

function EditRequestAirlineOtdel({
  show,
  onClose,
  id,
  category,
  positions, // Все доступные должности
  onSubmit,
  addNotification,
}) {
  const [userRole, setUserRole] = useState();
  const token = getCookie("token");

  useEffect(() => {
    setUserRole(decodeJWT(token).role);
  }, [token]);

  const [isEdited, setIsEdited] = useState(false);
  const [formData, setFormData] = useState({
    type: category?.name || "",
  });
  // Инициализируем выбранные должности из category?.position (если они есть)
  const [selectedPositions, setSelectedPositions] = useState(
    category && category.position ? category.position.map((pos) => pos.id) : []
  );

  const sidebarRef = useRef();

  useEffect(() => {
    if (show && category) {
      setFormData({ type: category.name });
      setSelectedPositions(
        category.position ? category.position.map((pos) => pos.id) : []
      );
    }
  }, [show, category]);

  const resetForm = useCallback(() => {
    setFormData({
      type: category?.name || "",
    });
    setSelectedPositions(
      category && category.position ? category.position.map((pos) => pos.id) : []
    );
    setIsEdited(false);
  }, [category]);

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
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  // Обработка переключения чекбоксов для должностей
  const handlePositionToggle = (id) => {
    setIsEdited(true);
    setSelectedPositions((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((posId) => posId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const [createAirlineDepartment] = useMutation(CREATE_AIRLINE_DEPARTMERT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  // console.log(category?.id);
  // console.log(formData.type);
  // console.log(selectedPositions);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let request = await createAirlineDepartment({
        variables: {
          updateAirlineId: id,
          input: {
            department: [
              {
                id: category.id,
                name: formData.type,
                positionIds: selectedPositions, // Передаём выбранные id должностей
              },
            ],
          },
        },
      });

      // console.log(request);
      

      if (request) {
        const sortedDepartments = request.data.updateAirline.department
          .map((department) => ({
            ...department,
            users: department.users.sort((a, b) =>
              a.name.localeCompare(b.name)
            ),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        onSubmit(sortedDepartments);
        resetForm();
        setIsLoading(false);
        addNotification("Редактирование отдела прошло успешно.", "success");
      }
    } catch (err) {
      setIsLoading(false);
      alert("Произошла ошибка при сохранении данных");
      console.error(err);
      
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current?.contains(event.target)) {
        return;
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

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Изменить отдел</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="Закрыть" />
        </div>
      </div>
      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Название отдела</label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="Пример: Отдел продаж"
              />
              <div className={classes.positionsContainer}>
                <label>Должности:</label>
                {positions &&
                  positions?.map((position) => (
                    <div key={position.id} className={classes.checkboxItem}>
                      <input
                        type="checkbox"
                        id={`position-${position.id}`}
                        value={position.id}
                        checked={selectedPositions.includes(position.id)}
                        onChange={() => handlePositionToggle(position.id)}
                      />
                      <label htmlFor={`position-${position.id}`}>
                        {position.name}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Изменить
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestAirlineOtdel;
