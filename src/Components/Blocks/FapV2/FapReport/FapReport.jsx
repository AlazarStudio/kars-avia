import React, { useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@apollo/client";
import * as XLSX from "xlsx";
import classes from "./FapReport.module.css";
import {
  SAVE_PASSENGER_REQUEST_HOTEL_REPORT,
  getCookie,
} from "../../../../graphQL_requests";
import { calculateEffectiveCostDays } from "../../../utils/effectiveCostDays";
import Button from "../../../Standart/Button/Button";
import { useToast } from "../../../../contexts/ToastContext";

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function FapReport({ request, hotelIndex, hotelName }) {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const hotel = request?.livingService?.hotels?.[hotelIndex];
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(
    (hotel?.people || []).map((p) => ({
      id: p.id || Math.random(),
      fullName: p.fullName || "",
      roomNumber: p.roomNumber || "",
      roomCategory: p.roomCategory || "",
      breakfast: p.breakfast ? 1 : 0,
      lunch: p.lunch ? 1 : 0,
      dinner: p.dinner ? 1 : 0,
      breakfastPrice: toNum(p.breakfastPrice),
      lunchPrice: toNum(p.lunchPrice),
      dinnerPrice: toNum(p.dinnerPrice),
      roomPrice: toNum(p.roomPrice),
      nightsCount: toNum(p.nightsCount),
    }))
  );

  const [saving, setSaving] = useState(false);

  const [saveReport] = useMutation(SAVE_PASSENGER_REQUEST_HOTEL_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !search ||
          r.fullName.toLowerCase().includes(search.toLowerCase()) ||
          r.roomNumber.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );

  const handleRowChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Math.random(),
        fullName: "",
        roomNumber: "",
        roomCategory: "",
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        breakfastPrice: 0,
        lunchPrice: 0,
        dinnerPrice: 0,
        roomPrice: 0,
        nightsCount: 0,
      },
    ]);
  };

  const handleRemoveRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const calculateTotal = (rows) => {
    return rows.reduce((sum, r) => {
      const roomCost = toNum(r.roomPrice) * toNum(r.nightsCount);
      const mealCost =
        toNum(r.breakfast) * toNum(r.breakfastPrice) +
        toNum(r.lunch) * toNum(r.lunchPrice) +
        toNum(r.dinner) * toNum(r.dinnerPrice);
      return sum + roomCost + mealCost;
    }, 0);
  };

  const handleSave = async () => {
    if (rows.length === 0) {
      notifyError("Добавьте хотя бы одну строку");
      return;
    }

    const payload = {
      passengerRequestId: requestId,
      hotelIndex,
      people: rows.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        roomNumber: r.roomNumber,
        roomCategory: r.roomCategory,
        breakfast: r.breakfast === 1,
        lunch: r.lunch === 1,
        dinner: r.dinner === 1,
        breakfastPrice: toNum(r.breakfastPrice),
        lunchPrice: toNum(r.lunchPrice),
        dinnerPrice: toNum(r.dinnerPrice),
        roomPrice: toNum(r.roomPrice),
        nightsCount: toNum(r.nightsCount),
      })),
    };

    try {
      setSaving(true);
      await saveReport({ variables: payload });
      success("Отчёт сохранён");
    } catch (e) {
      notifyError("Ошибка при сохранении");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const data = rows.map((r) => ({
      "ФИО": r.fullName,
      "Номер": r.roomNumber,
      "Категория": r.roomCategory,
      "Завтрак": r.breakfast ? "✓" : "",
      "Обед": r.lunch ? "✓" : "",
      "Ужин": r.dinner ? "✓" : "",
      "Цена завтрака": r.breakfastPrice,
      "Цена обеда": r.lunchPrice,
      "Цена ужина": r.dinnerPrice,
      "Цена номера": r.roomPrice,
      "Ночей": r.nightsCount,
      "Итого": toNum(r.roomPrice) * toNum(r.nightsCount) +
        toNum(r.breakfast) * toNum(r.breakfastPrice) +
        toNum(r.lunch) * toNum(r.lunchPrice) +
        toNum(r.dinner) * toNum(r.dinnerPrice),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Отчёт");
    XLSX.writeFile(wb, `report-${hotelName}-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className={classes.page}>
      {/* Header */}
      <div className={classes.header}>
        <div className={classes.headerLeft}>
          <button className={classes.backBtn} onClick={() => navigate(`/fapv2/${requestId}`)}>
            ←
          </button>
          <div className={classes.title}>Отчёт по размещению — {hotelName}</div>
        </div>
        <div className={classes.headerRight}>
          <Button
            backgroundcolor="#F6F7FB"
            color="#545873"
            onClick={handleExport}
            disabled={rows.length === 0}
          >
            ⬇ Excel
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={classes.toolbar}>
        <input
          type="text"
          className={classes.searchInput}
          placeholder="Поиск по ФИО или номеру..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      <div className={classes.content}>
        <table className={classes.table}>
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Номер</th>
              <th>Категория</th>
              <th>Завтрак</th>
              <th>Обед</th>
              <th>Ужин</th>
              <th style={{ textAlign: "right" }}>Цена завтрака</th>
              <th style={{ textAlign: "right" }}>Цена обеда</th>
              <th style={{ textAlign: "right" }}>Цена ужина</th>
              <th style={{ textAlign: "right" }}>Цена номера</th>
              <th style={{ textAlign: "right" }}>Ночей</th>
              <th style={{ textAlign: "right" }}>Итого</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const total =
                toNum(row.roomPrice) * toNum(row.nightsCount) +
                toNum(row.breakfast) * toNum(row.breakfastPrice) +
                toNum(row.lunch) * toNum(row.lunchPrice) +
                toNum(row.dinner) * toNum(row.dinnerPrice);
              return (
                <tr key={row.id}>
                  <td>
                    <input
                      className={classes.input}
                      value={row.fullName}
                      onChange={(e) =>
                        handleRowChange(row.id, "fullName", e.target.value)
                      }
                      placeholder="ФИО"
                    />
                  </td>
                  <td>
                    <input
                      className={classes.input}
                      value={row.roomNumber}
                      onChange={(e) =>
                        handleRowChange(row.id, "roomNumber", e.target.value)
                      }
                      placeholder="№"
                    />
                  </td>
                  <td>
                    <input
                      className={classes.input}
                      value={row.roomCategory}
                      onChange={(e) =>
                        handleRowChange(row.id, "roomCategory", e.target.value)
                      }
                      placeholder="Категория"
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      className={classes.checkbox}
                      type="checkbox"
                      checked={row.breakfast === 1}
                      onChange={(e) =>
                        handleRowChange(row.id, "breakfast", e.target.checked ? 1 : 0)
                      }
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      className={classes.checkbox}
                      type="checkbox"
                      checked={row.lunch === 1}
                      onChange={(e) =>
                        handleRowChange(row.id, "lunch", e.target.checked ? 1 : 0)
                      }
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      className={classes.checkbox}
                      type="checkbox"
                      checked={row.dinner === 1}
                      onChange={(e) =>
                        handleRowChange(row.id, "dinner", e.target.checked ? 1 : 0)
                      }
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      type="number"
                      className={classes.input}
                      value={row.breakfastPrice}
                      onChange={(e) =>
                        handleRowChange(row.id, "breakfastPrice", toNum(e.target.value))
                      }
                      placeholder="0"
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      type="number"
                      className={classes.input}
                      value={row.lunchPrice}
                      onChange={(e) =>
                        handleRowChange(row.id, "lunchPrice", toNum(e.target.value))
                      }
                      placeholder="0"
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      type="number"
                      className={classes.input}
                      value={row.dinnerPrice}
                      onChange={(e) =>
                        handleRowChange(row.id, "dinnerPrice", toNum(e.target.value))
                      }
                      placeholder="0"
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      type="number"
                      className={classes.input}
                      value={row.roomPrice}
                      onChange={(e) =>
                        handleRowChange(row.id, "roomPrice", toNum(e.target.value))
                      }
                      placeholder="0"
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      type="number"
                      className={classes.input}
                      value={row.nightsCount}
                      onChange={(e) =>
                        handleRowChange(row.id, "nightsCount", toNum(e.target.value))
                      }
                      placeholder="0"
                    />
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    {total.toFixed(2)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className={classes.removeBtn}
                      onClick={() => handleRemoveRow(row.id)}
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Total row */}
        {rows.length > 0 && (
          <div className={classes.totalRow}>
            <span>Всего пассажиров: {rows.length}</span>
            <span>Проживание дней: {rows.reduce((sum, r) => sum + toNum(r.nightsCount), 0)}</span>
            <div>
              Итого:
              <span className={classes.totalValue}>
                {calculateTotal(rows).toFixed(2)} руб.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={classes.actions}>
        <Button
          backgroundcolor="#F6F7FB"
          color="#545873"
          onClick={handleAddRow}
        >
          + Добавить строку
        </Button>
        <Button
          backgroundcolor="var(--dark-blue)"
          color="#fff"
          onClick={handleSave}
          disabled={saving || rows.length === 0}
        >
          {saving ? "Сохранение..." : "Сохранить отчёт"}
        </Button>
      </div>
    </div>
  );
}
