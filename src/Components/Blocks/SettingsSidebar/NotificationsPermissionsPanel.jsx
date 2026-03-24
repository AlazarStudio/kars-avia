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
      passengerRequestCreate: boolOrDefault(
        notificationMenu?.passengerRequestCreate
      ),
      emailPassengerRequestCreate: channelOrDefault(
        boolOrDefault(notificationMenu?.passengerRequestCreate),
        notificationMenu?.emailPassengerRequestCreate
      ),
      sitePushPassengerRequestCreate: channelOrDefault(
        boolOrDefault(notificationMenu?.passengerRequestCreate),
        notificationMenu?.sitePushPassengerRequestCreate
      ),
      passengerRequestDatesChange: boolOrDefault(
        notificationMenu?.passengerRequestDatesChange
      ),
      emailPassengerRequestDatesChange: channelOrDefault(
        boolOrDefault(notificationMenu?.passengerRequestDatesChange),
        notificationMenu?.emailPassengerRequestDatesChange
      ),
      sitePushPassengerRequestDatesChange: channelOrDefault(
        boolOrDefault(notificationMenu?.passengerRequestDatesChange),
        notificationMenu?.sitePushPassengerRequestDatesChange
      ),
      passengerRequestUpdate: boolOrDefault(
        notificationMenu?.passengerRequestUpdate
      ),
      emailPassengerRequestUpdate: channelOrDefault(
        boolOrDefault(notificationMenu?.passengerRequestUpdate),
        notificationMenu?.emailPassengerRequestUpdate
      ),
      sitePushPassengerRequestUpdate: channelOrDefault(
        boolOrDefault(notificationMenu?.passengerRequestUpdate),
        notificationMenu?.sitePushPassengerRequestUpdate
      ),
      passengerRequestPlacementChange: boolOrDefault(
        notificationMenu?.passengerRequestPlacementChange
      ),
      emailPassengerRequestPlacementChange: channelOrDefault(
        boolOrDefault(notificationMenu?.passengerRequestPlacementChange),
        notificationMenu?.emailPassengerRequestPlacementChange
      ),
      sitePushPassengerRequestPlacementChange: channelOrDefault(
        boolOrDefault(notificationMenu?.passengerRequestPlacementChange),
        notificationMenu?.sitePushPassengerRequestPlacementChange
      ),
      passengerRequestCancel: boolOrDefault(
        notificationMenu?.passengerRequestCancel
      ),
      emailPassengerRequestCancel: channelOrDefault(
        boolOrDefault(notificationMenu?.passengerRequestCancel),
        notificationMenu?.emailPassengerRequestCancel
      ),
      sitePushPassengerRequestCancel: channelOrDefault(
        boolOrDefault(notificationMenu?.passengerRequestCancel),
        notificationMenu?.sitePushPassengerRequestCancel
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
            checked={state.passengerRequestCreate}
            emailChecked={state.emailPassengerRequestCreate}
            sitePushChecked={state.sitePushPassengerRequestCreate}
            onChange={(v) => set("passengerRequestCreate", v)}
            onEmailChange={(v) => set("emailPassengerRequestCreate", v)}
            onSitePushChange={(v) => set("sitePushPassengerRequestCreate", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.passengerRequestCreate}
          />
          <NotificationRow
            label="Запрос на изменение дат"
            checked={state.passengerRequestDatesChange}
            emailChecked={state.emailPassengerRequestDatesChange}
            sitePushChecked={state.sitePushPassengerRequestDatesChange}
            onChange={(v) => set("passengerRequestDatesChange", v)}
            onEmailChange={(v) => set("emailPassengerRequestDatesChange", v)}
            onSitePushChange={(v) =>
              set("sitePushPassengerRequestDatesChange", v)
            }
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.passengerRequestDatesChange}
          />
          <NotificationRow
            label="Обновление"
            checked={state.passengerRequestUpdate}
            emailChecked={state.emailPassengerRequestUpdate}
            sitePushChecked={state.sitePushPassengerRequestUpdate}
            onChange={(v) => set("passengerRequestUpdate", v)}
            onEmailChange={(v) => set("emailPassengerRequestUpdate", v)}
            onSitePushChange={(v) => set("sitePushPassengerRequestUpdate", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.passengerRequestUpdate}
          />
          <NotificationRow
            label="Смена размещения"
            checked={state.passengerRequestPlacementChange}
            emailChecked={state.emailPassengerRequestPlacementChange}
            sitePushChecked={state.sitePushPassengerRequestPlacementChange}
            onChange={(v) => set("passengerRequestPlacementChange", v)}
            onEmailChange={(v) =>
              set("emailPassengerRequestPlacementChange", v)
            }
            onSitePushChange={(v) =>
              set("sitePushPassengerRequestPlacementChange", v)
            }
            disabled={!isEditing}
            channelsDisabled={
              !isEditing || !state.passengerRequestPlacementChange
            }
          />
          <NotificationRow
            label="Отмена"
            checked={state.passengerRequestCancel}
            emailChecked={state.emailPassengerRequestCancel}
            sitePushChecked={state.sitePushPassengerRequestCancel}
            onChange={(v) => set("passengerRequestCancel", v)}
            onEmailChange={(v) => set("emailPassengerRequestCancel", v)}
            onSitePushChange={(v) => set("sitePushPassengerRequestCancel", v)}
            disabled={!isEditing}
            channelsDisabled={!isEditing || !state.passengerRequestCancel}
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
