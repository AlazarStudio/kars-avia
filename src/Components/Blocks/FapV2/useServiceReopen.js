import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  REOPEN_PASSENGER_REQUEST_SERVICE,
  getCookie,
} from "../../../../graphQL_requests";
import { useToast } from "../../../contexts/ToastContext";
import { canReopenPassengerService } from "../../../utils/access";

/**
 * Возврат завершённой услуги в работу.
 *
 * Общий хук на все пять экранов услуг: они отличаются только значением
 * serviceKind, а диалог, мутация, тост и обновление одинаковы. UI остаётся на
 * стороне экрана — хук отдаёт состояние и обработчик.
 *
 * Мутация отдельная (не setPassengerRequestServiceStatus): та не снимает дату
 * завершения и признаки досрочного закрытия, и услуга осталась бы «в работе»
 * с датой завершения на карточке.
 */
export default function useServiceReopen({
  requestId,
  serviceKind,
  user,
  canEdit = true,
  isCompleted,
  onDone,
}) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [reopen] = useMutation(REOPEN_PASSENGER_REQUEST_SERVICE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const confirm = async (reason) => {
    try {
      setSaving(true);
      await reopen({ variables: { requestId, service: serviceKind, reason } });
      setOpen(false);
      success("Услуга возвращена в работу");
      onDone?.();
    } catch (e) {
      notifyError(e?.message || "Не удалось вернуть услугу в работу");
    } finally {
      setSaving(false);
    }
  };

  return {
    // Пункт меню появляется только у завершённой услуги, только у диспетчера и
    // только там, где вообще разрешено править. Без canEdit пункт оставался
    // единственным действием на экране, открытом на чтение: у отдела без
    // reserveUpdate и у отменённой заявки всё остальное скрыто, а откат
    // завершения — нет.
    canReopen:
      Boolean(isCompleted) && Boolean(canEdit) && canReopenPassengerService(user),
    open,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
    saving,
    confirm,
  };
}
