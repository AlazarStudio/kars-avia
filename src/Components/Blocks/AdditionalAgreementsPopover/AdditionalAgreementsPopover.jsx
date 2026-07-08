import React, { useState } from "react";
import { Popover } from "@mui/material";
import classes from "./AdditionalAgreementsPopover.module.css";
import { convertToDate } from "../../../../graphQL_requests.js";
import { getExpirationBadge } from "../../../utils/contractExpiration.js";

function AdditionalAgreementsPopover({ agreements }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const active = (agreements || []).filter((a) => !a.isArchived);
  if (!active.length) return null;

  const open = Boolean(anchorEl);
  const countLabel = active.length === 1 ? "1 активное" : `${active.length} активных`;

  const handleOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const handleClose = (e) => {
    e?.stopPropagation?.();
    setAnchorEl(null);
  };

  return (
    <>
      <button type="button" className={classes.badge} onClick={handleOpen}>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
          <path d="M10 2.6 17.2 6 10 9.4 2.8 6 10 2.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M3.2 10 10 13.2 16.8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.2 13.4 10 16.6 16.8 13.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        ДС · {active.length}
      </button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            style: {
              marginTop: 6,
              borderRadius: 12,
              border: "1px solid #EEF0F5",
              boxShadow: "0 12px 32px rgba(16,24,40,0.12)",
              overflow: "hidden",
            },
          },
        }}
      >
        <div className={classes.panel} onClick={(e) => e.stopPropagation()}>
          <div className={classes.header}>
            <span className={classes.headerTitle}>Доп. соглашения</span>
            <span className={classes.headerCount}>{countLabel}</span>
          </div>
          {active.map((a, i) => {
            const exp = getExpirationBadge({
              endDate: a.agreementEndDate,
              isExpired: a.isExpired,
              daysUntilEnd: a.daysUntilEnd,
            });
            return (
              <div key={a.id} className={classes.row} style={i > 0 ? { borderTop: "1px solid #F3F5FA" } : undefined}>
                <span className={classes.num}>{a.contractNumber || "—"}</span>
                <span className={a.agreementEndDate ? classes.date : classes.dash}>
                  {a.agreementEndDate ? convertToDate(a.agreementEndDate) : "—"}
                </span>
                {exp && (
                  <span className={classes.exp} style={{ background: exp.bg, color: exp.textColor }}>
                    <span className={classes.expDot} style={{ background: exp.color }} />
                    {exp.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Popover>
    </>
  );
}

export default AdditionalAgreementsPopover;
