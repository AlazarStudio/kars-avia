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
import { isExternalUser } from "../../../../utils/access";
import Button from "../../../Standart/Button/Button";
import AddRepresentativeHotel from "../../AddRepresentativeHotel/AddRepresentativeHotel";
import HotelGuestsModal from "./HotelGuestsModal";
import { useToast } from "../../../../contexts/ToastContext";
import DeleteIcon from "../../../../shared/icons/DeleteIcon.jsx";
import ChevronIcon from "../../../../shared/icons/ChevronIcon.jsx";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";
import PersonTypeToggle from "../PersonTypeToggle/PersonTypeToggle";
import PersonBadge from "../PersonBadge/PersonBadge";
import HomeIcon from "../../../../shared/icons/HomeIcon.jsx";

export default function FapLivingSection({ service, color, request, onRefetch, isOpen, onToggle, isPage, canEdit = true, showLinks = true, user }) {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const isExtHotel = isExternalUser(user) && user?.scope === "HOTEL";

  const [showAddHotel, setShowAddHotel] = useState(false);
  const [expandedHotels, setExpandedHotels] = useState({});

  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [hotelMgmtIndex, setHotelMgmtIndex] = useState(null);
  const [removeHotelIndex, setRemoveHotelIndex] = useState(null);
  const [personMode, setPersonMode] = useState("PASSENGER"); // PASSENGER | CREW

  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};
  const matchesMode = (p) => (p?.personType === "CREW" ? "CREW" : "PASSENGER") === personMode;

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

  const displayHotels = hotels
    .map((hotel, idx) => ({ hotel, origIdx: idx }))
    .filter(({ hotel }) => !isExtHotel || String(hotel.hotelId) === String(user?.hotelId));

  const toggleHotel = (origIdx) =>
    setExpandedHotels((prev) => ({ ...prev, [origIdx]: !prev[origIdx] }));

  const totalCapacity = service.plan?.peopleCount ?? hotels.reduce((s, h) => s + (h.peopleCount || 0), 0);
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
          {!isPage && <ChevronIcon className={`${classes.chevron} ${isOpen ? classes.chevronOpen : ""}`} />}
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
            {canEdit && !isCompleted && !isExtHotel && (
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

          {request?.includesCrew && (
            <div style={{ padding: "0 0 12px" }}>
              <PersonTypeToggle value={personMode} onChange={setPersonMode} />
            </div>
          )}

          {displayHotels.map(({ hotel, origIdx }) => {
            const people = hotel.people || [];
            const displayPeople = people.filter(matchesMode);
            const capacity = hotel.peopleCount || 0;
            const fillPct = capacity > 0 ? Math.min(100, Math.round((people.length / capacity) * 100)) : 0;
            const isFull = capacity > 0 && people.length >= capacity;
            const isExpanded = isExtHotel || expandedHotels[origIdx];

            return (
              <div key={hotel.itemId || origIdx} className={lClasses.hotelCard}>
                <div className={lClasses.hotelHeader} onClick={() => toggleHotel(origIdx)}>
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
                      onClick={(e) => { e.stopPropagation(); navigate(`/far/${requestId}/report/${origIdx}`); }}
                      title="Отчёт по отелю"
                    >
                      Отчёт
                    </button>
                    <button
                      className={lClasses.mgmtBtn}
                      onClick={(e) => { e.stopPropagation(); setHotelMgmtIndex(origIdx); }}
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
                            title="Скопировать ссылку Сайт"
                          >
                            Сайт
                          </button>
                        )}
                        {hotel.linkPWA && (
                          <button
                            className={lClasses.linkBtn}
                            onClick={(e) => { e.stopPropagation(); copyLink(hotel.linkPWA); }}
                            title="Скопировать ссылку Сканер"
                          >
                            Сканер
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
                    {canEdit && !isCompleted && !isExtHotel && (
                      <button
                        className={lClasses.deleteBtn}
                        onClick={(e) => { e.stopPropagation(); setRemoveHotelIndex(origIdx); }}
                        title="Удалить отель"
                      >
                        <DeleteIcon cursor="pointer" />
                      </button>
                    )}
                    <ChevronIcon className={`${classes.chevron} ${isExpanded ? classes.chevronOpen : ""}`} />
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
                    {displayPeople.length === 0 ? (
                      <div className={lClasses.emptyGuests}>
                        <span className={lClasses.emptyGuestsIcon}><HomeIcon /></span>
                        <span>{personMode === "CREW" ? "Экипаж ещё не добавлен" : "Гости ещё не добавлены"}</span>
                        {(canEdit || isExtHotel) && !isCompleted && (
                          <Button
                            backgroundcolor="var(--dark-blue)"
                            color="#fff"
                            onClick={(e) => { e.stopPropagation(); setHotelMgmtIndex(origIdx); }}
                          >
                            {personMode === "CREW" ? "+ Добавить из экипажа" : "+ Добавить гостя"}
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
                          {displayPeople.map((p, pi) => {
                            return (
                              <tr key={pi}>
                                <td>
                                  {p.fullName || "—"}
                                  <PersonBadge type={p.personType} />
                                </td>
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
                            );
                          })}
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
        canEdit={canEdit || isExtHotel}
        personMode={personMode}
        onGenerateReport={
          hotelMgmtIndex != null
            ? () => {
                const idx = hotelMgmtIndex;
                setHotelMgmtIndex(null);
                navigate(`/far/${requestId}/report/${idx}`);
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
