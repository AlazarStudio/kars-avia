import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import classes from "../FapDetail/FapDetail.module.css";
import lClasses from "./FapLivingSection.module.css";
import { SERVICE_STATUS_CONFIG, formatDate } from "../fapConstants";
import Button from "../../../Standart/Button/Button";
import AddRepresentativeHotel from "../../AddRepresentativeHotel/AddRepresentativeHotel";

export default function FapLivingSection({ service, color, request, onRefetch }) {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [open, setOpen] = useState(false);
  const [showAddHotel, setShowAddHotel] = useState(false);
  const [expandedHotels, setExpandedHotels] = useState({});

  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};

  if (!service?.plan?.enabled) return null;

  const hotels = service.hotels || [];
  const isCompleted =
    service.status === "COMPLETED" || service.status === "CANCELLED";

  const toggleHotel = (idx) =>
    setExpandedHotels((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const totalCapacity = hotels.reduce((s, h) => s + (h.peopleCount || 0), 0);
  const totalGuests = hotels.reduce((s, h) => s + (h.people?.length || 0), 0);

  return (
    <div className={classes.section}>
      <div
        className={classes.sectionHeader}
        onClick={() => setOpen((v) => !v)}
      >
        <div className={classes.sectionHeaderLeft}>
          <div className={classes.sectionDot} style={{ background: color }} />
          <span className={classes.sectionName}>Проживание</span>
          <span
            className={classes.svcStatusBadge}
            style={{ color: statusCfg.color, background: statusCfg.bg }}
          >
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
          <span className={`${classes.chevron} ${open ? classes.chevronOpen : ""}`}>
            ▾
          </span>
        </div>
      </div>

      {open && (
        <div className={classes.sectionBody}>
          {/* Plan row */}
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
                <span className={classes.planValue}>
                  {formatDate(service.plan.plannedFromAt)}
                </span>
              </div>
            )}
            {service.plan?.plannedToAt && (
              <div className={classes.planItem}>
                <span className={classes.planLabel}>Выселение</span>
                <span className={classes.planValue}>
                  {formatDate(service.plan.plannedToAt)}
                </span>
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
                {/* Hotel card header */}
                <div
                  className={lClasses.hotelHeader}
                  onClick={() => toggleHotel(idx)}
                >
                  <div className={lClasses.hotelHeaderLeft}>
                    <div
                      className={lClasses.hotelColorBar}
                      style={{ background: isFull ? "#10B981" : color }}
                    />
                    <div className={lClasses.hotelInfo}>
                      <div className={lClasses.hotelName}>
                        {hotel.name || "Отель"}
                      </div>
                      {hotel.address && (
                        <div className={lClasses.hotelAddress}>{hotel.address}</div>
                      )}
                    </div>
                  </div>

                  <div className={lClasses.hotelHeaderRight}>
                    {/* Dates */}
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
                    {/* Occupancy chip */}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/fapv2/${requestId}/report/${idx}`);
                      }}
                      title="Отчёт по отелю"
                    >
                      Отчёт
                    </button>
                    <span className={`${classes.chevron} ${isExpanded ? classes.chevronOpen : ""}`}>
                      ▾
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {capacity > 0 && (
                  <div className={lClasses.progressBar}>
                    <div
                      className={lClasses.progressFill}
                      style={{
                        width: `${fillPct}%`,
                        background: isFull ? "#10B981" : color,
                      }}
                    />
                  </div>
                )}

                {/* Expanded guest table */}
                {isExpanded && (
                  <div className={lClasses.hotelBody}>
                    {people.length === 0 ? (
                      <div className={lClasses.emptyGuests}>
                        <span className={lClasses.emptyGuestsIcon}>🛏</span>
                        <span>Гости ещё не добавлены</span>
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

          {!isCompleted && (
            <div className={classes.sectionActions}>
              <Button
                backgroundcolor="var(--dark-blue)"
                color="#fff"
                onClick={() => setShowAddHotel(true)}
              >
                + Добавить отель
              </Button>
            </div>
          )}
        </div>
      )}

      {showAddHotel && (
        <AddRepresentativeHotel
          show={showAddHotel}
          onClose={() => {
            setShowAddHotel(false);
            onRefetch();
          }}
          request={request}
        />
      )}
    </div>
  );
}
