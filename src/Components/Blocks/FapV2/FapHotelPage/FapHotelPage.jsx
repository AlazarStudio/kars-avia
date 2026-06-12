import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { InputMask } from "@react-input/mask";
import * as XLSX from "xlsx";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "./FapHotelPage.module.css";
import {
  ADD_PASSENGER_REQUEST_HOTEL_PERSON,
  UPDATE_PASSENGER_REQUEST_HOTEL_PERSON,
  REMOVE_PASSENGER_REQUEST_HOTEL_PERSON,
  RELOCATE_PASSENGER_REQUEST_HOTEL_PERSON,
  EVICT_PASSENGER_REQUEST_HOTEL_PERSON,
  SAVE_PASSENGER_REQUEST_HOTEL_REPORT,
  getCookie,
} from "../../../../../graphQL_requests";
import { calculateEffectiveCostDays } from "../../../../utils/effectiveCostDays";
import { PERSON_TYPE_CONFIG, formatDateTime } from "../fapConstants";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import Button from "../../../Standart/Button/Button";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";
import PersonTypeToggle from "../PersonTypeToggle/PersonTypeToggle";
import PersonBadge from "../PersonBadge/PersonBadge";
import HotelBedIcon from "../../../../shared/icons/HotelBedIcon";
import EditPencilIcon from "../../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import CloseIcon from "../../../../shared/icons/CloseIcon";
import CopyIcon from "../../../../shared/icons/CopyIcon";
import DownloadIcon from "../../../../shared/icons/DownloadIcon";

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
  accommodationCost: 0,
  draft,
});

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
};

export default function FapHotelPage({
  request,
  hotelIndex,
  onRefetch,
  canEdit = true,
  showLinks = true,
  isExtHotel = false,
}) {
  const navigate = useNavigate();
  const { requestId } = useParams();
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

  // Relocate / Evict
  const [relocateState, setRelocateState] = useState(null);
  const [relocateTarget, setRelocateTarget] = useState("");
  const [relocateReason, setRelocateReason] = useState("");
  const [evictState, setEvictState] = useState(null);

  // Report state
  const [tariffs, setTariffs] = useState([]);
  const [personData, setPersonData] = useState({});
  const [reportSearch, setReportSearch] = useState("");

  const [saving, setSaving] = useState(false);

  // Refs хранят актуальное состояние для отложенного автосохранения —
  // дебаунс-таймер должен видеть последние значения, а не замороженные в замыкании.
  // `people` инициализируем пустым массивом: значение синхронизируется через useEffect ниже,
  // т.к. сама переменная `people` объявлена позже по коду.
  const tariffsRef = useRef(tariffs);
  const personDataRef = useRef(personData);
  const peopleRef = useRef([]);
  const saveTimerRef = useRef(null);
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
    const saved = (request.hotelReports ?? []).find((r) => r.hotelIndex === Number(hotelIndex));
    const savedRows = saved?.reportRows ?? [];

    const priceKey = (r) =>
      [toNum(r.breakfast), toNum(r.lunch), toNum(r.dinner), toNum(r.foodCost), toNum(r.accommodationCost)].join("|");

    if (savedRows.length > 0) {
      const tariffByKey = new Map();
      savedRows.forEach((r) => {
        // Тариф восстанавливается только из строк с непустым названием категории.
        // Иначе строки гостей с ценами, но без привязки тарифа, создавали бы
        // «безымянные» тарифы, которые невозможно удалить (X срабатывает,
        // но при следующем входе тариф возвращался инференцией).
        const hasName = (r.roomCategory || "").trim() || (r.roomKind || "").trim();
        if (!hasName) return;

        const k = priceKey(r);
        if (!tariffByKey.has(k)) {
          tariffByKey.set(k, {
            ...newTariff(false),
            name: [r.roomCategory, r.roomKind].filter(Boolean).join(" / ") || "",
            breakfast: toNum(r.breakfast),
            lunch: toNum(r.lunch),
            dinner: toNum(r.dinner),
            foodCost: toNum(r.foodCost),
            accommodationCost: toNum(r.accommodationCost),
          });
        }
      });
      const restored = [...tariffByKey.values()];
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
        const t = restored.find((tt) => priceKey(tt) === k);
        data[idx] = {
          roomNumber: row.roomNumber ?? "",
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
  }, [request?.id, hotelIndex]);

  // ── Persistence helpers ──
  // Сериализация текущих тарифов + personData в строки отчёта.
  // Бэк не хранит тарифы отдельно — восстанавливает их при загрузке из
  // уникальных ценовых ключей строк. Непривязанные тарифы добавляем как
  // «теневые» строки (пустой ФИО), иначе они терялись бы при следующем входе.
  const buildReportRows = useCallback(() => {
    const currentTariffs = tariffsRef.current;
    const currentPersonData = personDataRef.current;
    const currentPeople = peopleRef.current;
    const usedTariffIds = new Set(
      Object.values(currentPersonData).map((pd) => pd?.tariffId).filter(Boolean)
    );
    const ghostRows = currentTariffs
      .filter((t) => !t.draft && !usedTariffIds.has(t.id))
      .map((t) => ({
        fullName: "",
        roomNumber: "",
        roomCategory: t.name || "",
        roomKind: "",
        daysCount: 0,
        breakfast: toNum(t.breakfast),
        lunch: toNum(t.lunch),
        dinner: toNum(t.dinner),
        foodCost: toNum(t.breakfast) + toNum(t.lunch) + toNum(t.dinner),
        accommodationCost: toNum(t.accommodationCost),
      }));
    const personRows = currentPeople.map((person, i) => {
      const pd = currentPersonData[i] ?? emptyPD(person, hotelIndex, plan);
      const tariff = currentTariffs.find((tt) => tt.id === pd.tariffId);
      return {
        fullName: person.fullName ?? "",
        roomNumber: pd.roomNumber ?? "",
        roomCategory: tariff?.name ?? "",
        roomKind: "",
        daysCount: toNum(pd.daysCount),
        breakfast: toNum(pd.breakfast),
        lunch: toNum(pd.lunch),
        dinner: toNum(pd.dinner),
        foodCost: toNum(pd.breakfast) + toNum(pd.lunch) + toNum(pd.dinner),
        accommodationCost: toNum(pd.accommodationCost),
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
      setTariffs(newTariffs);
      setPersonData(newPersonData);

      if (!request?.id) return;
      try {
        setSaving(true);
        const usedTariffIds = new Set(
          Object.values(newPersonData).map((pd) => pd?.tariffId).filter(Boolean)
        );
        const ghostRows = newTariffs
          .filter((tt) => !tt.draft && !usedTariffIds.has(tt.id))
          .map((tt) => ({
            fullName: "",
            roomNumber: "",
            roomCategory: tt.name || "",
            roomKind: "",
            daysCount: 0,
            breakfast: toNum(tt.breakfast),
            lunch: toNum(tt.lunch),
            dinner: toNum(tt.dinner),
            foodCost: toNum(tt.breakfast) + toNum(tt.lunch) + toNum(tt.dinner),
            accommodationCost: toNum(tt.accommodationCost),
          }));
        const personRows = people.map((person, i) => {
          const pd = newPersonData[i] ?? emptyPD(person, hotelIndex, plan);
          return {
            fullName: person.fullName ?? "",
            roomNumber: pd.roomNumber,
            roomCategory: "",
            roomKind: "",
            daysCount: toNum(pd.daysCount),
            breakfast: toNum(pd.breakfast),
            lunch: toNum(pd.lunch),
            dinner: toNum(pd.dinner),
            foodCost: toNum(pd.breakfast) + toNum(pd.lunch) + toNum(pd.dinner),
            accommodationCost: toNum(pd.accommodationCost),
          };
        });
        await saveReport({
          variables: {
            requestId: request.id,
            hotelIndex: Number(hotelIndex),
            reportRows: [...personRows, ...ghostRows],
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
    [tariffs, personData, people, hotelIndex, plan, request?.id, saveReport, notifyError]
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

    // Цены распространяем на привязанных гостей, чтобы отчёт оставался синхронным с тарифом.
    // Название не трогаем — оно подтягивается в отчёт через tariffId.
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
            accommodationCost: toNum(updated.accommodationCost),
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
        const usedTariffIds = new Set(
          Object.values(personData)
            .map((pd) => pd?.tariffId)
            .filter(Boolean)
        );
        const ghostRows = newTariffs
          .filter((tt) => !tt.draft && !usedTariffIds.has(tt.id))
          .map((tt) => ({
            fullName: "",
            roomNumber: "",
            roomCategory: tt.name || "",
            roomKind: "",
            daysCount: 0,
            breakfast: toNum(tt.breakfast),
            lunch: toNum(tt.lunch),
            dinner: toNum(tt.dinner),
            foodCost: toNum(tt.breakfast) + toNum(tt.lunch) + toNum(tt.dinner),
            accommodationCost: toNum(tt.accommodationCost),
          }));
        const personRows = people.map((person, i) => {
          const pd = personData[i] ?? emptyPD(person, hotelIndex, plan);
          const tariff = newTariffs.find((tt) => tt.id === pd.tariffId);
          return {
            fullName: person.fullName ?? "",
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
        });
        await saveReport({
          variables: {
            requestId: request.id,
            hotelIndex: Number(hotelIndex),
            reportRows: [...personRows, ...ghostRows],
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
    [
      tariffs,
      personData,
      people,
      hotelIndex,
      plan,
      request?.id,
      saveReport,
      success,
      notifyError,
    ]
  );
  const applyTariffToAll = useCallback(
    (tariffId) => {
      const t = tariffs.find((x) => x.id === tariffId);
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
          accommodationCost: toNum(t.accommodationCost),
        };
      });
      personDataRef.current = next;
      setPersonData(next);
      scheduleSave();
    },
    [tariffs, scheduleSave, people, hotelIndex, plan]
  );
  const applyTariffToPerson = useCallback(
    (personIndex, tariffId) => {
      const t = tariffs.find((x) => x.id === tariffId);
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
                breakfast: toNum(t.breakfast),
                lunch: toNum(t.lunch),
                dinner: toNum(t.dinner),
                foodCost: toNum(t.foodCost),
                accommodationCost: toNum(t.accommodationCost),
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
    [tariffs, scheduleSave, people, hotelIndex, plan]
  );
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
        const tariff = tariffs.find((t) => t.id === pd.tariffId);
        return {
          personIndex: i,
          fullName: person.fullName ?? "",
          personType: person.personType === "CREW" ? "CREW" : "PASSENGER",
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
    [people, personData, tariffs, hotelIndex, plan]
  );

  const grandTotal = useMemo(
    () => reportRows.reduce((s, r) => s + toNum(r.foodCost) + toNum(r.accommodationCost), 0),
    [reportRows]
  );

  const filteredReportPeople = useMemo(() => {
    if (!reportSearch.trim()) return people.map((p, i) => ({ person: p, index: i }));
    const q = reportSearch.trim().toLowerCase();
    return people
      .map((p, i) => ({ person: p, index: i }))
      .filter(({ person }) => (person.fullName || "").toLowerCase().includes(q));
  }, [people, reportSearch]);

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
      notifyError("Укажите ФИО гостя");
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
          },
        },
      });
      success("Гость добавлен");
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
      notifyError("Укажите ФИО гостя");
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
    const ok = await confirm("Удалить запись о госте?");
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
      success(relocateState.indices.length > 1 ? `Переселено: ${relocateState.indices.length}` : "Гость переселён");
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
      success(evictState.indices.length > 1 ? `Выселено: ${evictState.indices.length}` : "Гость выселен");
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
      // Бекенд не хранит тарифы отдельно — восстанавливает их на загрузке из
      // уникальных ценовых ключей строк отчёта. Чтобы непривязанные тарифы
      // не терялись, добавляем «теневые» строки (пустой ФИО — не отображаются
      // как гость, но восстанавливаются тарифной инференцией).
      const usedTariffIds = new Set(
        Object.values(personData)
          .map((pd) => pd?.tariffId)
          .filter(Boolean)
      );
      const ghostRows = tariffs
        .filter((t) => !t.draft && !usedTariffIds.has(t.id))
        .map((t) => ({
          fullName: "",
          roomNumber: "",
          roomCategory: t.name || "",
          roomKind: "",
          daysCount: 0,
          breakfast: toNum(t.breakfast),
          lunch: toNum(t.lunch),
          dinner: toNum(t.dinner),
          foodCost: toNum(t.foodCost),
          accommodationCost: toNum(t.accommodationCost),
        }));

      const rowsForSave = [
        ...reportRows.map((row) => ({
          fullName: row.fullName,
          roomNumber: row.roomNumber,
          roomCategory: row.roomCategory,
          roomKind: row.roomKind,
          daysCount: toNum(row.daysCount),
          breakfast: toNum(row.breakfast),
          lunch: toNum(row.lunch),
          dinner: toNum(row.dinner),
          foodCost: toNum(row.foodCost),
          accommodationCost: toNum(row.accommodationCost),
        })),
        ...ghostRows,
      ];

      await saveReport({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          reportRows: rowsForSave,
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

  const handleExport = () => {
    const headers = [
      "ID", "ФИО", "Тип", "Номер", "Тариф", "Суток",
      "Завтрак", "Обед", "Ужин", "Ст-ть питания", "Ст-ть проживания", "Итого",
    ];
    const dataRows = reportRows.map((row, i) => [
      i + 1, row.fullName,
      PERSON_TYPE_CONFIG[row.personType === "CREW" ? "CREW" : "PASSENGER"].label,
      row.roomNumber, row.roomCategory, toNum(row.daysCount),
      toNum(row.breakfast), toNum(row.lunch), toNum(row.dinner),
      toNum(row.foodCost), toNum(row.accommodationCost),
      toNum(row.foodCost) + toNum(row.accommodationCost),
    ]);
    const aoa = [headers, ...dataRows, [], ["Итого:", grandTotal]];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Отчёт");
    const safe = (s) => String(s).replace(/[/\\?*[\]:]/g, "_").slice(0, 100);
    XLSX.writeFile(wb, `otchet-${safe(hotel?.name || "hotel")}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Guard ──
  if (!hotel) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>Гостиница не найдена</div>
      </div>
    );
  }

  const canMutateGuests = canEdit && !isExtHotel || (isExtHotel && canEdit);
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
          Гости
          <span className={classes.tabBadge}>{placed}</span>
        </button>
        <button
          type="button"
          className={`${classes.tab} ${activeTab === "tariffs" ? classes.tabActive : ""}`}
          onClick={() => setActiveTab("tariffs")}
        >
          Тарифы
          <span className={classes.tabBadge}>{tariffs.filter((t) => !t.draft).length}</span>
        </button>
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
                  <PlusSvg /> Добавить гостя
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

            <div className={classes.guestTable}>
              <div className={classes.tableHead}>
                {canMutateGuests && <div className={classes.colCheck} />}
                <div>Гость</div>
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
                    : "Гостей ещё нет"}
                </div>
              ) : (
                filteredPeople.map((p) => renderGuestRow(p))
              )}
            </div>
          </div>
        )}

        {activeTab === "tariffs" && (
          <div className={classes.tariffsPane}>
            <div className={classes.tariffsHead}>
              <p className={classes.tariffsHint}>
                Создайте тарифы с ценами — затем назначьте их гостям во вкладке «Отчёт».
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
                      placeholder="Название тарифа (напр. Стандарт 2-мест.)"
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
                          title="Применить этот тариф всем гостям"
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
                      ["accommodationCost", "Ст-ть проживания", true],
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
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "report" && (
          <div className={classes.reportPane}>
            <div className={classes.reportToolbar}>
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
              <span className={classes.spacer} />
                <button
                  type="button"
                  className={classes.secondaryBtn}
                  onClick={handleExport}
                  disabled={placed === 0}
                >
                  <DownloadIcon /> Excel
                </button>
              {canEdit && (
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
              <div className={classes.emptyRow}>Гости ещё не добавлены</div>
            ) : (
              <div className={classes.reportTableWrap}>
                <div className={classes.reportTableHead}>
                  <div>#</div>
                  <div>Гость</div>
                  <div>Номер</div>
                  <div className={classes.numRight}>Суток</div>
                  <div>Тариф</div>
                  <div className={classes.numRight}>Завтрак</div>
                  <div className={classes.numRight}>Обед</div>
                  <div className={classes.numRight}>Ужин</div>
                  <div className={classes.numRight}>Питание</div>
                  <div className={classes.numRight}>Проживание</div>
                  <div className={classes.numRight}>Итого</div>
                </div>
                <div className={classes.reportTableBody}>
                  {filteredReportPeople.map(({ person, index: i }, displayIdx) => {
                    const pd = personData[i] ?? emptyPD(person, hotelIndex, plan);
                    const computedFood =
                      toNum(pd.breakfast) + toNum(pd.lunch) + toNum(pd.dinner);
                    const total = computedFood + toNum(pd.accommodationCost);
                    const unbound = !pd.tariffId;
                    return (
                      <div
                        key={i}
                        className={`${classes.reportRow} ${unbound ? classes.reportRowUnbound : ""}`}
                      >
                        <div className={classes.cellIdx}>{displayIdx + 1}</div>
                        <div className={classes.reportCellName}>
                          <span
                            className={classes.avatar}
                            style={{
                              background: person.personType === "CREW" ? "#8B5CF6" : LIV,
                              width: 28,
                              height: 28,
                            }}
                          >
                            {initials(person.fullName)}
                          </span>
                          <span className={classes.reportName}>
                            {person.fullName || "—"}
                          </span>
                          {person.personType === "CREW" && (
                            <span className={classes.reportBadge}>
                              <PersonBadge type="CREW" />
                            </span>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            className={classes.cellInput}
                            value={pd.roomNumber ?? ""}
                            onChange={(e) =>
                              canEdit && updatePersonReport(i, "roomNumber", e.target.value)
                            }
                            readOnly={!canEdit}
                            placeholder="№"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            className={classes.cellInputNum}
                            value={pd.daysCount ? pd.daysCount : ""}
                            onChange={(e) =>
                              canEdit && updatePersonReport(i, "daysCount", e.target.value)
                            }
                            readOnly={!canEdit}
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
                            {tariffs.filter((t) => !t.draft).map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name || "Без названия"}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            min={0}
                            className={classes.cellInputNum}
                            value={pd.breakfast ? pd.breakfast : ""}
                            onChange={(e) =>
                              canEdit && updatePersonReport(i, "breakfast", e.target.value)
                            }
                            readOnly={!canEdit}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min={0}
                            className={classes.cellInputNum}
                            value={pd.lunch ? pd.lunch : ""}
                            onChange={(e) =>
                              canEdit && updatePersonReport(i, "lunch", e.target.value)
                            }
                            readOnly={!canEdit}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min={0}
                            className={classes.cellInputNum}
                            value={pd.dinner ? pd.dinner : ""}
                            onChange={(e) =>
                              canEdit && updatePersonReport(i, "dinner", e.target.value)
                            }
                            readOnly={!canEdit}
                          />
                        </div>
                        <div>
                          {(() => {
                            const computedFood =
                              toNum(pd.breakfast) + toNum(pd.lunch) + toNum(pd.dinner);
                            return (
                              <input
                                type="number"
                                min={0}
                                className={classes.cellInputNum}
                                value={computedFood ? computedFood : ""}
                                readOnly
                                title="Сумма завтрака, обеда и ужина"
                              />
                            );
                          })()}
                        </div>
                        <div>
                          <input
                            type="number"
                            min={0}
                            className={classes.cellInputNum}
                            value={pd.accommodationCost ? pd.accommodationCost : ""}
                            onChange={(e) =>
                              canEdit &&
                              updatePersonReport(i, "accommodationCost", e.target.value)
                            }
                            readOnly={!canEdit}
                          />
                        </div>
                        <div className={`${classes.numRight} ${classes.rowTotal}`}>
                          {total > 0 ? fmt(total) : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className={classes.reportFooter}>
                  <span className={classes.footerLabel}>
                    Гостей: <strong>{placed}</strong>
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
            : "Выселение гостя"
        }
        description="Укажите причину выселения. Это действие изменит статус гостя."
        reasonLabel="Причина *"
        placeholder="Укажите причину выселения..."
        confirmText={
          evictState && evictState.indices.length > 1 ? "Выселить всех" : "Выселить"
        }
        cancelText="Отмена"
        saving={saving}
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
            : "Переселение гостя"}
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
