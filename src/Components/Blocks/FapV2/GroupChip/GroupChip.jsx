import React, { useState } from "react";
import Popover from "@mui/material/Popover";
import classes from "./GroupChip.module.css";
import {
  GROUP_KIND_CONFIG,
  groupColor,
  groupDisplayLabel,
  groupTogetherLevel,
} from "../fapGroups";
import GroupFamilyIcon from "../../../../shared/icons/GroupFamilyIcon";
import GroupEscortIcon from "../../../../shared/icons/GroupEscortIcon";
import GroupColleaguesIcon from "../../../../shared/icons/GroupColleaguesIcon";
import GroupTeamIcon from "../../../../shared/icons/GroupTeamIcon";
import GroupOtherIcon from "../../../../shared/icons/GroupOtherIcon";

// Иконка типа связи. Карта здесь, а не в fapGroups.js: та утилита — .js без JSX.
const GROUP_KIND_ICON = {
  FAMILY: GroupFamilyIcon,
  ESCORT: GroupEscortIcon,
  COLLEAGUES: GroupColleaguesIcon,
  GROUP: GroupTeamIcon,
  OTHER: GroupOtherIcon,
};

const LEVEL_LABEL = { ROOM: "в одном номере", HOTEL: "в одной гостинице" };

// Метка группы: контурная пилюля (контраст формы с залитым CategoryBadge).
// compact — только точка (для плотных строк пикера).
// members — состав для карточки-поповера; onEdit — ссылка «изменить» (canEdit).
export default function GroupChip({
  group,
  index = 0,
  compact = false,
  warn = false,
  warnText = "",
  members = null,
  onEdit = null,
}) {
  const [anchor, setAnchor] = useState(null);
  if (!group) return null;

  const color = groupColor(group, index);
  const kindLabel = GROUP_KIND_CONFIG[group.kind]?.label ?? "";
  const Icon = GROUP_KIND_ICON[group.kind] ?? GroupOtherIcon;
  // «Семья · Ивановы»; у группы без подписи — только тип, без висящего разделителя
  const text = group.label ? `${kindLabel} · ${group.label}` : kindLabel;
  const label = groupDisplayLabel(group);
  const title = warn && warnText ? `${text} · ${warnText}` : text;
  const hasPopover = Array.isArray(members);

  if (compact) {
    return <span className={classes.dot} style={{ background: color }} title={title} />;
  }

  return (
    <>
      <span
        className={`${classes.chip} ${hasPopover ? classes.clickable : ""}`}
        style={{ borderColor: color }}
        onClick={hasPopover ? (e) => setAnchor(e.currentTarget) : undefined}
        title={title}
      >
        <span className={classes.dot} style={{ background: color }} />
        <Icon size={13} className={classes.kindIcon} style={{ color }} />
        {text}
        {warn && <span className={classes.warn}>⚠</span>}
      </span>

      {hasPopover && (
        <Popover
          open={!!anchor}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              sx: {
                borderRadius: "12px",
                border: "1px solid #E4E4EF",
                boxShadow: "0 12px 32px rgba(20, 30, 60, 0.16)",
                mt: "6px",
              },
            },
          }}
        >
          <div className={classes.card}>
            <div className={classes.cardHead}>
              <span className={classes.dot} style={{ background: color }} />
              {label}
            </div>
            <div className={classes.cardMeta}>
              {[kindLabel, `селить ${LEVEL_LABEL[groupTogetherLevel(group)]}`]
                .filter(Boolean)
                .join(" · ")}
            </div>
            {warn && warnText && <div className={classes.cardWarn}>⚠ {warnText}</div>}
            <div className={classes.cardList}>
              {members.length === 0 ? (
                <div className={classes.cardEmpty}>Состав пуст</div>
              ) : (
                members.map((m) => (
                  <div key={m.personId} className={classes.cardMember}>
                    {m.fullName || "—"}
                  </div>
                ))
              )}
            </div>
            {onEdit && (
              <button
                type="button"
                className={classes.cardLink}
                onClick={() => {
                  setAnchor(null);
                  onEdit(group);
                }}
              >
                Изменить состав
              </button>
            )}
          </div>
        </Popover>
      )}
    </>
  );
}
