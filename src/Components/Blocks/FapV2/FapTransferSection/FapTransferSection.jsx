import React, { useState } from "react";
import classes from "../FapDetail/FapDetail.module.css";
import { SERVICE_STATUS_CONFIG, formatTime, formatDateTime } from "../fapConstants";
import Button from "../../../Standart/Button/Button";
import AddRepresentativeDriver from "../../AddRepresentativeDriver/AddRepresentativeDriver";

export default function FapTransferSection({ service, color, request, onRefetch }) {
  const [open, setOpen] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [expandedDrivers, setExpandedDrivers] = useState({});

  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};

  if (!service?.plan?.enabled) return null;

  const drivers = service.drivers || [];
  const isCompleted =
    service.status === "COMPLETED" || service.status === "CANCELLED";

  const toggleDriver = (idx) =>
    setExpandedDrivers((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const totalPassengers = drivers.reduce(
    (sum, d) => sum + (d.people?.length || 0),
    0
  );

  return (
    <div className={classes.section}>
      <div
        className={classes.sectionHeader}
        onClick={() => setOpen((v) => !v)}
      >
        <div className={classes.sectionHeaderLeft}>
          <div className={classes.sectionDot} style={{ background: color }} />
          <span className={classes.sectionName}>Трансфер</span>
          <span
            className={classes.svcStatusBadge}
            style={{ color: statusCfg.color, background: statusCfg.bg }}
          >
            {statusCfg.label || service.status}
          </span>
        </div>
        <div className={classes.sectionHeaderRight}>
          <span style={{ fontSize: 13, color: "#545873" }}>
            {drivers.length} водит. · {totalPassengers}
            {service.plan?.peopleCount ? `/${service.plan.peopleCount}` : ""} пасс.
          </span>
          <span className={`${classes.chevron} ${open ? classes.chevronOpen : ""}`}>
            ▾
          </span>
        </div>
      </div>

      {open && (
        <div className={classes.sectionBody}>
          <div className={classes.planRow}>
            {service.plan?.peopleCount && (
              <div className={classes.planItem}>
                <span className={classes.planLabel}>Кол-во человек</span>
                <span className={classes.planValue}>{service.plan.peopleCount}</span>
              </div>
            )}
            {service.plan?.plannedAt && (
              <div className={classes.planItem}>
                <span className={classes.planLabel}>Время</span>
                <span className={classes.planValue}>
                  {formatTime(service.plan.plannedAt)}
                </span>
              </div>
            )}
          </div>

          {drivers.map((driver, idx) => {
            const people = driver.people || [];
            const isExpanded = expandedDrivers[idx];
            return (
              <div key={idx} className={classes.subCard}>
                <div
                  className={classes.subCardHeader}
                  onClick={() => toggleDriver(idx)}
                >
                  <div>
                    <div className={classes.subCardTitle}>
                      {driver.fullName || "Водитель"}
                    </div>
                    <div className={classes.subCardMeta}>
                      {driver.phone && <span>{driver.phone}</span>}
                      {driver.pickupAt && (
                        <span> · {formatDateTime(driver.pickupAt)}</span>
                      )}
                      {driver.addressFrom && (
                        <span> · {driver.addressFrom}</span>
                      )}
                      <span>
                        {" "}· {people.length}
                        {driver.peopleCount ? `/${driver.peopleCount}` : ""} пасс.
                      </span>
                    </div>
                  </div>
                  <span
                    className={`${classes.chevron} ${isExpanded ? classes.chevronOpen : ""}`}
                  >
                    ▾
                  </span>
                </div>
                {isExpanded && (
                  <div className={classes.subCardBody}>
                    <table className={classes.table}>
                      <thead>
                        <tr>
                          <th>ФИО</th>
                          <th>Телефон</th>
                        </tr>
                      </thead>
                      <tbody>
                        {people.length === 0 ? (
                          <tr>
                            <td colSpan={2} className={classes.tableEmpty}>
                              Нет пассажиров
                            </td>
                          </tr>
                        ) : (
                          people.map((p, pi) => (
                            <tr key={pi}>
                              <td>{p.fullName}</td>
                              <td>{p.phone || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
                onClick={() => setShowAddDriver(true)}
              >
                + Добавить водителя
              </Button>
            </div>
          )}
        </div>
      )}

      {showAddDriver && (
        <AddRepresentativeDriver
          show={showAddDriver}
          onClose={() => {
            setShowAddDriver(false);
            onRefetch();
          }}
          request={request}
        />
      )}
    </div>
  );
}
