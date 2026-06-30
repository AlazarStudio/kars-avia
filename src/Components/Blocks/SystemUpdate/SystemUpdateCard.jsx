import React, { useEffect, useMemo, useState } from "react";
import {
  AUDIENCE_ORDER,
  AUDIENCE_LABELS,
  SECTION_KEYS,
  TYPE_BADGES,
  FILTER_LABELS,
  flattenSections,
} from "./systemUpdateConstants";
import classes from "./SystemUpdateCard.module.css";

const hasItems = (sections) =>
  !!sections && SECTION_KEYS.some((k) => (sections[k] || []).length);

// Карточка релиза (дизайн v3): шапка + (SuperAdmin) под-табы аудиторий +
// фильтр-категории + плоский список с бейджами. Переиспользуется реальной
// модалкой и живым превью админки. preview=true → кнопка некликабельна.
export default function SystemUpdateCard({
  title,
  version,
  audiences = [],
  isSuperAdmin = false,
  dismissing = false,
  onDismiss,
  preview = false,
}) {
  const ordered = useMemo(() => {
    const byKey = {};
    (audiences || []).forEach((b) => {
      if (b && b.audience) byKey[b.audience] = b;
    });
    return AUDIENCE_ORDER.filter((a) => byKey[a]).map((a) => byKey[a]);
  }, [audiences]);

  // SuperAdmin: дефолт — первая аудитория с пунктами, иначе первая по порядку.
  const defaultAudIdx = useMemo(() => {
    const idx = ordered.findIndex((b) => hasItems(b.sections));
    return idx >= 0 ? idx : 0;
  }, [ordered]);

  const [audIdx, setAudIdx] = useState(defaultAudIdx);
  // Данные приходят после монтирования — синхронизируем активную аудиторию.
  useEffect(() => {
    setAudIdx(defaultAudIdx);
  }, [defaultAudIdx]);

  const safeAudIdx = audIdx < ordered.length ? audIdx : 0;
  const showAudPills = isSuperAdmin && ordered.length > 1;
  const current = isSuperAdmin ? ordered[safeAudIdx] : ordered[0];

  const items = useMemo(() => flattenSections(current?.sections), [current]);

  // Категории-фильтры: «Всё» всегда; конкретный тип — только если есть пункты.
  const presentTypes = useMemo(
    () => SECTION_KEYS.filter((k) => items.some((it) => it.type === k)),
    [items]
  );

  const [filter, setFilter] = useState("all");
  // Сброс фильтра при смене аудитории (чтобы не остаться на скрытой вкладке).
  useEffect(() => {
    setFilter("all");
  }, [safeAudIdx]);

  const visibleItems =
    filter === "all" ? items : items.filter((it) => it.type === filter);

  return (
    <div className={classes.card}>
      {showAudPills ? (
        <div className={classes.audRow} role="tablist" aria-label="Аудитория">
          {ordered.map((b, i) => (
            <button
              key={b.audience}
              type="button"
              role="tab"
              aria-selected={i === safeAudIdx}
              className={`${classes.audPill} ${
                i === safeAudIdx ? classes.audPillOn : ""
              }`}
              onClick={() => setAudIdx(i)}
            >
              {AUDIENCE_LABELS[b.audience]}
            </button>
          ))}
        </div>
      ) : null}

      <div className={classes.header}>
        <span className={classes.title}>{title || "Что нового"}</span>
        {version ? <span className={classes.verBadge}>v{version}</span> : null}
      </div>

      <div className={classes.filters} role="tablist" aria-label="Категории">
        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          className={`${classes.filterPill} ${
            filter === "all" ? classes.filterPillOn : ""
          }`}
          onClick={() => setFilter("all")}
        >
          {FILTER_LABELS.all}
          <span className={classes.filterCount}>{items.length}</span>
        </button>
        {presentTypes.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={filter === k}
            className={`${classes.filterPill} ${
              filter === k ? classes.filterPillOn : ""
            }`}
            onClick={() => setFilter(k)}
          >
            {FILTER_LABELS[k]}
          </button>
        ))}
      </div>

      <div className={classes.list}>
        {visibleItems.map((it, i) => {
          const badge = TYPE_BADGES[it.type];
          return (
            <div key={i} className={classes.row}>
              <span
                className={classes.badge}
                style={{ color: badge.color, background: badge.bg }}
              >
                {badge.label}
              </span>
              <span className={classes.rowText}>
                <span className={classes.rowTitle}>{it.title}</span>
                {it.description ? (
                  <span className={classes.rowDesc}>{it.description}</span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      <div className={classes.footer}>
        <button
          type="button"
          className={classes.okBtn}
          onClick={preview ? undefined : onDismiss}
          disabled={!preview && dismissing}
        >
          {!preview && dismissing ? "..." : "Понятно"}
        </button>
      </div>
    </div>
  );
}
