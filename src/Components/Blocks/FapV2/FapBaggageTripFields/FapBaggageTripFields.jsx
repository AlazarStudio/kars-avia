import React from "react";
import classes from "./FapBaggageTripFields.module.css";
import FapSelect from "../FapSelect/FapSelect";
import { VEHICLE_TYPES } from "../fapConstants";

// Сумма поездки производная: бэк пересчитывает её как сумму цен пассажиров при
// каждой записи. Считаем ровно по его правилу — пустой список даёт «нет суммы»,
// список без проставленных цен даёт 0 (в отчётности это разные состояния) —
// иначе поле расходилось бы со строками до сохранения и с сохранённым значением
// после.
//
// rows — строки пассажиров: черновик страницы (reportCost строкой) либо
// серверный driver.people (reportCost числом).
//
// Без пассажиров состояний три, и различаются они наличием суммы на сервере, а
// не отсутствием пассажиров:
//   • строки убраны, но на сервере пассажиры ещё есть — сумма после сохранения
//     очистится, показывать старую было бы обманом (достижимо только со
//     страницы: карточка передаёт сюда сам серверный список, поэтому у неё
//     «строк нет, а на сервере есть» не бывает);
//   • пассажиров нет ни в строках, ни на сервере, но сумма с сервера есть — это
//     унаследованная сумма прежней доставки. Показываем её: патч поездки
//     reportCost не принимает, менять её отсюда нечем;
//   • пассажиров нет и суммы нет — наследовать нечего, и говорить про «прежнюю
//     доставку» здесь нельзя: у только что созданной поездки ничего прежнего не
//     было.
export function deriveTripCost(rows, driver) {
  const list = rows || [];
  const hasPeople = list.length > 0;
  const serverPeople = driver?.people || [];
  const serverCost = driver?.reportCost ?? null;
  const peopleRemoved = !hasPeople && serverPeople.length > 0;
  const inheritedCost = !hasPeople && !peopleRemoved && serverCost != null;

  const sum = list.reduce((acc, row) => {
    const raw = row?.reportCost;
    if (raw === "" || raw == null) return acc;
    return acc + (Number(raw) || 0);
  }, 0);

  let value = null;
  if (hasPeople) value = Math.round(sum * 100) / 100;
  else if (inheritedCost) value = serverCost;

  // Сумму не правят ни в одном из состояний, поэтому подпись объясняет откуда
  // она взялась и что с ней делать — иначе поле читается как сломанное.
  let hint = "пассажиров нет — добавьте их и задайте цены";
  if (hasPeople) hint = "считается по пассажирам";
  else if (peopleRemoved) hint = "пассажиры убраны — сумма очистится";
  else if (inheritedCost) hint = "от прежней доставки — задайте цены пассажирам";

  return {
    value,
    text: value != null ? `${Number(value).toLocaleString("ru-RU")} ₽` : "—",
    hint,
  };
}

// Поля уровня поездки: тип ТС, сумма (только для чтения) и дата доставки.
// Один и тот же набор нужен и на карточке в списке услуги, и на странице
// поездки — владелец просил тип ТС в обоих местах, поэтому строка полей живёт
// одним компонентом, а черновики и запись — в useBaggageTripDraft.
export default function FapBaggageTripFields({
  canEdit,
  accent,
  hasReportData,
  vehicleType,
  onVehicleTypeChange,
  deliveredAt,
  onDeliveredAtChange,
  onDeliveredAtFocus,
  onDeliveredAtBlur,
  deliveredAtText,
  costText,
  costHint,
  onSave,
  saveDisabled,
  saving,
}) {
  // Без права правки (авиакомпания, а также диспетчер на завершённой или
  // отменённой услуге) показываем поля текстом, а не серыми disabled-инпутами.
  // Пустая поездка в таком виде выглядела бы строкой из прочерков — прячем блок.
  if (!canEdit) {
    if (!hasReportData) return null;
    return (
      <div className={classes.reportFields}>
        <span className={classes.reportField}>
          <span className={classes.reportFieldLabel}>Тип ТС</span>
          <span className={classes.reportValue}>{vehicleType || "—"}</span>
        </span>
        <span className={classes.reportField}>
          <span className={classes.reportFieldLabel}>Сумма</span>
          <span className={classes.reportValue}>{costText}</span>
        </span>
        <span className={classes.reportField}>
          <span className={classes.reportFieldLabel}>Дата доставки</span>
          <span className={classes.reportValue}>{deliveredAtText}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={classes.reportFields}>
      <label className={classes.reportField}>
        <span className={classes.reportFieldLabel}>Тип ТС</span>
        <FapSelect
          value={vehicleType}
          onChange={onVehicleTypeChange}
          placeholder="— тип ТС —"
          accent={accent}
          style={{ width: 170 }}
          options={[
            { value: "", label: "Не указан" },
            ...(vehicleType && !VEHICLE_TYPES.includes(vehicleType)
              ? [{ value: vehicleType, label: vehicleType }]
              : []),
            ...VEHICLE_TYPES.map((t) => ({ value: t, label: t })),
          ]}
        />
      </label>

      <span className={classes.reportField}>
        <span className={classes.reportFieldLabel}>Сумма</span>
        <span className={classes.reportValue}>{costText}</span>
        <span className={classes.reportHint}>{costHint}</span>
      </span>

      <label className={classes.reportField}>
        <span className={classes.reportFieldLabel}>Дата доставки</span>
        <input
          type="datetime-local"
          value={deliveredAt}
          onChange={(e) => onDeliveredAtChange(e.target.value)}
          onFocus={onDeliveredAtFocus}
          onBlur={onDeliveredAtBlur}
          className={classes.reportInputDate}
        />
      </label>

      <button
        type="button"
        className={classes.saveBtn}
        onClick={onSave}
        disabled={saveDisabled}
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </button>
    </div>
  );
}
