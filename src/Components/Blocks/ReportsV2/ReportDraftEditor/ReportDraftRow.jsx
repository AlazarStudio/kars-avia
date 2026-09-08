import PropTypes from "prop-types";
import classes from "./ReportDraftTable.module.css";
import RestoreIcon from "../../../../shared/icons/RestoreIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import FapSelect from "../../FapV2/FapSelect/FapSelect";
import { rowHasWarning, rowNeedsDays, rowNeedsPrice } from "../reportDraftRows";
import {
  formatDays,
  formatMoney,
  getArrivalHighlight,
  getDepartureHighlight,
  livingCostTooltip,
  splitDateTime,
  reportDateToInputValue,
  inputValueToReportDate,
  describeShareSegments,
  listCohabitants,
  editableValue,
} from "./reportDraftEditorUtils";

// Одна строка таблицы черновика. Чисто UI: получает уже готовую строку и
// колбэки, всю логику (что такое "правлено", что сохранять) решает вызывающий
// код (ReportDraftEditor/useReportDraft).
//
// Набор колонок повторяет печатную форму реестра, но с 05.09.2026 почти все
// поля правятся прямо в контексте отчёта (требование заказчика: черновик
// настраивается гибко, данных системы правки не меняют). Не правятся только
// «Стоимость проживания» (производная), «Итоговая стоимость» (производная),
// «Гостиница» и структурный «Вид проживания» (его считает бэк из подселений).
//
// Отступления от печатной формы, все намеренные:
//  - первой стоит колонка «заморозки»: галочка фиксирует строку целиком —
//    пересоздание черновика её не тронет (требование заказчика);
//  - ФИО закреплено по горизонтали: таблица шире экрана, и без закреплённого
//    имени при прокрутке вправо непонятно, чья это строка;
//  - «Цена/сут.» в форме нет вовсе — это поле редактора;
//  - «Гостиница» стоит ПЕРЕД «Стоимостью проживания» (просьба заказчика),
//    в файле выгрузки она остаётся последней.
export default function ReportDraftRow({
  row,
  number,
  isEdited,
  fieldEdited,
  snapshotValue,
  editableFields,
  positions,
  roomMates,
  onCellChange,
  onCellFocus,
  onCellBlur,
  onResetRow,
  onRequestDelete,
  cluster,
  clusterHighlighted,
  onHoverCluster,
  rules,
  canEdit = true,
}) {
  // Пока курсор в любом поле строки, строка держится в выборке, даже если
  // перестала подходить под фильтр (см. useEditingPins). Без этого строка без
  // цены исчезает из «Предупреждений» на первой же введённой цифре.
  const cellFocusProps = {
    onFocus: () => onCellFocus?.(row._uid),
    onBlur: () => onCellBlur?.(row._uid),
  };
  const needsDays = rowNeedsDays(row);
  const needsPrice = rowNeedsPrice(row);
  const hasWarning = rowHasWarning(row);
  const personLabel = row.personName || "без имени";

  const arrival = splitDateTime(row.arrival);
  const departure = splitDateTime(row.departure);
  // rules === null — «действующие пороги ещё не приехали» (см.
  // ReportDraftEditor): подсветки нет вовсе. Красить по дефолтам, пока порог
  // может быть переопределён, значит показать заведомо неверную границу и
  // перекрасить строку после ответа.
  const arrivalHighlight = rules
    ? getArrivalHighlight(row.arrival, rules)
    : { highlighted: false };
  const departureHighlight = rules
    ? getDepartureHighlight(row.departure, rules)
    : { highlighted: false };

  // Ячейка изменилась при пересоздании (серверный changedKeys). Подсветка
  // живёт на самом ПОЛЕ (рамка и заливка инпута / плашка у значения), а не
  // фоном под ячейкой: закрашенный угол ячейки читался как артефакт вёрстки.
  // Отдельно от editedDot: точка — «правил я сейчас», янтарное поле —
  // «изменилось при пересборке».
  const chg = (key) =>
    Array.isArray(row.changedKeys) && row.changedKeys.includes(key);

  // Классы инпута: базовый + янтарный «изменилось при пересборке» + доп.
  const inputCls = (base, key, extra = "") =>
    [base, chg(key) ? classes.inputChanged : "", extra]
      .filter(Boolean)
      .join(" ");
  // Обёртка значения без инпута: янтарная плашка вместо фона ячейки.
  const valCls = (key) => (chg(key) ? classes.valueChanged : undefined);

  // «Что было» у поля и куда его откатывать: несохранённая правка — к
  // последнему сохранённому значению («Было»), сохранённая правка/пересборка
  // (янтарное поле) — к расчёту сервера («Расчёт», серверный changedFrom).
  const changedFromMap = new Map(
    (Array.isArray(row.changedFrom) ? row.changedFrom : []).map((e) => [e.key, e.value])
  );
  const prevInfo = (key) => {
    if (fieldEdited(row, key)) {
      return { value: snapshotValue?.(row._uid, key), label: "Было" };
    }
    if (chg(key) && changedFromMap.has(key)) {
      return { value: changedFromMap.get(key), label: "Расчёт" };
    }
    return null;
  };
  const fmtPrev = (v) =>
    v === null || v === undefined || v === "" ? "пусто" : String(v);

  // Подсказка на самом поле: наведи — увидишь прежнее значение.
  const wrapTitle = (key) => {
    const prev = canEdit ? prevInfo(key) : null;
    return prev ? { title: `${prev.label}: ${fmtPrev(prev.value)}` } : {};
  };

  const livingCost = Number(row.totalLivingCost) || 0;

  // Структурные данные о подселении (shareSegments) вместо разбора текстового
  // shareNote: из них видно и кто сосед, и в какие именно интервалы.
  const cohabitants = listCohabitants(row.shareSegments);
  const shareSegments = describeShareSegments(row.shareSegments);
  const shareTitle =
    shareSegments.length > 0
      ? shareSegments
          .map((s) => `${s.period}: ${s.alone ? "жил один" : `с ${s.names.join(", ")}`}`)
          .join("\n")
      : row.shareNote || undefined;

  const frozen = Boolean(row.frozen);

  // Поле правится, если правится черновик И поле включено личной настройкой
  // (шестерёнка). Без настройки (null/undefined) редактируется всё.
  const may = (field) => canEdit && (!editableFields || editableFields.has(field));

  const rowClassName = [
    classes.row,
    // Предупреждение важнее заморозки (нет цены — нет суммы), заморозка
    // важнее пометки правки: правка у замороженной и так видна по точкам.
    hasWarning
      ? classes.rowWarning
      : frozen
        ? classes.rowFrozen
        : isEdited
          ? classes.rowEdited
          : "",
    // Строки в группе совместного проживания подсвечены ВСЕГДА (слабый тон,
    // не перебивает предупреждение/заморозку/правку — см. порядок в CSS)…
    cluster ? classes.rowInCluster : "",
    // …а наведение на «вид проживания» усиливает свою группу.
    clusterHighlighted ? classes.rowClusterMatch : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Текстовое поле в одну строку: ФИО, даты, категория, комната, должность.
  const textInput = (field, value, { label, extra, title } = {}) => (
    <input
      type="text"
      name={field}
      className={inputCls(classes.inputText, field, extra)}
      value={value ?? ""}
      title={title}
      aria-label={`${label} — ${personLabel}`}
      onChange={(e) => onCellChange(row._uid, field, e.target.value)}
      {...cellFocusProps}
    />
  );

  // Целочисленное поле счётчика питания.
  const countInput = (field, label) => (
    <input
      type="number"
      name={field}
      inputMode="numeric"
      step={1}
      min={0}
      className={inputCls(classes.inputCount, field)}
      value={editableValue(row[field])}
      placeholder="0"
      aria-label={`${label} — ${personLabel}`}
      onChange={(e) => onCellChange(row._uid, field, e.target.value)}
      {...cellFocusProps}
    />
  );

  // Хвост поля: точка «правил я сейчас» + кнопка отката ИМЕННО этого поля
  // (появляется при наведении на поле, если есть куда откатывать).
  // onMouseDown с preventDefault — чтобы клик не blur-ил инпут и строка не
  // выпадала из закрепления useEditingPins до самого отката.
  const fieldTail = (field) => {
    const prev = canEdit ? prevInfo(field) : null;
    return (
      <>
        {fieldEdited(row, field) && <span className={classes.editedDot} />}
        {prev && (
          <button
            type="button"
            className={classes.fieldResetBtn}
            title={`${prev.label}: ${fmtPrev(prev.value)} — вернуть`}
            aria-label={`Вернуть «${fmtPrev(prev.value)}» — ${personLabel}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCellChange(row._uid, field, prev.value)}
          >
            {/* Та же RestoreIcon, что у «Вернуть расчёт сервера», только
                мельче; strokeWidth задан явно — глобальные 1.7 на 13px
                слипаются в пятно. */}
            <RestoreIcon width={13} height={13} color="currentColor" strokeWidth={1.4} />
          </button>
        )}
      </>
    );
  };
  const dot = fieldTail;

  return (
    <div className={rowClassName}>
      {/* Заморозка: строка целиком не меняется при пересоздании черновика.
          Галочка видна и в read-only — как состояние, без возможности снять. */}
      <div className={`${classes.colFreeze} ${classes.stickyFreeze}`}>
        <input
          type="checkbox"
          className={classes.freezeCheck}
          checked={frozen}
          disabled={!canEdit}
          title={
            frozen
              ? "Строка заморожена — пересоздание черновика её не изменит"
              : "Заморозить строку — пересоздание черновика её не изменит"
          }
          aria-label={`Заморозить строку — ${personLabel}`}
          onChange={(e) => onCellChange(row._uid, "frozen", e.target.checked)}
        />
      </div>

      <div className={`${classes.colIndex} ${classes.stickyIndex}`}>{number}</div>

      <div className={`${classes.colPassenger} ${classes.stickyPassenger}`}>
        {may("personName") ? (
          <div className={classes.fieldWrapWide} {...wrapTitle("personName")}>
            {textInput("personName", row.personName, {
              label: "ФИО",
              extra: classes.inputName,
              title: row.personName || undefined,
            })}
            {dot("personName")}
          </div>
        ) : (
          <div className={classes.personName} title={row.personName || undefined}>
            <span className={valCls("personName")}>{row.personName || "—"}</span>
          </div>
        )}
      </div>

      <div className={classes.colArrival}>
        {may("arrival") ? (
          <div className={classes.fieldWrapWide} {...wrapTitle("arrival")}>
            {/* datetime-local: календарь и время в одном поле — руками строку
                дат не набрать. Конвертация формата контракта туда-обратно —
                reportDateToInputValue / inputValueToReportDate. */}
            <input
              type="datetime-local"
              name="arrival"
              className={inputCls(
                classes.inputText,
                "arrival",
                arrivalHighlight.highlighted ? classes.inputStayWarn : ""
              )}
              value={reportDateToInputValue(row.arrival)}
              title={arrivalHighlight.title}
              aria-label={`Дата/время заезда — ${personLabel}`}
              onChange={(e) =>
                onCellChange(row._uid, "arrival", inputValueToReportDate(e.target.value))
              }
              {...cellFocusProps}
            />
            {dot("arrival")}
          </div>
        ) : (
          <span className={valCls("arrival")}>
            {arrival.date}{" "}
            <span
              className={arrivalHighlight.highlighted ? classes.stayTimeWarn : undefined}
              title={arrivalHighlight.title}
            >
              {arrival.time}
            </span>
          </span>
        )}
      </div>

      <div className={classes.colDeparture}>
        {may("departure") ? (
          <div className={classes.fieldWrapWide} {...wrapTitle("departure")}>
            <input
              type="datetime-local"
              name="departure"
              className={inputCls(
                classes.inputText,
                "departure",
                departureHighlight.highlighted ? classes.inputStayWarn : ""
              )}
              value={reportDateToInputValue(row.departure)}
              title={departureHighlight.title}
              aria-label={`Дата/время выезда — ${personLabel}`}
              onChange={(e) =>
                onCellChange(row._uid, "departure", inputValueToReportDate(e.target.value))
              }
              {...cellFocusProps}
            />
            {dot("departure")}
          </div>
        ) : (
          <span className={valCls("departure")}>
            {departure.date}{" "}
            <span
              className={departureHighlight.highlighted ? classes.stayTimeWarn : undefined}
              title={departureHighlight.title}
            >
              {departure.time}
            </span>
          </span>
        )}
      </div>

      <div className={classes.colDays}>
        <div className={classes.cellField}>
          {may("totalDays") ? (
            <div className={classes.fieldWrap} {...wrapTitle("totalDays")}>
              <input
                type="number"
                name="days"
                inputMode="decimal"
                step={0.5}
                min={0}
                className={inputCls(
                  classes.inputDays,
                  "totalDays",
                  needsDays ? classes.inputNeedsValue : ""
                )}
                value={editableValue(row.totalDays)}
                placeholder="0"
                aria-label={`Сутки проживания — ${personLabel}`}
                onChange={(e) => onCellChange(row._uid, "totalDays", e.target.value)}
                {...cellFocusProps}
              />
              {dot("totalDays")}
            </div>
          ) : (
            <span className={valCls("totalDays")}>{formatDays(row.totalDays)}</span>
          )}
          {needsDays && <span className={classes.needCaption}>нет суток</span>}
        </div>
      </div>

      <div className={classes.colCategory} title={row.category || undefined}>
        {may("category") ? (
          <div className={classes.fieldWrapWide} {...wrapTitle("category")}>
            {textInput("category", row.category, { label: "Категория номера" })}
            {dot("category")}
          </div>
        ) : (
          <span className={valCls("category")}>{row.category || "—"}</span>
        )}
      </div>

      <div className={classes.colRoom} title={row.roomName || undefined}>
        {may("roomName") ? (
          <div className={classes.fieldWrapWide} {...wrapTitle("roomName")}>
            {textInput("roomName", row.roomName, { label: "Комната" })}
            {dot("roomName")}
          </div>
        ) : (
          <span className={valCls("roomName")}>{row.roomName || "—"}</span>
        )}
      </div>

      {/* «Вид проживания» — с кем именно делили номер. Не правится напрямую.
          Два источника: серверные shareSegments (с периодами) и ТЕКУЩЕЕ
          совпадение комнат (roomMates) — после ручной смены «Комнаты» сервер
          о новом соседстве ещё не знает, поэтому при расхождении показывается
          свежее room-based «вместе с …» (требование заказчика 07.09); когда
          составы совпадают, остаётся серверный текст с периодами в подсказке. */}
      {(() => {
        const mates = Array.isArray(roomMates) ? roomMates : [];
        const sameAsServer =
          mates.length === cohabitants.length &&
          mates.every((name) => cohabitants.includes(name));
        const roomBased = mates.length > 0 && !sameAsServer;
        const shared = roomBased || cohabitants.length > 0;
        return (
          <div
            className={shared ? classes.colShareWith : classes.colShare}
            title={
              roomBased
                ? `Живут вместе — одна комната: ${mates.join(", ")}`
                : shareTitle
            }
            onMouseEnter={cluster ? () => onHoverCluster?.(row.shareClusterId) : undefined}
            onMouseLeave={cluster ? () => onHoverCluster?.(null) : undefined}
          >
            {/* Номер группы совместного проживания: одинаковый у всех жильцов
                номера. Строки в таблице стоят в порядке реестра и вперемешку,
                поэтому без метки соседей глазами не сопоставить. */}
            {cluster && (
              <span className={classes.clusterBadge} title="Группа совместного проживания">
                {cluster.number}
              </span>
            )}
            {roomBased
              ? `вместе с ${mates.join(", ")}`
              : cohabitants.length > 0
                ? `с ${cohabitants.join(", ")}`
                : "жил один"}
          </div>
        );
      })()}

      <div className={classes.colPosition} title={row.personPosition || undefined}>
        {may("personPosition") ? (
          <div className={classes.fieldWrapWide} {...wrapTitle("personPosition")}>
            {/* Должности есть в системе (справочник лётного состава) — свой
                выпадающий список вместо свободного текста. Текущее значение,
                которого нет в справочнике, добавляется в опции: иначе его
                нельзя было бы даже увидеть в списке. Фолбэк на текст — когда
                справочник не приехал. */}
            {positions && positions.length > 0 ? (
              <FapSelect
                value={row.personPosition || ""}
                onChange={(v) => onCellChange(row._uid, "personPosition", v)}
                options={
                  row.personPosition && !positions.includes(row.personPosition)
                    ? [row.personPosition, ...positions]
                    : positions
                }
                placeholder="—"
                accent="#0057C3"
                size="compact"
                className={chg("personPosition") ? classes.selectChanged : undefined}
                title={`Должность — ${personLabel}`}
              />
            ) : (
              textInput("personPosition", row.personPosition, { label: "Должность" })
            )}
            {dot("personPosition")}
          </div>
        ) : (
          <span className={valCls("personPosition")}>{row.personPosition || "—"}</span>
        )}
      </div>

      {/* Завтрак: «вкл» значит «входит в цену номера» — счётчик в этом случае
          не участвует в деньгах, и поле остаётся подписью, а не инпутом. */}
      <div className={classes.colBreakfast}>
        {row.breakfastIncludedInPrice ? (
          <span className={valCls("breakfastCount")}>вкл</span>
        ) : may("breakfastCount") ? (
          <div className={classes.fieldWrap} {...wrapTitle("breakfastCount")}>
            {countInput("breakfastCount", "Завтраки")}
            {dot("breakfastCount")}
          </div>
        ) : (
          <span className={valCls("breakfastCount")}>{row.breakfastCount ?? 0}</span>
        )}
      </div>
      <div className={classes.colLunch}>
        {may("lunchCount") ? (
          <div className={classes.fieldWrap} {...wrapTitle("lunchCount")}>
            {countInput("lunchCount", "Обеды")}
            {dot("lunchCount")}
          </div>
        ) : (
          <span className={valCls("lunchCount")}>{row.lunchCount ?? 0}</span>
        )}
      </div>
      <div className={classes.colDinner}>
        {may("dinnerCount") ? (
          <div className={classes.fieldWrap} {...wrapTitle("dinnerCount")}>
            {countInput("dinnerCount", "Ужины")}
            {dot("dinnerCount")}
          </div>
        ) : (
          <span className={valCls("dinnerCount")}>{row.dinnerCount ?? 0}</span>
        )}
      </div>

      <div className={classes.colMeal}>
        <div className={classes.cellField}>
          {may("totalMealCost") ? (
            <div className={classes.fieldWrap} {...wrapTitle("totalMealCost")}>
              <input
                type="number"
                name="mealCost"
                inputMode="decimal"
                step={1}
                min={0}
                className={inputCls(classes.inputMeal, "totalMealCost")}
                value={editableValue(row.totalMealCost)}
                placeholder="0"
                aria-label={`Стоимость питания — ${personLabel}`}
                onChange={(e) => onCellChange(row._uid, "totalMealCost", e.target.value)}
                {...cellFocusProps}
              />
              {dot("totalMealCost")}
            </div>
          ) : (
            <span className={valCls("totalMealCost")}>{formatMoney(row.totalMealCost)}</span>
          )}
        </div>
      </div>

      <div className={classes.colPrice}>
        <div className={classes.cellField}>
          {may("pricePerDay") ? (
            <div className={classes.fieldWrap} {...wrapTitle("pricePerDay")}>
              <input
                type="number"
                name="pricePerDay"
                inputMode="decimal"
                step={1}
                min={0}
                className={inputCls(
                  classes.inputPrice,
                  "pricePerDay",
                  needsPrice ? classes.inputNeedsValue : ""
                )}
                value={editableValue(row.pricePerDay)}
                placeholder="0"
                aria-label={`Цена за сутки — ${personLabel}`}
                onChange={(e) => onCellChange(row._uid, "pricePerDay", e.target.value)}
                {...cellFocusProps}
              />
              {dot("pricePerDay")}
            </div>
          ) : (
            <span className={valCls("pricePerDay")}>{formatMoney(row.pricePerDay)}</span>
          )}
          {needsPrice && <span className={classes.needCaption}>нет цены</span>}
        </div>
      </div>

      {/* «Гостиница» стоит перед стоимостью проживания (просьба заказчика).
          Не правится: имя гостиницы связывает строку с закупкой и группировкой,
          свободный текст тут разъехался бы с реестром. */}
      <div className={classes.colHotel} title={row.hotelName || undefined}>
        <span className={valCls("hotelName")}>{row.hotelName || "—"}</span>
      </div>

      <div className={classes.colLiving} title={livingCostTooltip(row, isEdited)}>
        <span
          className={[
            classes.livingValue,
            livingCost === 0 ? classes.livingZero : "",
            chg("totalLivingCost") ? classes.valueChanged : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {formatMoney(row.totalLivingCost)}
        </span>
      </div>

      <div className={classes.colTotal}>
        <span
          className={
            chg("totalDebt")
              ? `${classes.totalValue} ${classes.valueChanged}`
              : classes.totalValue
          }
        >
          {formatMoney(row.totalDebt)}
        </span>
      </div>

      <div className={classes.colActions}>
        {canEdit && (
          <div className={classes.actionsCell}>
            {isEdited && (
              <button
                type="button"
                className={`${classes.iconBtn} ${classes.revertBtn}`}
                title="Вернуть расчёт сервера"
                aria-label={`Вернуть расчёт сервера — ${personLabel}`}
                onClick={() => onResetRow(row._uid)}
              >
                <RestoreIcon width={16} height={16} color="#0057C3" cursor="pointer" />
              </button>
            )}
            <button
              type="button"
              className={`${classes.iconBtn} ${classes.deleteBtn}`}
              title="Удалить строку"
              aria-label={`Удалить строку — ${personLabel}`}
              onClick={() => onRequestDelete(row)}
            >
              {/* color="currentColor" обязателен: DeleteIcon по умолчанию зашивает
                  #545873 в stroke, и без этого перекрашивание при наведении
                  (.deleteBtn:hover в ReportDraftTable.module.css) перестало бы
                  работать. */}
              <DeleteIcon width={16} height={16} color="currentColor" cursor="pointer" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

ReportDraftRow.propTypes = {
  row: PropTypes.object.isRequired,
  number: PropTypes.number.isRequired,
  isEdited: PropTypes.bool,
  fieldEdited: PropTypes.func.isRequired,
  snapshotValue: PropTypes.func,
  editableFields: PropTypes.instanceOf(Set),
  positions: PropTypes.arrayOf(PropTypes.string),
  roomMates: PropTypes.arrayOf(PropTypes.string),
  onCellChange: PropTypes.func.isRequired,
  onCellFocus: PropTypes.func,
  onCellBlur: PropTypes.func,
  onResetRow: PropTypes.func.isRequired,
  onRequestDelete: PropTypes.func.isRequired,
  cluster: PropTypes.shape({ number: PropTypes.number }),
  clusterHighlighted: PropTypes.bool,
  onHoverCluster: PropTypes.func,
  rules: PropTypes.object,
  canEdit: PropTypes.bool,
};
