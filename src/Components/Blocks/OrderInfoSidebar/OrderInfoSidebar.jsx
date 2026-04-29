import React, { useState, useRef } from "react";
import classes from "./OrderInfoSidebar.module.css";
import { AddressField } from "../AddressField/AddressField";
import Button from "../../Standart/Button/Button";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete";
import TransferMessage from "../TransferMessage/TransferMessage";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";

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
  transferId,
  token,
  user,
  canChat = false,
  openDeleteComponent,
  setRequestId,
}) {
  const [activeTab, setActiveTab] = useState("Общая");
  const [anchorEl, setAnchorEl] = useState(null);
  const menuRef = useRef(null);

  const fallback = {
    persons: [],
    fromAddress: "",
    toAddress: "",
    orderDate: "",
    orderTime: "",
    description: "",
    baggage: "",
  };

  const info = { ...fallback, ...(data || {}) };

  const handleCancelRequestFromMenu = () => {
    setRequestId?.(data?.id);
    openDeleteComponent?.();
  };
// console.log(data);

  const disabledInputs = !canEditByStatus || !isEditing || isSaving;

  return (
    <aside className={classes.sidebar}>
      <div className={classes.card}>
        <div className={classes.cardHeader}>
          {canChat && (
            <div className={classes.tabs}>
              <div
                className={`${classes.tab} ${activeTab === "Общая" ? classes.activeTab : ""}`}
                onClick={() => setActiveTab("Общая")}
              >
                Общая
              </div>
              <div
                className={`${classes.tab} ${activeTab === "Чат" ? classes.activeTab : ""}`}
                onClick={() => setActiveTab("Чат")}
              >
                Чат
              </div>
              <div className={classes.additionalMenu}>
                {canEditByStatus && !isEditing && (
                  <AdditionalMenu
                    anchorEl={anchorEl}
                    onOpen={(e) => setAnchorEl(e.currentTarget)}
                    onClose={() => setAnchorEl(null)}
                    menuRef={menuRef}
                    onEdit={onToggleEditOrSave}
                    editLabel="Редактировать"
                    onDelete={
                      canEditByStatus ? handleCancelRequestFromMenu : undefined
                    }
                    deleteLabel="Отменить заявку"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {activeTab === "Общая" && (
          <>
            <div className={classes.cardContent}>
              <div className={classes.routeCard}>
                <div className={classes.routeMarkers}>
                  <div
                    className={`${classes.routeDot} ${classes.routeDotEmpty}`}
                  />
                  <div className={classes.routeLine} />
                  <div
                    className={`${classes.routeDot} ${classes.routeDotFilled}`}
                  />
                </div>

                <div className={classes.routeContent}>
                  <div className={classes.routeRow}>
                    {!isEditing ? (
                      <div className={classes.routeText}>
                        {info.fromAddress}
                      </div>
                    ) : (
                      <AddressField
                        placeholder="г. Черкесск, Ленина, 57Б"
                        value={formData.fromAddress}
                        onChange={(addr) =>
                          setFormData((prev) => ({
                            ...prev,
                            fromAddress: addr,
                          }))
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

              {!isEditing && (
                <div className={classes.personsSection}>
                  <div className={classes.requestDataInfo_title}>
                    Сотрудники
                  </div>
                  <div className={classes.requestDataInfo_desc}>
                    {info.persons.length > 0 &&
                      info.persons.map(
                        (person, idx) =>
                          (person.name || "") +
                          (idx < info.persons.length - 1 ? ", " : ""),
                      )}
                  </div>
                </div>
              )}

              {isEditing && (
                <div style={{ width: "100%" }}>
                  <MultiSelectAutocomplete
                    isMultiple={true}
                    dropdownWidth={"100%"}
                    label={"Выберите сотрудников авиакомпании"}
                    options={airlineStaffOptions}
                    value={airlineStaffOptions.filter((option) =>
                      formData?.personsId?.includes(option.id),
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

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Дата заказа</div>
                {!isEditing ? (
                  <div className={classes.requestDataInfo_desc}>
                    {info.orderDate || "—"}
                  </div>
                ) : (
                  <input
                    type="date"
                    name="scheduledPickupAt"
                    value={formData?.scheduledPickupAt || ""}
                    onChange={onChange}
                    disabled={disabledInputs}
                    style={{ flex: 1 }}
                  />
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Время заказа
                </div>
                {!isEditing ? (
                  <div className={classes.requestDataInfo_desc}>
                    {info.orderTime || "—"}
                  </div>
                ) : (
                  <input
                    type="time"
                    name="scheduledPickupAtTime"
                    value={formData?.scheduledPickupAtTime || ""}
                    onChange={onChange}
                    disabled={disabledInputs}
                    style={{ flex: 1 }}
                  />
                )}
              </div>

              <div className={classes.fieldGroup}>
                {/* <span className={classes.metaLabel}>Комментарий</span> */}
                <span
                  className={classes.requestDataInfo_title}
                  style={{ width: "100%" }}
                >
                  Комментарий
                </span>
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

              <div className={classes.fieldGroup}>
                <span
                  className={classes.requestDataInfo_title}
                  style={{ width: "100%" }}
                >
                  Информация о багаже
                </span>
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

            {canEditByStatus && isEditing && (
              <div className={classes.buttonsWrapper}>
                <button
                  type="button"
                  onClick={onCancelEditing}
                  disabled={isSaving}
                  className={classes.cancelButton}
                >
                  Отмена
                </button>
                <Button
                  type="button"
                  onClick={onToggleEditOrSave}
                  backgroundcolor="#0057C3"
                  color="#fff"
                >
                  Сохранить <img src="/saveDispatcher.png" alt="" />
                </Button>
              </div>
            )}
          </>
        )}

        {activeTab === "Чат" && canChat && (
          <TransferMessage
            transferId={transferId}
            token={token}
            user={user}
            chatHeight="calc(100vh - 234px)"
          />
        )}
      </div>
    </aside>
  );
}

export default OrderInfoSidebar;
