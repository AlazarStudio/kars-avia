import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@apollo/client";
import classes from "./FapTransferPage.module.css";
import {
  COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY,
  REMOVE_PASSENGER_REQUEST_DRIVER,
  UPDATE_PASSENGER_REQUEST_DRIVER,
  getCookie,
} from "../../../../../graphQL_requests";
import { downloadTransferReport } from "../reports/buildReportSheets";
import { transferFactCount, driverFactCount } from "../fapTransferFact";
import { SERVICE_STATUS_CONFIG, formatDateTime, VEHICLE_TYPES } from "../fapConstants";
import { useToast } from "../../../../contexts/ToastContext";
import FapActionButton from "../FapActionButton/FapActionButton";
import FapHeaderActions from "../FapHeaderActions/FapHeaderActions";
import useServiceReopen from "../useServiceReopen";
import FapSelect from "../FapSelect/FapSelect";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";
import AddRepresentativeDriver from "../../AddRepresentativeDriver/AddRepresentativeDriver";
import BusIcon from "../../../../shared/icons/BusIcon";
import BusDownIcon from "../../../../shared/icons/BusDownIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import CopyIcon from "../../../../shared/icons/CopyIcon";

const TR = "#8B5CF6";
const TR_BG = "#F5F3FF";
const TR_DEP = "#7C3AED";

// Идентичность поездки для React-ключа — та же, что у доставки багажа
// (driverCardKey в FapBaggagePage). Раньше ключом было `driver.itemId || idx`,
// но у PassengerServiceDriver поля itemId НЕТ вовсе, поэтому ключ всегда был
// позиционным: после удаления водителя, стоящего выше, тот же инстанс карточки
// начинал рендерить другого водителя вместе с чужим несохранённым черновиком
// («Перевезено», «Сумма», «Тип ТС»), и «Сохранить» записывало ввод не тому.
// Без id (записи старше его появления) падаем на позиционный ключ: сбросить
// черновик безопаснее, чем записать его чужой поездке.
const driverCardKey = (driver, index) => driver.id || `idx-${index}`;

const PlusSvg = ({ size = 14, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
const ClockSvg = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
const UsersSvg = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const ArrowRightSvg = ({ size = 14, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12h14M13 5l7 7-7 7"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

// Подпись KPI «Пассажиров»: при учёте числом сплит по экипажу невозможен —
// показываем соотношение поимённых к факту.
function passengersSubLabel(totals) {
  if (totals.listed === 0 && totals.fact > 0) return "без поимённого списка";
  if (totals.fact > totals.listed) return `поимённо ${totals.listed} из ${totals.fact}`;
  if (totals.crew > 0) return `${totals.passengers} пасс. + ${totals.crew} экипаж`;
  return `${totals.passengers} пасс.`;
}

export default function FapTransferPage({
  service,
  request,
  direction = "ARRIVAL",
  onRefetch,
  canEdit = true,
  showLinks = true,
  user,
}) {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const isDeparture = direction === "DEPARTURE";
  const color = isDeparture ? TR_DEP : TR;
  const bg = TR_BG;
  const HeadIcon = isDeparture ? BusDownIcon : BusIcon;
  const label = isDeparture ? "Трансфер (в аэропорт)" : "Трансфер (в гостиницу)";
  const serviceKey = isDeparture ? "transferDeparture" : "transfer";

  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const reopen = useServiceReopen({
    requestId: request?.id,
    serviceKind: isDeparture ? "DEPARTURE_TRANSFER" : "TRANSFER",
    user,
    // Именно COMPLETED, а не общий isCompleted: отменённую услугу бэк
    // переоткрывать отказывается, это другой переход.
    isCompleted: service?.status === "COMPLETED",
    onDone: onRefetch,
  });
  const [deleteDriverConfirm, setDeleteDriverConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const [completeTransferEarly] = useMutation(COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [removeDriver] = useMutation(REMOVE_PASSENGER_REQUEST_DRIVER, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const drivers = service?.drivers || [];
  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};
  const isCancelled = service?.status === "CANCELLED";
  const isCompleted = service?.status === "COMPLETED" || isCancelled;
  const planCap = service?.plan?.peopleCount ?? null;
  const plannedAt = service?.plan?.plannedAt;

  const totals = useMemo(() => {
    const all = drivers.flatMap((d) => d.people || []);
    const passengers = all.filter((p) => p?.personType !== "CREW").length;
    const crew = all.length - passengers;
    return { listed: all.length, passengers, crew, fact: transferFactCount(drivers) };
  }, [drivers]);

  const routesCount = useMemo(
    () => drivers.filter((d) => d.addressFrom || d.addressTo).length,
    [drivers]
  );

  const copyLink = (url) => {
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => success("Ссылка скопирована"))
      .catch(() => notifyError("Не удалось скопировать ссылку"));
  };

  const handleCompleteEarly = async (reason) => {
    try {
      setSaving(true);
      await completeTransferEarly({
        variables: { requestId: request.id, reason, direction },
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

  const handleDriverDelete = async () => {
    if (deleteDriverConfirm == null) return;
    try {
      setSaving(true);
      await removeDriver({
        variables: {
          requestId: request.id,
          driverIndex: deleteDriverConfirm,
          direction,
        },
      });
      onRefetch?.();
      success("Водитель удалён");
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при удалении");
    } finally {
      setSaving(false);
      setDeleteDriverConfirm(null);
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
          <div className={classes.headIcon} style={{ background: bg, color }}>
            <HeadIcon size={22} strokeWidth={2} />
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
          {canEdit && !isCompleted ? (
            <button
              type="button"
              className={classes.addBtn}
              onClick={() => setShowAddDriver(true)}
            >
              <PlusSvg /> Создать заявку
            </button>
          ) : (
            drivers.length > 0 && (
              <FapActionButton
                variant="primary"
                onClick={async () => {
                  try { await downloadTransferReport(request, direction); }
                  catch (e) { notifyError("Ошибка экспорта"); console.error(e); }
                }}
              >
                Скачать отчёт
              </FapActionButton>
            )
          )}
          <FapHeaderActions
            request={request}
            user={user}
            canEdit={canEdit && !isCompleted}
            onRefetch={onRefetch}
            onDownloadReport={() => downloadTransferReport(request, direction)}
            // Без водителей выгружать нечего (книга из одной шапки), а когда
            // правка недоступна — отчёт уже висит кнопкой в этой же шапке.
            hideReport={!(drivers.length > 0 && canEdit && !isCompleted)}
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
            <HeadIcon size={12} strokeWidth={2} style={{ color }} />
            Водителей
          </div>
          <div className={classes.kpiValue} style={{ color }}>
            {drivers.length}
          </div>
          <div className={classes.kpiSub}>
            {drivers.length === 0 ? "нет назначенных" : "из автопарка"}
          </div>
        </div>
        <div className={classes.kpi}>
          <div className={classes.kpiHead}>
            <UsersSvg color="#545873" />
            Пассажиров
          </div>
          <div
            className={classes.kpiValue}
            style={{
              color:
                planCap != null && totals.fact >= planCap
                  ? "#10B981"
                  : "var(--text)",
            }}
          >
            {totals.fact}
            {planCap != null ? ` / ${planCap}` : ""}
          </div>
          <div className={classes.kpiSub}>{passengersSubLabel(totals)}</div>
        </div>
        <div className={classes.kpi}>
          <div className={classes.kpiHead}>
            <PinSvg size={12} color="#545873" />
            Маршрутов
          </div>
          <div className={classes.kpiValue}>{routesCount}</div>
          <div className={classes.kpiSub}>
            {routesCount > 0 ? "у каждого водителя свой" : "не задано"}
          </div>
        </div>
        <div className={classes.kpi}>
          <div className={classes.kpiHead}>
            <ClockSvg color="#545873" />
            Подача
          </div>
          <div className={classes.kpiValue}>
            {plannedAt ? formatDateTime(plannedAt) : "—"}
          </div>
          <div className={classes.kpiSub}>
            {plannedAt ? "дата и время подачи" : "не указано"}
          </div>
        </div>
      </div>

      {/* ── Drivers list ── */}
      <div className={classes.drivers}>
        {drivers.length === 0 ? (
          <div className={classes.emptyDrivers}>
            <HeadIcon size={36} strokeWidth={1.6} />
            <div className={classes.emptyDriversText}>
              Водители ещё не назначены
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
            <DriverCard
              key={driverCardKey(driver, idx)}
              driver={driver}
              index={idx}
              color={color}
              bg={bg}
              HeadIcon={HeadIcon}
              isCompleted={isCompleted}
              isCancelled={isCancelled}
              canEdit={canEdit}
              showLinks={showLinks}
              onOpen={() =>
                navigate(
                  `/far/${requestId}/service/${serviceKey}/driver/${idx}`
                )
              }
              onCopyLink={copyLink}
              onDelete={() => setDeleteDriverConfirm(idx)}
              onRefetch={onRefetch}
              requestId={request.id}
              direction={direction}
              token={token}
            />
          ))
        )}
      </div>

      {/* ── Dialogs ── */}
      {showAddDriver && (
        <AddRepresentativeDriver
          show={showAddDriver}
          onClose={() => {
            setShowAddDriver(false);
            onRefetch?.();
          }}
          request={request}
          direction={direction}
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

      <FapDestructiveModal
        open={deleteDriverConfirm != null}
        onClose={() => setDeleteDriverConfirm(null)}
        onConfirm={handleDriverDelete}
        title="Удалить водителя?"
        description="Водитель и все его пассажиры будут удалены. Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        saving={saving}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// DriverCard — list-level only: open / links / delete.
// Passenger management lives inside FapDriverPage (opened via "Открыть").
// ──────────────────────────────────────────────────────────────────
function DriverCard({
  driver,
  index,
  color,
  bg,
  HeadIcon,
  isCompleted,
  isCancelled,
  canEdit,
  showLinks,
  onOpen,
  onCopyLink,
  onDelete,
  onRefetch,
  requestId,
  direction,
  token,
}) {
  const cap = driver.peopleCount || 0;
  const people = driver.people || [];
  const placed = people.length;
  const fact = driverFactCount(driver);
  const passengers = people.filter((p) => p?.personType !== "CREW").length;
  const crew = placed - passengers;
  const isFull = cap > 0 && fact >= cap;
  const isEmpty = fact === 0;

  const previewPeople = people.slice(0, 8);
  const extraCount = placed - previewPeople.length;

  const hasRoute = driver.addressFrom || driver.addressTo;
  const canDelete = canEdit && !isCompleted;

  const [updateDriver] = useMutation(UPDATE_PASSENGER_REQUEST_DRIVER, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [vehicleTypeDraft, setVehicleTypeDraft] = useState(driver.vehicleType ?? "");
  const [reportCostDraft, setReportCostDraft] = useState(
    driver.reportCost != null ? String(driver.reportCost) : ""
  );
  const [transportedDraft, setTransportedDraft] = useState(
    driver.transportedCount != null ? String(driver.transportedCount) : ""
  );

  // Пока инпут в фокусе — не перезатираем draft значением из кэша:
  // иначе refetch после автосейва может «откатить» только что напечатанное.
  const vtFocused = useRef(false);
  const rcFocused = useRef(false);
  const tcFocused = useRef(false);

  useEffect(() => {
    if (!vtFocused.current) setVehicleTypeDraft(driver.vehicleType ?? "");
  }, [driver.vehicleType]);
  useEffect(() => {
    if (!rcFocused.current) {
      setReportCostDraft(driver.reportCost != null ? String(driver.reportCost) : "");
    }
  }, [driver.reportCost]);
  useEffect(() => {
    if (!tcFocused.current) {
      setTransportedDraft(
        driver.transportedCount != null ? String(driver.transportedCount) : ""
      );
    }
  }, [driver.transportedCount]);

  const { success, error: notifyError } = useToast();
  const [saving, setSaving] = useState(false);

  // ── Сохранение только по кнопке (оба поля одним запросом, с тостом) ──
  const vtNext = vehicleTypeDraft.trim();
  const vtPrev = (driver.vehicleType ?? "").trim();
  const rcNext = reportCostDraft === "" ? null : Number(reportCostDraft);
  const rcPrev = driver.reportCost ?? null;
  const tcNext = transportedDraft === "" ? null : Number(transportedDraft);
  const tcPrev = driver.transportedCount ?? null;
  const isDirty = vtNext !== vtPrev || rcNext !== rcPrev || tcNext !== tcPrev;

  // Превышение вместимости не блокируем (легально — несколько ходок одной машиной),
  // но подсвечиваем как необычное значение.
  const tcOver = cap > 0 && transportedDraft !== "" && Number(transportedDraft) > cap;
  const tcOverTitle = "Больше вместимости машины — например, несколько ходок";

  const handleSave = async () => {
    const patch = {};
    if (vtNext !== vtPrev) patch.vehicleType = vtNext === "" ? null : vtNext;
    if (rcNext !== rcPrev) {
      if (rcNext != null && !Number.isFinite(rcNext)) {
        notifyError("Некорректная сумма");
        return;
      }
      patch.reportCost = rcNext;
    }
    if (tcNext !== tcPrev) {
      if (tcNext != null && (!Number.isInteger(tcNext) || tcNext < 0 || tcNext > 100000)) {
        notifyError("Некорректное количество");
        return;
      }
      patch.transportedCount = tcNext;
    }
    if (Object.keys(patch).length === 0) return;
    try {
      setSaving(true);
      await updateDriver({
        variables: { requestId, driverIndex: index, direction, patch },
      });
      success("Сохранено");
      onRefetch?.();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={classes.driverCard}>
      {/* Header row */}
      <div className={classes.driverHead}>
        <div className={classes.driverBar} style={{ background: isEmpty ? "#CBD2E4" : color }} />

        <div className={classes.driverInfo}>
          <div className={classes.driverNameRow}>
            <span className={classes.driverName}>
              {driver.fullName || "Водитель"}
            </span>
            {isFull && <span className={classes.fullBadge}>заполнен</span>}
          </div>
          <div className={classes.driverMeta}>
            {driver.phone && <span>{driver.phone}</span>}
            {driver.phone && driver.pickupAt && <span className={classes.metaDot} />}
            {driver.pickupAt && <span>подача {formatDateTime(driver.pickupAt)}</span>}
            <span className={classes.metaDot} />
            <span
              className={cap > 0 && fact > cap ? classes.metaOver : undefined}
              title={cap > 0 && fact > cap ? tcOverTitle : undefined}
            >
              {fact}
              {cap > 0 ? `/${cap}` : ""} пасс.
            </span>
          </div>
        </div>

        {/* Compact passenger preview */}
        {placed > 0 && (
          <div className={classes.avatarStack}>
            {previewPeople.slice(0, 5).map((p, i) => (
              <span
                key={i}
                className={classes.stackAvatar}
                style={{
                  background: p?.personType === "CREW" ? "#8B5CF6" : "#3B82F6",
                  marginLeft: i === 0 ? 0 : -8,
                }}
                title={p?.fullName || ""}
              >
                {initials(p?.fullName)}
              </span>
            ))}
            {extraCount > 0 && (
              <span className={classes.stackAvatarMore} style={{ marginLeft: -8 }}>
                +{extraCount}
              </span>
            )}
          </div>
        )}

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

        <button type="button" className={classes.openBtn} onClick={onOpen}>
          Открыть <ArrowRightSvg />
        </button>

        {canDelete && (
          <button
            type="button"
            className={classes.removeBtn}
            onClick={onDelete}
            title="Удалить водителя"
            aria-label="Удалить водителя"
          >
            <DeleteIcon cursor="pointer" />
          </button>
        )}
      </div>

      {/* Per-driver route strip */}
      {hasRoute && (
        <div
          className={classes.routeStrip}
          style={{ background: bg, borderColor: `${color}33` }}
        >
          <PinSvg size={15} color={color} />
          <div className={classes.routeText}>
            {driver.addressFrom && (
              <span className={classes.routeAddr}>{driver.addressFrom}</span>
            )}
            {driver.addressFrom && driver.addressTo && (
              <span className={classes.routeArrow} style={{ color }}>
                <RouteArrowSvg color={color} />
              </span>
            )}
            {driver.addressTo && (
              <span className={classes.routeAddr}>{driver.addressTo}</span>
            )}
          </div>
        </div>
      )}

      {/* Report fields: vehicle type + cost (outside clickable area) */}
      <div className={classes.driverReportFields}>
        <label className={classes.reportField}>
          <span className={classes.reportFieldLabel}>Тип ТС</span>
          <FapSelect
            value={vehicleTypeDraft}
            onChange={setVehicleTypeDraft}
            disabled={!canEdit || isCancelled}
            placeholder="— тип ТС —"
            accent={color}
            style={{ width: 180 }}
            options={[
              { value: "", label: "Не указан" },
              ...(vehicleTypeDraft && !VEHICLE_TYPES.includes(vehicleTypeDraft)
                ? [{ value: vehicleTypeDraft, label: vehicleTypeDraft }]
                : []),
              ...VEHICLE_TYPES.map((t) => ({ value: t, label: t })),
            ]}
          />
        </label>
        <label className={classes.reportField}>
          <span className={classes.reportFieldLabel}>Перевезено, чел.</span>
          <input
            type="number"
            min={0}
            step={1}
            value={transportedDraft}
            onChange={(e) => setTransportedDraft(e.target.value)}
            onFocus={() => { tcFocused.current = true; }}
            onBlur={() => { tcFocused.current = false; }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }}
            placeholder="0"
            disabled={!canEdit || isCancelled}
            className={`${classes.reportInputNumber} ${classes.reportInputNarrow}${tcOver ? ` ${classes.reportInputOver}` : ""}`}
            title={tcOver ? tcOverTitle : undefined}
          />
        </label>
        <label className={classes.reportField}>
          <span className={classes.reportFieldLabel}>Сумма, ₽</span>
          <input
            type="number"
            min={0}
            step={1}
            value={reportCostDraft}
            onChange={(e) => setReportCostDraft(e.target.value)}
            onFocus={() => { rcFocused.current = true; }}
            onBlur={() => { rcFocused.current = false; }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }}
            placeholder="0"
            disabled={!canEdit || isCancelled}
            className={classes.reportInputNumber}
          />
        </label>
        {canEdit && !isCancelled && (
          <button
            type="button"
            className={classes.saveBtn}
            style={{ background: color }}
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        )}
      </div>

      {/* Read-only summary strip */}
      <div className={classes.driverStrip}>
        {placed === 0 && fact > 0 ? (
          <>
            <UsersSvg size={14} color="#94A3B8" />
            <span>
              Перевезено <strong>{fact}</strong> (без поимённого списка)
              {" — "}
              <strong className={classes.stripHint} onClick={onOpen}>
                Открыть
              </strong>
              {", чтобы вести состав поимённо"}
            </span>
          </>
        ) : isEmpty ? (
          <>
            <UsersSvg size={14} color="#94A3B8" />
            <span>
              Пассажиры пока не назначены
              {cap > 0 && (
                <>
                  {" · "}
                  <strong>{cap}</strong> свободных мест
                </>
              )}
              {" — "}
              <strong className={classes.stripHint} onClick={onOpen}>
                Открыть
              </strong>
              {", чтобы добавить пассажиров или экипаж"}
            </span>
          </>
        ) : (
          <>
            <span className={classes.stripItem}>
              <span className={classes.stripDotPassenger} />
              {passengers}{" "}
              {passengers === 1
                ? "пассажир"
                : passengers >= 2 && passengers <= 4
                ? "пассажира"
                : "пассажиров"}
            </span>
            {crew > 0 && (
              <span className={classes.stripItem}>
                <span className={classes.stripDotCrew} />
                {crew} экипаж
              </span>
            )}
            {fact > placed && (
              <>
                <span className={classes.metaDot} />
                <span>перевезено {fact} · поимённо {placed}</span>
              </>
            )}
            <span className={classes.metaDot} />
            <span className={classes.stripHintText}>
              управление составом — на странице водителя
            </span>
          </>
        )}
      </div>
    </div>
  );
}
