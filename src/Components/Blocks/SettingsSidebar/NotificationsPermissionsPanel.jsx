import React, { useState, useEffect, useMemo } from "react";
import classes from "./SettingsSidebar.module.css";
import MUISwitch from "../MUISwitch/MUISwitch";
import {
  NOTIFICATION_SECTIONS,
  NOTIFICATION_MASTER_KEYS,
  emailKey,
  sitePushKey,
} from "./notificationSections";

const EMPTY_MENU = {};

export default function NotificationsPermissionsPanel({
  notificationMenu = EMPTY_MENU,
  stateRef,
  isEditing,
}) {
  const boolOrDefault = (value, defaultValue = false) =>
    typeof value === "boolean" ? value : defaultValue;
  // канал считается включённым, если мастер включён, а сам канал в данных не задан
  const channelOrDefault = (masterValue, channelValue) =>
    masterValue ? boolOrDefault(channelValue, true) : false;

  const initial = useMemo(() => {
    const next = {};
    for (const master of NOTIFICATION_MASTER_KEYS) {
      const masterValue = boolOrDefault(notificationMenu?.[master]);
      next[master] = masterValue;
      next[emailKey(master)] = channelOrDefault(
        masterValue,
        notificationMenu?.[emailKey(master)],
      );
      next[sitePushKey(master)] = channelOrDefault(
        masterValue,
        notificationMenu?.[sitePushKey(master)],
      );
    }
    return next;
  }, [notificationMenu]);

  const [state, setState] = useState(initial);

  useEffect(() => setState(initial), [initial]);

  useEffect(() => {
    if (stateRef) stateRef.current = state;
  }, [state, stateRef]);

  const set = (key, value) => setState((s) => ({ ...s, [key]: value }));

  const allEnabled = Object.values(state).every((v) => v);

  const enableAll = () =>
    setState((s) => Object.fromEntries(Object.keys(s).map((k) => [k, true])));

  const disableAll = () =>
    setState((s) => Object.fromEntries(Object.keys(s).map((k) => [k, false])));

  return (
    <div className={classes.accessPanel}>
      {isEditing && (
        <button
          className={classes.enableAllBtn}
          onClick={allEnabled ? disableAll : enableAll}
        >
          {allEnabled ? "Выключить всё" : "Включить всё"}
        </button>
      )}
      <div className={classes.notificationsGrid}>
        {NOTIFICATION_SECTIONS.map((section) => (
          <SectionCard key={section.key} title={section.title} classes={classes}>
            {section.rows.map((row) => (
              <NotificationRow
                key={row.key}
                classes={classes}
                label={row.label}
                checked={state[row.key]}
                emailChecked={state[emailKey(row.key)]}
                sitePushChecked={state[sitePushKey(row.key)]}
                onChange={(v) => set(row.key, v)}
                onEmailChange={(v) => set(emailKey(row.key), v)}
                onSitePushChange={(v) => set(sitePushKey(row.key), v)}
                disabled={!isEditing}
                channelsDisabled={!isEditing || !state[row.key]}
              />
            ))}
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ title, children, classes }) {
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
  classes,
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
