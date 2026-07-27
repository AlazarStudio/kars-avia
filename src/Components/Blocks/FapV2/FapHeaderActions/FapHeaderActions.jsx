import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FapOverflowMenu from "../FapOverflowMenu/FapOverflowMenu";
import FapRegistryButton from "../FapRegistryButton/FapRegistryButton";
import AddRepresentativeService from "../../AddRepresentativeService/AddRepresentativeService";
import PassengerRequestLogs from "../../LogsHistory/PassengerRequestLogs";
import EditIcon from "../../../../shared/icons/EditIcon";
import DownloadIcon from "../../../../shared/icons/DownloadIcon";
import ScheduleIcon from "../../../../shared/icons/ScheduleIcon";
import { isExternalUser } from "../../../../utils/access";
import { downloadRequestReport } from "../reports/buildReportSheets";
import { useToast } from "../../../../contexts/ToastContext";

// Единый набор действий шапки услуги / внутренней страницы ФАП: чип «Реестр»
// рядом с меню «⋯», в меню — общие пункты (Редактировать, Скачать отчёт,
// История) и, после разделителя, свои пункты конкретного места.
// Порядок общих пунктов одинаков везде — как в шапке заявки (FapDetail).
//
// Пропсы:
//   request           — заявка (реестр, счётчик пассажиров, сайдбар, отчёт)
//   user              — для гейтинга: внешний пользователь не видит ни реестра,
//                       ни отчёта, ни редактирования (история ему доступна —
//                       журнал заявки читающий)
//   canEdit           — можно ли править заявку (роль + состояние услуги);
//                       вызывающая сторона считает это сама
//   onRefetch         — рефетч заявки после закрытия сайдбара
//   onDownloadReport  — свой экспорт услуги; без него скачивается отчёт по всей
//                       заявке (downloadRequestReport)
//   hideReport        — не показывать пункт «Скачать отчёт»: в шапке уже есть
//                       своя кнопка отчёта либо выгружать нечего (пустая книга
//                       из одной шапки — тупик)
//   items             — свои пункты места, добавляются после общих
export default function FapHeaderActions({
  request,
  user,
  canEdit = false,
  onRefetch,
  onDownloadReport,
  hideReport = false,
  items = [],
}) {
  const navigate = useNavigate();
  const { success, error: notifyError } = useToast();
  const [showAddService, setShowAddService] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const external = isExternalUser(user);

  const handleDownloadReport = async () => {
    try {
      if (onDownloadReport) await onDownloadReport();
      else await downloadRequestReport(request, notifyError);
    } catch (e) {
      notifyError("Ошибка экспорта");
      console.error(e);
    }
  };

  return (
    <>
      {!external && request?.id && (
        <FapRegistryButton
          count={request.savedPassengers?.length ?? 0}
          onClick={() => navigate(`/far/${request.id}/registry`)}
        />
      )}

      <FapOverflowMenu
        items={[
          {
            label: "Редактировать",
            icon: EditIcon,
            onClick: () => setShowAddService(true),
            hidden: external || !canEdit,
          },
          {
            label: "Скачать отчёт",
            icon: DownloadIcon,
            onClick: handleDownloadReport,
            hidden: external || hideReport,
          },
          {
            label: "История",
            icon: ScheduleIcon,
            onClick: () => setShowLogs((v) => !v),
          },
          { sep: true },
          ...(items || []).filter(Boolean),
        ]}
      />

      {canEdit && showAddService && (
        <AddRepresentativeService
          show={showAddService}
          onClose={() => {
            setShowAddService(false);
            onRefetch?.();
          }}
          request={request}
          user={user}
          addNotification={(text, status) =>
            status === "error" ? notifyError(text) : success(text)
          }
        />
      )}

      <PassengerRequestLogs
        show={showLogs}
        onClose={() => setShowLogs(false)}
        passengerRequestId={request?.id}
      />
    </>
  );
}
