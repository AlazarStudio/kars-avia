import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import classes from "./AddRepresentativeService.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  CREATE_PASSENGER_REQUEST,
  GET_PASSENGER_REQUEST,
  GET_PASSENGER_REQUESTS,
  getCookie,
  UPDATE_PASSENGER_REQUEST,
} from "../../../../graphQL_requests.js";
import MUILoader from "../MUILoader/MUILoader.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";

function AddRepresentativeService({
  show,
  onClose,
  user,
  request,
  addNotification,
}) {
  const token = getCookie("token");
  const [isEdited, setIsEdited] = useState(false);
  const sidebarRef = useRef();

  // Определяем, какие услуги уже есть в заявке
  const hasWaterService = request?.waterService?.plan.enabled;
  const hasMealService = request?.mealService?.plan.enabled;
  const hasLivingService = request?.livingService?.plan.enabled;
  const hasTransferHabitation = request?.livingService?.withTransfer;

  // Инициализируем форму только для услуг, которых еще нет
  const [formData, setFormData] = useState({
    waterSupply: false,
    waterPeopleCount: "",
    waterPlannedAt: "",
    foodSupply: false,
    foodPeopleCount: "",
    foodPlannedAt: "",
    habitation: false,
    habitationPeopleCount: "",
    habitationPlannedAt: "",
    transferHabitation: false,
    transferHabitationPeopleCount: "",
    transferHabitationPlannedAt: "",
  });

  const [updatePassengerRequest] = useMutation(UPDATE_PASSENGER_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    refetchQueries: [{ query: GET_PASSENGER_REQUEST, variables: { passengerRequestId: request?.id } }],
    awaitRefetchQueries: true,
  });

  const resetForm = useCallback(() => {
    setFormData({
      waterSupply: false,
      waterPeopleCount: "",
      waterPlannedAt: "",
      foodSupply: false,
      foodPeopleCount: "",
      foodPlannedAt: "",
      habitation: false,
      habitationPeopleCount: "",
      habitationPlannedAt: "",
      transferHabitation: false,
      transferHabitationPeopleCount: "",
      transferHabitationPlannedAt: "",
    });
    setIsEdited(false);
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
    const { name, type, checked, value } = e.target;
    setIsEdited(true);

    if (type === "checkbox") {
      setFormData((prev) => {
        // взаимоисключающие флаги с полным сбросом полей
        if (name === "habitation") {
          return {
            ...prev,
            habitation: checked,
            habitationPeopleCount: checked ? prev.habitationPeopleCount : "",
            habitationPlannedAt: checked ? prev.habitationPlannedAt : "",
            transferHabitation: checked ? false : prev.transferHabitation,
            transferHabitationPeopleCount: checked
              ? ""
              : prev.transferHabitationPeopleCount,
            transferHabitationPlannedAt: checked
              ? ""
              : prev.transferHabitationPlannedAt,
          };
        }

        if (name === "transferHabitation") {
          return {
            ...prev,
            transferHabitation: checked,
            transferHabitationPeopleCount: checked
              ? prev.transferHabitationPeopleCount
              : "",
            transferHabitationPlannedAt: checked
              ? prev.transferHabitationPlannedAt
              : "",
            habitation: checked ? false : prev.habitation,
            habitationPeopleCount: checked ? "" : prev.habitationPeopleCount,
            habitationPlannedAt: checked ? "" : prev.habitationPlannedAt,
          };
        }

        if (name === "waterSupply") {
          return {
            ...prev,
            waterSupply: checked,
            waterPeopleCount: checked ? prev.waterPeopleCount : "",
            waterPlannedAt: checked ? prev.waterPlannedAt : "",
          };
        }

        if (name === "foodSupply") {
          return {
            ...prev,
            foodSupply: checked,
            foodPeopleCount: checked ? prev.foodPeopleCount : "",
            foodPlannedAt: checked ? prev.foodPlannedAt : "",
          };
        }

        return {
          ...prev,
          [name]: checked,
        };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const buildPlannedAt = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  const isFormValid = () => {
    // Проверяем только те услуги, которых еще нет в заявке
    const hasAnyNewService =
      (!hasWaterService && formData.waterSupply) ||
      (!hasMealService && formData.foodSupply) ||
      (!hasLivingService && (formData.habitation || formData.transferHabitation));

    if (!hasAnyNewService) return false;

    // Проверяем заполненность полей только для новых услуг
    if (!hasWaterService && formData.waterSupply) {
      if (!formData.waterPeopleCount || !formData.waterPlannedAt) return false;
    }

    if (!hasMealService && formData.foodSupply) {
      if (!formData.foodPeopleCount || !formData.foodPlannedAt) return false;
    }

    if (!hasLivingService) {
      if (formData.habitation && (!formData.habitationPeopleCount || !formData.habitationPlannedAt)) return false;
      if (formData.transferHabitation && (!formData.transferHabitationPeopleCount || !formData.transferHabitationPlannedAt)) return false;
    }

    return true;
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);

    if (!isFormValid()) {
      alert("Пожалуйста, заполните все обязательные поля для выбранных услуг.");
      setIsLoading(false);
      return;
    }

    const input = {};

    // Добавляем только те услуги, которых еще нет в заявке
    if (!hasWaterService && formData.waterSupply) {
      input.waterService = {
        plan: {
          enabled: true,
          peopleCount: Number(formData.waterPeopleCount),
          plannedAt: buildPlannedAt(formData.waterPlannedAt),
        },
      };
    }

    if (!hasMealService && formData.foodSupply) {
      input.mealService = {
        plan: {
          enabled: true,
          peopleCount: Number(formData.foodPeopleCount),
          plannedAt: buildPlannedAt(formData.foodPlannedAt),
        },
      };
    }

    if (!hasLivingService && (formData.habitation || formData.transferHabitation)) {
      input.livingService = {
        plan: {
          enabled: true,
          peopleCount: Number(formData.habitationPeopleCount) || Number(formData.transferHabitationPeopleCount),
          plannedAt: buildPlannedAt(formData.habitationPlannedAt) || buildPlannedAt(formData.transferHabitationPlannedAt),
        },
        withTransfer: formData.transferHabitation,
      };
    }

    // Если нет новых услуг для добавления
    if (Object.keys(input).length === 0) {
      alert("Нет новых услуг для добавления.");
      setIsLoading(false);
      return;
    }

    console.log(input);

    try {
      const response = await updatePassengerRequest({
        variables: { updatePassengerRequestId: request?.id, input },
      });
      resetForm();
      onClose();
      if (addNotification) {
        addNotification("Добавление услуги прошло успешно.", "success");
      }
    } catch (error) {
      console.error(error);
      alert("Ошибка при добавлении услуги");
    } finally {
      setIsLoading(false);
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

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  return (
    <>
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>Добавить услугу</div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>

        {isLoading ? (
          <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
        ) : (
          <>
            <div className={classes.requestMiddle}>
              <div className={classes.requestData}>
                <div className={classes.typeServices}>Вид услуг</div>

                {/* Показываем только если услуги еще нет в заявке */}
                {!hasWaterService && (
                  <>
                    <label className={classes.checkBoxWrapper}>
                      <input
                        type="checkbox"
                        name="waterSupply"
                        checked={formData.waterSupply}
                        onChange={handleChange}
                      />
                      Поставка питьевой воды
                    </label>

                    {formData.waterSupply && (
                      <>
                        <label>Введите количество человек</label>
                        <input
                          type="number"
                          name="waterPeopleCount"
                          value={formData.waterPeopleCount}
                          onChange={handleChange}
                        />

                        <label>Введите время</label>
                        <input
                          type="time"
                          name="waterPlannedAt"
                          value={formData.waterPlannedAt}
                          onChange={handleChange}
                          placeholder="Время"
                        />
                      </>
                    )}
                  </>
                )}

                {!hasMealService && (
                  <>
                    <label className={classes.checkBoxWrapper}>
                      <input
                        type="checkbox"
                        name="foodSupply"
                        checked={formData.foodSupply}
                        onChange={handleChange}
                      />
                      Поставка питания
                    </label>

                    {formData.foodSupply && (
                      <>
                        <label>Введите количество человек</label>
                        <input
                          type="number"
                          name="foodPeopleCount"
                          value={formData.foodPeopleCount}
                          onChange={handleChange}
                        />

                        <label>Введите время</label>
                        <input
                          type="time"
                          name="foodPlannedAt"
                          value={formData.foodPlannedAt}
                          onChange={handleChange}
                          placeholder="Время"
                        />
                      </>
                    )}
                  </>
                )}

                {/* Услуги проживания показываем только если их еще нет */}
                {!hasLivingService && (
                  <>
                    <label className={classes.checkBoxWrapper}>
                      <input
                        type="checkbox"
                        name="habitation"
                        checked={formData.habitation}
                        onChange={handleChange}
                      />
                      Проживание
                    </label>

                    {formData.habitation && (
                      <>
                        <label>Введите количество человек</label>
                        <input
                          type="number"
                          name="habitationPeopleCount"
                          value={formData.habitationPeopleCount}
                          onChange={handleChange}
                        />

                        <label>Введите время</label>
                        <input
                          type="time"
                          name="habitationPlannedAt"
                          value={formData.habitationPlannedAt}
                          onChange={handleChange}
                          placeholder="Время"
                        />
                      </>
                    )}

                    <label className={classes.checkBoxWrapper}>
                      <input
                        type="checkbox"
                        name="transferHabitation"
                        checked={formData.transferHabitation}
                        onChange={handleChange}
                      />
                      Трансфер+Проживание
                    </label>

                    {formData.transferHabitation && (
                      <>
                        <label>Введите количество человек</label>
                        <input
                          type="number"
                          name="transferHabitationPeopleCount"
                          value={formData.transferHabitationPeopleCount}
                          onChange={handleChange}
                        />

                        <label>Введите время</label>
                        <input
                          type="time"
                          name="transferHabitationPlannedAt"
                          value={formData.transferHabitationPlannedAt}
                          onChange={handleChange}
                          placeholder="Время"
                        />
                      </>
                    )}
                  </>
                )}

                {/* Сообщение, если все услуги уже добавлены */}
                {hasWaterService && hasMealService && hasLivingService && (
                  <div className={classes.noServicesMessage}>
                    Все доступные услуги уже добавлены в заявку.
                  </div>
                )}
              </div>
            </div>

            <div className={classes.requestButton}>
              <Button onClick={handleSubmit}>Добавить услугу</Button>
            </div>
          </>
        )}
      </Sidebar>
    </>
  );
}

export default AddRepresentativeService;