import React, { useState, useMemo } from "react";
import { useMutation } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "./RepresentativeHotelDetail.module.css";
import MUITextField from "../../Blocks/MUITextField/MUITextField";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
import EditIcon from "../../../shared/icons/EditIcon";
import Button from "../../Standart/Button/Button";
import AddRepresentativeBooking from "../AddRepresentativeBooking/AddRepresentativeBooking";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import {
  REMOVE_PASSENGER_REQUEST_HOTEL_PERSON,
  RELOCATE_PASSENGER_REQUEST_HOTEL_PERSON,
  EVICT_PASSENGER_REQUEST_HOTEL_PERSON,
  GET_PASSENGER_REQUEST,
  getCookie,
  convertToDate,
} from "../../../../graphQL_requests.js";

export function HotelDetailToolbar({
  searchQuery,
  onSearchChange,
  onAddBooking,
  onGenerateReport,
  onIssueLink,
  className,
}) {
  return (
    <div className={className ? `${className} ${classes.headerRow}` : classes.headerRow}>
      <MUITextField
        className={classes.searchField}
        label="Поиск"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div className={classes.actionsWrap}>
        {onIssueLink && (
          <Button onClick={onIssueLink} type="button">
            Выдать ссылку для гостиницы
          </Button>
        )}
        <Button onClick={onGenerateReport}>Сформировать отчет</Button>
        <Button onClick={onAddBooking}>Добавить бронь</Button>
      </div>
    </div>
  );
}

export default function RepresentativeHotelDetail({
  request,
  hotel,
  hotelIndex = 0,
  onRefetch,
  addNotification,
  showAddBooking = false,
  onCloseAddBooking,
  onGenerateReport,
  onBack,
  hidePageTitle,
  hideToolbar,
  searchQuery,
  onSearchChange,
}) {
  const [internalSearch, setInternalSearch] = useState("");
  const [internalShowAddBooking, setInternalShowAddBooking] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);
  const [editingPersonIndex, setEditingPersonIndex] = useState(null);
  const [relocateModal, setRelocateModal] = useState(null);
  const [evictModal, setEvictModal] = useState(null);
  const [relocateReason, setRelocateReason] = useState("");
  const [evictReason, setEvictReason] = useState("");
  const [selectedPersonIndices, setSelectedPersonIndices] = useState([]);

  const search = searchQuery !== undefined ? searchQuery : internalSearch;
  const setSearch = onSearchChange || setInternalSearch;
  const isModalControlled = onCloseAddBooking != null;
  const modalOpenForAdd = isModalControlled ? showAddBooking : internalShowAddBooking;
  const modalOpen = modalOpenForAdd || editingPersonIndex !== null;
  const modalOnClose = () => {
    if (editingPersonIndex !== null) setEditingPersonIndex(null);
    if (isModalControlled) onCloseAddBooking?.();
    else setInternalShowAddBooking(false);
  };
  const onAddBookingClick = isModalControlled ? undefined : () => setInternalShowAddBooking(true);

  const bookings = request?.livingService?.hotels?.[hotelIndex]?.people ?? [];
  const token = getCookie("token");

  const [removeHotelPerson, { loading: removing }] = useMutation(
    REMOVE_PASSENGER_REQUEST_HOTEL_PERSON,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      refetchQueries: [
        {
          query: GET_PASSENGER_REQUEST,
          variables: { passengerRequestId: request?.id },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  const [relocatePerson, { loading: relocating }] = useMutation(
    RELOCATE_PASSENGER_REQUEST_HOTEL_PERSON,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      refetchQueries: [
        {
          query: GET_PASSENGER_REQUEST,
          variables: { passengerRequestId: request?.id },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  const [evictPerson, { loading: evicting }] = useMutation(
    EVICT_PASSENGER_REQUEST_HOTEL_PERSON,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      refetchQueries: [
        {
          query: GET_PASSENGER_REQUEST,
          variables: { passengerRequestId: request?.id },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  const plan = request?.livingService?.plan;
  const formatDateAndTime = (dateVal) => {
    if (!dateVal) return "—";
    const d = convertToDate(dateVal, false);
    const t = convertToDate(dateVal, true);
    if (!d) return "—";
    // если t уже содержит дату (DD.MM.YYYY ...), не дублируем
    const timeOnly = t && t.includes(" ") ? t.split(" ").pop() : t;
    return timeOnly ? `${d} ${timeOnly}` : d;
  };
  const checkInStr = formatDateAndTime(plan?.plannedFromAt || plan?.plannedAt);
  const checkOutStr = formatDateAndTime(plan?.plannedToAt);

  const otherHotelsWithIndex = useMemo(
    () =>
      (request?.livingService?.hotels ?? [])
        .map((h, idx) => ({ hotel: h, originalIndex: idx }))
        .filter(({ originalIndex }) => originalIndex !== hotelIndex),
    [request?.livingService?.hotels, hotelIndex]
  );

  const hotelAutocompleteOptions = useMemo(
    () =>
      otherHotelsWithIndex.map(({ hotel, originalIndex }) => ({
        label: hotel?.name ?? "—",
        originalIndex,
        hotel,
      })),
    [otherHotelsWithIndex]
  );

  const toggleSelectedIndex = (index) => {
    setSelectedPersonIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)
    );
  };

  const handleRelocate = async () => {
    if (!relocateModal || !relocateReason.trim()) {
      addNotification?.("Укажите причину переселения.", "error");
      return;
    }
    const { personIndices, toHotelIndex } = relocateModal;
    if (!personIndices?.length || toHotelIndex === undefined) return;
    try {
      for (const personIndex of [...personIndices].sort((a, b) => b - a)) {
        await relocatePerson({
          variables: {
            requestId: request.id,
            fromHotelIndex: hotelIndex,
            toHotelIndex,
            personIndex,
            reason: relocateReason.trim(),
          },
        });
      }
      addNotification?.(
        personIndices.length === 1 ? "Пассажир переселён." : `Переселено пассажиров: ${personIndices.length}.`,
        "success"
      );
      onRefetch?.();
      setRelocateModal(null);
      setRelocateReason("");
      setSelectedPersonIndices([]);
    } catch (err) {
      addNotification?.(
        err?.graphQLErrors?.[0]?.message || err?.message || "Ошибка при переселении.",
        "error"
      );
    }
  };

  const handleEvict = async () => {
    if (!evictModal || !evictReason.trim()) {
      addNotification?.("Укажите причину выселения.", "error");
      return;
    }
    const { personIndices } = evictModal;
    if (!personIndices?.length) return;
    try {
      for (const personIndex of [...personIndices].sort((a, b) => b - a)) {
        await evictPerson({
          variables: {
            requestId: request.id,
            hotelIndex,
            personIndex,
            reason: evictReason.trim(),
          },
        });
      }
      addNotification?.(
        personIndices.length === 1 ? "Пассажир выселен." : `Выселено пассажиров: ${personIndices.length}.`,
        "success"
      );
      onRefetch?.();
      setEvictModal(null);
      setEvictReason("");
      setSelectedPersonIndices([]);
    } catch (err) {
      addNotification?.(
        err?.graphQLErrors?.[0]?.message || err?.message || "Ошибка при выселении.",
        "error"
      );
    }
  };

  const handleRemoveConfirm = async (personIndex) => {
    try {
      await removeHotelPerson({
        variables: {
          requestId: request?.id,
          hotelIndex,
          personIndex,
        },
      });
      addNotification?.("Бронь удалена.", "success");
      onRefetch?.();
      setDeleteConfirmIndex(null);
    } catch (err) {
      console.error(err);
      addNotification?.(
        err?.graphQLErrors?.[0]?.message || err?.message || "Ошибка при удалении.",
        "error"
      );
      setDeleteConfirmIndex(null);
    }
  };

  return (
    <section className={classes.cardWrap}>
      {!hideToolbar && (
        <div className={classes.headerRow}>
          {!hidePageTitle && (
            <>
              <button type="button" className={classes.backButton} onClick={onBack} aria-label="Назад">
                <img src="/arrow.png" alt="" />
              </button>
              <h1 className={classes.title}>Заявка {request?.flightNumber ?? ""}</h1>
            </>
          )}
          <MUITextField
            className={classes.searchField}
            label="Поиск"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className={classes.actionsWrap}>
            {/* <button type="button" className={classes.headerBtn}>
              <EditIcon /> Редактировать
            </button> */}
            <button type="button" className={classes.headerBtn} onClick={onGenerateReport}>
              <img src="/plus.png" alt="" style={{ width: "15px", objectFit: "contain", filter: "invert(100%)" }} />
              Сформировать отчет
            </button>
            <Button onClick={onAddBookingClick}>Добавить бронь</Button>
          </div>
        </div>
      )}

      <AddRepresentativeBooking
        open={modalOpen}
        onClose={modalOnClose}
        requestId={request?.id}
        hotelIndex={hotelIndex}
        initialPerson={editingPersonIndex !== null ? bookings[editingPersonIndex] : undefined}
        personIndex={editingPersonIndex !== null ? editingPersonIndex : undefined}
        onSuccess={() => {
          onRefetch?.();
          setEditingPersonIndex(null);
        }}
        addNotification={addNotification}
      />

      {deleteConfirmIndex !== null && (
        <DeleteComponent
          remove={handleRemoveConfirm}
          index={deleteConfirmIndex}
          close={() => setDeleteConfirmIndex(null)}
          title="Вы действительно хотите удалить бронь?"
        />
      )}

      {selectedPersonIndices.length > 0 && (
        <div className={classes.selectionBar}>
          <span className={classes.selectionBarLabel}>
            Выбрано броней: {selectedPersonIndices.length} —
          </span>
          <Button
            onClick={() => {
              if (otherHotelsWithIndex.length === 0) {
                addNotification?.(
                  "Переселение недоступно: в заявке только одна гостиница. Добавьте ещё одну гостиницу, чтобы переселять пассажиров.",
                  "warning"
                );
                return;
              }
              setRelocateModal({
                personIndices: [...selectedPersonIndices],
                toHotelIndex: otherHotelsWithIndex[0]?.originalIndex,
              });
            }}
            disabled={relocating}
          >
            Переселить
          </Button>
          <Button
            onClick={() => setEvictModal({ personIndices: [...selectedPersonIndices] })}
            disabled={evicting}
          >
            Выселить
          </Button>
          <button
            type="button"
            className={classes.clearSelectionBtn}
            onClick={() => setSelectedPersonIndices([])}
          >
            Снять выбор
          </button>
        </div>
      )}

      <div className={classes.tableCard}>
        <div className={classes.tableWrap}>
          <div className={classes.tableHead}>
            <div className={classes.colCheckbox} />
            <div>ID</div>
            <div>Дата/время заезда</div>
            <div>Дата/время выезда</div>
            <div style={{ textAlign: "center" }}>Номер комнаты</div>
            <div style={{ textAlign: "center" }}>ФИО</div>
            <div />
          </div>
          {bookings.map((row, index) => (
            <div key={index} className={classes.tableRow}>
              <div className={classes.colCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedPersonIndices.includes(index)}
                  onChange={() => toggleSelectedIndex(index)}
                  aria-label="Выбрать для переселения или выселения"
                />
              </div>
              <div>{index + 1}</div>
              <div>{checkInStr}</div>
              <div>{checkOutStr}</div>
              <div style={{ textAlign: "center" }}>{row.roomNumber ?? "—"}</div>
              <div style={{ textAlign: "center" }}>{row.fullName ?? "—"}</div>
              <div className={classes.cellActions}>
                <button
                  type="button"
                  onClick={() => setEditingPersonIndex(index)}
                  className={classes.editBtn}
                  aria-label="Редактировать бронь"
                  title="Редактировать бронь"
                >
                  <img src="/edit.svg.png" alt="" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmIndex(index)}
                  disabled={removing}
                  className={classes.deleteBtn}
                  aria-label="Удалить бронь"
                >
                  <img src="/deleteReport.png" alt="Удалить" className={classes.trashIcon} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {relocateModal !== null && (
        <Dialog
          open
          onClose={() => !relocating && (setRelocateModal(null), setRelocateReason(""), setSelectedPersonIndices([])) }
          PaperProps={{ sx: { borderRadius: "15px" } }}
        >
          <DialogTitle>
            {relocateModal.personIndices?.length > 1
              ? `Переселить пассажиров (${relocateModal.personIndices.length})`
              : "Переселить пассажира"}
          </DialogTitle>
          <DialogContent>
            <p style={{ marginBottom: 8 }}>Выберите отель и укажите причину:</p>
            <MUIAutocompleteColor
              label="Отель"
              options={hotelAutocompleteOptions}
              value={hotelAutocompleteOptions.find((o) => o.originalIndex === relocateModal.toHotelIndex) ?? null}
              onChange={(e, newValue) =>
                setRelocateModal((prev) => ({
                  ...prev,
                  toHotelIndex: newValue?.originalIndex,
                }))
              }
              getOptionLabel={(option) => (option?.label != null ? option.label : "—")}
              dropdownWidth="100%"
              style={{ marginBottom: 12 }}
            />
            <textarea
              className={classes.reasonTextarea}
              placeholder="Причина"
              value={relocateReason}
              onChange={(e) => setRelocateReason(e.target.value)}
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => { setRelocateModal(null); setRelocateReason(""); setSelectedPersonIndices([]); }}
              disabled={relocating}
            >
              Отмена
            </Button>
            <Button
              onClick={handleRelocate}
              disabled={relocating || !relocateReason.trim() || relocateModal.toHotelIndex === undefined}
            >
              {relocating ? "Сохранение…" : relocateModal.personIndices?.length > 1 ? "Переселить всех" : "Переселить"}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {evictModal !== null && (
        <Dialog
          open
          onClose={() => !evicting && (setEvictModal(null), setEvictReason(""), setSelectedPersonIndices([]))}
          PaperProps={{ sx: { borderRadius: "15px" } }}
        >
          <DialogTitle>
            {evictModal.personIndices?.length > 1
              ? `Выселить пассажиров (${evictModal.personIndices.length})`
              : "Выселить пассажира"}
          </DialogTitle>
          <DialogContent>
            <p style={{ marginBottom: 8 }}>Укажите причину выселения (обязательно):</p>
            <textarea
              className={classes.reasonTextarea}
              placeholder="Причина"
              value={evictReason}
              onChange={(e) => setEvictReason(e.target.value)}
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => { setEvictModal(null); setEvictReason(""); setSelectedPersonIndices([]); }}
              disabled={evicting}
            >
              Отмена
            </Button>
            <Button
              onClick={handleEvict}
              disabled={evicting || !evictReason.trim()}
            >
              {evicting ? "Сохранение…" : evictModal.personIndices?.length > 1 ? "Выселить всех" : "Выселить"}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <div className={classes.footerRow}>
        <span className={classes.passengerCount}>{bookings.length} пассажира</span>
      </div>
    </section>
  );
}
