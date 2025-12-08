import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestAirlineOtdel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_AIRLINE_DEPARTMERT,
  decodeJWT,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";

function CreateRequestAirlineOtdel({
  show,
  onClose,
  id,
  representative,
  addTarif,
  setAddTarif,
  addNotification,
  positions,
}) {
  const [userRole, setUserRole] = useState();
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const token = getCookie("token");

  useEffect(() => {
    setUserRole(decodeJWT(token).role);
  }, [token]);

  const [formData, setFormData] = useState({
    category: "",
  });

  // Состояние для выбранных должностей (id)
  const [selectedPositions, setSelectedPositions] = useState([]);

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      category: "",
    });
    setSelectedPositions([]);
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

  // Обработка выбора/снятия галочки для должностей
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Проверка на заполненность поля
    if (!formData.category.trim()) {
      alert("Пожалуйста, введите название отдела.");
      setIsLoading(false);
      return;
    }

    try {
      let request = await createAirlineDepartment({
        variables: {
          updateAirlineId: id,
          input: {
            department: [
              {
                name: formData.category,
                // positionIds: selectedPositions,
              },
            ],
          },
        },
      });

      if (request) {
        setAddTarif(
          request.data.updateAirline.department.sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );

        resetForm();
        onClose();
        setIsLoading(false);
        addNotification("Добавление отдела прошло успешно.", "success");
      }
    } catch (err) {
      setIsLoading(false);
      alert("Произошла ошибка при сохранении данных");
      console.error("catch error:", err);
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

  // console.log(selectedPositions);
  

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить отдел</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Название</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Пример: Отдел продаж"
              />
              {/* <div className={classes.positionsContainer}>
                <label>Должности:</label>
                {positions &&
                  positions?.map((position) => (
                    <div key={position.id} className={classes.checkboxItem}>
                      <label htmlFor={`position-${position.id}`}>
                        {position.name}
                      </label>
                      <input
                        type="checkbox"
                        id={`position-${position.id}`}
                        value={position.id}
                        checked={selectedPositions.includes(position.id)}
                        onChange={() => handlePositionToggle(position.id)}
                      />
                    </div>
                  ))}
              </div> */}
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Добавить
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestAirlineOtdel;
