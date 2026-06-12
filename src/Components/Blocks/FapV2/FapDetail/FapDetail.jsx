import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "./FapDetail.module.css";
import {
  GET_PASSENGER_REQUEST,
  SET_PASSENGER_REQUEST_STATUS,
  CANCEL_PASSENGER_REQUEST,
  PASSENGER_REQUEST_UPDATED_SUBSCRIPTION,
  getCookie,
  getMediaUrl,
} from "../../../../../graphQL_requests";
import {
  SERVICE_CONFIG,
  SERVICE_STATUS_CONFIG,
  REQUEST_STATUS_CONFIG,
  formatDate,
  formatDateTime,
} from "../fapConstants";
import { calculateEffectiveCostDays } from "../../../../utils/effectiveCostDays";
import MUILoader from "../../MUILoader/MUILoader";
import Button from "../../../Standart/Button/Button";
import Header from "../../Header/Header";
import { useToast } from "../../../../contexts/ToastContext";
import AddRepresentativeService from "../../AddRepresentativeService/AddRepresentativeService";
import PassengerRequestLogs from "../../LogsHistory/PassengerRequestLogs";
import CopyIcon from "../../../../shared/icons/CopyIcon";
import ScheduleIcon from "../../../../shared/icons/ScheduleIcon";
import CancelIcon from "../../../../shared/icons/CancelIcon";
import ChevronIcon from "../../../../shared/icons/ChevronIcon";
import EditPencilIcon from "../../../../shared/icons/EditPencilIcon";
import WaterIcon from "../../../../shared/icons/WaterIcon";
import MealIcon from "../../../../shared/icons/MealIcon";
import HotelBedIcon from "../../../../shared/icons/HotelBedIcon";
import BusIcon from "../../../../shared/icons/BusIcon";
import BusDownIcon from "../../../../shared/icons/BusDownIcon";
import BaggageIcon from "../../../../shared/icons/BaggageIcon";
import FapActionButton from "../FapActionButton/FapActionButton";
import FapChat from "../FapChat/FapChat";
import { isExternalUser, isAirlineRole } from "../../../../utils/access";
import { downloadRequestReport } from "../reports/buildReportSheets";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";

const STATUS_TRANSITIONS = {
  CREATED: ["ACCEPTED"],
  ACCEPTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
};

const STATUS_ACTION_LABELS = {
  ACCEPTED: "Принять заявку",
  IN_PROGRESS: "Начать выполнение",
  COMPLETED: "Завершить заявку",
};

const STATUS_CONFIRM_CONFIG = {
  ACCEPTED: {
    title: "Принятие заявки",
    body: "Вы собираетесь принять заявку. После подтверждения она перейдёт в статус «Принята» и будет готова к дальнейшему выполнению.",
  },
  IN_PROGRESS: {
    title: "Начало выполнения",
    body: "Вы собираетесь перевести заявку в статус «В работе». Это означает, что исполнение заявки началось.",
  },
  COMPLETED: {
    title: "Завершение заявки",
    body: "Вы собираетесь завершить заявку. После подтверждения все услуги считаются выполненными. Это действие необратимо.",
  },
};

const SERVICE_KEYS = ["water", "meal", "living", "transfer", "transferDeparture", "baggage"];

const SERVICE_ICON = {
  water: WaterIcon,
  meal: MealIcon,
  living: HotelBedIcon,
  transfer: BusIcon,
  transferDeparture: BusDownIcon,
  baggage: BaggageIcon,
};

const STATUS_PROGRESS = {
  NEW: 0,
  ACCEPTED: 25,
  IN_PROGRESS: 60,
  COMPLETED: 100,
  CANCELLED: 0,
};

const STATUS_VERB = {
  NEW: "Не начато",
  ACCEPTED: "Принято",
  IN_PROGRESS: "В работе",
  COMPLETED: "Готово",
  CANCELLED: "Отменено",
};

const STATUS_DOT_COLOR = {
  NEW: "#CBD2E4",
  ACCEPTED: "#3B82F6",
  IN_PROGRESS: "#F59E0B",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
};

// Парсит summary вида "6 / 9 чел." → { num: "6/9", unit: "чел.", pct: 67 }
// или "2 водителей" → { num: "2", unit: "водителей", pct: by status }
function parseServiceSummary(summary, status) {
  if (!summary) return { num: "—", unit: "", pct: 0 };
  const ratio = summary.match(/^(\d+)\s*\/\s*(\d+)\s*(.*)$/);
  if (ratio) {
    const cur = +ratio[1];
    const tot = +ratio[2];
    return {
      num: `${cur}/${tot}`,
      unit: ratio[3] || "",
      pct: tot ? Math.round((cur / tot) * 100) : 0,
    };
  }
  const single = summary.match(/^(\d+)\s+(.*)$/);
  if (single) {
    const n = +single[1];
    return {
      num: single[1],
      unit: single[2] || "",
      pct: status === "COMPLETED" ? 100 : n > 0 ? 60 : 0,
    };
  }
  return { num: "—", unit: summary, pct: 0 };
}

function getServiceData(serviceKey, request) {
  switch (serviceKey) {
    case "water":             return request.waterService;
    case "meal":              return request.mealService;
    case "living":            return request.livingService;
    case "transfer":          return request.transferService;
    case "transferDeparture": return request.departureTransferService;
    case "baggage":           return request.baggageDeliveryService;
    default:                  return null;
  }
}

function getServiceSummary(serviceKey, request) {
  switch (serviceKey) {
    case "water": {
      const s = request.waterService;
      return `${s?.people?.length ?? 0} / ${s?.plan?.peopleCount ?? 0} чел.`;
    }
    case "meal": {
      const s = request.mealService;
      return `${s?.people?.length ?? 0} / ${s?.plan?.peopleCount ?? 0} чел.`;
    }
    case "living": {
      const hotels = request.livingService?.hotels ?? [];
      const totalPeople = hotels.reduce((acc, h) => acc + (h.people?.length ?? 0), 0);
      const planCap = request.livingService?.plan?.peopleCount ?? 0;
      return `${totalPeople} / ${planCap} чел.`;
    }
    case "transfer": {
      const drivers = request.transferService?.drivers ?? [];
      const totalPeople = drivers.reduce((acc, d) => acc + (d.people?.length ?? 0), 0);
      const planCap = request.transferService?.plan?.peopleCount ?? 0;
      return `${totalPeople} / ${planCap} чел.`;
    }
    case "transferDeparture": {
      const drivers = request.departureTransferService?.drivers ?? [];
      const totalPeople = drivers.reduce((acc, d) => acc + (d.people?.length ?? 0), 0);
      const planCap = request.departureTransferService?.plan?.peopleCount ?? 0;
      return `${totalPeople} / ${planCap} чел.`;
    }
    case "baggage": {
      const planCap = request.baggageDeliveryService?.plan?.peopleCount ?? 0;
      return `${planCap} чел.`;
    }
    default:
      return "";
  }
}

export default function FapDetail({ user, canEdit = true }) {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const [showAddService, setShowAddService] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // 4A — статус-поповер. Какой именно якорь раскрыт: 'light' | 'bold' | null.
  const [statusAnchor, setStatusAnchor] = useState(null);
  const popoverRef = useRef(null);

  const { loading, data, refetch } = useQuery(GET_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId: requestId },
  });

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    onData: () => refetch(),
  });

  const [setStatus] = useMutation(SET_PASSENGER_REQUEST_STATUS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [cancelRequest] = useMutation(CANCEL_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const request = data?.passengerRequest;

  const enabledKeys = useMemo(() => {
    if (!request) return [];
    return SERVICE_KEYS.filter((k) => getServiceData(k, request)?.plan?.enabled);
  }, [request]);

  // Закрытие поповера по клику вне.
  useEffect(() => {
    if (!statusAnchor) return undefined;
    const onDown = (e) => {
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      const wraps = document.querySelectorAll("[data-statuspill]");
      for (const w of wraps) {
        if (w.contains(e.target)) return;
      }
      setStatusAnchor(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [statusAnchor]);

  const representativePwaLink = useMemo(() => {
    const links = request?.representativeLinks || [];
    if (!Array.isArray(links) || links.length === 0) return "";
    const byDepartment = user?.representativeDepartmentId
      ? links.find(
          (item) =>
            String(item?.representativeDepartmentId) ===
              String(user.representativeDepartmentId) && item?.linkPWA
        )
      : null;
    if (byDepartment?.linkPWA) return byDepartment.linkPWA;
    const firstWithPwa = links.find((item) => item?.linkPWA);
    return firstWithPwa?.linkPWA || "";
  }, [request?.representativeLinks, user?.representativeDepartmentId]);

  const canCopyRepresentativeLink = !isExternalUser(user) && Boolean(representativePwaLink);

  const handleCopyRepresentativeLink = async () => {
    try {
      await navigator.clipboard.writeText(representativePwaLink);
      success("Ссылка представительства скопирована");
    } catch {
      notifyError("Не удалось скопировать ссылку");
    }
  };

  if (loading) {
    return (
      <div className={classes.loader}>
        <MUILoader />
      </div>
    );
  }

  if (!request) {
    return (
      <div className={classes.page}>
        <div className={classes.emptyState}>Заявка не найдена</div>
      </div>
    );
  }

  const statusCfg = REQUEST_STATUS_CONFIG[request.status] || {};
  const nextStatuses = STATUS_TRANSITIONS[request.status] || [];
  const isFinal = request.status === "COMPLETED" || request.status === "CANCELLED";
  const popoverEnabled = canEdit && !isFinal;
  const canChangeStatus = canEdit && !isAirlineRole(user);

  const handleConfirmStatus = async () => {
    if (!pendingStatus) return;
    try {
      setSaving(true);
      await setStatus({ variables: { id: request.id, status: pendingStatus } });
      setShowStatusDialog(false);
      setPendingStatus(null);
      refetch();
      success("Статус обновлён");
    } catch {
      notifyError("Ошибка при смене статуса");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (reason) => {
    try {
      setSaving(true);
      await cancelRequest({
        variables: {
          id: request.id,
          cancelReason: reason,
        },
      });
      setShowCancelModal(false);
      refetch();
      success("Заявка отменена");
    } catch {
      notifyError("Ошибка при отмене");
    } finally {
      setSaving(false);
    }
  };

  // ── Поповер переходов статуса (4A) ──
  const renderStatusPopover = () => (
    <div className={classes.statusPopover} ref={popoverRef} role="menu">
      <div className={classes.statusPopoverHead}>
        {canChangeStatus ? "Перевести в статус" : "Действия с заявкой"}
      </div>
      <div className={classes.statusPopoverBody}>
        {canChangeStatus && nextStatuses.map((s) => {
          const cfg = REQUEST_STATUS_CONFIG[s] || {};
          return (
            <button
              key={s}
              type="button"
              className={classes.statusPopoverItem}
              onClick={() => {
                setStatusAnchor(null);
                setPendingStatus(s);
                setShowStatusDialog(true);
              }}
            >
              <span
                className={classes.statusPopoverIcon}
                style={{ background: cfg.bg, color: cfg.color }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L20 7" stroke={cfg.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className={classes.statusPopoverText}>
                <div className={classes.statusPopoverLabel}>
                  {STATUS_ACTION_LABELS[s] || cfg.label || s}
                </div>
                <div className={classes.statusPopoverHint}>Подтвердить переход</div>
              </span>
            </button>
          );
        })}
        {canChangeStatus && nextStatuses.length > 0 && <div className={classes.statusPopoverDivider} />}
        <button
          type="button"
          className={classes.statusPopoverItem}
          onClick={() => {
            setStatusAnchor(null);
            setShowCancelModal(true);
          }}
        >
          <span
            className={classes.statusPopoverIcon}
            style={{ background: "#FEF2F2", color: "#EF4444" }}
          >
            <CancelIcon color="#EF4444" />
          </span>
          <span className={classes.statusPopoverText}>
            <div className={classes.statusPopoverLabel}>Отменить заявку</div>
            <div className={classes.statusPopoverHint}>Действие необратимо</div>
          </span>
        </button>
      </div>
      <div className={classes.statusPopoverFoot}>
        Текущий статус: {statusCfg.label || request.status}
      </div>
    </div>
  );

  // Пилл-статус для светлой шапки.
  const renderLightStatusPill = () => {
    if (!popoverEnabled) {
      return (
        <span
          className={classes.statusBadge}
          style={{ color: statusCfg.color, background: statusCfg.bg }}
        >
          {statusCfg.label || request.status}
        </span>
      );
    }
    const open = statusAnchor === "light";
    return (
      <span className={classes.statusPillWrap} data-statuspill>
        <button
          type="button"
          className={classes.statusPillBtn}
          style={{
            color: statusCfg.color,
            background: statusCfg.bg,
            borderColor: statusCfg.color,
          }}
          onClick={() => setStatusAnchor(open ? null : "light")}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {statusCfg.label || request.status}
          <ChevronIcon
            width="14"
            height="14"
            className={`${classes.statusPillChevron} ${open ? classes.statusPillChevronOpen : ""}`}
          />
        </button>
        {open && renderStatusPopover()}
      </span>
    );
  };

  // Пилл-статус для смелой шапки.
  const renderBoldStatusPill = () => {
    if (!popoverEnabled) {
      return <span className={classes.boldStatusPill}>{statusCfg.label || request.status}</span>;
    }
    const open = statusAnchor === "bold";
    return (
      <span className={classes.statusPillWrap} data-statuspill>
        <button
          type="button"
          className={classes.boldStatusPillBtn}
          onClick={() => setStatusAnchor(open ? null : "bold")}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {statusCfg.label || request.status}
          <ChevronIcon
            width="14"
            height="14"
            className={`${classes.statusPillChevron} ${open ? classes.statusPillChevronOpen : ""}`}
          />
        </button>
        {open && renderStatusPopover()}
      </span>
    );
  };

  // ── 3C: KPI-плитки 3×2 ──
  const renderGrid = () => {
    if (enabledKeys.length === 0) {
      return <div className={classes.emptyState}>Услуги не подключены</div>;
    }
    return (
      <div className={classes.servicesGrid}>
        {enabledKeys.map((key) => {
          const cfg = SERVICE_CONFIG[key];
          const svc = getServiceData(key, request);
          const Icon = SERVICE_ICON[key];
          const status = svc?.status || "NEW";
          let m;
          if (key === "baggage") {
            const drivers = request.baggageDeliveryService?.drivers ?? [];
            const total = drivers.length;
            const done = drivers.filter((d) => d.deliveryCompletedAt).length;
            if (status === "COMPLETED") {
              m = total > 0
                ? { num: `${total}/${total}`, unit: "доставок", pct: 100 }
                : { num: "✓", unit: "доставлено", pct: 100 };
            } else if (total === 0) {
              m = { num: "—", unit: "ожидает заявок", pct: 0 };
            } else {
              m = {
                num: `${done}/${total}`,
                unit: "доставок",
                pct: total ? Math.round((done / total) * 100) : 0,
              };
            }
          } else {
            const summary = getServiceSummary(key, request);
            m = parseServiceSummary(summary, status);
          }
          const isCanc = status === "CANCELLED";
          const isDone = status === "COMPLETED";
          const isNew = status === "NEW";
          const muted = isNew || isCanc;
          const dotColor = STATUS_DOT_COLOR[status] || STATUS_DOT_COLOR.NEW;
          const deadline = svc?.plan?.plannedAt
            ? formatDateTime(svc.plan.plannedAt)
            : "—";

          // Для проживания вместо одного «до X» показываем диапазон + сутки.
          let livingMeta = null;
          if (key === "living") {
            const from = svc?.plan?.plannedFromAt;
            const to = svc?.plan?.plannedToAt;
            if (from || to) {
              const days = from && to ? calculateEffectiveCostDays(from, to) : null;
              livingMeta = `${from ? formatDate(from) : "—"} → ${to ? formatDate(to) : "—"}${
                days != null ? ` · ${days} сут.` : ""
              }`;
            }
          }

          return (
            <div
              key={key}
              className={classes.kpiTile}
              style={{
                "--svc-color": cfg.color,
                "--svc-shadow": `${cfg.color}22`,
              }}
              onClick={() => navigate(`/far/${request.id}/service/${key}`)}
              role="button"
              tabIndex={0}
            >
              {/* Top emblem strip */}
              <div
                className={classes.kpiTileEmblem}
                style={{
                  background: cfg.bg,
                  borderBottomColor: `${cfg.color}22`,
                }}
              >
                <div className={classes.kpiTileEmblemLeft}>
                  <div
                    className={classes.kpiTileIcon}
                    style={{
                      color: cfg.color,
                      boxShadow: `inset 0 0 0 1px ${cfg.color}33, 0 1px 2px ${cfg.color}26`,
                    }}
                  >
                    {Icon ? <Icon size={24} strokeWidth={2} /> : null}
                  </div>
                  <div className={classes.kpiTileEmblemText}>
                    <div className={classes.kpiTileTitle}>{cfg.label}</div>
                    <div
                      className={classes.kpiTileVerb}
                      style={{ color: cfg.color }}
                    >
                      {STATUS_VERB[status] || status}
                    </div>
                  </div>
                </div>
                <div
                  className={classes.kpiTileDot}
                  style={{ background: dotColor }}
                />
              </div>

              {/* KPI body */}
              <div
                className={classes.kpiTileBody}
                style={{ opacity: muted ? 0.6 : 1 }}
              >
                <div className={classes.kpiTileMetric}>
                  <div
                    className={classes.kpiTileNumber}
                    style={{ color: isCanc ? "var(--main-gray)" : "var(--text)" }}
                  >
                    {m.num}
                  </div>
                  <div className={classes.kpiTileUnit}>{m.unit}</div>
                </div>

                {!isCanc ? (
                  <div className={classes.kpiTileFooter}>
                    <div className={classes.kpiTileProgress}>
                      <div
                        className={classes.kpiTileProgressFill}
                        style={{
                          width: `${m.pct}%`,
                          background: isDone
                            ? "linear-gradient(90deg, #10B981, #34D399)"
                            : cfg.color,
                        }}
                      />
                    </div>
                    <div className={classes.kpiTileFooterRow}>
                      <span
                        className={classes.kpiTilePct}
                        style={{ color: isDone ? "#10B981" : cfg.color }}
                      >
                        {m.pct}%
                      </span>
                      <span className={classes.kpiTileMeta}>
                        {isDone ? (
                          <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M4 12l5 5L20 6"
                                stroke="#10B981"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            закрыто
                          </>
                        ) : (
                          <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                              <circle
                                cx="12"
                                cy="12"
                                r="9"
                                stroke="var(--main-gray)"
                                strokeWidth="1.8"
                              />
                              <path
                                d="M12 7v5l3 2"
                                stroke="var(--main-gray)"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {livingMeta ? livingMeta : <>до&nbsp;{deadline}</>}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={classes.kpiTileCancelled}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 6l12 12M6 18L18 6"
                        stroke="#EF4444"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    услуга отменена
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={classes.page}>
      <Header isExternalUser={isExternalUser(user)}>
        <div className={classes.headerNav}>
          <button
            className={classes.backBtn}
            onClick={() => navigate("/far")}
            aria-label="Назад"
          >
            <img src="/arrow.png" alt="" />
          </button>
          <span className={classes.headerNavTitle}>
            Заявка {request.requestNumber || request.flightNumber}
          </span>
          {canCopyRepresentativeLink && (
            <button
              type="button"
              className={classes.representativeLinkBtn}
              onClick={handleCopyRepresentativeLink}
              title="Скопировать ссылку для представительства"
            >
              Ссылка <CopyIcon />
            </button>
          )}
        </div>
      </Header>

      {/* Светлая шапка */}
      <div className={classes.stickyHeader}>
        <div className={classes.headerRow}>
          <div className={classes.headerLeft}>
            <span className={classes.airlineTag}>
              {request.airline?.images?.[0] ? (
                <img src={getMediaUrl(request.airline.images[0])} alt="" />
              ) : (
                <span className={classes.airlineLogoFallback}>
                  {(request.airline?.name || "?").trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span className={classes.airlineInfo}>
                <span className={classes.airlineName}>
                  {request.airline?.name || "—"}
                </span>
                {request.flightNumber && (
                  <span className={classes.airlineFlight}>
                    Рейс <strong>{request.flightNumber}</strong>
                  </span>
                )}
              </span>
            </span>
            {renderLightStatusPill()}
          </div>

          <div className={classes.headerRight}>
            {canEdit && !isFinal && (
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
            {canEdit && !isAirlineRole(user) && (
              <FapActionButton
                variant="secondary"
                onClick={async () => {
                  try { await downloadRequestReport(request, notifyError); }
                  catch (e) { notifyError("Ошибка экспорта"); console.error(e); }
                }}
              >
                Скачать отчёт
              </FapActionButton>
            )}
          </div>
        </div>
      </div>

      {/* Смелый вариант шапки — скрыт. Раскомментировать для сравнения.
      <div className={classes.boldHeader}>
        <div className={classes.boldLeft}>
          <div className={classes.boldLogo}>
            {request.airline?.images?.[0] ? (
              <img src={getMediaUrl(request.airline.images[0])} alt="" />
            ) : (
              <span className={classes.boldLogoFallback}>
                {(request.airline?.name || "?").trim().charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className={classes.boldInfo}>
            <div className={classes.boldAirline}>{request.airline?.name || "Авиакомпания"}</div>
            <div className={classes.boldSub}>
              <span className={classes.boldFlight}>Рейс {request.flightNumber}</span>
              {renderBoldStatusPill()}
            </div>
          </div>
        </div>

        <div className={classes.boldRight}>
          {canEdit && !isFinal && (
            <FapActionButton variant="secondary" onDark onClick={() => setShowAddService(true)}>
              <EditPencilIcon color="#fff" />
              Редактировать
            </FapActionButton>
          )}
          <FapActionButton
            variant="secondary"
            onDark
            active={showLogs}
            onClick={() => setShowLogs((v) => !v)}
          >
            <ScheduleIcon color={showLogs ? "var(--dark-blue)" : "#fff"} />
            История
          </FapActionButton>
        </div>
      </div>
      */}

      {/* Контентный ряд */}
      <div className={classes.contentRow}>
        <div className={classes.contentMain}>
          {renderGrid()}
        </div>
      </div>

      <FapChat
        passengerRequestId={request.id}
        token={token}
        user={user}
        flightNumber={request.flightNumber}
        requestNumber={request.requestNumber}
      />

      {canEdit && showAddService && (
        <AddRepresentativeService
          show={showAddService}
          onClose={() => {
            setShowAddService(false);
            refetch();
          }}
          request={request}
        />
      )}

      <PassengerRequestLogs
        show={showLogs}
        onClose={() => setShowLogs(false)}
        passengerRequestId={request.id}
      />

      <Dialog
        open={showStatusDialog}
        onClose={() => { setShowStatusDialog(false); setPendingStatus(null); }}
        PaperProps={{ sx: { borderRadius: "16px", minWidth: 440, maxWidth: 520 } }}
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
          {pendingStatus && STATUS_CONFIRM_CONFIG[pendingStatus]?.title}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important", pb: 1 }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#545873", margin: 0 }}>
            {pendingStatus && STATUS_CONFIRM_CONFIG[pendingStatus]?.body}
          </p>
        </DialogContent>
        <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
          <Button
            backgroundcolor="#F6F7FB"
            color="#545873"
            onClick={() => { setShowStatusDialog(false); setPendingStatus(null); }}
          >
            Назад
          </Button>
          <Button
            backgroundcolor="var(--dark-blue)"
            color="#fff"
            onClick={handleConfirmStatus}
            disabled={saving}
          >
            {saving ? "Сохранение..." : "Подтвердить"}
          </Button>
        </DialogActions>
      </Dialog>

      {canEdit && (
        <FapDestructiveModal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancel}
          title="Отмена заявки"
          description="После отмены заявка перейдёт в статус «Отменена». Это действие необратимо."
          showReason
          reasonRequired={false}
          placeholder="Причина отмены (необязательно)"
          confirmText="Отменить заявку"
          cancelText="Назад"
          saving={saving}
        />
      )}
    </div>
  );
}
