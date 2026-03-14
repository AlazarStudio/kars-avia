import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import classes from "./EditRepresentativeRequest.module.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import { GET_PASSENGER_REQUEST, getCookie, UPDATE_PASSENGER_REQUEST } from "../../../../graphQL_requests.js";
import MUILoader from "../MUILoader/MUILoader.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import Button from "../../Standart/Button/Button.jsx";

function isoToTimeString(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}

function isoToDateString(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function buildPlannedAt(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function buildPlannedFromTo(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  const [y, m, day] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, day, hours, minutes, 0, 0);
  return date.toISOString();
}

const initialFormState = {
  waterEnabled: false,
  waterPeopleCount: "",
  waterPlannedAt: "",
  mealEnabled: false,
  mealPeopleCount: "",
  mealPlannedAt: "",
  livingEnabled: false,
  livingPeopleCount: "",
  livingPlannedFromDate: "",
  livingPlannedFromTime: "",
  livingPlannedToDate: "",
  livingPlannedToTime: "",
  transferEnabled: false,
  transferPeopleCount: "",
  transferPlannedAt: "",
  baggageEnabled: false,
  baggagePlannedAt: "",
};

function EditRepresentativeRequest({ show, onClose, request, addNotification, onOpenCancelConfirm, cancellingRequest = false }) {
  const token = getCookie("token");
  const [formData, setFormData] = useState(initialFormState);
  const [isEdited, setIsEdited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sidebarRef = useRef();

  const fillFormFromRequest = useCallback(() => {
    if (!request) return;
    const p = (s, field) => s?.plan?.[field];
    const hasWater = request?.waterService?.plan?.enabled;
    const hasMeal = request?.mealService?.plan?.enabled;
    const hasLiving = request?.livingService?.plan?.enabled;
    const hasTransfer = request?.transferService?.plan?.enabled;
    const hasBaggage = request?.baggageDeliveryService?.plan?.enabled;
    setFormData({
      waterEnabled: !!hasWater,
      waterPeopleCount: hasWater ? String(p(request.waterService, "peopleCount") ?? "") : "",
      waterPlannedAt: hasWater ? isoToTimeString(p(request.waterService, "plannedAt")) : "",
      mealEnabled: !!hasMeal,
      mealPeopleCount: hasMeal ? String(p(request.mealService, "peopleCount") ?? "") : "",
      mealPlannedAt: hasMeal ? isoToTimeString(p(request.mealService, "plannedAt")) : "",
      livingEnabled: !!hasLiving,
      livingPeopleCount: hasLiving ? String(p(request.livingService, "peopleCount") ?? "") : "",
      livingPlannedFromDate: hasLiving ? isoToDateString(p(request.livingService, "plannedFromAt")) : "",
      livingPlannedFromTime: hasLiving ? isoToTimeString(p(request.livingService, "plannedFromAt")) : "",
      livingPlannedToDate: hasLiving ? isoToDateString(p(request.livingService, "plannedToAt")) : "",
      livingPlannedToTime: hasLiving ? isoToTimeString(p(request.livingService, "plannedToAt")) : "",
      transferEnabled: !!hasTransfer,
      transferPeopleCount: hasTransfer ? String(p(request.transferService, "peopleCount") ?? "") : "",
      transferPlannedAt: hasTransfer ? isoToTimeString(p(request.transferService, "plannedAt")) : "",
      baggageEnabled: !!hasBaggage,
      baggagePlannedAt: hasBaggage ? isoToTimeString(p(request.baggageDeliveryService, "plannedAt")) : "",
    });
    setIsEdited(false);
  }, [request]);

  useEffect(() => {
    if (show && request) {
      fillFormFromRequest();
    }
  }, [show, request?.id, fillFormFromRequest]);

  const [updatePassengerRequest] = useMutation(UPDATE_PASSENGER_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    refetchQueries: [{ query: GET_PASSENGER_REQUEST, variables: { passengerRequestId: request?.id } }],
    awaitRefetchQueries: true,
  });

  const closeButton = useCallback(() => {
    if (!isEdited) {
      onClose();
      return;
    }
    if (window.confirm("Вы уверены? Несохранённые данные будут потеряны.")) {
      onClose();
    }
  }, [isEdited, onClose]);

  const handleChange = useCallback((e) => {
    const { name, type, checked, value } = e.target;
    setIsEdited(true);
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const buildPlan = (enabled, data) => (enabled ? data : { ...data, enabled: false });

  const handleSubmit = async () => {
    if (!request?.id) return;
    setIsLoading(true);
    const input = {};

    input.waterService = {
      plan: buildPlan(formData.waterEnabled, {
        enabled: true,
        peopleCount: formData.waterPeopleCount ? Number(formData.waterPeopleCount) : (request?.waterService?.plan?.peopleCount ?? undefined),
        plannedAt: (buildPlannedAt(formData.waterPlannedAt) ?? request?.waterService?.plan?.plannedAt) ?? undefined,
      }),
    };
    input.mealService = {
      plan: buildPlan(formData.mealEnabled, {
        enabled: true,
        peopleCount: formData.mealPeopleCount ? Number(formData.mealPeopleCount) : (request?.mealService?.plan?.peopleCount ?? undefined),
        plannedAt: (buildPlannedAt(formData.mealPlannedAt) ?? request?.mealService?.plan?.plannedAt) ?? undefined,
      }),
    };
    input.livingService = {
      plan: buildPlan(formData.livingEnabled, {
        enabled: true,
        peopleCount: formData.livingPeopleCount ? Number(formData.livingPeopleCount) : (request?.livingService?.plan?.peopleCount ?? undefined),
        plannedFromAt: (buildPlannedFromTo(formData.livingPlannedFromDate, formData.livingPlannedFromTime) ?? request?.livingService?.plan?.plannedFromAt) ?? undefined,
        plannedToAt: (buildPlannedFromTo(formData.livingPlannedToDate, formData.livingPlannedToTime) ?? request?.livingService?.plan?.plannedToAt) ?? undefined,
      }),
    };
    input.transferService = {
      plan: buildPlan(formData.transferEnabled, {
        enabled: true,
        peopleCount: formData.transferPeopleCount ? Number(formData.transferPeopleCount) : (request?.transferService?.plan?.peopleCount ?? undefined),
        plannedAt: (buildPlannedAt(formData.transferPlannedAt) ?? request?.transferService?.plan?.plannedAt) ?? undefined,
      }),
    };
    input.baggageDeliveryService = {
      plan: buildPlan(formData.baggageEnabled, {
        enabled: true,
        plannedAt: (buildPlannedAt(formData.baggagePlannedAt) ?? request?.baggageDeliveryService?.plan?.plannedAt) ?? undefined,
      }),
    };

    try {
      await updatePassengerRequest({
        variables: { updatePassengerRequestId: request.id, input },
      });
      onClose();
      if (addNotification) {
        addNotification("Заявка обновлена.", "success");
      }
    } catch (error) {
      console.error(error);
      if (addNotification) {
        addNotification("Ошибка при сохранении заявки.", "error");
      } else {
        alert("Ошибка при сохранении заявки.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Редактировать заявку</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize="50px" fullHeight="75vh" />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              {/* <div className={classes.typeServices}>Вид услуг</div> */}

              <label className={classes.checkBoxWrapper}>
                <input
                  type="checkbox"
                  name="waterEnabled"
                  checked={formData.waterEnabled}
                  onChange={handleChange}
                />
                Поставка питьевой воды
              </label>
              {formData.waterEnabled && (
                <>
                  <label>Введите количество человек</label>
                  <input
                    type="number"
                    name="waterPeopleCount"
                    value={formData.waterPeopleCount}
                    onChange={handleChange}
                    min={0}
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

              <label className={classes.checkBoxWrapper}>
                <input
                  type="checkbox"
                  name="mealEnabled"
                  checked={formData.mealEnabled}
                  onChange={handleChange}
                />
                Поставка питания
              </label>
              {formData.mealEnabled && (
                <>
                  <label>Введите количество человек</label>
                  <input
                    type="number"
                    name="mealPeopleCount"
                    value={formData.mealPeopleCount}
                    onChange={handleChange}
                    min={0}
                  />
                  <label>Введите время</label>
                  <input
                    type="time"
                    name="mealPlannedAt"
                    value={formData.mealPlannedAt}
                    onChange={handleChange}
                    placeholder="Время"
                  />
                </>
              )}

              <label className={classes.checkBoxWrapper}>
                <input
                  type="checkbox"
                  name="livingEnabled"
                  checked={formData.livingEnabled}
                  onChange={handleChange}
                />
                Проживание
              </label>
              {formData.livingEnabled && (
                <>
                  <label>Введите количество человек</label>
                  <input
                    type="number"
                    name="livingPeopleCount"
                    value={formData.livingPeopleCount}
                    onChange={handleChange}
                    min={0}
                  />
                  <label>Дата и время заезда</label>
                  <input
                    type="date"
                    name="livingPlannedFromDate"
                    value={formData.livingPlannedFromDate}
                    onChange={handleChange}
                  />
                  <input
                    type="time"
                    name="livingPlannedFromTime"
                    value={formData.livingPlannedFromTime}
                    onChange={handleChange}
                  />
                  <label>Дата и время выезда</label>
                  <input
                    type="date"
                    name="livingPlannedToDate"
                    value={formData.livingPlannedToDate}
                    onChange={handleChange}
                  />
                  <input
                    type="time"
                    name="livingPlannedToTime"
                    value={formData.livingPlannedToTime}
                    onChange={handleChange}
                  />
                </>
              )}

              <label className={classes.checkBoxWrapper}>
                <input
                  type="checkbox"
                  name="transferEnabled"
                  checked={formData.transferEnabled}
                  onChange={handleChange}
                />
                Трансфер
              </label>
              {formData.transferEnabled && (
                <>
                  <label>Введите количество человек</label>
                  <input
                    type="number"
                    name="transferPeopleCount"
                    value={formData.transferPeopleCount}
                    onChange={handleChange}
                    min={0}
                  />
                  <label>Введите время</label>
                  <input
                    type="time"
                    name="transferPlannedAt"
                    value={formData.transferPlannedAt}
                    onChange={handleChange}
                    placeholder="Время"
                  />
                </>
              )}

              <label className={classes.checkBoxWrapper}>
                <input
                  type="checkbox"
                  name="baggageEnabled"
                  checked={formData.baggageEnabled}
                  onChange={handleChange}
                />
                Доставка багажа
              </label>
              {formData.baggageEnabled && (
                <>
                  <label>Введите время</label>
                  <input
                    type="time"
                    name="baggagePlannedAt"
                    value={formData.baggagePlannedAt}
                    onChange={handleChange}
                    placeholder="Время"
                  />
                </>
              )}
            </div>
          </div>

          <div className={classes.requestButton}>
            {request?.status !== "CANCELLED" && onOpenCancelConfirm && (
              <Button
                type="button"
                onClick={onOpenCancelConfirm}
                disabled={cancellingRequest || isLoading}
                backgroundcolor="var(--red)"
                color="#FFFFFF"
              >
                {cancellingRequest ? "Отмена…" : "Отменить заявку"}
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={isLoading}>
              Сохранить
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default EditRepresentativeRequest;
