import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import * as XLSX from "xlsx";
import classes from "./FapReport.module.css";
import {
  SAVE_PASSENGER_REQUEST_HOTEL_REPORT,
  getCookie,
} from "../../../../../graphQL_requests";
import { calculateEffectiveCostDays } from "../../../../utils/effectiveCostDays";
import Button from "../../../Standart/Button/Button";
import { useToast } from "../../../../contexts/ToastContext";

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function rowTotal(row) {
  return toNum(row.foodCost) + toNum(row.accommodationCost);
}

function getPersonDays(person, hotelIndex, plan) {
  const chess =
    (person?.accommodationChesses ?? []).find(
      (c) => c != null && Number(c.hotelIndex) === Number(hotelIndex)
    ) || (person?.accommodationChesses ?? [])[0];
  if (chess?.startAt && chess?.endAt) {
    return calculateEffectiveCostDays(chess.startAt, chess.endAt);
  }
  const planStart = plan?.plannedFromAt || plan?.plannedAt;
  const planEnd = plan?.plannedToAt;
  if (planStart && planEnd) {
    return calculateEffectiveCostDays(planStart, planEnd);
  }
  return 0;
}

const newTariff = () => ({
  id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  breakfast: 0,
  lunch: 0,
  dinner: 0,
  foodCost: 0,
  accommodationCost: 0,
});

const emptyPD = (person, hotelIndex, plan) => ({
  roomNumber: person.roomNumber ?? "",
  daysCount: getPersonDays(person, hotelIndex, plan),
  tariffId: null,
  breakfast: 0,
  lunch: 0,
  dinner: 0,
  foodCost: 0,
  accommodationCost: 0,
});

export default function FapReport({ request, hotelIndex, hotelName }) {
  const navigate = useNavigate();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const hotel = request?.livingService?.hotels?.[hotelIndex];
  const people = useMemo(() => hotel?.people ?? [], [hotel]);
  const plan = useMemo(() => request?.livingService?.plan ?? null, [request?.livingService?.plan]);

  const [tariffs, setTariffs] = useState([]);
  const [personData, setPersonData] = useState({});
  const [activeTab, setActiveTab] = useState("tariffs");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Инициализация
  useEffect(() => {
    if (!request) return;
    const saved = (request.hotelReports ?? []).find((r) => r.hotelIndex === hotelIndex);
    const savedRows = saved?.reportRows ?? [];

    const priceKey = (r) =>
      [toNum(r.breakfast), toNum(r.lunch), toNum(r.dinner), toNum(r.foodCost), toNum(r.accommodationCost)].join("|");

    if (savedRows.length > 0) {
      // Авто-восстановление тарифов из уникальных ценовых комбинаций
      const tariffByKey = new Map();
      savedRows.forEach((r) => {
        const k = priceKey(r);
        if (!tariffByKey.has(k)) {
          tariffByKey.set(k, {
            ...newTariff(),
            name: [r.roomCategory, r.roomKind].filter(Boolean).join(" / ") || "",
            breakfast: toNum(r.breakfast),
            lunch: toNum(r.lunch),
            dinner: toNum(r.dinner),
            foodCost: toNum(r.foodCost),
            accommodationCost: toNum(r.accommodationCost),
          });
        }
      });
      const restoredTariffs = [...tariffByKey.values()];
      setTariffs(restoredTariffs);

      const data = {};
      people.forEach((p, i) => {
        data[i] = emptyPD(p, hotelIndex, plan);
      });
      savedRows.forEach((row) => {
        const idx = people.findIndex(
          (p) =>
            (p.fullName ?? "").trim() === (row.fullName ?? "").trim() &&
            (p.roomNumber ?? "").trim() === (row.roomNumber ?? "").trim()
        );
        if (idx < 0) return;
        const k = priceKey(row);
        const tariff = restoredTariffs.find(
          (t) => priceKey(t) === k
        );
        data[idx] = {
          roomNumber: row.roomNumber ?? "",
          daysCount: toNum(row.daysCount),
          tariffId: tariff?.id ?? null,
          breakfast: toNum(row.breakfast),
          lunch: toNum(row.lunch),
          dinner: toNum(row.dinner),
          foodCost: toNum(row.foodCost),
          accommodationCost: toNum(row.accommodationCost),
        };
      });
      setPersonData(data);
    } else {
      const data = {};
      people.forEach((p, i) => {
        data[i] = emptyPD(p, hotelIndex, plan);
      });
      setPersonData(data);
      setTariffs([]);
    }
  }, [request?.id, hotelIndex]);

  // Тарифы
  const addTariff = useCallback(() => {
    setTariffs((prev) => [...prev, newTariff()]);
  }, []);

  const removeTariff = useCallback((tariffId) => {
    setTariffs((prev) => prev.filter((t) => t.id !== tariffId));
    // Снять привязку у людей
    setPersonData((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k].tariffId === tariffId) next[k] = { ...next[k], tariffId: null };
      });
      return next;
    });
  }, []);

  const updateTariff = useCallback((tariffId, field, value) => {
    setTariffs((prev) =>
      prev.map((t) => (t.id !== tariffId ? t : { ...t, [field]: value }))
    );
  }, []);

  const applyTariffToAll = useCallback((tariffId) => {
    const t = tariffs.find((t) => t.id === tariffId);
    if (!t) return;
    setPersonData((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = {
          ...next[k],
          tariffId,
          breakfast: t.breakfast,
          lunch: t.lunch,
          dinner: t.dinner,
          foodCost: t.foodCost,
          accommodationCost: t.accommodationCost,
        };
      });
      return next;
    });
  }, [tariffs]);

  // Гости
  const applyTariffToPerson = useCallback((personIndex, tariffId) => {
    const t = tariffs.find((t) => t.id === tariffId);
    setPersonData((prev) => ({
      ...prev,
      [personIndex]: {
        ...prev[personIndex],
        tariffId: tariffId || null,
        ...(t
          ? { breakfast: t.breakfast, lunch: t.lunch, dinner: t.dinner, foodCost: t.foodCost, accommodationCost: t.accommodationCost }
          : {}),
      },
    }));
  }, [tariffs]);

  const updatePerson = useCallback((personIndex, field, value) => {
    setPersonData((prev) => ({
      ...prev,
      [personIndex]: { ...prev[personIndex], [field]: value },
    }));
  }, []);

  const reportRows = useMemo(() =>
    people.map((person, i) => {
      const pd = personData[i] ?? emptyPD(person, hotelIndex, plan);
      const tariff = tariffs.find((t) => t.id === pd.tariffId);
      return {
        personIndex: i,
        fullName: person.fullName ?? "",
        roomNumber: pd.roomNumber,
        roomCategory: tariff?.name ?? "",
        roomKind: "",
        daysCount: toNum(pd.daysCount),
        breakfast: toNum(pd.breakfast),
        lunch: toNum(pd.lunch),
        dinner: toNum(pd.dinner),
        foodCost: toNum(pd.foodCost),
        accommodationCost: toNum(pd.accommodationCost),
      };
    }),
    [people, personData, tariffs, hotelIndex, plan]
  );

  const filteredPeople = useMemo(() => {
    if (!search.trim()) return people.map((p, i) => ({ person: p, index: i }));
    const q = search.trim().toLowerCase();
    return people
      .map((p, i) => ({ person: p, index: i }))
      .filter(({ person }) => (person.fullName || "").toLowerCase().includes(q));
  }, [people, search]);

  const grandTotal = useMemo(
    () => reportRows.reduce((sum, r) => sum + rowTotal(r), 0),
    [reportRows]
  );

  const [saveReport] = useMutation(SAVE_PASSENGER_REQUEST_HOTEL_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const handleSave = async () => {
    if (!request?.id) return;
    setSaving(true);
    try {
      await saveReport({
        variables: {
          requestId: request.id,
          hotelIndex,
          reportRows: reportRows.map((row) => ({
            fullName: row.fullName,
            roomNumber: row.roomNumber,
            roomCategory: row.roomCategory,
            roomKind: row.roomKind,
            daysCount: toNum(row.daysCount),
            breakfast: toNum(row.breakfast),
            lunch: toNum(row.lunch),
            dinner: toNum(row.dinner),
            foodCost: toNum(row.foodCost),
            accommodationCost: toNum(row.accommodationCost),
          })),
        },
      });
      success("Отчёт сохранён");
    } catch (e) {
      notifyError("Ошибка при сохранении");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const headers = [
      "ID", "ФИО", "Номер", "Тариф", "Суток",
      "Завтрак", "Обед", "Ужин", "Ст-ть питания", "Ст-ть проживания", "Итого",
    ];
    const dataRows = reportRows.map((row, i) => [
      i + 1, row.fullName, row.roomNumber, row.roomCategory, toNum(row.daysCount),
      toNum(row.breakfast), toNum(row.lunch), toNum(row.dinner),
      toNum(row.foodCost), toNum(row.accommodationCost), rowTotal(row),
    ]);
    const aoa = [headers, ...dataRows, [], ["Итого:", grandTotal]];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Отчёт");
    const safe = (s) => String(s).replace(/[/\\?*[\]:]/g, "_").slice(0, 100);
    XLSX.writeFile(wb, `otchet-${safe(hotelName)}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className={classes.page}>
      {/* Header */}
      <div className={classes.header}>
        <div className={classes.headerLeft}>
          <button className={classes.backBtn} onClick={() => navigate(`/fapv2/${request?.id}`)}>
            ←
          </button>
          <div className={classes.title}>Отчёт — {hotelName}</div>
          {people.length > 0 && (
            <span className={classes.peopleBadge}>{people.length} гостей</span>
          )}
        </div>
        <div className={classes.headerRight}>
          <Button backgroundcolor="#F6F7FB" color="#545873" onClick={handleExport} disabled={people.length === 0}>
            ⬇ Excel
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className={classes.tabs}>
        <button
          className={activeTab === "tariffs" ? classes.tabActive : classes.tab}
          onClick={() => setActiveTab("tariffs")}
        >
          Тарифы
          <span className={classes.tabBadge}>{tariffs.length}</span>
        </button>
        <button
          className={activeTab === "guests" ? classes.tabActive : classes.tab}
          onClick={() => setActiveTab("guests")}
        >
          Гости
          <span className={classes.tabBadge}>{people.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className={classes.content}>
        {/* ── TAB: ТАРИФЫ ── */}
        {activeTab === "tariffs" && (
          <div className={classes.tariffsPane}>
            <div className={classes.tariffsPaneHeader}>
              <p className={classes.tariffHint}>
                Создайте тарифы с ценами — затем назначьте их гостям во вкладке «Гости».
              </p>
              <Button backgroundcolor="var(--dark-blue)" color="#fff" onClick={addTariff}>
                + Добавить тариф
              </Button>
            </div>

            {tariffs.length === 0 && (
              <div className={classes.emptyState}>Нет тарифов — добавьте первый</div>
            )}

            {tariffs.map((t) => (
              <div key={t.id} className={classes.tariffCard}>
                <div className={classes.tariffCardHeader}>
                  <input
                    type="text"
                    className={classes.tariffNameInput}
                    value={t.name}
                    onChange={(e) => updateTariff(t.id, "name", e.target.value)}
                    placeholder="Название тарифа (напр. Стандарт 2-мест.)"
                  />
                  <button
                    className={classes.applyAllBtn}
                    onClick={() => applyTariffToAll(t.id)}
                    title="Применить этот тариф всем гостям"
                  >
                    Применить всем
                  </button>
                  <button
                    className={classes.removeTariffBtn}
                    onClick={() => removeTariff(t.id)}
                    title="Удалить тариф"
                  >
                    ×
                  </button>
                </div>
                <div className={classes.tariffFields}>
                  <label className={classes.fieldLabel}>
                    Завтрак
                    <input type="number" min={0} className={classes.fieldInput} value={t.breakfast}
                      onChange={(e) => updateTariff(t.id, "breakfast", e.target.value)} placeholder="0" />
                  </label>
                  <label className={classes.fieldLabel}>
                    Обед
                    <input type="number" min={0} className={classes.fieldInput} value={t.lunch}
                      onChange={(e) => updateTariff(t.id, "lunch", e.target.value)} placeholder="0" />
                  </label>
                  <label className={classes.fieldLabel}>
                    Ужин
                    <input type="number" min={0} className={classes.fieldInput} value={t.dinner}
                      onChange={(e) => updateTariff(t.id, "dinner", e.target.value)} placeholder="0" />
                  </label>
                  <label className={classes.fieldLabel}>
                    Ст-ть питания
                    <input type="number" min={0} className={classes.fieldInput} value={t.foodCost}
                      onChange={(e) => updateTariff(t.id, "foodCost", e.target.value)} placeholder="0" />
                  </label>
                  <label className={classes.fieldLabel}>
                    Ст-ть проживания
                    <input type="number" min={0} className={classes.fieldInput} value={t.accommodationCost}
                      onChange={(e) => updateTariff(t.id, "accommodationCost", e.target.value)} placeholder="0" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: ГОСТИ ── */}
        {activeTab === "guests" && (
          <div className={classes.guestsPane}>
            <div className={classes.guestsToolbar}>
              <input
                type="text"
                className={classes.searchInput}
                placeholder="Поиск по ФИО..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {people.length === 0 ? (
              <div className={classes.emptyState}>Гости ещё не добавлены в отель</div>
            ) : (
              <>
                <div className={classes.tableWrap}>
                  <table className={classes.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>ФИО</th>
                        <th>Номер</th>
                        <th>Суток</th>
                        <th>Тариф</th>
                        <th>Завтрак</th>
                        <th>Обед</th>
                        <th>Ужин</th>
                        <th>Питание</th>
                        <th>Проживание</th>
                        <th>Итого</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPeople.map(({ person, index: i }, displayIndex) => {
                        const pd = personData[i] ?? emptyPD(person, hotelIndex, plan);
                        const total = toNum(pd.foodCost) + toNum(pd.accommodationCost);
                        return (
                          <tr key={i}>
                            <td>{displayIndex + 1}</td>
                            <td className={classes.nameCell}>{person.fullName || "—"}</td>
                            <td>
                              <input
                                type="text"
                                className={classes.cellInput}
                                value={pd.roomNumber}
                                onChange={(e) => updatePerson(i, "roomNumber", e.target.value)}
                                placeholder="№"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min={0}
                                step={0.5}
                                className={classes.cellInputNum}
                                value={pd.daysCount === 0 ? "" : pd.daysCount}
                                onChange={(e) => updatePerson(i, "daysCount", e.target.value)}
                              />
                            </td>
                            <td>
                              <select
                                className={classes.tariffSelect}
                                value={pd.tariffId || ""}
                                onChange={(e) => applyTariffToPerson(i, e.target.value)}
                              >
                                <option value="">—</option>
                                {tariffs.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name || "Без названия"}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input type="number" min={0} className={classes.cellInputNum}
                                value={pd.breakfast === 0 ? "" : pd.breakfast}
                                onChange={(e) => updatePerson(i, "breakfast", e.target.value)} />
                            </td>
                            <td>
                              <input type="number" min={0} className={classes.cellInputNum}
                                value={pd.lunch === 0 ? "" : pd.lunch}
                                onChange={(e) => updatePerson(i, "lunch", e.target.value)} />
                            </td>
                            <td>
                              <input type="number" min={0} className={classes.cellInputNum}
                                value={pd.dinner === 0 ? "" : pd.dinner}
                                onChange={(e) => updatePerson(i, "dinner", e.target.value)} />
                            </td>
                            <td>
                              <input type="number" min={0} className={classes.cellInputNum}
                                value={pd.foodCost === 0 ? "" : pd.foodCost}
                                onChange={(e) => updatePerson(i, "foodCost", e.target.value)} />
                            </td>
                            <td>
                              <input type="number" min={0} className={classes.cellInputNum}
                                value={pd.accommodationCost === 0 ? "" : pd.accommodationCost}
                                onChange={(e) => updatePerson(i, "accommodationCost", e.target.value)} />
                            </td>
                            <td className={classes.rowTotal}>{total > 0 ? total : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={classes.totalRow}>
                  <span>Гостей: {people.length}</span>
                  <div>
                    Итого:
                    <span className={classes.totalValue}>
                      {grandTotal.toLocaleString("ru-RU")} руб.
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={classes.actions}>
        <Button
          backgroundcolor="var(--dark-blue)"
          color="#fff"
          onClick={handleSave}
          disabled={saving || people.length === 0}
        >
          {saving ? "Сохранение..." : "Сохранить отчёт"}
        </Button>
      </div>
    </div>
  );
}
