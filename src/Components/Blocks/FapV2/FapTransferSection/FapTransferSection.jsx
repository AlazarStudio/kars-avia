import React, { useState, useCallback } from "react";
import { useMutation } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "../FapDetail/FapDetail.module.css";
import {
  COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY,
  ADD_PASSENGER_REQUEST_DRIVER_PERSON,
  UPDATE_PASSENGER_REQUEST_DRIVER_PERSON,
  REMOVE_PASSENGER_REQUEST_DRIVER_PERSON,
  getCookie,
} from "../../../../../graphQL_requests";
import { SERVICE_STATUS_CONFIG, formatTime, formatDateTime } from "../fapConstants";
import Button from "../../../Standart/Button/Button";
import AddRepresentativeDriver from "../../AddRepresentativeDriver/AddRepresentativeDriver";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import EditPencilIcon from "../../../../shared/icons/EditPencilIcon";

const emptyPerson = { fullName: "", phone: "" };

export default function FapTransferSection({ service, color, request, onRefetch }) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();

  const [open, setOpen] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [expandedDrivers, setExpandedDrivers] = useState({});

  // Early complete
  const [earlyReason, setEarlyReason] = useState("");
  const [showEarlyForm, setShowEarlyForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Passenger CRUD
  const [personModal, setPersonModal] = useState(null); // { driverIndex, personIndex?, form }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { driverIndex, personIndex }

  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};

  const [completeTransferEarly] = useMutation(COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [addDriverPerson] = useMutation(ADD_PASSENGER_REQUEST_DRIVER_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [updateDriverPerson] = useMutation(UPDATE_PASSENGER_REQUEST_DRIVER_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [removeDriverPerson] = useMutation(REMOVE_PASSENGER_REQUEST_DRIVER_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  if (!service?.plan?.enabled) return null;

  const drivers = service.drivers || [];
  const isCompleted = service.status === "COMPLETED" || service.status === "CANCELLED";

  const toggleDriver = (idx) =>
    setExpandedDrivers((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const totalPassengers = drivers.reduce((sum, d) => sum + (d.people?.length || 0), 0);

  const handleCompleteEarly = async () => {
    if (!earlyReason.trim()) return;
    const ok = await confirm("Завершить услугу досрочно?");
    if (!ok) return;
    try {
      setSaving(true);
      await completeTransferEarly({ variables: { requestId: request.id, reason: earlyReason } });
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

  const handlePersonSave = async () => {
    if (!personModal) return;
    const { driverIndex, personIndex, form } = personModal;
    if (!form.fullName.trim()) {
      notifyError("Укажите ФИО пассажира");
      return;
    }
    const person = { fullName: form.fullName.trim(), phone: form.phone.trim() || undefined };
    try {
      setSaving(true);
      if (personIndex != null) {
        await updateDriverPerson({ variables: { requestId: request.id, driverIndex, personIndex, person } });
        success("Пассажир обновлён");
      } else {
        await addDriverPerson({ variables: { requestId: request.id, driverIndex, person } });
        success("Пассажир добавлен");
      }
      onRefetch();
      setPersonModal(null);
    } catch {
      notifyError("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handlePersonDelete = async () => {
    if (!deleteConfirm) return;
    const { driverIndex, personIndex } = deleteConfirm;
    try {
      setSaving(true);
      await removeDriverPerson({ variables: { requestId: request.id, driverIndex, personIndex } });
      onRefetch();
      success("Пассажир удалён");
    } catch {
      notifyError("Ошибка при удалении");
    } finally {
      setSaving(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className={classes.section}>
      <div className={classes.sectionHeader} onClick={() => setOpen((v) => !v)}>
        <div className={classes.sectionHeaderLeft}>
          <div className={classes.sectionDot} style={{ background: color }} />
          <span className={classes.sectionName}>Трансфер</span>
          <span className={classes.svcStatusBadge} style={{ color: statusCfg.color, background: statusCfg.bg }}>
            {statusCfg.label || service.status}
          </span>
        </div>
        <div className={classes.sectionHeaderRight}>
          <span style={{ fontSize: 13, color: "#545873" }}>
            {drivers.length} водит. · {totalPassengers}
            {service.plan?.peopleCount ? `/${service.plan.peopleCount}` : ""} пасс.
          </span>
          <span className={`${classes.chevron} ${open ? classes.chevronOpen : ""}`}>▾</span>
        </div>
      </div>

      {open && (
        <div className={classes.sectionBody}>
          <div className={classes.planRow}>
            {service.plan?.peopleCount && (
              <div className={classes.planItem}>
                <span className={classes.planLabel}>Кол-во человек</span>
                <span className={classes.planValue}>{service.plan.peopleCount}</span>
              </div>
            )}
            {service.plan?.plannedAt && (
              <div className={classes.planItem}>
                <span className={classes.planLabel}>Время</span>
                <span className={classes.planValue}>{formatTime(service.plan.plannedAt)}</span>
              </div>
            )}
          </div>

          {drivers.map((driver, idx) => {
            const people = driver.people || [];
            const isExpanded = expandedDrivers[idx];
            const remaining = driver.peopleCount ? driver.peopleCount - people.length : null;
            return (
              <div key={idx} className={classes.subCard}>
                <div className={classes.subCardHeader} onClick={() => toggleDriver(idx)}>
                  <div>
                    <div className={classes.subCardTitle}>{driver.fullName || "Водитель"}</div>
                    <div className={classes.subCardMeta}>
                      {driver.phone && <span>{driver.phone}</span>}
                      {driver.pickupAt && <span> · {formatDateTime(driver.pickupAt)}</span>}
                      {driver.addressFrom && <span> · {driver.addressFrom}</span>}
                      <span> · {people.length}{driver.peopleCount ? `/${driver.peopleCount}` : ""} пасс.</span>
                    </div>
                  </div>
                  <span className={`${classes.chevron} ${isExpanded ? classes.chevronOpen : ""}`}>▾</span>
                </div>

                {isExpanded && (
                  <div className={classes.subCardBody}>
                    {people.length === 0 ? (
                      <div className={classes.tableEmpty} style={{ padding: "12px 0" }}>Пассажиры не добавлены</div>
                    ) : (
                      <table className={classes.table}>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>ФИО</th>
                            <th>Телефон</th>
                            {!isCompleted && <th />}
                          </tr>
                        </thead>
                        <tbody>
                          {people.map((p, pi) => (
                            <tr key={pi}>
                              <td style={{ color: "#94A3B8", width: 28 }}>{pi + 1}</td>
                              <td>{p.fullName}</td>
                              <td>{p.phone || "—"}</td>
                              {!isCompleted && (
                                <td style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                  <button
                                    type="button"
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                                    onClick={() => setPersonModal({ driverIndex: idx, personIndex: pi, form: { fullName: p.fullName || "", phone: p.phone || "" } })}
                                    title="Редактировать"
                                  >
                                    <EditPencilIcon cursor="pointer" />
                                  </button>
                                  <button
                                    type="button"
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                                    onClick={() => setDeleteConfirm({ driverIndex: idx, personIndex: pi })}
                                    title="Удалить"
                                  >
                                    <DeleteIcon cursor="pointer" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {!isCompleted && (remaining == null || remaining > 0) && (
                      <div style={{ paddingTop: 10 }}>
                        <Button
                          backgroundcolor="var(--dark-blue)"
                          color="#fff"
                          onClick={() => setPersonModal({ driverIndex: idx, personIndex: null, form: { ...emptyPerson } })}
                        >
                          + Добавить пассажира
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!isCompleted && (
            <div className={classes.sectionActions}>
              <Button backgroundcolor="var(--dark-blue)" color="#fff" onClick={() => setShowAddDriver(true)}>
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
                <Button backgroundcolor="var(--hover-gray)" color="#000" onClick={() => { setShowEarlyForm(false); setEarlyReason(""); }}>
                  Отмена
                </Button>
                <Button backgroundcolor="#EF4444" color="#fff" onClick={handleCompleteEarly} disabled={saving || !earlyReason.trim()}>
                  Завершить
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {showAddDriver && (
        <AddRepresentativeDriver
          show={showAddDriver}
          onClose={() => { setShowAddDriver(false); onRefetch(); }}
          request={request}
        />
      )}

      {/* Passenger add/edit dialog */}
      {personModal && (
        <Dialog open onClose={() => setPersonModal(null)} PaperProps={{ sx: { borderRadius: "15px" } }}>
          <DialogTitle>
            {personModal.personIndex != null ? "Редактировать пассажира" : "Добавить пассажира"}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important", minWidth: 320 }}>
            <div>
              <label className={classes.addFormLabel}>ФИО *</label>
              <input
                className={classes.addFormInput}
                style={{ width: "100%", marginTop: 4 }}
                value={personModal.form.fullName}
                onChange={(e) => setPersonModal((m) => ({ ...m, form: { ...m.form, fullName: e.target.value } }))}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div>
              <label className={classes.addFormLabel}>Телефон</label>
              <input
                className={classes.addFormInput}
                style={{ width: "100%", marginTop: 4 }}
                value={personModal.form.phone}
                onChange={(e) => setPersonModal((m) => ({ ...m, form: { ...m.form, phone: e.target.value } }))}
                placeholder="+7 999 000 00 00"
              />
            </div>
          </DialogContent>
          <DialogActions sx={{ padding: "8px 16px 16px" }}>
            <Button backgroundcolor="var(--hover-gray)" color="#000" onClick={() => setPersonModal(null)}>
              Отмена
            </Button>
            <Button backgroundcolor="var(--dark-blue)" color="#fff" onClick={handlePersonSave} disabled={saving}>
              {personModal.personIndex != null ? "Сохранить" : "Добавить"}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete passenger confirm */}
      {deleteConfirm && (
        <Dialog open onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: "15px" } }}>
          <DialogTitle>Удалить пассажира?</DialogTitle>
          <DialogContent>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#545873" }}>
              Это действие нельзя отменить.
            </p>
          </DialogContent>
          <DialogActions sx={{ padding: "8px 16px 16px" }}>
            <Button backgroundcolor="var(--hover-gray)" color="#000" onClick={() => setDeleteConfirm(null)}>
              Отмена
            </Button>
            <Button backgroundcolor="#EF4444" color="#fff" onClick={handlePersonDelete} disabled={saving}>
              Удалить
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
