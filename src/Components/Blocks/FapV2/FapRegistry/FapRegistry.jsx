import React, { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { InputMask } from "@react-input/mask";
import classes from "./FapRegistry.module.css";
import {
  ADD_PASSENGER_REQUEST_SAVED_PERSON,
  UPDATE_PASSENGER_REQUEST_SAVED_PERSON,
  REMOVE_PASSENGER_REQUEST_SAVED_PERSON,
  ADD_PASSENGER_REQUEST_SAVED_PEOPLE,
  getCookie,
} from "../../../../../graphQL_requests";
import {
  SERVICE_CONFIG,
  PERSON_TYPE_CONFIG,
  PERSON_CATEGORY_OPTIONS,
  normalizeCategory,
} from "../fapConstants";
import CategoryBadge from "../CategoryBadge/CategoryBadge";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";
import ManifestUploadField from "../ManifestUploadField/ManifestUploadField";
import { manifestNameKey, isSameFlight } from "../../../../utils/parseManifestXlsx";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import EditPencilIcon from "../../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import WaterIcon from "../../../../shared/icons/WaterIcon";
import MealIcon from "../../../../shared/icons/MealIcon";
import HotelBedIcon from "../../../../shared/icons/HotelBedIcon";
import BusIcon from "../../../../shared/icons/BusIcon";
import BusDownIcon from "../../../../shared/icons/BusDownIcon";

// Порядок и иконки колонки «Услуги». Цвета/подписи берём из SERVICE_CONFIG.
const SERVICE_PRESENCE = [
  { key: "water", Icon: WaterIcon },
  { key: "meal", Icon: MealIcon },
  { key: "living", Icon: HotelBedIcon },
  { key: "transfer", Icon: BusIcon },
  { key: "transferDeparture", Icon: BusDownIcon },
];

const emptyForm = { fullName: "", phone: "", seat: "", personCategory: "ADULT" };

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

// Инлайн-форма пассажира (добавление/редактирование).
function PersonForm({ values, onChange, onSubmit, onCancel, saving, submitLabel }) {
  return (
    <form className={classes.quickAdd} onSubmit={onSubmit}>
      <div className={`${classes.smallField} ${classes.fGrow2}`}>
        <label className={classes.smallFieldLabel}>
          ФИО <span className={classes.req}>*</span>
        </label>
        <input
          className={classes.smallFieldInput}
          value={values.fullName}
          onChange={(e) => onChange({ ...values, fullName: e.target.value })}
          placeholder="Иванов Иван Иванович"
        />
      </div>
      <div className={`${classes.smallField} ${classes.fGrow1}`}>
        <label className={classes.smallFieldLabel}>Телефон</label>
        <InputMask
          className={classes.smallFieldInput}
          mask="+7 (___) ___-__-__"
          replacement={{ _: /\d/ }}
          value={values.phone}
          onChange={(e) => onChange({ ...values, phone: e.target.value })}
          placeholder="+7 (___) ___-__-__"
        />
      </div>
      <div className={`${classes.smallField} ${classes.fSeat}`}>
        <label className={classes.smallFieldLabel}>Место</label>
        <input
          className={classes.smallFieldInput}
          value={values.seat}
          onChange={(e) => onChange({ ...values, seat: e.target.value })}
          placeholder="12A"
        />
      </div>
      <div className={`${classes.smallField} ${classes.fSeat}`}>
        <label className={classes.smallFieldLabel}>Категория</label>
        <select
          className={classes.smallFieldInput}
          value={values.personCategory}
          onChange={(e) => onChange({ ...values, personCategory: e.target.value })}
        >
          {PERSON_CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className={classes.quickAddBtn}
        disabled={saving || !values.fullName.trim()}
      >
        <PlusSvg /> {submitLabel}
      </button>
      <button type="button" className={classes.cancelBtn} onClick={onCancel}>
        Отмена
      </button>
    </form>
  );
}

export default function FapRegistry({ request, canEdit = false, onRefetch }) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();
  const ctx = { context: { headers: { Authorization: `Bearer ${token}` } } };

  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [manifest, setManifest] = useState(null);

  const [addPerson] = useMutation(ADD_PASSENGER_REQUEST_SAVED_PERSON, ctx);
  const [updatePerson] = useMutation(UPDATE_PASSENGER_REQUEST_SAVED_PERSON, ctx);
  const [removePerson] = useMutation(REMOVE_PASSENGER_REQUEST_SAVED_PERSON, ctx);
  const [addPeople] = useMutation(ADD_PASSENGER_REQUEST_SAVED_PEOPLE, ctx);

  const savedPassengers = request?.savedPassengers || [];
  const crewMembers = request?.crewMembers || [];
  const includesCrew = !!request?.includesCrew;
  const includesPassengers = !!request?.includesPassengers;

  const title = includesCrew
    ? "Реестр — Пассажиры и экипаж"
    : "Реестр — Пассажиры";

  // personId → Set(ключей услуг), где присутствует человек
  const presence = useMemo(() => {
    const map = {};
    const addFrom = (people, key) => {
      (people || []).forEach((p) => {
        const id = p?.personId;
        if (!id) return;
        if (!map[id]) map[id] = new Set();
        map[id].add(key);
      });
    };
    addFrom(request?.waterService?.people, "water");
    addFrom(request?.mealService?.people, "meal");
    (request?.livingService?.hotels || []).forEach((h) => addFrom(h.people, "living"));
    (request?.transferService?.drivers || []).forEach((d) => addFrom(d.people, "transfer"));
    (request?.departureTransferService?.drivers || []).forEach((d) =>
      addFrom(d.people, "transferDeparture")
    );
    return map;
  }, [request]);

  const kidsCount = savedPassengers.filter((p) => {
    const c = normalizeCategory(p.personCategory);
    return c === "CHILD" || c === "INFANT";
  }).length;
  const total = savedPassengers.length + crewMembers.length;

  const q = search.trim().toLowerCase();
  const matchText = (...vals) =>
    !q || vals.some((v) => (v || "").toLowerCase().includes(q));
  const filteredPassengers = savedPassengers.filter((p) =>
    matchText(p.fullName, p.phone, p.seat)
  );
  const filteredCrew = crewMembers.filter((c) =>
    matchText(c.fullName, c.phone, c.position)
  );

  const startAdd = () => {
    setEditingId(null);
    setEditForm(emptyForm);
    setForm(emptyForm);
    setAdding(true);
  };

  const openEdit = (p) => {
    setAdding(false);
    setEditingId(p.personId);
    setEditForm({
      fullName: p.fullName || "",
      phone: p.phone || "",
      seat: p.seat || "",
      personCategory: normalizeCategory(p.personCategory),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const handleAdd = async (e) => {
    e?.preventDefault?.();
    const fullName = form.fullName.trim();
    if (!fullName) {
      notifyError("Укажите ФИО");
      return;
    }
    try {
      setSaving(true);
      await addPerson({
        variables: {
          requestId: request.id,
          person: {
            fullName,
            phone: form.phone.trim() || null,
            seat: form.seat.trim() || null,
            personType: "PASSENGER",
            personCategory: form.personCategory || "ADULT",
          },
        },
      });
      success("Пассажир добавлен");
      setForm(emptyForm);
      setAdding(false);
      onRefetch?.();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при добавлении");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (editingId == null) return;
    const fullName = editForm.fullName.trim();
    if (!fullName) {
      notifyError("Укажите ФИО");
      return;
    }
    const person = savedPassengers.find((p) => p.personId === editingId);
    try {
      setSaving(true);
      await updatePerson({
        variables: {
          requestId: request.id,
          personId: editingId,
          person: {
            fullName,
            phone: editForm.phone.trim() || null,
            seat: editForm.seat.trim() || null,
            personType: person?.personType || "PASSENGER",
            personCategory: editForm.personCategory || "ADULT",
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await removePerson({
        variables: { requestId: request.id, personId: deleteTarget.personId },
      });
      success("Удалено из реестра");
      setDeleteTarget(null);
      onRefetch?.();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при удалении");
    } finally {
      setSaving(false);
    }
  };

  // Локальный подсчёт «добавлено/пропущено» — зеркалит жадный 1:1 матчинг бэка
  const countManifestImport = (people, roster) => {
    const consumed = new Set();
    let added = 0;
    for (const p of people) {
      const key = manifestNameKey(p.fullName);
      const index = (roster || []).findIndex(
        (item, i) => !consumed.has(i) && manifestNameKey(item?.fullName) === key
      );
      if (index === -1) added += 1;
      else consumed.add(index);
    }
    return { added, skipped: people.length - added };
  };

  const handleManifestImport = async () => {
    if (!manifest?.people?.length) return;
    if (!isSameFlight(manifest.flightNumber, request?.flightNumber)) {
      const ok = await confirm({
        message: `Рейс в манифесте (${manifest.flightNumber}) не совпадает с рейсом заявки (${request?.flightNumber}). Импортировать всё равно?`,
        confirmText: "Импортировать",
        cancelText: "Отмена",
      });
      if (!ok) return;
    }
    try {
      setSaving(true);
      const { added, skipped } = countManifestImport(manifest.people, savedPassengers);
      await addPeople({
        variables: {
          requestId: request.id,
          people: manifest.people.map((p) => ({
            fullName: p.fullName,
            seat: p.seat,
            personCategory: p.personCategory,
            personType: "PASSENGER",
          })),
        },
      });
      success(
        skipped > 0
          ? `Добавлено ${added}, пропущено ${skipped} (дубликаты)`
          : `Добавлено ${added}`
      );
      setManifest(null);
      onRefetch?.();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при импорте");
    } finally {
      setSaving(false);
    }
  };

  const targetLabels = deleteTarget
    ? Array.from(presence[deleteTarget.personId] || [])
        .map((k) => SERVICE_CONFIG[k]?.label)
        .filter(Boolean)
    : [];
  const deleteDescription = targetLabels.length
    ? `Размещён в: ${targetLabels.join(", ")}. Удалить из реестра? Из услуг человек не удаляется.`
    : "Удалить пассажира из реестра?";

  return (
    <div className={classes.root}>
      {/* Header card */}
      <div className={classes.head}>
        <div className={classes.headText}>
          <div className={classes.headTitle}>{title}</div>
          <div className={classes.counters}>
            <span className={classes.counter}>
              <span className={classes.counterValue}>{total}</span>
              <span className={classes.counterLabel}>всего</span>
            </span>
            <span className={classes.counter}>
              <span className={classes.counterValue}>{savedPassengers.length}</span>
              <span className={classes.counterLabel}>пассажиров</span>
            </span>
            {includesCrew && (
              <span className={classes.counter}>
                <span className={classes.counterValue}>{crewMembers.length}</span>
                <span className={classes.counterLabel}>экипаж</span>
              </span>
            )}
            <span className={classes.counter}>
              <span className={classes.counterValue}>{kidsCount}</span>
              <span className={classes.counterLabel}>дети и инфанты</span>
            </span>
          </div>
        </div>
        <div className={classes.searchWrap}>
          <input
            placeholder="Поиск по ФИО, телефону, месту"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Manifest import */}
      {canEdit && includesPassengers && (
        <div className={classes.manifestCard}>
          <div className={classes.manifestHead}>Импорт манифеста</div>
          <ManifestUploadField
            parsed={manifest}
            onParsed={setManifest}
            onClear={() => setManifest(null)}
            expectedFlightNumber={request?.flightNumber}
          />
          {manifest?.people?.length > 0 && (
            <div className={classes.manifestConfirm}>
              <button
                type="button"
                className={classes.quickAddBtn}
                onClick={handleManifestImport}
                disabled={saving}
              >
                Добавить {manifest.people.length} в реестр
              </button>
            </div>
          )}
        </div>
      )}

      {/* Passengers */}
      <div className={classes.listCard}>
        <div className={classes.listHead}>
          <span className={classes.listTitle}>Пассажиры</span>
          <span className={classes.listCount}>{savedPassengers.length}</span>
          {canEdit && !adding && (
            <button type="button" className={classes.addBtn} onClick={startAdd}>
              <PlusSvg /> Добавить пассажира
            </button>
          )}
        </div>

        {canEdit && adding && (
          <PersonForm
            values={form}
            onChange={setForm}
            onSubmit={handleAdd}
            onCancel={() => {
              setAdding(false);
              setForm(emptyForm);
            }}
            saving={saving}
            submitLabel="Добавить"
          />
        )}

        <div className={classes.listBody}>
          {filteredPassengers.length === 0 ? (
            <div className={classes.listEmpty}>
              {q
                ? "Ничего не найдено"
                : "Реестр пуст — добавьте пассажиров или импортируйте манифест"}
            </div>
          ) : (
            filteredPassengers.map((p) => {
              if (canEdit && editingId === p.personId) {
                return (
                  <PersonForm
                    key={p.personId}
                    values={editForm}
                    onChange={setEditForm}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveEdit();
                    }}
                    onCancel={cancelEdit}
                    saving={saving}
                    submitLabel="Сохранить"
                  />
                );
              }
              const keys = SERVICE_PRESENCE.filter((s) =>
                presence[p.personId]?.has(s.key)
              );
              return (
                <div key={p.personId} className={classes.row}>
                  <span
                    className={classes.avatar}
                    style={{ background: PERSON_TYPE_CONFIG.PASSENGER.color }}
                  >
                    {initials(p.fullName)}
                  </span>
                  <div className={classes.rowMain}>
                    <div className={classes.rowName}>
                      <span className={classes.rowNameText}>{p.fullName || "—"}</span>
                      <CategoryBadge category={normalizeCategory(p.personCategory)} />
                    </div>
                    <div className={classes.rowMeta}>
                      {[p.seat && `место ${p.seat}`, p.phone]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                  </div>
                  <div className={classes.services}>
                    {keys.length === 0 ? (
                      <span className={classes.servicesEmpty}>—</span>
                    ) : (
                      keys.map(({ key, Icon }) => {
                        const cfg = SERVICE_CONFIG[key];
                        return (
                          <span
                            key={key}
                            className={classes.serviceChip}
                            style={{ background: cfg.bg, color: cfg.color }}
                            title={cfg.label}
                          >
                            <Icon size={15} strokeWidth={2} />
                          </span>
                        );
                      })
                    )}
                  </div>
                  {canEdit && (
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
                        onClick={() => setDeleteTarget(p)}
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

      {/* Crew */}
      {includesCrew && (
        <div className={classes.listCard}>
          <div className={classes.listHead}>
            <span className={classes.listTitle}>Экипаж</span>
            <span
              className={classes.listCount}
              style={{ color: PERSON_TYPE_CONFIG.CREW.color, background: PERSON_TYPE_CONFIG.CREW.bg }}
            >
              {crewMembers.length}
            </span>
          </div>
          <div className={classes.listBody}>
            {filteredCrew.length === 0 ? (
              <div className={classes.listEmpty}>
                {q ? "Ничего не найдено" : "Экипаж не добавлен"}
              </div>
            ) : (
              filteredCrew.map((c, i) => (
                <div
                  key={c.airlinePersonalId || `${c.fullName}-${i}`}
                  className={classes.row}
                >
                  <span
                    className={classes.avatar}
                    style={{ background: PERSON_TYPE_CONFIG.CREW.color }}
                  >
                    {initials(c.fullName)}
                  </span>
                  <div className={classes.rowMain}>
                    <div className={classes.rowName}>
                      <span className={classes.rowNameText}>{c.fullName || "—"}</span>
                      {c.position && <span className={classes.crewPos}>{c.position}</span>}
                    </div>
                    <div className={classes.rowMeta}>{c.phone || "—"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className={classes.crewHint}>
            Изменить состав экипажа — через «Редактировать» на странице заявки.
          </div>
        </div>
      )}

      <FapDestructiveModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Удаление из реестра"
        description={deleteDescription}
        showReason={false}
        confirmText="Удалить"
        cancelText="Отмена"
        saving={saving}
      />
    </div>
  );
}
