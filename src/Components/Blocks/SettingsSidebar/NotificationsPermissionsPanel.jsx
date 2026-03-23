import React, { useState, useEffect, useMemo } from "react";
import classes from "./SettingsSidebar.module.css";
import MUISwitch from "../MUISwitch/MUISwitch";

export default function NotificationsPermissionsPanel({
  notificationMenu = {},
  stateRef,
  isEditing,
}) {
  const boolOrDefault = (value, defaultValue = false) =>
    typeof value === "boolean" ? value : defaultValue;
  const channelOrDefault = (masterValue, channelValue) =>
    masterValue ? boolOrDefault(channelValue, true) : false;

  const initial = useMemo(
    () => ({
      requestCreate: boolOrDefault(notificationMenu?.requestCreate),
      emailRequestCreate: channelOrDefault(
        boolOrDefault(notificationMenu?.requestCreate),
        notificationMenu?.emailRequestCreate
      ),
      sitePushRequestCreate: channelOrDefault(
        boolOrDefault(notificationMenu?.requestCreate),
        notificationMenu?.sitePushRequestCreate
      ),
      requestDatesChange: boolOrDefault(notificationMenu?.requestDatesChange),
      emailRequestDatesChange: channelOrDefault(
        boolOrDefault(notificationMenu?.requestDatesChange),
        notificationMenu?.emailRequestDatesChange
      ),
      sitePushRequestDatesChange: channelOrDefault(
        boolOrDefault(notificationMenu?.requestDatesChange),
        notificationMenu?.sitePushRequestDatesChange
      ),
      requestPlacementChange: boolOrDefault(notificationMenu?.requestPlacementChange),
      emailRequestPlacementChange: channelOrDefault(
        boolOrDefault(notificationMenu?.requestPlacementChange),
        notificationMenu?.emailRequestPlacementChange
      ),
      sitePushRequestPlacementChange: channelOrDefault(
        boolOrDefault(notificationMenu?.requestPlacementChange),
        notificationMenu?.sitePushRequestPlacementChange
      ),
      requestCancel: boolOrDefault(notificationMenu?.requestCancel),
      emailRequestCancel: channelOrDefault(
        boolOrDefault(notificationMenu?.requestCancel),
        notificationMenu?.emailRequestCancel
      ),
      sitePushRequestCancel: channelOrDefault(
        boolOrDefault(notificationMenu?.requestCancel),
        notificationMenu?.sitePushRequestCancel
      ),
      reserveCreate: boolOrDefault(notificationMenu?.reserveCreate),
      emailReserveCreate: channelOrDefault(
        boolOrDefault(notificationMenu?.reserveCreate),
        notificationMenu?.emailReserveCreate
      ),
      sitePushReserveCreate: channelOrDefault(
        boolOrDefault(notificationMenu?.reserveCreate),
        notificationMenu?.sitePushReserveCreate
      ),
      reserveDatesChange: boolOrDefault(notificationMenu?.reserveDatesChange),
      emailReserveDatesChange: channelOrDefault(
        boolOrDefault(notificationMenu?.reserveDatesChange),
        notificationMenu?.emailReserveDatesChange
      ),
      sitePushReserveDatesChange: channelOrDefault(
        boolOrDefault(notificationMenu?.reserveDatesChange),
        notificationMenu?.sitePushReserveDatesChange
      ),
      reserveUpdate: boolOrDefault(notificationMenu?.reserveUpdate),
      emailReserveUpdate: channelOrDefault(
        boolOrDefault(notificationMenu?.reserveUpdate),
        notificationMenu?.emailReserveUpdate
      ),
      sitePushReserveUpdate: channelOrDefault(
        boolOrDefault(notificationMenu?.reserveUpdate),
        notificationMenu?.sitePushReserveUpdate
      ),
      reservePlacementChange: boolOrDefault(notificationMenu?.reservePlacementChange),
      emailReservePlacementChange: channelOrDefault(
        boolOrDefault(notificationMenu?.reservePlacementChange),
        notificationMenu?.emailReservePlacementChange
      ),
      sitePushReservePlacementChange: channelOrDefault(
        boolOrDefault(notificationMenu?.reservePlacementChange),
        notificationMenu?.sitePushReservePlacementChange
      ),
      newMessage: boolOrDefault(notificationMenu?.newMessage),
      emailNewMessage: channelOrDefault(
        boolOrDefault(notificationMenu?.newMessage),
        notificationMenu?.emailNewMessage
      ),
      sitePushNewMessage: channelOrDefault(
        boolOrDefault(notificationMenu?.newMessage),
        notificationMenu?.sitePushNewMessage
      ),
    }),
    [notificationMenu]
  );

  const [state, setState] = useState(initial);

  useEffect(() => setState(initial), [initial]);

  useEffect(() => {
    if (stateRef) stateRef.current = state;
  }, [state, stateRef]);

  const set = (key, value) => setState((s) => ({ ...s, [key]: value }));

  return (
    <div className={classes.accessPanel}>
      <div className={classes.notificationsGrid}>
        {/* Заявки */}
        <SectionCard title="Заявки">
          <NotificationRow
            label="Создание заявки"
            checked={state.requestCreate}
            emailChecked={state.emailRequestCreate}
            sitePushChecked={state.sitePushRequestCreate}
            onChange={(v) => set("requestCreate", v)}
            onEmailChange={(v) => set("emailRequestCreate", v)}
            onSitePushChange={(v) => set("sitePushRequestCreate", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.requestCreate}
          />
          <NotificationRow
            label="Изменение дат заявки"
            checked={state.requestDatesChange}
            emailChecked={state.emailRequestDatesChange}
            sitePushChecked={state.sitePushRequestDatesChange}
            onChange={(v) => set("requestDatesChange", v)}
            onEmailChange={(v) => set("emailRequestDatesChange", v)}
            onSitePushChange={(v) => set("sitePushRequestDatesChange", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.requestDatesChange}
          />
          <NotificationRow
            label="Смена размещения заявки"
            checked={state.requestPlacementChange}
            emailChecked={state.emailRequestPlacementChange}
            sitePushChecked={state.sitePushRequestPlacementChange}
            onChange={(v) => set("requestPlacementChange", v)}
            onEmailChange={(v) => set("emailRequestPlacementChange", v)}
            onSitePushChange={(v) => set("sitePushRequestPlacementChange", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.requestPlacementChange}
          />
          <NotificationRow
            label="Отмена заявки"
            checked={state.requestCancel}
            emailChecked={state.emailRequestCancel}
            sitePushChecked={state.sitePushRequestCancel}
            onChange={(v) => set("requestCancel", v)}
            onEmailChange={(v) => set("emailRequestCancel", v)}
            onSitePushChange={(v) => set("sitePushRequestCancel", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.requestCancel}
          />
        </SectionCard>

        {/* ФАП */}
        <SectionCard title="ФАП">
          <NotificationRow
            label="Создание"
            checked={state.reserveCreate}
            emailChecked={state.emailReserveCreate}
            sitePushChecked={state.sitePushReserveCreate}
            onChange={(v) => set("reserveCreate", v)}
            onEmailChange={(v) => set("emailReserveCreate", v)}
            onSitePushChange={(v) => set("sitePushReserveCreate", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.reserveCreate}
          />
          <NotificationRow
            label="Запрос на изменение дат"
            checked={state.reserveDatesChange}
            emailChecked={state.emailReserveDatesChange}
            sitePushChecked={state.sitePushReserveDatesChange}
            onChange={(v) => set("reserveDatesChange", v)}
            onEmailChange={(v) => set("emailReserveDatesChange", v)}
            onSitePushChange={(v) => set("sitePushReserveDatesChange", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.reserveDatesChange}
          />
          <NotificationRow
            label="Обновление"
            checked={state.reserveUpdate}
            emailChecked={state.emailReserveUpdate}
            sitePushChecked={state.sitePushReserveUpdate}
            onChange={(v) => set("reserveUpdate", v)}
            onEmailChange={(v) => set("emailReserveUpdate", v)}
            onSitePushChange={(v) => set("sitePushReserveUpdate", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.reserveUpdate}
          />
          <NotificationRow
            label="Смена размещения"
            checked={state.reservePlacementChange}
            emailChecked={state.emailReservePlacementChange}
            sitePushChecked={state.sitePushReservePlacementChange}
            onChange={(v) => set("reservePlacementChange", v)}
            onEmailChange={(v) => set("emailReservePlacementChange", v)}
            onSitePushChange={(v) => set("sitePushReservePlacementChange", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.reservePlacementChange}
          />
        </SectionCard>

        {/* Сообщения */}
        <SectionCard title="Сообщения">
          <NotificationRow
            label="Новое сообщение в чате"
            checked={state.newMessage}
            emailChecked={state.emailNewMessage}
            sitePushChecked={state.sitePushNewMessage}
            onChange={(v) => set("newMessage", v)}
            onEmailChange={(v) => set("emailNewMessage", v)}
            onSitePushChange={(v) => set("sitePushNewMessage", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.newMessage}
          />
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className={classes.notificationCard}>
      <div className={classes.notificationCardTitle}>
        <span className={classes.notificationLabel}>{title}</span>
        <div className={classes.notificationChannels}>
          <span className={classes.channelLabel}>на почту</span>
          <span className={classes.channelLabel}>в браузере</span>
        </div>
      </div>
      <div className={classes.cardBody}>{children}</div>
    </div>
  );
}

function NotificationRow({
  label,
  checked,
  emailChecked,
  sitePushChecked,
  onChange,
  onEmailChange,
  onSitePushChange,
  disabled,
  channelsDisabled,
}) {
  return (
    <div
      className={`${classes.notificationRow} ${disabled ? classes.rowDisabled : ""}`}
    >
      <div className={classes.notificationRowLabel}>{label}</div>
      <div className={classes.switchColumn}>
        <MUISwitch
          label=""
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={!!disabled}
        />
      </div>
      <div className={classes.notificationRowControl}>
        <div className={classes.checkboxColumn}>
          <input
            type="checkbox"
            checked={!!emailChecked}
            onChange={(e) => onEmailChange(e.target.checked)}
            disabled={!!channelsDisabled}
          />
        </div>
        <div className={classes.checkboxColumn}>
          <input
            type="checkbox"
            checked={!!sitePushChecked}
            onChange={(e) => onSitePushChange(e.target.checked)}
            disabled={!!channelsDisabled}
          />
        </div>
      </div>
    </div>
  );
}
