import React from "react";
import classes from "./FapManifestFiles.module.css";
import FileDownIcon from "../../../../shared/icons/FileDownIcon";
import FapOverflowMenu from "../FapOverflowMenu/FapOverflowMenu";
import { manifestFilesNewestFirst } from "../fapManifestFiles";
import { downloadManifestXlsx, hasManifestRoster } from "../fapManifestBuild";
import { formatDate, formatDateTime } from "../fapConstants";
import { getMediaUrl } from "../../../../../graphQL_requests";

// Подпись файла: «Манифест · 02.09.2026 14:31». Дата из каталога /YYYY/MM/DD/
// времени не несёт — тогда печатаем только дату, а без даты вовсе — «Манифест».
const fileLabel = (file) => {
  if (!file.uploadedAt) return "Манифест";
  const stamp = file.hasTime
    ? formatDateTime(file.uploadedAt)
    : formatDate(file.uploadedAt);
  return `Манифест · ${stamp}`;
};

// getMediaUrl уже дописывает ?token=, но домен бэка чужой — атрибут download на
// нём не сработает. Открываем новую вкладку, имя файла проставит сервер.
const openFile = (path) =>
  window.open(getMediaUrl(path), "_blank", "noopener");

// Чип «Манифест» в шапке заявки: скачивание исходного файла манифеста.
// Файл берётся из `request.files` как есть; чужие вложения отсеиваются. У старых
// заявок файла нет вовсе (сохранять его начали 02.09) — тогда собираем ведомость
// из реестра заявки.
export default function FapManifestFiles({ request }) {
  const manifests = manifestFilesNewestFirst(request?.files);

  const chip = ({ onClick, title, badge }) => (
    <button
      type="button"
      className={classes.btn}
      onClick={onClick}
      title={title}
    >
      <span className={classes.icon}>
        <FileDownIcon size={16} strokeWidth={2} />
      </span>
      <span className={classes.label}>Манифест</span>
      {badge > 1 && <span className={classes.badge}>{badge}</span>}
    </button>
  );

  if (manifests.length === 0) {
    if (!hasManifestRoster(request)) return null;
    return chip({
      onClick: () => downloadManifestXlsx(request),
      title: "Собрать манифест из реестра — файл этой заявки не сохранялся",
    });
  }

  if (manifests.length === 1) {
    return chip({
      onClick: () => openFile(manifests[0].path),
      title: fileLabel(manifests[0]),
    });
  }

  // Повторный импорт кладёт в заявку ещё один файл — показываем все, новые сверху.
  return (
    <FapOverflowMenu
      items={manifests.map((file) => ({
        label: fileLabel(file),
        icon: FileDownIcon,
        onClick: () => openFile(file.path),
      }))}
      trigger={({ toggle }) =>
        chip({
          onClick: toggle,
          title: "Манифесты заявки",
          badge: manifests.length,
        })
      }
    />
  );
}
