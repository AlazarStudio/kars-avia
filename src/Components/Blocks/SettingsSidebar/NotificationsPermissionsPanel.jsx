import React, { useState, useEffect, useMemo } from "react";
import classes from "./SettingsSidebar.module.css";
import MUISwitch from "../MUISwitch/MUISwitch";

export default function NotificationsPermissionsPanel({
  notificationMenu = {},
  stateRef,
  isEditing,
}) {
  const b = (v) => !!v;

  const initial = useMemo(
    () => ({
      requestCreate: b(notificationMenu?.requestCreate),
      requestDatesChange: b(notificationMenu?.requestDatesChange),
      requestPlacementChange: b(notificationMenu?.requestPlacementChange),
      requestCancel: b(notificationMenu?.requestCancel),
      reserveCreate: b(notificationMenu?.reserveCreate),
      reserveDatesChange: b(notificationMenu?.reserveDatesChange),
      reserveUpdate: b(notificationMenu?.reserveUpdate),
      reservePlacementChange: b(notificationMenu?.reservePlacementChange),
      newMessage: b(notificationMenu?.newMessage),
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
            onChange={(v) => set("requestCreate", v)}
            disabled={!isEditing}
          />
          <NotificationRow
            label="Изменение дат заявки"
            checked={state.requestDatesChange}
            onChange={(v) => set("requestDatesChange", v)}
            disabled={!isEditing}
          />
          <NotificationRow
            label="Смена размещения заявки"
            checked={state.requestPlacementChange}
            onChange={(v) => set("requestPlacementChange", v)}
            disabled={!isEditing}
          />
          <NotificationRow
            label="Отмена заявки"
            checked={state.requestCancel}
            onChange={(v) => set("requestCancel", v)}
            disabled={!isEditing}
          />
        </SectionCard>

        {/* Брони */}
        <SectionCard title="Брони">
          <NotificationRow
            label="Создание брони"
            checked={state.reserveCreate}
            onChange={(v) => set("reserveCreate", v)}
            disabled={!isEditing}
          />
          <NotificationRow
            label="Запрос на изменение дат брони"
            checked={state.reserveDatesChange}
            onChange={(v) => set("reserveDatesChange", v)}
            disabled={!isEditing}
          />
          <NotificationRow
            label="Обновление брони"
            checked={state.reserveUpdate}
            onChange={(v) => set("reserveUpdate", v)}
            disabled={!isEditing}
          />
          <NotificationRow
            label="Смена размещения брони"
            checked={state.reservePlacementChange}
            onChange={(v) => set("reservePlacementChange", v)}
            disabled={!isEditing}
          />
        </SectionCard>

        {/* Сообщения */}
        <SectionCard title="Сообщения">
          <NotificationRow
            label="Новое сообщение в чате"
            checked={state.newMessage}
            onChange={(v) => set("newMessage", v)}
            disabled={!isEditing}
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

function NotificationRow({ label, checked, onChange, disabled }) {
  return (
    <div
      className={`${classes.notificationRow} ${disabled ? classes.rowDisabled : ""}`}
    >
      <div className={classes.notificationRowLabel}>{label}</div>
      <div className={classes.notificationRowControl}>
        <MUISwitch
          label=""
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={!!disabled}
        />
        <input type="checkbox" disabled={!!disabled} />
        <input type="checkbox" disabled={!!disabled} />
      </div>
    </div>
  );
}
