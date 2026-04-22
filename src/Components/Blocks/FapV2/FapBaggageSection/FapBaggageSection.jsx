import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import classes from "../FapDetail/FapDetail.module.css";
import {
  COMPLETE_PASSENGER_REQUEST_BAGGAGE_DRIVER_DELIVERY,
  COMPLETE_PASSENGER_REQUEST_BAGGAGE_EARLY,
  getCookie,
} from "../../../../../graphQL_requests";
import { SERVICE_STATUS_CONFIG, formatDateTime, formatTime } from "../fapConstants";
import Button from "../../../Standart/Button/Button";
import AddRepresentativeBaggageDriver from "../../AddRepresentativeBaggageDriver/AddRepresentativeBaggageDriver";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";

export default function FapBaggageSection({ service, color, request, onRefetch, isOpen, onToggle }) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [earlyReason, setEarlyReason] = useState("");
  const [showEarlyForm, setShowEarlyForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};

  const [completeDelivery] = useMutation(
    COMPLETE_PASSENGER_REQUEST_BAGGAGE_DRIVER_DELIVERY,
    { context: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const [completeBaggageEarly] = useMutation(
    COMPLETE_PASSENGER_REQUEST_BAGGAGE_EARLY,
    { context: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const copyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url)
      .then(() => success("Ссылка скопирована"))
      .catch(() => notifyError("Не удалось скопировать ссылку"));
  };

  if (!service?.plan?.enabled) return null;

  const drivers = service.drivers || [];
  const isCompleted =
    service.status === "COMPLETED" || service.status === "CANCELLED";

  const handleCompleteDelivery = async (driverIndex) => {
    const ok = await confirm("Отметить доставку выполненной?");
    if (!ok) return;
    try {
      setSaving(true);
      await completeDelivery({
        variables: { requestId: request.id, driverIndex },
      });
      onRefetch();
      success("Доставка отмечена выполненной");
    } catch {
      notifyError("Ошибка");
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
      await completeBaggageEarly({
        variables: { requestId: request.id, reason: earlyReason },
      });
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
        onClick={onToggle}
      >
        <div className={classes.sectionHeaderLeft}>
          <div className={classes.sectionDot} style={{ background: color }} />
          <span className={classes.sectionName}>Доставка багажа</span>
          <span
            className={classes.svcStatusBadge}
            style={{ color: statusCfg.color, background: statusCfg.bg }}
          >
            {statusCfg.label || service.status}
          </span>
        </div>
        <div className={classes.sectionHeaderRight}>
          <span style={{ fontSize: 13, color: "#545873" }}>
            {drivers.length} водит.
          </span>
          <span className={`${classes.chevron} ${isOpen ? classes.chevronOpen : ""}`}>
            ▾
          </span>
        </div>
      </div>

      {isOpen && (
        <div className={classes.sectionBody}>
          <div className={classes.topRow}>
            <div className={classes.planRow}>
              {service.plan?.plannedAt && (
                <div className={classes.planItem}>
                  <span className={classes.planLabel}>Планируемое время</span>
                  <span className={classes.planValue}>{formatTime(service.plan.plannedAt)}</span>
                </div>
              )}
            </div>
            {!isCompleted && (
              <div className={classes.actionsRow}>
                <Button
                  backgroundcolor="var(--dark-blue)"
                  color="#fff"
                  onClick={() => setShowAddDriver(true)}
                >
                  + Добавить водителя
                </Button>
                <Button
                  backgroundcolor="#FEF2F2"
                  color="#EF4444"
                  onClick={() => setShowEarlyForm((v) => !v)}
                >
                  Завершить досрочно
                </Button>
              </div>
            )}
          </div>

          {drivers.map((driver, idx) => {
            const done = !!driver.deliveryCompletedAt;
            return (
              <div key={idx} className={classes.subCard}>
                <div className={classes.subCardHeader} style={{ cursor: "default" }}>
                  <div>
                    <div className={classes.subCardTitle}>
                      {driver.fullName || "Водитель"}
                    </div>
                    <div className={classes.subCardMeta}>
                      {driver.phone && <span>{driver.phone}</span>}
                      {driver.addressFrom && (
                        <span> · {driver.addressFrom}</span>
                      )}
                      {driver.addressTo && (
                        <span> → {driver.addressTo}</span>
                      )}
                      {driver.description && (
                        <span> · {driver.description}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {driver.linkPWA ? (
                      <button
                        type="button"
                        className={classes.linkBtn}
                        onClick={(e) => { e.stopPropagation(); copyLink(driver.linkPWA); }}
                        title="Скопировать PWA-ссылку"
                      >
                        PWA
                      </button>
                    ) : driver.link ? (
                      <button
                        type="button"
                        className={classes.linkBtn}
                        onClick={(e) => { e.stopPropagation(); copyLink(driver.link); }}
                        title="Скопировать ссылку"
                      >
                        Ссылка
                      </button>
                    ) : null}
                    {done ? (
                      <span className={classes.deliveryDone}>
                        ✓ Доставлено
                      </span>
                    ) : (
                      <span className={classes.deliveryPending}>
                        В пути
                      </span>
                    )}
                    {!done && !isCompleted && (
                      <Button
                        backgroundcolor="#ECFDF5"
                        color="#10B981"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteDelivery(idx);
                        }}
                        disabled={saving}
                      >
                        Доставлено
                      </Button>
                    )}
                    {done && (
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>
                        {formatDateTime(driver.deliveryCompletedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}


          {showEarlyForm && (
            <div className={classes.addForm}>
              <div className={classes.addFormField}>
                <label className={classes.addFormLabel}>Причина *</label>
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

      {showAddDriver && (
        <AddRepresentativeBaggageDriver
          show={showAddDriver}
          onClose={() => {
            setShowAddDriver(false);
            onRefetch();
          }}
          request={request}
        />
      )}
    </div>
  );
}
