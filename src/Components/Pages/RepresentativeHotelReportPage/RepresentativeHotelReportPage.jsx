import React, { useEffect, useMemo, useRef, useState } from "react";
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

function buildReportRows(people) {
  return (people || []).map((p) => ({
    fullName: p.fullName ?? "",
    roomNumber: p.roomNumber ?? "",
    roomCategory: p.roomCategory ?? "",
    roomKind: p.roomKind ?? "",
    daysCount: 0,
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    foodCost: 0,
    accommodationCost: 0,
  }));
}

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
  const [reportRows, setReportRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const initReportRef = useRef(false);

  const [saveReport, { loading: saving }] = useMutation(SAVE_PASSENGER_REQUEST_HOTEL_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    refetchQueries: [{ query: GET_PASSENGER_REQUEST, variables: { passengerRequestId: idRequest } }],
  });

  const updateRow = (reportIndex, field, value) => {
    setReportRows((prev) => {
      const next = [...prev];
      if (!next[reportIndex]) return next;
      next[reportIndex] = { ...next[reportIndex], [field]: value };
      return next;
    });
  };

  const rowTotal = (row) =>
    toNum(row.foodCost) + toNum(row.accommodationCost);

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
            roomCategory: row.roomCategory ?? "",
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
    const key = `${request.id}-${hotelIndex}`;
    if (initReportRef.current === key) return;
    const hotelReports = request.hotelReports ?? [];
    const saved = hotelReports.find((r) => r.hotelIndex === hotelIndex);
    if (saved?.reportRows?.length) {
      setReportRows(
        saved.reportRows.map((r) => ({
          fullName: r.fullName ?? "",
          roomNumber: r.roomNumber ?? "",
          roomCategory: r.roomCategory ?? "",
          roomKind: r.roomKind ?? "",
          daysCount: r.daysCount ?? 0,
          breakfast: r.breakfast ?? 0,
          lunch: r.lunch ?? 0,
          dinner: r.dinner ?? 0,
          foodCost: r.foodCost ?? 0,
          accommodationCost: r.accommodationCost ?? 0,
        }))
      );
    } else if (people.length > 0) {
      setReportRows(buildReportRows(people));
    }
    initReportRef.current = key;
  }, [loading, request, hotelIndex, request?.id, request?.hotelReports, people]);

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
            <div className={reportClasses.tableCard}>
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
                    {reportRows.length === 0 ? "Нет гостей" : "Нет совпадений по поиску"}
                  </div>
                ) : (
                  filteredRowsWithIndex.map(({ row, reportIndex }, displayIndex) => (
                    <div
                      key={reportIndex}
                      className={`${reportClasses.reportGrid} ${reportClasses.tableRow}`}
                    >
                      <div>{displayIndex + 1}</div>
                      <div>
                        <input
                          type="text"
                          className={reportClasses.reportInput}
                          value={row.roomCategory}
                          onChange={(e) => updateRow(reportIndex, "roomCategory", e.target.value)}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          className={reportClasses.reportInput}
                          value={row.roomKind}
                          onChange={(e) => updateRow(reportIndex, "roomKind", e.target.value)}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                          value={row.daysCount === 0 ? 0 : row.daysCount}
                          onChange={(e) => updateRow(reportIndex, "daysCount", e.target.value)}
                        />
                      </div>
                      <div>{row.fullName || "—"}</div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                          value={row.breakfast === 0 ? 0 : row.breakfast}
                          onChange={(e) => updateRow(reportIndex, "breakfast", e.target.value)}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                          value={row.lunch === 0 ? 0 : row.lunch}
                          onChange={(e) => updateRow(reportIndex, "lunch", e.target.value)}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                          value={row.dinner === 0 ? 0 : row.dinner}
                          onChange={(e) => updateRow(reportIndex, "dinner", e.target.value)}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                          value={row.foodCost === 0 ? 0 : row.foodCost}
                          onChange={(e) => updateRow(reportIndex, "foodCost", e.target.value)}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          className={`${reportClasses.reportInput} ${reportClasses.reportInputNum}`}
                          value={row.accommodationCost === 0 ? 0 : row.accommodationCost}
                          onChange={(e) => updateRow(reportIndex, "accommodationCost", e.target.value)}
                        />
                      </div>
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
          </section>
        </div>
      </div>
    </div>
  );
}

export default RepresentativeHotelReportPage;
