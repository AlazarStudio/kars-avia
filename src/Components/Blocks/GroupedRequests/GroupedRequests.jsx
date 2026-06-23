import React from "react";
import groupClasses from "./GroupedRequests.module.css";
import tableClasses from "../InfoTableData/InfoTableData.module.css";
import InfoTable from "../InfoTable/InfoTable";
import RequestRow, { airlineColor } from "../InfoTableData/RequestRow";
import { getMediaUrl } from "../../../../graphQL_requests";

// Групповой вид «Эскадрильи» — дашборд-плитки (groupStyle: Плитки).
// Клик по плитке открывает экран заявок группы (как список), с пагинацией по 50.
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const WORK_STATUSES = new Set(["opened", "extended", "reduced", "transferred", "earlyStart"]);

const requestWord = (n) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "заявок";
  if (m10 === 1) return "заявка";
  if (m10 >= 2 && m10 <= 4) return "заявки";
  return "заявок";
};

const tileInitials = (name) => {
  const words = (name || "?").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] || "?").slice(0, 2).toUpperCase();
};

const groupStats = (requests = []) => {
  let done = 0;
  let work = 0;
  let archiving = 0;
  let other = 0;
  for (const r of requests) {
    if (r.status === "done") done += 1;
    else if (WORK_STATUSES.has(r.status)) work += 1;
    else if (r.status === "archiving") archiving += 1;
    else other += 1;
  }
  return { done, work, archiving, other };
};

const metaFor = (group) => {
  const code = group.airport?.code || "";
  const m = group.month;
  const month = typeof m === "number" && m >= 1 && m <= 12 ? MONTHS[m - 1] : "";
  return [code, month].filter(Boolean).join(" · ");
};

// Аватар авиакомпании: реальный логотип, иначе цветные инициалы.
function GroupAvatar({ airline }) {
  const logo = airline?.images?.[0];
  if (logo) {
    return (
      <div className={`${groupClasses.tileAvatar} ${groupClasses.tileAvatarLogo}`}>
        <img src={getMediaUrl(logo)} alt="" />
      </div>
    );
  }
  return (
    <div className={groupClasses.tileAvatar} style={{ background: airlineColor(airline?.name) }}>
      {tileInitials(airline?.name)}
    </div>
  );
}

function GroupedRequests({
  groups,
  user,
  toggleRequestSidebar,
  setChooseObject,
  setChooseRequestID,
  chooseRequestID,
  selectedGroupKey,
  setSelectedGroupKey,
  detailPage = 0,
  detailPageSize = 50,
}) {
  const selected = groups.find((g) => g.key === selectedGroupKey) || null;

  // Тот же shape chooseObject, что в InfoTableData.handleObject
  const handleObject = (item) => {
    setChooseObject([
      {
        room: "",
        place: "",
        start: item.arrival?.date,
        startTime: item.arrival?.time,
        end: item.departure?.date,
        endTime: item.departure?.time,
        client: item.person?.name,
        public: false,
        clientId: item.person?.id,
        hotelId: "",
        requestId: item.id,
        requestNumber: item.requestNumber,
      },
    ]);
    setChooseRequestID(item.id);
    toggleRequestSidebar();
  };

  // Детальный экран группы: заявки списком (как в основном списке), пагинация по detailPageSize
  if (selected) {
    const count = selected.requestCount ?? selected.requests?.length ?? 0;
    const all = selected.requests || [];
    const start = detailPage * detailPageSize;
    const pageRows = all.slice(start, start + detailPageSize);
    return (
      <InfoTable>
        <div className={groupClasses.drillHead}>
          <span className={groupClasses.backPill} onClick={() => setSelectedGroupKey(null)}>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
            Все группы
          </span>
          <GroupAvatar airline={selected.airline} />
          <div className={groupClasses.drillTitleWrap}>
            <div className={groupClasses.drillTitleRow}>
              <span className={groupClasses.drillTitle}>
                {selected.airline?.name} · {metaFor(selected)}
              </span>
              {selected.isBulk && <span className={groupClasses.tileBulk}>Массовая</span>}
            </div>
            <div className={groupClasses.drillCount}>
              {count} {requestWord(count)}
            </div>
          </div>
        </div>

        <div className={tableClasses.InfoTable_title}>
          <div className={`${tableClasses.InfoTable_title_elem} ${tableClasses.w12}`}>№</div>
          <div className={`${tableClasses.InfoTable_title_elem} ${tableClasses.w15}`}>ФИО</div>
          <div
            className={`${tableClasses.InfoTable_title_elem} ${tableClasses.w13}`}
            style={{ justifyContent: "center" }}
          >
            Дата заявки
          </div>
          <div className={`${tableClasses.InfoTable_title_elem} ${tableClasses.w10}`}>Авиакомпания</div>
          <div
            className={`${tableClasses.InfoTable_title_elem} ${tableClasses.w12}`}
            style={{ justifyContent: "center", padding: "0 10px" }}
          >
            Аэропорт
          </div>
          <div className={`${tableClasses.InfoTable_title_elem} ${tableClasses.w12}`}>Прибытие</div>
          <div className={`${tableClasses.InfoTable_title_elem} ${tableClasses.w12}`}>Отъезд</div>
          <div className={`${tableClasses.InfoTable_title_elem} ${tableClasses.w12}`}>Статус</div>
        </div>

        <div className={tableClasses.bottom} style={{ height: "calc(100vh - 405px)" }}>
          {pageRows.map((item) => (
            <RequestRow
              key={item.id}
              item={item}
              user={user}
              chooseRequestID={chooseRequestID}
              onSelect={handleObject}
            />
          ))}
        </div>
      </InfoTable>
    );
  }

  // Дашборд групп: сетка плиток
  return (
    <InfoTable>
      <div className={groupClasses.tilesScroll}>
        <div className={groupClasses.tilesGrid}>
          {groups.map((group) => {
            const name = group.airline?.name;
            const s = groupStats(group.requests);
            const tot = Math.max(1, s.done + s.work + s.archiving + s.other);
            const pct = (n) => `${(n / tot) * 100}%`;
            const count = group.requestCount ?? group.requests?.length ?? 0;
            return (
              <div
                key={group.key}
                className={groupClasses.tile}
                onClick={() => setSelectedGroupKey(group.key)}
              >
                <div className={groupClasses.tileHead}>
                  <div className={groupClasses.tileAirline}>
                    <GroupAvatar airline={group.airline} />
                    <div className={groupClasses.tileNameWrap}>
                      <div className={groupClasses.tileName}>{name}</div>
                      <div className={groupClasses.tileMeta}>{metaFor(group)}</div>
                    </div>
                  </div>
                  {group.isBulk && <span className={groupClasses.tileBulk}>Массовая</span>}
                </div>
                <div className={groupClasses.tileCount}>
                  <span className={groupClasses.tileCountNum}>{count}</span>
                  <span className={groupClasses.tileCountWord}>{requestWord(count)}</span>
                </div>
                <div className={groupClasses.tileBar}>
                  <span style={{ width: pct(s.done), background: "#1E8E3E" }} />
                  <span style={{ width: pct(s.work), background: "#2196F3" }} />
                  <span style={{ width: pct(s.archiving), background: "#D6A570" }} />
                  <span style={{ width: pct(s.other), background: "#C8CEDC" }} />
                </div>
                <div className={groupClasses.tileLegend}>
                  <span className={groupClasses.legendDone}>{s.done} размещено</span>
                  <span className={groupClasses.legendWork}>{s.work} в работе</span>
                  <span className={groupClasses.legendArchiving}>{s.archiving} готов к архиву</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </InfoTable>
  );
}

export default GroupedRequests;
