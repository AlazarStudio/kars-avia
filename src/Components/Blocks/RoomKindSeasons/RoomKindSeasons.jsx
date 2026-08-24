import { useState } from "react";
import PropTypes from "prop-types";
import classes from "./RoomKindSeasons.module.css";
import Button from "../../Standart/Button/Button";
import MUILoader from "../MUILoader/MUILoader.jsx";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";
import useRoomKindSeasons from "./useRoomKindSeasons.js";
import { apolloErrorText } from "../../../utils/apolloErrorText.js";
import {
  toDateInputValue,
  formatSeasonRange,
  validateSeasonForm,
} from "../../../utils/roomKindSeasons.js";

const RECALC_WARNING =
  "Цены пересчитаются у заявок эскадрильи, попавших в этот период. Продолжить?";

const EMPTY_FORM = {
  name: "",
  startDate: "",
  endDate: "",
  price: "",
  priceForAirline: "",
};

/**
 * Сезонные цены категории номера.
 *
 * Сезоны сохраняются СВОИМИ мутациями сразу, а не общей кнопкой сайдбара —
 * поэтому у блока свои кнопки и своё подтверждение.
 *
 * Роль гостиницы: колонки и поля «Цена для АК» нет, и при правке ключ
 * priceForAirline в input не кладётся вовсе — иначе гостиница затрёт цену,
 * выставленную диспетчером (резолвер пишет поле только при !== undefined).
 *
 * @param {string} roomKindId        категория номера; пусто — блок не рендерится
 * @param {boolean} canEdit          сайдбар в режиме правки
 * @param {boolean} showAirlinePrice показывать цену для авиакомпании
 */
function RoomKindSeasons({
  roomKindId = "",
  canEdit = false,
  showAirlinePrice = false,
}) {
  const { confirm } = useDialog();
  const { success, error: notifyError } = useToast();
  const { seasons, loading, error, refetch, saving, create, update, remove } =
    useRoomKindSeasons(roomKindId);

  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  if (!roomKindId) return null;

  const isFormOpen = isAdding || editingId !== null;

  const closeForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const openAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const openEdit = (season) => {
    setIsAdding(false);
    setEditingId(season.id);
    setForm({
      name: season.name ?? "",
      startDate: toDateInputValue(season.startDate),
      endDate: toDateInputValue(season.endDate),
      price: season.price ?? "",
      priceForAirline: season.priceForAirline ?? "",
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Как в ReportCreateSidebar: окончание не может быть раньше начала.
      if (name === "startDate" && next.endDate && next.endDate < value) {
        next.endDate = "";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async () => {
    const check = validateSeasonForm(form, seasons, editingId);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }

    const confirmed = await confirm(RECALC_WARNING);
    if (!confirmed) return;

    // Числа берём из check.values, а не парсим форму второй раз: там уже
    // разобраны десятичная запятая и разделители разрядов, и ровно тот же
    // разбор прошёл валидацию.
    const input = {
      name: form.name.trim() || null,
      startDate: form.startDate,
      endDate: form.endDate,
      price: check.values.price,
    };
    // Гостинице поле не показываем и не отправляем: при правке отсутствие
    // ключа сохраняет прежнее значение цены для АК.
    if (showAirlinePrice) {
      input.priceForAirline = check.values.priceForAirline;
    }

    try {
      if (editingId !== null) {
        await update(editingId, input);
        success("Сезон обновлён");
      } else {
        await create(input);
        success("Сезон добавлен");
      }
      closeForm();
    } catch (err) {
      notifyError(apolloErrorText(err, "Не удалось сохранить сезон"));
    }
  };

  const handleDelete = async (season) => {
    const confirmed = await confirm(RECALC_WARNING);
    if (!confirmed) return;
    try {
      await remove(season.id);
      success("Сезон удалён");
      if (editingId === season.id) closeForm();
    } catch (err) {
      notifyError(apolloErrorText(err, "Не удалось удалить сезон"));
    }
  };

  return (
    <div className={classes.block}>
      <div className={classes.head}>
        <div className={classes.title}>Сезонные цены</div>
        {/* type задаём явно: примитив Button своего type не ставит, а спредит
            пропсы на <button> — без него эффективный type=submit. */}
        {canEdit && !isFormOpen && (
          <Button type="button" onClick={openAdd} minwidth={"180px"}>
            Добавить сезон
          </Button>
        )}
      </div>

      <div className={classes.hint}>
        Сезонные цены применяются к отчётам эскадрильи. В отчёте ФАП пока
        считается базовая цена.
      </div>

      {loading && !seasons.length && <MUILoader loadSize={"28px"} />}

      {error && (
        <div className={classes.error}>
          Не удалось загрузить сезоны.{" "}
          <button
            type="button"
            className={classes.retry}
            // Повторный отказ без catch дал бы unhandled rejection в консоли:
            // ошибку показывает эта же ветка, ловить её здесь нечем.
            onClick={() => refetch().catch(() => {})}
          >
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && !seasons.length && (
        <div className={classes.empty}>Сезоны не заданы</div>
      )}

      {seasons.map((season) => (
        <div className={classes.row} key={season.id}>
          <div className={classes.rowMain}>
            <div className={classes.range}>
              {formatSeasonRange(season.startDate, season.endDate)}
            </div>
            {season.name && <div className={classes.name}>{season.name}</div>}
          </div>

          <div className={classes.price}>
            <span className={classes.priceLabel}>По договору</span>
            <span className={classes.priceValue}>{season.price}</span>
          </div>

          {showAirlinePrice && (
            <div className={classes.price}>
              <span className={classes.priceLabel}>Для АК</span>
              {season.priceForAirline == null ? (
                <span
                  className={classes.warn}
                  title="Отчёт возьмёт цену по договору, без наценки"
                >
                  не задана
                </span>
              ) : (
                <span className={classes.priceValue}>
                  {season.priceForAirline}
                </span>
              )}
            </div>
          )}

          {/* Во время сохранения иконки убираем: клик по карандашу открыл бы
              форму правки, которую завершающийся handleSubmit тут же стёр бы
              через closeForm(), а два параллельных run() дерутся за один
              флаг saving. */}
          {canEdit && !saving && (
            <div className={classes.rowButtons}>
              <EditPencilIcon cursor="pointer" onClick={() => openEdit(season)} />
              <DeleteIcon cursor="pointer" onClick={() => handleDelete(season)} />
            </div>
          )}
        </div>
      ))}

      {canEdit && isFormOpen && (
        <div className={classes.form}>
          <label className={classes.field}>
            <span className={classes.fieldTitle}>Название</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Например: Высокий сезон"
            />
          </label>

          <div className={classes.fieldRow}>
            <label className={classes.field}>
              <span className={classes.fieldTitle}>Начало</span>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
              />
              {errors.startDate && (
                <span className={classes.fieldError}>{errors.startDate}</span>
              )}
            </label>

            <label className={classes.field}>
              <span className={classes.fieldTitle}>Окончание</span>
              <input
                type="date"
                name="endDate"
                min={form.startDate}
                value={form.endDate}
                onChange={handleChange}
              />
              {errors.endDate && (
                <span className={classes.fieldError}>{errors.endDate}</span>
              )}
            </label>
          </div>

          <div className={classes.fieldRow}>
            <label className={classes.field}>
              <span className={classes.fieldTitle}>Цена по договору</span>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              {errors.price && (
                <span className={classes.fieldError}>{errors.price}</span>
              )}
            </label>

            {showAirlinePrice && (
              <label className={classes.field}>
                <span className={classes.fieldTitle}>Цена для авиакомпании</span>
                <input
                  type="number"
                  name="priceForAirline"
                  value={form.priceForAirline}
                  onChange={handleChange}
                  placeholder="Необязательно"
                />
                {errors.priceForAirline && (
                  <span className={classes.fieldError}>
                    {errors.priceForAirline}
                  </span>
                )}
              </label>
            )}
          </div>

          <div className={classes.formButtons}>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              minwidth={"160px"}
            >
              {editingId ? "Сохранить сезон" : "Добавить"}
            </Button>
            <button
              type="button"
              className={classes.cancel}
              onClick={closeForm}
              disabled={saving}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

RoomKindSeasons.propTypes = {
  roomKindId: PropTypes.string,
  canEdit: PropTypes.bool,
  showAirlinePrice: PropTypes.bool,
};

export default RoomKindSeasons;
