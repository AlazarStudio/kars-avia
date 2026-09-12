import classes from "./FapRegistryStageChip.module.css";
import { formatDateTime } from "../fapConstants";
import { registryStageLabel, registryStageDate } from "../fapRegistryStages";

// Чип стадии реестра: цвета — как у чипа стадии отчёта (FapReportStageChip).
const TONE = {
  DRAFT: classes.draft,
  SUBMITTED: classes.submitted,
  RETURNED: classes.returned,
  APPROVED: classes.approved,
};

export default function FapRegistryStageChip({ registry }) {
  const stage = registry?.stage;
  if (!stage) return null;
  const date = registryStageDate(registry);
  return (
    <span
      className={`${classes.chip} ${TONE[stage] ?? ""}`}
      title={date ? formatDateTime(date) : undefined}
      aria-label={`Стадия: ${registryStageLabel(stage)}`}
    >
      {registryStageLabel(stage)}
    </span>
  );
}
