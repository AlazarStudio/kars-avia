import React, { useState, useEffect, useMemo } from "react";
import { useMutation } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import classes from "./HotelGuestsModal.module.css";
import {
  ADD_PASSENGER_REQUEST_HOTEL_PERSON,
  UPDATE_PASSENGER_REQUEST_HOTEL_PERSON,
  REMOVE_PASSENGER_REQUEST_HOTEL_PERSON,
  RELOCATE_PASSENGER_REQUEST_HOTEL_PERSON,
  EVICT_PASSENGER_REQUEST_HOTEL_PERSON,
  getCookie,
  convertToDate,
} from "../../../../../graphQL_requests";
import Button from "../../../Standart/Button/Button";
import MUITextField from "../../MUITextField/MUITextField";
import MUIAutocompleteColor from "../../MUIAutocompleteColor/MUIAutocompleteColor";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import EditPencilIcon from "../../../../shared/icons/EditPencilIcon";

const emptyForm = { fullName: "", phone: "", roomNumber: "" };

function pluralGuests(n) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} гость`;
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return `${n} гостя`;
  return `${n} гостей`;
}

function formatDateVal(val) {
  if (!val) return "—";
  const d = convertToDate(val, false);
  const t = convertToDate(val, true);
  const timeOnly = t && t.includes(" ") ? t.split(" ").pop() : t;
  return timeOnly ? `${d} ${timeOnly}` : (d ?? "—");
}

export default function HotelGuestsModal({
  open,
  onClose,
  request,
  hotel,
  hotelIndex,
  onRefetch,
  onGenerateReport,
  canEdit = true,
}) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();

  const [view, setView] = useState("list"); // "list" | "form" | "relocate" | "evict"
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [relocateTarget, setRelocateTarget] = useState(undefined);
  const [relocateReason, setRelocateReason] = useState("");
  const [evictReason, setEvictReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setView("list");
      setSearch("");
      setSelectedIndices([]);
      setFormData(emptyForm);
      setEditingIndex(null);
    }
  }, [open]);

  const [addPerson] = useMutation(ADD_PASSENGER_REQUEST_HOTEL_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [updatePerson] = useMutation(UPDATE_PASSENGER_REQUEST_HOTEL_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [removePerson] = useMutation(REMOVE_PASSENGER_REQUEST_HOTEL_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [relocatePerson] = useMutation(RELOCATE_PASSENGER_REQUEST_HOTEL_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [evictPerson] = useMutation(EVICT_PASSENGER_REQUEST_HOTEL_PERSON, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const bookings = request?.livingService?.hotels?.[hotelIndex]?.people ?? [];
  const plan = request?.livingService?.plan;
  const checkInStr = formatDateVal(plan?.plannedFromAt || plan?.plannedAt);
  const checkOutStr = formatDateVal(plan?.plannedToAt);

  const otherHotels = useMemo(
    () =>
      (request?.livingService?.hotels ?? [])
        .map((h, idx) => ({ hotel: h, originalIndex: idx }))
        .filter(({ originalIndex }) => originalIndex !== hotelIndex),
    [request?.livingService?.hotels, hotelIndex]
  );

  const hotelOptions = useMemo(
    () => otherHotels.map(({ hotel: h, originalIndex }) => ({ label: h?.name ?? "—", originalIndex })),
    [otherHotels]
  );

  const indexedBookings = useMemo(
    () => bookings.map((b, idx) => ({ ...b, _idx: idx })),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    if (!search.trim()) return indexedBookings;
    const q = search.toLowerCase();
    return indexedBookings.filter(
      (b) =>
        (b.fullName ?? "").toLowerCase().includes(q) ||
        (b.phone ?? "").toLowerCase().includes(q) ||
        (b.roomNumber ?? "").toLowerCase().includes(q)
    );
  }, [indexedBookings, search]);

  const hotelCapacity = hotel?.peopleCount ?? null;
  const canAdd = hotelCapacity == null || bookings.length < hotelCapacity;

  const openAddForm = () => {
    setFormData(emptyForm);
    setEditingIndex(null);
    setView("form");
  };

  const openEditForm = (idx) => {
    const b = bookings[idx];
    setFormData({
      fullName: b?.fullName ?? "",
      phone: b?.phone ?? "",
      roomNumber: b?.roomNumber ?? "",
    });
    setEditingIndex(idx);
    setView("form");
  };

  const closeForm = () => {
    setView("list");
    setEditingIndex(null);
    setFormData(emptyForm);
  };

  const handleFormSubmit = async () => {
    if (!formData.fullName.trim()) {
      notifyError("Укажите ФИО пассажира");
      return;
    }
    const person = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim() || null,
      roomNumber: formData.roomNumber.trim() || null,
    };
    try {
      setSaving(true);
      if (editingIndex != null) {
        await updatePerson({
          variables: { requestId: request.id, hotelIndex, personIndex: editingIndex, person },
        });
        success("Бронь обновлена");
      } else {
        await addPerson({
          variables: { requestId: request.id, hotelIndex, person },
        });
        success("Бронь добавлена");
      }
      onRefetch?.();
      closeForm();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (idx) => {
    const ok = await confirm("Удалить бронь?");
    if (!ok) return;
    try {
      setSaving(true);
      await removePerson({
        variables: { requestId: request.id, hotelIndex, personIndex: idx },
      });
      success("Бронь удалена");
      onRefetch?.();
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при удалении");
    } finally {
      setSaving(false);
    }
  };

  const openRelocate = () => {
    setRelocateTarget(hotelOptions[0]?.originalIndex);
    setRelocateReason("");
    setView("relocate");
  };

  const handleRelocate = async () => {
    if (!relocateReason.trim()) { notifyError("Укажите причину переселения"); return; }
    if (relocateTarget === undefined) { notifyError("Выберите отель"); return; }
    try {
      setSaving(true);
      for (const idx of [...selectedIndices].sort((a, b) => b - a)) {
        await relocatePerson({
          variables: {
            requestId: request.id,
            fromHotelIndex: hotelIndex,
            toHotelIndex: relocateTarget,
            personIndex: idx,
            reason: relocateReason.trim(),
          },
        });
      }
      success(selectedIndices.length > 1 ? `Переселено: ${selectedIndices.length}` : "Пассажир переселён");
      onRefetch?.();
      setSelectedIndices([]);
      setView("list");
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при переселении");
    } finally {
      setSaving(false);
    }
  };

  const openEvict = () => {
    setEvictReason("");
    setView("evict");
  };

  const handleEvict = async () => {
    if (!evictReason.trim()) { notifyError("Укажите причину выселения"); return; }
    try {
      setSaving(true);
      for (const idx of [...selectedIndices].sort((a, b) => b - a)) {
        await evictPerson({
          variables: { requestId: request.id, hotelIndex, personIndex: idx, reason: evictReason.trim() },
        });
      }
      success(selectedIndices.length > 1 ? `Выселено: ${selectedIndices.length}` : "Пассажир выселен");
      onRefetch?.();
      setSelectedIndices([]);
      setView("list");
    } catch (err) {
      notifyError(err?.graphQLErrors?.[0]?.message || "Ошибка при выселении");
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (idx) =>
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );

  const titleMap = {
    list: hotel?.name || "Гости",
    form: editingIndex != null ? "Редактировать бронь" : "Добавить бронь",
    relocate: `Переселить (${selectedIndices.length})`,
    evict: `Выселить (${selectedIndices.length})`,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={view === "list" ? "md" : "sm"}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <div className={classes.modalHeader}>
        {view !== "list" && (
          <button
            className={classes.backBtn}
            onClick={() => setView("list")}
            type="button"
          >
            <img src="/arrow.png" alt="" />
          </button>
        )}
        <div className={classes.headerTitles}>
          <span className={classes.modalTitle}>{titleMap[view]}</span>
          {view === "list" && hotel?.address && (
            <span className={classes.modalSubtitle}>{hotel.address}</span>
          )}
        </div>
        <button className={classes.closeBtn} onClick={onClose} type="button">
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
        {view === "list" && (
          <div className={classes.listContent}>
            {/* Toolbar */}
            <div className={classes.toolbar}>
              <MUITextField
                label="Поиск"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, maxWidth: 320 }}
              />
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {onGenerateReport && (
                  <Button backgroundcolor="#F6F7FB" color="#545873" onClick={onGenerateReport}>
                    Отчёт
                  </Button>
                )}
                {canEdit && canAdd && (
                  <Button backgroundcolor="var(--dark-blue)" color="#fff" onClick={openAddForm}>
                    + Добавить бронь
                  </Button>
                )}
              </div>
            </div>

            {/* Selection bar */}
            {canEdit && selectedIndices.length > 0 && (
              <div className={classes.selectionBar}>
                <span className={classes.selectionCount}>
                  Выбрано: {selectedIndices.length}
                </span>
                {otherHotels.length > 0 && (
                  <Button backgroundcolor="#F6F7FB" color="#545873" onClick={openRelocate}>
                    Переселить
                  </Button>
                )}
                <Button backgroundcolor="#FEF2F2" color="#EF4444" onClick={openEvict}>
                  Выселить
                </Button>
                <button
                  type="button"
                  className={classes.clearBtn}
                  onClick={() => setSelectedIndices([])}
                >
                  Снять выбор
                </button>
              </div>
            )}

            {/* Table */}
            <div className={classes.tableWrap}>
              <div className={classes.tableHead}>
                <div />
                <div>#</div>
                <div>Дата заезда</div>
                <div>Дата выезда</div>
                <div>Номер</div>
                <div>ФИО</div>
                <div />
              </div>
              {filteredBookings.length === 0 ? (
                <div className={classes.empty}>Нет данных</div>
              ) : (
                filteredBookings.map((row) => (
                  <div key={row._idx} className={classes.tableRow}>
                    <div className={classes.colCheck}>
                      {canEdit && (
                        <input
                          type="checkbox"
                          checked={selectedIndices.includes(row._idx)}
                          onChange={() => toggleSelect(row._idx)}
                        />
                      )}
                    </div>
                    <div style={{ color: "#94A3B8" }}>{row._idx + 1}</div>
                    <div>{checkInStr}</div>
                    <div>{checkOutStr}</div>
                    <div>{row.roomNumber || "—"}</div>
                    <div>{row.fullName || "—"}</div>
                    <div className={classes.cellActions}>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className={classes.iconBtn}
                            onClick={() => openEditForm(row._idx)}
                            title="Редактировать"
                          >
                            <EditPencilIcon cursor="pointer" />
                          </button>
                          <button
                            type="button"
                            className={classes.iconBtn}
                            onClick={() => handleRemove(row._idx)}
                            disabled={saving}
                            title="Удалить"
                          >
                            <DeleteIcon cursor="pointer" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === "form" && (
          <div className={classes.formContent}>
            <div className={classes.formField}>
              <label className={classes.formLabel}>ФИО пассажира *</label>
              <input
                className={classes.formInput}
                value={formData.fullName}
                onChange={(e) => setFormData((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div className={classes.formField}>
              <label className={classes.formLabel}>Телефон</label>
              <input
                className={classes.formInput}
                value={formData.phone}
                onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+7 999 000 00 00"
              />
            </div>
            <div className={classes.formField}>
              <label className={classes.formLabel}>Номер комнаты</label>
              <input
                className={classes.formInput}
                value={formData.roomNumber}
                onChange={(e) => setFormData((f) => ({ ...f, roomNumber: e.target.value }))}
                placeholder="101"
              />
            </div>
          </div>
        )}

        {view === "relocate" && (
          <div className={classes.formContent}>
            <p className={classes.formHint}>
              Выберите отель для переселения и укажите причину.
            </p>
            <MUIAutocompleteColor
              label="Отель"
              options={hotelOptions}
              value={hotelOptions.find((o) => o.originalIndex === relocateTarget) ?? null}
              onChange={(e, v) => setRelocateTarget(v?.originalIndex)}
              getOptionLabel={(o) => o?.label ?? "—"}
              dropdownWidth="100%"
            />
            <div className={classes.formField}>
              <label className={classes.formLabel}>Причина *</label>
              <textarea
                className={classes.reasonTextarea}
                rows={4}
                value={relocateReason}
                onChange={(e) => setRelocateReason(e.target.value)}
                placeholder="Укажите причину переселения..."
              />
            </div>
          </div>
        )}

        {view === "evict" && (
          <div className={classes.formContent}>
            <p className={classes.formHint}>
              Укажите причину выселения. Это действие изменит статус гостя.
            </p>
            <div className={classes.formField}>
              <label className={classes.formLabel}>Причина *</label>
              <textarea
                className={classes.reasonTextarea}
                rows={4}
                value={evictReason}
                onChange={(e) => setEvictReason(e.target.value)}
                placeholder="Укажите причину выселения..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={classes.footer}>
        {view === "list" && (
          <>
            <div className={classes.footerLeft}>
              <span className={classes.footerCount}>{pluralGuests(bookings.length)}</span>
              {hotelCapacity != null && (
                <span style={{ fontSize: 13, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                  из {hotelCapacity} мест
                </span>
              )}
            </div>
            <div className={classes.footerRight}>
              <Button backgroundcolor="#F6F7FB" color="#545873" onClick={onClose}>
                Закрыть
              </Button>
            </div>
          </>
        )}

        {view === "form" && (
          <>
            <div className={classes.footerLeft} />
            <div className={classes.footerRight}>
              <Button backgroundcolor="#F6F7FB" color="#545873" onClick={closeForm}>
                Отмена
              </Button>
              <Button
                backgroundcolor="var(--dark-blue)"
                color="#fff"
                onClick={handleFormSubmit}
                disabled={saving}
              >
                {saving ? "Сохранение..." : editingIndex != null ? "Сохранить" : "Добавить"}
              </Button>
            </div>
          </>
        )}

        {view === "relocate" && (
          <>
            <div className={classes.footerLeft} />
            <div className={classes.footerRight}>
              <Button backgroundcolor="#F6F7FB" color="#545873" onClick={() => setView("list")}>
                Отмена
              </Button>
              <Button
                backgroundcolor="var(--dark-blue)"
                color="#fff"
                onClick={handleRelocate}
                disabled={saving || !relocateReason.trim() || relocateTarget === undefined}
              >
                {saving
                  ? "Сохранение..."
                  : selectedIndices.length > 1
                  ? "Переселить всех"
                  : "Переселить"}
              </Button>
            </div>
          </>
        )}

        {view === "evict" && (
          <>
            <div className={classes.footerLeft} />
            <div className={classes.footerRight}>
              <Button backgroundcolor="#F6F7FB" color="#545873" onClick={() => setView("list")}>
                Отмена
              </Button>
              <Button
                backgroundcolor="#EF4444"
                color="#fff"
                onClick={handleEvict}
                disabled={saving || !evictReason.trim()}
              >
                {saving
                  ? "Выселение..."
                  : selectedIndices.length > 1
                  ? "Выселить всех"
                  : "Выселить"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
