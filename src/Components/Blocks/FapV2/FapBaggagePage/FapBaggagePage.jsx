import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import classes from "./FapBaggagePage.module.css";
import {
  COMPLETE_PASSENGER_REQUEST_BAGGAGE_DRIVER_DELIVERY,
  COMPLETE_PASSENGER_REQUEST_BAGGAGE_EARLY,
  REMOVE_PASSENGER_REQUEST_BAGGAGE_DRIVER,
  UPDATE_PASSENGER_REQUEST_BAGGAGE_DRIVER,
  getCookie,
} from "../../../../../graphQL_requests";
import {
  SERVICE_STATUS_CONFIG,
  formatDateTime,
  formatTime,
  toLocalInputValue,
  VEHICLE_TYPES,
} from "../fapConstants";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import FapActionButton from "../FapActionButton/FapActionButton";
import FapOverflowMenu from "../FapOverflowMenu/FapOverflowMenu";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";
import FapSelect from "../FapSelect/FapSelect";
import BaggageTagsInput from "../BaggageTagsInput/BaggageTagsInput";
import CatalogPickerModal, { personKey } from "../CatalogPickerModal/CatalogPickerModal";
import AddRepresentativeBaggageDriver from "../../AddRepresentativeBaggageDriver/AddRepresentativeBaggageDriver";
import PassengerRequestLogs from "../../LogsHistory/PassengerRequestLogs";
import BaggageIcon from "../../../../shared/icons/BaggageIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import ScheduleIcon from "../../../../shared/icons/ScheduleIcon";
import CopyIcon from "../../../../shared/icons/CopyIcon";

const BG_FG = "#64748B";
const BG_BG = "#F1F5F9";
// Акцент денежной плитки: тот же синий, что у кнопок карточки (--dark-blue).
// Инлайновым SVG-атрибутам var() недоступен, поэтому держим hex.
const MONEY_FG = "#0057C3";

const PlusSvg = ({ size = 14, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
const CheckSvg = ({ size = 15, color = "#fff", strokeWidth = 2.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 12l5 5L20 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ClockSvg = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const RubleSvg = ({ size = 12, color = "currentColor", strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M9 20V4h5a4 4 0 0 1 0 8H9M6 16h8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const PhoneSvg = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M22 17v3a2 2 0 0 1-2 2A19 19 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8l-1.3 1.3a16 16 0 0 0 6.6 6.6l1.3-1.3a2 2 0 0 1 1.8-.6l3 .5A2 2 0 0 1 22 17Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const PinSvg = ({ size = 15, color = "currentColor", strokeWidth = 1.8 }) => (
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
const MapSvg = ({ size = 15, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const NoteSvg = ({ size = 14, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"
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

const TASK_STATUS = {
  ACTIVE: { label: "В работе", color: "#F59E0B", bg: "#FFFBEB" },
  DONE: { label: "Завершён", color: "#10B981", bg: "#ECFDF5" },
};

// Идентичность доставки для React-ключа. Массив адресуется индексом, а весь
// несохранённый ввод живёт в стейте карточки: ключ по индексу означает, что
// после удаления соседа тот же инстанс начинает рендерить другого водителя
// вместе с чужим черновиком. Опорным берём id доставки — он переезжает вместе
// с записью. linkPWA как идентичность больше не годится: при удалении соседа
// съехавшие ссылки перевыпускаются. Соседнее поле link сюда не берём: оно
// вводится руками и у двух доставок легко совпадёт, а дубль ключа вернул бы
// ровно ту же путаницу.
// Без id (записи, созданные до его появления) падаем на позиционный ключ:
// черновик сбросится при сдвиге — потерять ввод безопаснее, чем записать его
// чужой заявке.
const driverCardKey = (driver, index) => driver.id || `idx-${index}`;

// Клиентский ключ строки пассажира уходит из объекта перед сравнением с
// сервером: в модели его нет. delete сохраняет порядок остальных ключей —
// сравнение с serverPeopleKey идёт по строке JSON.
const stripRowKey = (row) => {
  const rest = { ...row };
  delete rest._rowKey;
  return rest;
};

// Идентичность пассажира для поиска дублей: personId есть только у реестрового,
// вписанного руками опознаём по нормализованному ФИО. Правило намеренно то же,
// что в сайдбаре создания поездки (AddRepresentativeBaggageDriver) — два места
// добавляют пассажиров в один и тот же список и расходиться не должны.
const normalizeName = (name) =>
  String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

// Сервер/пикер → строка черновика. reportCost держим строкой: это значение
// <input type="number">, пустая строка означает «сумма не указана».
const toDraftRow = (person) => ({
  personId: person.personId ?? null,
  fullName: person.fullName ?? "",
  phone: person.phone ?? null,
  personType: person.personType ?? "PASSENGER",
  personCategory: person.personCategory ?? null,
  airlinePersonalId: person.airlinePersonalId ?? null,
  baggageTags: Array.isArray(person.baggageTags) ? person.baggageTags : [],
  reportCost: person.reportCost != null ? String(person.reportCost) : "",
  addressTo: person.addressTo ?? "",
});

// Строка черновика → PassengerServiceDriverPersonInput.
const toPersonInput = (row) => ({
  personId: row.personId || null,
  fullName: row.fullName.trim(),
  phone: row.phone || null,
  personType: row.personType || "PASSENGER",
  personCategory: row.personCategory || null,
  airlinePersonalId: row.airlinePersonalId || null,
  baggageTags: row.baggageTags,
  reportCost: row.reportCost === "" ? null : Number(row.reportCost),
  addressTo: row.addressTo.trim() || null,
});

const passengersLabel = (count) => {
  const tail100 = count % 100;
  const tail10 = count % 10;
  if (tail100 >= 11 && tail100 <= 14) return `${count} пассажиров`;
  if (tail10 === 1) return `${count} пассажир`;
  if (tail10 >= 2 && tail10 <= 4) return `${count} пассажира`;
  return `${count} пассажиров`;
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

export default function FapBaggagePage({
  service,
  request,
  onRefetch,
  canEdit = true,
  showLinks = true,
}) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();

  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [completeDelivery] = useMutation(
    COMPLETE_PASSENGER_REQUEST_BAGGAGE_DRIVER_DELIVERY,
    { context: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const [removeDriver] = useMutation(REMOVE_PASSENGER_REQUEST_BAGGAGE_DRIVER, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [completeBaggageEarly] = useMutation(
    COMPLETE_PASSENGER_REQUEST_BAGGAGE_EARLY,
    { context: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const drivers = useMemo(() => service?.drivers || [], [service]);
  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};
  const isCancelled = service?.status === "CANCELLED";
  const isCompleted = service?.status === "COMPLETED" || isCancelled;
  const plannedAt = service?.plan?.plannedAt;

  const savedPassengers = request?.savedPassengers || [];

  const totals = useMemo(() => {
    const done = drivers.filter((d) => d.deliveryCompletedAt).length;
    const cost = drivers.reduce((sum, d) => sum + (Number(d.reportCost) || 0), 0);
    return { total: drivers.length, done, active: drivers.length - done, cost };
  }, [drivers]);

  // Багаж пассажира везёт одна поездка: расписанных по другим поездкам в выборе
  // не предлагаем. Своих карточка исключает сама — по черновику, чтобы ещё не
  // сохранённое добавление тоже не предлагалось повторно.
  const takenByOtherTrips = useMemo(
    () =>
      drivers.map(
        (_, i) =>
          new Set(
            drivers.flatMap((d, j) =>
              j === i
                ? []
                : (d.people ?? []).map((p) => personKey(p)).filter(Boolean)
            )
          )
      ),
    [drivers]
  );

  const copyLink = (url) => {
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => success("Ссылка скопирована"))
      .catch(() => notifyError("Не удалось скопировать ссылку"));
  };

  const handleRemoveDriver = async (driverIndex) => {
    const ok = await confirm("Удалить заявку? Это действие нельзя отменить.");
    if (!ok) return;
    try {
      setSaving(true);
      await removeDriver({ variables: { requestId: request.id, driverIndex } });
      onRefetch?.();
      success("Заявка удалена");
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при удалении");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteDelivery = async (driverIndex) => {
    const ok = await confirm("Отметить доставку выполненной?");
    if (!ok) return;
    try {
      setSaving(true);
      await completeDelivery({
        variables: { requestId: request.id, driverIndex },
      });
      onRefetch?.();
      success("Доставка отмечена выполненной");
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteEarly = async (reason) => {
    try {
      setSaving(true);
      await completeBaggageEarly({
        variables: { requestId: request.id, reason },
      });
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
        <div className={classes.empty}>Услуга не подключена</div>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      {/* ── Service header ── */}
      <div className={classes.head}>
        <div className={classes.headLeft}>
          <div
            className={classes.headIcon}
            style={{ background: BG_BG, color: BG_FG }}
          >
            <BaggageIcon size={22} strokeWidth={2} />
          </div>
          <div className={classes.headText}>
            <div className={classes.headTitleRow}>
              <span className={classes.headTitle}>Доставка багажа</span>
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
          {canEdit && !isCompleted && (
            <button
              type="button"
              className={classes.addBtn}
              onClick={() => setShowAddDriver(true)}
            >
              <PlusSvg /> Создать заявку
            </button>
          )}
          <FapOverflowMenu items={[
            { label: "История", icon: ScheduleIcon, onClick: () => setShowLogs((v) => !v) },
            { sep: true },
            { label: "Завершить услугу", tone: "danger", onClick: () => setShowEarlyModal(true), hidden: !(canEdit && !isCompleted) },
          ]} />
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className={classes.kpiRow}>
        <div className={classes.kpi}>
          <div className={classes.kpiHead}>
            <BaggageIcon size={12} strokeWidth={2} style={{ color: BG_FG }} />
            Заявок
          </div>
          <div className={classes.kpiValue} style={{ color: BG_FG }}>
            {totals.total}
          </div>
          <div className={classes.kpiSub}>
            {totals.total === 0 ? "пока не создано" : "создаются по необходимости"}
          </div>
        </div>
        <div className={classes.kpi}>
          <div className={classes.kpiHead}>
            <ClockSvg color="#F59E0B" />
            В работе
          </div>
          <div className={classes.kpiValue} style={{ color: "#F59E0B" }}>
            {totals.active}
          </div>
          <div className={classes.kpiSub}>ожидают завершения</div>
        </div>
        <div className={classes.kpi}>
          <div className={classes.kpiHead}>
            <CheckSvg size={12} color="#10B981" strokeWidth={2.4} />
            Завершено
          </div>
          <div className={classes.kpiValue} style={{ color: "#10B981" }}>
            {totals.done}
          </div>
          <div className={classes.kpiSub}>нашей стороной</div>
        </div>
        <div className={classes.kpi}>
          <div className={classes.kpiHead}>
            <ClockSvg color="#545873" />
            Планируемое время
          </div>
          <div className={classes.kpiValue}>
            {plannedAt ? formatTime(plannedAt) : "—"}
          </div>
          <div className={classes.kpiSub}>
            {plannedAt ? "по рейсу" : "не указано"}
          </div>
        </div>
        <div className={classes.kpi}>
          <div className={classes.kpiHead}>
            <RubleSvg color={MONEY_FG} />
            Сумма
          </div>
          <div
            className={classes.kpiValue}
            style={{ color: MONEY_FG }}
            title={`${totals.cost.toLocaleString("ru-RU")} ₽`}
          >
            {totals.cost.toLocaleString("ru-RU")} ₽
          </div>
          <div className={classes.kpiSub}>
            {totals.cost > 0 ? "по всем доставкам" : "не указана"}
          </div>
        </div>
      </div>

      {/* ── Tasks list ── */}
      <div className={classes.tasks}>
        {drivers.length === 0 ? (
          <div className={classes.emptyTasks}>
            <BaggageIcon size={36} strokeWidth={1.6} />
            <div className={classes.emptyTasksText}>
              Заявки на доставку ещё не созданы
            </div>
            {canEdit && !isCompleted && (
              <button
                type="button"
                className={classes.addBtn}
                onClick={() => setShowAddDriver(true)}
              >
                <PlusSvg /> Создать заявку
              </button>
            )}
          </div>
        ) : (
          drivers.map((driver, idx) => (
            <TaskCard
              key={driverCardKey(driver, idx)}
              driver={driver}
              index={idx}
              requestId={request.id}
              token={token}
              isCompleted={isCompleted}
              canEdit={canEdit}
              showLinks={showLinks}
              saving={saving}
              savedPassengers={savedPassengers}
              takenPersonIds={takenByOtherTrips[idx]}
              onComplete={() => handleCompleteDelivery(idx)}
              onDelete={() => handleRemoveDriver(idx)}
              onCopyLink={copyLink}
              onRefetch={onRefetch}
              onSaved={success}
              onNotifyError={notifyError}
            />
          ))
        )}
      </div>

      {/* ── Dialogs ── */}
      {showAddDriver && (
        <AddRepresentativeBaggageDriver
          show={showAddDriver}
          onClose={() => {
            setShowAddDriver(false);
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
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// TaskCard — one delivery task per row.
// ──────────────────────────────────────────────────────────────────
function TaskCard({
  driver,
  index,
  requestId,
  token,
  isCompleted,
  canEdit,
  showLinks,
  saving,
  savedPassengers,
  takenPersonIds,
  onComplete,
  onDelete,
  onCopyLink,
  onRefetch,
  onSaved,
  onNotifyError,
}) {
  const done = !!driver.deliveryCompletedAt;
  const status = done ? "DONE" : "ACTIVE";
  const statusCfg = TASK_STATUS[status];
  const canAct = canEdit && !isCompleted;
  const hasRoute = driver.addressFrom || driver.addressTo;
  const mapUrl = hasRoute ? buildMapUrl(driver.addressFrom, driver.addressTo) : "";

  const [updateBaggageDriver] = useMutation(UPDATE_PASSENGER_REQUEST_BAGGAGE_DRIVER, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Список пассажиров приходит из кэша новой ссылкой на каждый refetch, поэтому
  // синхронизируемся по содержимому, а не по ссылке: иначе чужой refetch стёр бы
  // набранное. Сравниваем в форме черновика — у неё стабильный порядок ключей и
  // строковая сумма, так что «сервер → строка → сервер» не даёт ложного dirty.
  const serverPeopleKey = JSON.stringify((driver.people || []).map(toDraftRow));

  // Стойкого id у пассажира поездки нет: personId есть только у реестрового,
  // вписанного руками опознать нечем. А ключ по позиции — ровно та же ловушка,
  // что и у карточек: после удаления соседа React отдаёт инстанс строки
  // следующему пассажиру вместе с его внутренним стейтом, и ненабранный токен
  // из BaggageTagsInput уехал бы к чужим биркам. Поэтому выдаём каждой строке
  // собственный ключ в момент её появления — он живёт ровно столько же, сколько
  // сама строка, и переживает удаление любого соседа.
  const rowKeySeq = useRef(0);
  const withRowKey = (row) => ({ ...row, _rowKey: (rowKeySeq.current += 1) });

  const [vehicleTypeDraft, setVehicleTypeDraft] = useState(driver.vehicleType ?? "");
  const [deliveredAtDraft, setDeliveredAtDraft] = useState(
    toLocalInputValue(driver.deliveryCompletedAt)
  );
  const [peopleDraft, setPeopleDraft] = useState(() =>
    JSON.parse(serverPeopleKey).map(withRowKey)
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [savingFields, setSavingFields] = useState(false);

  // Пока поле в фокусе — не перезатираем черновик значением из кэша:
  // refetch после сохранения иначе откатит только что напечатанное.
  const dtFocused = useRef(false);
  // У строк пассажиров полей много и фокус ходит между ними, а BaggageTagsInput
  // своих onFocus/onBlur не отдаёт. Поэтому смотрим не на флаг, а на живой
  // activeElement: флаг, выставленный в строке, которую потом размонтировали,
  // остался бы висеть и навсегда заморозил синхронизацию карточки.
  // Ref держим на всём блоке пассажиров, а не на одной таблице: добавление
  // (кнопки и поле ручного ввода) тоже правит несохранённый список.
  const paxBlockRef = useRef(null);

  useEffect(() => {
    setVehicleTypeDraft(driver.vehicleType ?? "");
  }, [driver.vehicleType]);
  useEffect(() => {
    if (!dtFocused.current) setDeliveredAtDraft(toLocalInputValue(driver.deliveryCompletedAt));
  }, [driver.deliveryCompletedAt]);
  useEffect(() => {
    if (paxBlockRef.current?.contains(document.activeElement)) return;
    setPeopleDraft(JSON.parse(serverPeopleKey).map(withRowKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverPeopleKey]);

  const vtNext = vehicleTypeDraft.trim();
  const vtPrev = (driver.vehicleType ?? "").trim();
  // datetime-local отдаёт локальное время без зоны — new Date() трактует такую
  // строку как локальную, обратно toLocalInputValue тоже собирает локальные
  // компоненты, так что круг «сервер → инпут → сервер» не сдвигает время.
  // Сравниваем именно в формате инпута: ISO с сервера может нести секунды,
  // которых у инпута нет, и карточка казалась бы изменённой сразу после загрузки.
  const dtPrevInput = toLocalInputValue(driver.deliveryCompletedAt);
  const parsedDeliveredAt = deliveredAtDraft ? new Date(deliveredAtDraft) : null;
  const deliveredAtValid = !parsedDeliveredAt || !Number.isNaN(parsedDeliveredAt.getTime());
  const dtNext = parsedDeliveredAt && deliveredAtValid ? parsedDeliveredAt.toISOString() : null;
  const dtChanged = deliveredAtDraft !== dtPrevInput;
  const peopleChanged =
    JSON.stringify(peopleDraft.map(stripRowKey)) !== serverPeopleKey;
  const isDirty = vtNext !== vtPrev || dtChanged || peopleChanged;

  // Сумма поездки производная: бэк пересчитывает её как сумму цен пассажиров
  // при каждой записи. Считаем ровно по его правилу — пустой список даёт «нет
  // суммы», список без проставленных цен даёт 0 (в отчётности это разные
  // состояния) — иначе поле расходилось бы со строками до сохранения и с
  // сохранённым значением после. У легаси-поездки без пассажиров показываем
  // сумму с сервера: патч поездки reportCost не принимает, менять её отсюда
  // нечем.
  const hasPeople = peopleDraft.length > 0;
  // Легаси-поездка — та, у которой пассажиров нет и на сервере. Пустой черновик
  // у поездки с пассажирами — это не легаси, а «все строки убраны»: после
  // сохранения сумма там станет пустой, и показывать старую было бы обманом.
  const isLegacyTrip = (driver.people || []).length === 0;
  const paxCostSum = peopleDraft.reduce(
    (sum, row) => sum + (row.reportCost === "" ? 0 : Number(row.reportCost) || 0),
    0
  );
  const tripCost = hasPeople
    ? Math.round(paxCostSum * 100) / 100
    : isLegacyTrip
      ? driver.reportCost ?? null
      : null;
  const tripCostText =
    tripCost != null ? `${Number(tripCost).toLocaleString("ru-RU")} ₽` : "—";
  // Сумму отсюда не правят ни в одном из состояний, поэтому подпись объясняет
  // откуда она взялась и что с ней делать — иначе поле читается как сломанное.
  const tripCostHint = hasPeople
    ? "считается по пассажирам"
    : isLegacyTrip
      ? "от прежней доставки — задайте цены пассажирам"
      : "пассажиры убраны — сумма очистится";

  const patchRow = (rowIndex, changes) =>
    setPeopleDraft((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, ...changes } : row))
    );
  const removeRow = (rowIndex) =>
    setPeopleDraft((prev) => prev.filter((_, i) => i !== rowIndex));

  const excludeKeys = useMemo(() => {
    const keys = new Set(takenPersonIds || []);
    const usedNames = new Set();
    peopleDraft.forEach((row) => {
      if (row.personId) keys.add(row.personId);
      const name = normalizeName(row.fullName);
      if (name) usedNames.add(name);
    });
    // Вписанного руками пассажира реестр не знает по id, поэтому его же карточку
    // в реестре гасим по ФИО — иначе один человек уедет в поездку дважды.
    savedPassengers.forEach((p) => {
      if (p.personId && usedNames.has(normalizeName(p.fullName))) keys.add(p.personId);
    });
    return keys;
  }, [takenPersonIds, peopleDraft, savedPassengers]);

  // Добавление правит черновик, а не шлёт мутацию: список пассажиров уходит
  // целиком одним патчем вместе с остальными правками по кнопке «Сохранить».
  const handlePickPeople = (selected) => {
    setPeopleDraft((prev) => {
      const seenIds = new Set(prev.map((row) => row.personId).filter(Boolean));
      const seenNames = new Set(
        prev.map((row) => normalizeName(row.fullName)).filter(Boolean)
      );
      const additions = selected
        .filter(
          (p) =>
            (!p.personId || !seenIds.has(p.personId)) &&
            !seenNames.has(normalizeName(p.fullName))
        )
        .map((p) => withRowKey(toDraftRow(p)));
      return [...prev, ...additions];
    });
    setPickerOpen(false);
  };

  // Второй путь добавления — для тех, кого в реестре заявки нет. Такой пассажир
  // уходит без personId (как и при создании поездки в сайдбаре), а бэк добьёт
  // остальные поля в ensureDriverPerson.
  const addManualPerson = () => {
    const fullName = manualName.trim();
    if (!fullName) return;
    const key = normalizeName(fullName);
    if (peopleDraft.some((row) => normalizeName(row.fullName) === key)) {
      onNotifyError("Такой пассажир уже в поездке");
      return;
    }
    setPeopleDraft((prev) => [
      ...prev,
      withRowKey(toDraftRow({ fullName, personType: "PASSENGER" })),
    ]);
    setManualName("");
  };

  const handleManualKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addManualPerson();
    }
  };

  const toggleManual = () =>
    setManualOpen((prev) => {
      if (prev) setManualName("");
      return !prev;
    });

  const handleSave = async () => {
    const patch = {};
    if (vtNext !== vtPrev) patch.vehicleType = vtNext === "" ? null : vtNext;
    if (dtChanged) {
      if (!deliveredAtValid) {
        onNotifyError("Некорректная дата доставки");
        return;
      }
      patch.deliveryCompletedAt = dtNext;
    }
    if (peopleChanged) {
      const badCost = peopleDraft.find(
        (row) => row.reportCost !== "" && !Number.isFinite(Number(row.reportCost))
      );
      if (badCost) {
        onNotifyError(`Некорректная сумма у пассажира «${badCost.fullName || "—"}»`);
        return;
      }
      const noName = peopleDraft.find((row) => !row.fullName.trim());
      if (noName) {
        onNotifyError("У пассажира не указано ФИО");
        return;
      }
      patch.people = peopleDraft.map(toPersonInput);
    }
    if (Object.keys(patch).length === 0) return;
    try {
      setSavingFields(true);
      await updateBaggageDriver({
        variables: { requestId, driverIndex: index, patch },
      });
      onSaved?.("Сохранено");
      onRefetch?.();
    } catch (e) {
      onNotifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при сохранении");
    } finally {
      setSavingFields(false);
    }
  };

  // Без права правки (авиакомпания, а также диспетчер на завершённой или
  // отменённой услуге) показываем поля текстом, а не серыми disabled-инпутами.
  // Пустая доставка в таком виде выглядела бы строкой из прочерков — прячем блок.
  const hasReportData =
    !!driver.vehicleType || tripCost != null || !!driver.deliveryCompletedAt;

  return (
    <div className={`${classes.taskCard} ${done ? classes.taskCardDone : ""}`}>
      {/* Header row */}
      <div className={classes.taskHead}>
        <span
          className={classes.taskBar}
          style={{ background: statusCfg.color }}
        />
        <div
          className={classes.taskIcon}
          style={{ background: BG_BG, color: BG_FG }}
        >
          <BaggageIcon size={22} strokeWidth={2} />
        </div>
        <div className={classes.taskInfo}>
          <div className={classes.taskTitleRow}>
            <span className={classes.taskNumber} style={{ color: BG_FG }}>
              №{index + 1}
            </span>
            <span className={classes.taskDriver}>
              {driver.fullName || "Водитель не указан"}
            </span>
            <span className={classes.headChip}>
              {hasPeople ? passengersLabel(peopleDraft.length) : "без пассажиров"}
            </span>
          </div>
          <div className={classes.taskMeta}>
            {driver.phone && (
              <span className={classes.taskMetaItem}>
                <PhoneSvg color="#545873" /> {driver.phone}
              </span>
            )}
            {driver.phone && driver.pickupAt && (
              <span className={classes.metaDot} />
            )}
            {driver.pickupAt && (
              <span>подача {formatTime(driver.pickupAt)}</span>
            )}
          </div>
        </div>

        <span
          className={classes.statusPill}
          style={{ background: statusCfg.bg, color: statusCfg.color }}
        >
          <span
            className={classes.statusDot}
            style={{ background: statusCfg.color }}
          />
          {statusCfg.label}
        </span>

        <span className={classes.vDivider} />

        {showLinks && driver.linkPWA && (
          <button
            type="button"
            className={classes.linkBtn}
            onClick={() => onCopyLink(driver.linkPWA)}
            title="Скопировать ссылку «Сканер»"
          >
            <LinkSvg color="var(--dark-blue)" /> Сканер <CopyIcon />
          </button>
        )}
        {showLinks && !driver.linkPWA && driver.link && (
          <button
            type="button"
            className={classes.linkBtn}
            onClick={() => onCopyLink(driver.link)}
            title="Скопировать ссылку"
          >
            <LinkSvg color="var(--dark-blue)" /> Ссылка <CopyIcon />
          </button>
        )}

        {hasRoute && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={classes.mapBtn}
            title="Открыть маршрут на карте"
          >
            <MapSvg color="var(--dark-blue)" /> На карте
          </a>
        )}

        {done ? (
          <span className={classes.completeBadge}>
            <CheckSvg size={15} color="#10B981" strokeWidth={2.6} /> Завершён
          </span>
        ) : (
          canAct && (
            <button
              type="button"
              className={classes.completeBtn}
              onClick={onComplete}
              disabled={saving}
            >
              <CheckSvg /> Завершить
            </button>
          )
        )}

        {canAct && (
          <button
            type="button"
            className={`${classes.iconBtn} ${classes.iconBtnDanger}`}
            onClick={onDelete}
            title="Удалить заявку"
            disabled={saving}
          >
            <DeleteIcon cursor="pointer" />
          </button>
        )}

        <span className={classes.headEndPad} />
      </div>

      {/* Route strip */}
      {hasRoute && (
        <div className={classes.routeStrip}>
          <PinSvg size={15} color={BG_FG} style={{ marginTop: 2, flexShrink: 0 }} />
          <div className={classes.routeText}>
            {driver.addressFrom && (
              <span className={classes.routeAddr}>{driver.addressFrom}</span>
            )}
            {driver.addressFrom && driver.addressTo && (
              <span className={classes.routeArrow} style={{ color: BG_FG }}>
                →
              </span>
            )}
            {driver.addressTo && (
              <span className={classes.routeAddr}>{driver.addressTo}</span>
            )}
          </div>
        </div>
      )}

      {/* Passengers: address + tags + cost per person */}
      {(canAct || hasPeople) && (
        <div className={classes.paxBlock} ref={paxBlockRef}>
          <div className={classes.paxHead}>
            <span className={classes.paxTitle}>
              Пассажиры
              <span className={classes.paxCount}>{peopleDraft.length}</span>
            </span>
            {canAct && peopleChanged && (
              <span className={classes.paxDirty}>есть несохранённые изменения</span>
            )}
            {canAct && (
              <span className={classes.paxHeadActions}>
                {savedPassengers?.length > 0 && (
                  <button
                    type="button"
                    className={classes.paxAddBtn}
                    onClick={() => setPickerOpen(true)}
                  >
                    <PlusSvg size={13} color="currentColor" /> Из реестра
                  </button>
                )}
                <button
                  type="button"
                  className={`${classes.paxAddBtn} ${
                    manualOpen ? classes.paxAddBtnActive : ""
                  }`}
                  onClick={toggleManual}
                >
                  <PlusSvg size={13} color="currentColor" /> Вручную
                </button>
              </span>
            )}
          </div>

          {canAct && manualOpen && (
            <div className={classes.paxManual}>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                onKeyDown={handleManualKeyDown}
                placeholder="ФИО пассажира"
                className={`${classes.paxInput} ${classes.paxManualInput}`}
                autoFocus
              />
              <button
                type="button"
                className={classes.paxManualBtn}
                onClick={addManualPerson}
                disabled={!manualName.trim()}
              >
                Добавить
              </button>
              <span className={classes.paxManualHint}>
                для тех, кого нет в реестре заявки
              </span>
            </div>
          )}

          <div className={classes.paxTable}>
            <div
              className={`${classes.paxRow} ${classes.paxHeadRow} ${
                canAct ? "" : classes.paxRowRO
              }`}
            >
              <span>ФИО</span>
              <span>Адрес доставки</span>
              <span>Номера бирок</span>
              <span>Сумма, ₽</span>
              {canAct && <span />}
            </div>

            {peopleDraft.length === 0 ? (
              <div className={classes.paxEmpty}>Пассажиры не добавлены</div>
            ) : (
              peopleDraft.map((row, rowIndex) =>
                canAct ? (
                  <div key={row._rowKey} className={classes.paxRow}>
                    <span className={classes.paxName} title={row.fullName}>
                      {row.fullName || "—"}
                    </span>
                    <input
                      type="text"
                      value={row.addressTo}
                      onChange={(e) => patchRow(rowIndex, { addressTo: e.target.value })}
                      placeholder="Адрес доставки"
                      className={classes.paxInput}
                    />
                    <BaggageTagsInput
                      value={row.baggageTags}
                      onChange={(next) => patchRow(rowIndex, { baggageTags: next })}
                    />
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={row.reportCost}
                      onChange={(e) => patchRow(rowIndex, { reportCost: e.target.value })}
                      placeholder="0"
                      className={classes.paxInput}
                    />
                    <button
                      type="button"
                      className={`${classes.iconBtn} ${classes.iconBtnDanger} ${classes.paxDelBtn}`}
                      onClick={() => removeRow(rowIndex)}
                      title="Убрать пассажира из поездки"
                    >
                      <DeleteIcon cursor="pointer" />
                    </button>
                  </div>
                ) : (
                  <div
                    key={row._rowKey}
                    className={`${classes.paxRow} ${classes.paxRowRO}`}
                  >
                    <span className={classes.paxName} title={row.fullName}>
                      {row.fullName || "—"}
                    </span>
                    <span className={classes.paxValue} title={row.addressTo}>
                      {row.addressTo || "—"}
                    </span>
                    <BaggageTagsInput value={row.baggageTags} disabled />
                    <span className={classes.paxValue}>
                      {row.reportCost === ""
                        ? "—"
                        : `${Number(row.reportCost).toLocaleString("ru-RU")} ₽`}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </div>
      )}

      {/* Report fields: vehicle type + derived cost + delivery date */}
      {canAct ? (
        <div className={classes.reportFields}>
          <label className={classes.reportField}>
            <span className={classes.reportFieldLabel}>Тип ТС</span>
            <FapSelect
              value={vehicleTypeDraft}
              onChange={setVehicleTypeDraft}
              placeholder="— тип ТС —"
              accent={BG_FG}
              style={{ width: 170 }}
              options={[
                { value: "", label: "Не указан" },
                ...(vehicleTypeDraft && !VEHICLE_TYPES.includes(vehicleTypeDraft)
                  ? [{ value: vehicleTypeDraft, label: vehicleTypeDraft }]
                  : []),
                ...VEHICLE_TYPES.map((t) => ({ value: t, label: t })),
              ]}
            />
          </label>

          <span className={classes.reportField}>
            <span className={classes.reportFieldLabel}>Сумма</span>
            <span className={classes.reportValue}>{tripCostText}</span>
            <span className={classes.reportHint}>{tripCostHint}</span>
          </span>

          <label className={classes.reportField}>
            <span className={classes.reportFieldLabel}>Дата доставки</span>
            <input
              type="datetime-local"
              value={deliveredAtDraft}
              onChange={(e) => setDeliveredAtDraft(e.target.value)}
              onFocus={() => {
                dtFocused.current = true;
              }}
              onBlur={() => {
                dtFocused.current = false;
              }}
              className={classes.reportInputDate}
            />
          </label>

          <button
            type="button"
            className={classes.saveBtn}
            onClick={handleSave}
            disabled={!isDirty || savingFields || saving}
          >
            {savingFields ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      ) : (
        hasReportData && (
          <div className={classes.reportFields}>
            <span className={classes.reportField}>
              <span className={classes.reportFieldLabel}>Тип ТС</span>
              <span className={classes.reportValue}>{driver.vehicleType || "—"}</span>
            </span>
            <span className={classes.reportField}>
              <span className={classes.reportFieldLabel}>Сумма</span>
              <span className={classes.reportValue}>{tripCostText}</span>
            </span>
            <span className={classes.reportField}>
              <span className={classes.reportFieldLabel}>Дата доставки</span>
              <span className={classes.reportValue}>
                {driver.deliveryCompletedAt ? formatDateTime(driver.deliveryCompletedAt) : "—"}
              </span>
            </span>
          </div>
        )
      )}

      {pickerOpen && (
        <CatalogPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          savedPassengers={savedPassengers}
          excludeKeys={excludeKeys}
          onConfirm={handlePickPeople}
          title="Добавить пассажиров в поездку"
        />
      )}

      {/* Description footer */}
      {(driver.description || done) && (
        <div className={classes.descRow}>
          <NoteSvg color="#94A3B8" style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            {driver.description || (
              <span style={{ color: "#94A3B8" }}>Описание не указано</span>
            )}
          </span>
          {done && driver.deliveryCompletedAt && (
            <span className={classes.descTime}>
              доставлено в {formatTime(driver.deliveryCompletedAt)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
