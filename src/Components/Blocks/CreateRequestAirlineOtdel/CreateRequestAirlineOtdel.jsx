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
import CloseIcon from "../../../shared/icons/CloseIcon";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

const ALL_ACCESS_ENABLED = {
  requestMenu: true, requestCreate: true, requestUpdate: true, requestChat: true,
  transferMenu: true, transferCreate: true, transferUpdate: true, transferChat: true,
  personalMenu: true, personalCreate: true, personalUpdate: true,
  reserveMenu: true, reserveCreate: true, reserveUpdate: true, reserveUpdateCompleted: false,
  analyticsMenu: true, analyticsUpload: true,
  reportMenu: true, reportCreate: true,
  userMenu: true, userCreate: true, userUpdate: true,
  airlineMenu: true, airlineUpdate: true,
  contracts: true, contractCreate: true, contractUpdate: true,
  organizationMenu: true, organizationCreate: true, organizationUpdate: true,
  organizationAddDrivers: true, organizationAcceptDrivers: true,
  travellineMenu: true, accessManage: false,
};

const ALL_NOTIFICATIONS_ENABLED = {
  requestCreate: true, emailRequestCreate: true, sitePushRequestCreate: true,
  requestDatesChange: true, emailRequestDatesChange: true, sitePushRequestDatesChange: true,
  requestPlacementChange: true, emailRequestPlacementChange: true, sitePushRequestPlacementChange: true,
  requestCancel: true, emailRequestCancel: true, sitePushRequestCancel: true,
  passengerRequestCreate: true, emailPassengerRequestCreate: true, sitePushPassengerRequestCreate: true,
  passengerRequestDatesChange: true, emailPassengerRequestDatesChange: true, sitePushPassengerRequestDatesChange: true,
  passengerRequestUpdate: true, emailPassengerRequestUpdate: true, sitePushPassengerRequestUpdate: true,
  passengerRequestPlacementChange: true, emailPassengerRequestPlacementChange: true, sitePushPassengerRequestPlacementChange: true,
  passengerRequestCancel: true, emailPassengerRequestCancel: true, sitePushPassengerRequestCancel: true,
  newMessage: true, emailNewMessage: true, sitePushNewMessage: true,
};

function CreateRequestAirlineOtdel({
  show,
  onClose,
  id,
  representative,
  addTarif,
  setAddTarif,
  positions,
}) {
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  const [userRole, setUserRole] = useState();
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const token = getCookie("token");

  useEffect(() => {
    setUserRole(decodeJWT(token).role);
  }, [token]);

  const [formData, setFormData] = useState({
    category: "",
    email: "",
  });

  // Состояние для выбранных должностей (id)
  const [selectedPositions, setSelectedPositions] = useState([]);

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      category: "",
      email: "",
    });
    setSelectedPositions([]);
    setIsEdited(false); // Сброс флага изменений
  }, []);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }

    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      resetForm();
      onClose();
    }
  }, [isEdited, resetForm, onClose, confirm, isDialogOpen]);

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
      showAlert("Пожалуйста, введите название отдела.");
      setIsLoading(false);
      return;
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showAlert("Введите корректный email.");
        setIsLoading(false);
        return;
      }
    }

    try {
      let request = await createAirlineDepartment({
        variables: {
          updateAirlineId: id,
          input: {
            department: [
              {
                name: formData.category,
                email: formData.email || null,
                accessMenu: ALL_ACCESS_ENABLED,
                notificationMenu: ALL_NOTIFICATIONS_ENABLED,
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
        success("Добавление отдела прошло успешно.");
      }
    } catch (err) {
      setIsLoading(false);
      notifyError("Произошла ошибка при сохранении данных");
      console.error("catch error:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;

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
  }, [show, closeButton, isDialogOpen]);

  // console.log(selectedPositions);


  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить отдел</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <span className={classes.hint}>* — обязательные поля</span>
              <label className={classes.required}>Название</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Пример: Отдел продаж"
              />
              <label>Почта</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@mail.ru"
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
