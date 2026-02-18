import React from "react";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
import MUILoader from "../MUILoader/MUILoader";
import { convertToDate } from "../../../../graphQL_requests";
import classes from "./ExistRequest.module.css";

function ExistRequestEditForm({
  formData,
  isEditing,
  user,
  canChangeHotel,
  selectedHotelId,
  selectedRoomId,
  selectedReserve,
  hotels,
  rooms,
  roomsLoading,
  onHotelChange,
  onRoomChange,
  onReserveChange,
  formDataExtend,
  onExtendChange,
}) {
  if (formData.status === "created" || formData.status === "opened") {
    return null;
  }

  return (
    <>
      <div className={classes.requestDataTitle}>Информация о заявке</div>
      <div className={classes.requestDataInfo}>
        <div className={classes.requestDataInfo_title}>Номер заявки</div>
        <div className={classes.requestDataInfo_desc}>
          {formData.requestNumber}
        </div>
      </div>
      <div className={classes.requestDataInfo}>
        <div className={classes.requestDataInfo_title}>Тип заявки</div>
        {/* {isEditing ? (
          <MUIAutocomplete
            dropdownWidth="60%"
            label="Тип заявки"
            options={["Квота", "Резерв"]}
            value={selectedReserve === true ? "Резерв" : "Квота"}
            onChange={(event, newValue) => {
              onReserveChange(newValue === "Резерв");
            }}
          />
        ) : (
          <div className={classes.requestDataInfo_desc}>
            {formData.reserve ? "Резерв" : "Квота"}
          </div>
        )} */}
        <div className={classes.requestDataInfo_desc}>
          {formData.reserve ? "Резерв" : "Квота"}
        </div>
      </div>
      <div className={classes.requestDataInfo}>
        <div className={classes.requestDataInfo_title}>
          {!user?.airlineId ? "Аэропорт" : "Город"}
        </div>
        <div className={classes.requestDataInfo_desc}>
          {!user?.airlineId
            ? formData?.airport
              ? `${formData.airport.code || ""} ${formData.airport.name || ""}`.trim() || formData.airport.city
              : "—"
            : formData?.airport?.city || "—"}
        </div>
      </div>
      {isEditing && canChangeHotel && !user?.airlineId ? (
        <>
          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Гостиница</div>
            <MUIAutocompleteColor
              dropdownWidth="60%"
              label="Введите гостиницу"
              options={hotels}
              getOptionLabel={(option) =>
                option
                  ? `${option.name}, город: ${option?.information?.city || "не указан"}`.trim()
                  : ""
              }
              renderOption={(optionProps, option) => {
                const cityPart = `, город: ${option?.information?.city || "не указан"}`;
                const labelText = `${option.name}${cityPart}`.trim();
                const words = labelText.split(", ");
                return (
                  <li {...optionProps} key={option.id}>
                    {words.map((word, index) => (
                      <span
                        key={index}
                        style={{
                          color: index === 0 ? "black" : "gray",
                          marginRight: 4,
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </li>
                );
              }}
              value={hotels.find((h) => h.id === selectedHotelId) || null}
              onChange={onHotelChange}
              isDisabled={!isEditing}
            />
          </div>
          {selectedHotelId && (
            <div className={classes.requestDataInfo}>
              <div className={classes.requestDataInfo_title}>Номер</div>
              {roomsLoading ? (
                <MUILoader loadSize={"20px"} />
              ) : (
                <MUIAutocompleteColor
                  dropdownWidth="60%"
                  label="Введите номер"
                  options={rooms}
                  getOptionLabel={(option) =>
                    option
                      ? `${option.name}${option.roomKind?.name ? `, ${option.roomKind.name}` : ""}`.trim()
                      : ""
                  }
                  renderOption={(optionProps, option) => {
                    const kindPart = option.roomKind?.name ? `, ${option.roomKind.name}` : "";
                    const labelText = `${option.name}${kindPart}`.trim();
                    const words = labelText.split(", ");
                    return (
                      <li {...optionProps} key={option.id}>
                        {words.map((word, index) => (
                          <span
                            key={index}
                            style={{
                              color: index === 0 ? "black" : "gray",
                              marginRight: 4,
                            }}
                          >
                            {word}
                          </span>
                        ))}
                      </li>
                    );
                  }}
                  value={rooms.find((r) => r.id === selectedRoomId) || null}
                  onChange={onRoomChange}
                  isDisabled={!isEditing}
                />
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Гостиница</div>
            <div className={classes.requestDataInfo_desc}>
              {formData.hotel?.name || "—"}
            </div>
          </div>
          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Номер комнаты</div>
            <div className={classes.requestDataInfo_desc}>
              {formData.hotelChess?.room?.name || "—"}
            </div>
          </div>
        </>
      )}
      <div className={classes.requestDataInfo}>
        <div className={classes.requestDataInfo_title}>Заезд</div>
        {isEditing && formDataExtend && onExtendChange ? (
          <div className={classes.reis_info} style={{ width: "60%" }}>
            <input
              type="date"
              name="arrivalDate"
              value={formDataExtend.arrivalDate || ""}
              onChange={onExtendChange}
              placeholder="Дата"
            />
            <input
              type="time"
              name="arrivalTime"
              value={formDataExtend.arrivalTime || ""}
              onChange={onExtendChange}
              placeholder="Время"
            />
          </div>
        ) : (
          <div className={classes.requestDataInfo_desc}>
            {convertToDate(formData.arrival)} -{" "}
            {convertToDate(formData.arrival, true)}
          </div>
        )}
      </div>
      <div className={classes.requestDataInfo}>
        <div className={classes.requestDataInfo_title}>Выезд</div>
        {isEditing && formDataExtend && onExtendChange ? (
          <div className={classes.reis_info} style={{ width: "60%" }}>
            <input
              type="date"
              name="departureDate"
              value={formDataExtend.departureDate || ""}
              onChange={onExtendChange}
              placeholder="Дата"
            />
            <input
              type="time"
              name="departureTime"
              value={formDataExtend.departureTime || ""}
              onChange={onExtendChange}
              placeholder="Время"
            />
          </div>
        ) : (
          <div className={classes.requestDataInfo_desc}>
            {convertToDate(formData.departure)} -{" "}
            {convertToDate(formData.departure, true)}
          </div>
        )}
      </div>
    </>
  );
}

export default ExistRequestEditForm;
