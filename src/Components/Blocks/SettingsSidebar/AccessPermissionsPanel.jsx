import React, { useState, useEffect, useMemo } from "react";
import classes from "./SettingsSidebar.module.css";
import MUISwitch from "../MUISwitch/MUISwitch";
import { ACCESS_SECTIONS, defaultSectionKeys } from "./accessSections";

const EMPTY_MENU = {};

export default function AccessPermissionsPanel({
  accessMenu = EMPTY_MENU,
  stateRef,
  isEditing,
  type = "dispatcher",
  // Есть ли право «Управление доступами» у ТОГО, КТО СЕЙЧАС ПРАВИТ. Считает
  // вызывающая сторона: панель получает accessMenu редактируемого отдела или
  // должности, а не свой собственный.
  canManageAccess = false,
}) {
  const b = (v) => !!v;

  const initial = useMemo(
    () => ({
      squadron: {
        access: b(accessMenu?.requestMenu),
        create: b(accessMenu?.requestCreate),
        chat: b(accessMenu?.requestChat),
        edit: b(accessMenu?.requestUpdate),
      },
      transfer: {
        access: b(accessMenu?.transferMenu),
        create: b(accessMenu?.transferCreate),
        edit: b(accessMenu?.transferUpdate),
        chat: b(accessMenu?.transferChat),
      },
      passengers: {
        access: b(accessMenu?.reserveMenu),
        create: b(accessMenu?.reserveCreate),
        edit: b(accessMenu?.reserveUpdate),
        editCompleted: b(accessMenu?.reserveUpdateCompleted),
      },
      users: {
        access: b(accessMenu?.userMenu),
        add: b(accessMenu?.userCreate),
        edit: b(accessMenu?.userUpdate),
        // Строится всегда, даже когда её не рисуем: buildAccessPayload пишет все
        // ключи, а accessMenu: { set } заменяет composite целиком.
        manageAccess: b(accessMenu?.accessManage),
      },
      employees: {
        access: b(accessMenu?.personalMenu),
        add: b(accessMenu?.personalCreate),
        edit: b(accessMenu?.personalUpdate),
      },
      contracts: {
        access: b(accessMenu?.contracts),
        create: b(accessMenu?.contractCreate),
        edit: b(accessMenu?.contractUpdate),
      },
      analytics: {
        access: b(accessMenu?.analyticsMenu),
        export: b(accessMenu?.analyticsUpload),
      },
      aboutAirlines: {
        access: b(accessMenu?.airlineMenu),
        edit: b(accessMenu?.airlineUpdate),
      },
      reports: {
        access: b(accessMenu?.reportMenu),
        create: b(accessMenu?.reportCreate),
        delete: b(accessMenu?.reportDelete),
      },
      organization: {
        access: b(accessMenu?.organizationMenu),
        create: b(accessMenu?.organizationCreate),
        edit: b(accessMenu?.organizationUpdate),
        addDrivers: b(accessMenu?.organizationAddDrivers),
        acceptDrivers: b(accessMenu?.organizationAcceptDrivers),
      },
      travelline: {
        access: b(accessMenu?.travellineMenu),
      },
    }),
    [accessMenu],
  );

  const [state, setState] = useState(initial);

  useEffect(() => setState(initial), [initial]);

  // «Отмена» accessMenu не трогает, поэтому initial остаётся прежним и эффект
  // выше не срабатывает: панель продолжала показывать отменённые переключатели
  // до закрытия сайдбара (в базу при этом ничего не уходило). Выход из режима
  // правки возвращает сохранённые значения.
  useEffect(() => {
    if (!isEditing) setState(initial);
  }, [isEditing, initial]);

  useEffect(() => {
    if (stateRef) stateRef.current = state;
  }, [state, stateRef]);

  const visibleSectionKeys = useMemo(() => defaultSectionKeys(type), [type]);

  // Ключи, которыми «Взаимодействие с разделом» не управляет: они выдаются
  // отдельными переключателями, иначе право включалось бы вместе с обычной
  // правкой и умолчание стало бы «можно».
  const extraKeys = useMemo(() => {
    const map = {};
    for (const section of ACCESS_SECTIONS) {
      map[section.key] = new Set((section.extras || []).map((e) => e.key));
    }
    return map;
  }, []);

  const isExtra = (section, key) => !!extraKeys[section]?.has(key);

  // ⚠️⚠️ Строки, которых текущий пользователь не видит. Видимость решает, ЧТО
  // рисуем и чего касаются каскады и кнопки «всё», но НЕ то, что уходит в
  // payload: buildAccessPayload пишет все ключи, а accessMenu: { set } заменяет
  // composite целиком, поэтому пропущенный ключ молча стал бы false. Диспетчер
  // без права «Управление доступами» не должен погасить его ни «Выключить всё»,
  // ни выключением доступа к разделу.
  const isHidden = (section, key) => {
    const config = ACCESS_SECTIONS.find((s) => s.key === section);
    const extra = (config?.extras || []).find((e) => e.key === key);
    return !!extra?.requiresAccessManage && !canManageAccess;
  };

  const visibleExtras = (config) =>
    (config?.extras || []).filter((extra) => !isHidden(config.key, extra.key));

  // доступ к разделу с каскадом: выключение гасит все действия
  const setAccess = (section, value) =>
    setState((s) => ({
      ...s,
      [section]: Object.fromEntries(
        Object.keys(s[section]).map((k) => [
          k,
          k === "access"
            ? value
            : isHidden(section, k)
              ? s[section][k]
              : value
                ? s[section][k]
                : false,
        ]),
      ),
    }));

  const setInteraction = (section, value) =>
    setState((s) => ({
      ...s,
      [section]: {
        ...s[section],
        ...Object.fromEntries(
          Object.keys(s[section])
            .filter((k) => k !== "access" && !isExtra(section, k))
            .map((k) => [k, value]),
        ),
      },
    }));

  const interactChecked = (section) =>
    Object.entries(state[section])
      .filter(([k]) => k !== "access" && !isExtra(section, k))
      .every(([, v]) => !!v);

  const allEnabled = visibleSectionKeys.every((key) =>
    Object.entries(state[key] || {})
      .filter(([k]) => !isHidden(key, k))
      .every(([, v]) => v),
  );

  // Кнопки «всё» не трогают невидимые строки: иначе диспетчер, нажав «Выключить
  // всё», снял бы accessManage, которого он даже не видит.
  const setAllVisible = (value) =>
    setState((s) =>
      Object.fromEntries(
        Object.keys(s).map((section) => [
          section,
          Object.fromEntries(
            Object.keys(s[section]).map((k) => [
              k,
              isHidden(section, k) ? s[section][k] : value,
            ]),
          ),
        ]),
      ),
    );

  const enableAll = () => setAllVisible(true);
  const disableAll = () => setAllVisible(false);

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
      <div className={classes.accessGrid}>
        {visibleSectionKeys.map((key) => {
          const config = ACCESS_SECTIONS.find((s) => s.key === key);
          if (!config || !state[key]) return null;

          return (
            <SectionCard key={key} title={config.title} classes={classes}>
              <RowSwitch
                classes={classes}
                label="Доступ к разделу"
                checked={state[key].access}
                onChange={(v) => setAccess(key, v)}
                disabled={!isEditing}
              />

              {config.rows.length > 0 && (
                <RowSwitch
                  classes={classes}
                  label="Взаимодействие с разделом"
                  checked={interactChecked(key)}
                  onChange={(v) => setInteraction(key, v)}
                  disabled={!isEditing || !state[key].access}
                />
              )}

              {visibleExtras(config).map((extra) => (
                <RowSwitch
                  key={extra.key}
                  classes={classes}
                  label={extra.label}
                  checked={state[key][extra.key]}
                  onChange={(v) =>
                    setState((s) => ({
                      ...s,
                      [key]: { ...s[key], [extra.key]: v },
                    }))
                  }
                  disabled={!isEditing || !state[key].access}
                />
              ))}
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}

function SectionCard({ title, children, classes }) {
  return (
    <div className={classes.card}>
      <div className={classes.cardTitle}>{title}</div>
      <div className={classes.cardBody}>{children}</div>
    </div>
  );
}

function RowSwitch({ label, checked, onChange, disabled, classes }) {
  return (
    <div className={`${classes.row} ${disabled ? classes.rowDisabled : ""}`}>
      <div className={classes.rowLabel}>{label}</div>
      <div className={classes.rowControl}>
        <MUISwitch
          label=""
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={!!disabled}
        />
      </div>
    </div>
  );
}
