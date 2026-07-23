import React, { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { InputMask } from "@react-input/mask";
import classes from "./FapRegistry.module.css";
import {
  ADD_PASSENGER_REQUEST_SAVED_PERSON,
  UPDATE_PASSENGER_REQUEST_SAVED_PERSON,
  REMOVE_PASSENGER_REQUEST_SAVED_PERSON,
  ADD_PASSENGER_REQUEST_SAVED_PEOPLE,
  SET_PASSENGER_REQUEST_GROUP,
  REMOVE_PASSENGER_REQUEST_GROUP,
  getCookie,
} from "../../../../../graphQL_requests";
import {
  SERVICE_CONFIG,
  PERSON_TYPE_CONFIG,
  PERSON_CATEGORY_OPTIONS,
  normalizeCategory,
} from "../fapConstants";
import {
  GROUP_KIND_CONFIG,
  PLACEMENT_REQUIREMENT_OPTIONS,
  buildGroupIndex,
  defaultGroupLabel,
  groupColor,
  groupDisplayLabel,
  groupOrder,
  nextGroupColor,
  requestGroups,
} from "../fapGroups";
import { computeFapGroupWarnings, groupWarningText } from "../fapGroupWarnings";
import { suggestPassengerGroups } from "../../../../utils/fapGroupSuggestions";
import CategoryBadge from "../CategoryBadge/CategoryBadge";
import GroupChip from "../GroupChip/GroupChip";
import GroupCreateModal from "../GroupModal/GroupCreateModal";
import PlacementBadge from "../PlacementBadge/PlacementBadge";
import FapOverflowMenu from "../FapOverflowMenu/FapOverflowMenu";
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

const emptyForm = {
  fullName: "",
  phone: "",
  seat: "",
  personCategory: "ADULT",
  placementRequirement: "",
};

// Значение селекта «Размещение» → Int|null для мутаций реестра.
const placementPayload = (value) => (value === "" ? null : Number(value));

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
      <div className={`${classes.smallField} ${classes.fPlacement}`}>
        <label className={classes.smallFieldLabel}>Размещение</label>
        <select
          className={classes.smallFieldInput}
          value={values.placementRequirement}
          onChange={(e) =>
            onChange({ ...values, placementRequirement: e.target.value })
          }
        >
          {PLACEMENT_REQUIREMENT_OPTIONS.map((o) => (
            <option key={o.label} value={o.value}>{o.label}</option>
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
  const [selected, setSelected] = useState(() => new Set());
  const [groupModal, setGroupModal] = useState(null);
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState(() => new Set());

  const [addPerson] = useMutation(ADD_PASSENGER_REQUEST_SAVED_PERSON, ctx);
  const [updatePerson] = useMutation(UPDATE_PASSENGER_REQUEST_SAVED_PERSON, ctx);
  const [removePerson] = useMutation(REMOVE_PASSENGER_REQUEST_SAVED_PERSON, ctx);
  const [addPeople] = useMutation(ADD_PASSENGER_REQUEST_SAVED_PEOPLE, ctx);
  const [saveGroup] = useMutation(SET_PASSENGER_REQUEST_GROUP, ctx);
  const [dropGroup] = useMutation(REMOVE_PASSENGER_REQUEST_GROUP, ctx);

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

  // Группы: индекс personId→группа, порядок (стабильный цвет-фолбэк) и состав.
  // Мемо строго от документа заявки — не от локальных инпутов (потеря фокуса).
  const groups = requestGroups(request);
  const groupIndex = useMemo(() => buildGroupIndex(request), [request]);
  const groupOrdinals = useMemo(() => groupOrder(request), [request]);
  const membersByGroupId = useMemo(() => {
    const byPerson = new Map(
      (request?.savedPassengers || []).map((p) => [p.personId, p])
    );
    const map = new Map();
    requestGroups(request).forEach((g) => {
      map.set(
        g.groupId,
        (g.memberPersonIds || []).map((id) => byPerson.get(id)).filter(Boolean)
      );
    });
    return map;
  }, [request]);

  // Ворнинги групп и требований — тоже строго от документа заявки.
  const warnings = useMemo(() => computeFapGroupWarnings(request), [request]);

  // Подсказки из манифеста: считаются только по людям без группы,
  // поэтому принятые подсказки исчезают сами после refetch.
  const suggestions = useMemo(
    () =>
      suggestPassengerGroups(
        (request?.savedPassengers || []).filter(
          (p) => p.personId && !groupIndex.has(p.personId)
        )
      ),
    [request, groupIndex]
  );

  const visibleSuggestions = canEdit
    ? suggestions.filter((s) => !dismissedSuggestions.has(s.key))
    : [];

  const kidsCount = savedPassengers.filter((p) => {
    const c = normalizeCategory(p.personCategory);
    return c === "CHILD" || c === "INFANT";
  }).length;
  const total = savedPassengers.length + crewMembers.length;

  const q = search.trim().toLowerCase();
  const matchText = (...vals) =>
    !q || vals.some((v) => (v || "").toLowerCase().includes(q));
  // Порядок по умолчанию: сначала со связью (в группе), затем по алфавиту ФИО.
  const filteredPassengers = savedPassengers
    .filter((p) => matchText(p.fullName, p.phone, p.seat))
    .sort((a, b) => {
      const ga = a.personId && groupIndex.has(a.personId) ? 0 : 1;
      const gb = b.personId && groupIndex.has(b.personId) ? 0 : 1;
      if (ga !== gb) return ga - gb;
      return (a.fullName ?? "").localeCompare(b.fullName ?? "", "ru");
    });
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
      placementRequirement:
        p.placementRequirement != null ? String(p.placementRequirement) : "",
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
            placementRequirement: placementPayload(form.placementRequirement),
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
            placementRequirement: placementPayload(editForm.placementRequirement),
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

  // ── Выбор пассажиров и группы ──
  const selectedPersons = savedPassengers.filter((p) => selected.has(p.personId));

  const toggleSelected = (personId) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  // «Связать в группу»: если кто-то уже в другой группе — подтверждаем перенос
  // (один человек — максимум одна группа).
  const openGroupCreate = async () => {
    const moved = selectedPersons.filter((p) => groupIndex.has(p.personId)).length;
    if (moved > 0) {
      const ok = await confirm({
        message: `${moved} из выбранных уже в группах — перенести?`,
        confirmText: "Перенести",
        cancelText: "Отмена",
      });
      if (!ok) return;
    }
    setGroupModal({ group: null, members: selectedPersons });
  };

  const openGroupEdit = (group) => setGroupModal({ group, members: [] });

  // Подсказка → модалка с предзаполненным составом (тип «Семья» — дефолт модалки).
  const openSuggestion = (suggestion) =>
    setGroupModal({ group: null, members: suggestion.members });

  const modalMembers = groupModal?.group
    ? membersByGroupId.get(groupModal.group.groupId) || []
    : groupModal?.members || [];

  const modalOrdinal = groupModal?.group
    ? (groupOrdinals.get(groupModal.group.groupId) ?? groups.length) + 1
    : groups.length + 1;

  const handleGroupConfirm = async ({ groupId, label, kind, memberPersonIds }) => {
    const editing = groupModal?.group || null;
    try {
      setSaving(true);
      await saveGroup({
        variables: {
          requestId: request.id,
          group: {
            ...(groupId ? { groupId } : {}),
            label,
            kind,
            memberPersonIds,
            color: editing?.color || nextGroupColor(groups),
          },
        },
      });
      success(editing ? "Группа сохранена" : "Группа создана");
      setGroupModal(null);
      clearSelection();
      onRefetch?.();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при сохранении группы");
    } finally {
      setSaving(false);
    }
  };

  const handleGroupRemove = async (group) => {
    const ok = await confirm({
      message: `Расформировать группу «${groupDisplayLabel(group)}»?`,
      confirmText: "Расформировать",
      cancelText: "Отмена",
    });
    if (!ok) return;
    try {
      setSaving(true);
      await dropGroup({
        variables: { requestId: request.id, groupId: group.groupId },
      });
      success("Группа расформирована");
      onRefetch?.();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при расформировании");
    } finally {
      setSaving(false);
    }
  };

  // Понижение уровня «вместе» до гостиницы — единственный UI togetherLevel в v1
  // (гасит ворнинг «группа разнесена по номерам»).
  const handleGroupLevelHotel = async (group) => {
    try {
      setSaving(true);
      await saveGroup({
        variables: {
          requestId: request.id,
          group: {
            groupId: group.groupId,
            label: group.label,
            kind: group.kind,
            color: group.color,
            memberPersonIds: group.memberPersonIds || [],
            togetherLevel: "HOTEL",
          },
        },
      });
      success("Группа селится в одной гостинице");
      onRefetch?.();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при сохранении группы");
    } finally {
      setSaving(false);
    }
  };

  const dismissSuggestion = (key) =>
    setDismissedSuggestions((prev) => new Set(prev).add(key));

  // «Связать все N» — строго последовательные мутации (бэк переписывает весь
  // массив групп целиком, параллельные вызовы теряют данные).
  const handleLinkAllSuggestions = async () => {
    if (visibleSuggestions.length === 0) return;
    try {
      setSaving(true);
      const acc = [...groups];
      for (const s of visibleSuggestions) {
        const color = nextGroupColor(acc);
        // eslint-disable-next-line no-await-in-loop
        await saveGroup({
          variables: {
            requestId: request.id,
            group: {
              label: defaultGroupLabel(s.members, acc.length + 1),
              kind: s.kind,
              memberPersonIds: s.members.map((m) => m.personId),
              color,
            },
          },
        });
        acc.push({ color });
      }
      success(`Создано групп: ${visibleSuggestions.length}`);
      onRefetch?.();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при создании групп");
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

      {/* Groups */}
      {(groups.length > 0 || visibleSuggestions.length > 0) && (
        <div className={classes.listCard}>
          <div
            className={`${classes.listHead} ${classes.groupsHead}`}
            onClick={() => setGroupsOpen((v) => !v)}
          >
            <span className={classes.listTitle}>Группы</span>
            <span className={classes.listCount}>{groups.length}</span>
            <span className={classes.groupsToggle}>
              {groupsOpen ? "Свернуть" : "Развернуть"}
            </span>
          </div>
          {groupsOpen && (
            <div className={classes.listBody}>
              {groups.map((g) => {
                const members = membersByGroupId.get(g.groupId) || [];
                const warn = warnings.byGroupId.get(g.groupId);
                return (
                  <div key={g.groupId} className={classes.groupRow}>
                    <span
                      className={classes.groupDot}
                      style={{
                        background: groupColor(g, groupOrdinals.get(g.groupId) ?? 0),
                      }}
                    />
                    <div className={classes.rowMain}>
                      <div className={classes.rowName}>
                        <span className={classes.rowNameText}>
                          {groupDisplayLabel(g)}
                        </span>
                      </div>
                      <div className={classes.rowMeta}>
                        {[
                          GROUP_KIND_CONFIG[g.kind]?.label,
                          `${members.length} чел.`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                        {members.length === 1 && (
                          <span className={classes.groupNote}>остался 1 человек</span>
                        )}
                      </div>
                      {warn && (
                        <div className={classes.groupWarn}>
                          <span>⚠ {groupWarningText(warn)}</span>
                          {canEdit && warn.splitRooms && (
                            <button
                              type="button"
                              className={classes.groupWarnBtn}
                              onClick={() => handleGroupLevelHotel(g)}
                              disabled={saving}
                            >
                              Считать уровнем «гостиница»
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {canEdit && (
                      <FapOverflowMenu
                        items={[
                          {
                            label: "Изменить",
                            icon: EditPencilIcon,
                            onClick: () => openGroupEdit(g),
                          },
                          {
                            label: "Расформировать",
                            icon: DeleteIcon,
                            tone: "danger",
                            onClick: () => handleGroupRemove(g),
                          },
                        ]}
                      />
                    )}
                  </div>
                );
              })}

              {visibleSuggestions.length > 0 && (
                <div className={classes.suggestBlock}>
                  <div className={classes.suggestHead}>
                    <span className={classes.suggestTitle}>
                      Похоже на группы: {visibleSuggestions.length}
                    </span>
                    {visibleSuggestions.length >= 2 && (
                      <button
                        type="button"
                        className={classes.bulkBtn}
                        onClick={handleLinkAllSuggestions}
                        disabled={saving}
                      >
                        Связать все {visibleSuggestions.length}
                      </button>
                    )}
                  </div>
                  {visibleSuggestions.map((s) => (
                    <div key={s.key} className={classes.suggestCard}>
                      <div className={classes.rowMain}>
                        <div className={classes.rowName}>
                          <span className={classes.rowNameText}>
                            {s.members.map((m) => m.fullName || "—").join(", ")}
                          </span>
                        </div>
                        <div className={classes.rowMeta}>{s.reason}</div>
                      </div>
                      <button
                        type="button"
                        className={classes.bulkBtn}
                        onClick={() => openSuggestion(s)}
                        disabled={saving}
                      >
                        Связать
                      </button>
                      <button
                        type="button"
                        className={classes.clearSelBtn}
                        onClick={() => dismissSuggestion(s.key)}
                      >
                        Скрыть
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

        {canEdit && selectedPersons.length >= 2 && (
          <div className={classes.selectionBar}>
            <span className={classes.selectionCount}>
              Выбрано: {selectedPersons.length}
            </span>
            <button
              type="button"
              className={classes.bulkBtn}
              onClick={openGroupCreate}
              disabled={saving}
            >
              Связать в группу
            </button>
            <span className={classes.spacer} />
            <button
              type="button"
              className={classes.clearSelBtn}
              onClick={clearSelection}
            >
              Снять выбор
            </button>
          </div>
        )}

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
              const group = groupIndex.get(p.personId);
              const groupWarn = group ? warnings.byGroupId.get(group.groupId) : null;
              return (
                <div key={p.personId} className={classes.row}>
                  {canEdit && (
                    <div className={classes.rowCheck}>
                      <input
                        type="checkbox"
                        checked={selected.has(p.personId)}
                        onChange={() => toggleSelected(p.personId)}
                      />
                    </div>
                  )}
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
                      <PlacementBadge value={p.placementRequirement} />
                      <GroupChip
                        group={group}
                        index={group ? groupOrdinals.get(group.groupId) ?? 0 : 0}
                        members={group ? membersByGroupId.get(group.groupId) || [] : null}
                        warn={!!groupWarn}
                        warnText={groupWarningText(groupWarn)}
                        onEdit={canEdit ? openGroupEdit : null}
                      />
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

      <GroupCreateModal
        open={!!groupModal}
        onClose={() => setGroupModal(null)}
        members={modalMembers}
        group={groupModal?.group || null}
        ordinal={modalOrdinal}
        saving={saving}
        onConfirm={handleGroupConfirm}
      />
    </div>
  );
}
