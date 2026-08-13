import PropTypes from "prop-types";
import classes from "./ReportsV2List.module.css";
import { convertToDate, getMediaUrl } from "../../../../../graphQL_requests";
import { DocIcon } from "../ReportsV2Icons";
import Button from "../../../Standart/Button/Button";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import DownloadReportIcon from "../../../../shared/icons/DownloadReportIcon";
import EyeIcon from "../../../../shared/icons/EyeIcon";

// Ширины полосок скелетона строки — намеренно разные, чтобы 6 строк
// загрузки не выглядели машинным повтором одного и того же прямоугольника.
const SKELETON_NAME_WIDTHS = [150, 190, 120, 170, 140, 200];

const NO_AVATAR = "/no-avatar.png";

/** Родительный падеж числительного при слове «отчёт» (1 отчёт, 2 отчёта, 5 отчётов). */
function reportsWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "отчётов";
  if (mod10 === 1) return "отчёт";
  if (mod10 >= 2 && mod10 <= 4) return "отчёта";
  return "отчётов";
}

/**
 * Таблица готовых отчётов раздела «Отчёты v2»: своя реализация вместо
 * переиспользуемого `InfoTableDataReports` (тот вёрстан под другой макет),
 * с состояниями загрузки (скелетон) и пустых списков, которых у старого
 * компонента не было. Ссылка на файл строится тем же способом, что в
 * `InfoTableDataReports.jsx`: `getMediaUrl(item.url)` — токен добавляется
 * внутри `getMediaUrl`, самостоятельно URL не собираем.
 */
export default function ReportsV2List({
  isAirline,
  items = [],
  loading = false,
  hasAnyReports = false,
  searchQuery = "",
  canCreate = false,
  onCreateClick = () => {},
  onDelete,
  draftByReport,
  onOpenReleased,
}) {
  const objectLabel = isAirline ? "Авиакомпания" : "Гостиница";

  const showEmptyNoReports = !loading && !hasAnyReports;
  const showEmptySearchMiss = !loading && hasAnyReports && items.length === 0;
  const showRows = !loading && items.length > 0;

  return (
    <div className={classes.card}>
      {/* Шапка колонок лежит ВНУТРИ области прокрутки и закреплена sticky —
          тот же приём, что в таблице редактора черновика. Если вынести её
          наружу, полоса прокрутки (8px) сузит строки, и все колонки правее
          резиновой разъедутся с заголовками. */}
      <div className={classes.scroll}>
        <div className={classes.headRow}>
          <div className={classes.colNum}>№</div>
          <div className={classes.colName}>{objectLabel}</div>
          <div className={classes.colDate}>Дата формирования</div>
          <div className={classes.colPeriod}>Период</div>
          <div className={classes.colActions} />
        </div>

        <div className={classes.body}>
          {loading &&
            SKELETON_NAME_WIDTHS.map((width, i) => (
              <div className={classes.skeletonRow} key={i}>
                <div className={classes.colNum} />
                <div className={classes.colName}>
                  <div className={classes.skeletonAvatar} />
                  <div className={classes.skeletonLine} style={{ width }} />
                </div>
                <div className={classes.colDate}>
                  <div className={classes.skeletonLine} style={{ width: 90 }} />
                </div>
                <div className={classes.colPeriod}>
                  <div className={classes.skeletonLine} style={{ width: 110 }} />
                </div>
                <div className={classes.colActions}>
                  <div className={classes.skeletonSquare} />
                  <div className={classes.skeletonSquare} />
                </div>
              </div>
            ))}

          {showEmptyNoReports && (
            <div className={classes.empty}>
              <div className={classes.emptyIcon}>
                <DocIcon size={34} />
              </div>
              <div className={classes.emptyTitle}>Отчётов пока нет</div>
              <div className={classes.emptyText}>
                Здесь появятся выпущенные отчёты. Соберите первый — по авиакомпании или по
                гостинице, за нужный период.
              </div>
              {canCreate && (
                <Button type="button" onClick={onCreateClick} minwidth={"170px"}>
                  Создать отчёт
                </Button>
              )}
            </div>
          )}

          {showEmptySearchMiss && (
            <div className={classes.empty}>
              <div className={classes.emptyIcon}>
                <DocIcon size={34} />
              </div>
              <div className={classes.emptyTitle}>Ничего не найдено</div>
              <div className={classes.emptyText}>
                По запросу «{searchQuery}» отчётов нет. Проверьте написание или очистите поиск.
              </div>
            </div>
          )}

          {showRows &&
            items.map((item, index) => {
              const name = isAirline ? item?.airline?.name : item?.hotel?.name;
              // Логотип организации — тем же способом, что в `InfoTableDataReports.jsx`:
              // путь из `images[0]` через `getMediaUrl` (он подставляет токен),
              // заглушка `/no-avatar.png`, когда логотипа нет.
              const image = isAirline ? item?.airline?.images?.[0] : item?.hotel?.images?.[0];
              return (
                <div className={classes.row} key={item.id}>
                  <div className={classes.colNum}>{index + 1}</div>
                  <div className={classes.colName}>
                    <div className={classes.avatar}>
                      <img src={getMediaUrl(image) ?? NO_AVATAR} alt="" />
                    </div>
                    <div className={classes.name} title={name || "—"}>
                      {name || "—"}
                    </div>
                  </div>
                  <div className={classes.colDate}>
                    {convertToDate(item?.createdAt)} {convertToDate(item?.createdAt, true)}
                  </div>
                  <div className={classes.colPeriod}>
                    {convertToDate(item?.startDate)} - {convertToDate(item?.endDate)}
                  </div>
                  <div className={classes.colActions}>
                    {draftByReport?.has(item.id) && (
                      <button
                        type="button"
                        className={classes.viewBtn}
                        title="Открыть на экране"
                        onClick={() => onOpenReleased(item.id)}
                      >
                        <EyeIcon size={16} color="#545873" />
                      </button>
                    )}
                    <a
                      className={classes.downloadBtn}
                      href={getMediaUrl(item.url)}
                      target="_blank"
                      rel="noreferrer"
                      title="Скачать"
                    >
                      <DownloadReportIcon />
                    </a>
                    <button
                      type="button"
                      className={classes.deleteBtn}
                      onClick={() => onDelete(item.id)}
                      title="Удалить"
                    >
                      <DeleteIcon cursor="pointer" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className={classes.footer}>
        {loading
          ? "Загрузка…"
          : items.length > 0
          ? `Всего ${items.length} ${reportsWord(items.length)}`
          : ""}
      </div>
    </div>
  );
}

ReportsV2List.propTypes = {
  isAirline: PropTypes.bool,
  items: PropTypes.array,
  loading: PropTypes.bool,
  hasAnyReports: PropTypes.bool,
  searchQuery: PropTypes.string,
  canCreate: PropTypes.bool,
  onCreateClick: PropTypes.func,
  onDelete: PropTypes.func.isRequired,
  draftByReport: PropTypes.instanceOf(Map),
  onOpenReleased: PropTypes.func,
};
