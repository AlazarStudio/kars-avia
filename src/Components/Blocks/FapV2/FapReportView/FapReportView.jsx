import React from "react";
import classes from "./FapReportView.module.css";
import GroupChip from "../GroupChip/GroupChip";
import HotelBedIcon from "../../../../shared/icons/HotelBedIcon";

// Read-only «красивый детальный отчёт» по размещению. Никаких инпутов — только рендер view-model.
// props: {
//   summary: { grand, living, meal, discounts, peopleCount, nights },  // все — числа
//   groups: [{ key, room, kind, tariff, total, people: [
//     { name, category, meal, living, rate, nights, factor, warning }
//   ]}]
// }
// category: 'ADULT' | 'CHILD' | 'INFANT'. room null/'' → нейтральная карточка «Номер не указан».
// living === 0 → «бесплатно» (инфант); warning (string|null) выводится вместо цены. factor 0..1 — доля начисления.
// hideMoney — вид для гостиницы: она заполняет факт, деньги отчёта считает диспетчер
// по ценам для авиакомпании. Остаются состав номеров, счётчики приёмов и сутки.

const rub = (n) => Number(n).toLocaleString("ru-RU") + " ₽";

const normalizeCat = (c) => (c === "CHILD" || c === "INFANT" ? c : "ADULT");

const CATEGORY_PILL = {
  ADULT: { label: "взрослый", bg: "#F1F5F9", fg: "#475569" },
  CHILD: { label: "ребёнок", bg: "#FEF3C7", fg: "#B45309" },
  INFANT: { label: "инфант", bg: "#E0F2FE", fg: "#0369A1" },
};

const AVATAR_BG = { ADULT: "#3B82F6", CHILD: "#B45309", INFANT: "#0369A1" };

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((p) => p[0].toUpperCase()).join("") || "?";
}

// Маленький предупреждающий треугольник (one-off для строки с warning).
function WarnTriangle() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M12 3.5 22 20.5H2L12 3.5Z"
        stroke="#B45309"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 10v4" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17.2v0.1" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function FapReportView({ summary = {}, groups = [], hideMoney = false }) {
  const s = summary || {};

  return (
    <div className={classes.root}>
      {/* 1. Итоговая полоса */}
      {hideMoney ? (
        // Гостинице деньги не показываем, а «сколько людей и суток» — факт, и он
        // ей нужен: это сводка того самого, что она заполняет.
        <div className={classes.factStrip}>
          <span className={classes.capLabel}>Отчёт</span>
          <span>
            {s.peopleCount} человек · {s.nights} суток
          </span>
        </div>
      ) : (
        <div className={classes.summaryStrip}>
          <div className={classes.totalCard}>
            <div className={classes.capLabel}>Итого по отчёту</div>
            <div className={classes.grandValue}>{rub(s.grand)}</div>
            <div className={classes.totalSub}>
              {s.peopleCount} человек · {s.nights} суток
            </div>
          </div>

          <div className={classes.miniGrid}>
            <div className={classes.miniCard}>
              <div className={classes.capLabel}>Проживание</div>
              <div className={classes.miniValue} style={{ color: "#0F172A" }}>
                {rub(s.living)}
              </div>
            </div>
            <div className={classes.miniCard}>
              <div className={classes.capLabel}>Питание</div>
              <div className={classes.miniValue} style={{ color: "#0F172A" }}>
                {rub(s.meal)}
              </div>
            </div>
            {/* Временно скрыто (02.09.2026): раскомментировать, чтобы вернуть карточку */}
            {/*
            <div className={classes.miniCard}>
              Скидка больше не только возрастная — её можно выставить вручную любому гостю
              <div className={classes.capLabel}>Скидки</div>
              <div className={classes.miniValue} style={{ color: "#B45309" }}>
                −{rub(s.discounts)}
              </div>
            </div>
            */}
          </div>
        </div>
      )}

      {/* 2. Карточки номеров */}
      {groups.map((g, gi) => {
        const noRoom = g.room == null || g.room === "";
        const people = g.people || [];
        return (
          <div
            key={g.key ?? gi}
            className={[classes.roomCard, noRoom ? classes.roomCardEmpty : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <div className={classes.roomHeader}>
              {noRoom ? (
                <span className={classes.roomTitleEmpty}>Номер не указан</span>
              ) : (
                <span className={classes.roomTitle}>Номер {g.room}</span>
              )}
              {!noRoom && g.kind && <span className={classes.kindPill}>{g.kind}</span>}
              {/* Имя тарифа — вход в сущность, которой у гостиницы под гейтом нет
                  ни во вкладке «Тарифы», ни в строке: показывать нечего. */}
              {!hideMoney && g.tariff && <span className={classes.tariffPill}>{g.tariff}</span>}
              {(g.groups || []).map((gr) => (
                <span key={gr.group.groupId} className={classes.groupWrap}>
                  {/* members включает карточку-поповер: состав и тип. Ворнинги
                      сюда не приходят — read-only-роль их видеть не должна. */}
                  <GroupChip group={gr.group} index={gr.index} members={gr.members || []} />
                  {gr.inRoom < gr.total && (
                    <span className={classes.groupMeta}>
                      {gr.inRoom} из {gr.total}
                    </span>
                  )}
                </span>
              ))}
              {(g.groups || []).length > 0 && g.ungrouped > 0 && (
                <span className={classes.groupMeta}>+{g.ungrouped} без группы</span>
              )}
              {/* Тариф «Номер»: проживание принадлежит номеру, а не гостю */}
              {!hideMoney &&
                g.perRoom &&
                (g.accommodationWarning ? (
                  <span className={classes.accRoomPillWarn} title={g.accommodationWarning}>
                    ⚠ проживание
                  </span>
                ) : (
                  <span className={classes.accRoomPill}>
                    <HotelBedIcon size={13} strokeWidth={2} />
                    проживание {rub(g.accommodation)}
                  </span>
                ))}
              <span className={classes.spacer} />
              {!hideMoney && <span className={classes.roomTotal}>{rub(g.total)}</span>}
            </div>

            {people.map((p, pi) => {
              const cat = normalizeCat(p.category);
              const pill = CATEGORY_PILL[cat];
              const free = p.living === 0;
              return (
                <div key={pi} className={classes.personRow}>
                  {g.showDots && (
                    <span
                      className={p.groupColor ? classes.personDot : classes.personDotEmpty}
                      style={p.groupColor ? { background: p.groupColor } : undefined}
                      title={p.groupTitle || ""}
                    />
                  )}
                  <div className={classes.avatar} style={{ background: AVATAR_BG[cat] }}>
                    {initials(p.name)}
                  </div>

                  <div className={classes.personMid}>
                    <div className={classes.personNameRow}>
                      <span className={classes.personName}>{p.name}</span>
                      <span
                        className={classes.catPill}
                        style={{ background: pill.bg, color: pill.fg }}
                      >
                        {pill.label}
                      </span>
                    </div>
                    <div className={classes.mealLine}>
                      {hideMoney ? "Питание: " : <>Питание {rub(p.meal)}</>}
                      <span className={classes.mealSuffix}>
                        {hideMoney ? null : " · "}
                        {p.mealSuffix || "завтрак · обед · ужин"}
                      </span>
                    </div>
                  </div>

                  <div className={classes.personRight}>
                    {hideMoney ? (
                      // Гостинице — только факт: сутки без ставки, без сумм и
                      // без предупреждений о ценах, которые ставит не она.
                      p.nights > 0 ? <div className={classes.rateLine}>{p.nights} сут</div> : null
                    ) : p.warning ? (
                      <div className={classes.warnText}>
                        <WarnTriangle />
                        <span>{p.warning}</span>
                      </div>
                    ) : p.included ? (
                      // Тариф «Номер» без деления: своей доли у гостя нет — сумма
                      // целиком на шапке номера (фолбэк и старые отправленные отчёты).
                      <>
                        <div className={classes.includedText}>в номере</div>
                        {p.meal > 0 && (
                          <div className={classes.livingLine} style={{ color: "#0F9D63" }}>
                            питание {rub(p.meal)}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className={classes.rateLine}>
                          {rub(p.rate)} × {p.nights} сут
                          {p.factor < 1 && (
                            <>
                              {" · "}
                              <span style={{ color: pill.fg, fontWeight: 700 }}>
                                {p.factor === 0
                                  ? "бесплатно"
                                  : "−" + Math.round((1 - p.factor) * 100) + "%"}
                              </span>
                            </>
                          )}
                        </div>
                        <div
                          className={classes.livingLine}
                          style={{ color: free ? "#545873" : "#0F9D63" }}
                        >
                          {free ? "0 ₽ (бесплатно)" : rub(p.living)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
