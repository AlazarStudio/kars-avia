import React from "react";
import classes from "./OrderInfoSidebar.module.css";
import { AddressField } from "../AddressField/AddressField";
import Button from "../../Standart/Button/Button";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete";

function OrderInfoSidebar({
  data,
  loading,
  canEditByStatus = false,
  isEditing = false,
  isSaving = false,
  formData,
  onChange,
  setFormData,
  onToggleEditOrSave,
  onCancelEditing,
  airlineStaffOptions = [],
}) {
  const fallback = {
    name: "",
    rating: "",
    avatar: "",
    fromAddress: "",
    toAddress: "",
    orderDate: "",
    orderTime: "",
    description: "",
    baggage: "",
  };

  const info = { ...fallback, ...(data || {}) };

  const disabledInputs = !canEditByStatus || !isEditing || isSaving;

  return (
    <aside className={classes.sidebar}>
      <div className={classes.card}>
        <div className={classes.cardContent}>
          <p className={classes.title}>Информация о заявке</p>
          <div className={classes.clientBlock}>
            {!isEditing ? (
              <div className={classes.clientName}>{info.name}</div>
            ) : (
              <div style={{ width: "100%" }}>
                <MultiSelectAutocomplete
                  isMultiple={true}
                  dropdownWidth={"100%"}
                  label={"Выберите сотрудников авиакомпании"}
                  options={airlineStaffOptions}
                  value={airlineStaffOptions.filter((option) =>
                    formData?.personsId?.includes(option.id)
                  )}
                  onChange={(event, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      personsId: newValue.map((option) => option.id),
                    }));
                  }}
                  isDisabled={!canEditByStatus || !isEditing || isSaving}
                />
              </div>
            )}
          </div>
          {/* блок маршрута (верстка та же) */}
<div className={classes.routeCard}>
  {/* левая вертикальная линия + точки */}
  <div className={classes.routeMarkers}>
    <div className={`${classes.routeDot} ${classes.routeDotEmpty}`} />
    <div className={classes.routeLine} />
    <div className={`${classes.routeDot} ${classes.routeDotFilled}`} />
  </div>

  {/* правая колонка с адресами */}
  <div className={classes.routeContent}>
    <div className={classes.routeRow}>
      {!isEditing ? (
        <div className={classes.routeText}>{info.fromAddress}</div>
      ) : (
        <AddressField
          placeholder="г. Черкесск, Ленина, 57Б"
          value={formData.fromAddress}
          onChange={(addr) =>
            setFormData((prev) => ({ ...prev, fromAddress: addr }))
          }
        />
      )}
    </div>

    <div className={classes.routeDivider} />

    <div className={classes.routeRow}>
      {!isEditing ? (
        <div className={classes.routeText}>{info.toAddress}</div>
      ) : (
        <AddressField
          placeholder="г. Минеральные Воды, Ленина, 10К1"
          value={formData.toAddress}
          onChange={(addr) =>
            setFormData((prev) => ({ ...prev, toAddress: addr }))
          }
        />
      )}
    </div>
  </div>
</div>

          {/* дата заявки */}
          <div className={classes.metaRow}>
            <span className={classes.metaLabel}>Дата заказа</span>
            <span className={classes.metaValue}>
              {!isEditing ? (
                info.orderDate
              ) : (
                <input
                  type="date"
                  name="scheduledPickupAt"
                  value={formData?.scheduledPickupAt || ""}
                  onChange={onChange}
                  disabled={disabledInputs}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    font: "inherit",
                    textAlign: "right",
                  }}
                />
              )}
            </span>
          </div>
          {/* время заявки */}
          <div className={classes.metaRow}>
            <span className={classes.metaLabel}>Время заказа</span>
            <span className={classes.metaValue}>
              {!isEditing ? (
                info.orderTime
              ) : (
                <input
                  type="time"
                  name="scheduledPickupAtTime"
                  value={formData?.scheduledPickupAtTime || ""}
                  onChange={onChange}
                  disabled={disabledInputs}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    font: "inherit",
                    textAlign: "right",
                  }}
                />
              )}
            </span>
          </div>
          {/* комментарий (верстка та же: fakeInput) */}
          <div className={classes.fieldGroup}>
            <span className={classes.metaLabel}>Комментарий</span>
            <div
              className={classes.fakeInput}
              style={
                isEditing
                  ? { padding: 0, backgroundColor: "transparent" }
                  : undefined
              }
            >
              {!isEditing ? (
                info.description
              ) : (
                <textarea
                  name="description"
                  value={formData?.description || ""}
                  onChange={onChange}
                  disabled={disabledInputs}
                  style={{
                    width: "100%",
                    height: "100%",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}
            </div>
          </div>
          {/* багаж */}
          <div className={classes.fieldGroup}>
            <span className={classes.metaLabel}>Информация о багаже</span>
            <div
              className={classes.fakeInput}
              style={
                isEditing
                  ? { padding: 0, backgroundColor: "transparent" }
                  : undefined
              }
            >
              {!isEditing ? (
                info.baggage
              ) : (
                <textarea
                  name="baggage"
                  value={formData?.baggage || ""}
                  onChange={onChange}
                  disabled={disabledInputs}
                  style={{
                    width: "100%",
                    height: "100%",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* кнопки как в твоей логике */}
        {canEditByStatus && (
          <div className={classes.buttonsWrapper}>
            {isEditing && (
              <button
                type="button"
                onClick={onCancelEditing}
                disabled={isSaving}
                className={classes.cancelButton}
              >
                Отмена
              </button>
            )}
            <Button
              type="button"
              onClick={onToggleEditOrSave}
              backgroundcolor={!isEditing ? "#3CBC6726" : "#0057C3"}
              color={!isEditing ? "#3B6C54" : "#fff"}
            >
              {isEditing ? (
                <>
                  Сохранить <img src="/saveDispatcher.png" alt="" />
                </>
              ) : (
                <>
                  Изменить <img src="/editDispetcher.png" alt="" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default OrderInfoSidebar;

// import React from "react";
// import classes from "./OrderInfoSidebar.module.css";

// function OrderInfoSidebar({ data, loading }) {
//   const fallback = {
//     name: "",
//     rating: "",
//     avatar: "",
//     fromAddress: "",
//     toAddress: "",
//     orderTime: "",
//   };

//   const info = { ...fallback, ...(data || {}) };

//   return (
//     <aside className={classes.sidebar}>
//       <div className={classes.card}>
//         <p className={classes.title}>Информация о заявке</p>

//         {/* аватар + имя + рейтинг */}
//         <div className={classes.clientBlock}>
//           {/* <img
//             className={classes.clientAvatar}
//             src={info.avatar}
//             alt={info.name}
//           /> */}
//           <div className={classes.clientName}>{info.name}</div>
//           {/* <div className={classes.clientRating}>★{mock.rating}</div> */}
//         </div>

//         {/* блок маршрута */}
//         <div className={classes.routeCard}>
//           <div className={classes.routeLine} />
//           <div className={classes.routeRow}>
//             <span className={`${classes.routeDot} ${classes.routeDotEmpty}`} />
//             <span className={classes.routeText}>{info.fromAddress}</span>
//           </div>
//           <div
//             style={{
//               backgroundColor: "#E8EDF1",
//               height: "1px",
//               margin: "10px 0px",
//             }}
//           />
//           <div className={classes.routeRow}>
//             <span className={`${classes.routeDot} ${classes.routeDotFilled}`} />
//             <span className={`${classes.routeText}`}>{info.toAddress}</span>
//           </div>
//         </div>

//         {/* время заказа */}
//         <div className={classes.metaRow}>
//           <span className={classes.metaLabel}>Дата заказа</span>
//           <span className={classes.metaValue}>{info.orderDate}</span>
//         </div>

//         <div className={classes.metaRow}>
//           <span className={classes.metaLabel}>Время заказа</span>
//           <span className={classes.metaValue}>{info.orderTime}</span>
//         </div>

//         {/* комментарий */}
//         <div className={classes.fieldGroup}>
//           <span className={classes.metaLabel}>Комментарий</span>
//           <div className={classes.fakeInput}>{info.description}</div>
//           {/* <div className={classes.fakeInput} /> */}
//         </div>

//         {/* багаж */}
//         <div className={classes.fieldGroup}>
//           <span className={classes.metaLabel}>Информация о багаже</span>
//           {/* <div className={classes.fakeInput} /> */}
//           <div className={classes.fakeInput}>{info.baggage}</div>
//         </div>
//       </div>
//     </aside>
//   );
// }

// export default OrderInfoSidebar;
