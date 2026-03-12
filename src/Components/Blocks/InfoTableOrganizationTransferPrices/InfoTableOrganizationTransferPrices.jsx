import React, { useState } from "react";
import classes from "./InfoTableOrganizationTransferPrices.module.css";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";

function InfoTableOrganizationTransferPrices({
  requests = [],
  airports = [],
  cities = [],
  onEdit,
  onDelete,
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (index) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const getAirportLabel = (id) => {
    const a = airports.find((x) => x.id === id);
    return a ? [a.code, a.name, a.city].filter(Boolean).join(" — ") : id;
  };

  const getCityLabel = (id) => {
    const c = cities.find((x) => x.id === id);
    return c ? [c.city, c.region].filter(Boolean).join(", ") : id;
  };

  return (
    <div className={classes.tarifsWrapper}>
      <div className={classes.contractsContainer}>
        {requests.map((item, index) => (
          <div className={classes.contractRow} key={item.id || index}>
            <div className={classes.contractRowHeader}>
              <div className={classes.contractRowHeaderLeft}>
                <div
                  className={`${classes.expandButton} ${expandedRows.has(index) ? classes.expanded : ""}`}
                  onClick={() => toggleRow(index)}
                >
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 1L6.5 6L1.5 11" stroke="#545873" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span>Ценник {index + 1}</span>
              </div>
              <div className={classes.contractRowActions}>
                <EditPencilIcon
                  cursor="pointer"
                  title="Редактировать"
                  onClick={() => onEdit(item, index)}
                />
                {onDelete && item.id && (
                  <DeleteIcon
                    cursor="pointer"
                    title="Удалить"
                    onClick={() => onDelete(item, index)}
                  />
                )}
              </div>
            </div>

            {expandedRows.has(index) && (
              <>
                <div className={classes.airportListTitle}>Цены</div>
                <div className={classes.pricesRow}>
                  {[
                    { key: "threeSeater", label: "3-местный" },
                    { key: "fiveSeater", label: "5-местный" },
                    { key: "sevenSeater", label: "7-местный" },
                  ].map(({ key, label }) => {
                    const seat = item.prices?.[key];
                    if (!seat) return null;
                    return (
                      <React.Fragment key={key}>
                        {seat.intercity != null && (
                          <div className={classes.priceItem}>
                            <span className={classes.priceItemLabel}>{label} (межгород)</span>
                            <span className={classes.priceItemValue}>
                              {Number(seat.intercity).toLocaleString()} ₽
                            </span>
                          </div>
                        )}
                        {seat.city != null && (
                          <div className={classes.priceItem}>
                            <span className={classes.priceItemLabel}>{label} (город)</span>
                            <span className={classes.priceItemValue}>
                              {Number(seat.city).toLocaleString()} ₽
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {(item.airportIds?.length > 0 || item.airports?.length > 0) && (
                  <div className={classes.airportList}>
                    <div className={classes.airportListTitle}>Аэропорты:</div>
                    {(item.airports || []).length > 0
                      ? item.airports.map((ap) => (
                          <div key={ap.id} className={classes.airportItem}>
                            {ap.city && `${ap.city} — `}{ap.name}
                            {ap.code ? ` (${ap.code})` : ""}
                          </div>
                        ))
                      : (item.airportIds || []).map((aid) => (
                          <div key={aid} className={classes.airportItem}>
                            {getAirportLabel(aid)}
                          </div>
                        ))}
                  </div>
                )}

                {(item.cityIds?.length > 0 || item.cities?.length > 0) && (
                  <div className={classes.airportList}>
                    <div className={classes.airportListTitle}>Города:</div>
                    {(item.cities || []).length > 0
                      ? item.cities.map((c) => (
                          <div key={c.id} className={classes.airportItem}>
                            {c.city}
                            {c.region ? `, ${c.region}` : ""}
                          </div>
                        ))
                      : (item.cityIds || []).map((cid) => (
                          <div key={cid} className={classes.airportItem}>
                            {getCityLabel(cid)}
                          </div>
                        ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default InfoTableOrganizationTransferPrices;
