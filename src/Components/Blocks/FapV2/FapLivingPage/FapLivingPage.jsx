import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "./FapLivingPage.module.css";
import {
  REMOVE_PASSENGER_REQUEST_HOTEL,
  UPDATE_PASSENGER_REQUEST_HOTEL,
  COMPLETE_PASSENGER_REQUEST_LIVING_EARLY,
  getCookie,
} from "../../../../../graphQL_requests";
import { SERVICE_STATUS_CONFIG, formatDate, formatDateTime } from "../fapConstants";
import { calculateEffectiveCostDays } from "../../../../utils/effectiveCostDays";
import { isExternalUser } from "../../../../utils/access";
import { downloadLivingReport } from "../reports/buildReportSheets";
import { useToast } from "../../../../contexts/ToastContext";
import Button from "../../../Standart/Button/Button";
import FapActionButton from "../FapActionButton/FapActionButton";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";
import AddRepresentativeHotel from "../../AddRepresentativeHotel/AddRepresentativeHotel";
import AddRepresentativeService from "../../AddRepresentativeService/AddRepresentativeService";
import PassengerRequestLogs from "../../LogsHistory/PassengerRequestLogs";
import HotelBedIcon from "../../../../shared/icons/HotelBedIcon";
import EditPencilIcon from "../../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import ScheduleIcon from "../../../../shared/icons/ScheduleIcon";
import CopyIcon from "../../../../shared/icons/CopyIcon";

const LIV = "#10B981";
const LIV_BG = "#ECFDF5";

const PlusSvg = ({ size = 15, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
const LinkSvg = ({ size = 14, color = "#0057C3", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ArrowRightSvg = ({ size = 14, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 5l7 7-7 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const initials = (fullName) => {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function FapLivingPage({
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

  const isExtHotel = isExternalUser(user) && user?.scope === "HOTEL";

  const [showAddHotel, setShowAddHotel] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const [removeHotelIndex, setRemoveHotelIndex] = useState(null);
  const [editHotelState, setEditHotelState] = useState(null); // { index, peopleCount }
  const [saving, setSaving] = useState(false);

  const [removeHotel] = useMutation(REMOVE_PASSENGER_REQUEST_HOTEL, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [updateHotel] = useMutation(UPDATE_PASSENGER_REQUEST_HOTEL, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [completeEarly] = useMutation(COMPLETE_PASSENGER_REQUEST_LIVING_EARLY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const hotels = service?.hotels || [];
  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};
  const isCompleted = service?.status === "COMPLETED" || service?.status === "CANCELLED";

  const displayHotels = useMemo(
    () =>
      hotels
        .map((hotel, idx) => ({ hotel, origIdx: idx }))
        .filter(({ hotel }) => !isExtHotel || String(hotel.hotelId) === String(user?.hotelId)),
    [hotels, isExtHotel, user?.hotelId]
  );

  // Внешний пользователь гостиницы видит только свою страницу — пропускаем
  // экран списка и сразу переходим на свою гостиницу.
  useEffect(() => {
    if (isExtHotel && displayHotels.length > 0) {
      const idx = displayHotels[0].origIdx;
      navigate(`/far/${requestId}/service/living/hotel/${idx}`, { replace: true });
    }
  }, [isExtHotel, displayHotels, navigate, requestId]);

  const planCap = service?.plan?.peopleCount ?? null;
  const totalGuests = hotels.reduce((s, h) => s + (h.people?.length || 0), 0);
  const totalCapacity = planCap ?? hotels.reduce((s, h) => s + (h.peopleCount || 0), 0);
  const unplaced = planCap != null ? Math.max(0, planCap - totalGuests) : 0;

  const copyLink = (url) => {
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => success("Ссылка скопирована"))
      .catch(() => notifyError("Не удалось скопировать ссылку"));
  };

  const handleRemoveHotel = async () => {
    if (removeHotelIndex == null) return;
    try {
      setSaving(true);
      await removeHotel({ variables: { requestId: request.id, hotelIndex: removeHotelIndex } });
      setRemoveHotelIndex(null);
      onRefetch?.();
      success("Гостиница удалена");
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при удалении гостиницы");
    } finally {
      setSaving(false);
    }
  };

  const openEditHotel = (origIdx) => {
    const h = hotels[origIdx];
    if (!h) return;
    setEditHotelState({
      index: origIdx,
      peopleCount: String(h.peopleCount ?? 0),
    });
  };

  const handleSaveHotelEdit = async () => {
    if (!editHotelState) return;
    const newCount = Number(editHotelState.peopleCount);
    if (!Number.isFinite(newCount) || newCount <= 0) {
      notifyError("Укажите корректное количество мест");
      return;
    }
    const h = hotels[editHotelState.index];
    const currentPlaced = h?.people?.length || 0;
    if (newCount < currentPlaced) {
      notifyError(
        `Нельзя задать меньше количества уже размещённых человек (${currentPlaced})`
      );
      return;
    }
    // Проверка против плана услуги: новое значение не должно превышать остаток
    // по плану заявки (плюс текущая ёмкость этого отеля).
    if (planCap != null) {
      const sumOthers = hotels.reduce(
        (s, hh, i) => s + (i === editHotelState.index ? 0 : hh.peopleCount || 0),
        0
      );
      const maxAllowed = planCap - sumOthers;
      if (newCount > maxAllowed) {
        notifyError(
          `Превышен план услуги. Максимум для этой гостиницы: ${Math.max(0, maxAllowed)}`
        );
        return;
      }
    }
    try {
      setSaving(true);
      await updateHotel({
        variables: {
          requestId: request.id,
          hotelIndex: editHotelState.index,
          hotel: {
            name: h.name || "",
            peopleCount: newCount,
            address: h.address || null,
            link: h.link || null,
            hotelId: h.hotelId || null,
          },
        },
      });
      setEditHotelState(null);
      onRefetch?.();
      success("Гостиница обновлена");
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при обновлении гостиницы");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteEarly = async (reason) => {
    try {
      setSaving(true);
      await completeEarly({ variables: { requestId: request.id, reason } });
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
          <div className={classes.headIcon}>
            <HotelBedIcon size={22} strokeWidth={2} />
          </div>
          <div className={classes.headText}>
            <div className={classes.headTitleRow}>
              <span className={classes.headTitle}>Проживание</span>
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
          {canEdit && !isCompleted && !isExtHotel && (
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
          {!isExternalUser(user) && (
            <FapActionButton
              variant="secondary"
              onClick={async () => {
                try { await downloadLivingReport(request); }
                catch (e) { notifyError("Ошибка экспорта"); console.error(e); }
              }}
            >
              Скачать отчёт
            </FapActionButton>
          )}
          {canEdit && !isCompleted && !isExtHotel && (
            <button
              type="button"
              className={classes.addHotelBtn}
              onClick={() => setShowAddHotel(true)}
            >
              <PlusSvg /> Добавить гостиницу
            </button>
          )}
          {canEdit && !isCompleted && !isExtHotel && (
            <button
              type="button"
              className={classes.finishBtn}
              onClick={() => setShowEarlyModal(true)}
            >
              Завершить услугу
            </button>
          )}
        </div>
      </div>

      {/* ── Overview card ── */}
      <div className={classes.overview}>
        <div className={classes.overviewRow}>
          {/* KPI */}
          <div className={classes.kpi}>
            <div className={classes.kpiLabel}>Размещено</div>
            <div className={classes.kpiValueRow}>
              <span className={classes.kpiValue}>{totalGuests}</span>
              <span className={classes.kpiTotal}>/ {totalCapacity || 0}</span>
            </div>
            <div className={classes.kpiSub}>чел. по плану заявки</div>
          </div>

          {/* Distribution bar */}
          <div className={classes.distribution}>
            <div className={classes.distributionHead}>
              <span className={classes.distributionTitle}>Распределение по гостиницам</span>
              {unplaced > 0 && (
                <span className={classes.unplacedBadge}>
                  <span className={classes.unplacedDot} />
                  {unplaced} не размещены
                </span>
              )}
            </div>
            <div className={classes.segments}>
              {displayHotels.length === 0 ? (
                <div className={classes.segmentsEmpty}>Гостиницы ещё не добавлены</div>
              ) : (
                displayHotels.map(({ hotel, origIdx }) => {
                  const cap = hotel.peopleCount || 0;
                  const placed = hotel.people?.length || 0;
                  const full = cap > 0 && placed >= cap;
                  const pct = cap > 0 ? Math.min(100, Math.round((placed / cap) * 100)) : 0;
                  return (
                    <div
                      key={hotel.itemId || origIdx}
                      className={classes.segment}
                      style={{
                        flex: cap || 1,
                        background: full ? LIV_BG : "#F1F4FB",
                        borderColor: full ? `${LIV}55` : "#E4E4EF",
                      }}
                    >
                      <div
                        className={classes.segmentFill}
                        style={{
                          width: `${pct}%`,
                          background: full ? LIV : `${LIV}22`,
                        }}
                      />
                      <div className={classes.segmentLabel}>
                        <span
                          className={classes.segmentName}
                          style={{ color: full ? "#fff" : "var(--main-gray)" }}
                          title={hotel.name}
                        >
                          {hotel.name || "Гостиница"}
                        </span>
                        <span
                          className={classes.segmentCount}
                          style={{ color: full ? "#fff" : "var(--main-gray)" }}
                        >
                          {placed}/{cap}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className={classes.overviewFoot}>
          {service.plan?.plannedFromAt && (
            <div className={classes.metric}>
              <span className={classes.metricLabel}>Заселение</span>
              <span className={classes.metricValue}>{formatDateTime(service.plan.plannedFromAt)}</span>
            </div>
          )}
          {service.plan?.plannedToAt && (
            <div className={classes.metric}>
              <span className={classes.metricLabel}>Выселение</span>
              <span className={classes.metricValue}>{formatDateTime(service.plan.plannedToAt)}</span>
            </div>
          )}
          {(() => {
            const a = service.plan?.plannedFromAt;
            const b = service.plan?.plannedToAt;
            if (!a || !b) return null;
            const days = calculateEffectiveCostDays(a, b);
            return (
              <div className={classes.metric}>
                <span className={classes.metricLabel}>Суток</span>
                <span className={classes.metricValue}>{days}</span>
              </div>
            );
          })()}
          <span className={classes.spacer} />
          <span className={classes.hotelsCount}>
            Гостиниц: <strong>{displayHotels.length}</strong>
          </span>
        </div>
      </div>

      {/* ── Hotels list ── */}
      <div className={classes.hotels}>
        {displayHotels.length === 0 ? (
          <div className={classes.emptyHotels}>
            <HotelBedIcon size={36} strokeWidth={1.6} />
            <div className={classes.emptyHotelsText}>Гостиницы ещё не добавлены</div>
            {canEdit && !isCompleted && !isExtHotel && (
              <button
                type="button"
                className={classes.addHotelBtn}
                onClick={() => setShowAddHotel(true)}
              >
                <PlusSvg /> Добавить гостиницу
              </button>
            )}
          </div>
        ) : (
          displayHotels.map(({ hotel, origIdx }) => (
            <HotelCard
              key={hotel.itemId || origIdx}
              hotel={hotel}
              showLinks={showLinks}
              canEdit={canEdit}
              isExtHotel={isExtHotel}
              isCompleted={isCompleted}
              onOpen={() => navigate(`/far/${requestId}/service/living/hotel/${origIdx}`)}
              onCopyLink={copyLink}
              onEdit={() => openEditHotel(origIdx)}
              onRemove={() => setRemoveHotelIndex(origIdx)}
            />
          ))
        )}
      </div>

      {/* ── Dialogs ── */}
      {showAddHotel && (
        <AddRepresentativeHotel
          show={showAddHotel}
          onClose={() => {
            setShowAddHotel(false);
            onRefetch?.();
          }}
          request={request}
        />
      )}

      {canEdit && showAddService && (
        <AddRepresentativeService
          show={showAddService}
          onClose={() => {
            setShowAddService(false);
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

      <FapDestructiveModal
        open={removeHotelIndex !== null}
        onClose={() => setRemoveHotelIndex(null)}
        onConfirm={handleRemoveHotel}
        title="Удалить гостиницу"
        description="Гостиница и все её пассажиры будут удалены из заявки. Отчёт по этой гостинице также будет удалён. Это действие необратимо."
        confirmText="Удалить"
        cancelText="Отмена"
        saving={saving}
      />

      {/* Edit hotel capacity dialog */}
      <Dialog
        open={editHotelState !== null}
        onClose={() => setEditHotelState(null)}
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
          Изменить количество мест
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}>
          {editHotelState && (() => {
            const h = hotels[editHotelState.index];
            const currentPlaced = h?.people?.length || 0;
            const sumOthers = hotels.reduce(
              (s, hh, i) => s + (i === editHotelState.index ? 0 : hh.peopleCount || 0),
              0
            );
            const maxAllowed = planCap != null ? Math.max(0, planCap - sumOthers) : null;
            return (
              <>
                <div style={{ fontSize: 13, color: "#545873" }}>
                  Гостиница: <strong style={{ color: "var(--text)" }}>{h?.name || "—"}</strong>
                </div>
                <div className={classes.editHotelField}>
                  <label className={classes.editHotelLabel}>Количество мест *</label>
                  <input
                    type="number"
                    min={1}
                    className={classes.editHotelInput}
                    value={editHotelState.peopleCount}
                    onChange={(e) =>
                      setEditHotelState((s) => ({ ...s, peopleCount: e.target.value }))
                    }
                    autoFocus
                  />
                  <div className={classes.editHotelHint}>
                    Сейчас размещено: <strong>{currentPlaced}</strong>
                    {maxAllowed != null && (
                      <> · Максимум по плану: <strong>{maxAllowed}</strong></>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
          <Button backgroundcolor="#F6F7FB" color="#545873" onClick={() => setEditHotelState(null)}>
            Отмена
          </Button>
          <Button
            backgroundcolor="var(--dark-blue)"
            color="#fff"
            onClick={handleSaveHotelEdit}
            disabled={saving}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// HotelCard — hotel-level only: open / links / delete.
// Guest management lives inside the hotel page (opened via "Открыть").
// ──────────────────────────────────────────────────────────────────
function HotelCard({
  hotel, showLinks, canEdit, isExtHotel, isCompleted,
  onOpen, onCopyLink, onEdit, onRemove,
}) {
  const cap = hotel.peopleCount || 0;
  const people = hotel.people || [];
  const placed = people.length;
  const isFull = cap > 0 && placed >= cap;
  const isEmpty = placed === 0;
  const pct = cap > 0 ? Math.min(100, Math.round((placed / cap) * 100)) : 0;

  const passengers = people.filter((p) => p?.personType !== "CREW").length;
  const crew = placed - passengers;

  const previewPeople = people.slice(0, 4);
  const extraCount = placed - previewPeople.length;

  const canRemove = canEdit && !isCompleted && !isExtHotel;

  return (
    <div className={classes.hotelCard}>
      <div className={classes.hotelHead}>
        <div
          className={classes.hotelBar}
          style={{ background: isEmpty ? "#CBD2E4" : LIV }}
        />
        <div className={classes.hotelInfo}>
          <div className={classes.hotelNameRow}>
            <span className={classes.hotelName}>{hotel.name || "Гостиница"}</span>
            {isFull && <span className={classes.fullBadge}>заполнен</span>}
          </div>
          {(hotel.address || hotel.checkInAt || hotel.checkOutAt) && (
            <div className={classes.hotelMeta}>
              {hotel.address && <span>{hotel.address}</span>}
              {hotel.address && (hotel.checkInAt || hotel.checkOutAt) && (
                <span className={classes.metaDot} />
              )}
              {(hotel.checkInAt || hotel.checkOutAt) && (
                <span className={classes.hotelDates}>
                  {hotel.checkInAt && formatDate(hotel.checkInAt)}
                  {hotel.checkInAt && hotel.checkOutAt && (
                    <span className={classes.dateSep}>→</span>
                  )}
                  {hotel.checkOutAt && formatDate(hotel.checkOutAt)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Read-only occupancy glance */}
        <div className={classes.hotelOccupancy}>
          {!isEmpty && (
            <div className={classes.avatarStack}>
              {previewPeople.map((p, i) => (
                <span
                  key={i}
                  className={classes.stackAvatar}
                  style={{
                    background: p?.personType === "CREW" ? "#8B5CF6" : LIV,
                    marginLeft: i === 0 ? 0 : -8,
                  }}
                  title={p?.fullName || ""}
                >
                  {initials(p?.fullName)}
                </span>
              ))}
              {extraCount > 0 && (
                <span
                  className={classes.stackAvatarMore}
                  style={{ marginLeft: -8 }}
                >
                  +{extraCount}
                </span>
              )}
            </div>
          )}
          <div className={classes.miniBar}>
            <div
              className={classes.miniBarFill}
              style={{ width: `${pct}%`, background: isEmpty ? "transparent" : LIV }}
            />
          </div>
          <span
            className={classes.occupancyText}
            style={{ color: isFull ? LIV : "var(--main-gray)" }}
          >
            {placed}/{cap || 0}
          </span>
        </div>

        {/* Hotel-level actions */}
        {showLinks && hotel.linkCRM && (
          <button
            type="button"
            className={classes.linkBtn}
            onClick={() => onCopyLink(hotel.linkCRM)}
            title="Скопировать ссылку «Сайт»"
          >
            <LinkSvg /> Сайт <CopyIcon />
          </button>
        )}
        {showLinks && hotel.linkPWA && (
          <button
            type="button"
            className={classes.linkBtn}
            onClick={() => onCopyLink(hotel.linkPWA)}
            title="Скопировать ссылку «Сканер»"
          >
            <LinkSvg /> Сканер <CopyIcon />
          </button>
        )}
        {showLinks && !hotel.linkCRM && !hotel.linkPWA && hotel.link && (
          <button
            type="button"
            className={classes.linkBtn}
            onClick={() => onCopyLink(hotel.link)}
            title="Скопировать ссылку"
          >
            <LinkSvg /> Ссылка <CopyIcon />
          </button>
        )}
        <button type="button" className={classes.openBtn} onClick={onOpen}>
          Открыть <ArrowRightSvg />
        </button>
        {canRemove && (
          <button
            type="button"
            className={classes.editBtn}
            onClick={onEdit}
            title="Изменить количество мест"
            aria-label="Изменить количество мест"
          >
            <EditPencilIcon color="#545873" cursor="pointer" />
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            className={classes.removeBtn}
            onClick={onRemove}
            title="Удалить гостиницу"
            aria-label="Удалить гостиницу"
          >
            <DeleteIcon cursor="pointer" />
          </button>
        )}
      </div>

      {/* Read-only summary strip */}
      <div className={classes.hotelStrip}>
        {isEmpty ? (
          <>
            <HotelBedIcon size={14} strokeWidth={1.8} />
            <span>
              Пассажиров пока нет
              {cap > 0 && (
                <>
                  {" · "}
                  <strong>{cap}</strong> свободных мест
                </>
              )}
              {" — "}
              <strong className={classes.stripHint} onClick={onOpen}>Открыть</strong>
              {", чтобы заселить пассажиров или экипаж"}
            </span>
          </>
        ) : (
          <>
            <span className={classes.stripItem}>
              <span className={classes.stripDotPassenger} />
              {passengers} {passengers === 1 ? "пассажир" : passengers >= 2 && passengers <= 4 ? "пассажира" : "пассажиров"}
            </span>
            {crew > 0 && (
              <span className={classes.stripItem}>
                <span className={classes.stripDotCrew} />
                {crew} экипаж
              </span>
            )}
            <span className={classes.metaDot} />
            <span className={classes.stripHintText}>
              работа с пассажирами, отчёт и тарифы — на странице гостиницы
            </span>
          </>
        )}
      </div>
    </div>
  );
}
