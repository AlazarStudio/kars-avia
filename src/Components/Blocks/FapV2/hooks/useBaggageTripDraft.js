import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  UPDATE_PASSENGER_REQUEST_BAGGAGE_DRIVER,
  getCookie,
} from "../../../../../graphQL_requests";
import { toLocalInputValue } from "../fapConstants";
import { useToast } from "../../../../contexts/ToastContext";

// Черновик полей уровня поездки доставки багажа (тип ТС + дата доставки) и
// запись патча. Эти поля правятся из двух мест — компактной карточки в списке
// услуги и страницы поездки, — поэтому черновики, сравнение с сервером и вызов
// мутации живут здесь, а не копируются дважды.
//
// save(extraPatch) принимает дополнительные поля патча: страница поездки шлёт
// вместе с полями ещё и список пассажиров, а карточка — только свои поля.
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
  const [deliveredAt, setDeliveredAt] = useState(
    toLocalInputValue(driver?.deliveryCompletedAt)
  );
  const [saving, setSaving] = useState(false);

  // Пока поле в фокусе — не перезатираем черновик значением из кэша:
  // refetch после сохранения иначе откатит только что напечатанное.
  const dtFocused = useRef(false);

  useEffect(() => {
    setVehicleType(driver?.vehicleType ?? "");
  }, [driver?.vehicleType]);
  useEffect(() => {
    if (!dtFocused.current) {
      setDeliveredAt(toLocalInputValue(driver?.deliveryCompletedAt));
    }
  }, [driver?.deliveryCompletedAt]);

  const vtNext = vehicleType.trim();
  const vtPrev = (driver?.vehicleType ?? "").trim();
  // datetime-local отдаёт локальное время без зоны — new Date() трактует такую
  // строку как локальную, обратно toLocalInputValue тоже собирает локальные
  // компоненты, так что круг «сервер → инпут → сервер» не сдвигает время.
  // Сравниваем именно в формате инпута: ISO с сервера может нести секунды,
  // которых у инпута нет, и поездка казалась бы изменённой сразу после загрузки.
  const dtPrevInput = toLocalInputValue(driver?.deliveryCompletedAt);
  const parsedDeliveredAt = deliveredAt ? new Date(deliveredAt) : null;
  const deliveredAtValid =
    !parsedDeliveredAt || !Number.isNaN(parsedDeliveredAt.getTime());
  const dtChanged = deliveredAt !== dtPrevInput;

  const patch = {};
  if (vtNext !== vtPrev) patch.vehicleType = vtNext === "" ? null : vtNext;
  if (dtChanged) {
    patch.deliveryCompletedAt =
      parsedDeliveredAt && deliveredAtValid
        ? parsedDeliveredAt.toISOString()
        : null;
  }

  const dirty = vtNext !== vtPrev || dtChanged;

  const assertValid = () => {
    if (dtChanged && !deliveredAtValid) {
      notifyError("Некорректная дата доставки");
      return false;
    }
    return true;
  };

  const save = async (extraPatch) => {
    const full = { ...patch, ...(extraPatch || {}) };
    if (Object.keys(full).length === 0) return;
    try {
      setSaving(true);
      await updateBaggageDriver({
        variables: { requestId, driverIndex, patch: full },
      });
      success("Сохранено");
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  return {
    vehicleType,
    setVehicleType,
    deliveredAt,
    setDeliveredAt,
    onDeliveredAtFocus: () => {
      dtFocused.current = true;
    },
    onDeliveredAtBlur: () => {
      dtFocused.current = false;
    },
    dirty,
    assertValid,
    save,
    saving,
  };
}
