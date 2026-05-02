import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@apollo/client";
import classes from "../FapDetail/FapDetail.module.css";
import lClasses from "./FapLivingSection.module.css";
import {
  COMPLETE_PASSENGER_REQUEST_LIVING_EARLY,
  REMOVE_PASSENGER_REQUEST_HOTEL,
  getCookie,
} from "../../../../../graphQL_requests";
import { SERVICE_STATUS_CONFIG, formatDate } from "../fapConstants";
import Button from "../../../Standart/Button/Button";
import AddRepresentativeHotel from "../../AddRepresentativeHotel/AddRepresentativeHotel";
import HotelGuestsModal from "./HotelGuestsModal";
import { useToast } from "../../../../contexts/ToastContext";
import DeleteIcon from "../../../../shared/icons/DeleteIcon.jsx";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";

export default function FapLivingSection({ service, color, request, onRefetch, isOpen, onToggle, isPage, canEdit = true, showLinks = true }) {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const [showAddHotel, setShowAddHotel] = useState(false);
  const [expandedHotels, setExpandedHotels] = useState({});

  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [hotelMgmtIndex, setHotelMgmtIndex] = useState(null);
  const [removeHotelIndex, setRemoveHotelIndex] = useState(null);

  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};

  const [completeLivingEarly] = useMutation(COMPLETE_PASSENGER_REQUEST_LIVING_EARLY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [removeHotel] = useMutation(REMOVE_PASSENGER_REQUEST_HOTEL, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const copyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url)
      .then(() => success("Ссылка скопирована"))
      .catch(() => notifyError("Не удалось скопировать ссылку"));
  };

  if (!service?.plan?.enabled) return null;

  const hotels = service.hotels || [];
  const isCompleted = service.status === "COMPLETED" || service.status === "CANCELLED";

  const toggleHotel = (idx) =>
    setExpandedHotels((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const totalCapacity = hotels.reduce((s, h) => s + (h.peopleCount || 0), 0);
  const totalGuests = hotels.reduce((s, h) => s + (h.people?.length || 0), 0);

  const handleRemoveHotel = async () => {
    try {
      setSaving(true);
      await removeHotel({ variables: { requestId: request.id, hotelIndex: removeHotelIndex } });
      setRemoveHotelIndex(null);
      onRefetch();
      success("Отель удален");
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message ?? "Ошибка при удалении отеля");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteEarly = async (reason) => {
    try {
      setSaving(true);
      await completeLivingEarly({ variables: { requestId: request.id, reason } });
      setShowEarlyModal(false);
      onRefetch();
      success("Услуга завершена досрочно");
    } catch {
      notifyError("Ошибка при завершении");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={classes.section}>
      <div className={classes.sectionHeader} onClick={onToggle}>
        <div className={classes.sectionHeaderLeft}>
          <div className={classes.sectionDot} style={{ background: color }} />
          <span className={classes.sectionName}>Проживание</span>
          <span className={classes.svcStatusBadge} style={{ color: statusCfg.color, background: statusCfg.bg }}>
            {statusCfg.label || service.status}
          </span>
        </div>
        <div className={classes.sectionHeaderRight}>
          <span className={lClasses.guestSummary}>
            {totalGuests}/{totalCapacity} гостей
          </span>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            {hotels.length}{" "}
            {hotels.length === 1 ? "отель" : hotels.length < 5 ? "отеля" : "отелей"}
          </span>
          {!isPage && <span className={`${classes.chevron} ${isOpen ? classes.chevronOpen : ""}`}>▾</span>}
        </div>
      </div>

      {isOpen && (
        <div className={classes.sectionBody}>
          <div className={classes.topRow}>
            <div className={classes.planRow}>
              {service.plan?.peopleCount && (
                <div className={classes.planItem}>
                  <span className={classes.planLabel}>Мест по плану</span>
                  <span className={classes.planValue}>{service.plan.peopleCount}</span>
                </div>
              )}
              {service.plan?.plannedFromAt && (
                <div className={classes.planItem}>
                  <span className={classes.planLabel}>Заселение</span>
                  <span className={classes.planValue}>{formatDate(service.plan.plannedFromAt)}</span>
                </div>
              )}
              {service.plan?.plannedToAt && (
                <div className={classes.planItem}>
                  <span className={classes.planLabel}>Выселение</span>
                  <span className={classes.planValue}>{formatDate(service.plan.plannedToAt)}</span>
                </div>
              )}
            </div>
            {canEdit && !isCompleted && (
              <div className={classes.actionsRow}>
                <Button
                  backgroundcolor="var(--dark-blue)"
                  color="#fff"
                  onClick={() => setShowAddHotel(true)}
                >
                  + Добавить отель
                </Button>
                <Button
                  backgroundcolor="#FEF2F2"
                  color="#EF4444"
                  onClick={() => setShowEarlyModal(true)}
                >
                  Завершить досрочно
                </Button>
              </div>
            )}
          </div>

          {hotels.map((hotel, idx) => {
            const people = hotel.people || [];
            const capacity = hotel.peopleCount || 0;
            const fillPct = capacity > 0 ? Math.min(100, Math.round((people.length / capacity) * 100)) : 0;
            const isFull = capacity > 0 && people.length >= capacity;
            const isExpanded = expandedHotels[idx];

            return (
              <div key={hotel.itemId || idx} className={lClasses.hotelCard}>
                <div className={lClasses.hotelHeader} onClick={() => toggleHotel(idx)}>
                  <div className={lClasses.hotelHeaderLeft}>
                    <div
                      className={lClasses.hotelColorBar}
                      style={{ background: isFull ? "#10B981" : color }}
                    />
                    <div className={lClasses.hotelInfo}>
                      <div className={lClasses.hotelName}>{hotel.name || "Отель"}</div>
                      {hotel.address && (
                        <div className={lClasses.hotelAddress}>{hotel.address}</div>
                      )}
                    </div>
                  </div>

                  <div className={lClasses.hotelHeaderRight}>
                    {(hotel.checkInAt || hotel.checkOutAt) && (
                      <div className={lClasses.hotelDates}>
                        <span>{formatDate(hotel.checkInAt)}</span>
                        {hotel.checkOutAt && (
                          <>
                            <span className={lClasses.dateSep}>→</span>
                            <span>{formatDate(hotel.checkOutAt)}</span>
                          </>
                        )}
                      </div>
                    )}
                    <div
                      className={lClasses.occupancyChip}
                      style={{
                        background: isFull ? "#ECFDF5" : "#F1F5F9",
                        color: isFull ? "#10B981" : "#64748B",
                      }}
                    >
                      {people.length}{capacity > 0 ? `/${capacity}` : ""}
                    </div>
                    <button
                      className={lClasses.reportBtn}
                      onClick={(e) => { e.stopPropagation(); navigate(`/fapv2/${requestId}/report/${idx}`); }}
                      title="Отчёт по отелю"
                    >
                      Отчёт
                    </button>
                    <button
                      className={lClasses.mgmtBtn}
                      onClick={(e) => { e.stopPropagation(); setHotelMgmtIndex(idx); }}
                      title="Управление гостями"
                    >
                      Гости
                    </button>
                    {showLinks && ((hotel.linkCRM || hotel.linkPWA) ? (
                      <>
                        {hotel.linkCRM && (
                          <button
                            className={lClasses.linkBtn}
                            onClick={(e) => { e.stopPropagation(); copyLink(hotel.linkCRM); }}
                            title="Скопировать CRM-ссылку"
                          >
                            CRM
                          </button>
                        )}
                        {hotel.linkPWA && (
                          <button
                            className={lClasses.linkBtn}
                            onClick={(e) => { e.stopPropagation(); copyLink(hotel.linkPWA); }}
                            title="Скопировать PWA-ссылку"
                          >
                            PWA
                          </button>
                        )}
                      </>
                    ) : hotel.link ? (
                      <button
                        className={lClasses.linkBtn}
                        onClick={(e) => { e.stopPropagation(); copyLink(hotel.link); }}
                        title="Скопировать ссылку"
                      >
                        Ссылка
                      </button>
                    ) : null)}
                    {canEdit && !isCompleted && (
                      <button
                        className={lClasses.deleteBtn}
                        onClick={(e) => { e.stopPropagation(); setRemoveHotelIndex(idx); }}
                        title="Удалить отель"
                      >
                        <DeleteIcon cursor="pointer" />
                      </button>
                    )}
                    <span className={`${classes.chevron} ${isExpanded ? classes.chevronOpen : ""}`}>▾</span>
                  </div>
                </div>

                {capacity > 0 && (
                  <div className={lClasses.progressBar}>
                    <div
                      className={lClasses.progressFill}
                      style={{ width: `${fillPct}%`, background: isFull ? "#10B981" : color }}
                    />
                  </div>
                )}

                {isExpanded && (
                  <div className={lClasses.hotelBody}>
                    {people.length === 0 ? (
                      <div className={lClasses.emptyGuests}>
                        <span className={lClasses.emptyGuestsIcon}>🛏</span>
                        <span>Гости ещё не добавлены</span>
                        {canEdit && !isCompleted && (
                          <Button
                            backgroundcolor="var(--dark-blue)"
                            color="#fff"
                            onClick={(e) => { e.stopPropagation(); setHotelMgmtIndex(idx); }}
                          >
                            + Добавить гостя
                          </Button>
                        )}
                      </div>
                    ) : (
                      <table className={classes.table}>
                        <thead>
                          <tr>
                            <th>ФИО</th>
                            <th>Телефон</th>
                            <th>Номер</th>
                            <th>Категория</th>
                          </tr>
                        </thead>
                        <tbody>
                          {people.map((p, pi) => (
                            <tr key={pi}>
                              <td>{p.fullName || "—"}</td>
                              <td>{p.phone || "—"}</td>
                              <td>
                                {p.roomNumber ? (
                                  <span className={lClasses.roomBadge}>{p.roomNumber}</span>
                                ) : "—"}
                              </td>
                              <td>
                                {p.roomCategory ? (
                                  <span className={lClasses.categoryBadge}>{p.roomCategory}</span>
                                ) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}


        </div>
      )}

      {showAddHotel && (
        <AddRepresentativeHotel
          show={showAddHotel}
          onClose={() => { setShowAddHotel(false); onRefetch(); }}
          request={request}
        />
      )}

      <HotelGuestsModal
        open={hotelMgmtIndex != null}
        onClose={() => setHotelMgmtIndex(null)}
        request={request}
        hotel={hotelMgmtIndex != null ? hotels[hotelMgmtIndex] : null}
        hotelIndex={hotelMgmtIndex ?? 0}
        onRefetch={onRefetch}
        canEdit={canEdit}
        onGenerateReport={
          hotelMgmtIndex != null
            ? () => {
                const idx = hotelMgmtIndex;
                setHotelMgmtIndex(null);
                navigate(`/fapv2/${requestId}/report/${idx}`);
              }
            : undefined
        }
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
        title="Удалить отель"
        description="Отель и все его гости будут удалены из заявки. Отчёт по этому отелю также будет удалён. Это действие необратимо."
        confirmText="Удалить"
        cancelText="Отмена"
        saving={saving}
      />
    </div>
  );
}
