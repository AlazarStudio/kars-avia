import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@apollo/client";
import classes from "./FapBaggagePage.module.css";
import {
  COMPLETE_PASSENGER_REQUEST_BAGGAGE_DRIVER_DELIVERY,
  COMPLETE_PASSENGER_REQUEST_BAGGAGE_EARLY,
  REMOVE_PASSENGER_REQUEST_BAGGAGE_DRIVER,
  getCookie,
} from "../../../../../graphQL_requests";
import {
  SERVICE_STATUS_CONFIG,
  formatDateTime,
  formatTime,
} from "../fapConstants";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import { useBaggageTripDraft } from "../hooks/useBaggageTripDraft";
import FapBaggageTripFields, {
  deriveTripCost,
} from "../FapBaggageTripFields/FapBaggageTripFields";
import FapHeaderActions from "../FapHeaderActions/FapHeaderActions";
import useServiceReopen from "../useServiceReopen";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";
import AddRepresentativeBaggageDriver from "../../AddRepresentativeBaggageDriver/AddRepresentativeBaggageDriver";
import BaggageIcon from "../../../../shared/icons/BaggageIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
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
const ArrowRightSvg = ({ size = 14, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke={color}
      strokeWidth="2.4"
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
  user,
}) {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();

  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const reopen = useServiceReopen({
    requestId: request?.id,
    serviceKind: "BAGGAGE_DELIVERY",
    user,
    isCompleted: service?.status === "COMPLETED",
    onDone: onRefetch,
  });
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
  // COMPLETED у доставки багажа означает «план по головам набран»: бэк считает
  // статус услуги по числу пассажиров во всех поездках, а не по отметкам
  // доставки. Поездка обычно заводится сразу со списком, поэтому услуга
  // завершается ещё до первой отметки — и кнопка «Завершить» пропадала со всех
  // карточек, а отметить доставку из CRM становилось нечем. Сама мутация
  // completePassengerRequestBaggageDriverDelivery статус услуги не проверяет,
  // так что гасим отметку только по отмене.
  const canCompleteDelivery = canEdit && !isCancelled;
  const plannedAt = service?.plan?.plannedAt;

  const totals = useMemo(() => {
    const done = drivers.filter((d) => d.deliveryCompletedAt).length;
    const cost = drivers.reduce((sum, d) => sum + (Number(d.reportCost) || 0), 0);
    return { total: drivers.length, done, active: drivers.length - done, cost };
  }, [drivers]);

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
          <FapHeaderActions
            request={request}
            user={user}
            canEdit={canEdit && !isCompleted}
            onRefetch={onRefetch}
            items={[
              {
                label: "Завершить услугу",
                tone: "danger",
                onClick: () => setShowEarlyModal(true),
                hidden: !(canEdit && !isCompleted),
              },
              {
                label: "Вернуть в работу",
                onClick: reopen.openModal,
                hidden: !reopen.canReopen,
              },
            ]}
          />
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
              isCompleted={isCompleted}
              canEdit={canEdit}
              canCompleteDelivery={canCompleteDelivery}
              showLinks={showLinks}
              saving={saving}
              onOpen={() =>
                navigate(`/far/${requestId}/service/baggage/trip/${idx}`)
              }
              onComplete={() => handleCompleteDelivery(idx)}
              onDelete={() => handleRemoveDriver(idx)}
              onCopyLink={copyLink}
              onRefetch={onRefetch}
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

      <FapDestructiveModal
        open={reopen.open}
        onClose={reopen.closeModal}
        onConfirm={reopen.confirm}
        title="Вернуть услугу в работу"
        description="Услуга вернётся в работу: дата завершения и причина досрочного закрытия будут сняты."
        reasonLabel="Причина *"
        placeholder="Укажите причину..."
        confirmText="Вернуть"
        cancelText="Отмена"
        saving={reopen.saving}
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
// TaskCard — компакт в списке: кто, куда, статус, поля поездки.
// Пассажиры поездки (адреса, бирки, цены) живут на её странице —
// FapBaggageTripPage, открывается кнопкой «Открыть».
// ──────────────────────────────────────────────────────────────────
function TaskCard({
  driver,
  index,
  requestId,
  isCompleted,
  canEdit,
  canCompleteDelivery,
  showLinks,
  saving,
  onOpen,
  onComplete,
  onDelete,
  onCopyLink,
  onRefetch,
}) {
  const done = !!driver.deliveryCompletedAt;
  const status = done ? "DONE" : "ACTIVE";
  const statusCfg = TASK_STATUS[status];
  const canAct = canEdit && !isCompleted;
  const hasRoute = driver.addressFrom || driver.addressTo;
  const mapUrl = hasRoute ? buildMapUrl(driver.addressFrom, driver.addressTo) : "";

  const people = driver.people || [];
  const hasPeople = people.length > 0;
  const tripCost = deriveTripCost(people, driver);
  // Ожидаемое количество задаётся при создании поездки, фактические пассажиры
  // добавляются из реестра позже — счётчик показывает оба числа. У поездок,
  // созданных до появления количества, его нет: там счётчик как прежде.
  const expectedPeople = driver.peopleCount || 0;

  // Тип ТС правят из двух мест — с карточки и со страницы поездки, — поэтому
  // черновик и запись общие (useBaggageTripDraft), а свежее значение обоим
  // местам приносит подписка на заявку.
  const {
    vehicleType,
    setVehicleType,
    dirty,
    save,
    saving: savingFields,
  } = useBaggageTripDraft({
    driver,
    requestId,
    driverIndex: index,
    onRefetch,
  });

  // Без права правки (авиакомпания, а также диспетчер на завершённой или
  // отменённой услуге) поля показываются текстом. Пустая поездка в таком виде
  // выглядела бы строкой из прочерков — блок прячется.
  const hasReportData =
    !!driver.vehicleType ||
    tripCost.value != null ||
    !!driver.deliveryCompletedAt;

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
              {expectedPeople > 0
                ? `${people.length}/${expectedPeople} пасс.`
                : hasPeople
                  ? passengersLabel(people.length)
                  : "без пассажиров"}
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
          // Отметка доставки — единственное действие карточки, не зависящее от
          // статуса услуги: см. комментарий у canCompleteDelivery выше.
          canCompleteDelivery && (
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

        <button type="button" className={classes.openBtn} onClick={onOpen}>
          Открыть <ArrowRightSvg />
        </button>

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

      {/* Trip fields: vehicle type + derived cost */}
      <FapBaggageTripFields
        canEdit={canAct}
        accent={BG_FG}
        hasReportData={hasReportData}
        vehicleType={canAct ? vehicleType : driver.vehicleType || ""}
        onVehicleTypeChange={setVehicleType}
        deliveredAtText={
          driver.deliveryCompletedAt
            ? formatDateTime(driver.deliveryCompletedAt)
            : "—"
        }
        costText={tripCost.text}
        costHint={tripCost.hint}
        onSave={save}
        saveDisabled={!dirty || savingFields || saving}
        saving={savingFields}
      />

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
