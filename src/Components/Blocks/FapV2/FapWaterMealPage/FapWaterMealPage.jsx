import React, { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { InputMask } from "@react-input/mask";
import classes from "./FapWaterMealPage.module.css";
import {
  ADD_PASSENGER_REQUEST_PERSON,
  UPDATE_PASSENGER_REQUEST_PERSON,
  REMOVE_PASSENGER_REQUEST_PERSON,
  COMPLETE_PASSENGER_REQUEST_WATER_EARLY,
  COMPLETE_PASSENGER_REQUEST_MEAL_EARLY,
  getCookie,
} from "../../../../../graphQL_requests";
import { SERVICE_STATUS_CONFIG, formatTime } from "../fapConstants";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";
import FapActionButton from "../FapActionButton/FapActionButton";
import AddRepresentativeService from "../../AddRepresentativeService/AddRepresentativeService";
import PassengerRequestLogs from "../../LogsHistory/PassengerRequestLogs";
import EditPencilIcon from "../../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import CloseIcon from "../../../../shared/icons/CloseIcon";
import ScheduleIcon from "../../../../shared/icons/ScheduleIcon";
import WaterIcon from "../../../../shared/icons/WaterIcon";
import MealIcon from "../../../../shared/icons/MealIcon";

const SERVICE_HEAD_ICON = {
  WATER: WaterIcon,
  MEAL: MealIcon,
};

const CheckSvg = ({ size = 13, color = "#fff", strokeWidth = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 12l5 5L20 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PencilSvg = ({ size = 12, color = "#fff", strokeWidth = 2.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusSvg = ({ size = 15, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

const initials = (fullName) => {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const emptyForm = { fullName: "", phone: "", seat: "" };

export default function FapWaterMealPage({
  service,
  serviceKind,
  label,
  color,
  bg,
  request,
  onRefetch,
  canEdit = true,
}) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // editingIdx — индекс редактируемой строки (в исходном массиве people)
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [addPerson] = useMutation(ADD_PASSENGER_REQUEST_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [updatePerson] = useMutation(UPDATE_PASSENGER_REQUEST_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [removePerson] = useMutation(REMOVE_PASSENGER_REQUEST_PERSON, {
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

  const people = service?.people || [];
  const planCount = service?.plan?.peopleCount ?? null;
  const remaining = planCount != null ? Math.max(0, planCount - people.length) : null;
  const pct = planCount && planCount > 0
    ? Math.min(100, Math.round((people.length / planCount) * 100))
    : 0;
  const plannedAt = service?.plan?.plannedAt;
  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};
  const isCancelled = service?.status === "CANCELLED";
  const isFinished = service?.status === "COMPLETED";

  const filteredPeople = useMemo(() => {
    const list = people.map((p, idx) => ({ ...p, _idx: idx }));
    list.sort((a, b) => {
      const ta = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
      const tb = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
      return tb - ta; // newest first
    });
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (p) =>
        (p.fullName || "").toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q) ||
        (p.seat || "").toLowerCase().includes(q)
    );
  }, [people, search]);

  const handleAdd = async (e) => {
    e?.preventDefault?.();
    const fullName = form.fullName.trim();
    if (!fullName) {
      notifyError("Укажите ФИО получателя");
      return;
    }
    try {
      setSaving(true);
      await addPerson({
        variables: {
          requestId: request.id,
          service: serviceKind,
          person: {
            fullName,
            phone: form.phone.trim() || null,
            seat: form.seat.trim() || null,
            issuedAt: new Date().toISOString(),
          },
        },
      });
      success(serviceKind === "WATER" ? "Вода выдана" : "Питание выдано");
      setForm(emptyForm);
      onRefetch?.();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при добавлении");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (p) => {
    setEditingIdx(p._idx);
    setEditForm({
      fullName: p.fullName || "",
      phone: p.phone || "",
      seat: p.seat || "",
    });
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditForm(emptyForm);
  };

  const handleSaveEdit = async () => {
    if (editingIdx == null) return;
    const fullName = editForm.fullName.trim();
    if (!fullName) {
      notifyError("Укажите ФИО получателя");
      return;
    }
    try {
      setSaving(true);
      await updatePerson({
        variables: {
          requestId: request.id,
          service: serviceKind,
          personIndex: editingIdx,
          person: {
            fullName,
            phone: editForm.phone.trim() || null,
            seat: editForm.seat.trim() || null,
            // не передаём issuedAt — бэк сохранит существующее
          },
        },
      });
      success("Сохранено");
      cancelEdit();
      onRefetch?.();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (personIndex) => {
    const ok = await confirm("Удалить запись?");
    if (!ok) return;
    try {
      setSaving(true);
      await removePerson({
        variables: {
          requestId: request.id,
          service: serviceKind,
          personIndex,
        },
      });
      success("Запись удалена");
      onRefetch?.();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при удалении");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteEarly = async (reason) => {
    try {
      setSaving(true);
      const mutation = serviceKind === "WATER" ? completeWaterEarly : completeMealEarly;
      await mutation({ variables: { requestId: request.id, reason } });
      setShowEarlyModal(false);
      onRefetch?.();
      success("Услуга завершена досрочно");
    } catch {
      notifyError("Ошибка при завершении");
    } finally {
      setSaving(false);
    }
  };

  if (!service?.plan?.enabled) {
    return (
      <div className={classes.root}>
        <div className={classes.listEmpty}>Услуга не подключена</div>
      </div>
    );
  }

  const canMutate = canEdit && !isCancelled;
  const hasFreeSlots = planCount == null || people.length < planCount;
  const HeadIcon = SERVICE_HEAD_ICON[serviceKind];

  return (
    <div className={classes.root}>
      {/* Service header */}
      <div className={classes.head}>
        <div className={classes.headLeft}>
          <div className={classes.headIcon} style={{ background: bg, color }}>
            {HeadIcon ? <HeadIcon size={22} strokeWidth={2} /> : null}
          </div>
          <div className={classes.headText}>
            <div className={classes.headTitleRow}>
              <span className={classes.headTitle}>{label}</span>
              <span
                className={classes.statusBadge}
                style={{ color: statusCfg.color, background: statusCfg.bg }}
              >
                {statusCfg.label || service.status}
              </span>
            </div>
            {request?.flightNumber && (
              <div className={classes.headFlight}>
                Рейс <strong>{request.flightNumber}</strong>
              </div>
            )}
          </div>
        </div>
        <div className={classes.headRight}>
          {canEdit && !isCancelled && (
            <FapActionButton variant="secondary" onClick={() => setShowAddService(true)}>
              <EditPencilIcon />
              Редактировать
            </FapActionButton>
          )}
          <FapActionButton
            variant="secondary"
            active={showLogs}
            onClick={() => setShowLogs((v) => !v)}
          >
            <ScheduleIcon color={showLogs ? "#fff" : "#545873"} />
            История
          </FapActionButton>
          {canEdit && !isCancelled && !isFinished && (
            <button
              type="button"
              className={classes.finishBtn}
              onClick={() => setShowEarlyModal(true)}
            >
              Завершить услугу
            </button>
          )}
        </div>
      </div>

      {/* KPI tiles */}
      <div className={classes.kpiRow}>
        <div className={classes.kpi}>
          <div className={classes.kpiHead}>Выдано</div>
          <div className={classes.kpiValue} style={{ color }}>
            {people.length}{planCount != null ? ` / ${planCount}` : ""}
          </div>
          <div className={classes.kpiSub}>
            {planCount != null ? `${pct}% состава` : "получили"}
          </div>
        </div>
        <div className={classes.kpi}>
          <div className={classes.kpiHead}>Осталось</div>
          <div className={classes.kpiValue}>
            {remaining != null ? remaining : "—"}
          </div>
          <div className={classes.kpiSub}>
            {remaining != null ? "ещё не получили" : "план не задан"}
          </div>
        </div>
        <div className={classes.kpi}>
          <div className={classes.kpiHead}>Плановое время</div>
          <div className={classes.kpiValue}>
            {plannedAt ? formatTime(plannedAt) : "—"}
          </div>
          <div className={classes.kpiSub}>
            {plannedAt ? "до подачи" : "не указано"}
          </div>
        </div>
      </div>

      {/* List card */}
      <div className={classes.listCard}>
        <div className={classes.listHead}>
          <span className={classes.listTitle}>
            {serviceKind === "WATER" ? "Получили воду" : "Получили питание"}
          </span>
          <span
            className={classes.listCount}
            style={{ color, background: bg }}
          >
            {people.length}{planCount != null ? ` / ${planCount}` : ""}
          </span>
          <div className={classes.searchWrap}>
            <input
              placeholder="Поиск по списку"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Quick-add bar — только если есть свободные места по плану */}
        {canMutate && hasFreeSlots && (
          <form
            className={classes.quickAdd}
            style={{ background: bg }}
            onSubmit={handleAdd}
          >
            <div className={`${classes.smallField} ${classes.fGrow2}`}>
              <label className={classes.smallFieldLabel}>
                ФИО <span className={classes.req}>*</span>
              </label>
              <input
                className={classes.smallFieldInput}
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div className={`${classes.smallField} ${classes.fGrow1}`}>
              <label className={classes.smallFieldLabel}>Телефон</label>
              <InputMask
                className={classes.smallFieldInput}
                mask="+7 (___) ___-__-__"
                replacement={{ _: /\d/ }}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+7 (___) ___-__-__"
              />
            </div>
            <div className={`${classes.smallField} ${classes.fSeat}`}>
              <label className={classes.smallFieldLabel}>Место</label>
              <input
                className={classes.smallFieldInput}
                value={form.seat}
                onChange={(e) => setForm((f) => ({ ...f, seat: e.target.value }))}
                placeholder="12A"
              />
            </div>
            <button
              type="submit"
              className={classes.quickAddBtn}
              style={{ background: color }}
              disabled={saving || !form.fullName.trim()}
            >
              <PlusSvg /> Добавить
            </button>
          </form>
        )}

        {/* List body */}
        <div className={classes.listBody}>
          {filteredPeople.length === 0 ? (
            <div className={classes.listEmpty}>
              {search.trim() ? "Ничего не найдено" : "Получателей пока нет"}
            </div>
          ) : (
            filteredPeople.map((p) => {
              const isEditing = editingIdx === p._idx;
              if (isEditing) {
                return (
                  <div
                    key={p._idx}
                    className={classes.editRow}
                    style={{ background: bg }}
                  >
                    <span className={classes.editPencil} style={{ background: color }}>
                      <PencilSvg />
                    </span>
                    <span className={classes.avatar} style={{ background: color }}>
                      {initials(editForm.fullName || p.fullName)}
                    </span>
                    <input
                      className={`${classes.editInput} ${classes.fGrow2}`}
                      style={{
                        border: `1px solid ${color}`,
                        boxShadow: `0 0 0 3px ${bg}`,
                      }}
                      value={editForm.fullName}
                      onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                      placeholder="ФИО"
                    />
                    <InputMask
                      className={`${classes.editInput} ${classes.fGrow1}`}
                      style={{
                        border: `1px solid ${color}`,
                        boxShadow: `0 0 0 3px ${bg}`,
                      }}
                      mask="+7 (___) ___-__-__"
                      replacement={{ _: /\d/ }}
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+7 (___) ___-__-__"
                    />
                    <input
                      className={`${classes.editInput} ${classes.fSeat}`}
                      style={{
                        border: `1px solid ${color}`,
                        boxShadow: `0 0 0 3px ${bg}`,
                      }}
                      value={editForm.seat}
                      onChange={(e) => setEditForm((f) => ({ ...f, seat: e.target.value }))}
                      placeholder="Место"
                    />
                    <button
                      type="button"
                      className={classes.editSaveBtn}
                      style={{ background: color }}
                      onClick={handleSaveEdit}
                      disabled={saving || !editForm.fullName.trim()}
                      title="Сохранить"
                    >
                      <CheckSvg size={16} strokeWidth={2.6} />
                    </button>
                    <button
                      type="button"
                      className={classes.editCancelBtn}
                      onClick={cancelEdit}
                      title="Отмена"
                    >
                      <CloseIcon color="#545873" />
                    </button>
                  </div>
                );
              }
              return (
                <div key={p._idx} className={classes.row}>
                  <span className={classes.rowCheck}>
                    <CheckSvg />
                  </span>
                  <span className={classes.avatar} style={{ background: color }}>
                    {initials(p.fullName)}
                  </span>
                  <div className={classes.rowMain}>
                    <div className={classes.rowName}>{p.fullName || "—"}</div>
                    <div className={classes.rowMeta}>
                      {[p.seat && `место ${p.seat}`, p.phone].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div className={classes.rowTime}>
                    <div className={classes.rowTimeValue}>
                      {p.issuedAt ? formatTime(p.issuedAt) : "—"}
                    </div>
                  </div>
                  {canMutate && (
                    <div className={classes.rowActions}>
                      <button
                        type="button"
                        className={classes.iconBtn}
                        onClick={() => openEdit(p)}
                        title="Редактировать"
                      >
                        <EditPencilIcon color="#545873" cursor="pointer" />
                      </button>
                      <button
                        type="button"
                        className={`${classes.iconBtn} ${classes.iconBtnDanger}`}
                        onClick={() => handleDelete(p._idx)}
                        title="Удалить"
                        disabled={saving}
                      >
                        <DeleteIcon cursor="pointer" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

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

      {canEdit && showAddService && (
        <AddRepresentativeService
          show={showAddService}
          onClose={() => {
            setShowAddService(false);
            onRefetch?.();
          }}
          request={request}
        />
      )}

      <PassengerRequestLogs
        show={showLogs}
        onClose={() => setShowLogs(false)}
        passengerRequestId={request?.id}
      />
    </div>
  );
}
