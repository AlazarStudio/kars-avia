import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { InputMask } from "@react-input/mask";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Tooltip from "@mui/material/Tooltip";
import classes from "./FapHotelPage.module.css";
import { findPersonIndexForRow } from "../reports/reportRowMatch";
import {
  ADD_PASSENGER_REQUEST_HOTEL_PERSON,
  ADD_PASSENGER_REQUEST_HOTEL_PEOPLE,
  UPDATE_PASSENGER_REQUEST_HOTEL_PERSON,
  ASSIGN_PASSENGER_REQUEST_HOTEL_ROOM,
  RELOCATE_PASSENGER_REQUEST_HOTEL_PEOPLE,
  EVICT_PASSENGER_REQUEST_HOTEL_PEOPLE,
  SAVE_PASSENGER_REQUEST_HOTEL_REPORT,
  SUBMIT_PASSENGER_REQUEST_HOTEL_REPORT,
  HIDE_PASSENGER_REQUEST_HOTEL_REPORT,
  UPDATE_PASSENGER_REQUEST_HOTEL,
  GET_FAP_HOTEL_TARIFFS,
  GET_AIRLINE_TARIFS,
  getCookie,
} from "../../../../../graphQL_requests";
import { calculateCostDaysByDuration } from "../../../../utils/effectiveCostDays";
import { getPersonDays } from "../fapPersonDays.js";
import { hotelReportSubmittedAt, isHotelReportSubmitted } from "../fapReportAccess";
import { hotelOverbookedBy, livingNameCollisions } from "../fapLivingMismatch";
import HotelCapacityDialog from "../HotelCapacityDialog/HotelCapacityDialog";
import { isAirlineRole } from "../../../../utils/access";
import ScheduleIcon from "../../../../shared/icons/ScheduleIcon";
import { formatDateTime, normalizeCategory, PERSON_CATEGORY_OPTIONS, accommodationDiscountPercent, placementKindLabel } from "../fapConstants";
import CategoryBadge from "../CategoryBadge/CategoryBadge";
import FapSelect from "../FapSelect/FapSelect";
import {
  GROUP_KIND_CONFIG,
  buildGroupIndex,
  groupColor,
  groupDisplayLabel,
  groupOrder,
  requestGroups,
  roomKey,
} from "../fapGroups";
import {
  activeHotelRooms,
  buildRoomsIndex,
  matchHotelRoom,
  roomCapacity,
  roomCategoryLabel,
  roomOccupancy,
} from "../fapRooms";
import {
  pickAirlinePriceForAirport,
  airlinePriceToTariff,
  airlineTariffPricePerDay,
} from "../fapAirlineTariff.js";
import RoomNumberField from "../RoomNumberField/RoomNumberField";
import {
  computeFapGroupWarnings,
  groupWarningText,
  placementWarningText,
} from "../fapGroupWarnings";
import GroupChip from "../GroupChip/GroupChip";
import PlacementBadge from "../PlacementBadge/PlacementBadge";
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
import { downloadHotelReport } from "../reports/buildReportSheets";
import FapReportView from "../FapReportView/FapReportView";
import FapModeToggle from "../FapModeToggle/FapModeToggle";
import FapHeaderActions from "../FapHeaderActions/FapHeaderActions";

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
const BedSvg = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
    <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
    <path d="M12 4v6" />
    <path d="M2 17h20" />
  </svg>
);
const DoorSvg = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
    <path d="M2 20h20" />
    <path d="M14 12h.01" />
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
  // Разовая добавка к выбранным приёмам гостя (тумблеры в отчёте).
  lunchboxPrice: 0,
  // Формат начисления проживания: PER_BED (койко-место, за каждого) | PER_ROOM (номер, один раз).
  billingMode: "PER_BED",
  // Цена койко-места ЗА СУТКИ по видам размещения (1-местн/2-местн/...).
  placementPrices: [
    { places: 1, pricePerDay: 0 },
    { places: 2, pricePerDay: 0 },
  ],
  draft,
});

// Ручной выбор вида размещения: до десятиместного — выше категорий номеров нет.
const PLACEMENT_KIND_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
  value: String(n),
  label: placementKindLabel(n),
}));

// Цена за сутки тарифа для вида размещения.
// Тариф гостиницы (source === "hotel") — единая цена на любой вид.
// null → цена не определена (нет номера / нет цены для вида).
export const resolveTariffPricePerDay = (tariff, places, category = null) => {
  if (!tariff) return null;
  if (tariff.source === "hotel") return toNum(tariff.pricePerDay);
  if (tariff.source === "airline") return airlineTariffPricePerDay(tariff, places, category);
  if (!Number.isFinite(Number(places)) || Number(places) <= 0) return null;
  const row = (tariff.placementPrices ?? []).find((p) => Number(p.places) === Number(places));
  return row ? toNum(row.pricePerDay) : null;
};

const emptyPD = (person, hotelIndex, plan) => ({
  roomNumber: person?.roomNumber ?? "",
  daysCount: getPersonDays(person ?? {}, hotelIndex, plan),
  tariffId: null,
  breakfast: 0,
  lunch: 0,
  dinner: 0,
  breakfastCount: 1,
  lunchCount: 1,
  dinnerCount: 1,
  breakfastLunchbox: false,
  lunchLunchbox: false,
  dinnerLunchbox: false,
  lunchboxPrice: 0,
  lunchboxCount: 0,
  foodCost: 0,
  accommodationCost: 0,
  // null — скидка не переопределена: берётся дефолт возрастной категории.
  accommodationDiscount: null,
  // Снимок цены и вида размещения из сохранённой строки отчёта. У нового гостя
  // снимка нет; читается только у отправленного отчёта — см. getEffectiveRow.
  savedPricePerDay: null,
  savedPlacementKind: null,
});

// Ключи гостей для сопоставления personData (адресуется индексом) со списком people.
// Однофамильцы без personId различаются порядковым номером повтора.
const personRosterKeys = (list) => {
  const seen = new Map();
  return (list ?? []).map((p) => {
    if (p?.personId) return `id:${p.personId}`;
    const nm = (p?.fullName ?? "").trim().toLowerCase();
    const n = seen.get(nm) ?? 0;
    seen.set(nm, n + 1);
    return `nm:${nm}:${n}`;
  });
};

// Есть ли вообще сохранённая запись отчёта по гостинице: отправлять нечего,
// пока отчёт ни разу не сохранён — записи в базе просто нет.
const hasHotelReport = (request, hotelIndex) =>
  (request?.hotelReports ?? []).some(
    (r) => Number(r?.hotelIndex) === Number(hotelIndex)
  );

// Цена ланчбокса гостя: живой тариф приоритетнее снапшота в pd.
const lunchboxPriceFor = (pd, tariff) =>
  toNum(tariff ? tariff.lunchboxPrice : pd?.lunchboxPrice);

// Число ланчбоксов гостя: новое поле lunchboxCount; иначе легаси — число тумблеров.
const lunchboxCountOf = (pd) =>
  pd?.lunchboxCount != null
    ? toNum(pd.lunchboxCount)
    : (pd?.breakfastLunchbox ? 1 : 0) + (pd?.lunchLunchbox ? 1 : 0) + (pd?.dinnerLunchbox ? 1 : 0);

// Питание гостя: Σ(цена × кол-во приёма) + кол-во ланчбоксов × цена ланчбокса.
const computePdFood = (pd, tariff) =>
  toNum(pd?.breakfast) * toNum(pd?.breakfastCount) +
  toNum(pd?.lunch) * toNum(pd?.lunchCount) +
  toNum(pd?.dinner) * toNum(pd?.dinnerCount) +
  lunchboxCountOf(pd) * lunchboxPriceFor(pd, tariff);

// Разбивка питания для «?»-подсказки: цены в строке не показываем, всё — тут.
// rows: [метка, выражение, сумма]; выражение может быть пустым.
const foodHintData = (pd, tariff) => {
  const rows = [
    ["Завтрак", `${toNum(pd?.breakfastCount)} × ${fmt(toNum(pd?.breakfast))}`, fmt(toNum(pd?.breakfastCount) * toNum(pd?.breakfast))],
    ["Обед", `${toNum(pd?.lunchCount)} × ${fmt(toNum(pd?.lunch))}`, fmt(toNum(pd?.lunchCount) * toNum(pd?.lunch))],
    ["Ужин", `${toNum(pd?.dinnerCount)} × ${fmt(toNum(pd?.dinner))}`, fmt(toNum(pd?.dinnerCount) * toNum(pd?.dinner))],
  ];
  const lbc = lunchboxCountOf(pd);
  const lbPrice = lunchboxPriceFor(pd, tariff);
  if (lbc > 0 && lbPrice > 0) rows.push(["Ланчбокс", `${lbc} × ${fmt(lbPrice)}`, fmt(lbc * lbPrice)]);
  return {
    rows,
    total: fmt(computePdFood(pd, tariff)),
    // Ланчбоксы проставлены, а цены у тарифа нет — в сумму они не попадут, и строки
    // «Ланчбокс» выше в этом случае тоже нет. Без этого предупреждения ноль молчаливый:
    // диспетчер видит количество в поле и считает, что оно учтено. Цена ланчбокса есть
    // у ручного тарифа и у договорного (правится в его карточке), у гостиничного её нет.
    warn:
      lbc > 0 && lbPrice <= 0
        ? `Ланчбоксы (${lbc}) не посчитаны: у тарифа не задана цена ланчбокса`
        : null,
  };
};

// «?»-подсказка с расчётом — светлая карточка в стиле поповеров системы
// (фильтры, overflow-меню), через MUI Tooltip: портал не клипится
// скролл-контейнерами отчёта, показывается по наведению и по фокусу с клавиатуры.
const hintTooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: "#fff",
      color: "#2E355D",
      border: "1px solid #E4E4EF",
      borderRadius: "12px",
      padding: "10px 12px",
      fontFamily: "Inter, sans-serif",
      fontSize: "12px",
      maxWidth: 300,
      boxShadow: "0 10px 28px rgba(20, 30, 60, 0.14)",
    },
  },
};

function CalcHint({ rows, totalLabel, total, warn = null }) {
  return (
    <Tooltip
      placement="left"
      slotProps={hintTooltipSlotProps}
      title={
        <div className={classes.hintBody}>
          {warn ? <div className={classes.hintWarn}>⚠ {warn}</div> : null}
          {rows.map(([label, expr, sum]) => (
            <div key={label} className={classes.hintRow}>
              <span className={classes.hintLabel}>{label}</span>
              {expr ? <span className={classes.hintExpr}>{expr}</span> : null}
              <span className={classes.hintSum}>{sum}</span>
            </div>
          ))}
          <div className={classes.hintTotal}>
            <span>{totalLabel}</span>
            <span>{total} ₽</span>
          </div>
        </div>
      }
    >
      <span
        className={warn ? classes.foodHintWarn : classes.foodHint}
        tabIndex={0}
        aria-label={warn ? `Внимание: ${warn}` : `Расчёт: ${totalLabel}`}
      >
        {warn ? "⚠" : "?"}
      </span>
    </Tooltip>
  );
}

// Обёртка-тултип для ворнинга группы/требования: без текста отдаёт детей как есть
// (чтобы не добавлять лишнюю разметку в строку, когда нарушений нет).
function WarnTip({ text, children }) {
  if (!text) return children;
  return (
    <Tooltip title={text} slotProps={hintTooltipSlotProps}>
      <span className={classes.warnAnchor} tabIndex={0}>
        {children}
      </span>
    </Tooltip>
  );
}

const emptyForm = {
  fullName: "",
  phone: "",
  roomNumber: "",
  personType: "PASSENGER",
  airlinePersonalId: "",
  personCategory: "ADULT",
};


export default function FapHotelPage({
  request,
  hotelIndex,
  onRefetch,
  canEdit = true,
  showLinks = true,
  isExtHotel = false,
  showTariffs = true,
  user,
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

  // Батч «Присвоить номер…» выбранным гостям
  const [assignRoomOpen, setAssignRoomOpen] = useState(false);
  const [assignRoomValue, setAssignRoomValue] = useState("");

  // Report state
  const [tariffs, setTariffs] = useState([]);
  // Правки договорного тарифа, живущие только в этом отчёте: { [tariffId]: { billingMode, lunchboxPrice } }.
  // Ценник авиакомпании они не меняют — накладываются поверх мемо airlineTariffs
  // и сохраняются в теневой строке отчёта.
  const [airlineTariffOverrides, setAirlineTariffOverrides] = useState({});
  // То же самое для тарифов гостиницы, но только цена ланчбокса: в прайсе гостиницы
  // такого поля нет вовсе, а ланчбоксы гостю выдают. Тип тарифа сюда НЕ добавляем —
  // он менял бы расчёт проживания, а тут задача только про питание.
  const [hotelTariffOverrides, setHotelTariffOverrides] = useState({});
  const [personData, setPersonData] = useState({});
  // Ручной вид размещения номера: { [roomKey номера]: число мест }. Ключ — номер, а не
  // гость: при переезде гостя переопределение остаётся у комнаты.
  const [placementOverrides, setPlacementOverrides] = useState({});
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
  const [submitting, setSubmitting] = useState(false);
  const [capacityOpen, setCapacityOpen] = useState(false);

  // Refs хранят актуальное состояние для отложенного автосохранения —
  // дебаунс-таймер должен видеть последние значения, а не замороженные в замыкании.
  // `people` инициализируем пустым массивом: значение синхронизируется через useEffect ниже,
  // т.к. сама переменная `people` объявлена позже по коду.
  const tariffsRef = useRef(tariffs);
  // Договорный тариф — мемо (объявлен ниже), в ref его кладём эффектом:
  // buildReportRows читает тарифы только через refs.
  const airlineTariffsRef = useRef([]);
  // Тарифы гостиницы — тоже мемо; ref нужен теневым строкам в buildReportRows.
  const hotelTariffsRef = useRef([]);
  const personDataRef = useRef(personData);
  // buildReportRows читает состояние только через refs (он работает и на размонтировании).
  const placementOverridesRef = useRef({});
  const peopleRef = useRef([]);
  const saveTimerRef = useRef(null);
  // Промис сохранения, которое уже улетело на бэк. Отправка отчёта обязана его дождаться:
  // иначе его upsert придёт в базу ПОСЛЕ отправки, увидит изменившиеся строки и сбросит
  // только что поставленный флаг.
  const inFlightSaveRef = useRef(null);
  const reconciledKeyRef = useRef(null);
  // Заявка и гостиница, которым принадлежит текущий список тарифов. Отдельно от
  // reconciledKeyRef: тот обнуляется live-синком при чужой правке, а здесь нужно
  // именно «та же гостиница или другая» — маршрут при смене гостиницы компонент
  // не пересоздаёт, и черновик иначе уезжает за пользователем в чужую гостиницу.
  const tariffsKeyRef = useRef(null);
  // Снапшот ключей гостей — по нему personData переносится при сдвиге состава.
  const personKeysRef = useRef(null);
  // Снапшот строк, из которых собрано текущее состояние (реконсиляция) либо
  // ответ нашего последнего сейва — для live-подхвата чужих изменений (подписка).
  const lastAppliedRowsRef = useRef(null);
  const [remoteVersion, setRemoteVersion] = useState(0);
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
  const [assignRoom] = useMutation(ASSIGN_PASSENGER_REQUEST_HOTEL_ROOM, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [relocatePeople] = useMutation(RELOCATE_PASSENGER_REQUEST_HOTEL_PEOPLE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [evictPeople] = useMutation(EVICT_PASSENGER_REQUEST_HOTEL_PEOPLE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [saveReport] = useMutation(SAVE_PASSENGER_REQUEST_HOTEL_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [submitReport] = useMutation(SUBMIT_PASSENGER_REQUEST_HOTEL_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [hideReportMutation] = useMutation(HIDE_PASSENGER_REQUEST_HOTEL_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [updateHotel] = useMutation(UPDATE_PASSENGER_REQUEST_HOTEL, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  // ── Derived ──
  const people = hotel?.people ?? [];
  useEffect(() => { peopleRef.current = people; }, [people]);

  // Видимость отчёта авиакомпании: пока диспетчер не отправил — заглушка.
  const isAirline = isAirlineRole(user);
  const reportSubmittedAt = hotelReportSubmittedAt(request, hotelIndex);
  const reportSubmitted = isHotelReportSubmitted(request, hotelIndex);
  const reportHidden = isAirline && !reportSubmitted;
  const hasSavedReport = hasHotelReport(request, hotelIndex);

  const { data: hotelTariffData, loading: hotelTariffLoading } = useQuery(
    GET_FAP_HOTEL_TARIFFS,
    { variables: { id: hotel?.hotelId }, skip: !hotel?.hotelId }
  );

  const airlineId = request?.airline?.id ?? null;
  const requestAirportId = request?.airport?.id ?? null;

  const { data: airlinePricesData, loading: airlinePricesLoading } = useQuery(GET_AIRLINE_TARIFS, {
    variables: { airlineId },
    skip: !airlineId || !requestAirportId,
    fetchPolicy: "cache-first",
  });

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
        // Поверх прайса гостиницы — правки отчёта (цена ланчбокса). Прайс не меняют.
        ...(hotelTariffOverrides[rk.id] ?? {}),
      }));
  }, [hotelTariffData, hotelTariffOverrides]);
  useEffect(() => { hotelTariffsRef.current = hotelTariffs; }, [hotelTariffs]);

  // Договорный тариф авиакомпании: ценник с типом «ФАП»/«Все типы» по аэропорту заявки.
  // Подходящий ценник может быть только один — гарантируется правилами конфликтов.
  const airlineTariffs = useMemo(() => {
    const price = pickAirlinePriceForAirport(
      airlinePricesData?.airline?.prices,
      requestAirportId
    );
    const tariff = airlinePriceToTariff(price);
    if (!tariff) return [];
    // Поверх ценника — правки отчёта (тип тарифа, цена ланчбокса).
    return [{ ...tariff, ...(airlineTariffOverrides[tariff.id] ?? {}) }];
  }, [airlinePricesData, requestAirportId, airlineTariffOverrides]);
  useEffect(() => { airlineTariffsRef.current = airlineTariffs; }, [airlineTariffs]);

  const hotelTariffsReady = !hotel?.hotelId || !hotelTariffLoading;
  const airlineTariffsReady = !airlineId || !requestAirportId || !airlinePricesLoading;

  // Реальный номерной фонд гостиницы (если привязана и есть номера).
  const hotelRoomsRaw = hotelTariffData?.hotel?.rooms;
  const activeRooms = useMemo(() => activeHotelRooms(hotelRoomsRaw), [hotelRoomsRaw]);
  const roomsIndex = useMemo(() => buildRoomsIndex(hotelRoomsRaw), [hotelRoomsRaw]);
  const roomOccupancyMap = useMemo(
    () => roomOccupancy(people.map((p) => p.roomNumber)),
    [people]
  );

  const findTariff = useCallback(
    (id) =>
      tariffs.find((t) => t.id === id) ||
      airlineTariffs.find((t) => t.id === id) ||
      hotelTariffs.find((t) => t.id === id) ||
      null,
    [tariffs, airlineTariffs, hotelTariffs]
  );

  // Ref на findTariff: buildReportRows читает состояние только через refs, но искать
  // тариф обязан в ТЕХ ЖЕ трёх источниках, что и экран. Пока он искал только среди
  // ручных, у гостя на договорном тарифе в сохранённую строку уходила цена ланчбокса
  // из pd (всегда 0) — на экране сумма была верной, а в строке, Excel и аналитике нет.
  const findTariffRef = useRef(findTariff);
  useEffect(() => { findTariffRef.current = findTariff; }, [findTariff]);

  // Опции селекта тарифа: три источника отдельными группами — так же, как было
  // в нативных <optgroup>.
  const tariffOptions = useMemo(() => {
    const opts = [{ value: "", label: "Выбрать тариф" }];
    const push = (groupLabel, list) => {
      if (!list.length) return;
      opts.push({ groupLabel });
      list.forEach((t) => opts.push({ value: t.id, label: t.name || "Без названия" }));
    };
    push("По договору авиакомпании", airlineTariffs);
    push("Тарифы заявки", tariffs.filter((t) => !t.draft));
    push("Тарифы гостиницы", hotelTariffs);
    return opts;
  }, [airlineTariffs, tariffs, hotelTariffs]);

  const reportGroups = useMemo(() => {
    const groups = [];
    const byRoom = new Map();
    people.forEach((person, i) => {
      const pd = personData[i] ?? emptyPD(person, hotelIndex, plan);
      const room = roomKey(pd.roomNumber);
      const member = {
        person,
        index: i,
        pd,
        food: computePdFood(pd, findTariff(pd.tariffId)),
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

  // Единый источник вида размещения номера. Приоритет: ручное переопределение →
  // вместимость реального номера из фонда → число гостей в номере. Его читают и
  // бейдж в шапке, и расчёт цены — иначе шапка расходится с тем, что оплачивается.
  // Отдаёт по номеру пару { kind, auto }: kind — то, по чему считается цена, auto — то,
  // что получилось бы без ручного выбора (нужно для подписи пункта «Авто»). Обе величины
  // выводятся здесь и только здесь, иначе подпись и цена снова разъедутся.
  const placementKindByRoom = useMemo(() => {
    const map = {};
    reportGroups.forEach((g) => {
      if (g.noRoom) return;
      const override = Number(placementOverrides[g.roomNumber]) || null;
      // У ОТПРАВЛЕННОГО отчёта вид размещения берётся из сохранённой строки, а не
      // выводится заново: иначе смена вместимости в фонде гостиницы или выселение
      // соседа перецифровывают уже отправленный отчёт. Подставляем именно в `auto`,
      // а не только в `kind`: подпись пункта «Авто» обязана называть ту величину,
      // по которой реально считаются деньги (см. коммент выше).
      const pinned = reportSubmitted
        ? g.members.find((m) => Number(m.pd?.savedPlacementKind) > 0)?.pd
            ?.savedPlacementKind ?? null
        : null;
      const auto =
        pinned ??
        roomCapacity(matchHotelRoom(g.roomNumber, roomsIndex)) ??
        g.members.length;
      map[g.roomNumber] = { kind: override ?? auto, auto };
    });
    return map;
  }, [reportGroups, roomsIndex, placementOverrides, reportSubmitted]);

  // Вид размещения гостя — вид его номера; null — гость без номера.
  const roomKindByIndex = useMemo(() => {
    const map = {};
    reportGroups.forEach((g) => {
      g.members.forEach((m) => {
        map[m.index] = g.noRoom ? null : placementKindByRoom[g.roomNumber]?.kind ?? null;
      });
    });
    return map;
  }, [reportGroups, placementKindByRoom]);

  // Категория реального номера гостя (люкс/студия/N-местный) — ключ цены договорного
  // тарифа. null, если номер не сопоставлен с фондом гостиницы.
  const roomCategoryByIndex = useMemo(() => {
    const map = {};
    reportGroups.forEach((g) => {
      const room = g.noRoom ? null : matchHotelRoom(g.roomNumber, roomsIndex);
      g.members.forEach((m) => {
        map[m.index] = room?.category ?? null;
      });
    });
    return map;
  }, [reportGroups, roomsIndex]);

  // Несущий гость номера = первый гость номера, у которого назначен тариф; его тариф
  // задаёт режим начисления проживания для ВСЕГО номера (спека §4: «берётся тариф
  // несущего гостя»). perRoom=true → проживание начисляется один раз на несущего.
  const roomBillingByIndex = useMemo(() => {
    const map = {};
    reportGroups.forEach((g) => {
      const carrier = g.members.find((m) => findTariff(m.pd.tariffId));
      const carrierTariff = carrier ? findTariff(carrier.pd.tariffId) : null;
      const perRoom = carrierTariff?.billingMode === "PER_ROOM";
      g.members.forEach((m) => {
        map[m.index] = { carrierIndex: carrier ? carrier.index : null, perRoom };
      });
    });
    return map;
  }, [reportGroups, findTariff]);

  // Эффективные значения строки гостя. Для гостя с тарифом проживание —
  // ПРОИЗВОДНОЕ: цена за сутки (по виду размещения) × сутки. Без тарифа —
  // ручное значение pd.accommodationCost (как раньше).
  const getEffectiveRow = useCallback(
    (personIndex, pd) => {
      // ОТПРАВЛЕННЫЙ отчёт — документ: цена за сутки и вид размещения берутся из
      // сохранённой строки, а не выводятся заново. Без этого правка прайса
      // гостиницы, договора АК или номерного фонда меняла суммы уже отправленного
      // отчёта без единого действия пользователя — проверено на стенде: номер
      // сматчился с фондом другой вместимости, и отчёт потерял 6000 при обычном
      // сохранении. У черновика поведение прежнее, живой пересчёт: пока отчёт
      // заполняют, он обязан следовать за тарифами. Переключается само — любая
      // правка строк гасит отметку отправки (report.resolver.js), а сохранение,
      // ничего не изменившее, её сохраняет.
      // Вид размещения пиннится НЕ здесь, а в placementKindByRoom — он принадлежит
      // номеру, и подпись в шапке обязана называть ту же величину, что оплачивается.
      const pinnedPrice = reportSubmitted ? pd.savedPricePerDay ?? null : null;
      const room = roomBillingByIndex[personIndex];
      // Режим «Номер» задаётся тарифом несущего гостя и распространяется на ВЕСЬ номер:
      // проживание начисляется один раз на несущего, остальные гости номера — 0,
      // независимо от их собственного тарифа (или его отсутствия).
      if (room?.perRoom) {
        const tariff = findTariff(pd.tariffId);
        const places = roomKindByIndex[personIndex] ?? null;
        if (room.carrierIndex !== personIndex) {
          return {
            tariffName: tariff?.name ?? "",
            placementKind: 0,
            pricePerDay: 0,
            accommodationCost: 0,
            warning: null,
            perRoomIncluded: true,
          };
        }
        // Несущий гость. Карта начислений — мемо предыдущего рендера, поэтому
        // тариф может быть уже снят (removeTariff чистит pd и синхронно зовёт
        // buildReportRows) — тогда падаем на ручное значение общей веткой ниже.
        if (tariff) {
          const price =
            pinnedPrice ??
            resolveTariffPricePerDay(tariff, places, roomCategoryByIndex[personIndex] ?? null);
          if (places == null) {
            return { tariffName: tariff.name ?? "", placementKind: 0, pricePerDay: 0, accommodationCost: 0, warning: "укажите номер" };
          }
          if (price == null) {
            return { tariffName: tariff.name ?? "", placementKind: places, pricePerDay: 0, accommodationCost: 0, warning: `нет цены (${placementKindLabel(places)})` };
          }
          // Один раз на номер, без возрастного коэфа.
          return { tariffName: tariff.name ?? "", placementKind: places, pricePerDay: price, accommodationCost: price * toNum(pd.daysCount), chargeFactor: 1, warning: null };
        }
      }

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
      const price =
        pinnedPrice ??
        resolveTariffPricePerDay(tariff, places, roomCategoryByIndex[personIndex] ?? null);
      if (places == null) {
        return { tariffName: tariff.name ?? "", placementKind: 0, pricePerDay: 0, accommodationCost: 0, warning: "укажите номер" };
      }
      if (price == null) {
        return { tariffName: tariff.name ?? "", placementKind: places, pricePerDay: 0, accommodationCost: 0, warning: `нет цены (${placementKindLabel(places)})` };
      }
      // Скидка на проживание: ручное значение строки, иначе дефолт возрастной категории
      // (инфант — бесплатно, ребёнок — 50%). Явный 0 — это скидка 0%, а не «авто».
      const discountPercent =
        pd.accommodationDiscount != null
          ? Math.min(100, Math.max(0, toNum(pd.accommodationDiscount)))
          : accommodationDiscountPercent(people[personIndex]?.personCategory);
      const chargeFactor = 1 - discountPercent / 100;
      return {
        tariffName: tariff.name ?? "",
        placementKind: places,
        pricePerDay: price,
        accommodationCost: price * toNum(pd.daysCount) * chargeFactor,
        chargeFactor,
        warning: null,
      };
    },
    [findTariff, roomKindByIndex, roomCategoryByIndex, roomBillingByIndex, people, reportSubmitted]
  );

  // Ref на getEffectiveRow: buildReportRows работает через refs (для флаш-сейва
  // при размонтировании), поэтому вызывает getEffectiveRowRef.current.
  const getEffectiveRowRef = useRef(getEffectiveRow);
  useEffect(() => { getEffectiveRowRef.current = getEffectiveRow; }, [getEffectiveRow]);
  useEffect(() => { placementOverridesRef.current = placementOverrides; }, [placementOverrides]);

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

  // ── Группы пассажиров ──
  // Всё производное считаем СТРОГО от документа заявки, а не от локальных инпутов:
  // пересчёт от вводимых значений пересоздаёт строки таблицы и уводит фокус
  // (та же причина, что у RoomNumberField с live=false в отчёте).
  const passengerGroups = useMemo(() => requestGroups(request), [request]);
  const groupIndex = useMemo(() => buildGroupIndex(request), [request]);
  const groupOrderMap = useMemo(() => groupOrder(request), [request]);

  // Ворнинги: W1/W2 (группа разнесена по гостиницам/номерам) и W3 (нарушено
  // требование вида размещения). Считаются от документа заявки — не от
  // локальных инпутов отчёта.
  const warnings = useMemo(() => computeFapGroupWarnings(request), [request]);

  // Состав групп внутри номера отчёта: какие группы представлены, сколько их
  // участников в этом номере и сколько гостей номера вне групп.
  // Гости без personId считаются «без группы» (инвариант спеки §5.3).
  const reportRoomGroups = useCallback(
    (members) => {
      const counts = new Map();
      let ungrouped = 0;
      (members ?? []).forEach((m) => {
        const pid = m?.person?.personId;
        const g = pid ? groupIndex.get(pid) : null;
        if (!g) {
          ungrouped += 1;
          return;
        }
        counts.set(g.groupId, (counts.get(g.groupId) ?? 0) + 1);
      });
      const list = passengerGroups
        .filter((g) => counts.has(g.groupId))
        .map((g) => ({
          group: g,
          inRoom: counts.get(g.groupId),
          total: (g.memberPersonIds ?? []).length,
        }));
      return { list, ungrouped };
    },
    [groupIndex, passengerGroups]
  );

  // Требование вида размещения — только чтение: редактируется в реестре.
  const placementByPersonId = useMemo(() => {
    const map = new Map();
    (request?.savedPassengers ?? []).forEach((sp) => {
      if (sp?.personId) map.set(sp.personId, sp.placementRequirement ?? null);
    });
    return map;
  }, [request]);

  // Состав группы для карточки-поповера чипа. Считаем один раз на группу:
  // раньше на каждую строку шёл линейный поиск по всему реестру.
  const groupMembersById = useMemo(() => {
    const nameByPersonId = new Map(
      (request?.savedPassengers ?? [])
        .filter((sp) => sp?.personId)
        .map((sp) => [sp.personId, sp.fullName || ""])
    );
    const map = new Map();
    passengerGroups.forEach((g) => {
      map.set(
        g.groupId,
        (g.memberPersonIds ?? []).map((pid) => ({
          personId: pid,
          fullName: nameByPersonId.get(pid) || "",
        }))
      );
    });
    return map;
  }, [request, passengerGroups]);

  // Где размещён человек по всей услуге: personId → { hotelIndex, hotelName }.
  const placedByPersonId = useMemo(() => {
    const map = new Map();
    (request?.livingService?.hotels ?? []).forEach((h, idx) => {
      (h?.people ?? []).forEach((p) => {
        if (p?.personId && !map.has(p.personId)) {
          map.set(p.personId, { hotelIndex: idx, hotelName: h?.name ?? "" });
        }
      });
    });
    return map;
  }, [request]);

  // Для пикера: размещённые в ЛЮБОЙ гостинице, КРОМЕ текущей (превентивный хинт W1).
  const placedElsewhere = useMemo(() => {
    const map = new Map();
    placedByPersonId.forEach((at, pid) => {
      if (at.hotelIndex !== Number(hotelIndex)) map.set(pid, at.hotelName);
    });
    return map;
  }, [placedByPersonId, hotelIndex]);

  // Контракт с CatalogPickerModal: { groups, groupIndex, placedElsewhere }.
  const groupContext = useMemo(
    () => ({ groups: passengerGroups, groupIndex, placedElsewhere }),
    [passengerGroups, groupIndex, placedElsewhere]
  );

  const handleCatalogConfirm = async (selected) => {
    if (!(await confirmOverCapacity(selected.length))) return;
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
  // Свободных мест больше не требуем: заселение сверх заявки разрешено, превышение
  // подтверждается диалогом и подсвечивается предупреждением.
  const isOverCapacity = totalCap > 0 && placed >= totalCap;
  const pct = totalCap > 0 ? Math.min(100, Math.round((placed / totalCap) * 100)) : 0;

  const overBy = hotelOverbookedBy(hotel);
  const collisionKeys = useMemo(() => {
    const keys = new Set();
    livingNameCollisions(request?.livingService).forEach((c) => {
      c.places.forEach((p) => {
        if (p.hotelIndex === Number(hotelIndex)) keys.add(p.personIndex);
      });
    });
    return keys;
  }, [request?.livingService, hotelIndex]);

  const passengersCount = people.filter((p) => p?.personType !== "CREW").length;
  const crewCount = placed - passengersCount;

  // Редактирование заявки из шапки закрыто на завершённой/отменённой услуге —
  // то же условие, что у страницы услуги (FapLivingPage).
  const livingFinished =
    request?.livingService?.status === "COMPLETED" ||
    request?.livingService?.status === "CANCELLED";

  const matchesMode = (p) => (p?.personType === "CREW" ? "CREW" : "PASSENGER") === personMode;
  const indexed = useMemo(() => people.map((p, idx) => ({ ...p, _idx: idx })), [people]);
  const filteredPeople = useMemo(() => {
    const byMode = indexed.filter(matchesMode);
    const q = search.trim().toLowerCase();
    const list = q
      ? byMode.filter(
          (p) =>
            (p.fullName ?? "").toLowerCase().includes(q) ||
            (p.phone ?? "").toLowerCase().includes(q) ||
            (p.roomNumber ?? "").toLowerCase().includes(q)
        )
      : byMode;
    // Порядок по умолчанию: сначала со связью (в группе), затем по алфавиту ФИО.
    return [...list].sort((a, b) => {
      const ga = a.personId && groupIndex.has(a.personId) ? 0 : 1;
      const gb = b.personId && groupIndex.has(b.personId) ? 0 : 1;
      if (ga !== gb) return ga - gb;
      return (a.fullName ?? "").localeCompare(b.fullName ?? "", "ru");
    });
  }, [indexed, search, personMode, groupIndex]);

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
    if (!(await confirmOverCapacity(selected.length))) return;
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

  const hasCrewAvailable = personMode !== "CREW" || availableCrew.length > 0;
  const canAdd = canEdit && hasCrewAvailable;

  // Одно подтверждение на ОПЕРАЦИЮ, а не на человека: пакетное добавление из реестра
  // спрашивает один раз на всю пачку.
  // Решаем по ИТОГУ операции, а не по состоянию до неё: пачка может начаться ниже
  // порога и пересечь его — молча этого допускать нельзя.
  const confirmOverCapacity = async (count) => {
    if (!(totalCap > 0 && placed + count > totalCap)) return true;
    return confirm({
      message: `Мест по заявке ${totalCap}, заселено ${placed}. Заселить ещё ${count === 1 ? "одного" : `${count} чел.`} сверх заявки?`,
      confirmText: "Заселить",
      cancelText: "Отмена",
      severity: "warning",
    });
  };

  // «Обновить по факту» из метрики занятости: приводит план мест к фактическому числу гостей.
  const handleSaveCapacity = async (newCount) => {
    try {
      setSaving(true);
      await updateHotel({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          hotel: {
            name: hotel?.name || "",
            peopleCount: newCount,
            address: hotel?.address || null,
            link: hotel?.link || null,
            hotelId: hotel?.hotelId || null,
          },
        },
      });
      setCapacityOpen(false);
      onRefetch?.();
      success("Количество мест обновлено");
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при обновлении гостиницы");
    } finally {
      setSaving(false);
    }
  };

  // ── Report initialization ──
  useEffect(() => {
    if (!request || !hotel) return;
    if (!hotelTariffsReady || !airlineTariffsReady) return;
    const reconcileKey = `${request?.id}:${hotelIndex}`;
    if (reconciledKeyRef.current === reconcileKey) return;
    reconciledKeyRef.current = reconcileKey;
    // Черновики принадлежат гостинице, в которой их начали: переносим их через
    // пересборку только если гостиница та же. При переходе в другую гостиницу
    // список тарифов собирается с нуля, как и раньше.
    const keepDrafts = tariffsKeyRef.current === reconcileKey;
    tariffsKeyRef.current = reconcileKey;
    // Состояние пересобирается под текущий состав — фиксируем ключи гостей,
    // иначе перенос personData по сдвигу индексов затрёт результат реконсиляции.
    personKeysRef.current = personRosterKeys(people);
    const saved = (request.hotelReports ?? []).find((r) => r.hotelIndex === Number(hotelIndex));
    const savedRows = saved?.reportRows ?? [];
    // Фиксируем, из чего собрано состояние — live-синк ниже сравнивает с этим снапшотом.
    lastAppliedRowsRef.current = JSON.stringify(savedRows);

    const priceKey = (r) =>
      [toNum(r.breakfast), toNum(r.lunch), toNum(r.dinner), toNum(r.foodCost), toNum(r.accommodationCost ?? r.legacyFlatAccommodation)].join("|");

    const matchHotelTariff = (row) => {
      const rowName = [row.roomCategory, row.roomKind].filter(Boolean).join(" / ");
      return (
        hotelTariffs.find((ht) => ht.name === rowName) ||
        airlineTariffs.find((at) => at.name === rowName) ||
        null
      );
    };

    if (savedRows.length > 0) {
      // 1) Новый формат: строки с tariffName → тариф собирается по имени,
      //    цены по видам — из пар (placementKind, pricePerDay).
      const byName = new Map();
      // Тарифы гостиницы не дублируем.
      const isHotelName = (nm) =>
        hotelTariffs.some((ht) => ht.name === nm) ||
        airlineTariffs.some((at) => at.name === nm);
      const ensureShell = (nm, r) => {
        if (!byName.has(nm)) {
          byName.set(nm, {
            ...newTariff(false),
            name: nm,
            breakfast: toNum(r.breakfast),
            lunch: toNum(r.lunch),
            dinner: toNum(r.dinner),
            foodCost: toNum(r.foodCost),
            lunchboxPrice: toNum(r.lunchboxPrice),
            placementPrices: [],
          });
        }
        return byName.get(nm);
      };
      // 1a) Теневые строки (пустой fullName) — единственный авторитетный источник
      //     таблицы цен по видам и meal-полей тарифа.
      //     Теневая строка договорного тарифа несёт только правки отчёта (тип тарифа,
      //     цена ланчбокса) — они уходят в оверлей, пользовательским тарифом такая
      //     строка не становится.
      const nextAirlineOverrides = {};
      const nextHotelOverrides = {};
      savedRows.forEach((r) => {
        const nm = (r.tariffName ?? "").trim();
        if (!nm || (r.fullName ?? "").trim()) return;
        const at = airlineTariffs.find((a) => a.name === nm);
        if (at) {
          nextAirlineOverrides[at.id] = {
            billingMode: (r.roomKind ?? "") === "PER_ROOM" ? "PER_ROOM" : "PER_BED",
            lunchboxPrice: toNum(r.lunchboxPrice),
          };
          return;
        }
        // Теневая строка тарифа гостиницы несёт только цену ланчбокса — она уходит
        // в оверлей; пользовательским тарифом такая строка не становится (как у АК).
        const ht = hotelTariffs.find((h) => h.name === nm);
        if (ht) {
          nextHotelOverrides[ht.id] = { lunchboxPrice: toNum(r.lunchboxPrice) };
          return;
        }
        if (isHotelName(nm)) return;
        const t = ensureShell(nm, r);
        if ((r.roomKind ?? "") === "PER_ROOM") t.billingMode = "PER_ROOM";
        const places = Number(r.placementKind) || 0;
        if (places > 0 && !t.placementPrices.some((p) => p.places === places)) {
          t.placementPrices.push({ places, pricePerDay: toNum(r.pricePerDay) });
        }
      });
      setAirlineTariffOverrides(nextAirlineOverrides);
      setHotelTariffOverrides(nextHotelOverrides);
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
        // Маркер режима из ghost-строк (roomKind==="PER_ROOM") — это НЕ имя вида размещения.
        const legacyRoomKind = (r.roomKind ?? "") === "PER_ROOM" ? "" : (r.roomKind || "");
        const hasName = (r.roomCategory || "").trim() || legacyRoomKind.trim();
        if (!hasName) return;
        if (matchHotelTariff(r)) return;
        const legacyName = [r.roomCategory, legacyRoomKind].filter(Boolean).join(" / ") || "";
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
      // Черновики переживают пересборку. Они существуют только на клиенте
      // (buildReportRows их не сериализует), поэтому собранный из сохранённых
      // строк массив их не содержит — и незаконченный тариф молча исчезал при
      // любой пересборке: сохранение соседнего тарифа, удаление тарифа или
      // сохранение отчёта другим клиентом. Воспроизведено на стенде.
      setTariffs((prev) =>
        keepDrafts ? [...restored, ...prev.filter((t) => t.draft)] : restored
      );

      const data = {};
      people.forEach((p, i) => {
        data[i] = emptyPD(p, hotelIndex, plan);
      });
      // Матчим строки отчёта к гостям: сначала по personId (стойко к переименованию
      // гостя), для старых строк без personId — по ФИО + порядок (consumed-сет).
      // roomNumber в условие сознательно не входит: номер в строке отчёта и у гостя —
      // два разных поля, их расхождение раньше давало «слетевший» тариф.
      const consumed = new Set();
      savedRows.forEach((row) => {
        // Пропускаем теневые строки тарифов (без ФИО) — они не привязаны к гостю.
        if (!(row.fullName ?? "").trim()) return;
        const idx = findPersonIndexForRow(people, row, consumed);
        if (idx < 0) return;
        consumed.add(idx);
        const k = priceKey(row);
        const nm = (row.tariffName ?? "").trim();
        const t =
          (nm &&
            (hotelTariffs.find((ht) => ht.name === nm) ||
              airlineTariffs.find((at) => at.name === nm) ||
              restored.find((tt) => tt.name === nm))) ||
          matchHotelTariff(row) ||
          restored.find((tt) => priceKey(tt) === k);
        data[idx] = {
          // Номер в отчёте развязан с гостем (см. коммент выше). Но если в отчёте
          // он пуст — дозаполняем текущей комнатой гостя из вкладки «Гости».
          roomNumber: (row.roomNumber ?? "").toString().trim() || (people[idx]?.roomNumber ?? ""),
          // Сохранённые сутки имеют приоритет над пересчитанными: поле «Сут.»
          // редактируемое, и раньше правка не переживала перезагрузку — при
          // открытии отчёт всегда пересчитывался из плана и затирал ручной ввод.
          // ⚠️ Порог «> 0» обязателен: бэк кладёт `daysCount: row.daysCount ?? 0`
          // (report.resolver.js), поэтому у строки, сохранённой клиентом без
          // этого поля, там окажется НОЛЬ, а не null. Без порога такая строка
          // навсегда осталась бы с нулём суток, то есть с нулевой стоимостью.
          // Размен, принятый вместе с приоритетом: отчёты, сохранённые до
          // перехода на правило по длительности, сохраняют прежние числа —
          // сохранённый отчёт ведёт себя как снимок, а не пересчитывается заново.
          daysCount:
            toNum(row.daysCount) > 0
              ? toNum(row.daysCount)
              : getPersonDays(people[idx], hotelIndex, plan),
          tariffId: t?.id ?? null,
          breakfast: toNum(row.breakfast),
          lunch: toNum(row.lunch),
          dinner: toNum(row.dinner),
          // Легаси-строки без количеств: 1 порция при цене > 0 — суммы сходятся.
          breakfastCount:
            row.breakfastCount != null ? toNum(row.breakfastCount) : (toNum(row.breakfast) > 0 ? 1 : 0),
          lunchCount:
            row.lunchCount != null ? toNum(row.lunchCount) : (toNum(row.lunch) > 0 ? 1 : 0),
          dinnerCount:
            row.dinnerCount != null ? toNum(row.dinnerCount) : (toNum(row.dinner) > 0 ? 1 : 0),
          breakfastLunchbox: !!row.breakfastLunchbox,
          lunchLunchbox: !!row.lunchLunchbox,
          dinnerLunchbox: !!row.dinnerLunchbox,
          lunchboxPrice: toNum(row.lunchboxPrice),
          lunchboxCount:
            row.lunchboxCount != null
              ? toNum(row.lunchboxCount)
              : (row.breakfastLunchbox ? 1 : 0) + (row.lunchLunchbox ? 1 : 0) + (row.dinnerLunchbox ? 1 : 0),
          foodCost: toNum(row.foodCost),
          accommodationCost: toNum(row.accommodationCost),
          // Легаси-строки поля не несут — там null, то есть дефолт по категории.
          accommodationDiscount:
            row.accommodationDiscount != null ? toNum(row.accommodationDiscount) : null,
          // Снимок цены и вида размещения. Порог «> 0» такой же, как у daysCount
          // и по той же причине: бэк кладёт `pricePerDay: row.pricePerDay ?? 0`
          // и `placementKind: row.placementKind ?? 0` (report.resolver.js), то
          // есть у строки, сохранённой без этих полей, там ноль, а не null.
          // Ноль здесь означает не «бесплатно», а «нечем пиннить»: у гостя без
          // номера и у соседа по номеру с тарифом «Номер» обе величины и так 0.
          savedPricePerDay: toNum(row.pricePerDay) > 0 ? toNum(row.pricePerDay) : null,
          savedPlacementKind:
            Number(row.placementKind) > 0 ? Number(row.placementKind) : null,
        };
      });
      setPersonData(data);
      // Переопределения вида размещения собираем по номеру комнаты: первое непустое
      // значение выигрывает. Теневые строки их не несут.
      const overrides = {};
      savedRows.forEach((row) => {
        const rk = roomKey(row.roomNumber);
        const places = Number(row.placementKindOverride) || 0;
        if (rk && places > 0 && overrides[rk] == null) overrides[rk] = places;
      });
      placementOverridesRef.current = overrides;
      setPlacementOverrides(overrides);
    } else {
      const data = {};
      people.forEach((p, i) => {
        data[i] = emptyPD(p, hotelIndex, plan);
      });
      setPersonData(data);
      // Та же защита черновиков: пустой отчёт — как раз тот момент, когда
      // дописывается первый тариф.
      setTariffs((prev) => (keepDrafts ? prev.filter((t) => t.draft) : []));
      setAirlineTariffOverrides({});
      placementOverridesRef.current = {};
      setPlacementOverrides({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id, hotelIndex, hotelTariffsReady, airlineTariffsReady, remoteVersion, airlineTariffs]);

  // Live-обновления: другой клиент сохранил отчёт (подписка → refetch наверху) —
  // принимаем удалённые строки повторной реконсиляцией, но ТОЛЬКО если у нас нет
  // несохранённых правок (иначе прежний last-write-wins). Собственный сейв
  // узнаём по совпадению снапшота с ответом мутации в persistReport.
  useEffect(() => {
    if (lastAppliedRowsRef.current === null) return; // до первой реконсиляции
    const saved = (request?.hotelReports ?? []).find((r) => r.hotelIndex === Number(hotelIndex));
    const incoming = JSON.stringify(saved?.reportRows ?? []);
    if (incoming === lastAppliedRowsRef.current) return;
    if (saveTimerRef.current || saving) return; // свои правки в полёте — не затираем
    reconciledKeyRef.current = null;
    setRemoteVersion((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.hotelReports]);

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
          personId: "",
          roomNumber: "",
          roomCategory: t.name || "",
          roomKind: t.billingMode === "PER_ROOM" ? "PER_ROOM" : "",
          daysCount: 0,
          breakfast: toNum(t.breakfast),
          lunch: toNum(t.lunch),
          dinner: toNum(t.dinner),
          breakfastCount: 0,
          lunchCount: 0,
          dinnerCount: 0,
          breakfastLunchbox: false,
          lunchLunchbox: false,
          dinnerLunchbox: false,
          lunchboxCount: 0,
          // Теневая строка несёт цену ланчбокса тарифа — восстанавливается при загрузке.
          lunchboxPrice: toNum(t.lunchboxPrice),
          foodCost: toNum(t.breakfast) + toNum(t.lunch) + toNum(t.dinner),
          accommodationCost: 0,
          tariffName: t.name || "",
          pricePerDay: toNum(pp.pricePerDay),
          placementKind: Number(pp.places) || 0,
          placementKindOverride: null,
          accommodationDiscount: null,
        }))
      );
    // Теневая строка договорного тарифа — одна на тариф: цен по видам у него нет
    // (они берутся из категорий ценника АК), она хранит только правки отчёта —
    // тип тарифа (roomKind) и цену ланчбокса.
    const airlineGhostRows = (airlineTariffsRef.current ?? []).map((t) => ({
      fullName: "",
      personId: "",
      roomNumber: "",
      roomCategory: t.name || "",
      roomKind: t.billingMode === "PER_ROOM" ? "PER_ROOM" : "",
      daysCount: 0,
      breakfast: toNum(t.breakfast),
      lunch: toNum(t.lunch),
      dinner: toNum(t.dinner),
      breakfastCount: 0,
      lunchCount: 0,
      dinnerCount: 0,
      breakfastLunchbox: false,
      lunchLunchbox: false,
      dinnerLunchbox: false,
      lunchboxCount: 0,
      lunchboxPrice: toNum(t.lunchboxPrice),
      foodCost: toNum(t.breakfast) + toNum(t.lunch) + toNum(t.dinner),
      accommodationCost: 0,
      tariffName: t.name || "",
      pricePerDay: 0,
      placementKind: 0,
      placementKindOverride: null,
      accommodationDiscount: null,
    }));
    // Теневая строка тарифа гостиницы — только когда в отчёте задали цену ланчбокса
    // (в прайсе гостиницы такого поля нет, хранить больше нечего). Без фильтра каждый
    // отчёт получал бы по строке на КАЖДЫЙ вид номера гостиницы — мусор в reportRows.
    const hotelGhostRows = (hotelTariffsRef.current ?? [])
      .filter((t) => toNum(t.lunchboxPrice) > 0)
      .map((t) => ({
        fullName: "",
        personId: "",
        roomNumber: "",
        roomCategory: t.name || "",
        // Пусто: режим начисления у гостиничного тарифа не переопределяется.
        roomKind: "",
        daysCount: 0,
        breakfast: toNum(t.breakfast),
        lunch: toNum(t.lunch),
        dinner: toNum(t.dinner),
        breakfastCount: 0,
        lunchCount: 0,
        dinnerCount: 0,
        breakfastLunchbox: false,
        lunchLunchbox: false,
        dinnerLunchbox: false,
        lunchboxCount: 0,
        lunchboxPrice: toNum(t.lunchboxPrice),
        foodCost: toNum(t.breakfast) + toNum(t.lunch) + toNum(t.dinner),
        accommodationCost: 0,
        tariffName: t.name || "",
        pricePerDay: 0,
        placementKind: 0,
        placementKindOverride: null,
        accommodationDiscount: null,
      }));
    const personRows = currentPeople.map((person, i) => {
      const pd = currentPersonData[i] ?? emptyPD(person, hotelIndex, plan);
      const eff = getEffectiveRowRef.current(i, pd);
      // Все три источника, как на экране (см. коммент у findTariffRef).
      const tariff = findTariffRef.current(pd.tariffId);
      return {
        fullName: person.fullName ?? "",
        personId: person.personId ?? "",
        roomNumber: pd.roomNumber ?? "",
        roomCategory: eff.tariffName,   // legacy-совместимость (ФАП v1, старый Excel)
        roomKind: "",
        daysCount: toNum(pd.daysCount),
        breakfast: toNum(pd.breakfast),
        lunch: toNum(pd.lunch),
        dinner: toNum(pd.dinner),
        breakfastCount: toNum(pd.breakfastCount),
        lunchCount: toNum(pd.lunchCount),
        dinnerCount: toNum(pd.dinnerCount),
        breakfastLunchbox: !!pd.breakfastLunchbox,
        lunchLunchbox: !!pd.lunchLunchbox,
        dinnerLunchbox: !!pd.dinnerLunchbox,
        // Применённая цена ЛБ — снапшот для чтения сохранённых строк (Excel-сводка).
        lunchboxPrice: lunchboxPriceFor(pd, tariff),
        lunchboxCount: toNum(pd.lunchboxCount),
        foodCost: computePdFood(pd, tariff),
        accommodationCost: toNum(eff.accommodationCost),
        // Легаси-flat строку держим в legacy-полосе восстановления (roomCategory),
        // иначе на следующем restore она попадёт в byName-путь (без legacyFlatAccommodation)
        // и проживание пересчитается в 0 — потеря суммы.
        tariffName: eff.isLegacyFlat ? "" : eff.tariffName,
        pricePerDay: toNum(eff.pricePerDay),
        placementKind: Number(eff.placementKind) || 0,
        // Переопределение принадлежит комнате: пишем то, что стоит у ТЕКУЩЕЙ комнаты гостя,
        // поэтому при переезде старое значение за ним не тянется.
        placementKindOverride:
          placementOverridesRef.current[roomKey(pd.roomNumber)] ?? null,
        accommodationDiscount:
          pd.accommodationDiscount != null ? toNum(pd.accommodationDiscount) : null,
      };
    });
    return [...personRows, ...ghostRows, ...airlineGhostRows, ...hotelGhostRows];
  }, [hotelIndex, plan]);

  const persistReport = useCallback(async () => {
    if (!request?.id) return;
    // Промис объявлен вне try, чтобы finally сбрасывал ref только если там всё ещё
    // ЭТОТ сейв: при перекрытии двух сохранений завершение раннего иначе обнулило бы
    // ссылку на более поздний, и отправка снова обогнала бы его.
    let p = null;
    try {
      setSaving(true);
      p = saveReport({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          reportRows: buildReportRows(),
        },
      });
      inFlightSaveRef.current = p;
      const res = await p;
      // Ответ мутации = как строки лежат в БД (бэк дополняет roomCategory и т.п.) —
      // live-синк узнает по нему наш собственный сейв и не будет пересобирать состояние.
      const savedRows = res?.data?.savePassengerRequestHotelReport?.reportRows;
      if (savedRows) lastAppliedRowsRef.current = JSON.stringify(savedRows);
      onRefetch?.();
    } catch (e) {
      notifyError("Ошибка при сохранении тарифа");
      console.error(e);
    } finally {
      if (inFlightSaveRef.current === p) inFlightSaveRef.current = null;
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

  // Гостя удалили/выселили из середины списка — индексы people сдвинулись, а
  // personData адресуется индексом. Без переноса данные (тариф, сутки, питание)
  // достались бы соседу, и автосейв записал бы их под чужим personId.
  // Реконсиляция сюда не приходит (она заперта reconciledKeyRef и hotelReports
  // при удалении гостя не меняется), поэтому переносим записи по ключу гостя.
  useEffect(() => {
    const keys = personRosterKeys(people);
    const prevKeys = personKeysRef.current;
    personKeysRef.current = keys;
    if (!prevKeys) return;
    // Список только дополнился в конец — прежние индексы не сдвинулись.
    const appendedOnly = keys.length >= prevKeys.length && prevKeys.every((k, i) => k === keys[i]);
    if (appendedOnly) return;
    const prevIndexByKey = new Map(prevKeys.map((k, i) => [k, i]));
    const prevPD = personDataRef.current;
    const next = {};
    people.forEach((person, i) => {
      const from = prevIndexByKey.get(keys[i]);
      next[i] =
        (from != null && prevPD[from]) || {
          ...emptyPD(person, hotelIndex, plan),
          tariffId: airlineTariffs[0]?.id ?? null,
        };
    });
    personDataRef.current = next;
    setPersonData(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, airlineTariffs]);

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
          next[i] = {
            ...emptyPD(person, hotelIndex, plan),
            tariffId: airlineTariffs[0]?.id ?? null,
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people.length, airlineTariffs]);

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
          const p = {
            ...nextPD[k],
            breakfast: toNum(updated.breakfast),
            lunch: toNum(updated.lunch),
            dinner: toNum(updated.dinner),
          };
          p.foodCost = computePdFood(p, updated);
          nextPD[k] = p;
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
  // Правка договорного тарифа: пишем в оверлей отчёта, ценник авиакомпании не трогаем.
  const updateAirlineTariff = useCallback((tariffId, field, value) => {
    setAirlineTariffOverrides((prev) => ({
      ...prev,
      [tariffId]: { ...(prev[tariffId] ?? {}), [field]: value },
    }));
    scheduleSave();
  }, [scheduleSave]);
  // Правка тарифа гостиницы: тот же оверлей отчёта, прайс гостиницы не трогаем.
  const updateHotelTariff = useCallback((tariffId, field, value) => {
    setHotelTariffOverrides((prev) => ({
      ...prev,
      [tariffId]: { ...(prev[tariffId] ?? {}), [field]: value },
    }));
    scheduleSave();
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
        const p = {
          ...base,
          tariffId,
          breakfast: toNum(t.breakfast),
          lunch: toNum(t.lunch),
          dinner: toNum(t.dinner),
          // Проживание не копируем — оно производное (getEffectiveRow).
        };
        p.foodCost = computePdFood(p, t);
        next[i] = p;
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
      const nextPd = {
        ...base,
        tariffId: tariffId || null,
        ...(t
          ? {
              // Проживание не копируем — оно производное (getEffectiveRow:
              // цена за сутки по виду размещения × сутки).
              breakfast: toNum(t.breakfast),
              lunch: toNum(t.lunch),
              dinner: toNum(t.dinner),
            }
          : {
              // Снятие привязки → обнуляем цены (и ланчбоксы — они принадлежат
              // тарифу), иначе остаются от прошлого тарифа.
              breakfast: 0,
              lunch: 0,
              dinner: 0,
              breakfastLunchbox: false,
              lunchLunchbox: false,
              dinnerLunchbox: false,
              lunchboxPrice: 0,
              lunchboxCount: 0,
              accommodationCost: 0,
            }),
      };
      nextPd.foodCost = computePdFood(nextPd, t);
      const next = { ...prev, [personIndex]: nextPd };
      personDataRef.current = next;
      setPersonData(next);
      scheduleSave();
    },
    [findTariff, scheduleSave, people, hotelIndex, plan]
  );
  // Массовое задание количеств приёмов («Кол-во всем» в тулбаре отчёта).
  // Пустое поле — этот приём не трогаем.
  const [bulkCounts, setBulkCounts] = useState({ b: "", l: "", d: "", lb: "" });
  // Массовая простановка приёмов переехала из тулбара в меню «⋯» — форма живёт в диалоге.
  const [bulkCountsOpen, setBulkCountsOpen] = useState(false);
  const applyBulkCounts = useCallback(() => {
    const patch = {};
    if (bulkCounts.b !== "") patch.breakfastCount = toNum(bulkCounts.b);
    if (bulkCounts.l !== "") patch.lunchCount = toNum(bulkCounts.l);
    if (bulkCounts.d !== "") patch.dinnerCount = toNum(bulkCounts.d);
    if (bulkCounts.lb !== "") patch.lunchboxCount = toNum(bulkCounts.lb);
    if (!Object.keys(patch).length) return;
    const next = { ...personDataRef.current };
    people.forEach((person, i) => {
      const base = next[i] ?? emptyPD(person, hotelIndex, plan);
      const p = { ...base, ...patch };
      p.foodCost = computePdFood(p, findTariff(p.tariffId));
      next[i] = p;
    });
    personDataRef.current = next;
    setPersonData(next);
    scheduleSave();
  }, [bulkCounts, people, hotelIndex, plan, scheduleSave, findTariff]);

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
      await assignRoom({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          personIndexes: [personIndex],
          roomNumber,
        },
      });
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Не удалось сохранить номер");
    }
  }, [people, request?.id, hotelIndex, assignRoom, onRefetch, notifyError]);

  const updatePersonReport = useCallback((personIndex, field, value) => {
    const prev = personDataRef.current;
    const cur =
      prev[personIndex] ?? emptyPD(people[personIndex], hotelIndex, plan);
    const updated = { ...cur, [field]: value };
    if (
      [
        "breakfast", "lunch", "dinner",
        "breakfastCount", "lunchCount", "dinnerCount",
        "breakfastLunchbox", "lunchLunchbox", "dinnerLunchbox",
        "lunchboxCount",
      ].includes(field)
    ) {
      updated.foodCost = computePdFood(updated, findTariff(updated.tariffId));
    }
    const nextAll = { ...prev, [personIndex]: updated };
    personDataRef.current = nextAll;
    setPersonData(nextAll);
    scheduleSave();
  }, [scheduleSave, people, hotelIndex, plan, findTariff]);

  // Ручной вид размещения номера. Пустое значение снимает переопределение (возврат к «Авто»).
  const setRoomPlacementKind = useCallback((roomNumber, value) => {
    const places = Number(value) || 0;
    // Ref обновляем синхронно, как остальные писатели файла: отложенный автосейв читает
    // состояние только через refs и не должен зависеть от того, случился ли рендер.
    const next = { ...placementOverridesRef.current };
    if (places > 0) next[roomNumber] = places;
    else delete next[roomNumber];
    placementOverridesRef.current = next;
    setPlacementOverrides(next);
    scheduleSave();
  }, [scheduleSave]);

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
          foodCost: computePdFood(pd, tariff),
          accommodationCost: toNum(pd.accommodationCost),
        };
      }),
    [people, personData, findTariff, hotelIndex, plan]
  );

  const grandTotal = useMemo(
    () => Object.values(groupTotals).reduce((s, gt) => s + toNum(gt.total), 0),
    [groupTotals]
  );

  // Предполётная сводка перед отправкой отчёта авиакомпании.
  //
  // Новых правил тут нет: собираются ровно те предупреждения, которые строка и так
  // показывает (warning из getEffectiveRow, ⚠ ланчбокса из foodHintData). Смысл в
  // том, чтобы диспетчер увидел их СУММОЙ до отправки: в отчёте на полсотни человек
  // одна строка без цены теряется, а отчёт уходит авиакомпании молча — до этой
  // проверки гвардов было два, «есть размещённые» и «сохранён».
  //
  // Номер с нулевой стоимостью считается по номерам, а не по гостям: при тарифе
  // «Номер» проживание начисляется один раз на несущего гостя, и нули у соседей —
  // норма, а не недочёт (замер стенда: 54 таких номера из 74).
  const submitIssues = useMemo(() => {
    let noPrice = 0;
    let lunchbox = 0;
    let zeroRooms = 0;
    let zeroGuests = 0;
    reportGroups.forEach((g) => {
      let roomMoney = 0;
      g.members.forEach((m) => {
        const eff = getEffectiveRow(m.index, m.pd);
        roomMoney += toNum(eff.accommodationCost) + toNum(m.food);
        // ⚠️ warning приходит ТОЛЬКО когда тариф выбран: у гостя вообще без
        // тарифа getEffectiveRow выходит раньше и warning не ставит. Поэтому
        // «ничего не начислено» ловится нулевым итогом ниже, а не warning'ом —
        // иначе самая населённая проблема (гость без тарифа) не попала бы в
        // сводку вовсе. Проверено на стенде: отчёт из четырёх таких гостей
        // давал единственный пункт «итог 0 ₽».
        if (eff.warning) noPrice += 1;
        if (foodHintData(m.pd, findTariff(m.pd.tariffId)).warn) lunchbox += 1;
      });
      // Гость без номера — сам себе номер: считаем его отдельно, чтобы в сводке
      // было видно, что это не «пустой номер», а неразмещённый человек.
      if (roomMoney === 0) {
        if (g.noRoom) zeroGuests += g.members.length;
        else zeroRooms += 1;
      }
    });
    const items = [];
    if (grandTotal === 0) items.push("итог отчёта — 0 ₽");
    if (zeroGuests > 0) items.push(`гостей без номера и без начислений: ${zeroGuests}`);
    if (zeroRooms > 0) items.push(`номеров с нулевой стоимостью: ${zeroRooms}`);
    if (noPrice > 0) items.push(`строк с предупреждением о цене: ${noPrice}`);
    if (lunchbox > 0) items.push(`строк с ланчбоксами без цены: ${lunchbox}`);
    return items;
  }, [reportGroups, getEffectiveRow, findTariff, grandTotal]);

  // Эффективные плановые сутки — та же величина, что и метрика «Суток» в шапке.
  const reportNights = useMemo(
    () =>
      plan?.plannedFromAt && plan?.plannedToAt
        ? calculateCostDaysByDuration(plan.plannedFromAt, plan.plannedToAt)
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
  // Колонку точек показываем только когда в заявке вообще есть группы: иначе
  // legacy-отчёт получил бы пунктирный кружок у каждого гостя (спека §5.4).
  const showReportGroupDots = passengerGroups.length > 0;

  const reportViewGroups = useMemo(
    () =>
      reportGroups
        .map((g) => {
        // Метки групп видны и в режиме «Просмотр» — в т.ч. авиакомпании (спека §5).
        // Ворнинги сюда НЕ передаём: read-only-роль их видеть не должна.
        const roomGroups = reportRoomGroups(g.members);
        // Тариф «Номер»: проживание — на номере, не на госте (число с несущего).
        const carrier = g.members.find((m) => findTariff(m.pd.tariffId));
        const perRoom = !!(carrier && roomBillingByIndex[carrier.index]?.perRoom);
        let accommodation = null;
        let accommodationWarning = null;
        if (perRoom) {
          const ce = getEffectiveRow(carrier.index, carrier.pd);
          if (ce.warning) accommodationWarning = ce.warning;
          else accommodation = toNum(ce.accommodationCost);
        }
        return {
        key: g.key,
        room: g.noRoom ? null : g.roomNumber,
        // Тот же единый источник, что и в режиме редактирования: авиакомпания видит
        // только этот экран, и вид размещения обязан совпадать с тем, что оплачено.
        kind: g.noRoom ? "" : placementKindLabel(placementKindByRoom[g.roomNumber]?.kind ?? 0),
        tariff: g.tariffName || "",
        total: groupTotals[g.key]?.total ?? 0,
        perRoom,
        accommodation,
        accommodationWarning,
        showDots: showReportGroupDots,
        groups: roomGroups.list.map(({ group, inRoom, total }) => ({
          group,
          index: groupOrderMap.get(group.groupId) ?? 0,
          members: groupMembersById.get(group.groupId) ?? [],
          inRoom,
          total,
        })),
        ungrouped: roomGroups.ungrouped,
        people: g.members.map((m) => {
          const mg = m.person.personId ? groupIndex.get(m.person.personId) : null;
          const eff = getEffectiveRow(m.index, m.pd);
          // Суффикс питания: «завтрак ×3 · обед ×3 · ланчбокс ×2» (нулевые опускаем).
          const mealParts = [];
          [
            ["breakfast", "breakfastCount", "завтрак"],
            ["lunch", "lunchCount", "обед"],
            ["dinner", "dinnerCount", "ужин"],
          ].forEach(([pf, cf, lbl]) => {
            if (toNum(m.pd[pf]) > 0 && toNum(m.pd[cf]) > 0) {
              mealParts.push(`${lbl} ×${toNum(m.pd[cf])}`);
            }
          });
          const lbc = lunchboxCountOf(m.pd);
          if (lbc > 0) mealParts.push(`ланчбокс ×${lbc}`);
          return {
            name: m.person.fullName || "—",
            category: normalizeCategory(m.person.personCategory),
            meal: toNum(m.food),
            mealSuffix: mealParts.join(" · "),
            living: eff.warning ? null : toNum(eff.accommodationCost),
            rate: toNum(eff.pricePerDay),
            nights: toNum(m.pd.daysCount),
            factor: eff.chargeFactor ?? 1,
            warning: eff.warning || null,
            included: !!eff.perRoomIncluded,
            groupColor: mg ? groupColor(mg, groupOrderMap.get(mg.groupId) ?? 0) : null,
            groupTitle: mg
              ? [GROUP_KIND_CONFIG[mg.kind]?.label, mg.label].filter(Boolean).join(" · ")
              : "",
          };
        }),
        };
      })
        // Номера со связью — наверх (порядок внутри стабилен); только показ.
        .sort((a, b) => ((a.groups?.length ? 0 : 1) - (b.groups?.length ? 0 : 1))),
    [
      reportGroups,
      groupTotals,
      getEffectiveRow,
      reportRoomGroups,
      roomBillingByIndex,
      placementKindByRoom,
      findTariff,
      groupIndex,
      groupOrderMap,
      groupMembersById,
      showReportGroupDots,
    ]
  );

  // Номер со связью = в нём есть хотя бы один гость из группы.
  const roomHasGroup = useCallback(
    (g) =>
      (g.fullMembers ?? g.members ?? []).some(
        (m) => m.person?.personId && groupIndex.has(m.person.personId)
      ),
    [groupIndex]
  );

  const visibleGroups = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    // fullMembers — исходный состав номера до поиска: бейдж вида размещения и
    // состав групп считаем по всему номеру, иначе шапка разойдётся с ценой,
    // которая всегда считается по полному составу.
    const withFull = reportGroups.map((g) => ({ ...g, fullMembers: g.members }));
    const filtered = q
      ? withFull
          .map((g) => ({ ...g, members: g.members.filter((m) => (m.person.fullName || "").toLowerCase().includes(q)) }))
          .filter((g) => g.members.length > 0)
      : withFull;
    // Номера со связью — наверх (порядок внутри стабилен); только показ.
    return [...filtered].sort(
      (a, b) => (roomHasGroup(a) ? 0 : 1) - (roomHasGroup(b) ? 0 : 1)
    );
  }, [reportGroups, reportSearch, roomHasGroup]);

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
    if (!(await confirmOverCapacity(1))) return;
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
    // Вместимость целевой гостиницы не проверяем: заселение сверх заявки разрешено,
    // значит и перебор надо иметь возможность перераспределить между гостиницами.
    // Превышение видно прямо в подписи опции селекта.
    try {
      setSaving(true);
      await relocatePeople({
        variables: {
          requestId: request.id,
          fromHotelIndex: Number(hotelIndex),
          toHotelIndex: Number(relocateTarget),
          personIndexes: relocateState.indices,
          reason: relocateReason,
        },
      });
      success(
        relocateState.indices.length > 1
          ? `Переселено: ${relocateState.indices.length}`
          : people[relocateState.indices[0]]?.personType === "CREW"
          ? "Член экипажа переселён"
          : "Пассажир переселён"
      );
      // Открытая правка гостя адресует его ПОЗИЦИЕЙ в people, а переселение её
      // сдвигает. Незакрытая форма после переселения гостя, стоящего выше по
      // сырому индексу, записывала ФИО и телефон ЧУЖОМУ гостю и переименовывала
      // его запись в реестре. Заметить нельзя: список отсортирован по алфавиту,
      // сырой порядок пользователю не виден.
      cancelEdit();
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
      await evictPeople({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          personIndexes: evictState.indices,
          reason,
        },
      });
      success(
        evictState.indices.length > 1
          ? `Выселено: ${evictState.indices.length}`
          : people[evictState.indices[0]]?.personType === "CREW"
          ? "Член экипажа выселен"
          : "Пассажир выселен"
      );
      // См. комментарий в handleRelocate: выселение сдвигает индексы так же.
      cancelEdit();
      setSelected([]);
      setEvictState(null);
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при выселении");
    } finally {
      setSaving(false);
    }
  };

  // ── Батч «Присвоить номер…» ──
  const openAssignRoom = () => {
    setAssignRoomValue("");
    setAssignRoomOpen(true);
  };
  const closeAssignRoom = () => {
    setAssignRoomOpen(false);
    setAssignRoomValue("");
  };
  const handleAssignRoom = async () => {
    if (selected.length === 0) return;
    const room = roomKey(assignRoomValue);
    if (!room) {
      notifyError("Укажите номер");
      return;
    }
    try {
      setSaving(true);
      await assignRoom({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          personIndexes: selected,
          roomNumber: room,
        },
      });
      success(`Номер присвоен: ${selected.length}`);
      setSelected([]);
      closeAssignRoom();
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при присвоении номера");
    } finally {
      setSaving(false);
    }
  };

  // ── Report save / export ──
  const handleSaveReport = async () => {
    if (!request?.id) return;
    setSaving(true);
    // Промис объявлен вне try — finally сбрасывает ref только если это всё ещё наш сейв
    // (см. тот же приём в persistReport).
    let p = null;
    try {
      p = saveReport({
        variables: {
          requestId: request.id,
          hotelIndex: Number(hotelIndex),
          reportRows: buildReportRows(),
        },
      });
      inFlightSaveRef.current = p;
      await p;
      onRefetch?.();
      success("Отчёт сохранён");
    } catch (e) {
      notifyError("Ошибка при сохранении");
      console.error(e);
    } finally {
      if (inFlightSaveRef.current === p) inFlightSaveRef.current = null;
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      // Авиакомпания не выгружает то, чего не видит.
      if (reportHidden) return;
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

  // Отправка и скрытие адресуют один и тот же отчёт — держим переменные в одном месте.
  const reportMutationVars = () => ({
    requestId: request.id,
    hotelIndex: Number(hotelIndex),
  });

  const handleSubmitReport = async () => {
    if (submitting) return;
    // Спрашиваем ДО автосейва: иначе отказ от отправки всё равно оставил бы
    // сохранение, а вопрос выглядел бы запоздалым.
    if (submitIssues.length > 0) {
      const go = await confirm({
        message: (
          <span>
            <span style={{ display: "block", marginBottom: 8 }}>
              Отчёт не досчитан. Авиакомпания увидит его как есть.
            </span>
            {submitIssues.map((item) => (
              <span key={item} style={{ display: "block" }}>
                • {item}
              </span>
            ))}
          </span>
        ),
        confirmText: "Всё равно отправить",
        cancelText: "Вернуться к отчёту",
        severity: "warning",
      });
      if (!go) return;
    }
    try {
      setSubmitting(true);
      // Отложенный автосейв обязан улететь ДО отправки: иначе он прилетит следом,
      // увидит изменившиеся строки и сбросит только что поставленный флаг.
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        await persistReport();
      }
      // Сейв мог уже улететь без дебаунса (кнопка «Сохранить отчёт») — дожидаемся его,
      // иначе он приземлится после отправки и сбросит флаг.
      if (inFlightSaveRef.current) {
        try {
          await inFlightSaveRef.current;
        } catch {
          // об ошибке сохранения пользователю сообщает сам сейв
        }
      }
      await submitReport({
        variables: reportMutationVars(),
      });
      success("Отчёт отправлен на проверку");
      onRefetch?.();
    } catch (e) {
      notifyError("Не удалось отправить отчёт");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHideReport = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await hideReportMutation({
        variables: reportMutationVars(),
      });
      success("Отчёт скрыт от авиакомпании");
      onRefetch?.();
    } catch (e) {
      notifyError("Не удалось скрыть отчёт");
      console.error(e);
    } finally {
      setSubmitting(false);
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

  // Занятость набранного номера в текущей гостинице (учитываются ВСЕ гости номера).
  const assignRoomOccupancy = roomKey(assignRoomValue)
    ? people.filter((p) => roomKey(p.roomNumber) === roomKey(assignRoomValue)).length
    : 0;

  // Группы, которые действие разделяет: у группы остаются РАЗМЕЩЁННЫЕ участники,
  // которых действие не затрагивает. Незаселённые участники нарушением не считаются.
  // toHotelIndex — целевая гостиница переселения (там участники не «разделяются»).
  const splitGroupsFor = (indices, toHotelIndex = null) => {
    const affectedIds = new Set(
      (indices ?? []).map((i) => people[i]?.personId).filter(Boolean)
    );
    if (affectedIds.size === 0) return [];
    const affectedGroups = new Map();
    affectedIds.forEach((pid) => {
      const g = groupIndex.get(pid);
      if (g) affectedGroups.set(g.groupId, g);
    });
    return [...affectedGroups.values()].filter((g) =>
      (g.memberPersonIds ?? []).some((pid) => {
        if (affectedIds.has(pid)) return false;
        const at = placedByPersonId.get(pid);
        if (!at) return false;
        if (toHotelIndex != null && at.hotelIndex === Number(toHotelIndex)) return false;
        return true;
      })
    );
  };

  const splitGroupsText = (list) => {
    if (!list || list.length === 0) return "";
    if (list.length === 1) {
      return `Внимание: разделяется группа „${groupDisplayLabel(list[0])}“`;
    }
    return `Внимание: разделяются группы: ${list
      .map((g) => `„${groupDisplayLabel(g)}“`)
      .join(", ")}`;
  };

  const evictSplitText = evictState ? splitGroupsText(splitGroupsFor(evictState.indices)) : "";
  const relocateSplitText = relocateState
    ? splitGroupsText(
        splitGroupsFor(
          relocateState.indices,
          relocateTarget === "" ? null : Number(relocateTarget)
        )
      )
    : "";

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
              <FapSelect
                accent={LIV}
                value={editForm.personCategory}
                onChange={(v) => setEditForm((f) => ({ ...f, personCategory: v }))}
                options={PERSON_CATEGORY_OPTIONS}
              />
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
          <RoomNumberField
            live
            className={classes.editInput}
            value={editForm.roomNumber}
            rooms={activeRooms}
            occupancy={roomOccupancyMap}
            onCommit={(v) => setEditForm((f) => ({ ...f, roomNumber: v }))}
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
    const group = p.personId ? groupIndex.get(p.personId) : null;
    const groupWarn = group ? warnings.byGroupId.get(group.groupId) : null;
    const groupWarnText = groupWarn ? groupWarningText(groupWarn) : "";
    const placementWarn = p.personId ? warnings.byPersonId.get(p.personId) : null;
    const placementWarnText = placementWarn ? placementWarningText(placementWarn) : "";
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
              {collisionKeys.has(p._idx) && (
                <span
                  className={classes.collisionMark}
                  title="Такое же ФИО есть ещё раз в этой заявке — проверьте, не заселён ли один человек дважды"
                >
                  ⚠
                </span>
              )}
              {/* Метка группы и требование размещения — только чтение (правятся в реестре) */}
              {group && (
                <WarnTip text={groupWarnText}>
                  <GroupChip
                    group={group}
                    index={groupOrderMap.get(group.groupId) ?? 0}
                    warn={!!groupWarn}
                    warnText={groupWarnText}
                    members={groupMembersById.get(group.groupId) ?? []}
                  />
                </WarnTip>
              )}
              {p.personId && (
                <WarnTip text={placementWarnText}>
                  <PlacementBadge
                    value={placementByPersonId.get(p.personId) ?? null}
                    violated={!!placementWarn}
                  />
                </WarnTip>
              )}
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
          <FapSelect
            accent={LIV}
            menuMinWidth={260}
            value={addForm.airlinePersonalId}
            onChange={(v) => {
              const member = crewRoster.find((m) => m.airlinePersonalId === v);
              setAddForm((f) => ({
                ...f,
                airlinePersonalId: v,
                fullName: member?.fullName ?? "",
                phone: member?.phone ?? "",
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
            value={addForm.fullName}
            onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))}
            placeholder="ФИО пассажира"
          />
        )}
      </div>
      <div className={classes.cellCategory}>
        {addForm.personType !== "CREW" ? (
          <FapSelect
            accent={LIV}
            value={addForm.personCategory}
            onChange={(v) => setAddForm((f) => ({ ...f, personCategory: v }))}
            options={PERSON_CATEGORY_OPTIONS}
          />
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
      <RoomNumberField
        live
        className={classes.editInput}
        value={addForm.roomNumber}
        rooms={activeRooms}
        occupancy={roomOccupancyMap}
        onCommit={(v) => setAddForm((f) => ({ ...f, roomNumber: v }))}
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
              {/* «заполнен» и «+N сверх заявки» — взаимоисключающие состояния:
                  при переборе предупреждение уже выводится под метрикой «Занятость». */}
              {isOverCapacity && overBy === 0 && (
                <span className={classes.fullBadge}>
                  <span className={classes.fullDot} />заполнен
                </span>
              )}
              {/* Статус отчёта живёт в шапке рядом с «заполнен», а не среди кнопок
                  тулбара: это состояние, а не действие. Тот же бейдж — на карточке
                  гостиницы в «Проживании». */}
              {canEdit && reportSubmitted && (
                <span
                  className={classes.headReportBadge}
                  title="Авиакомпания видит этот отчёт. Любая правка снова его скроет"
                >
                  Отчёт отправлен · {formatDateTime(reportSubmittedAt)}
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
          <FapHeaderActions
            request={request}
            user={user}
            canEdit={canEdit && !isExtHotel && !livingFinished}
            onRefetch={onRefetch}
            // Отчёт по этой гостинице — тот же экспорт, что у кнопки «Excel» на
            // вкладке отчёта (со сбросом отложенного автосейва). Без гостей
            // выгружать нечего — там кнопка по той же причине неактивна.
            onDownloadReport={handleExport}
            hideReport={placed === 0 || reportHidden}
          />
        </div>

        {/* Row 2 — metrics strip */}
        <div className={classes.headRow2}>
          <div className={classes.metric}>
            <span className={classes.metricLabel}>Занятость</span>
            <div className={classes.kpiRow}>
              <div className={classes.kpiValueRow}>
                <span
                  className={classes.kpiValue}
                  style={overBy > 0 ? { color: "#B45309" } : undefined}
                >
                  {placed}
                </span>
                <span className={classes.kpiTotal}>/ {totalCap || 0}</span>
              </div>
              <div className={classes.kpiBar}>
                <div
                  className={classes.kpiBarFill}
                  style={{
                    width: `${overBy > 0 ? 100 : pct}%`,
                    ...(overBy > 0 ? { background: "#F59E0B" } : null),
                  }}
                />
              </div>
            </div>
            {overBy > 0 && (
              <div className={classes.overNote}>
                +{overBy} сверх заявки
                {/* Предупреждение видно и внешней гостинице, а правка числа мест — нет:
                    peopleCount это заказ диспетчера, гостиница сообщает только факт. */}
                {canEdit && !isExtHotel && (
                  <button
                    type="button"
                    className={classes.overFixBtn}
                    onClick={() => setCapacityOpen(true)}
                  >
                    Обновить по факту
                  </button>
                )}
              </div>
            )}
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
            const days = calculateCostDaysByDuration(a, b);
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
                // Тот же сброс, что у переключателя в FapDriverPage. Панель
                // массовых действий рисуется по одному только selected.length,
                // поэтому выделение, пережившее переход на другую вкладку,
                // показывало «Выбрано: 2» над списком экипажа, а «Выселить»
                // выселяло пассажиров, которых на экране нет.
                <PersonTypeToggle
                  value={personMode}
                  onChange={(v) => {
                    setPersonMode(v);
                    cancelEdit();
                    clearSel();
                    setSearch("");
                  }}
                />
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
                {canMutateGuests && (
                  <button type="button" className={classes.bulkBtn} onClick={openAssignRoom}>
                    <HotelBedIcon size={16} strokeWidth={2} /> Присвоить номер…
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
                  <div className={classes.tariffModeRow}>
                    <span className={classes.billingLabel}>Тип тарифа</span>
                    <div className={classes.billingSeg} role="group" aria-label="Тип тарифа">
                      <button
                        type="button"
                        className={`${classes.billingSegBtn} ${t.billingMode !== "PER_ROOM" ? classes.billingSegActive : ""}`}
                        onClick={() => canEdit && updateTariff(t.id, "billingMode", "PER_BED")}
                        disabled={!canEdit}
                        aria-pressed={t.billingMode !== "PER_ROOM"}
                      >
                        <BedSvg size={17} />
                        Койко-место
                      </button>
                      <button
                        type="button"
                        className={`${classes.billingSegBtn} ${t.billingMode === "PER_ROOM" ? classes.billingSegActive : ""}`}
                        onClick={() => canEdit && updateTariff(t.id, "billingMode", "PER_ROOM")}
                        disabled={!canEdit}
                        aria-pressed={t.billingMode === "PER_ROOM"}
                      >
                        <DoorSvg size={17} />
                        Номер
                      </button>
                    </div>
                  </div>
                  <div className={classes.tariffFields}>
                    {[
                      ["breakfast", "Завтрак"],
                      ["lunch", "Обед"],
                      ["dinner", "Ужин"],
                      ["lunchboxPrice", "Ланчбокс"],
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
                        <span className={classes.tariffFieldHead}>
                          <span className={classes.tariffFieldLabel}>
                            {placementKindLabel(pp.places)}, ₽/сутки
                          </span>
                          {canEdit && ppIdx >= 2 && (
                            <button
                              type="button"
                              className={classes.removeKindBtn}
                              title="Убрать вид размещения"
                              onClick={() => removeTariffPlacement(t.id, pp.places)}
                            >
                              ×
                            </button>
                          )}
                        </span>
                        <div className={classes.tariffInputWrap}>
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
            {airlineTariffs.length > 0 && (
              <>
                <div className={classes.tariffsHead} style={{ marginTop: 16 }}>
                  <p className={classes.tariffsHint}>
                    По договору авиакомпании — подставляется из ценника авиакомпании, доступен для назначения в «Отчёте».
                  </p>
                </div>
                {airlineTariffs.map((t) => (
                  <div key={t.id} className={classes.tariffCard}>
                    <div className={classes.tariffHead}>
                      <span className={classes.draftBadge} style={{ background: "#EAF1FB", color: "#0057C2" }}>
                        по договору авиакомпании
                      </span>
                      <input className={classes.tariffName} value={t.name ?? ""} readOnly />
                    </div>
                    {/* Тип тарифа и цена ланчбокса — свойства отчёта, ценник АК они не меняют. */}
                    <div className={classes.tariffModeRow}>
                      <span className={classes.billingLabel}>Тип тарифа</span>
                      <div className={classes.billingSeg} role="group" aria-label="Тип тарифа">
                        <button
                          type="button"
                          className={`${classes.billingSegBtn} ${t.billingMode !== "PER_ROOM" ? classes.billingSegActive : ""}`}
                          onClick={() => canEdit && updateAirlineTariff(t.id, "billingMode", "PER_BED")}
                          disabled={!canEdit}
                          aria-pressed={t.billingMode !== "PER_ROOM"}
                        >
                          <BedSvg size={17} />
                          Койко-место
                        </button>
                        <button
                          type="button"
                          className={`${classes.billingSegBtn} ${t.billingMode === "PER_ROOM" ? classes.billingSegActive : ""}`}
                          onClick={() => canEdit && updateAirlineTariff(t.id, "billingMode", "PER_ROOM")}
                          disabled={!canEdit}
                          aria-pressed={t.billingMode === "PER_ROOM"}
                        >
                          <DoorSvg size={17} />
                          Номер
                        </button>
                      </div>
                    </div>
                    <div className={classes.tariffFields}>
                      {[
                        ["breakfast", "Завтрак"],
                        ["lunch", "Обед"],
                        ["dinner", "Ужин"],
                        ["lunchboxPrice", "Ланчбокс", false, true],
                        ["foodCost", "Ст-ть питания", true],
                        ...Object.keys(t.categoryPrices ?? {}).map((cat) => [
                          `category:${cat}`,
                          roomCategoryLabel(cat),
                          true,
                        ]),
                      ].map(([key, label, accent, editable]) => {
                        const displayVal =
                          key === "foodCost"
                            ? toNum(t.breakfast) + toNum(t.lunch) + toNum(t.dinner)
                            : key.startsWith("category:")
                              ? t.categoryPrices?.[key.slice("category:".length)]
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
                                  editable && canEdit && updateAirlineTariff(t.id, key, e.target.value)
                                }
                                readOnly={!editable || !canEdit}
                                placeholder="0"
                                className={accent ? classes.tariffInputAccent : classes.tariffInput}
                              />
                              <span className={classes.tariffCurrency}>₽</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {Object.keys(t.categoryPrices ?? {}).length === 0 && (
                      <p className={classes.tariffsHint}>
                        В договоре не заполнена ни одна категория номера — стоимость проживания по нему считаться не будет.
                      </p>
                    )}
                  </div>
                ))}
              </>
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
                    {/* Цена ланчбокса — свойство отчёта: в прайсе гостиницы её нет,
                        поэтому поле редактируемое, а сам прайс не меняется. */}
                    <div className={classes.tariffFields}>
                      {[
                        ["breakfast", "Завтрак"],
                        ["lunch", "Обед"],
                        ["dinner", "Ужин"],
                        ["lunchboxPrice", "Ланчбокс", false, true],
                        ["foodCost", "Ст-ть питания", true],
                        ["pricePerDay", "Цена за сутки", true],
                      ].map(([key, label, accent, editable]) => {
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
                                  editable && canEdit && updateHotelTariff(t.id, key, e.target.value)
                                }
                                readOnly={!editable || !canEdit}
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
              ) : null
              // (
              //   <span
              //     style={{
              //       display: "inline-flex",
              //       alignItems: "center",
              //       gap: 6,
              //       height: 34,
              //       padding: "0 12px",
              //       borderRadius: 999,
              //       background: "var(--gray, #F1F4FB)",
              //       border: "1px solid var(--border, #E4E4EF)",
              //       fontSize: 12.5,
              //       fontWeight: 700,
              //       color: "var(--main-gray)",
              //     }}
              //   >
              //     <EyeIcon size={15} color="#545873" /> Только просмотр · авиакомпания
              //   </span>
              // )
              }
              {effectiveReportMode === "edit" && canEdit && placed > 0 && (
                <button
                  type="button"
                  className={classes.secondaryBtn}
                  onClick={() => setBulkCountsOpen(true)}
                  title="Задать количество приёмов всем гостям отчёта"
                >
                  <EditPencilIcon color="#545873" /> Кол-во всем
                </button>
              )}
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
              {effectiveReportMode === "edit" && canEdit &&
                (reportSubmitted ? (
                  <button
                    type="button"
                    className={classes.ghostBtn}
                    onClick={handleHideReport}
                    disabled={submitting}
                    title="Скрыть отчёт от авиакомпании"
                  >
                    {submitting ? "Скрываем…" : "Скрыть отчёт"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={classes.secondaryBtn}
                    onClick={handleSubmitReport}
                    disabled={submitting || saving || placed === 0 || !hasSavedReport}
                    title={
                      placed === 0
                        ? "Нет размещённых гостей"
                        : !hasSavedReport
                        ? "Сначала сохраните отчёт"
                        : "Открыть отчёт авиакомпании"
                    }
                  >
                    {submitting ? "Отправка…" : "Отправить на проверку"}
                  </button>
                ))}
            </div>

            {reportHidden ? (
              <div className={classes.reportPending}>
                <ScheduleIcon />
                <div className={classes.reportPendingTitle}>Отчёт формируется</div>
                <div className={classes.reportPendingText}>
                  Диспетчер ещё не отправил отчёт. Как только он будет готов,
                  он появится здесь.
                </div>
              </div>
            ) : placed === 0 ? (
              <div className={classes.emptyRow}>Пассажиры ещё не добавлены</div>
            ) : effectiveReportMode === "view" ? (
              <div className={classes.reportViewScroll}>
                <FapReportView summary={reportSummary} groups={reportViewGroups} />
              </div>
            ) : (
              <div className={classes.reportTableWrap}>
                <div className={classes.reportGroups}>
                  {visibleGroups.map((g) => {
                    const gTotal = groupTotals[g.key]?.total ?? 0;
                    const { list: roomGroupList, ungrouped: roomUngrouped } =
                      reportRoomGroups(g.fullMembers);
                    const shownGroups = roomGroupList.slice(0, 2);
                    const hiddenGroups = roomGroupList.length - shownGroups.length;
                    // Маркер нарушения требования размещения в номере.
                    // Авиакомпании ворнинги не показываем (спека §5) — таблица
                    // редактирования доступна только при canEdit.
                    const roomWarnText = canEdit
                      ? [
                          ...new Set(
                            g.members
                              .map((m) => warnings.byPersonId.get(m.person.personId))
                              .filter(Boolean)
                              .map(placementWarningText)
                          ),
                        ].join("; ")
                      : "";
                    // Тариф «Номер»: проживание принадлежит номеру, а не гостю —
                    // показываем на шапке. Число берём с несущего (у него оно
                    // начислено для сумм), у гостей в колонке будет «в номере».
                    const perRoomCarrier = g.fullMembers.find((m) => findTariff(m.pd.tariffId));
                    const roomPerRoom = !!(
                      perRoomCarrier && roomBillingByIndex[perRoomCarrier.index]?.perRoom
                    );
                    let roomAccCost = null;
                    let roomAccWarn = "";
                    if (roomPerRoom) {
                      const ce = getEffectiveRow(perRoomCarrier.index, perRoomCarrier.pd);
                      if (ce.warning) roomAccWarn = ce.warning;
                      else roomAccCost = ce.accommodationCost;
                    }
                    return (
                      <div key={g.key} className={`${classes.roomGroup} ${g.noRoom ? classes.roomGroupNoRoom : ""}`}>
                        <div className={classes.roomHead}>
                          <span className={classes.roomNo}>
                            {g.noRoom ? <span className={classes.noRoomBadge}>Без номера</span> : <>№ {g.roomNumber}</>}
                          </span>
                          {!g.noRoom &&
                            (() => {
                              // Показываем ровно то, по чему считается цена; авто-значение
                              // для подписи берём оттуда же, а не пересчитываем.
                              const effKind = placementKindByRoom[g.roomNumber]?.kind ?? 0;
                              const autoKind = placementKindByRoom[g.roomNumber]?.auto ?? 0;
                              const override = Number(placementOverrides[g.roomNumber]) || 0;
                              if (!canEdit) {
                                return placementKindLabel(effKind) ? (
                                  <span className={classes.roomKindBadge}>
                                    {placementKindLabel(effKind)}
                                  </span>
                                ) : null;
                              }
                              return (
                                <FapSelect
                                  size="pill"
                                  accent="#0057C2"
                                  className={classes.roomKindPick}
                                  menuMinWidth={180}
                                  value={override ? String(override) : ""}
                                  onChange={(v) => setRoomPlacementKind(g.roomNumber, v)}
                                  options={[
                                    {
                                      value: "",
                                      label: placementKindLabel(autoKind)
                                        ? `Авто (${placementKindLabel(autoKind)})`
                                        : "Авто",
                                    },
                                    ...PLACEMENT_KIND_CHOICES,
                                  ]}
                                  title={
                                    override
                                      ? `Вид размещения задан вручную. Автоматически — ${placementKindLabel(autoKind) || "не определён"}`
                                      : "Вид размещения определён автоматически"
                                  }
                                />
                              );
                            })()}
                          {g.tariffName && <span className={classes.roomCat}>{g.tariffName}</span>}
                          {shownGroups.map(({ group, inRoom, total }) => {
                            const gw = warnings.byGroupId.get(group.groupId);
                            return (
                              <span key={group.groupId} className={classes.roomGroupWrap}>
                                <GroupChip
                                  group={group}
                                  index={groupOrderMap.get(group.groupId) ?? 0}
                                  warn={canEdit && !!gw}
                                  warnText={gw ? groupWarningText(gw) : ""}
                                  members={groupMembersById.get(group.groupId) ?? []}
                                />
                                {inRoom < total && (
                                  <span className={classes.roomGroupMeta}>
                                    {inRoom} из {total}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                          {hiddenGroups > 0 && (
                            <span className={classes.roomGroupMeta}>+{hiddenGroups}</span>
                          )}
                          {roomGroupList.length > 0 && roomUngrouped > 0 && (
                            <span className={classes.roomGroupMeta}>
                              +{roomUngrouped} без группы
                            </span>
                          )}
                          {roomWarnText && (
                            <Tooltip title={roomWarnText} slotProps={hintTooltipSlotProps}>
                              <span className={classes.roomWarnBadge} tabIndex={0}>
                                ⚠ нарушено требование
                              </span>
                            </Tooltip>
                          )}
                          {roomPerRoom &&
                            (roomAccWarn ? (
                              <Tooltip title={roomAccWarn} slotProps={hintTooltipSlotProps}>
                                <span className={`${classes.roomAccPill} ${classes.roomAccPillWarn}`} tabIndex={0}>
                                  ⚠ проживание
                                </span>
                              </Tooltip>
                            ) : (
                              <span className={classes.roomAccPill}>
                                <HotelBedIcon size={13} strokeWidth={2} />
                                проживание {fmt(roomAccCost)}
                              </span>
                            ))}
                          <span className={classes.roomTotalVal} style={{ marginLeft: "auto" }}>
                            {gTotal > 0 ? fmt(gTotal) : "—"}
                          </span>
                        </div>
                        <div className={classes.memberColHead}>
                          {/* Тот же flex, что и в строке гостя: спейсер держит «ФИО» над колонкой точек */}
                          <span className={classes.reportCellName}>
                            {showReportGroupDots && <span className={classes.reportDotSpacer} />}
                            ФИО
                          </span>
                          <span>Номер</span>
                          <span>Тариф</span>
                          <span className={classes.numRight}>Сут.</span>
                          <span className={classes.numCenter}>Завтр.</span>
                          <span className={classes.numCenter}>Обед</span>
                          <span className={classes.numCenter}>Ужин</span>
                          <span className={classes.numCenter}>ЛБ</span>
                          <span className={classes.numRight}>Питание</span>
                          <span className={classes.numRight}>Скидка</span>
                          <span className={classes.numRight}>Прожив.</span>
                        </div>
                        {g.members.map((m) => {
                          const { person, index: i, pd } = m;
                          const unbound = !pd.tariffId;
                          const memberGroup = person.personId
                            ? groupIndex.get(person.personId)
                            : null;
                          return (
                            <div key={i} className={classes.memberRow}>
                              <div className={classes.reportCellName}>
                                {showReportGroupDots &&
                                  (memberGroup ? (
                                    <GroupChip
                                      group={memberGroup}
                                      index={groupOrderMap.get(memberGroup.groupId) ?? 0}
                                      compact
                                    />
                                  ) : (
                                    // Гость без группы: пустой кружок держит колонку ровной
                                    <span className={classes.reportDotEmpty} />
                                  ))}
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
                                <RoomNumberField
                                  value={pd.roomNumber}
                                  disabled={!canEdit}
                                  rooms={activeRooms}
                                  occupancy={roomOccupancyMap}
                                  className={classes.cellInput}
                                  onCommit={(v) => commitPersonRoom(i, v)}
                                />
                              </div>
                              <div>
                                <FapSelect
                                  size="compact"
                                  accent="#8B5CF6"
                                  className={`${classes.tariffPick} ${unbound ? classes.tariffPickUnbound : ""}`}
                                  disabled={!canEdit}
                                  value={pd.tariffId || ""}
                                  onChange={(v) => canEdit && applyTariffToPerson(i, v)}
                                  options={tariffOptions}
                                  menuMinWidth={260}
                                />
                              </div>
                              <div>
                                <input type="number" min={0} step={0.5} className={classes.cellInputNum}
                                  value={pd.daysCount ? pd.daysCount : ""}
                                  onChange={(e) => canEdit && updatePersonReport(i, "daysCount", e.target.value)}
                                  readOnly={!canEdit} />
                              </div>
                              {[
                                ["breakfastCount", "завтрак", "цена за порцию из тарифа"],
                                ["lunchCount", "обед", "цена за порцию из тарифа"],
                                ["dinnerCount", "ужин", "цена за порцию из тарифа"],
                                ["lunchboxCount", "ланчбокс", "цена ланчбокса из тарифа"],
                              ].map(([countF, mealLabel, priceHint]) => (
                                <div key={countF} className={classes.mealCell}>
                                  <input type="number" min={0} className={classes.cellInputCount}
                                    value={pd[countF] ? pd[countF] : ""}
                                    onChange={(e) => canEdit && updatePersonReport(i, countF, e.target.value)}
                                    readOnly={!canEdit}
                                    title={`Количество (${mealLabel}) — ${priceHint}`} />
                                </div>
                              ))}
                              <div className={`${classes.numRight} ${classes.memberFood}`}>
                                {m.food > 0 ? fmt(m.food) : "—"}
                                {(() => {
                                  const fh = foodHintData(pd, findTariff(pd.tariffId));
                                  return <CalcHint rows={fh.rows} totalLabel="Питание" total={fh.total} warn={fh.warn} />;
                                })()}
                              </div>
                              {(() => {
                                // Скидка применима только там, где проживание считается от цены
                                // за сутки: при тарифе «Номер» оно принадлежит номеру, без тарифа
                                // и у легаси-строк с плоской суммой процент считать не от чего.
                                const hasTariff = !!findTariff(pd.tariffId);
                                if (
                                  roomBillingByIndex[i]?.perRoom ||
                                  !hasTariff ||
                                  getEffectiveRow(i, pd).isLegacyFlat
                                ) {
                                  return <div className={classes.discountMuted}>—</div>;
                                }
                                const auto = accommodationDiscountPercent(
                                  people[i]?.personCategory
                                );
                                return (
                                  <div className={classes.discountCell}>
                                    <input
                                      type="number" min={0} max={100}
                                      className={`${classes.cellInputCount} ${classes.discountInput}`}
                                      value={pd.accommodationDiscount ?? ""}
                                      onChange={(e) =>
                                        canEdit &&
                                        updatePersonReport(
                                          i,
                                          "accommodationDiscount",
                                          // Кламп на вводе, а не только в расчёте: иначе набранные
                                          // «500» сохранились бы в отчёт, а деньги посчитались бы
                                          // по 100% — число на экране разошлось бы с суммой.
                                          e.target.value === ""
                                            ? null
                                            : String(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                                        )
                                      }
                                      readOnly={!canEdit}
                                      placeholder={String(auto)}
                                      title={`По умолчанию для категории — ${auto}%. Пусто — авто, 0 — скидки нет.`}
                                    />
                                    <span className={classes.discountSuffix}>%</span>
                                  </div>
                                );
                              })()}
                              <div className={classes.numRight}>
                                {(() => {
                                  const eff = getEffectiveRow(i, pd);
                                  const hasTariff = !!findTariff(pd.tariffId);
                                  // Тариф «Номер»: стоимость на шапке, у гостя — нейтрально
                                  // (без выделенного несущего). Сумма номера не меняется.
                                  if (roomBillingByIndex[i]?.perRoom) {
                                    return <span className={classes.accMuted}>в номере</span>;
                                  }
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
                                  // Формулу в строке не показываем — только сумма + «?» с разбивкой.
                                  const accRows = [
                                    [
                                      `Цена за сутки${eff.placementKind ? ` (${placementKindLabel(eff.placementKind)})` : ""}`,
                                      "",
                                      fmt(eff.pricePerDay),
                                    ],
                                    ["Количество суток", "", String(toNum(pd.daysCount))],
                                  ];
                                  if ((eff.chargeFactor ?? 1) < 1) {
                                    accRows.push([
                                      "Скидка",
                                      "",
                                      eff.chargeFactor === 0 ? "бесплатно" : `−${Math.round((1 - eff.chargeFactor) * 100)}%`,
                                    ]);
                                  }
                                  return (
                                    <span className={classes.accValue}>
                                      <strong>{fmt(eff.accommodationCost)}</strong>
                                      <CalcHint rows={accRows} totalLabel="Проживание" total={fmt(eff.accommodationCost)} />
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
          <>
            {people[evictState?.indices?.[0]]?.personType === "CREW"
              ? "Укажите причину выселения. Это действие изменит статус члена экипажа."
              : "Укажите причину выселения. Это действие изменит статус пассажира."}
            {evictSplitText && (
              <>
                <br />
                <span className={classes.groupSplitWarn}>{evictSplitText}</span>
              </>
            )}
          </>
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
        maxSelectable={undefined}
        loading={saving}
        onConfirm={personMode === "CREW" ? handleCrewCatalogConfirm : handleCatalogConfirm}
        title={personMode === "CREW" ? "Выбрать из экипажа заявки" : undefined}
        groupContext={personMode === "CREW" ? undefined : groupContext}
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
          {relocateSplitText && (
            <p className={classes.groupSplitWarn}>{relocateSplitText}</p>
          )}
          <div className={classes.dialogField}>
            <label className={classes.dialogLabel}>Гостиница *</label>
            <FapSelect
              accent={LIV}
              value={relocateTarget}
              onChange={(v) => setRelocateTarget(v)}
              options={[
                { value: "", label: "Выберите гостиницу" },
                ...otherHotels.map(({ hotel: h, originalIndex }) => {
                  const cap = Number(h?.peopleCount) || 0;
                  const placed = (h?.people || []).length;
                  const free = Math.max(0, cap - placed);
                  // Заполненная гостиница остаётся выбираемой: переселение сверх
                  // заявки разрешено, подпись просто предупреждает об этом.
                  const targetFull = cap > 0 && free <= 0;
                  return {
                    value: String(originalIndex),
                    label: `${h.name || `Гостиница ${originalIndex + 1}`}${
                      cap > 0 ? ` · свободно ${free}/${cap}` : ""
                    }${targetFull ? " · сверх заявки" : ""}`,
                  };
                }),
              ]}
            />
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

      <Dialog
        open={bulkCountsOpen}
        onClose={() => setBulkCountsOpen(false)}
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
          Количество приёмов всем
        </DialogTitle>
        <DialogContent
          sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}
        >
          <p className={classes.dialogHint}>
            Значение проставится всем гостям отчёта. Пустое поле — не менять.
          </p>
          <div className={classes.bulkDialogGrid}>
            {[["b", "Завтраки"], ["l", "Обеды"], ["d", "Ужины"], ["lb", "Ланчбоксы"]].map(
              ([k, lbl]) => (
                <div key={k} className={classes.dialogField}>
                  <label className={classes.dialogLabel}>{lbl}</label>
                  <input
                    type="number"
                    min={0}
                    className={classes.dialogInput}
                    value={bulkCounts[k]}
                    onChange={(e) => setBulkCounts((p) => ({ ...p, [k]: e.target.value }))}
                    placeholder="не менять"
                  />
                </div>
              )
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
          <Button backgroundcolor="#F6F7FB" color="#545873" onClick={() => setBulkCountsOpen(false)}>
            Отмена
          </Button>
          <Button
            backgroundcolor="var(--dark-blue)"
            color="#fff"
            onClick={() => {
              applyBulkCounts();
              setBulkCountsOpen(false);
            }}
            disabled={Object.values(bulkCounts).every((v) => v === "")}
          >
            Применить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assignRoomOpen}
        onClose={closeAssignRoom}
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
          Присвоить номер ({selected.length})
        </DialogTitle>
        <DialogContent
          sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}
        >
          <p className={classes.dialogHint}>
            Номер будет проставлен всем выбранным гостям.
          </p>
          <div className={classes.dialogField}>
            <label className={classes.dialogLabel}>Номер *</label>
            <RoomNumberField
              live
              className={classes.dialogInput}
              value={assignRoomValue}
              rooms={activeRooms}
              occupancy={roomOccupancyMap}
              onCommit={setAssignRoomValue}
              placeholder="Например, 512"
            />
            {roomKey(assignRoomValue) && (
              <span className={classes.dialogNote}>
                {assignRoomOccupancy > 0
                  ? `Сейчас в номере ${roomKey(assignRoomValue)}: ${assignRoomOccupancy} — станет ${
                      assignRoomOccupancy +
                      selected.filter(
                        (i) => roomKey(people[i]?.roomNumber) !== roomKey(assignRoomValue)
                      ).length
                    }`
                  : `Номер ${roomKey(assignRoomValue)} сейчас свободен`}
              </span>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
          <Button backgroundcolor="#F6F7FB" color="#545873" onClick={closeAssignRoom}>
            Отмена
          </Button>
          <Button
            backgroundcolor="var(--dark-blue)"
            color="#fff"
            onClick={handleAssignRoom}
            disabled={saving || !roomKey(assignRoomValue) || selected.length === 0}
          >
            {saving ? "Сохранение..." : "Присвоить"}
          </Button>
        </DialogActions>
      </Dialog>

      <HotelCapacityDialog
        open={capacityOpen}
        hotelName={hotel?.name}
        placed={placed}
        initialValue={placed}
        saving={saving}
        onClose={() => setCapacityOpen(false)}
        onSave={handleSaveCapacity}
        onError={notifyError}
      />
    </div>
  );
}
