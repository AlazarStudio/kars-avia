import PropTypes from "prop-types";
import classes from "./ReportDraftHeader.module.css";
import RestoreIcon from "../../../../shared/icons/RestoreIcon";
import DownloadReportIcon from "../../../../shared/icons/DownloadReportIcon";
import { getMediaUrl } from "../../../../../graphQL_requests";

const NO_AVATAR = "/no-avatar.png";

// Строка управления редактором черновика: назад, заголовок (+ бейдж
// устаревания), действия справа. Чисто UI — вся логика (что дёргать по
// клику, какие диалоги открывать) живёт в ReportDraftEditor.
export default function ReportDraftHeader({
  title,
  logo,
  loading = false,
  isStale,
  submittedLabel,
  dirty,
  hasRows,
  recreating,
  deleting,
  saving,
  confirming,
  submitting,
  unsubmitting,
  canEdit = true,
  canSubmit = false,
  canConfirm = false,
  downloadUrl,
  onPreview,
  onRecreate,
  onDelete,
  onSave,
  onConfirm,
  onSubmit,
  onUnsubmit,
}) {
  return (
    <div className={classes.bar}>
      {/* Кнопка «назад» живёт в общем Header рядом с «Отчеты v2» — как на всех
          вложенных экранах системы. Здесь только сам черновик и действия. */}
      {/* Логотип авиакомпании — тем же способом, что в списке отчётов:
          путь из `images[0]` через getMediaUrl, заглушка при отсутствии. */}
      {logo !== undefined && (
        <div className={classes.logo}>
          <img src={getMediaUrl(logo) ?? NO_AVATAR} alt="" />
        </div>
      )}

      <div className={classes.title} title={title}>
        {title}
      </div>

      {isStale && (
        <span className={classes.staleBadge}>
          <span className={classes.staleDot} />
          устарел
        </span>
      )}

      {/* Готовая строка приходит сверху: формулировка зависит от того, чей это
          экран — диспетчера или самой авиакомпании, а роль сюда не доходит. */}
      {submittedLabel && <span className={classes.submittedBadge}>{submittedLabel}</span>}

      {/* Пока черновик грузится, показывать нечего, кроме «назад»: действия
          без данных ни на что не подействуют. */}
      {loading ? null : (
      <div className={classes.actions}>
        <button
          type="button"
          className={classes.secondaryBtn}
          disabled={!hasRows}
          onClick={onPreview}
        >
          Предпросмотр
        </button>

        {/* Выпущенный отчёт скачивается готовым файлом — на бэке он уже
            собран, редактор ему больше не нужен. */}
        {!canEdit && downloadUrl && (
          <a
            className={classes.secondaryBtn}
            href={getMediaUrl(downloadUrl)}
            target="_blank"
            rel="noreferrer"
          >
            <DownloadReportIcon />
            Скачать файл
          </a>
        )}

        {canEdit && (
          <>
            <button
              type="button"
              className={classes.secondaryBtn}
              disabled={recreating}
              onClick={onRecreate}
            >
              {/* currentColor, а не захардкоженный hex: иначе иконка не потускнеет
                  вместе с текстом в disabled и не сменит цвет при наведении. */}
              <RestoreIcon width={16} height={16} color="currentColor" cursor="pointer" />
              {recreating ? "Пересоздание…" : "Пересоздать"}
            </button>

            <button type="button" className={classes.dangerBtn} disabled={deleting} onClick={onDelete}>
              {deleting ? "Удаление…" : "Удалить"}
            </button>

            {/* Один класс на оба состояния: disabled выражается прозрачностью
                поверх родных цветов, как во всём проекте, а не подменой палитры.
                Синяя точка остаётся — это маркер несохранённых правок. */}
            <button
              type="button"
              className={classes.secondaryBtn}
              disabled={!dirty || saving}
              onClick={onSave}
            >
              {dirty && <span className={classes.saveDot} />}
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
          </>
        )}

        {/* Отзыв возвращает черновик в правку — рядом с подтверждением, но
            вторичной кнопкой: основное действие на этом экране всё-таки выпуск. */}
        {onUnsubmit && (
          <button
            type="button"
            className={classes.secondaryBtn}
            disabled={unsubmitting}
            onClick={onUnsubmit}
          >
            {unsubmitting ? "Отзыв…" : "Отозвать"}
          </button>
        )}

        {/* У черновика авиакомпании отправка заменяет подтверждение: бэк не
            даёт подтвердить AIRLINE-черновик, минуя SUBMITTED. */}
        {canSubmit && (
          <button
            type="button"
            className={classes.primaryBtn}
            disabled={!hasRows || submitting}
            onClick={onSubmit}
          >
            {submitting ? "Отправка…" : "Отправить авиакомпании"}
          </button>
        )}

        {canConfirm && (
          <button
            type="button"
            className={classes.primaryBtn}
            disabled={!hasRows || confirming}
            onClick={onConfirm}
          >
            {confirming ? "Выгрузка…" : "Подтвердить и выгрузить"}
          </button>
        )}
      </div>
      )}
    </div>
  );
}

ReportDraftHeader.propTypes = {
  title: PropTypes.string.isRequired,
  logo: PropTypes.string,
  loading: PropTypes.bool,
  isStale: PropTypes.bool,
  submittedLabel: PropTypes.string,
  dirty: PropTypes.bool,
  hasRows: PropTypes.bool,
  recreating: PropTypes.bool,
  deleting: PropTypes.bool,
  saving: PropTypes.bool,
  confirming: PropTypes.bool,
  submitting: PropTypes.bool,
  unsubmitting: PropTypes.bool,
  canEdit: PropTypes.bool,
  canSubmit: PropTypes.bool,
  canConfirm: PropTypes.bool,
  downloadUrl: PropTypes.string,
  onPreview: PropTypes.func,
  onRecreate: PropTypes.func,
  onDelete: PropTypes.func,
  onSave: PropTypes.func,
  onConfirm: PropTypes.func,
  onSubmit: PropTypes.func,
  // Отзыв показывается по наличию обработчика — как удаление в плашке
  // черновиков: отдельный флаг дублировал бы то же условие.
  onUnsubmit: PropTypes.func,
};
