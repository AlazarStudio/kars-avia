import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import * as XLSX from "xlsx";
import classes from "../ReservePlacementRepresentative/ReservePlacementRepresentative.module.css";
import reportClasses from "./RepresentativeHotelReportPage.module.css";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header";
import { useCookies } from "../../../hooks/useCookies";
import CookiesNotice from "../../Blocks/CookiesNotice/CookiesNotice";
import { GET_PASSENGER_REQUEST, SAVE_PASSENGER_REQUEST_HOTEL_REPORT, getCookie } from "../../../../graphQL_requests";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import MUITextField from "../../Blocks/MUITextField/MUITextField";
import Button from "../../Standart/Button/Button";

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function rowTotal(row) {
  return toNum(row.foodCost) + toNum(row.accommodationCost);
}

/** Сутки по датам заезда/выезда: accommodationChesses этого отеля или plan */
function getPersonDays(person, hotelIndex, plan) {
  const chess = (person?.accommodationChesses ?? []).find(
    (c) => c != null && Number(c.hotelIndex) === Number(hotelIndex)
  ) || (person?.accommodationChesses ?? [])[0];
  const start = chess?.startAt ? new Date(chess.startAt).getTime() : null;
  const end = chess?.endAt ? new Date(chess.endAt).getTime() : null;
  if (start != null && end != null && end >= start) {
    return Math.round((end - start) / (24 * 60 * 60 * 1000) * 100) / 100;
  }
  const planStart = plan?.plannedFromAt || plan?.plannedAt;
  const planEnd = plan?.plannedToAt;
  if (planStart && planEnd) {
    const s = new Date(planStart).getTime();
    const e = new Date(planEnd).getTime();
    if (e >= s) return Math.round((e - s) / (24 * 60 * 60 * 1000) * 100) / 100;
  }
  return 0;
}

const newGroup = () => ({
  id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  roomCategory: "",
  roomKind: "",
  breakfast: 0,
  lunch: 0,
  dinner: 0,
  foodCost: 0,
  accommodationCost: 0,
  personIndices: [],
});

function RepresentativeHotelReportPage({ user }) {
  const token = getCookie("token");
  const { id, idRequest, hotelId } = useParams();
  const navigate = useNavigate();
  const { cookiesAccepted, acceptCookies, isInitialized } = useCookies();

  const { loading, error, data } = useQuery(GET_PASSENGER_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { passengerRequestId: idRequest },
  });

  const request = data?.passengerRequest ?? null;
  const decodedHotelId = hotelId ? decodeURIComponent(hotelId) : "";

  const { hotel, hotelIndex } = useMemo(() => {
    const hotels = request?.livingService?.hotels ?? [];
    const byMatch = hotels.findIndex(
      (h, i) =>
        String(h.hotelId) === decodedHotelId ||
        h.name === decodedHotelId ||
        String(i) === decodedHotelId
    );
    const byNum =
      decodedHotelId !== "" && !Number.isNaN(Number(decodedHotelId))
        ? Number(decodedHotelId)
        : -1;
    const idx =
      byMatch >= 0 ? byMatch : (byNum >= 0 && byNum < hotels.length ? byNum : -1);
    const found = idx >= 0 ? hotels[idx] : null;
    return { hotel: found ?? null, hotelIndex: idx >= 0 ? idx : 0 };
  }, [request?.livingService?.hotels, decodedHotelId]);

  const hotelDetailUrl = `/${id}/representativeRequestsPlacement/${idRequest}/hotel/${encodeURIComponent(hotelId)}`;
  const people = hotel?.people ?? [];
  const plan = request?.livingService?.plan ?? null;

  const [groups, setGroups] = useState([]);
  const [daysOverrides, setDaysOverrides] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("groups");

  const assignedPersonIndices = useMemo(
    () => new Set(groups.flatMap((g) => g.personIndices)),
    [groups]
  );
  const unassignedPeople = useMemo(
    () => people.map((p, i) => ({ person: p, index: i })).filter(({ index }) => !assignedPersonIndices.has(index)),
    [people, assignedPersonIndices]
  );

  const reportRows = useMemo(() => {
    const rows = [];
    groups.forEach((g) => {
      g.personIndices.forEach((pi) => {
        const person = people[pi];
        if (!person) return;
        const days = daysOverrides[pi] !== undefined && daysOverrides[pi] !== null
          ? toNum(daysOverrides[pi])
          : getPersonDays(person, hotelIndex, plan);
        rows.push({
          personIndex: pi,
          fullName: person.fullName ?? "",
          roomNumber: person.roomNumber ?? "",
          roomCategory: g.roomCategory ?? "",
          roomKind: g.roomKind ?? "",
          daysCount: days,
          breakfast: toNum(g.breakfast),
          lunch: toNum(g.lunch),
          dinner: toNum(g.dinner),
          foodCost: toNum(g.foodCost),
          accommodationCost: toNum(g.accommodationCost),
        });
      });
    });
    return rows;
  }, [groups, people, hotelIndex, plan, daysOverrides]);

  const updateGroup = useCallback((groupId, field, value) => {
    setGroups((prev) =>
      prev.map((g) => (g.id !== groupId ? g : { ...g, [field]: value }))
    );
  }, []);

  const updateDaysOverride = useCallback((personIndex, value) => {
    const num = toNum(value);
    setDaysOverrides((prev) =>
      num === 0 && prev[personIndex] === undefined
        ? prev
        : { ...prev, [personIndex]: value }
    );
  }, []);

  const addGroup = useCallback(() => {
    setGroups((prev) => [...prev, newGroup()]);
  }, []);

  const removeGroup = useCallback((groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  const addPersonToGroup = useCallback((groupId, personIndex) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : { ...g, personIndices: [...g.personIndices, personIndex].sort((a, b) => a - b) }
      )
    );
  }, []);

  const removePersonFromGroup = useCallback((groupId, personIndex) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : { ...g, personIndices: g.personIndices.filter((i) => i !== personIndex) }
      )
    );
    setDaysOverrides((prev) => {
      const next = { ...prev };
      delete next[personIndex];
      return next;
    });
  }, []);

  const [saveReport, { loading: saving }] = useMutation(SAVE_PASSENGER_REQUEST_HOTEL_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    refetchQueries: [{ query: GET_PASSENGER_REQUEST, variables: { passengerRequestId: idRequest } }],
  });

  const filteredRowsWithIndex = useMemo(() => {
    if (!searchQuery.trim()) return reportRows.map((row, i) => ({ row, reportIndex: i }));
    const q = searchQuery.trim().toLowerCase();
    return reportRows
      .map((row, i) => ({ row, reportIndex: i }))
      .filter(({ row }) => (row.fullName || "").toLowerCase().includes(q));
  }, [reportRows, searchQuery]);

  const grandTotal = useMemo(
    () => reportRows.reduce((sum, row) => sum + rowTotal(row), 0),
    [reportRows]
  );

  const handleSaveReport = async () => {
    if (!request?.id || hotelIndex < 0) return;
    try {
      await saveReport({
        variables: {
          requestId: request.id,
          hotelIndex,
          reportRows: reportRows.map((row) => ({
            fullName: row.fullName ?? "",
            roomNumber: row.roomNumber ?? "",
            roomCategory: (row.roomCategory ?? "").split(/\s*\/\s*/)[0]?.trim() ?? "",
            roomKind: row.roomKind ?? "",
            daysCount: toNum(row.daysCount),
            breakfast: toNum(row.breakfast),
            lunch: toNum(row.lunch),
            dinner: toNum(row.dinner),
            foodCost: toNum(row.foodCost),
            accommodationCost: toNum(row.accommodationCost),
          })),
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadReport = () => {
    const headers = [
      "ID",
      "Категория номера",
      "Вид номера",
      "Суток",
      "ФИО",
      "Завтрак",
      "Обед",
      "Ужин",
      "Ст-ть питания",
      "Ст-ть проживания",
      "Итоговая стоимость",
    ];
    const dataRows = reportRows.map((row, i) => [
      i + 1,
      row.roomCategory ?? "",
      row.roomKind ?? "",
      toNum(row.daysCount),
      row.fullName ?? "",
      toNum(row.breakfast),
      toNum(row.lunch),
      toNum(row.dinner),
      toNum(row.foodCost),
      toNum(row.accommodationCost),
      rowTotal(row),
    ]);
    const aoa = [headers, ...dataRows, [], ["Общая итоговая стоимость:", grandTotal]];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Отчёт");
    const safe = (s) => String(s).replace(/[/\\?*\[\]:]/g, "_").slice(0, 100);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `otchet_otel_${safe(hotel?.name ?? "")}_${dateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  useEffect(() => {
    if (loading || !request || hotelIndex < 0) return;
    const hotelReports = request.hotelReports ?? [];
    const saved = hotelReports.find((r) => r.hotelIndex === hotelIndex);
    const savedRows = saved?.reportRows ?? [];

    if (savedRows.length > 0) {
      const key = (r) =>
        [r.roomCategory, r.roomKind, r.breakfast, r.lunch, r.dinner, r.foodCost, r.accommodationCost].join("|");
      const byKey = new Map();
      savedRows.forEach((r) => {
        const k = key(r);
        if (!byKey.has(k)) byKey.set(k, []);
        byKey.get(k).push(r);
      });
      const loadedGroups = [];
      const overrides = {};
      byKey.forEach((rows, k) => {
        const first = rows[0];
        const personIndices = rows
          .map((row) => {
            const idx = people.findIndex(
              (p) =>
                (p.fullName ?? "").trim() === (row.fullName ?? "").trim() &&
                (p.roomNumber ?? "").trim() === (row.roomNumber ?? "").trim()
            );
            if (idx >= 0) {
              const computed = getPersonDays(people[idx], hotelIndex, plan);
              const savedDays = toNum(row.daysCount);
              if (savedDays !== computed) overrides[idx] = savedDays;
              return idx;
            }
            return -1;
          })
          .filter((i) => i >= 0);
        if (personIndices.length > 0) {
          const savedCategory = (first.roomCategory ?? "").trim();
          const savedKind = (first.roomKind ?? "").trim();
          const roomCategoryOnly = savedCategory.split(/\s*\/\s*/)[0]?.trim() ?? "";
          loadedGroups.push({
            id: `g-${Date.now()}-${loadedGroups.length}-${Math.random().toString(36).slice(2, 7)}`,
            roomCategory: roomCategoryOnly,
            roomKind: savedKind,
            breakfast: toNum(first.breakfast),
            lunch: toNum(first.lunch),
            dinner: toNum(first.dinner),
            foodCost: toNum(first.foodCost),
            accommodationCost: toNum(first.accommodationCost),
            personIndices,
          });
        }
      });
      const savedPersonKeys = new Set(
        savedRows.map((r) => `${(r.fullName ?? "").trim()}|${(r.roomNumber ?? "").trim()}`)
      );
      const newPeople = people
        .map((p, i) => ({ p, i }))
        .filter(
          ({ p }) =>
            !savedPersonKeys.has(`${(p.fullName ?? "").trim()}|${(p.roomNumber ?? "").trim()}`)
        );
      if (newPeople.length > 0 && loadedGroups.length > 0) {
        loadedGroups[0].personIndices = [
          ...loadedGroups[0].personIndices,
          ...newPeople.map(({ i }) => i),
        ].sort((a, b) => a - b);
      } else if (newPeople.length > 0) {
        loadedGroups.push({
          ...newGroup(),
          personIndices: newPeople.map(({ i }) => i),
        });
      }
      setGroups(loadedGroups.length > 0 ? loadedGroups : [newGroup()]);
      setDaysOverrides(overrides);
    } else if (people.length > 0) {
      setGroups([
        {
          ...newGroup(),
          personIndices: people.map((_, i) => i),
        },
      ]);
      setDaysOverrides({});
    } else {
      setGroups([]);
      setDaysOverrides({});
    }
  }, [loading, request?.id, hotelIndex, request?.hotelReports, people, plan]);

  useEffect(() => {
    if (!loading && request && !hotel) {
      navigate(`/${id}/representativeRequestsPlacement/${idRequest}`, {
        state: { tab: "habitation" },
      });
    }
  }, [loading, request, hotel, id, idRequest, navigate]);

  if (loading || !request) {
    return (
      <div className={classes.main}>
        <MenuDispetcher id="reserve" accessMenu={{}} />
        <div className={classes.section}>
          <MUILoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.main}>
        <MenuDispetcher id="reserve" accessMenu={{}} />
        <div className={classes.section}>
          <p>Error: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return null;
  }

  return (
    <div className={classes.main}>
      <MenuDispetcher id="reserve" accessMenu={{}} />
      {isInitialized && !cookiesAccepted && (
        <CookiesNotice onAccept={acceptCookies} />
      )}
      <div className={`${classes.section} ${reportClasses.sectionReport}`}>
        <Header>
          <div className={classes.titleHeader}>
            <Link to={hotelDetailUrl} className={classes.backButton}>
              <img src="/arrow.png" alt="" />
            </Link>
            Создать отчёт
          </div>
        </Header>
        <div
          className={classes.filter_wrapper}
          role="tablist"
          aria-label="Вкладки отчёта"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "groups"}
            onClick={() => setActiveTab("groups")}
            className={activeTab === "groups" ? classes.activeButton : undefined}
          >
            Группы
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "table"}
            onClick={() => setActiveTab("table")}
            className={activeTab === "table" ? classes.activeButton : undefined}
          >
            Таблица
          </button>
        </div>

        <div className={`${classes.tabContent} ${reportClasses.tabContentReport}`}>
          <section className={reportClasses.cardWrap}>
            <div className={`${reportClasses.searchRow} ${classes.section_searchAndFilter}`}>
              <MUITextField
                className={reportClasses.searchField}
                label="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {activeTab === "groups" && (
            <div className={reportClasses.groupsSection}>
              <div className={reportClasses.groupsHeader}>
                <h3 className={reportClasses.groupsTitle}>Группы (категория и вид номера)</h3>
                <Button type="button" onClick={addGroup}>
                  Добавить группу
                </Button>
              </div>
              {groups.length === 0 ? (
                <p className={reportClasses.emptyMessage}>
                  Нет групп. Добавьте группу и привяжите к ней гостей из броней.
                </p>
              ) : (
                <div className={reportClasses.groupsList}>
                  {groups.map((g) => (
                    <div key={g.id} className={reportClasses.groupCard}>
                      <div className={reportClasses.groupGrid}>
                        <div>
                          <label className={reportClasses.groupLabel}>Категория номера</label>
                          <input
                            type="text"
                            className={reportClasses.reportInput}
                            value={g.roomCategory}
                            onChange={(e) => updateGroup(g.id, "roomCategory", e.target.value)}
                            placeholder="Напр. 2-местный"
                          />
                        </div>
                        <div>
                          <label className={reportClasses.groupLabel}>Вид номера</label>
                          <input
                            type="text"
                            className={reportClasses.reportInput}
                            value={g.roomKind}
                            onChange={(e) => updateGroup(g.id, "roomKind", e.target.value)}
                            placeholder="Напр. Стандарт"
                          />
                        </div>
                        <div>
                          <label className={reportClasses.groupLabel}>Завтрак</label>
                          <input
                            type="number"
                            min={0}
                            className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                            value={g.breakfast === 0 ? 0 : g.breakfast}
                            onChange={(e) => updateGroup(g.id, "breakfast", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={reportClasses.groupLabel}>Обед</label>
                          <input
                            type="number"
                            min={0}
                            className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                            value={g.lunch === 0 ? 0 : g.lunch}
                            onChange={(e) => updateGroup(g.id, "lunch", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={reportClasses.groupLabel}>Ужин</label>
                          <input
                            type="number"
                            min={0}
                            className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                            value={g.dinner === 0 ? 0 : g.dinner}
                            onChange={(e) => updateGroup(g.id, "dinner", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={reportClasses.groupLabel}>Ст-ть питания</label>
                          <input
                            type="number"
                            min={0}
                            className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                            value={g.foodCost === 0 ? 0 : g.foodCost}
                            onChange={(e) => updateGroup(g.id, "foodCost", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={reportClasses.groupLabel}>Ст-ть проживания</label>
                          <input
                            type="number"
                            min={0}
                            className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                            value={g.accommodationCost === 0 ? 0 : g.accommodationCost}
                            onChange={(e) => updateGroup(g.id, "accommodationCost", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={reportClasses.groupPeople}>
                        <div className={reportClasses.groupPeopleHeader}>
                          <span>Гости ({g.personIndices.length})</span>
                          <div className={reportClasses.groupPeopleActions}>
                            <select
                              className={reportClasses.personSelect}
                              value=""
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val !== "") addPersonToGroup(g.id, Number(val));
                                e.target.value = "";
                              }}
                            >
                              <option value="">+ Добавить гостя</option>
                              {unassignedPeople.map(({ person, index }) => (
                                <option key={index} value={index}>
                                  {person.fullName || "—"} {person.roomNumber ? `(№ ${person.roomNumber})` : ""}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className={reportClasses.removeGroupBtn}
                              onClick={() => removeGroup(g.id)}
                            >
                              Удалить группу
                            </button>
                          </div>
                        </div>
                        <ul className={reportClasses.groupPeopleList}>
                          {g.personIndices.map((pi) => {
                            const person = people[pi];
                            const days =
                              daysOverrides[pi] !== undefined && daysOverrides[pi] !== null
                                ? toNum(daysOverrides[pi])
                                : getPersonDays(person, hotelIndex, plan);
                            return (
                              <li key={pi} className={reportClasses.groupPersonRow}>
                                <span className={reportClasses.groupPersonName}>
                                  {person?.fullName ?? "—"}
                                  {person?.roomNumber ? `, № ${person.roomNumber}` : ""}
                                </span>
                                <span className={reportClasses.groupPersonDays}>
                                  Суток:{" "}
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    className={`${reportClasses.reportInput} ${reportClasses.reportInputNum} ${reportClasses.daysInput}`}
                                    value={days === 0 ? "" : days}
                                    onChange={(e) => updateDaysOverride(pi, e.target.value)}
                                  />
                                </span>
                                <button
                                  type="button"
                                  className={reportClasses.removePersonBtn}
                                  onClick={() => removePersonFromGroup(g.id, pi)}
                                  title="Убрать из группы"
                                >
                                  ×
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                        {g.personIndices.length === 0 && (
                          <p className={reportClasses.groupEmpty}>Добавьте гостей из списка выше</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {activeTab === "table" && (
            <div className={reportClasses.tableCard}>
              {/* <h3 className={reportClasses.tableTitle}>Таблица отчёта</h3> */}
              <div className={reportClasses.tableWrap}>
                <div className={`${reportClasses.reportGrid} ${reportClasses.tableHead}`}>
                  <div>ID</div>
                  <div>Категория номера</div>
                  <div>Вид номера</div>
                  <div>Суток</div>
                  <div>ФИО</div>
                  <div>Завтрак</div>
                  <div>Обед</div>
                  <div>Ужин</div>
                  <div>Ст-ть питания</div>
                  <div>Ст-ть проживания</div>
                  <div>Итоговая стоимость</div>
                </div>
                {filteredRowsWithIndex.length === 0 ? (
                  <div className={reportClasses.emptyMessage}>
                    {reportRows.length === 0 ? "Нет гостей в группах" : "Нет совпадений по поиску"}
                  </div>
                ) : (
                  filteredRowsWithIndex.map(({ row, reportIndex }, displayIndex) => (
                    <div
                      key={`${row.personIndex}-${reportIndex}`}
                      className={`${reportClasses.reportGrid} ${reportClasses.tableRow}`}
                    >
                      <div>{displayIndex + 1}</div>
                      <div>{row.roomCategory || "—"}</div>
                      <div>{row.roomKind || "—"}</div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                          value={row.daysCount === 0 ? 0 : row.daysCount}
                          onChange={(e) => updateDaysOverride(row.personIndex, e.target.value)}
                        />
                      </div>
                      <div>{row.fullName || "—"}</div>
                      <div>{toNum(row.breakfast)}</div>
                      <div>{toNum(row.lunch)}</div>
                      <div>{toNum(row.dinner)}</div>
                      <div>{toNum(row.foodCost)}</div>
                      <div>{toNum(row.accommodationCost)}</div>
                      <div>{rowTotal(row)}</div>
                    </div>
                  ))
                )}
              </div>
              <div className={reportClasses.footerRow}>
                <span className={reportClasses.totalLabel}>
                  Общая итоговая стоимость: {grandTotal}
                </span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Button type="button" onClick={handleSaveReport} disabled={saving}>
                    Сформировать отчёт
                  </Button>
                <Button type="button" onClick={handleDownloadReport} disabled={reportRows.length === 0}>
                  Скачать отчёт
                </Button>
              </div>
            </div>
            </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default RepresentativeHotelReportPage;



// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Link, useParams, useNavigate } from "react-router-dom";
// import { useQuery, useMutation } from "@apollo/client";
// import * as XLSX from "xlsx";
// import classes from "../ReservePlacementRepresentative/ReservePlacementRepresentative.module.css";
// import reportClasses from "./RepresentativeHotelReportPage.module.css";
// import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
// import Header from "../../Blocks/Header/Header";
// import { useCookies } from "../../../hooks/useCookies";
// import CookiesNotice from "../../Blocks/CookiesNotice/CookiesNotice";
// import { GET_PASSENGER_REQUEST, SAVE_PASSENGER_REQUEST_HOTEL_REPORT, getCookie } from "../../../../graphQL_requests";
// import MUILoader from "../../Blocks/MUILoader/MUILoader";
// import MUITextField from "../../Blocks/MUITextField/MUITextField";
// import Button from "../../Standart/Button/Button";

// function toNum(v) {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : 0;
// }

// function buildReportRows(people) {
//   return (people || []).map((p) => ({
//     fullName: p.fullName ?? "",
//     roomNumber: p.roomNumber ?? "",
//     roomCategory: p.roomCategory ?? "",
//     roomKind: p.roomKind ?? "",
//     daysCount: 0,
//     breakfast: 0,
//     lunch: 0,
//     dinner: 0,
//     foodCost: 0,
//     accommodationCost: 0,
//   }));
// }

// function RepresentativeHotelReportPage({ user }) {
//   const token = getCookie("token");
//   const { id, idRequest, hotelId } = useParams();
//   const navigate = useNavigate();
//   const { cookiesAccepted, acceptCookies, isInitialized } = useCookies();

//   const { loading, error, data } = useQuery(GET_PASSENGER_REQUEST, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//     variables: { passengerRequestId: idRequest },
//   });

//   const request = data?.passengerRequest ?? null;
//   const decodedHotelId = hotelId ? decodeURIComponent(hotelId) : "";

//   const { hotel, hotelIndex } = useMemo(() => {
//     const hotels = request?.livingService?.hotels ?? [];
//     const byMatch = hotels.findIndex(
//       (h, i) =>
//         String(h.hotelId) === decodedHotelId ||
//         h.name === decodedHotelId ||
//         String(i) === decodedHotelId
//     );
//     const byNum =
//       decodedHotelId !== "" && !Number.isNaN(Number(decodedHotelId))
//         ? Number(decodedHotelId)
//         : -1;
//     const idx =
//       byMatch >= 0 ? byMatch : (byNum >= 0 && byNum < hotels.length ? byNum : -1);
//     const found = idx >= 0 ? hotels[idx] : null;
//     return { hotel: found ?? null, hotelIndex: idx >= 0 ? idx : 0 };
//   }, [request?.livingService?.hotels, decodedHotelId]);

//   const hotelDetailUrl = `/${id}/representativeRequestsPlacement/${idRequest}/hotel/${encodeURIComponent(hotelId)}`;

//   const people = hotel?.people ?? [];
//   const [reportRows, setReportRows] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const initReportRef = useRef(false);

//   const [saveReport, { loading: saving }] = useMutation(SAVE_PASSENGER_REQUEST_HOTEL_REPORT, {
//     context: { headers: { Authorization: `Bearer ${token}` } },
//     refetchQueries: [{ query: GET_PASSENGER_REQUEST, variables: { passengerRequestId: idRequest } }],
//   });

//   const updateRow = (reportIndex, field, value) => {
//     setReportRows((prev) => {
//       const next = [...prev];
//       if (!next[reportIndex]) return next;
//       next[reportIndex] = { ...next[reportIndex], [field]: value };
//       return next;
//     });
//   };

//   const rowTotal = (row) =>
//     toNum(row.foodCost) + toNum(row.accommodationCost);

//   const filteredRowsWithIndex = useMemo(() => {
//     if (!searchQuery.trim()) return reportRows.map((row, i) => ({ row, reportIndex: i }));
//     const q = searchQuery.trim().toLowerCase();
//     return reportRows
//       .map((row, i) => ({ row, reportIndex: i }))
//       .filter(({ row }) => (row.fullName || "").toLowerCase().includes(q));
//   }, [reportRows, searchQuery]);

//   const grandTotal = useMemo(
//     () => reportRows.reduce((sum, row) => sum + rowTotal(row), 0),
//     [reportRows]
//   );

//   const handleSaveReport = async () => {
//     if (!request?.id || hotelIndex < 0) return;
//     try {
//       await saveReport({
//         variables: {
//           requestId: request.id,
//           hotelIndex,
//           reportRows: reportRows.map((row) => ({
//             fullName: row.fullName ?? "",
//             roomNumber: row.roomNumber ?? "",
//             roomCategory: row.roomCategory ?? "",
//             roomKind: row.roomKind ?? "",
//             daysCount: toNum(row.daysCount),
//             breakfast: toNum(row.breakfast),
//             lunch: toNum(row.lunch),
//             dinner: toNum(row.dinner),
//             foodCost: toNum(row.foodCost),
//             accommodationCost: toNum(row.accommodationCost),
//           })),
//         },
//       });
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleDownloadReport = () => {
//     const headers = [
//       "ID",
//       "Категория номера",
//       "Вид номера",
//       "Суток",
//       "ФИО",
//       "Завтрак",
//       "Обед",
//       "Ужин",
//       "Ст-ть питания",
//       "Ст-ть проживания",
//       "Итоговая стоимость",
//     ];
//     const dataRows = reportRows.map((row, i) => [
//       i + 1,
//       row.roomCategory ?? "",
//       row.roomKind ?? "",
//       toNum(row.daysCount),
//       row.fullName ?? "",
//       toNum(row.breakfast),
//       toNum(row.lunch),
//       toNum(row.dinner),
//       toNum(row.foodCost),
//       toNum(row.accommodationCost),
//       rowTotal(row),
//     ]);
//     const aoa = [headers, ...dataRows, [], ["Общая итоговая стоимость:", grandTotal]];
//     const ws = XLSX.utils.aoa_to_sheet(aoa);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Отчёт");
//     const safe = (s) => String(s).replace(/[/\\?*\[\]:]/g, "_").slice(0, 100);
//     const dateStr = new Date().toISOString().slice(0, 10);
//     const fileName = `otchet_otel_${safe(hotel?.name ?? "")}_${dateStr}.xlsx`;
//     XLSX.writeFile(wb, fileName);
//   };

//   useEffect(() => {
//     if (loading || !request || hotelIndex < 0) return;
//     const key = `${request.id}-${hotelIndex}`;
//     if (initReportRef.current === key) return;
//     const hotelReports = request.hotelReports ?? [];
//     const saved = hotelReports.find((r) => r.hotelIndex === hotelIndex);
//     if (saved?.reportRows?.length) {
//       setReportRows(
//         saved.reportRows.map((r) => ({
//           fullName: r.fullName ?? "",
//           roomNumber: r.roomNumber ?? "",
//           roomCategory: r.roomCategory ?? "",
//           roomKind: r.roomKind ?? "",
//           daysCount: r.daysCount ?? 0,
//           breakfast: r.breakfast ?? 0,
//           lunch: r.lunch ?? 0,
//           dinner: r.dinner ?? 0,
//           foodCost: r.foodCost ?? 0,
//           accommodationCost: r.accommodationCost ?? 0,
//         }))
//       );
//     } else if (people.length > 0) {
//       setReportRows(buildReportRows(people));
//     }
//     initReportRef.current = key;
//   }, [loading, request, hotelIndex, request?.id, request?.hotelReports, people]);

//   useEffect(() => {
//     if (!loading && request && !hotel) {
//       navigate(`/${id}/representativeRequestsPlacement/${idRequest}`, {
//         state: { tab: "habitation" },
//       });
//     }
//   }, [loading, request, hotel, id, idRequest, navigate]);

//   if (loading || !request) {
//     return (
//       <div className={classes.main}>
//         <MenuDispetcher id="reserve" accessMenu={{}} />
//         <div className={classes.section}>
//           <MUILoader />
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className={classes.main}>
//         <MenuDispetcher id="reserve" accessMenu={{}} />
//         <div className={classes.section}>
//           <p>Error: {error.message}</p>
//         </div>
//       </div>
//     );
//   }

//   if (!hotel) {
//     return null;
//   }

//   return (
//     <div className={classes.main}>
//       <MenuDispetcher id="reserve" accessMenu={{}} />
//       {isInitialized && !cookiesAccepted && (
//         <CookiesNotice onAccept={acceptCookies} />
//       )}
//       <div className={`${classes.section} ${reportClasses.sectionReport}`}>
//         <Header>
//           <div className={classes.titleHeader}>
//             <Link to={hotelDetailUrl} className={classes.backButton}>
//               <img src="/arrow.png" alt="" />
//             </Link>
//             Создать отчёт
//           </div>
//         </Header>
//         <div className={`${classes.tabContent} ${reportClasses.tabContentReport}`}>
//           <section className={reportClasses.cardWrap}>
//             <div className={`${reportClasses.searchRow} ${classes.section_searchAndFilter}`}>
//               <MUITextField
//                 className={reportClasses.searchField}
//                 label="Поиск"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>
//             <div className={reportClasses.tableCard}>
//               <div className={reportClasses.tableWrap}>
//                 <div className={`${reportClasses.reportGrid} ${reportClasses.tableHead}`}>
//                   <div>ID</div>
//                   <div>Категория номера</div>
//                   <div>Вид номера</div>
//                   <div>Суток</div>
//                   <div>ФИО</div>
//                   <div>Завтрак</div>
//                   <div>Обед</div>
//                   <div>Ужин</div>
//                   <div>Ст-ть питания</div>
//                   <div>Ст-ть проживания</div>
//                   <div>Итоговая стоимость</div>
//                 </div>
//                 {filteredRowsWithIndex.length === 0 ? (
//                   <div className={reportClasses.emptyMessage}>
//                     {reportRows.length === 0 ? "Нет гостей" : "Нет совпадений по поиску"}
//                   </div>
//                 ) : (
//                   filteredRowsWithIndex.map(({ row, reportIndex }, displayIndex) => (
//                     <div
//                       key={reportIndex}
//                       className={`${reportClasses.reportGrid} ${reportClasses.tableRow}`}
//                     >
//                       <div>{displayIndex + 1}</div>
//                       <div>
//                         <input
//                           type="text"
//                           className={reportClasses.reportInput}
//                           value={row.roomCategory}
//                           onChange={(e) => updateRow(reportIndex, "roomCategory", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <input
//                           type="text"
//                           className={reportClasses.reportInput}
//                           value={row.roomKind}
//                           onChange={(e) => updateRow(reportIndex, "roomKind", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <input
//                           type="number"
//                           min={0}
//                           step={0.5}
//                           className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
//                           value={row.daysCount === 0 ? 0 : row.daysCount}
//                           onChange={(e) => updateRow(reportIndex, "daysCount", e.target.value)}
//                         />
//                       </div>
//                       <div>{row.fullName || "—"}</div>
//                       <div>
//                         <input
//                           type="number"
//                           min={0}
//                           className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
//                           value={row.breakfast === 0 ? 0 : row.breakfast}
//                           onChange={(e) => updateRow(reportIndex, "breakfast", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <input
//                           type="number"
//                           min={0}
//                           className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
//                           value={row.lunch === 0 ? 0 : row.lunch}
//                           onChange={(e) => updateRow(reportIndex, "lunch", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <input
//                           type="number"
//                           min={0}
//                           className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
//                           value={row.dinner === 0 ? 0 : row.dinner}
//                           onChange={(e) => updateRow(reportIndex, "dinner", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <input
//                           type="number"
//                           min={0}
//                           className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
//                           value={row.foodCost === 0 ? 0 : row.foodCost}
//                           onChange={(e) => updateRow(reportIndex, "foodCost", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <input
//                           type="number"
//                           min={0}
//                           className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
//                           value={row.accommodationCost === 0 ? 0 : row.accommodationCost}
//                           onChange={(e) => updateRow(reportIndex, "accommodationCost", e.target.value)}
//                         />
//                       </div>
//                       <div>{rowTotal(row)}</div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             <div className={reportClasses.footerRow}>
//               <span className={reportClasses.totalLabel}>
//                 Общая итоговая стоимость: {grandTotal}
//               </span>
//               <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
//                 <Button type="button" onClick={handleSaveReport} disabled={saving}>
//                   Сформировать отчёт
//                 </Button>
//                 <Button type="button" onClick={handleDownloadReport} disabled={reportRows.length === 0}>
//                   Скачать отчёт
//                 </Button>
//               </div>
//             </div>
//             </div>
//           </section>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default RepresentativeHotelReportPage;

