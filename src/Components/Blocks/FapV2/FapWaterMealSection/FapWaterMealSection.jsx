import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { InputMask } from "@react-input/mask";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "../FapDetail/FapDetail.module.css";
import {
  COMPLETE_PASSENGER_REQUEST_WATER_EARLY,
  COMPLETE_PASSENGER_REQUEST_MEAL_EARLY,
  SET_PASSENGER_SERVICE_STATUS,
  ADD_PASSENGER_REQUEST_PERSON,
  getCookie,
} from "../../../../../graphQL_requests";
import {
  SERVICE_STATUS_CONFIG,
  formatTime,
} from "../fapConstants";
import ChevronIcon from "../../../../shared/icons/ChevronIcon";
import Button from "../../../Standart/Button/Button";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";

const emptyPerson = { fullName: "", phone: "", seat: "" };

export default function FapWaterMealSection({
  service,
  serviceKind,
  label,
  color,
  requestId,
  onRefetch,
  isOpen,
  onToggle,
  isPage,
  canEdit = true,
}) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();
  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [personModal, setPersonModal] = useState(null);

  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};

  const [completeWaterEarly] = useMutation(
    COMPLETE_PASSENGER_REQUEST_WATER_EARLY,
    { context: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const [completeMealEarly] = useMutation(
    COMPLETE_PASSENGER_REQUEST_MEAL_EARLY,
    { context: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const [setServiceStatus] = useMutation(SET_PASSENGER_SERVICE_STATUS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [addPerson] = useMutation(ADD_PASSENGER_REQUEST_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const handlePersonSave = async () => {
    if (!personModal) return;
    const fullName = personModal.fullName.trim();
    if (!fullName) {
      notifyError("Укажите ФИО пассажира");
      return;
    }
    try {
      setSaving(true);
      await addPerson({
        variables: {
          requestId,
          service: serviceKind,
          person: {
            fullName,
            phone: personModal.phone.trim() || null,
            seat: personModal.seat.trim() || null,
            issuedAt: new Date().toISOString(),
          },
        },
      });
      success("Пассажир добавлен");
      setPersonModal(null);
      onRefetch();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при добавлении");
    } finally {
      setSaving(false);
    }
  };

  const handleDelivered = async () => {
    const ok = await confirm(
      serviceKind === "WATER" ? "Отметить воду как доставленную?" : "Отметить питание как доставленное?"
    );
    if (!ok) return;
    try {
      setSaving(true);
      await setServiceStatus({ variables: { id: requestId, service: serviceKind, status: "ACCEPTED" } });
      onRefetch();
      success("Статус обновлён");
    } catch {
      notifyError("Ошибка при смене статуса");
    } finally {
      setSaving(false);
    }
  };

  if (!service?.plan?.enabled) return null;

  const people = service.people || [];
  const isCompleted = service.status === "COMPLETED" || service.status === "CANCELLED";

  const handleCompleteEarly = async (reason) => {
    try {
      setSaving(true);
      const mutation = serviceKind === "WATER" ? completeWaterEarly : completeMealEarly;
      await mutation({ variables: { requestId, reason } });
      setShowEarlyModal(false);
      onRefetch();
      success("Услуга завершена досрочно");
    } catch {
      notifyError("Ошибка при завершении");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={classes.section}>
      <div className={classes.sectionHeader} onClick={onToggle}>
        <div className={classes.sectionHeaderLeft}>
          <div className={classes.sectionDot} style={{ background: color }} />
          <span className={classes.sectionName}>{label}</span>
          <span
            className={classes.svcStatusBadge}
            style={{ color: statusCfg.color, background: statusCfg.bg }}
          >
            {statusCfg.label || service.status}
          </span>
        </div>
        <div className={classes.sectionHeaderRight}>
          <span style={{ fontSize: 13, color: "#545873" }}>
            {service.plan?.peopleCount
              ? `${people.length} / ${service.plan.peopleCount} чел.`
              : `${people.length} чел.`}
          </span>
          {!isPage && <ChevronIcon className={`${classes.chevron} ${isOpen ? classes.chevronOpen : ""}`} />}
        </div>
      </div>

      {service.plan?.peopleCount > 0 && (
        <div className={classes.progressBar}>
          <div
            className={classes.progressFill}
            style={{
              width: `${Math.min(100, Math.round((people.length / service.plan.peopleCount) * 100))}%`,
              background: people.length >= service.plan.peopleCount ? "#10B981" : color,
            }}
          />
        </div>
      )}

      {isOpen && (
        <div className={classes.sectionBody}>
          <div className={classes.topRow}>
            <div className={classes.planRow}>
              {service.plan?.peopleCount && (
                <div className={classes.planItem}>
                  <span className={classes.planLabel}>Кол-во человек</span>
                  <span className={classes.planValue}>{service.plan.peopleCount}</span>
                </div>
              )}
              {service.plan?.plannedAt && (
                <div className={classes.planItem}>
                  <span className={classes.planLabel}>Планируемое время</span>
                  <span className={classes.planValue}>{formatTime(service.plan.plannedAt)}</span>
                </div>
              )}
              {service.earlyCompletionReason && (
                <div className={classes.planItem}>
                  <span className={classes.planLabel}>Причина завершения</span>
                  <span className={classes.planValue}>{service.earlyCompletionReason}</span>
                </div>
              )}
            </div>

            {canEdit && !isCompleted && (
              <div className={classes.actionsRow}>
                <Button
                  backgroundcolor="var(--dark-blue)"
                  color="#fff"
                  onClick={() => setPersonModal({ ...emptyPerson })}
                >
                  + Добавить пассажира
                </Button>
                {service.status === "NEW" && (
                  <Button
                    backgroundcolor="#ECFDF5"
                    color="#10B981"
                    onClick={handleDelivered}
                    disabled={saving}
                  >
                    {serviceKind === "WATER" ? "Вода доставлена" : "Питание доставлено"}
                  </Button>
                )}
                <Button
                  backgroundcolor="#FEF2F2"
                  color="#EF4444"
                  onClick={() => setShowEarlyModal(true)}
                >
                  Завершить досрочно
                </Button>
              </div>
            )}
          </div>

          <table className={classes.table}>
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Телефон</th>
                <th>Место</th>
                <th>Время выдачи</th>
              </tr>
            </thead>
            <tbody>
              {people.length === 0 ? (
                <tr>
                  <td colSpan={4} className={classes.tableEmpty}>Нет данных</td>
                </tr>
              ) : (
                people.map((p, i) => (
                  <tr key={i}>
                    <td>{p.fullName}</td>
                    <td>{p.phone || "—"}</td>
                    <td>{p.seat || "—"}</td>
                    <td>{p.issuedAt ? formatTime(p.issuedAt) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

        </div>
      )}
      <FapDestructiveModal
        open={showEarlyModal}
        onClose={() => setShowEarlyModal(false)}
        onConfirm={handleCompleteEarly}
        title="Досрочное завершение"
        description="Услуга будет завершена досрочно. Это действие необратимо."
        reasonLabel="Причина *"
        placeholder="Укажите причину..."
        confirmText="Завершить"
        cancelText="Отмена"
        saving={saving}
      />

      {personModal && (
        <Dialog open onClose={() => setPersonModal(null)} PaperProps={{ sx: { borderRadius: "15px" } }}>
          <DialogTitle>
            {serviceKind === "WATER" ? "Добавить получателя воды" : "Добавить получателя питания"}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important", minWidth: 320 }}>
            <div>
              <label className={classes.addFormLabel}>ФИО *</label>
              <input
                className={classes.addFormInput}
                style={{ width: "100%", marginTop: 4 }}
                value={personModal.fullName}
                onChange={(e) => setPersonModal((m) => ({ ...m, fullName: e.target.value }))}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div>
              <label className={classes.addFormLabel}>Телефон</label>
              <InputMask
                className={classes.addFormInput}
                style={{ width: "100%", marginTop: 4 }}
                mask="+7 (___) ___-__-__"
                replacement={{ _: /\d/ }}
                value={personModal.phone}
                onChange={(e) => setPersonModal((m) => ({ ...m, phone: e.target.value }))}
                placeholder="+7 (___) ___-__-__"
              />
            </div>
            <div>
              <label className={classes.addFormLabel}>Место</label>
              <input
                className={classes.addFormInput}
                style={{ width: "100%", marginTop: 4 }}
                value={personModal.seat}
                onChange={(e) => setPersonModal((m) => ({ ...m, seat: e.target.value }))}
                placeholder="12A"
              />
            </div>
          </DialogContent>
          <DialogActions sx={{ padding: "8px 16px 16px" }}>
            <Button backgroundcolor="var(--hover-gray)" color="#000" onClick={() => setPersonModal(null)}>
              Отмена
            </Button>
            <Button backgroundcolor="var(--dark-blue)" color="#fff" onClick={handlePersonSave} disabled={saving}>
              {saving ? "Сохранение..." : "Добавить"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
