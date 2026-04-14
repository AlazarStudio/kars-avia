import React, { useState } from "react";
import classes from "./InfoTableOrganizationTransferPrices.module.css";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";

const SHOW_LIMIT = 20;

function ChipsList({ items, renderChip }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, SHOW_LIMIT);
  const hidden = items.length - SHOW_LIMIT;

  return (
    <div className={classes.chipsList}>
      {visible.map((item, i) => renderChip(item, i))}
      {!showAll && hidden > 0 && (
        <button className={classes.showMoreBtn} onClick={() => setShowAll(true)}>
          + ещё {hidden}
        </button>
      )}
      {showAll && items.length > SHOW_LIMIT && (
        <button className={classes.showMoreBtn} onClick={() => setShowAll(false)}>
          Скрыть
        </button>
      )}
    </div>
  );
}

function InfoTableOrganizationTransferPrices({
  requests = [],
  airports = [],
  cities = [],
  onEdit,
  onDelete,
  onRowClick,
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

  return (
    <div className={classes.tarifsWrapper}>
      <div className={classes.contractsContainer}>
        {requests.map((item, index) => {
          const airportList = item.airports?.length > 0
            ? item.airports
            : (item.airportIds || []).map((aid) => airports.find((x) => x.id === aid) || { id: aid });

          const cityList = item.cities?.length > 0
            ? item.cities
            : (item.cityIds || []).map((cid) => cities.find((x) => x.id === cid) || { id: cid });

          return (
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
                  <span
                  className={onRowClick ? classes.contractRowName : undefined}
                  onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                >
                  {item.name?.trim() ? item.name : `Ценник ${index + 1}`}
                </span>
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
                  {(() => {
                    const priceEntries = [
                      { key: "threeSeater", label: "3-местный (межгород)", field: "intercity" },
                      { key: "threeSeater", label: "3-местный (город)",    field: "city" },
                      { key: "fiveSeater",  label: "5-местный (межгород)", field: "intercity" },
                      { key: "fiveSeater",  label: "5-местный (город)",    field: "city" },
                      { key: "sevenSeater", label: "7-местный (межгород)", field: "intercity" },
                      { key: "sevenSeater", label: "7-местный (город)",    field: "city" },
                    ]
                      .filter(({ key, field }) => item.prices?.[key]?.[field] != null)
                      .sort((a, b) => {
                        const va = Number(item.prices?.[a.key]?.[a.field] ?? 0);
                        const vb = Number(item.prices?.[b.key]?.[b.field] ?? 0);
                        return (vb > 0 ? 1 : 0) - (va > 0 ? 1 : 0);
                      });

                    if (!priceEntries.length) return null;
                    return (
                      <>
                        <div className={classes.sectionTitle}>Цены — трансфер</div>
                        <div className={classes.pricesRow}>
                          {priceEntries.map(({ key, label, field }) => {
                            const val = Number(item.prices?.[key]?.[field] ?? 0);
                            const isEmpty = val === 0;
                            return (
                              <div
                                key={`${key}-${field}`}
                                className={`${classes.priceChip} ${isEmpty ? classes.priceChipEmpty : ""}`}
                              >
                                <span className={classes.priceChipLabel}>{label}</span>
                                <span className={classes.priceChipValue}>
                                  {isEmpty ? "—" : `${val.toLocaleString()} ₽`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}

                  {airportList.length > 0 && (
                    <>
                      <div className={classes.sectionTitle}>Аэропорты</div>
                      <ChipsList
                        items={airportList}
                        renderChip={(ap) => (
                          <div key={ap.id} className={classes.airportChip}>
                            {ap.code && (
                              <span className={classes.airportCode}>{ap.code}</span>
                            )}
                            <div className={classes.airportInfo}>
                              <span className={classes.airportCity}>{ap.city || ap.name || ap.id}</span>
                              {ap.city && ap.name && (
                                <span className={classes.airportName}>{ap.name}</span>
                              )}
                            </div>
                          </div>
                        )}
                      />
                    </>
                  )}

                  {cityList.length > 0 && (
                    <>
                      <div className={classes.sectionTitle}>Города</div>
                      <ChipsList
                        items={cityList}
                        renderChip={(c) => (
                          <div key={c.id} className={classes.cityChip}>
                            <span className={classes.cityName}>{c.city || c.id}</span>
                            {c.region && <span className={classes.cityRegion}>{c.region}</span>}
                          </div>
                        )}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InfoTableOrganizationTransferPrices;
