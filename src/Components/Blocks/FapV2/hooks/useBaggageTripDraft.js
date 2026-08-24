import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  UPDATE_PASSENGER_REQUEST_BAGGAGE_DRIVER,
  getCookie,
} from "../../../../../graphQL_requests";
import { useToast } from "../../../../contexts/ToastContext";
// Цепочка разбора ошибки переехала в src/utils/apolloErrorText.js — там же
// осталось обоснование про HTTP 400 до GraphQL-слоя. Фолбэк по умолчанию
// у хелпера тот же, что был здесь: «Ошибка при сохранении».
import { apolloErrorText } from "../../../../utils/apolloErrorText.js";

// Дополнительные поля патча принимаем только обычным объектом. Хук вызывают из
// нескольких мест, и колбэк, попавший прямо в onClick, приносит первым
// аргументом клик-событие: разложенное в патч, оно уносит на сервер nativeEvent,
// target и прочий мусор, и мутация отбивается целиком. Проверяем по существу —
// объект без чужого прототипа, — а не по имени класса события.
const isPlainObject = (v) => {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};

// Черновик полей уровня поездки доставки багажа (тип ТС, ожидаемое количество
// пассажиров) и запись патча. Поля правятся из двух мест — компактной карточки в
// списке услуги и страницы поездки, — поэтому черновик, сравнение с сервером и
// вызов мутации живут здесь, а не копируются дважды. Дату доставки руками не
// задают: её проставляет кнопка «Завершить».
//
// save(extraPatch) принимает дополнительные поля патча: страница поездки шлёт
// вместе с полями ещё и список пассажиров, а карточка — только свои поля.
// Возвращает true при успешной записи — вызывающему это нужно, чтобы честно
// сбросить свой собственный черновик (список пассажиров).
export function useBaggageTripDraft({
  driver,
  requestId,
  driverIndex,
  onRefetch,
}) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const [updateBaggageDriver] = useMutation(
    UPDATE_PASSENGER_REQUEST_BAGGAGE_DRIVER,
    { context: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const [vehicleType, setVehicleType] = useState(driver?.vehicleType ?? "");
  // Значение <input type="number">: держим строкой, пустая строка означает
  // «ожидаемое количество не задано» (у поездок, созданных до его появления).
  const [peopleCount, setPeopleCount] = useState(
    driver?.peopleCount != null ? String(driver.peopleCount) : ""
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVehicleType(driver?.vehicleType ?? "");
  }, [driver?.vehicleType]);

  useEffect(() => {
    setPeopleCount(driver?.peopleCount != null ? String(driver.peopleCount) : "");
  }, [driver?.peopleCount]);

  const vtNext = vehicleType.trim();
  const vtPrev = (driver?.vehicleType ?? "").trim();

  const pcNext = peopleCount.trim();
  const pcPrev = driver?.peopleCount != null ? String(driver.peopleCount) : "";
  const pcChanged = pcNext !== pcPrev;

  const patch = {};
  if (vtNext !== vtPrev) patch.vehicleType = vtNext === "" ? null : vtNext;
  if (pcChanged) patch.peopleCount = pcNext === "" ? null : Number(pcNext);

  const dirty = vtNext !== vtPrev || pcChanged;

  const save = async (extraPatch) => {
    const full = { ...patch, ...(isPlainObject(extraPatch) ? extraPatch : {}) };
    if (Object.keys(full).length === 0) return true;
    try {
      setSaving(true);
      await updateBaggageDriver({
        variables: { requestId, driverIndex, patch: full },
      });
      success("Сохранено");
      onRefetch?.();
      return true;
    } catch (e) {
      notifyError(apolloErrorText(e));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    vehicleType,
    setVehicleType,
    peopleCount,
    setPeopleCount,
    dirty,
    save,
    saving,
  };
}
