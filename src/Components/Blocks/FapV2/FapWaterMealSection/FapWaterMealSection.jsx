import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import classes from "../FapDetail/FapDetail.module.css";
import {
  ADD_PASSENGER_REQUEST_PERSON,
  COMPLETE_PASSENGER_REQUEST_WATER_EARLY,
  COMPLETE_PASSENGER_REQUEST_MEAL_EARLY,
  SET_PASSENGER_SERVICE_STATUS,
  getCookie,
} from "../../../../../graphQL_requests";
import {
  SERVICE_STATUS_CONFIG,
  formatDateTime,
  formatTime,
} from "../fapConstants";
import Button from "../../../Standart/Button/Button";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";

const emptyPerson = { fullName: "", phone: "", seat: "", issuedAt: "" };

export default function FapWaterMealSection({
  service,
  serviceKind,
  label,
  color,
  requestId,
  onRefetch,
}) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();

  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyPerson);
  const [earlyReason, setEarlyReason] = useState("");
  const [showEarlyForm, setShowEarlyForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};

  const [addPerson] = useMutation(ADD_PASSENGER_REQUEST_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

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
  const isCompleted =
    service.status === "COMPLETED" || service.status === "CANCELLED";

  const handleAddPerson = async () => {
    if (!formData.fullName.trim()) return;
    try {
      setSaving(true);
      const person = {
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        seat: formData.seat || undefined,
        issuedAt: formData.issuedAt
          ? new Date(formData.issuedAt).toISOString()
          : undefined,
      };
      await addPerson({
        variables: { requestId, service: serviceKind, person },
      });
      setFormData(emptyPerson);
      setShowForm(false);
      onRefetch();
      success("Человек добавлен");
    } catch {
      notifyError("Ошибка при добавлении");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteEarly = async () => {
    if (!earlyReason.trim()) return;
    const ok = await confirm("Завершить услугу досрочно?");
    if (!ok) return;
    try {
      setSaving(true);
      const mutation =
        serviceKind === "WATER" ? completeWaterEarly : completeMealEarly;
      await mutation({ variables: { requestId, reason: earlyReason } });
      setEarlyReason("");
      setShowEarlyForm(false);
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
      <div
        className={classes.sectionHeader}
        onClick={() => setOpen((v) => !v)}
      >
        <div className={classes.sectionHeaderLeft}>
          <div
            className={classes.sectionDot}
            style={{ background: color }}
          />
          <span className={classes.sectionName}>{label}</span>
          <span
            className={classes.svcStatusBadge}
            style={{ color: statusCfg.color, background: statusCfg.bg }}
          >
            {statusCfg.label || service.status}
          </span>
        </div>
        <div className={classes.sectionHeaderRight}>
          <span className={classes.planMeta} style={{ fontSize: 13, color: "#545873" }}>
            {service.plan?.peopleCount
              ? `${people.length} / ${service.plan.peopleCount} чел.`
              : `${people.length} чел.`}
          </span>
          <span
            className={`${classes.chevron} ${open ? classes.chevronOpen : ""}`}
          >
            ▾
          </span>
        </div>
      </div>

      {open && (
        <div className={classes.sectionBody}>
          <div className={classes.planRow}>
            {service.plan?.peopleCount && (
              <div className={classes.planItem}>
                <span className={classes.planLabel}>Кол-во человек</span>
                <span className={classes.planValue}>
                  {service.plan.peopleCount}
                </span>
              </div>
            )}
            {service.plan?.plannedAt && (
              <div className={classes.planItem}>
                <span className={classes.planLabel}>Планируемое время</span>
                <span className={classes.planValue}>
                  {formatTime(service.plan.plannedAt)}
                </span>
              </div>
            )}
            {service.earlyCompletionReason && (
              <div className={classes.planItem}>
                <span className={classes.planLabel}>Причина завершения</span>
                <span className={classes.planValue}>
                  {service.earlyCompletionReason}
                </span>
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
                  <td colSpan={4} className={classes.tableEmpty}>
                    Нет данных
                  </td>
                </tr>
              ) : (
                people.map((p, i) => (
                  <tr key={i}>
                    <td>{p.fullName}</td>
                    <td>{p.phone || "—"}</td>
                    <td>{p.seat || "—"}</td>
                    <td>{p.issuedAt ? formatDateTime(p.issuedAt) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!isCompleted && (
            <div className={classes.sectionActions}>
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
                backgroundcolor="var(--dark-blue)"
                color="#fff"
                onClick={() => {
                  setShowForm((v) => !v);
                  setShowEarlyForm(false);
                }}
              >
                + Добавить человека
              </Button>
              <Button
                backgroundcolor="#FEF2F2"
                color="#EF4444"
                onClick={() => {
                  setShowEarlyForm((v) => !v);
                  setShowForm(false);
                }}
              >
                Завершить досрочно
              </Button>
            </div>
          )}

          {showForm && (
            <div className={classes.addForm}>
              <div className={classes.addFormRow}>
                <div className={classes.addFormField}>
                  <label className={classes.addFormLabel}>ФИО *</label>
                  <input
                    className={classes.addFormInput}
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, fullName: e.target.value }))
                    }
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
                <div className={classes.addFormField}>
                  <label className={classes.addFormLabel}>Телефон</label>
                  <input
                    className={classes.addFormInput}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+7 999 000 00 00"
                  />
                </div>
                <div className={classes.addFormField}>
                  <label className={classes.addFormLabel}>Место</label>
                  <input
                    className={classes.addFormInput}
                    value={formData.seat}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, seat: e.target.value }))
                    }
                    placeholder="1A"
                  />
                </div>
                <div className={classes.addFormField}>
                  <label className={classes.addFormLabel}>Время выдачи</label>
                  <input
                    className={classes.addFormInput}
                    type="datetime-local"
                    value={formData.issuedAt}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, issuedAt: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className={classes.addFormActions}>
                <Button
                  backgroundcolor="var(--hover-gray)"
                  color="#000"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(emptyPerson);
                  }}
                >
                  Отмена
                </Button>
                <Button
                  backgroundcolor="var(--dark-blue)"
                  color="#fff"
                  onClick={handleAddPerson}
                  disabled={saving}
                >
                  Добавить
                </Button>
              </div>
            </div>
          )}

          {showEarlyForm && (
            <div className={classes.addForm}>
              <div className={classes.addFormField}>
                <label className={classes.addFormLabel}>Причина досрочного завершения *</label>
                <input
                  className={classes.addFormInput}
                  value={earlyReason}
                  onChange={(e) => setEarlyReason(e.target.value)}
                  placeholder="Укажите причину..."
                />
              </div>
              <div className={classes.addFormActions}>
                <Button
                  backgroundcolor="var(--hover-gray)"
                  color="#000"
                  onClick={() => {
                    setShowEarlyForm(false);
                    setEarlyReason("");
                  }}
                >
                  Отмена
                </Button>
                <Button
                  backgroundcolor="#EF4444"
                  color="#fff"
                  onClick={handleCompleteEarly}
                  disabled={saving || !earlyReason.trim()}
                >
                  Завершить
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
