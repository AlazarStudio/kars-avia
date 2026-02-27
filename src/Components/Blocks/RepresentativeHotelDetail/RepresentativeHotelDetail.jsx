import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import classes from "./RepresentativeHotelDetail.module.css";
import MUITextField from "../../Blocks/MUITextField/MUITextField";
import EditIcon from "../../../shared/icons/EditIcon";
import Button from "../../Standart/Button/Button";
import AddRepresentativeBooking from "../AddRepresentativeBooking/AddRepresentativeBooking";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import {
  REMOVE_PASSENGER_REQUEST_HOTEL_PERSON,
  GET_PASSENGER_REQUEST,
  getCookie,
} from "../../../../graphQL_requests.js";

export function HotelDetailToolbar({ searchQuery, onSearchChange, onAddBooking, onGenerateReport, className }) {
  return (
    <div className={className ? `${className} ${classes.headerRow}` : classes.headerRow}>
      <MUITextField
        className={classes.searchField}
        label="Поиск"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div className={classes.actionsWrap}>
        {/* <button type="button" className={classes.headerBtn}>
          <EditIcon /> Редактировать
        </button> */}
        {/* <button type="button" className={classes.headerBtn} onClick={onGenerateReport}>
          <img src="/plus.png" alt="" style={{ width: "15px", objectFit: "contain", filter: "invert(100%)" }} />
          Сформировать отчет
        </button> */}
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

      <div className={classes.tableCard}>
        <div className={classes.tableWrap}>
          <div className={classes.tableHead}>
            <div>ID</div>
            <div>Дата/время заезда</div>
            <div>Дата/время выезда</div>
            <div style={{ textAlign: "center" }}>Номер комнаты</div>
            <div style={{ textAlign: "center" }}>ФИО</div>
            <div />
          </div>
          {bookings.map((row, index) => (
            <div key={index} className={classes.tableRow}>
              <div>{index + 1}</div>
              <div>—</div>
              <div>—</div>
              <div style={{ textAlign: "center" }}>{row.roomNumber ?? "—"}</div>
              <div style={{ textAlign: "center" }}>{row.fullName ?? "—"}</div>
              <div className={classes.cellActions}>
                <button
                  type="button"
                  onClick={() => setEditingPersonIndex(index)}
                  className={classes.editBtn}
                  aria-label="Редактировать бронь"
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

      <div className={classes.footerRow}>
        <span className={classes.passengerCount}>{bookings.length} пассажира</span>
        <Button>Сформировать заявку</Button>
      </div>
    </section>
  );
}
