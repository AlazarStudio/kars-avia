import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { InputMask } from "@react-input/mask";
import classes from "./FapDriverPage.module.css";
import {
  ADD_PASSENGER_REQUEST_DRIVER_PERSON,
  ADD_PASSENGER_REQUEST_DRIVER_PEOPLE,
  UPDATE_PASSENGER_REQUEST_DRIVER_PERSON,
  REMOVE_PASSENGER_REQUEST_DRIVER_PERSON,
  REMOVE_PASSENGER_REQUEST_DRIVER_PEOPLE,
  UPDATE_PASSENGER_REQUEST_DRIVER,
  getCookie,
} from "../../../../../graphQL_requests";
import { formatTime, formatDate, toLocalInputValue, PERSON_CATEGORY_OPTIONS, normalizeCategory } from "../fapConstants";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import PersonTypeToggle from "../PersonTypeToggle/PersonTypeToggle";
import PersonBadge from "../PersonBadge/PersonBadge";
import CategoryBadge from "../CategoryBadge/CategoryBadge";
import CatalogPickerModal, { personKey } from "../CatalogPickerModal/CatalogPickerModal";
import { driverFactCount } from "../fapTransferFact";
import FapActionButton from "../FapActionButton/FapActionButton";
import FapSelect from "../FapSelect/FapSelect";
import FapHeaderActions from "../FapHeaderActions/FapHeaderActions";
import { downloadTransferReport } from "../reports/buildReportSheets";
import BusIcon from "../../../../shared/icons/BusIcon";
import BusDownIcon from "../../../../shared/icons/BusDownIcon";
import EditPencilIcon from "../../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import CloseIcon from "../../../../shared/icons/CloseIcon";
import CopyIcon from "../../../../shared/icons/CopyIcon";

// Валидация формы + сборка person-объекта для CREW/PASSENGER.
// Возвращает { ok, error } при ошибке валидации или { ok, person } при успехе.
function buildPersonInput(form, crewRoster) {
  if (form.personType === "CREW") {
    if (!form.airlinePersonalId) {
      return { ok: false, error: "Выберите сотрудника экипажа" };
    }
    const member = crewRoster.find(
      (m) => m.airlinePersonalId === form.airlinePersonalId
    );
    if (!member) {
      return { ok: false, error: "Сотрудник не найден в ростере" };
    }
    return {
      ok: true,
      person: {
        fullName: member.fullName,
        phone: member.phone || undefined,
        personType: "CREW",
        airlinePersonalId: member.airlinePersonalId,
        personCategory: "ADULT",
      },
    };
  }
  if (!form.fullName.trim()) {
    return { ok: false, error: "Укажите ФИО пассажира" };
  }
  return {
    ok: true,
    person: {
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || undefined,
      personType: "PASSENGER",
      personCategory: form.personCategory || "ADULT",
    },
  };
}

const TR = "#8B5CF6";
const TR_BG = "#F5F3FF";
const TR_DEP = "#7C3AED";

const PlusSvg = ({ size = 15, color = "currentColor", strokeWidth = 2.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);
const CheckSvg = ({ size = 14, color = "#fff", strokeWidth = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 12l5 5L20 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ClockSvg = ({ size = 13, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
    <path d="M12 7v5l3 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PhoneSvg = ({ size = 14, color = "currentColor", strokeWidth = 1.9 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M22 17v3a2 2 0 0 1-2 2A19 19 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8l-1.3 1.3a16 16 0 0 0 6.6 6.6l1.3-1.3a2 2 0 0 1 1.8-.6l3 .5A2 2 0 0 1 22 17Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const LinkSvg = ({ size = 14, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const PinSvg = ({ size = 14, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 1 1 18 0Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="3" stroke={color} strokeWidth={strokeWidth} />
  </svg>
);
const SearchSvg = ({ size = 15, color = "#94A3B8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
    <path d="M21 21l-4.3-4.3" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const RouteArrowSvg = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const initials = (fullName) => {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const emptyForm = { fullName: "", phone: "", personType: "PASSENGER", airlinePersonalId: "", personCategory: "ADULT" };

// Длинное название гостиницы не должно распирать кнопку.
const shortName = (s) => {
  const name = String(s ?? "");
  return name.length > 24 ? `${name.slice(0, 23)}…` : name;
};

const buildMapUrl = (from, to) => {
  const f = (from || "").trim();
  const t = (to || "").trim();
  if (f && t) {
    return `https://yandex.ru/maps/?rtext=${encodeURIComponent(f)}~${encodeURIComponent(t)}&rtt=auto`;
  }
  const addr = f || t;
  if (!addr) return "";
  return `https://yandex.ru/maps/?text=${encodeURIComponent(addr)}`;
};

export default function FapDriverPage({
  request,
  driverIndex,
  direction = "ARRIVAL",
  onRefetch,
  canEdit = true,
  showLinks = true,
  user,
}) {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const token = getCookie("token");
  const { success, error: notifyError, warning } = useToast();
  const { confirm } = useDialog();

  const isDeparture = direction === "DEPARTURE";
  const color = isDeparture ? TR_DEP : TR;
  const bg = TR_BG;
  const HeadIcon = isDeparture ? BusDownIcon : BusIcon;
  const serviceKey = isDeparture ? "transferDeparture" : "transfer";
  const service = isDeparture
    ? request?.departureTransferService
    : request?.transferService;
  const drivers = service?.drivers || [];
  const driver = drivers[Number(driverIndex)] || null;
  const showCrewToggle = request?.includesCrew;

  const [tab, setTab] = useState("people");
  const [search, setSearch] = useState("");
  const [personMode, setPersonMode] = useState("PASSENGER");
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // person index
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [editingPickup, setEditingPickup] = useState(false);
  const [pickupDraft, setPickupDraft] = useState("");
  const [savingPickup, setSavingPickup] = useState(false);

  const [addPerson] = useMutation(ADD_PASSENGER_REQUEST_DRIVER_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [updatePerson] = useMutation(UPDATE_PASSENGER_REQUEST_DRIVER_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [removePerson] = useMutation(REMOVE_PASSENGER_REQUEST_DRIVER_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [removeDriverPeople] = useMutation(REMOVE_PASSENGER_REQUEST_DRIVER_PEOPLE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [addPeople] = useMutation(ADD_PASSENGER_REQUEST_DRIVER_PEOPLE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [updateDriver] = useMutation(UPDATE_PASSENGER_REQUEST_DRIVER, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const people = driver?.people || [];
  const passengers = people.filter((p) => p?.personType !== "CREW");
  const crew = people.filter((p) => p?.personType === "CREW");

  // Мемо, чтобы стабильная ссылка не сбрасывала мемоизацию пикера и кандидатов.
  const savedPassengers = useMemo(() => request?.savedPassengers || [], [request]);
  // «уже добавлен» — по всем водителям текущего направления, а не только текущего:
  // пассажир, назначенный другому водителю того же направления, не должен предлагаться повторно.
  const excludeKeys = useMemo(
    () =>
      new Set(
        (service?.drivers ?? [])
          .flatMap((d) => d?.people ?? [])
          .map((p) => personKey(p))
          .filter(Boolean)
      ),
    [service]
  );

  // Гостиницы проживания с itemId и «кто где заселён» (personId → itemId гостиницы).
  // Образец — placedByPersonId в FapHotelPage.
  const hotelsWithItemId = useMemo(
    () => (request?.livingService?.hotels ?? []).filter((h) => h?.itemId),
    [request]
  );
  const residencyByPersonId = useMemo(() => {
    const map = new Map();
    hotelsWithItemId.forEach((h) => {
      (h?.people ?? []).forEach((p) => {
        if (p?.personId && !map.has(p.personId)) map.set(p.personId, h.itemId);
      });
    });
    return map;
  }, [hotelsWithItemId]);
  // Заселённость для подписей фильтра в пикере: сколько человек в каждой гостинице
  // и сколько вообще без размещения.
  const hotelPicker = useMemo(() => {
    const counts = new Map();
    let noPlacementCount = 0;
    savedPassengers.forEach((p) => {
      const id = p?.personId;
      if (!id) return;
      const key = residencyByPersonId.get(id);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
      else noPlacementCount += 1;
    });
    return {
      options: hotelsWithItemId.map((h) => ({
        key: h.itemId,
        name: h.name,
        count: counts.get(h.itemId) ?? 0,
      })),
      noPlacementCount,
    };
  }, [savedPassengers, residencyByPersonId, hotelsWithItemId]);
  const linkedHotel = useMemo(
    () => hotelsWithItemId.find((h) => h.itemId === driver?.hotelItemId) || null,
    [hotelsWithItemId, driver]
  );
  // Кого вообще можно взять из привязанной гостиницы: заселён туда и ещё не у водителя.
  const residentCandidates = useMemo(
    () =>
      linkedHotel
        ? savedPassengers
            .map((p) => p.personId)
            .filter(
              (id) =>
                id &&
                residencyByPersonId.get(id) === linkedHotel.itemId &&
                !excludeKeys.has(id)
            )
        : [],
    [linkedHotel, savedPassengers, residencyByPersonId, excludeKeys]
  );
  // Пресет пикера: с какой гостиницей открыть и кого предвыбрать.
  const [pickerPreset, setPickerPreset] = useState(null);

  const handleCatalogConfirm = async (selected) => {
    try {
      setSaving(true);
      await addPeople({
        variables: {
          requestId: request.id,
          driverIndex: Number(driverIndex),
          direction,
          people: selected.map((p) => ({
            personId: p.personId,
            fullName: p.fullName,
            phone: p.phone || undefined,
            personType: "PASSENGER",
            personCategory: normalizeCategory(p.personCategory),
          })),
        },
      });
      success(`Добавлено ${selected.length}`);
      setCatalogOpen(false);
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при добавлении");
    } finally {
      setSaving(false);
    }
  };

  // Crew roster minus those already assigned ANY driver in this direction
  const allAssignedCrewIds = useMemo(() => {
    const ids = new Set();
    drivers.forEach((d) => {
      (d.people || []).forEach((p) => {
        if (p?.personType === "CREW" && p?.airlinePersonalId) {
          ids.add(p.airlinePersonalId);
        }
      });
    });
    return ids;
  }, [drivers]);

  const crewRoster = request?.crewMembers || [];
  const availableCrew = crewRoster.filter(
    (m) => !allAssignedCrewIds.has(m.airlinePersonalId)
  );

  const crewPickerItems = availableCrew.map((m) => ({
    personId: m.airlinePersonalId,
    fullName: m.fullName,
    phone: m.phone || null,
  }));

  const handleCrewCatalogConfirm = async (selected) => {
    try {
      setSaving(true);
      await addPeople({
        variables: {
          requestId: request.id,
          driverIndex: Number(driverIndex),
          direction,
          people: selected.map((p) => ({
            fullName: p.fullName,
            phone: p.phone || undefined,
            personType: "CREW",
            airlinePersonalId: p.personId,
            personCategory: "ADULT",
          })),
        },
      });
      success(`Добавлено ${selected.length}`);
      setCatalogOpen(false);
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при добавлении");
    } finally {
      setSaving(false);
    }
  };

  const cap = driver?.peopleCount || 0;
  const placed = people.length;
  const fact = driverFactCount(driver);
  const remainingSlots = cap > 0 ? cap - placed : null;
  const isCancelled = service?.status === "CANCELLED";
  const isCompleted = service?.status === "COMPLETED" || isCancelled;

  // Открыть пикер с предвыбранными жильцами привязанной гостиницы (в пределах свободных мест).
  const openResidentsPicker = () => {
    if (!linkedHotel) return;
    const residents = residentCandidates;
    const capped =
      remainingSlots != null
        ? residents.slice(0, Math.max(0, remainingSlots))
        : residents;
    if (capped.length < residents.length) {
      warning(
        `Мест хватает только на ${capped.length} из ${residents.length} заселённых`
      );
    }
    setPickerPreset({ initialKey: linkedHotel.itemId, initialSelectedIds: capped });
    setCatalogOpen(true);
  };

  // Filter by tab+search
  const visible = useMemo(() => {
    const base = personMode === "CREW" ? crew : passengers;
    const indexed = base.map((p) => ({
      ...p,
      _realIdx: people.indexOf(p),
    }));
    if (!search.trim()) return indexed;
    const q = search.trim().toLowerCase();
    return indexed.filter(
      (p) =>
        (p.fullName || "").toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q)
    );
  }, [personMode, people, passengers, crew, search]);

  const allSelected =
    visible.length > 0 && visible.every((p) => selected.includes(p._realIdx));
  const toggleAll = () =>
    setSelected((prev) => {
      const ids = visible.map((p) => p._realIdx);
      const all = ids.every((i) => prev.includes(i));
      if (all) return prev.filter((i) => !ids.includes(i));
      return [...new Set([...prev, ...ids])].sort((a, b) => a - b);
    });

  const toggleSel = (idx) =>
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
  const clearSel = () => setSelected([]);

  const copyLink = (url) => {
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => success("Ссылка скопирована"))
      .catch(() => notifyError("Не удалось скопировать ссылку"));
  };

  const cancelAdd = () => {
    setAdding(false);
    setAddForm(emptyForm);
  };
  const cancelEdit = () => {
    setEditing(null);
    setEditForm(emptyForm);
  };

  const openAdd = () => {
    setEditing(null);
    setAdding(true);
    setAddForm({
      fullName: "",
      phone: "",
      personType: personMode,
      airlinePersonalId: "",
      personCategory: "ADULT",
    });
  };

  const handleAdd = async () => {
    const built = buildPersonInput(addForm, crewRoster);
    if (!built.ok) {
      notifyError(built.error);
      return;
    }
    try {
      setSaving(true);
      await addPerson({
        variables: {
          requestId: request.id,
          driverIndex: Number(driverIndex),
          direction,
          person: built.person,
        },
      });
      success(
        built.person.personType === "CREW"
          ? "Член экипажа добавлен"
          : "Пассажир добавлен"
      );
      cancelAdd();
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при добавлении");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (p) => {
    setAdding(false);
    setEditing(p._realIdx);
    setEditForm({
      fullName: p.fullName || "",
      phone: p.phone || "",
      personType: p.personType === "CREW" ? "CREW" : "PASSENGER",
      airlinePersonalId: p.airlinePersonalId || "",
      personCategory: normalizeCategory(p.personCategory),
    });
  };

  const handleSaveEdit = async () => {
    if (editing == null) return;
    const built = buildPersonInput(editForm, crewRoster);
    if (!built.ok) {
      notifyError(built.error);
      return;
    }
    try {
      setSaving(true);
      await updatePerson({
        variables: {
          requestId: request.id,
          driverIndex: Number(driverIndex),
          personIndex: editing,
          direction,
          person: built.person,
        },
      });
      success("Сохранено");
      cancelEdit();
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    const isCrew = personMode === "CREW";
    const ok = await confirm(
      isCrew
        ? `Снять выбранных (${selected.length}) с водителя?`
        : `Удалить выбранных (${selected.length})?`
    );
    if (!ok) return;
    try {
      setSaving(true);
      await removeDriverPeople({
        variables: {
          requestId: request.id,
          driverIndex: Number(driverIndex),
          personIndexes: selected,
          direction,
        },
      });
      success(isCrew ? `Снято: ${selected.length}` : `Удалено: ${selected.length}`);
      // То же, что и у одиночного удаления ниже, и по той же причине: открытая
      // правка адресует человека индексом `_realIdx`, а удаление строк выше его
      // сдвигает — сохранение уехало бы соседу и пересобрало его из одного лишь
      // входа формы.
      cancelAdd();
      cancelEdit();
      clearSel();
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при удалении");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    const isCrew = p.personType === "CREW";
    const ok = await confirm(
      isCrew ? "Снять члена экипажа с этого водителя?" : "Удалить пассажира?"
    );
    if (!ok) return;
    try {
      setSaving(true);
      await removePerson({
        variables: {
          requestId: request.id,
          driverIndex: Number(driverIndex),
          personIndex: p._realIdx,
          direction,
        },
      });
      // То же, что уже делает переключатель «Пассажиры/Экипаж» ниже: и
      // выделение, и открытая правка адресуют человека индексом `_realIdx` по
      // ВСЕМУ массиву, а удаление его сдвигает. Правка, оставшаяся открытой,
      // после удаления строки выше уезжала на соседа — и не просто
      // переименовывала его, а обнуляла бирки, стоимость и адрес доставки:
      // резолвер пересобирает пассажира из одного только входа.
      // Сбрасываем после успеха, чтобы при ошибке не терять ввод.
      cancelAdd();
      cancelEdit();
      clearSel();
      success(isCrew ? "Снят с водителя" : "Пассажир удалён");
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при удалении");
    } finally {
      setSaving(false);
    }
  };

  const savePickup = async () => {
    try {
      setSavingPickup(true);
      await updateDriver({
        variables: {
          requestId: request.id,
          driverIndex: Number(driverIndex),
          direction,
          patch: {
            pickupAt: pickupDraft ? new Date(pickupDraft).toISOString() : null,
          },
        },
      });
      setEditingPickup(false);
      onRefetch?.();
      success("Время подачи обновлено");
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при обновлении");
    } finally {
      setSavingPickup(false);
    }
  };

  if (!driver) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>Водитель не найден</div>
      </div>
    );
  }

  const linkUrl = driver.linkPWA || driver.link || "";
  const linkLabel = driver.linkPWA
    ? "Сканер"
    : driver.link
    ? "Ссылка"
    : "";

  const renderRow = (p) => {
    const isEditing = editing === p._realIdx;
    if (isEditing) {
      const isCrewEdit = editForm.personType === "CREW";
      return (
        <div key={p._realIdx} className={classes.editRow} style={{ background: `${color}11` }}>
          <span className={classes.selectBox} />
          <span
            className={classes.avatar}
            style={{
              background: isCrewEdit ? TR : "#3B82F6",
            }}
          >
            {initials(editForm.fullName || p.fullName)}
          </span>
          <div className={classes.cellName} style={{ alignItems: "center" }}>
            {isCrewEdit ? (
              <FapSelect
                accent={color}
                menuMinWidth={260}
                value={editForm.airlinePersonalId}
                onChange={(v) => {
                  const m = crewRoster.find((mm) => mm.airlinePersonalId === v);
                  setEditForm((f) => ({
                    ...f,
                    airlinePersonalId: v,
                    fullName: m?.fullName ?? "",
                    phone: m?.phone ?? "",
                  }));
                }}
                options={[
                  { value: "", label: "Выберите сотрудника" },
                  // Текущий член экипажа должен остаться в списке, даже если он уже
                  // помечен назначенным и потому выпал из availableCrew.
                  ...(p.airlinePersonalId &&
                  crewRoster.some((m) => m.airlinePersonalId === p.airlinePersonalId) &&
                  !availableCrew.some((m) => m.airlinePersonalId === p.airlinePersonalId)
                    ? [
                        {
                          value: p.airlinePersonalId,
                          label: `${p.fullName} · из экипажа (текущий)`,
                        },
                      ]
                    : []),
                  ...availableCrew.map((m) => ({
                    value: m.airlinePersonalId,
                    label: [m.fullName, m.position].filter(Boolean).join(", "),
                  })),
                ]}
              />
            ) : (
              <input
                className={classes.editInput}
                style={{
                  width: "100%",
                  border: `1px solid ${color}`,
                  boxShadow: `0 0 0 3px ${bg}`,
                }}
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, fullName: e.target.value }))
                }
                placeholder="ФИО пассажира"
                autoFocus
              />
            )}
          </div>
          <div className={classes.cellCategory}>
            {isCrewEdit ? (
              <span className={classes.dash}>—</span>
            ) : (
              <FapSelect
                accent={color}
                value={editForm.personCategory}
                onChange={(v) => setEditForm((f) => ({ ...f, personCategory: v }))}
                options={PERSON_CATEGORY_OPTIONS}
              />
            )}
          </div>
          {isCrewEdit ? (
            <div className={classes.editPhoneRO}>
              <PhoneSvg size={12} color="#9AA0B4" />
              <span className={classes.editPhoneROText}>
                {editForm.phone || "из ростера"}
              </span>
            </div>
          ) : (
            <InputMask
              className={classes.editInput}
              style={{
                width: "100%",
                border: `1px solid ${color}`,
                boxShadow: `0 0 0 3px ${bg}`,
              }}
              mask="+7 (___) ___-__-__"
              replacement={{ _: /\d/ }}
              value={editForm.phone}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder="+7 (___) ___-__-__"
            />
          )}
          <div className={classes.editActions}>
            <button
              type="button"
              className={classes.saveBtn}
              style={{ background: color }}
              onClick={handleSaveEdit}
              disabled={
                saving ||
                (editForm.personType === "CREW"
                  ? !editForm.airlinePersonalId
                  : !editForm.fullName.trim())
              }
              title="Сохранить"
            >
              <CheckSvg />
            </button>
            <button
              type="button"
              className={classes.cancelBtn}
              onClick={cancelEdit}
              title="Отмена"
            >
              <CloseIcon color="#545873" />
            </button>
          </div>
        </div>
      );
    }
    return (
      <div key={p._realIdx} className={classes.row}>
        <span className={classes.selectBox}>
          {canEdit && (
            <input
              type="checkbox"
              checked={selected.includes(p._realIdx)}
              onChange={() => toggleSel(p._realIdx)}
            />
          )}
        </span>
        <span
          className={classes.avatar}
          style={{ background: p.personType === "CREW" ? TR : "#3B82F6" }}
        >
          {initials(p.fullName)}
        </span>
        <div className={classes.cellName}>
          <div className={classes.cellNameText}>
            <div className={classes.personName}>
              {p.fullName || "—"}
              {p.personType === "CREW" && <PersonBadge type="CREW" />}
            </div>
          </div>
        </div>
        <div className={classes.cellCategory}>
          {p.personType === "CREW" ? (
            <span className={classes.dash}>—</span>
          ) : (
            <CategoryBadge category={normalizeCategory(p.personCategory)} />
          )}
        </div>
        <div className={classes.cellPhone}>
          {p.phone || <span className={classes.dash}>—</span>}
        </div>
        <div className={classes.rowActions}>
          {canEdit && (
            <>
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
                onClick={() => handleDelete(p)}
                title={p.personType === "CREW" ? "Снять с водителя" : "Удалить"}
              >
                <DeleteIcon cursor="pointer" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderAddRow = () => {
    const isCrewAdd = addForm.personType === "CREW";
    return (
      <div className={classes.editRow} style={{ background: `${color}11` }}>
        <span className={classes.selectBox} />
        <span
          className={classes.avatarDraft}
          style={{ color }}
        >
          <PlusSvg color={color} />
        </span>
        <div className={classes.cellName}>
          {isCrewAdd ? (
            <FapSelect
              accent={color}
              menuMinWidth={260}
              autoFocus
              value={addForm.airlinePersonalId}
              onChange={(v) => {
                const m = crewRoster.find((mm) => mm.airlinePersonalId === v);
                setAddForm((f) => ({
                  ...f,
                  airlinePersonalId: v,
                  fullName: m?.fullName ?? "",
                  phone: m?.phone ?? "",
                }));
              }}
              options={[
                { value: "", label: "Выберите сотрудника" },
                ...availableCrew.map((m) => ({
                  value: m.airlinePersonalId,
                  label: [m.fullName, m.position].filter(Boolean).join(", "),
                })),
              ]}
            />
          ) : (
            <input
              className={classes.editInput}
              style={{
                width: "100%",
                border: `1px solid ${color}`,
                boxShadow: `0 0 0 3px ${bg}`,
              }}
              value={addForm.fullName}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, fullName: e.target.value }))
              }
              placeholder="ФИО пассажира"
              autoFocus
            />
          )}
        </div>
        <div className={classes.cellCategory}>
          {isCrewAdd ? (
            <span className={classes.dash}>—</span>
          ) : (
            <FapSelect
              accent={color}
              value={addForm.personCategory}
              onChange={(v) => setAddForm((f) => ({ ...f, personCategory: v }))}
              options={PERSON_CATEGORY_OPTIONS}
            />
          )}
        </div>
        {isCrewAdd ? (
          <div className={classes.editPhoneRO}>
            <PhoneSvg size={12} color="#9AA0B4" />
            <span className={classes.editPhoneROText}>
              {addForm.phone || "из ростера"}
            </span>
          </div>
        ) : (
          <InputMask
            className={classes.editInput}
            style={{
              width: "100%",
              border: `1px solid ${color}`,
              boxShadow: `0 0 0 3px ${bg}`,
            }}
            mask="+7 (___) ___-__-__"
            replacement={{ _: /\d/ }}
            value={addForm.phone}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, phone: e.target.value }))
            }
            placeholder="+7 (___) ___-__-__"
          />
        )}
        <div className={classes.editActions}>
          <button
            type="button"
            className={classes.saveBtn}
            style={{ background: color }}
            onClick={handleAdd}
            disabled={
              saving ||
              (isCrewAdd
                ? !addForm.airlinePersonalId
                : !addForm.fullName.trim())
            }
            title="Добавить"
          >
            <CheckSvg />
          </button>
          <button
            type="button"
            className={classes.cancelBtn}
            onClick={cancelAdd}
            title="Отмена"
          >
            <CloseIcon color="#545873" />
          </button>
        </div>
      </div>
    );
  };

  const addDisabled =
    (remainingSlots != null && remainingSlots <= 0) ||
    (personMode === "CREW" && availableCrew.length === 0);

  return (
    <div className={classes.root}>
      {/* ── Header (3 rows) ── */}
      <div className={classes.headPanel}>
        {/* Row 1 — identity + actions */}
        <div className={classes.headRow1}>
          <div
            className={classes.headIcon}
            style={{
              background: `linear-gradient(135deg, ${bg}, #FFFFFF)`,
              boxShadow: `inset 0 0 0 1px ${color}33`,
              color,
            }}
          >
            <HeadIcon size={24} strokeWidth={2} />
          </div>
          <div className={classes.headText}>
            <div className={classes.headTitleRow}>
              <span className={classes.headTitle}>
                {driver.fullName || "Водитель"}
              </span>
            </div>
            {driver.phone && (
              <div className={classes.headSub}>
                <PhoneSvg size={13} color="#545873" />
                <strong>{driver.phone}</strong>
              </div>
            )}
          </div>
          {showLinks && linkUrl && (
            <button
              type="button"
              className={classes.linkBtn}
              onClick={() => copyLink(linkUrl)}
              title={`Скопировать ссылку «${linkLabel}»`}
            >
              <LinkSvg color="var(--dark-blue)" /> {linkLabel} <CopyIcon />
            </button>
          )}
          <FapHeaderActions
            request={request}
            user={user}
            canEdit={canEdit && !isCompleted}
            onRefetch={onRefetch}
            onDownloadReport={() => downloadTransferReport(request, direction)}
          />
        </div>

        {/* Row 2 — metrics */}
        <div className={classes.headRow2}>
          <div className={classes.metric}>
            <span className={classes.metricLabel}>Подача</span>
            {!editingPickup ? (
              <span className={classes.metricValue} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {driver.pickupAt
                  ? `${formatDate(driver.pickupAt)} · ${formatTime(driver.pickupAt)}`
                  : "не указана"}
                {canEdit && !isCompleted && (
                  <button
                    type="button"
                    className={classes.iconBtn}
                    onClick={() => {
                      setPickupDraft(toLocalInputValue(driver.pickupAt));
                      setEditingPickup(true);
                    }}
                    title="Изменить время подачи"
                    aria-label="Изменить время подачи"
                  >
                    <EditPencilIcon color="#545873" />
                  </button>
                )}
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="datetime-local"
                  value={pickupDraft}
                  onChange={(e) => setPickupDraft(e.target.value)}
                  disabled={savingPickup}
                />
                <FapActionButton variant="primary" onClick={savePickup} disabled={savingPickup}>
                  Сохранить
                </FapActionButton>
                <FapActionButton
                  variant="secondary"
                  onClick={() => setEditingPickup(false)}
                  disabled={savingPickup}
                >
                  Отмена
                </FapActionButton>
              </span>
            )}
          </div>
          <div className={classes.metric}>
            <span className={classes.metricLabel}>Кол-во мест</span>
            <span
              className={`${classes.metricValue}${cap > 0 && fact > cap ? ` ${classes.metricOver}` : ""}`}
              title={
                cap > 0 && fact > cap
                  ? "Факт: поимённый список или «перевезено» — что больше. Факт выше вместимости — например, несколько ходок"
                  : "Факт: поимённый список или «перевезено» — что больше"
              }
            >
              {fact}
              {cap > 0 ? ` / ${cap}` : ""}
              {fact > placed && (
                <span className={classes.metricSub}> · поимённо {placed}</span>
              )}
            </span>
          </div>
          <div className={classes.metricDivider} />
          <div className={classes.metric}>
            <span className={classes.metricLabel}>Состав</span>
            <div className={classes.composition}>
              <span className={classes.compChipPassenger}>
                <span className={classes.dotPassenger} />
                Пассажиры · {passengers.length}
              </span>
              {showCrewToggle && (
                <span className={classes.compChipCrew}>
                  <span className={classes.dotCrew} />
                  Экипаж · {crew.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 3 — full route */}
        {(driver.addressFrom || driver.addressTo || linkedHotel) && (
          <div className={classes.headRow3}>
            <PinSvg size={15} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
            <div className={classes.routeAddr}>
              {linkedHotel && (
                <span
                  className={classes.hotelChip}
                  title="Гостиница проживания, к которой привязана поездка"
                >
                  {linkedHotel.name}
                </span>
              )}
              {driver.addressFrom && <strong>{driver.addressFrom}</strong>}
              {driver.addressFrom && driver.addressTo && (
                <span className={classes.routeArrow} style={{ color }}>
                  <RouteArrowSvg color={color} />
                </span>
              )}
              {driver.addressTo && <strong>{driver.addressTo}</strong>}
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className={classes.tabs}>
        <button
          type="button"
          className={`${classes.tab} ${tab === "people" ? classes.tabActive : ""}`}
          onClick={() => setTab("people")}
        >
          Состав <span className={classes.tabBadge}>{placed}</span>
        </button>
        <button
          type="button"
          className={`${classes.tab} ${tab === "route" ? classes.tabActive : ""}`}
          onClick={() => setTab("route")}
        >
          Маршрут
        </button>
      </div>

      {/* ── Content ── */}
      <div className={classes.content}>
        {tab === "people" && (
          <div className={classes.peoplePane}>
            <div className={classes.toolbar}>
              {showCrewToggle && (
                <PersonTypeToggle
                  value={personMode}
                  onChange={(v) => {
                    setPersonMode(v);
                    cancelAdd();
                    cancelEdit();
                    clearSel();
                    setPickerPreset(null);
                  }}
                />
              )}
              <div className={classes.searchWrap}>
                <SearchSvg />
                <input
                  placeholder="Поиск по ФИО, телефону…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <span style={{ flex: 1 }} />
              {canEdit && !isCompleted && !adding && (
                <button
                  type="button"
                  className={classes.primaryBtn}
                  style={{ background: addDisabled ? "#C9CEDC" : color }}
                  onClick={openAdd}
                  disabled={addDisabled}
                  title={
                    remainingSlots != null && remainingSlots <= 0
                      ? "Мест больше нет"
                      : personMode === "CREW" && availableCrew.length === 0
                      ? "Экипаж назначен полностью"
                      : ""
                  }
                >
                  <PlusSvg color="#fff" />
                  {personMode === "CREW"
                    ? "Добавить из экипажа"
                    : "Добавить пассажира"}
                </button>
              )}
              {canEdit && !isCompleted && personMode !== "CREW" && savedPassengers.length > 0 && (
                <button
                  type="button"
                  className={classes.primaryBtn}
                  style={{ background: "#fff", color, border: `1px solid ${color}` }}
                  onClick={() => {
                    setPickerPreset(null);
                    setCatalogOpen(true);
                  }}
                >
                  <PlusSvg color={color} /> Из реестра
                </button>
              )}
              {canEdit &&
                !isCompleted &&
                !addDisabled &&
                personMode !== "CREW" &&
                linkedHotel &&
                residentCandidates.length > 0 && (
                  <button
                    type="button"
                    className={classes.primaryBtn}
                    style={{ background: "#fff", color, border: `1px solid ${color}` }}
                    onClick={openResidentsPicker}
                    title={`Заселённые в «${linkedHotel.name}»`}
                  >
                    <PlusSvg color={color} /> Заселённые в «{shortName(linkedHotel.name)}» (
                    {residentCandidates.length})
                  </button>
                )}
              {canEdit && !isCompleted && personMode === "CREW" && availableCrew.length > 0 && (
                <button
                  type="button"
                  className={classes.primaryBtn}
                  style={{ background: "#fff", color, border: `1px solid ${color}` }}
                  onClick={() => {
                    setPickerPreset(null);
                    setCatalogOpen(true);
                  }}
                >
                  <PlusSvg color={color} /> Из экипажа
                </button>
              )}
            </div>

            {canEdit && selected.length > 0 && (
              <div className={classes.selectionBar}>
                <span className={classes.selectionCount}>Выбрано: {selected.length}</span>
                <button
                  type="button"
                  className={`${classes.bulkBtn} ${classes.bulkBtnDanger}`}
                  onClick={handleBulkDelete}
                  disabled={saving}
                >
                  <DeleteIcon /> {personMode === "CREW" ? "Снять выбранных" : "Удалить выбранных"}
                </button>
                <span className={classes.spacer} />
                <button type="button" className={classes.clearSelBtn} onClick={clearSel}>
                  Снять выбор
                </button>
              </div>
            )}

            <div className={classes.peopleTable}>
              <div className={classes.tableHead}>
                <span className={classes.colCheck}>
                  {canEdit && (
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  )}
                </span>
                <span />
                <span>ФИО</span>
                <span>Возрастная категория</span>
                <span>Телефон</span>
                <span className={classes.colActions}>Действия</span>
              </div>

              {adding && renderAddRow()}

              {visible.length === 0 && !adding && (
                <div className={classes.listEmpty}>
                  {search.trim()
                    ? "Ничего не найдено"
                    : personMode === "CREW"
                    ? "Экипаж в этой машине не назначен"
                    : "Пассажиры не добавлены"}
                </div>
              )}

              {visible.map(renderRow)}
            </div>
          </div>
        )}

        {tab === "route" && (
          <div className={classes.routePane}>
            {driver.addressFrom || driver.addressTo ? (
              <div className={classes.routeCard}>
                <div className={classes.routeCardTitle}>Маршрут водителя</div>
                <div
                  className={`${classes.timeline} ${
                    driver.addressFrom && driver.addressTo
                      ? ""
                      : classes.timelineSingle
                  }`}
                  style={{ color }}
                >
                  {driver.addressFrom && (
                    <div className={classes.timelineItem}>
                      <span
                        className={`${classes.timelineDot} ${classes.timelineDotFilled}`}
                      />
                      <div className={classes.timelineBody}>
                        <div className={classes.routePointLabel}>
                          Откуда — точка подачи
                        </div>
                        <div className={classes.routePointAddr}>
                          {driver.addressFrom}
                        </div>
                      </div>
                    </div>
                  )}
                  {driver.addressFrom && driver.addressTo && driver.pickupAt && (
                    <div className={classes.timelineMid}>
                      Подача {formatTime(driver.pickupAt)}
                    </div>
                  )}
                  {driver.addressTo && (
                    <div className={classes.timelineItem}>
                      <span className={classes.timelineDot} />
                      <div className={classes.timelineBody}>
                        <div className={classes.routePointLabel}>
                          Куда — точка назначения
                        </div>
                        <div className={classes.routePointAddr}>
                          {driver.addressTo}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <a
                  href={buildMapUrl(driver.addressFrom, driver.addressTo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.mapBtn}
                  style={{ color, borderColor: color, background: bg }}
                >
                  <PinSvg size={15} color={color} />
                  Открыть на карте
                </a>
              </div>
            ) : (
              <div className={classes.routeEmpty}>
                Маршрут не задан. Адреса задаются при создании водителя.
              </div>
            )}
          </div>
        )}
      </div>

      <CatalogPickerModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        savedPassengers={personMode === "CREW" ? crewPickerItems : savedPassengers}
        excludeKeys={personMode === "CREW" ? undefined : excludeKeys}
        maxSelectable={remainingSlots ?? undefined}
        loading={saving}
        onConfirm={personMode === "CREW" ? handleCrewCatalogConfirm : handleCatalogConfirm}
        title={personMode === "CREW" ? "Выбрать из экипажа заявки" : undefined}
        hotelFilter={
          personMode !== "CREW" && hotelsWithItemId.length > 0
            ? {
                options: hotelPicker.options,
                noPlacementCount: hotelPicker.noPlacementCount,
                residencyByPersonId,
                initialKey: pickerPreset?.initialKey,
                accent: color,
              }
            : null
        }
        initialSelectedIds={
          personMode === "CREW" ? null : pickerPreset?.initialSelectedIds
        }
      />
    </div>
  );
}
