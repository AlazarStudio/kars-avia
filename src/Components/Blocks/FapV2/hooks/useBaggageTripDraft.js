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
import {
  toDraftString,
  toMoneyOrNull,
  toWholeCountOrNull,
} from "../fapConstants.js";

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
  const [peopleCount, setPeopleCount] = useState(toDraftString(driver?.peopleCount));
  // Деньги и километраж — строками, как reportCost пассажира на странице поездки:
  // пустая строка = «не задано», в патч уходит нормализованное число.
  const [driverCost, setDriverCost] = useState(toDraftString(driver?.driverCost));
  const [distanceKm, setDistanceKm] = useState(toDraftString(driver?.distanceKm));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVehicleType(driver?.vehicleType ?? "");
  }, [driver?.vehicleType]);

  useEffect(() => {
    setPeopleCount(toDraftString(driver?.peopleCount));
  }, [driver?.peopleCount]);

  useEffect(() => {
    setDriverCost(toDraftString(driver?.driverCost));
  }, [driver?.driverCost]);

  useEffect(() => {
    setDistanceKm(toDraftString(driver?.distanceKm));
  }, [driver?.distanceKm]);

  const vtNext = vehicleType.trim();
  const vtPrev = (driver?.vehicleType ?? "").trim();

  // Числа сравниваем ЧИСЛАМИ после той же нормализации, какую применит бэк
  // (services/passengerRequest/coerce.js). Строковое сравнение считало «60.10»
  // отличным от 60.1, а «-5» — отличным от записанного бэком null: патч не
  // пустел после успешного сохранения, и кнопка «Сохранить» оставалась активной.
  const pcNext = toWholeCountOrNull(peopleCount);
  const pcChanged = pcNext !== (driver?.peopleCount ?? null);

  const dcNext = toMoneyOrNull(driverCost);
  const dcChanged = dcNext !== (driver?.driverCost ?? null);

  const kmNext = toMoneyOrNull(distanceKm);
  const kmChanged = kmNext !== (driver?.distanceKm ?? null);

  const patch = {};
  if (vtNext !== vtPrev) patch.vehicleType = vtNext === "" ? null : vtNext;
  if (pcChanged) patch.peopleCount = pcNext;
  if (dcChanged) patch.driverCost = dcNext;
  if (kmChanged) patch.distanceKm = kmNext;

  const dirty = vtNext !== vtPrev || pcChanged || dcChanged || kmChanged;

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
    driverCost,
    setDriverCost,
    distanceKm,
    setDistanceKm,
    dirty,
    save,
    saving,
  };
}
