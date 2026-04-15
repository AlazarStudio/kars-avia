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

  const set = (section, key, value) =>
    setState((s) => ({ ...s, [section]: { ...s[section], [key]: value } }));

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
            onChange={(v) => set("squadron", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Создание заявки"
            checked={state.squadron.create}
            onChange={(v) => set("squadron", "create", v)}
            disabled={!isEditing || !state.squadron.access}
          />
          <RowSwitch
            label="Сообщение в чате заявки"
            checked={state.squadron.chat}
            onChange={(v) => set("squadron", "chat", v)}
            disabled={!isEditing || !state.squadron.access}
          />
          <RowSwitch
            label="Редактирование заявки"
            checked={state.squadron.edit}
            onChange={(v) => set("squadron", "edit", v)}
            disabled={!isEditing || !state.squadron.access}
          />
        </SectionCard>

        {/* Пассажиры */}
        <SectionCard title="ФАП">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.passengers.access}
            onChange={(v) => set("passengers", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Создание заявки"
            checked={state.passengers.create}
            onChange={(v) => set("passengers", "create", v)}
            disabled={!isEditing || !state.passengers.access}
          />
          <RowSwitch
            label="Редактирование заявки"
            checked={state.passengers.edit}
            onChange={(v) => set("passengers", "edit", v)}
            disabled={!isEditing || !state.passengers.access}
          />
        </SectionCard>

        {/* Трансфер */}
        <SectionCard title="Трансфер">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.transfer.access}
            onChange={(v) => set("transfer", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Создание заявки"
            checked={state.transfer.create}
            onChange={(v) => set("transfer", "create", v)}
            disabled={!isEditing || !state.transfer.access}
          />
          <RowSwitch
            label="Сообщение в чате заявки"
            checked={state.transfer.chat}
            onChange={(v) => set("transfer", "chat", v)}
            disabled={!isEditing || !state.transfer.access}
          />
          <RowSwitch
            label="Редактирование заявки"
            checked={state.transfer.edit}
            onChange={(v) => set("transfer", "edit", v)}
            disabled={!isEditing || !state.transfer.access}
          />
        </SectionCard>

        {/* Автопарк - только для диспетчеров */}
        {type === "dispatcher" && (
          <SectionCard title="Автопарк">
            <RowSwitch
              label="Доступ к разделу"
              checked={state.organization.access}
              onChange={(v) => set("organization", "access", v)}
              disabled={!isEditing}
            />
            <RowSwitch
              label="Создание организаций"
              checked={state.organization.create}
              onChange={(v) => set("organization", "create", v)}
              disabled={!isEditing || !state.organization.access}
            />
            <RowSwitch
              label="Редактирование организаций"
              checked={state.organization.edit}
              onChange={(v) => set("organization", "edit", v)}
              disabled={!isEditing || !state.organization.access}
            />
            <RowSwitch
              label="Добавление водителей"
              checked={state.organization.addDrivers}
              onChange={(v) => set("organization", "addDrivers", v)}
              disabled={!isEditing || !state.organization.access}
            />
            <RowSwitch
              label="Приём водителей"
              checked={state.organization.acceptDrivers}
              onChange={(v) => set("organization", "acceptDrivers", v)}
              disabled={!isEditing || !state.organization.access}
            />
          </SectionCard>
        )}

        {/* Пользователи */}
        <SectionCard title="Пользователи">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.users.access}
            onChange={(v) => set("users", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Добавление пользователей"
            checked={state.users.add}
            onChange={(v) => set("users", "add", v)}
            disabled={!isEditing || !state.users.access}
          />
          <RowSwitch
            label="Редактирование"
            checked={state.users.edit}
            onChange={(v) => set("users", "edit", v)}
            disabled={!isEditing || !state.users.access}
          />
        </SectionCard>

        {/* Сотрудники */}
        <SectionCard title="Сотрудники">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.employees.access}
            onChange={(v) => set("employees", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Добавление сотрудников"
            checked={state.employees.add}
            onChange={(v) => set("employees", "add", v)}
            disabled={!isEditing || !state.employees.access}
          />
          <RowSwitch
            label="Редактирование"
            checked={state.employees.edit}
            onChange={(v) => set("employees", "edit", v)}
            disabled={!isEditing || !state.employees.access}
          />
        </SectionCard>

        {/* Реестр договоров */}
        <SectionCard title="Реестр договоров">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.contracts.access}
            onChange={(v) => set("contracts", "access", v)}
            disabled={!isEditing}
          />
          {type === "dispatcher" &&
            <>
              <RowSwitch
                label="Создание договоров"
                checked={state.contracts.create}
                onChange={(v) => set("contracts", "create", v)}
                disabled={!isEditing || !state.contracts.access}
              />
              <RowSwitch
                label="Редактирование"
                checked={state.contracts.edit}
                onChange={(v) => set("contracts", "edit", v)}
                disabled={!isEditing || !state.contracts.access}
              />
            </>}
        </SectionCard>

        {/* Аналитика */}
        <SectionCard title="Аналитика">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.analytics.access}
            onChange={(v) => set("analytics", "access", v)}
            disabled={!isEditing}
          />
        </SectionCard>

        {/* Об авиакомпании */}
        <SectionCard title="Об авиакомпании">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.aboutAirlines.access}
            onChange={(v) => set("aboutAirlines", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Редактирование"
            checked={state.aboutAirlines.edit}
            onChange={(v) => set("aboutAirlines", "edit", v)}
            disabled={!isEditing || !state.aboutAirlines.access}
          />
        </SectionCard>

        {/* Отчёты */}
        <SectionCard title="Отчёты">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.reports.access}
            onChange={(v) => set("reports", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Создание"
            checked={state.reports.create}
            onChange={(v) => set("reports", "create", v)}
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
