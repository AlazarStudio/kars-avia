import React, { useState, useEffect, useMemo } from "react";
import classes from "./SettingsSidebar.module.css";
import MUISwitch from "../MUISwitch/MUISwitch";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete";

export default function AccessPermissionsPanel({
  accessMenu = {},
  stateRef,
  isEditing,
  type = "dispatcher",
  positionOptions = [],
  positionAccessMenusByPosId = {},
  setPositionAccessMenusByPosId,
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
      },
      users: {
        access: b(accessMenu?.userMenu),
        add: b(accessMenu?.userCreate),
        edit: b(accessMenu?.userUpdate),
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
      },
      organization: {
        access: b(accessMenu?.organizationMenu),
        create: b(accessMenu?.organizationCreate),
        edit: b(accessMenu?.organizationUpdate),
        addDrivers: b(accessMenu?.organizationAddDrivers),
        acceptDrivers: b(accessMenu?.organizationAcceptDrivers),
      },
    }),
    [accessMenu]
  );

  const [state, setState] = useState(initial);

  useEffect(() => setState(initial), [initial]);

  useEffect(() => {
    if (stateRef) stateRef.current = state;
  }, [state, stateRef]);

  const setAccess = (section, value) =>
    setState((s) => ({
      ...s,
      [section]: Object.fromEntries(
        Object.keys(s[section]).map((k) => [k, k === "access" ? value : (value ? s[section][k] : false)])
      ),
    }));

  const setInteraction = (section, value) =>
    setState((s) => ({
      ...s,
      [section]: {
        ...s[section],
        ...Object.fromEntries(
          Object.keys(s[section]).filter((k) => k !== "access").map((k) => [k, value])
        ),
      },
    }));

  const interactChecked = (section) =>
    Object.entries(state[section])
      .filter(([k]) => k !== "access")
      .every(([, v]) => !!v);

  const handlePositionToggle = (posId, field, value) => {
    setPositionAccessMenusByPosId((prev) => ({
      ...prev,
      [posId]: { ...prev[posId], [field]: value },
    }));
  };

  const handlePositionSelectionChange = (event, newValue) => {
    const newIds = newValue.map((o) => o.value);
    setPositionAccessMenusByPosId((prev) => {
      const next = {};
      newIds.forEach((id) => {
        next[id] = prev[id] || { requestMenu: true, transferMenu: true, personalMenu: true };
      });
      return next;
    });
  };

  const selectedPositions = positionOptions.filter((opt) =>
    Object.keys(positionAccessMenusByPosId).includes(opt.value)
  );

  // console.log(accessMenu);
  

  return (
    <div className={classes.accessPanel}>
      {/* Должности — только для авиакомпаний */}
      {type === "airline" && (
        <SectionCard title="Должности">
          <MultiSelectAutocomplete
            isDisabled={!isEditing}
            isMultiple={true}
            dropdownWidth={"100%"}
            label={"Выберите должности"}
            options={positionOptions}
            value={selectedPositions}
            onChange={handlePositionSelectionChange}
          />

          {/* Таблица доступа к разделам по должностям */}
          {selectedPositions.length > 0 && (
            <div className={classes.positionsTable}>
              <div className={classes.positionsTableHeader}>
                <div className={classes.positionCellName} />
                <div className={classes.positionCellSection}>Эскадрилья</div>
                <div className={classes.positionCellSection}>Трансфер</div>
                <div className={classes.positionCellSection}>Сотрудники</div>
              </div>
              {selectedPositions.map((opt) => {
                const access = positionAccessMenusByPosId[opt.value] || {};
                return (
                  <div key={opt.value} className={`${classes.positionRow} ${!isEditing ? classes.rowDisabled : ""}`}>
                    <div className={classes.positionCellName}>{opt.label}</div>
                    <div className={classes.positionCellSection}>
                      <MUISwitch
                        label=""
                        checked={!!access.requestMenu}
                        onChange={(e) => handlePositionToggle(opt.value, "requestMenu", e.target.checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className={classes.positionCellSection}>
                      <MUISwitch
                        label=""
                        checked={!!access.transferMenu}
                        onChange={(e) => handlePositionToggle(opt.value, "transferMenu", e.target.checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className={classes.positionCellSection}>
                      <MUISwitch
                        label=""
                        checked={!!access.personalMenu}
                        onChange={(e) => handlePositionToggle(opt.value, "personalMenu", e.target.checked)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      <div className={classes.accessGrid}>
        {/* Эскадрилья */}
        <SectionCard title="Эскадрилья">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.squadron.access}
            onChange={(v) => setAccess("squadron", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Взаимодействие с разделом"
            checked={interactChecked("squadron")}
            onChange={(v) => setInteraction("squadron", v)}
            disabled={!isEditing || !state.squadron.access}
          />
        </SectionCard>

        {/* Пассажиры */}
        <SectionCard title="ФАП">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.passengers.access}
            onChange={(v) => setAccess("passengers", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Взаимодействие с разделом"
            checked={interactChecked("passengers")}
            onChange={(v) => setInteraction("passengers", v)}
            disabled={!isEditing || !state.passengers.access}
          />
        </SectionCard>

        {/* Трансфер */}
        <SectionCard title="Трансфер">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.transfer.access}
            onChange={(v) => setAccess("transfer", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Взаимодействие с разделом"
            checked={interactChecked("transfer")}
            onChange={(v) => setInteraction("transfer", v)}
            disabled={!isEditing || !state.transfer.access}
          />
        </SectionCard>

        {/* Автопарк - только для диспетчеров */}
        {type === "dispatcher" && (
          <SectionCard title="Автопарк">
            <RowSwitch
              label="Доступ к разделу"
              checked={state.organization.access}
              onChange={(v) => setAccess("organization", v)}
              disabled={!isEditing}
            />
            <RowSwitch
              label="Взаимодействие с разделом"
              checked={interactChecked("organization")}
              onChange={(v) => setInteraction("organization", v)}
              disabled={!isEditing || !state.organization.access}
            />
          </SectionCard>
        )}

        {/* Пользователи */}
        <SectionCard title="Пользователи">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.users.access}
            onChange={(v) => setAccess("users", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Взаимодействие с разделом"
            checked={interactChecked("users")}
            onChange={(v) => setInteraction("users", v)}
            disabled={!isEditing || !state.users.access}
          />
        </SectionCard>

        {/* Сотрудники */}
        <SectionCard title="Сотрудники">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.employees.access}
            onChange={(v) => setAccess("employees", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Взаимодействие с разделом"
            checked={interactChecked("employees")}
            onChange={(v) => setInteraction("employees", v)}
            disabled={!isEditing || !state.employees.access}
          />
        </SectionCard>

        {/* Реестр договоров */}
        <SectionCard title="Реестр договоров">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.contracts.access}
            onChange={(v) => setAccess("contracts", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Взаимодействие с разделом"
            checked={interactChecked("contracts")}
            onChange={(v) => setInteraction("contracts", v)}
            disabled={!isEditing || !state.contracts.access}
          />
        </SectionCard>

        {/* Аналитика */}
        <SectionCard title="Аналитика">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.analytics.access}
            onChange={(v) => setAccess("analytics", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Взаимодействие с разделом"
            checked={interactChecked("analytics")}
            onChange={(v) => setInteraction("analytics", v)}
            disabled={!isEditing || !state.analytics.access}
          />
        </SectionCard>

        {/* Об авиакомпании */}
        <SectionCard title="Об авиакомпании">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.aboutAirlines.access}
            onChange={(v) => setAccess("aboutAirlines", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Взаимодействие с разделом"
            checked={interactChecked("aboutAirlines")}
            onChange={(v) => setInteraction("aboutAirlines", v)}
            disabled={!isEditing || !state.aboutAirlines.access}
          />
        </SectionCard>

        {/* Отчёты */}
        <SectionCard title="Отчёты">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.reports.access}
            onChange={(v) => setAccess("reports", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Взаимодействие с разделом"
            checked={interactChecked("reports")}
            onChange={(v) => setInteraction("reports", v)}
            disabled={!isEditing || !state.reports.access}
          />
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className={classes.card}>
      <div className={classes.cardTitle}>{title}</div>
      <div className={classes.cardBody}>{children}</div>
    </div>
  );
}

function RowSwitch({ label, checked, onChange, disabled }) {
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
