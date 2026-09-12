import classes from "./FapSupplyCard.module.css";
import { formatDateTime } from "../fapConstants";
import { supplyTotal } from "../fapSupply.js";

const money = (v) => (v === "" || v == null ? "—" : `${Number(v).toLocaleString("ru-RU")} ₽`);

// Чтение факта поставки: авиакомпания и запертая заявка. Пустой факт — одна
// строка, а не сетка прочерков. showInternal — стоимость поставщику (только
// диспетчерским ролям; АК получает с бэка null).
export default function FapSupplyCardView({ service, unitLabel, showInternal }) {
  const isEmptyFact =
    !service?.suppliedAt &&
    !service?.supplier &&
    service?.quantity == null &&
    service?.unitPrice == null &&
    service?.deliveryCost == null &&
    service?.supplierCost == null;

  if (isEmptyFact) {
    return (
      <div className={classes.card}>
        <div className={classes.title}>Поставка</div>
        <div className={classes.empty}>Факт поставки не внесён</div>
      </div>
    );
  }

  return (
    <div className={classes.card}>
      <div className={classes.title}>Поставка</div>
      <div className={classes.readGrid}>
        <span className={classes.readLabel}>Поставщик</span>
        <span className={classes.readValue}>{service.supplier || "—"}</span>
        <span className={classes.readLabel}>Дата и время</span>
        <span className={classes.readValue}>{service.suppliedAt ? formatDateTime(service.suppliedAt) : "—"}</span>
        <span className={classes.readLabel}>{unitLabel}</span>
        <span className={classes.readValue}>{service.quantity ?? "—"}</span>
        <span className={classes.readLabel}>Цена за единицу (без НДС)</span>
        <span className={classes.readValue}>{money(service.unitPrice)}</span>
        <span className={classes.readLabel}>Доставка (без НДС)</span>
        <span className={classes.readValue}>{money(service.deliveryCost)}</span>
        {showInternal && (
          <>
            <span className={classes.readLabel}>Стоимость поставщику</span>
            <span className={classes.readValue}>{money(service.supplierCost)}</span>
          </>
        )}
        <span className={classes.readLabel}>Сумма для АК</span>
        <span className={classes.readValue}>{money(supplyTotal(service))}</span>
      </div>
    </div>
  );
}
