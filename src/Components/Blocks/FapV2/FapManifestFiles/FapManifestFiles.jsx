import React from "react";
import classes from "./FapManifestFiles.module.css";
import DownloadIcon from "../../../../shared/icons/DownloadIcon";
import FapOverflowMenu from "../FapOverflowMenu/FapOverflowMenu";
import { manifestFilesNewestFirst } from "../fapManifestFiles";
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
// files — `PassengerRequest.files` как есть; чужие вложения отсеиваются.
export default function FapManifestFiles({ files }) {
  const manifests = manifestFilesNewestFirst(files);
  if (manifests.length === 0) return null;

  const chip = ({ onClick, title, badge }) => (
    <button
      type="button"
      className={classes.btn}
      onClick={onClick}
      title={title}
    >
      <span className={classes.icon}>
        <DownloadIcon />
      </span>
      <span className={classes.label}>Манифест</span>
      {badge > 1 && <span className={classes.badge}>{badge}</span>}
    </button>
  );

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
        icon: DownloadIcon,
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
