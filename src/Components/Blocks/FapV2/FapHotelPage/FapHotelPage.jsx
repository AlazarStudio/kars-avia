import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { InputMask } from "@react-input/mask";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "./FapHotelPage.module.css";
import {
  ADD_PASSENGER_REQUEST_HOTEL_PERSON,
  ADD_PASSENGER_REQUEST_HOTEL_PEOPLE,
  UPDATE_PASSENGER_REQUEST_HOTEL_PERSON,
  REMOVE_PASSENGER_REQUEST_HOTEL_PERSON,
  RELOCATE_PASSENGER_REQUEST_HOTEL_PERSON,
  EVICT_PASSENGER_REQUEST_HOTEL_PERSON,
  SAVE_PASSENGER_REQUEST_HOTEL_REPORT,
  GET_FAP_HOTEL_TARIFFS,
  getCookie,
} from "../../../../../graphQL_requests";
import { calculateEffectiveCostDays } from "../../../../utils/effectiveCostDays";
import { formatDateTime, normalizeCategory, PERSON_CATEGORY_OPTIONS, accommodationChargeFactor } from "../fapConstants";
import CategoryBadge from "../CategoryBadge/CategoryBadge";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import Button from "../../../Standart/Button/Button";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";
import CatalogPickerModal, { personKey } from "../CatalogPickerModal/CatalogPickerModal";
import PersonTypeToggle from "../PersonTypeToggle/PersonTypeToggle";
import PersonBadge from "../PersonBadge/PersonBadge";
import HotelBedIcon from "../../../../shared/icons/HotelBedIcon";
import EditPencilIcon from "../../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import CloseIcon from "../../../../shared/icons/CloseIcon";
import CopyIcon from "../../../../shared/icons/CopyIcon";
import DownloadIcon from "../../../../shared/icons/DownloadIcon";
import EyeIcon from "../../../../shared/icons/EyeIcon";
import { downloadHotelReport } from "../reports/buildReportSheets";
import FapReportView from "../FapReportView/FapReportView";
import FapModeToggle from "../FapModeToggle/FapModeToggle";

const LIV = "#10B981";

const CheckSvg = ({ size = 14, color = "#fff", strokeWidth = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 12l5 5L20 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SwapSvg = ({ size = 14, color = "#545873", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M7 4 4 7l3 3M4 7h13M17 20l3-3-3-3M20 17H7"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PlusSvg = ({ size = 15, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
const PinSvg = ({ size = 12, color = "#9AA0B4", strokeWidth = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 1 1 18 0Z"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="3" stroke={color} strokeWidth={strokeWidth} />
  </svg>
);
const ClockSvg = ({ size = 14, color = "#545873", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
    <path d="M12 7v5l3 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const LinkSvg = ({ size = 14, color = "#0057C3", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const initials = (fullName) => {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n) => toNum(n).toLocaleString("ru-RU");

const newTariff = (draft = true) => ({
  id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  breakfast: 0,
  lunch: 0,
  dinner: 0,
  foodCost: 0,
  // Цена койко-места ЗА СУТКИ по видам размещения (1-местн/2-местн/...).
  placementPrices: [
    { places: 1, pricePerDay: 0 },
    { places: 2, pricePerDay: 0 },
  ],
  draft,
});

// Подпись вида размещения: 1 → «одноместное», 2 → «двухместное», ...
export const placementKindLabel = (n) => {
  const k = Number(n);
  if (!Number.isFinite(k) || k <= 0) return "";
  const names = { 1: "одноместное", 2: "двухместное", 3: "трёхместное", 4: "четырёхместное" };
  return names[k] || `${k}-местное`;
};

// Цена за сутки тарифа для вида размещения.
// Тариф гостиницы (source === "hotel") — единая цена на любой вид.
// null → цена не определена (нет номера / нет цены для вида).
export const resolveTariffPricePerDay = (tariff, places) => {
  if (!tariff) return null;
  if (tariff.source === "hotel") return toNum(tariff.pricePerDay);
  if (!Number.isFinite(Number(places)) || Number(places) <= 0) return null;
  const row = (tariff.placementPrices ?? []).find((p) => Number(p.places) === Number(places));
  return row ? toNum(row.pricePerDay) : null;
};

function getPersonDays(person, hotelIndex, plan) {
  const chess =
    (person?.accommodationChesses ?? []).find(
      (c) => c != null && Number(c.hotelIndex) === Number(hotelIndex)
    ) || (person?.accommodationChesses ?? [])[0];
  if (chess?.startAt && chess?.endAt) {
    return calculateEffectiveCostDays(chess.startAt, chess.endAt);
  }
  const planStart = plan?.plannedFromAt || plan?.plannedAt;
  const planEnd = plan?.plannedToAt;
  if (planStart && planEnd) return calculateEffectiveCostDays(planStart, planEnd);
  return 0;
}

const emptyPD = (person, hotelIndex, plan) => ({
  roomNumber: person?.roomNumber ?? "",
  daysCount: getPersonDays(person ?? {}, hotelIndex, plan),
  tariffId: null,
  breakfast: 0,
  lunch: 0,
  dinner: 0,
  foodCost: 0,
  accommodationCost: 0,
});

const emptyForm = {
  fullName: "",
  phone: "",
  roomNumber: "",
  personType: "PASSENGER",
  airlinePersonalId: "",
  personCategory: "ADULT",
};


// Поле номера в отчёте коммитит значение по blur/Enter, а не на каждый символ.
// Иначе каждый набранный символ менял бы группировку (reportGroups группирует
// гостей по roomNumber) → группа-контейнер пересоздаётся → input теряет фокус
// после одной цифры, плюс на каждый символ срабатывал автосейв.
function RoomNumberCell({ value, canEdit, onCommit }) {
  const [local, setLocal] = useState(value ?? "");
  useEffect(() => { setLocal(value ?? ""); }, [value]);
  const commit = () => {
    if ((local ?? "") !== (value ?? "")) onCommit(local);
  };
  return (
    <input
      type="text"
      className={classes.cellInput}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      readOnly={!canEdit}
      placeholder="№"
    />
  );
}

export default function FapHotelPage({
  request,
  hotelIndex,
  onRefetch,
  canEdit = true,
  showLinks = true,
  isExtHotel = false,
  showTariffs = true,
}) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();

  const hotel = request?.livingService?.hotels?.[hotelIndex];
  const plan = request?.livingService?.plan;

  // ── Shared state ──
  const [activeTab, setActiveTab] = useState("guests");

  // Guests tab state
  const [personMode, setPersonMode] = useState("PASSENGER");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [catalogOpen, setCatalogOpen] = useState(false);

  // Relocate / Evict
  const [relocateState, setRelocateState] = useState(null);
  const [relocateTarget, setRelocateTarget] = useState("");
  const [relocateReason, setRelocateReason] = useState("");
  const [evictState, setEvictState] = useState(null);

  // Report state
  const [tariffs, setTariffs] = useState([]);
  const [personData, setPersonData] = useState({});
  const [reportSearch, setReportSearch] = useState("");
  const [reportMode, setReportMode] = useState(() => {
    try { return localStorage.getItem("fapReportMode") === "view" ? "view" : "edit"; } catch { return "edit"; }
  });
  const effectiveReportMode = canEdit ? reportMode : "view"; // авиакомпания всегда «Просмотр»
  const setReportModePersist = (m) => {
    setReportMode(m);
    try { localStorage.setItem("fapReportMode", m); } catch { /* ignore */ }
  };

  const [saving, setSaving] = useState(false);

  // Refs хранят актуальное состояние для отложенного автосохранения —
  // дебаунс-таймер должен видеть последние значения, а не замороженные в замыкании.
  // `people` инициализируем пустым массивом: значение синхронизируется через useEffect ниже,
  // т.к. сама переменная `people` объявлена позже по коду.
  const tariffsRef = useRef(tariffs);
  const personDataRef = useRef(personData);
  const peopleRef = useRef([]);
  const saveTimerRef = useRef(null);
  const reconciledKeyRef = useRef(null);
  // persistReportRef нужен для cleanup'a на размонтирование — обычное замыкание
  // useEffect([], ...) видит persistReport времени монтирования, а мы хотим вызвать
  // АКТУАЛЬНЫЙ с up-to-date зависимостями (requestId, mutation client и т.д.).
  const persistReportRef = useRef(null);
  useEffect(() => { tariffsRef.current = tariffs; }, [tariffs]);
  useEffect(() => { personDataRef.current = personData; }, [personData]);
  useEffect(() => () => {
    // Флаш отложенного сейва при размонтировании — иначе изменения
    // в пределах debounce-окна теряются при навигации/обновлении.
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      persistReportRef.current?.();
    }
  }, []);

  // ── Mutations ──
  const [addPerson] = useMutation(ADD_PASSENGER_REQUEST_HOTEL_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [addPeople] = useMutation(ADD_PASSENGER_REQUEST_HOTEL_PEOPLE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [updatePerson] = useMutation(UPDATE_PASSENGER_REQUEST_HOTEL_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [removePerson] = useMutation(REMOVE_PASSENGER_REQUEST_HOTEL_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [relocatePerson] = useMutation(RELOCATE_PASSENGER_REQUEST_HOTEL_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [evictPerson] = useMutation(EVICT_PASSENGER_REQUEST_HOTEL_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [saveReport] = useMutation(SAVE_PASSENGER_REQUEST_HOTEL_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  // ── Derived ──
  const people = hotel?.people ?? [];
  useEffect(() => { peopleRef.current = people; }, [people]);

  const { data: hotelTariffData, loading: hotelTariffLoading } = useQuery(
    GET_FAP_HOTEL_TARIFFS,
    { variables: { id: hotel?.hotelId }, skip: !hotel?.hotelId }
  );

  const hotelTariffs = useMemo(() => {
    const h = hotelTariffData?.hotel;
    if (!h || !Array.isArray(h.roomKind)) return [];
    // Тарифы гостиницы берём только по ценам для авиакомпании (АК).
    // Питание входит в каждый тариф, поэтому если АК-цены питания не заполнены
    // (стоят «по запросу» или отсутствуют) — тарифов из гостиницы нет вообще.
    if (h.mealPriceForAirReq || !h.mealPriceForAir) return [];
    const b = toNum(h.mealPriceForAir.breakfast);
    const l = toNum(h.mealPriceForAir.lunch);
    const d = toNum(h.mealPriceForAir.dinner);
    return h.roomKind
      // Показываем тариф только с заполненной АК-ценой проживания
      // (не «по запросу» и больше нуля). Иначе тариф неполный — пропускаем.
      .filter((rk) => !rk.priceForAirReq && toNum(rk.priceForAirline) > 0)
      .map((rk) => ({
        id: rk.id,
        name: rk.name || "Без названия",
        source: "hotel",
        draft: false,
        breakfast: b,
        lunch: l,
        dinner: d,
        foodCost: b + l + d,
        pricePerDay: toNum(rk.priceForAirline),
      }));
  }, [hotelTariffData]);

  const hotelTariffsReady = !hotel?.hotelId || !hotelTariffLoading;

  const findTariff = useCallback(
    (id) => tariffs.find((t) => t.id === id) || hotelTariffs.find((t) => t.id === id) || null,
    [tariffs, hotelTariffs]
  );

  const reportGroups = useMemo(() => {
    const groups = [];
    const byRoom = new Map();
    people.forEach((person, i) => {
      const pd = personData[i] ?? emptyPD(person, hotelIndex, plan);
      const room = (pd.roomNumber ?? "").trim();
      const member = {
        person,
        index: i,
        pd,
        food: toNum(pd.breakfast) + toNum(pd.lunch) + toNum(pd.dinner),
      };
      if (!room) {
        groups.push({ key: `__noroom_${i}`, roomNumber: "", members: [member], noRoom: true });
      } else if (byRoom.has(room)) {
        byRoom.get(room).members.push(member);
      } else {
        const g = { key: room, roomNumber: room, members: [member], noRoom: false };
        byRoom.set(room, g);
        groups.push(g);
      }
    });
    // Только состав групп (без денег) — деньги считаются в groupTotals,
    // иначе циклическая зависимость: getEffectiveRow ← roomKindByIndex ← reportGroups.
    return groups.map((g) => {
      const withTariff = g.members.find((m) => findTariff(m.pd.tariffId));
      const tariffName = withTariff ? findTariff(withTariff.pd.tariffId)?.name ?? "" : "";
      return {
        ...g,
        memberIndices: g.members.map((m) => m.index),
        tariffName,
      };
    });
  }, [people, personData, hotelIndex, plan, findTariff]);

  // Вид размещения гостя = число гостей в его номере; null — без номера.
  const roomKindByIndex = useMemo(() => {
    const map = {};
    reportGroups.forEach((g) => {
      g.members.forEach((m) => {
        map[m.index] = g.noRoom ? null : g.members.length;
      });
    });
    return map;
  }, [reportGroups]);

  // Эффективные значения строки гостя. Для гостя с тарифом проживание —
  // ПРОИЗВОДНОЕ: цена за сутки (по виду размещения) × сутки. Без тарифа —
  // ручное значение pd.accommodationCost (как раньше).
  const getEffectiveRow = useCallback(
    (personIndex, pd) => {
      const tariff = findTariff(pd.tariffId);
      const places = roomKindByIndex[personIndex] ?? null;
      if (!tariff) {
        return {
          tariffName: "",
          placementKind: places ?? 0,
          pricePerDay: 0,
          accommodationCost: toNum(pd.accommodationCost),
          warning: null,
        };
      }
      // Старый отчёт: плоская сумма без цены за сутки — показываем как есть.
      if (tariff.legacyFlatAccommodation != null && (tariff.placementPrices ?? []).length === 0) {
        return {
          tariffName: tariff.name ?? "",
          placementKind: places ?? 0,
          pricePerDay: 0,
          accommodationCost: toNum(pd.accommodationCost),
          warning: null,
          isLegacyFlat: true,
        };
      }
      const price = resolveTariffPricePerDay(tariff, places);
      if (places == null) {
        return { tariffName: tariff.name ?? "", placementKind: 0, pricePerDay: 0, accommodationCost: 0, warning: "укажите номер" };
      }
      if (price == null) {
        return { tariffName: tariff.name ?? "", placementKind: places, pricePerDay: 0, accommodationCost: 0, warning: `нет цены (${placementKindLabel(places)})` };
      }
      // Возрастная скидка на проживание: инфант — бесплатно, ребёнок — 50%.
      // Питание НЕ трогаем. Применяется только к производной (тарифной) стоимости.
      const chargeFactor = accommodationChargeFactor(people[personIndex]?.personCategory);
      return {
        tariffName: tariff.name ?? "",
        placementKind: places,
        pricePerDay: price,
        accommodationCost: price * toNum(pd.daysCount) * chargeFactor,
        chargeFactor,
        warning: null,
      };
    },
    [findTariff, roomKindByIndex, people]
  );

  // Ref на getEffectiveRow: buildReportRows работает через refs (для флаш-сейва
  // при размонтировании), поэтому вызывает getEffectiveRowRef.current.
  const getEffectiveRowRef = useRef(getEffectiveRow);
  useEffect(() => { getEffectiveRowRef.current = getEffectiveRow; }, [getEffectiveRow]);

  // Денежные итоги по группам — отдельно от состава (иначе циклическая зависимость).
  const groupTotals = useMemo(() => {
    const totals = {};
    reportGroups.forEach((g) => {
      const accommodation = g.members.reduce(
        (s, m) => s + toNum(getEffectiveRow(m.index, m.pd).accommodationCost),
        0
      );
      const food = g.members.reduce((s, m) => s + m.food, 0);
      totals[g.key] = { accommodation, food, total: accommodation + food };
    });
    return totals;
  }, [reportGroups, getEffectiveRow]);

  const savedPassengers = request?.savedPassengers || [];
  // «уже добавлен» — по всей услуге проживания (любая гостиница), а не только текущая:
  // человек, размещённый в другой гостинице заявки, не должен предлагаться к повторному заселению.
  const excludeKeys = useMemo(
    () =>
      new Set(
        (request?.livingService?.hotels ?? [])
          .flatMap((h) => h?.people ?? [])
          .map((p) => personKey(p))
          .filter(Boolean)
      ),
    [request?.livingService?.hotels]
  );

  const handleCatalogConfirm = async (selected) => {
    try {
      setSaving(true);
      await addPeople({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          people: selected.map((p) => ({
            personId: p.personId,
            fullName: p.fullName,
            phone: p.phone || null,
            roomNumber: null,
            personType: "PASSENGER",
            personCategory: normalizeCategory(p.personCategory),
            airlinePersonalId: null,
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
  const totalCap = hotel?.peopleCount ?? 0;
  const placed = people.length;
  const isFull = totalCap > 0 && placed >= totalCap;
  const pct = totalCap > 0 ? Math.min(100, Math.round((placed / totalCap) * 100)) : 0;

  const passengersCount = people.filter((p) => p?.personType !== "CREW").length;
  const crewCount = placed - passengersCount;

  const matchesMode = (p) => (p?.personType === "CREW" ? "CREW" : "PASSENGER") === personMode;
  const indexed = useMemo(() => people.map((p, idx) => ({ ...p, _idx: idx })), [people]);
  const filteredPeople = useMemo(() => {
    const byMode = indexed.filter(matchesMode);
    if (!search.trim()) return byMode;
    const q = search.toLowerCase();
    return byMode.filter(
      (p) =>
        (p.fullName ?? "").toLowerCase().includes(q) ||
        (p.phone ?? "").toLowerCase().includes(q) ||
        (p.roomNumber ?? "").toLowerCase().includes(q)
    );
  }, [indexed, search, personMode]);

  const allSelected =
    filteredPeople.length > 0 && filteredPeople.every((p) => selected.includes(p._idx));
  const toggleAll = () =>
    setSelected((prev) => {
      const ids = filteredPeople.map((p) => p._idx);
      const all = ids.every((i) => prev.includes(i));
      if (all) return prev.filter((i) => !ids.includes(i));
      return [...new Set([...prev, ...ids])].sort((a, b) => a - b);
    });

  const crewRoster = request?.crewMembers || [];
  const assignedCrewIds = useMemo(
    () =>
      new Set(
        (request?.livingService?.hotels ?? [])
          .flatMap((h) => h?.people || [])
          .filter((p) => p?.personType === "CREW" && p?.airlinePersonalId)
          .map((p) => p.airlinePersonalId)
      ),
    [request?.livingService?.hotels]
  );
  const availableCrew = crewRoster.filter((m) => !assignedCrewIds.has(m.airlinePersonalId));

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
          hotelIndex: Number(hotelIndex),
          people: selected.map((p) => ({
            fullName: p.fullName,
            phone: p.phone || null,
            roomNumber: null,
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

  const otherHotels = useMemo(
    () =>
      (request?.livingService?.hotels ?? [])
        .map((h, idx) => ({ hotel: h, originalIndex: idx }))
        .filter(({ originalIndex }) => originalIndex !== Number(hotelIndex)),
    [request?.livingService?.hotels, hotelIndex]
  );

  const hasFreeSlots = totalCap === 0 || placed < totalCap;
  const hasCrewAvailable = personMode !== "CREW" || availableCrew.length > 0;
  const canAdd = canEdit && hasFreeSlots && hasCrewAvailable;

  // ── Report initialization ──
  useEffect(() => {
    if (!request || !hotel) return;
    if (!hotelTariffsReady) return;
    const reconcileKey = `${request?.id}:${hotelIndex}`;
    if (reconciledKeyRef.current === reconcileKey) return;
    reconciledKeyRef.current = reconcileKey;
    const saved = (request.hotelReports ?? []).find((r) => r.hotelIndex === Number(hotelIndex));
    const savedRows = saved?.reportRows ?? [];

    const priceKey = (r) =>
      [toNum(r.breakfast), toNum(r.lunch), toNum(r.dinner), toNum(r.foodCost), toNum(r.accommodationCost ?? r.legacyFlatAccommodation)].join("|");

    const matchHotelTariff = (row) => {
      const rowName = [row.roomCategory, row.roomKind].filter(Boolean).join(" / ");
      return hotelTariffs.find((ht) => ht.name === rowName) || null;
    };

    if (savedRows.length > 0) {
      // 1) Новый формат: строки с tariffName → тариф собирается по имени,
      //    цены по видам — из пар (placementKind, pricePerDay).
      const byName = new Map();
      // Тарифы гостиницы не дублируем.
      const isHotelName = (nm) => hotelTariffs.some((ht) => ht.name === nm);
      const ensureShell = (nm, r) => {
        if (!byName.has(nm)) {
          byName.set(nm, {
            ...newTariff(false),
            name: nm,
            breakfast: toNum(r.breakfast),
            lunch: toNum(r.lunch),
            dinner: toNum(r.dinner),
            foodCost: toNum(r.foodCost),
            placementPrices: [],
          });
        }
        return byName.get(nm);
      };
      // 1a) Теневые строки (пустой fullName) — единственный авторитетный источник
      //     таблицы цен по видам и meal-полей тарифа.
      savedRows.forEach((r) => {
        const nm = (r.tariffName ?? "").trim();
        if (!nm || (r.fullName ?? "").trim() || isHotelName(nm)) return;
        const t = ensureShell(nm, r);
        const places = Number(r.placementKind) || 0;
        if (places > 0 && !t.placementPrices.some((p) => p.places === places)) {
          t.placementPrices.push({ places, pricePerDay: toNum(r.pricePerDay) });
        }
      });
      // 1b) Гостевые строки — только гарантируют наличие оболочки тарифа,
      //     цены по видам из них НЕ берём (иначе деградировавший гость даёт фантомный вид).
      savedRows.forEach((r) => {
        const nm = (r.tariffName ?? "").trim();
        if (!nm || !(r.fullName ?? "").trim() || isHotelName(nm)) return;
        ensureShell(nm, r);
      });
      byName.forEach((t) => {
        if (t.placementPrices.length === 0) {
          t.placementPrices = [{ places: 1, pricePerDay: 0 }, { places: 2, pricePerDay: 0 }];
        } else {
          t.placementPrices.sort((a, b) => a.places - b.places);
        }
      });

      // 2) Legacy-строки (без tariffName) — старая инференция по ценовому ключу.
      const tariffByKey = new Map();
      savedRows.forEach((r) => {
        if ((r.tariffName ?? "").trim()) return; // уже обработана выше
        // Тариф восстанавливается только из строк с непустым названием категории.
        // Иначе строки гостей с ценами, но без привязки тарифа, создавали бы
        // «безымянные» тарифы, которые невозможно удалить (X срабатывает,
        // но при следующем входе тариф возвращался инференцией).
        const hasName = (r.roomCategory || "").trim() || (r.roomKind || "").trim();
        if (!hasName) return;
        if (matchHotelTariff(r)) return;
        const legacyName = [r.roomCategory, r.roomKind].filter(Boolean).join(" / ") || "";
        if (byName.has(legacyName)) return;

        const k = priceKey(r);
        if (!tariffByKey.has(k)) {
          tariffByKey.set(k, {
            ...newTariff(false),
            name: legacyName,
            breakfast: toNum(r.breakfast),
            lunch: toNum(r.lunch),
            dinner: toNum(r.dinner),
            foodCost: toNum(r.foodCost),
            // legacy: плоская сумма без цены за сутки — вид не известен
            placementPrices: [],
            legacyFlatAccommodation: toNum(r.accommodationCost),
          });
        }
      });
      const restored = [...byName.values(), ...tariffByKey.values()];
      setTariffs(restored);

      const data = {};
      people.forEach((p, i) => {
        data[i] = emptyPD(p, hotelIndex, plan);
      });
      // Матчим строки отчёта к гостям ТОЛЬКО по ФИО + порядок (consumed-сет).
      // Раньше в условие входил roomNumber, но это давало баг: номер в строке отчёта
      // и у гостя — это два разных поля (одно из вкладки «Гости», другое из «Отчёта»).
      // Когда диспетчер вводил номер в «Отчёте», people[i].roomNumber оставался пустой,
      // а row.roomNumber становился «123» → матч проваливался → тариф «слетал».
      // Сейчас ходим по строкам по порядку (buildReportRows пишет их в порядке people),
      // расходуя уже подобранные индексы — дубликаты ФИО тоже корректно матчатся.
      const consumed = new Set();
      savedRows.forEach((row) => {
        // Пропускаем теневые строки тарифов (без ФИО) — они не привязаны к гостю.
        if (!(row.fullName ?? "").trim()) return;
        const idx = people.findIndex(
          (p, i) =>
            !consumed.has(i) &&
            (p.fullName ?? "").trim() === (row.fullName ?? "").trim()
        );
        if (idx < 0) return;
        consumed.add(idx);
        const k = priceKey(row);
        const nm = (row.tariffName ?? "").trim();
        const t =
          (nm && (hotelTariffs.find((ht) => ht.name === nm) || restored.find((tt) => tt.name === nm))) ||
          matchHotelTariff(row) ||
          restored.find((tt) => priceKey(tt) === k);
        data[idx] = {
          // Номер в отчёте развязан с гостем (см. коммент выше). Но если в отчёте
          // он пуст — дозаполняем текущей комнатой гостя из вкладки «Гости».
          roomNumber: (row.roomNumber ?? "").toString().trim() || (people[idx]?.roomNumber ?? ""),
          daysCount: toNum(row.daysCount),
          tariffId: t?.id ?? null,
          breakfast: toNum(row.breakfast),
          lunch: toNum(row.lunch),
          dinner: toNum(row.dinner),
          foodCost: toNum(row.foodCost),
          accommodationCost: toNum(row.accommodationCost),
        };
      });
      setPersonData(data);
    } else {
      const data = {};
      people.forEach((p, i) => {
        data[i] = emptyPD(p, hotelIndex, plan);
      });
      setPersonData(data);
      setTariffs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id, hotelIndex, hotelTariffsReady]);

  // ── Persistence helpers ──
  // Сериализация текущих тарифов + personData в строки отчёта.
  // Бэк не хранит тарифы отдельно — восстанавливает их при загрузке из
  // уникальных ценовых ключей строк. Непривязанные тарифы добавляем как
  // «теневые» строки (пустой ФИО), иначе они терялись бы при следующем входе.
  const buildReportRows = useCallback(() => {
    const currentTariffs = tariffsRef.current;
    const currentPersonData = personDataRef.current;
    const currentPeople = peopleRef.current;
    // Теневые строки: одна на пару тариф × вид размещения для КАЖДОГО
    // сохранённого тарифа (даже привязанного к гостям). Гостевая строка несёт
    // лишь ОДИН вид размещения гостя — без ghost-строк цены остальных видов
    // терялись бы при следующем входе. Пустой fullName → restore/Excel их
    // пропускают, а byName-дедуп не создаёт дублей с гостевыми строками.
    const ghostRows = currentTariffs
      .filter((t) => !t.draft)
      .flatMap((t) =>
        (t.placementPrices ?? []).map((pp) => ({
          fullName: "",
          roomNumber: "",
          roomCategory: t.name || "",
          roomKind: "",
          daysCount: 0,
          breakfast: toNum(t.breakfast),
          lunch: toNum(t.lunch),
          dinner: toNum(t.dinner),
          foodCost: toNum(t.breakfast) + toNum(t.lunch) + toNum(t.dinner),
          accommodationCost: 0,
          tariffName: t.name || "",
          pricePerDay: toNum(pp.pricePerDay),
          placementKind: Number(pp.places) || 0,
        }))
      );
    const personRows = currentPeople.map((person, i) => {
      const pd = currentPersonData[i] ?? emptyPD(person, hotelIndex, plan);
      const eff = getEffectiveRowRef.current(i, pd);
      return {
        fullName: person.fullName ?? "",
        roomNumber: pd.roomNumber ?? "",
        roomCategory: eff.tariffName,   // legacy-совместимость (ФАП v1, старый Excel)
        roomKind: "",
        daysCount: toNum(pd.daysCount),
        breakfast: toNum(pd.breakfast),
        lunch: toNum(pd.lunch),
        dinner: toNum(pd.dinner),
        foodCost: toNum(pd.breakfast) + toNum(pd.lunch) + toNum(pd.dinner),
        accommodationCost: toNum(eff.accommodationCost),
        // Легаси-flat строку держим в legacy-полосе восстановления (roomCategory),
        // иначе на следующем restore она попадёт в byName-путь (без legacyFlatAccommodation)
        // и проживание пересчитается в 0 — потеря суммы.
        tariffName: eff.isLegacyFlat ? "" : eff.tariffName,
        pricePerDay: toNum(eff.pricePerDay),
        placementKind: Number(eff.placementKind) || 0,
      };
    });
    return [...personRows, ...ghostRows];
  }, [hotelIndex, plan]);

  const persistReport = useCallback(async () => {
    if (!request?.id) return;
    try {
      setSaving(true);
      await saveReport({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          reportRows: buildReportRows(),
        },
      });
      onRefetch?.();
    } catch (e) {
      notifyError("Ошибка при сохранении тарифа");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [request?.id, hotelIndex, buildReportRows, saveReport, notifyError, onRefetch]);

  // Единый дебаунс для всех изменений (ввод и клики).
  // Раньше клики стреляли flushSave немедленно — это создавало race condition:
  // несколько последовательных кликов = параллельные мутации, и более ранняя
  // (с устаревшим snapshot'ом) могла прийти на бэк позже и затереть результаты
  // более поздних. С дебаунсом серия быстрых кликов схлопывается в один сейв
  // с финальным состоянием — буква mutation отправляется одна, и она всегда
  // содержит все накопленные изменения (personDataRef обновляется синхронно).
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      persistReport();
    }, 300);
  }, [persistReport]);

  // Синк-ref для cleanup на unmount.
  useEffect(() => { persistReportRef.current = persistReport; }, [persistReport]);

  // Гарантируем, что personData содержит запись для каждого фактического гостя.
  // Init useEffect выше срабатывает только при смене request.id/hotelIndex.
  // Когда диспетчер добавляет гостя через вкладку «Гости», request.id не меняется,
  // но people растёт — раньше «Применить всем» пропускал новых гостей, т.к.
  // их индексов не было в personData. Теперь — добавляем.
  useEffect(() => {
    setPersonData((prev) => {
      const next = { ...prev };
      let changed = false;
      people.forEach((person, i) => {
        if (!next[i]) {
          next[i] = emptyPD(person, hotelIndex, plan);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people.length]);

  // ── Tariff handlers ──
  const addTariff = useCallback(() => setTariffs((prev) => [...prev, newTariff()]), []);
  const removeTariff = useCallback(
    async (tariffId) => {
      const newTariffs = tariffs.filter((t) => t.id !== tariffId);
      const newPersonData = { ...personData };
      Object.keys(newPersonData).forEach((k) => {
        if (newPersonData[k].tariffId === tariffId)
          newPersonData[k] = {
            ...newPersonData[k],
            tariffId: null,
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            foodCost: 0,
            accommodationCost: 0,
          };
      });
      // Обновляем refs синхронно, чтобы buildReportRows увидел свежее состояние
      // (сериализация проживания теперь производная — через getEffectiveRow).
      tariffsRef.current = newTariffs;
      personDataRef.current = newPersonData;
      setTariffs(newTariffs);
      setPersonData(newPersonData);

      if (!request?.id) return;
      try {
        setSaving(true);
        await saveReport({
          variables: {
            requestId: request.id,
            hotelIndex: Number(hotelIndex),
            reportRows: buildReportRows(),
          },
        });
        onRefetch?.();
      } catch (e) {
        notifyError("Ошибка при удалении тарифа");
        console.error(e);
      } finally {
        setSaving(false);
      }
    },
    [tariffs, personData, hotelIndex, request?.id, saveReport, buildReportRows, notifyError]
  );
  const updateTariff = useCallback((tariffId, field, value) => {
    let updated = null;
    const nextTariffs = tariffsRef.current.map((t) => {
      if (t.id !== tariffId) return t;
      const n = { ...t, [field]: value };
      if (field === "breakfast" || field === "lunch" || field === "dinner") {
        n.foodCost = toNum(n.breakfast) + toNum(n.lunch) + toNum(n.dinner);
      }
      updated = n;
      return n;
    });
    tariffsRef.current = nextTariffs;
    setTariffs(nextTariffs);

    // Цены питания распространяем на привязанных гостей, чтобы отчёт оставался
    // синхронным с тарифом. Проживание НЕ пропагируем — оно теперь производное
    // (getEffectiveRow: цена за сутки × сутки по виду размещения). Название не
    // трогаем — оно подтягивается в отчёт через tariffId.
    if (updated && field !== "name") {
      const prevPD = personDataRef.current;
      const nextPD = { ...prevPD };
      let changed = false;
      Object.keys(nextPD).forEach((k) => {
        if (nextPD[k]?.tariffId === tariffId) {
          nextPD[k] = {
            ...nextPD[k],
            breakfast: toNum(updated.breakfast),
            lunch: toNum(updated.lunch),
            dinner: toNum(updated.dinner),
            foodCost: toNum(updated.foodCost),
          };
          changed = true;
        }
      });
      if (changed) {
        personDataRef.current = nextPD;
        setPersonData(nextPD);
      }
    }

    // Автосохранение только для уже сохранённых тарифов. Черновики сохраняются явной кнопкой.
    if (updated && !updated.draft) scheduleSave();
  }, [scheduleSave]);
  const cancelTariff = useCallback((tariffId) => {
    setTariffs((prev) => prev.filter((t) => t.id !== tariffId));
  }, []);
  const saveTariff = useCallback(
    async (tariffId) => {
      const t = tariffs.find((x) => x.id === tariffId);
      if (!t) return;
      if (!t.name.trim()) {
        notifyError("Укажите название тарифа");
        return;
      }

      // Локальный коммит: убираем draft.
      setTariffs((prev) => prev.map((x) => (x.id === tariffId ? { ...x, draft: false } : x)));

      // Тарифы хранятся только через инференцию из строк отчёта, поэтому
      // сразу сохраняем отчёт с теневой строкой для нового тарифа —
      // иначе он потеряется при следующем входе на страницу.
      if (!request?.id) {
        success("Тариф сохранён");
        return;
      }
      try {
        setSaving(true);
        const newTariffs = tariffs.map((x) =>
          x.id === tariffId ? { ...x, draft: false } : x
        );
        // Синхронно в ref — buildReportRows сериализует свежие тарифы
        // (теневая строка нового тарифа = пара тариф × вид размещения).
        tariffsRef.current = newTariffs;
        await saveReport({
          variables: {
            requestId: request.id,
            hotelIndex: Number(hotelIndex),
            reportRows: buildReportRows(),
          },
        });
        onRefetch?.();
        success("Тариф сохранён");
      } catch (e) {
        notifyError("Ошибка при сохранении тарифа");
        console.error(e);
      } finally {
        setSaving(false);
      }
    },
    [tariffs, hotelIndex, request?.id, saveReport, buildReportRows, success, notifyError]
  );

  // ── Цены по видам размещения ──
  const updateTariffPlacementPrice = useCallback((tariffId, places, value) => {
    setTariffs((prev) =>
      prev.map((t) =>
        t.id !== tariffId
          ? t
          : {
              ...t,
              placementPrices: (t.placementPrices ?? []).map((p) =>
                Number(p.places) === Number(places) ? { ...p, pricePerDay: value } : p
              ),
            }
      )
    );
    scheduleSave();
  }, [scheduleSave]);

  const addTariffPlacement = useCallback((tariffId) => {
    setTariffs((prev) =>
      prev.map((t) => {
        if (t.id !== tariffId) return t;
        const used = new Set((t.placementPrices ?? []).map((p) => Number(p.places)));
        let next = 1;
        while (used.has(next)) next += 1;
        return {
          ...t,
          placementPrices: [...(t.placementPrices ?? []), { places: next, pricePerDay: 0 }]
            .sort((a, b) => a.places - b.places),
        };
      })
    );
    scheduleSave();
  }, [scheduleSave]);

  const removeTariffPlacement = useCallback((tariffId, places) => {
    setTariffs((prev) =>
      prev.map((t) =>
        t.id !== tariffId
          ? t
          : {
              ...t,
              placementPrices: (t.placementPrices ?? []).filter(
                (p) => Number(p.places) !== Number(places)
              ),
            }
      )
    );
    scheduleSave();
  }, [scheduleSave]);

  const applyTariffToAll = useCallback(
    (tariffId) => {
      const t = findTariff(tariffId);
      if (!t) return;
      // Считаем новое состояние явно и сразу пишем в state и в ref —
      // scheduleSave ниже читает personDataRef и должен видеть свежие данные.
      const next = { ...personDataRef.current };
      people.forEach((person, i) => {
        const base = next[i] ?? emptyPD(person, hotelIndex, plan);
        next[i] = {
          ...base,
          tariffId,
          breakfast: toNum(t.breakfast),
          lunch: toNum(t.lunch),
          dinner: toNum(t.dinner),
          foodCost: toNum(t.foodCost),
          // Проживание не копируем — оно производное (getEffectiveRow).
        };
      });
      personDataRef.current = next;
      setPersonData(next);
      scheduleSave();
    },
    [findTariff, scheduleSave, people, hotelIndex, plan]
  );
  const applyTariffToPerson = useCallback(
    (personIndex, tariffId) => {
      const t = findTariff(tariffId);
      const prev = personDataRef.current;
      const base =
        prev[personIndex] ?? emptyPD(people[personIndex], hotelIndex, plan);
      const next = {
        ...prev,
        [personIndex]: {
          ...base,
          tariffId: tariffId || null,
          ...(t
            ? {
                // Проживание не копируем — оно производное (getEffectiveRow:
                // цена за сутки по виду размещения × сутки).
                breakfast: toNum(t.breakfast),
                lunch: toNum(t.lunch),
                dinner: toNum(t.dinner),
                foodCost: toNum(t.foodCost),
              }
            : {
                // Снятие привязки → обнуляем цены, иначе остаются от прошлого тарифа.
                breakfast: 0,
                lunch: 0,
                dinner: 0,
                foodCost: 0,
                accommodationCost: 0,
              }),
        },
      };
      personDataRef.current = next;
      setPersonData(next);
      scheduleSave();
    },
    [findTariff, scheduleSave, people, hotelIndex, plan]
  );
  // Жёсткая привязка номера комнаты: person.roomNumber — единственный источник.
  // Правка во вкладке «Гости» (мутация → refetch → people) сразу отражается в
  // «Отчёте»: синхронизируем pd.roomNumber с person.roomNumber на каждое
  // изменение people (в т.ч. очистку номера).
  useEffect(() => {
    setPersonData((prev) => {
      let changed = false;
      const next = { ...prev };
      people.forEach((person, i) => {
        const rn = person.roomNumber ?? "";
        if (next[i] && (next[i].roomNumber ?? "") !== rn) {
          next[i] = { ...next[i], roomNumber: rn };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people]);

  // Правка номера в «Отчёте» пишет person.roomNumber той же мутацией, что «Гости»
  // → refetch → синхронизация выше отражает номер в обеих вкладках.
  const commitPersonRoom = useCallback(async (personIndex, value) => {
    const person = people[personIndex];
    if (!person || !request?.id) return;
    const roomNumber = (value ?? "").trim() || null;
    if ((person.roomNumber ?? "") === (roomNumber ?? "")) return;
    try {
      await updatePerson({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          personIndex,
          person: {
            fullName: person.fullName ?? "",
            phone: person.phone ?? null,
            roomNumber,
            personType: person.personType === "CREW" ? "CREW" : "PASSENGER",
            airlinePersonalId: person.airlinePersonalId ?? null,
            personCategory:
              person.personType === "CREW" ? "ADULT" : normalizeCategory(person.personCategory),
          },
        },
      });
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Не удалось сохранить номер");
    }
  }, [people, request?.id, hotelIndex, updatePerson, onRefetch, notifyError]);

  const updatePersonReport = useCallback((personIndex, field, value) => {
    const prev = personDataRef.current;
    const cur =
      prev[personIndex] ?? emptyPD(people[personIndex], hotelIndex, plan);
    const updated = { ...cur, [field]: value };
    if (field === "breakfast" || field === "lunch" || field === "dinner") {
      updated.foodCost =
        toNum(updated.breakfast) + toNum(updated.lunch) + toNum(updated.dinner);
    }
    const nextAll = { ...prev, [personIndex]: updated };
    personDataRef.current = nextAll;
    setPersonData(nextAll);
    scheduleSave();
  }, [scheduleSave, people, hotelIndex, plan]);

  const reportRows = useMemo(
    () =>
      people.map((person, i) => {
        const pd = personData[i] ?? emptyPD(person, hotelIndex, plan);
        const tariff = findTariff(pd.tariffId);
        return {
          personIndex: i,
          fullName: person.fullName ?? "",
          personType: person.personType === "CREW" ? "CREW" : "PASSENGER",
          personCategory: normalizeCategory(person.personCategory),
          roomNumber: pd.roomNumber,
          roomCategory: tariff?.name ?? "",
          roomKind: "",
          daysCount: toNum(pd.daysCount),
          breakfast: toNum(pd.breakfast),
          lunch: toNum(pd.lunch),
          dinner: toNum(pd.dinner),
          foodCost: toNum(pd.breakfast) + toNum(pd.lunch) + toNum(pd.dinner),
          accommodationCost: toNum(pd.accommodationCost),
        };
      }),
    [people, personData, findTariff, hotelIndex, plan]
  );

  const grandTotal = useMemo(
    () => Object.values(groupTotals).reduce((s, gt) => s + toNum(gt.total), 0),
    [groupTotals]
  );

  // Эффективные плановые сутки — та же величина, что и метрика «Суток» в шапке.
  const reportNights = useMemo(
    () =>
      plan?.plannedFromAt && plan?.plannedToAt
        ? calculateEffectiveCostDays(plan.plannedFromAt, plan.plannedToAt)
        : 0,
    [plan]
  );

  // Сводка для read-only отчёта (переиспользует те же расчёты, без новых примитивов).
  const reportSummary = useMemo(() => {
    let living = 0, meal = 0, discounts = 0, count = 0;
    reportGroups.forEach((g) => {
      g.members.forEach((m) => {
        const eff = getEffectiveRow(m.index, m.pd);
        living += toNum(eff.accommodationCost);
        meal += toNum(m.food);
        const base = toNum(eff.pricePerDay) * toNum(m.pd.daysCount);
        if (base > 0) discounts += base * (1 - (eff.chargeFactor ?? 1));
        count += 1;
      });
    });
    return { grand: grandTotal, living, meal, discounts, peopleCount: count, nights: reportNights };
  }, [reportGroups, getEffectiveRow, grandTotal, reportNights]);

  // View-model для FapReportView.
  const reportViewGroups = useMemo(
    () =>
      reportGroups.map((g) => ({
        key: g.key,
        room: g.noRoom ? null : g.roomNumber,
        kind: g.noRoom ? "" : placementKindLabel(g.members.length),
        tariff: g.tariffName || "",
        total: groupTotals[g.key]?.total ?? 0,
        people: g.members.map((m) => {
          const eff = getEffectiveRow(m.index, m.pd);
          return {
            name: m.person.fullName || "—",
            category: normalizeCategory(m.person.personCategory),
            meal: toNum(m.food),
            living: eff.warning ? null : toNum(eff.accommodationCost),
            rate: toNum(eff.pricePerDay),
            nights: toNum(m.pd.daysCount),
            factor: eff.chargeFactor ?? 1,
            warning: eff.warning || null,
          };
        }),
      })),
    [reportGroups, groupTotals, getEffectiveRow]
  );

  const visibleGroups = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    if (!q) return reportGroups;
    return reportGroups
      .map((g) => ({ ...g, members: g.members.filter((m) => (m.person.fullName || "").toLowerCase().includes(q)) }))
      .filter((g) => g.members.length > 0);
  }, [reportGroups, reportSearch]);

  const boundCount = useMemo(
    () => reportRows.filter((r) => r.roomCategory).length,
    [reportRows]
  );

  // ── Guest CRUD handlers ──
  const copyLink = (url) => {
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => success("Ссылка скопирована"))
      .catch(() => notifyError("Не удалось скопировать ссылку"));
  };

  const openAdd = () => {
    setAdding(true);
    setAddForm({ ...emptyForm, personType: personMode, airlinePersonalId: "" });
    setEditing(null);
  };
  const cancelAdd = () => {
    setAdding(false);
    setAddForm(emptyForm);
  };
  const handleAdd = async () => {
    if (addForm.personType === "CREW" && !addForm.airlinePersonalId) {
      notifyError("Выберите сотрудника экипажа");
      return;
    }
    if (!addForm.fullName.trim()) {
      notifyError(addForm.personType === "CREW" ? "Укажите ФИО члена экипажа" : "Укажите ФИО пассажира");
      return;
    }
    try {
      setSaving(true);
      await addPerson({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          person: {
            fullName: addForm.fullName.trim(),
            phone: addForm.phone.trim() || null,
            roomNumber: addForm.roomNumber.trim() || null,
            personType: addForm.personType === "CREW" ? "CREW" : "PASSENGER",
            airlinePersonalId:
              addForm.personType === "CREW" ? addForm.airlinePersonalId || null : null,
            personCategory: addForm.personType === "CREW" ? "ADULT" : addForm.personCategory,
          },
        },
      });
      success(addForm.personType === "CREW" ? "Член экипажа добавлен" : "Пассажир добавлен");
      cancelAdd();
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при добавлении");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (p) => {
    setEditing(p._idx);
    setEditForm({
      fullName: p.fullName || "",
      phone: p.phone || "",
      roomNumber: p.roomNumber || "",
      personType: p.personType === "CREW" ? "CREW" : "PASSENGER",
      airlinePersonalId: p.airlinePersonalId || "",
      personCategory: normalizeCategory(p.personCategory),
    });
    setAdding(false);
  };
  const cancelEdit = () => {
    setEditing(null);
    setEditForm(emptyForm);
  };
  const handleSaveEdit = async () => {
    if (editing == null) return;
    if (!editForm.fullName.trim()) {
      notifyError(editForm.personType === "CREW" ? "Укажите ФИО члена экипажа" : "Укажите ФИО пассажира");
      return;
    }
    try {
      setSaving(true);
      await updatePerson({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          personIndex: editing,
          person: {
            fullName: editForm.fullName.trim(),
            phone: editForm.phone.trim() || null,
            roomNumber: editForm.roomNumber.trim() || null,
            personType: editForm.personType === "CREW" ? "CREW" : "PASSENGER",
            airlinePersonalId:
              editForm.personType === "CREW" ? editForm.airlinePersonalId || null : null,
            personCategory: editForm.personType === "CREW" ? "ADULT" : editForm.personCategory,
          },
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

  const handleDelete = async (personIndex) => {
    const isCrewPerson = people[personIndex]?.personType === "CREW";
    const ok = await confirm(isCrewPerson ? "Удалить запись о члене экипажа?" : "Удалить запись о пассажире?");
    if (!ok) return;
    try {
      setSaving(true);
      await removePerson({
        variables: { requestId: request.id, hotelIndex: Number(hotelIndex), personIndex },
      });
      success("Запись удалена");
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при удалении");
    } finally {
      setSaving(false);
    }
  };

  const toggleSel = (idx) => {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
  };
  const clearSel = () => setSelected([]);

  const openRelocate = (indices) => {
    setRelocateState({ indices });
    setRelocateTarget("");
    setRelocateReason("");
  };
  const closeRelocate = () => {
    setRelocateState(null);
    setRelocateTarget("");
    setRelocateReason("");
  };
  const handleRelocate = async () => {
    if (!relocateState) return;
    if (relocateTarget === "" || relocateTarget == null) {
      notifyError("Выберите гостиницу");
      return;
    }
    if (!relocateReason.trim()) {
      notifyError("Укажите причину переселения");
      return;
    }
    // Проверка вместимости целевого отеля
    const targetIdx = Number(relocateTarget);
    const allHotels = request?.livingService?.hotels || [];
    const targetHotel = allHotels[targetIdx];
    if (targetHotel) {
      const capacity = Number(targetHotel.peopleCount) || 0;
      const placed = (targetHotel.people || []).length;
      const freeSlots = Math.max(0, capacity - placed);
      if (relocateState.indices.length > freeSlots) {
        notifyError(
          `В гостинице «${targetHotel.name || "—"}» свободно ${freeSlots} мест, а переселяется ${relocateState.indices.length}`
        );
        return;
      }
    }
    try {
      setSaving(true);
      const sorted = [...relocateState.indices].sort((a, b) => b - a);
      for (const idx of sorted) {
        await relocatePerson({
          variables: {
            requestId: request.id,
            fromHotelIndex: Number(hotelIndex),
            toHotelIndex: targetIdx,
            personIndex: idx,
            reason: relocateReason.trim(),
          },
        });
      }
      success(
        relocateState.indices.length > 1
          ? `Переселено: ${relocateState.indices.length}`
          : people[relocateState.indices[0]]?.personType === "CREW"
          ? "Член экипажа переселён"
          : "Пассажир переселён"
      );
      setSelected([]);
      closeRelocate();
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при переселении");
    } finally {
      setSaving(false);
    }
  };

  const openEvict = (indices) => setEvictState({ indices });
  const handleEvict = async (reason) => {
    if (!evictState) return;
    try {
      setSaving(true);
      const sorted = [...evictState.indices].sort((a, b) => b - a);
      for (const idx of sorted) {
        await evictPerson({
          variables: {
            requestId: request.id,
            hotelIndex: Number(hotelIndex),
            personIndex: idx,
            reason,
          },
        });
      }
      success(
        evictState.indices.length > 1
          ? `Выселено: ${evictState.indices.length}`
          : people[evictState.indices[0]]?.personType === "CREW"
          ? "Член экипажа выселен"
          : "Пассажир выселен"
      );
      setSelected([]);
      setEvictState(null);
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при выселении");
    } finally {
      setSaving(false);
    }
  };

  // ── Report save / export ──
  const handleSaveReport = async () => {
    if (!request?.id) return;
    setSaving(true);
    try {
      await saveReport({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          reportRows: buildReportRows(),
        },
      });
      onRefetch?.();
      success("Отчёт сохранён");
    } catch (e) {
      notifyError("Ошибка при сохранении");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      // Флаш отложенного автосейва — только если правки разрешены и сейв реально запланирован.
      if (canEdit && saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        await persistReport();
      }
      await downloadHotelReport(request, hotelIndex, { rows: buildReportRows() });
    } catch (e) {
      notifyError("Ошибка экспорта");
      console.error(e);
    }
  };

  // ── Guard ──
  if (!hotel) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>Гостиница не найдена</div>
      </div>
    );
  }

  const canMutateGuests = canEdit;
  const showCrewToggle = request?.includesCrew;

  // ── Render helpers ──
  const renderGuestRow = (p) => {
    const isEditing = editing === p._idx;
    const isSelected = selected.includes(p._idx);
    if (isEditing) {
      return (
        <div key={p._idx} className={classes.editRow}>
          {canMutateGuests && <div className={classes.colCheck} />}
          <div className={classes.cellName}>
            <span
              className={classes.avatar}
              style={{ background: editForm.personType === "CREW" ? "#8B5CF6" : LIV }}
            >
              {initials(editForm.fullName || p.fullName)}
            </span>
            <input
              className={classes.editInput}
              value={editForm.fullName}
              onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="ФИО"
              disabled={editForm.personType === "CREW"}
            />
          </div>
          <div className={classes.cellCategory}>
            {editForm.personType !== "CREW" ? (
              <select
                className={classes.editInput}
                value={editForm.personCategory}
                onChange={(e) => setEditForm((f) => ({ ...f, personCategory: e.target.value }))}
              >
                {PERSON_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <span className={classes.dash}>—</span>
            )}
          </div>
          <InputMask
            className={classes.editInput}
            mask="+7 (___) ___-__-__"
            replacement={{ _: /\d/ }}
            value={editForm.phone}
            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+7 (___) ___-__-__"
          />
          <input
            className={classes.editInput}
            value={editForm.roomNumber}
            onChange={(e) => setEditForm((f) => ({ ...f, roomNumber: e.target.value }))}
            placeholder="№"
          />
          <div className={classes.editActions}>
            <button
              type="button"
              className={classes.saveBtn}
              onClick={handleSaveEdit}
              disabled={saving || !editForm.fullName.trim()}
              title="Сохранить"
            >
              <CheckSvg size={16} strokeWidth={2.6} />
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
      <div
        key={p._idx}
        className={`${classes.row} ${isSelected ? classes.rowSelected : ""}`}
      >
        {canMutateGuests && (
          <div className={classes.colCheck}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSel(p._idx)}
            />
          </div>
        )}
        <div className={classes.cellName}>
          <span
            className={classes.avatar}
            style={{ background: p.personType === "CREW" ? "#8B5CF6" : LIV }}
          >
            {initials(p.fullName)}
          </span>
          <div className={classes.cellNameText}>
            <div className={classes.guestName}>
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
        <div className={classes.cellPhone}>{p.phone || "—"}</div>
        <div>
          {p.roomNumber ? (
            <span className={classes.roomBadge}>{p.roomNumber}</span>
          ) : (
            <span className={classes.dash}>—</span>
          )}
        </div>
        <div className={classes.rowActions}>
          {canMutateGuests && (
            <>
              <button
                type="button"
                className={classes.iconBtn}
                onClick={() => openEdit(p)}
                title="Редактировать"
              >
                <EditPencilIcon color="#545873" cursor="pointer" />
              </button>
              {otherHotels.length > 0 && !isExtHotel && (
                <button
                  type="button"
                  className={classes.iconBtn}
                  onClick={() => openRelocate([p._idx])}
                  title="Переселить"
                >
                  <SwapSvg />
                </button>
              )}
              <button
                type="button"
                className={`${classes.iconBtn} ${classes.iconBtnDanger}`}
                onClick={() => openEvict([p._idx])}
                title="Выселить"
              >
                <DeleteIcon cursor="pointer" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderAddRow = () => (
    <div className={classes.editRow}>
      {canMutateGuests && <div className={classes.colCheck} />}
      <div className={classes.cellName}>
        <span className={classes.avatarDraft}>
          <PlusSvg color={LIV} />
        </span>
        {addForm.personType === "CREW" ? (
          <select
            className={classes.editInput}
            value={addForm.airlinePersonalId}
            onChange={(e) => {
              const member = crewRoster.find((m) => m.airlinePersonalId === e.target.value);
              setAddForm((f) => ({
                ...f,
                airlinePersonalId: e.target.value,
                fullName: member?.fullName ?? "",
                phone: member?.phone ?? "",
              }));
            }}
          >
            <option value="">Выберите сотрудника</option>
            {availableCrew.map((m) => (
              <option key={m.airlinePersonalId} value={m.airlinePersonalId}>
                {[m.fullName, m.position].filter(Boolean).join(", ")}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={classes.editInput}
            value={addForm.fullName}
            onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))}
            placeholder="ФИО пассажира"
          />
        )}
      </div>
      <div className={classes.cellCategory}>
        {addForm.personType !== "CREW" ? (
          <select
            className={classes.editInput}
            value={addForm.personCategory}
            onChange={(e) => setAddForm((f) => ({ ...f, personCategory: e.target.value }))}
          >
            {PERSON_CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <span className={classes.dash}>—</span>
        )}
      </div>
      <InputMask
        className={classes.editInput}
        mask="+7 (___) ___-__-__"
        replacement={{ _: /\d/ }}
        value={addForm.phone}
        onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
        placeholder="+7 (___) ___-__-__"
        disabled={addForm.personType === "CREW"}
      />
      <input
        className={classes.editInput}
        value={addForm.roomNumber}
        onChange={(e) => setAddForm((f) => ({ ...f, roomNumber: e.target.value }))}
        placeholder="№"
      />
      <div className={classes.editActions}>
        <button
          type="button"
          className={classes.saveBtn}
          onClick={handleAdd}
          disabled={saving || !addForm.fullName.trim()}
          title="Добавить"
        >
          <CheckSvg size={16} strokeWidth={2.6} />
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

  return (
    <div className={classes.root}>
      {/* ── Header + Metrics strip (two-row) ── */}
      <div className={classes.headPanel}>
        {/* Row 1 — identity + links */}
        <div className={classes.headRow1}>
          <div className={classes.headIcon}>
            <HotelBedIcon size={24} strokeWidth={2} />
          </div>
          <div className={classes.headText}>
            <div className={classes.headTitleRow}>
              <span className={classes.headTitle}>{hotel.name || "Гостиница"}</span>
              {isFull && (
                <span className={classes.fullBadge}>
                  <span className={classes.fullDot} />заполнен
                </span>
              )}
            </div>
            {hotel.address && (
              <div className={classes.headSub}>
                <PinSvg /> {hotel.address}
              </div>
            )}
          </div>
          {showLinks && hotel.linkCRM && (
            <button
              type="button"
              className={classes.linkBtn}
              onClick={() => copyLink(hotel.linkCRM)}
              title="Скопировать ссылку «Сайт»"
            >
              <LinkSvg /> Сайт <CopyIcon />
            </button>
          )}
          {showLinks && hotel.linkPWA && (
            <button
              type="button"
              className={classes.linkBtn}
              onClick={() => copyLink(hotel.linkPWA)}
              title="Скопировать ссылку «Сканер»"
            >
              <LinkSvg /> Сканер <CopyIcon />
            </button>
          )}
        </div>

        {/* Row 2 — metrics strip */}
        <div className={classes.headRow2}>
          <div className={classes.metric}>
            <span className={classes.metricLabel}>Занятость</span>
            <div className={classes.kpiRow}>
              <div className={classes.kpiValueRow}>
                <span className={classes.kpiValue}>{placed}</span>
                <span className={classes.kpiTotal}>/ {totalCap || 0}</span>
              </div>
              <div className={classes.kpiBar}>
                <div className={classes.kpiBarFill} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
          <div className={classes.metricDivider} />
          {plan?.plannedFromAt && (
            <div className={classes.metric}>
              <span className={classes.metricLabel}>Заезд</span>
              <span className={classes.metricValue}>{formatDateTime(plan.plannedFromAt)}</span>
            </div>
          )}
          {plan?.plannedToAt && (
            <div className={classes.metric}>
              <span className={classes.metricLabel}>Выезд</span>
              <span className={classes.metricValue}>{formatDateTime(plan.plannedToAt)}</span>
            </div>
          )}
          {(() => {
            const a = plan?.plannedFromAt;
            const b = plan?.plannedToAt;
            if (!a || !b) return null;
            const days = calculateEffectiveCostDays(a, b);
            return (
              <div className={classes.metric}>
                <span className={classes.metricLabel}>Суток</span>
                <span className={classes.metricValueIcon}>
                  <ClockSvg color="#545873" /> {days}
                </span>
              </div>
            );
          })()}
          <div className={classes.metricDivider} />
          <div className={classes.metric}>
            <span className={classes.metricLabel}>Состав</span>
            <div className={classes.composition}>
              <span className={classes.compChipPassenger}>
                <span className={classes.dotPassenger} />Пассажиры · {passengersCount}
              </span>
              {crewCount > 0 && (
                <span className={classes.compChipCrew}>
                  <span className={classes.dotCrew} />Экипаж · {crewCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={classes.tabs}>
        <button
          type="button"
          className={`${classes.tab} ${activeTab === "guests" ? classes.tabActive : ""}`}
          onClick={() => setActiveTab("guests")}
        >
          {request?.includesCrew ? "Пассажиры и экипаж" : "Пассажиры"}
          <span className={classes.tabBadge}>{placed}</span>
        </button>
        {showTariffs && (
          <button
            type="button"
            className={`${classes.tab} ${activeTab === "tariffs" ? classes.tabActive : ""}`}
            onClick={() => setActiveTab("tariffs")}
          >
            Тарифы
            <span className={classes.tabBadge}>{tariffs.filter((t) => !t.draft).length}</span>
          </button>
        )}
        <button
          type="button"
          className={`${classes.tab} ${activeTab === "report" ? classes.tabActive : ""}`}
          onClick={() => setActiveTab("report")}
        >
          Отчёт
          {placed > 0 && <span className={classes.tabBadge}>{placed}</span>}
        </button>
      </div>

      {/* ── Content ── */}
      <div className={classes.content}>
        {activeTab === "guests" && (
          <div className={classes.guestsPane}>
            <div className={classes.toolbar}>
              {showCrewToggle && (
                <PersonTypeToggle value={personMode} onChange={setPersonMode} />
              )}
              <div className={classes.searchWrap}>
                <input
                  placeholder="Поиск по ФИО, телефону, номеру…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <span className={classes.spacer} />
              {canAdd && !adding && (
                <button type="button" className={classes.primaryBtn} onClick={openAdd}>
                  <PlusSvg /> {personMode === "CREW" ? "Добавить члена экипажа" : "Добавить пассажира"}
                </button>
              )}
              {canAdd && personMode !== "CREW" && savedPassengers.length > 0 && (
                <button
                  type="button"
                  className={classes.primaryBtn}
                  style={{ background: "#fff", color: "#0057C3", border: "1px solid #0057C3" }}
                  onClick={() => setCatalogOpen(true)}
                >
                  <PlusSvg color="#0057C3" /> Из реестра
                </button>
              )}
              {canAdd && personMode === "CREW" && availableCrew.length > 0 && (
                <button
                  type="button"
                  className={classes.primaryBtn}
                  style={{ background: "#fff", color: "#0057C3", border: "1px solid #0057C3" }}
                  onClick={() => setCatalogOpen(true)}
                >
                  <PlusSvg color="#0057C3" /> Из экипажа
                </button>
              )}
            </div>

            {selected.length > 0 && (
              <div className={classes.selectionBar}>
                <span className={classes.selectionCount}>Выбрано: {selected.length}</span>
                {otherHotels.length > 0 && !isExtHotel && (
                  <button
                    type="button"
                    className={classes.bulkBtn}
                    onClick={() => openRelocate(selected)}
                  >
                    <SwapSvg color="#0057C3" /> Переселить
                  </button>
                )}
                <button
                  type="button"
                  className={`${classes.bulkBtn} ${classes.bulkBtnDanger}`}
                  onClick={() => openEvict(selected)}
                >
                  <DeleteIcon /> Выселить
                </button>
                <span className={classes.spacer} />
                <button type="button" className={classes.clearSelBtn} onClick={clearSel}>
                  Снять выбор
                </button>
              </div>
            )}

            <div className={`${classes.guestTable}${canMutateGuests ? "" : " " + classes.guestTableReadonly}`}>
              <div className={classes.tableHead}>
                {canMutateGuests && (
                  <div className={classes.colCheck}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  </div>
                )}
                <div>ФИО</div>
                <div>Возрастная категория</div>
                <div>Телефон</div>
                <div>Номер</div>
                <div className={classes.colActions}>Действия</div>
              </div>

              {adding && renderAddRow()}
              {filteredPeople.length === 0 && !adding ? (
                <div className={classes.emptyRow}>
                  {search.trim()
                    ? "Ничего не найдено"
                    : personMode === "CREW"
                    ? "Экипаж ещё не добавлен"
                    : "Пассажиров ещё нет"}
                </div>
              ) : (
                filteredPeople.map((p) => renderGuestRow(p))
              )}
            </div>
          </div>
        )}

        {showTariffs && activeTab === "tariffs" && (
          <div className={classes.tariffsPane}>
            <div className={classes.tariffsHead}>
              <p className={classes.tariffsHint}>
                Создайте тарифы с ценами — затем назначьте их пассажирам во вкладке «Отчёт».
              </p>
              <span className={classes.spacer} />
              {canEdit && (
                <button type="button" className={classes.primaryBtn} onClick={addTariff}>
                  <PlusSvg /> Добавить тариф
                </button>
              )}
            </div>

            {tariffs.length === 0 ? (
              <div className={classes.emptyTariffs}>Нет тарифов — добавьте первый</div>
            ) : (
              tariffs.map((t) => (
                <div
                  key={t.id}
                  className={`${classes.tariffCard} ${t.draft ? classes.tariffCardDraft : ""}`}
                >
                  <div className={classes.tariffHead}>
                    {t.draft && <span className={classes.draftBadge}>Черновик</span>}
                    <input
                      className={classes.tariffName}
                      value={t.name ?? ""}
                      onChange={(e) => canEdit && updateTariff(t.id, "name", e.target.value)}
                      readOnly={!canEdit}
                      placeholder="напр. ДС №1 от 01.08.2026"
                      autoFocus={t.draft}
                    />
                    {canEdit && t.draft && (
                      <>
                        <button
                          type="button"
                          className={classes.saveTariffBtn}
                          onClick={() => saveTariff(t.id)}
                          title="Сохранить тариф"
                        >
                          <CheckSvg color="#fff" /> Сохранить
                        </button>
                        <button
                          type="button"
                          className={classes.removeTariffBtn}
                          onClick={() => cancelTariff(t.id)}
                          title="Отменить создание тарифа"
                          aria-label="Отмена"
                        >
                          <CloseIcon color="#545873" />
                        </button>
                      </>
                    )}
                    {canEdit && !t.draft && (
                      <>
                        <button
                          type="button"
                          className={classes.applyAllBtn}
                          onClick={() => applyTariffToAll(t.id)}
                          title="Применить этот тариф всем пассажирам"
                        >
                          <CheckSvg color="#0F7A52" /> Применить всем
                        </button>
                        <button
                          type="button"
                          className={classes.removeTariffBtn}
                          onClick={() => removeTariff(t.id)}
                          title="Удалить тариф"
                          aria-label="Удалить тариф"
                        >
                          <CloseIcon color="#EF4444" />
                        </button>
                      </>
                    )}
                  </div>
                  <div className={classes.tariffFields}>
                    {[
                      ["breakfast", "Завтрак"],
                      ["lunch", "Обед"],
                      ["dinner", "Ужин"],
                      ["foodCost", "Ст-ть питания", true, true],
                    ].map(([key, label, accent, computed]) => {
                      const displayVal =
                        key === "foodCost"
                          ? toNum(t.breakfast) + toNum(t.lunch) + toNum(t.dinner)
                          : t[key];
                      return (
                        <label key={key} className={classes.tariffField}>
                          <span className={classes.tariffFieldLabel}>{label}</span>
                          <div className={classes.tariffInputWrap}>
                            <input
                              type="number"
                              min={0}
                              value={displayVal ? displayVal : ""}
                              onChange={(e) =>
                                canEdit && !computed && updateTariff(t.id, key, e.target.value)
                              }
                              readOnly={!canEdit || computed}
                              placeholder="0"
                              className={accent ? classes.tariffInputAccent : classes.tariffInput}
                              title={computed ? "Сумма завтрака, обеда и ужина" : undefined}
                            />
                            <span className={classes.tariffCurrency}>₽</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {/* Цены койко-места за сутки по видам размещения */}
                  <div className={classes.tariffFields}>
                    {(t.placementPrices ?? []).map((pp, ppIdx) => (
                      <label key={pp.places} className={classes.tariffField}>
                        <span className={classes.tariffFieldLabel}>
                          {placementKindLabel(pp.places)}, ₽/сутки
                        </span>
                        <div className={classes.fieldInputRow}>
                          <div className={classes.tariffInputWrap} style={{ flex: 1 }}>
                            <input
                              type="number"
                              min={0}
                              value={pp.pricePerDay ? pp.pricePerDay : ""}
                              placeholder="0"
                              readOnly={!canEdit}
                              onChange={(e) =>
                                canEdit && updateTariffPlacementPrice(t.id, pp.places, e.target.value)
                              }
                              className={classes.tariffInputAccent}
                            />
                            <span className={classes.tariffCurrency}>₽</span>
                          </div>
                          {canEdit && ppIdx >= 2 && (
                            <button
                              type="button"
                              className={classes.removeTariffBtn}
                              title="Убрать вид размещения"
                              onClick={() => removeTariffPlacement(t.id, pp.places)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </label>
                    ))}
                    {canEdit && (
                      <button
                        type="button"
                        className={classes.applyAllBtn}
                        style={{ alignSelf: "end" }}
                        onClick={() => addTariffPlacement(t.id)}
                      >
                        + добавить вид
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {hotelTariffs.length > 0 && (
              <>
                <div className={classes.tariffsHead} style={{ marginTop: 16 }}>
                  <p className={classes.tariffsHint}>
                    Тарифы гостиницы — подставляются из карточки гостиницы, доступны для назначения в «Отчёте».
                  </p>
                </div>
                {hotelTariffs.map((t) => (
                  <div key={t.id} className={classes.tariffCard}>
                    <div className={classes.tariffHead}>
                      <span className={classes.draftBadge} style={{ background: "#EAF1FB", color: "#0057C2" }}>
                        из гостиницы
                      </span>
                      <input className={classes.tariffName} value={t.name ?? ""} readOnly />
                    </div>
                    <div className={classes.tariffFields}>
                      {[
                        ["breakfast", "Завтрак"],
                        ["lunch", "Обед"],
                        ["dinner", "Ужин"],
                        ["foodCost", "Ст-ть питания", true, true],
                        ["pricePerDay", "Цена за сутки", true],
                      ].map(([key, label, accent]) => {
                        const displayVal =
                          key === "foodCost"
                            ? toNum(t.breakfast) + toNum(t.lunch) + toNum(t.dinner)
                            : t[key];
                        return (
                          <label key={key} className={classes.tariffField}>
                            <span className={classes.tariffFieldLabel}>{label}</span>
                            <div className={classes.tariffInputWrap}>
                              <input
                                type="number"
                                min={0}
                                value={displayVal ? displayVal : ""}
                                readOnly
                                placeholder="0"
                                className={accent ? classes.tariffInputAccent : classes.tariffInput}
                              />
                              <span className={classes.tariffCurrency}>₽</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === "report" && (
          <div className={classes.reportPane}>
            <div className={classes.reportToolbar}>
              {effectiveReportMode === "edit" && (
                <>
                  <div className={classes.searchWrap}>
                    <input
                      placeholder="Поиск по ФИО…"
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                    />
                  </div>
                  <span className={classes.boundCount}>
                    Тариф назначен: <strong>{boundCount}</strong> из {placed}
                  </span>
                </>
              )}
              <span className={classes.spacer} />
              {canEdit ? (
                <FapModeToggle mode={effectiveReportMode} onChange={setReportModePersist} />
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 34,
                    padding: "0 12px",
                    borderRadius: 999,
                    background: "var(--gray, #F1F4FB)",
                    border: "1px solid var(--border, #E4E4EF)",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--main-gray)",
                  }}
                >
                  <EyeIcon size={15} color="#545873" /> Только просмотр · авиакомпания
                </span>
              )}
                <button
                  type="button"
                  className={classes.secondaryBtn}
                  onClick={handleExport}
                  disabled={placed === 0}
                >
                  <DownloadIcon /> Excel
                </button>
              {effectiveReportMode === "edit" && canEdit && (
                <button
                  type="button"
                  className={classes.primaryBtn}
                  onClick={handleSaveReport}
                  disabled={saving}
                >
                  <CheckSvg /> {saving ? "Сохранение…" : "Сохранить отчёт"}
                </button>
              )}
            </div>

            {placed === 0 ? (
              <div className={classes.emptyRow}>Пассажиры ещё не добавлены</div>
            ) : effectiveReportMode === "view" ? (
              <FapReportView summary={reportSummary} groups={reportViewGroups} />
            ) : (
              <div className={classes.reportTableWrap}>
                <div className={classes.reportGroups}>
                  {visibleGroups.map((g) => {
                    const gTotal = groupTotals[g.key]?.total ?? 0;
                    return (
                      <div key={g.key} className={`${classes.roomGroup} ${g.noRoom ? classes.roomGroupNoRoom : ""}`}>
                        <div className={classes.roomHead}>
                          <span className={classes.roomNo}>
                            {g.noRoom ? <span className={classes.noRoomBadge}>Без номера</span> : <>№ {g.roomNumber}</>}
                          </span>
                          {!g.noRoom && placementKindLabel(g.members.length) && (
                            <span className={classes.roomKindBadge}>{placementKindLabel(g.members.length)}</span>
                          )}
                          {g.tariffName && <span className={classes.roomCat}>{g.tariffName}</span>}
                          <span className={classes.roomTotalVal} style={{ marginLeft: "auto" }}>
                            {gTotal > 0 ? fmt(gTotal) : "—"}
                          </span>
                        </div>
                        <div className={classes.memberColHead}>
                          <span>ФИО</span>
                          <span>Номер</span>
                          <span>Тариф</span>
                          <span className={classes.numRight}>Сут.</span>
                          <span className={classes.numRight}>Завтр.</span>
                          <span className={classes.numRight}>Обед</span>
                          <span className={classes.numRight}>Ужин</span>
                          <span className={classes.numRight}>Питание</span>
                          <span className={classes.numRight}>Прожив.</span>
                        </div>
                        {g.members.map((m) => {
                          const { person, index: i, pd } = m;
                          const unbound = !pd.tariffId;
                          return (
                            <div key={i} className={classes.memberRow}>
                              <div className={classes.reportCellName}>
                                <span
                                  className={classes.avatar}
                                  style={{ background: person.personType === "CREW" ? "#8B5CF6" : LIV, width: 26, height: 26 }}
                                >
                                  {initials(person.fullName)}
                                </span>
                                <span className={classes.reportName}>{person.fullName || "—"}</span>
                                {person.personType === "CREW" && <span className={classes.reportBadge}><PersonBadge type="CREW" /></span>}
                                {person.personType !== "CREW" && <CategoryBadge category={person.personCategory} />}
                              </div>
                              <div>
                                <RoomNumberCell
                                  value={pd.roomNumber}
                                  canEdit={canEdit}
                                  onCommit={(v) => commitPersonRoom(i, v)}
                                />
                              </div>
                              <div>
                                <select
                                  className={`${classes.tariffSelect} ${unbound ? classes.tariffSelectUnbound : ""}`}
                                  value={pd.tariffId || ""}
                                  onChange={(e) => canEdit && applyTariffToPerson(i, e.target.value)}
                                  disabled={!canEdit}
                                >
                                  <option value="">Выбрать тариф</option>
                                  {tariffs.filter((t) => !t.draft).length > 0 && (
                                    <optgroup label="Тарифы заявки">
                                      {tariffs.filter((t) => !t.draft).map((t) => (
                                        <option key={t.id} value={t.id}>{t.name || "Без названия"}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {hotelTariffs.length > 0 && (
                                    <optgroup label="Тарифы гостиницы">
                                      {hotelTariffs.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name || "Без названия"}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>
                              <div>
                                <input type="number" min={0} step={0.5} className={classes.cellInputNum}
                                  value={pd.daysCount ? pd.daysCount : ""}
                                  onChange={(e) => canEdit && updatePersonReport(i, "daysCount", e.target.value)}
                                  readOnly={!canEdit} />
                              </div>
                              <div>
                                <input type="number" min={0} className={classes.cellInputNum}
                                  value={pd.breakfast ? pd.breakfast : ""}
                                  onChange={(e) => canEdit && updatePersonReport(i, "breakfast", e.target.value)}
                                  readOnly={!canEdit} />
                              </div>
                              <div>
                                <input type="number" min={0} className={classes.cellInputNum}
                                  value={pd.lunch ? pd.lunch : ""}
                                  onChange={(e) => canEdit && updatePersonReport(i, "lunch", e.target.value)}
                                  readOnly={!canEdit} />
                              </div>
                              <div>
                                <input type="number" min={0} className={classes.cellInputNum}
                                  value={pd.dinner ? pd.dinner : ""}
                                  onChange={(e) => canEdit && updatePersonReport(i, "dinner", e.target.value)}
                                  readOnly={!canEdit} />
                              </div>
                              <div className={`${classes.numRight} ${classes.memberFood}`}>
                                {m.food > 0 ? fmt(m.food) : "—"}
                              </div>
                              <div className={classes.numRight}>
                                {(() => {
                                  const eff = getEffectiveRow(i, pd);
                                  const hasTariff = !!findTariff(pd.tariffId);
                                  if (!hasTariff) {
                                    // Без тарифа — ручной ввод стоимости проживания.
                                    return (
                                      <input
                                        type="number" min={0} className={classes.cellInputNum}
                                        value={pd.accommodationCost ? pd.accommodationCost : ""}
                                        onChange={(e) => canEdit && updatePersonReport(i, "accommodationCost", e.target.value)}
                                        readOnly={!canEdit}
                                      />
                                    );
                                  }
                                  if (eff.warning) {
                                    return <span className={classes.accWarning} title={eff.warning}>⚠ {eff.warning}</span>;
                                  }
                                  return (
                                    <span className={classes.accFormula}>
                                      {fmt(eff.pricePerDay)} × {toNum(pd.daysCount)} сут
                                      {eff.chargeFactor < 1 ? ` × ${Math.round(eff.chargeFactor * 100)}%` : ""}
                                      {" = "}
                                      <strong>{fmt(eff.accommodationCost)}</strong>
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                <div className={classes.reportFooter}>
                  <span className={classes.footerLabel}>
                    Человек: <strong>{placed}</strong>
                  </span>
                  <span className={classes.spacer} />
                  <span className={classes.footerLabel}>Итого по отчёту</span>
                  <span className={classes.grandTotal}>{fmt(grandTotal)} ₽</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}
      <FapDestructiveModal
        open={evictState !== null}
        onClose={() => setEvictState(null)}
        onConfirm={handleEvict}
        title={
          evictState && evictState.indices.length > 1
            ? `Выселить (${evictState.indices.length})`
            : people[evictState?.indices?.[0]]?.personType === "CREW"
            ? "Выселение члена экипажа"
            : "Выселение пассажира"
        }
        description={
          people[evictState?.indices?.[0]]?.personType === "CREW"
            ? "Укажите причину выселения. Это действие изменит статус члена экипажа."
            : "Укажите причину выселения. Это действие изменит статус пассажира."
        }
        reasonLabel="Причина *"
        placeholder="Укажите причину выселения..."
        confirmText={
          evictState && evictState.indices.length > 1 ? "Выселить всех" : "Выселить"
        }
        cancelText="Отмена"
        saving={saving}
      />

      <CatalogPickerModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        savedPassengers={personMode === "CREW" ? crewPickerItems : savedPassengers}
        excludeKeys={personMode === "CREW" ? undefined : excludeKeys}
        maxSelectable={totalCap > 0 ? Math.max(0, totalCap - placed) : undefined}
        loading={saving}
        onConfirm={personMode === "CREW" ? handleCrewCatalogConfirm : handleCatalogConfirm}
        title={personMode === "CREW" ? "Выбрать из экипажа заявки" : undefined}
      />

      <Dialog
        open={relocateState !== null}
        onClose={closeRelocate}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--text)",
            borderBottom: "1px solid #F1F5F9",
            pb: 2,
          }}
        >
          {relocateState && relocateState.indices.length > 1
            ? `Переселить (${relocateState.indices.length})`
            : people[relocateState?.indices?.[0]]?.personType === "CREW"
            ? "Переселение члена экипажа"
            : "Переселение пассажира"}
        </DialogTitle>
        <DialogContent
          sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}
        >
          <p className={classes.dialogHint}>
            Выберите гостиницу для переселения и укажите причину.
          </p>
          <div className={classes.dialogField}>
            <label className={classes.dialogLabel}>Гостиница *</label>
            <select
              className={classes.dialogInput}
              value={relocateTarget}
              onChange={(e) => setRelocateTarget(e.target.value)}
            >
              <option value="">Выберите гостиницу</option>
              {otherHotels.map(({ hotel: h, originalIndex }) => {
                const cap = Number(h?.peopleCount) || 0;
                const placed = (h?.people || []).length;
                const free = Math.max(0, cap - placed);
                const isFull = cap > 0 && free <= 0;
                return (
                  <option
                    key={h.itemId || originalIndex}
                    value={originalIndex}
                    disabled={isFull}
                  >
                    {h.name || `Гостиница ${originalIndex + 1}`}
                    {cap > 0 ? ` · свободно ${free}/${cap}` : ""}
                    {isFull ? " (заполнен)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
          <div className={classes.dialogField}>
            <label className={classes.dialogLabel}>Причина *</label>
            <textarea
              className={classes.dialogTextarea}
              rows={4}
              value={relocateReason}
              onChange={(e) => setRelocateReason(e.target.value)}
              placeholder="Укажите причину переселения..."
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
          <Button backgroundcolor="#F6F7FB" color="#545873" onClick={closeRelocate}>
            Отмена
          </Button>
          <Button
            backgroundcolor="var(--dark-blue)"
            color="#fff"
            onClick={handleRelocate}
            disabled={saving || !relocateReason.trim() || relocateTarget === ""}
          >
            {saving
              ? "Сохранение..."
              : relocateState && relocateState.indices.length > 1
              ? "Переселить всех"
              : "Переселить"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
