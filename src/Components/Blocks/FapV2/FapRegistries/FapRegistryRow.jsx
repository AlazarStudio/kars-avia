import classes from "./FapRegistries.module.css";
import FapRegistryStageChip from "./FapRegistryStageChip";
import { registryKindLabel } from "../fapRegistryStages";
import { convertToDate } from "../../../../../graphQL_requests";

const money = (v) => (v == null ? "—" : `${Number(v).toLocaleString("ru-RU")} ₽`);

export default function FapRegistryRow({ registry, onOpen }) {
  return (
    <div
      className={classes.row}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <span className={classes.number}>№{registry.number}</span>
      <span>{registryKindLabel(registry.kind)}</span>
      <span>{registry.airline?.name ?? "—"}</span>
      <span>{registry.airport?.city ?? "—"}</span>
      <span>
        {convertToDate(registry.periodStart)} — {convertToDate(registry.periodEnd)}
      </span>
      <span>{registry.totals?.rowsCount ?? 0}</span>
      <span>{money(registry.totals?.airlineTotal)}</span>
      <span>
        <FapRegistryStageChip registry={registry} />
      </span>
    </div>
  );
}
