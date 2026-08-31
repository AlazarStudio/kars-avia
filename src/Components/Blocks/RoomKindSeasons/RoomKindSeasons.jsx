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
import SeasonRowEditor from "./SeasonRowEditor.jsx";
import { apolloErrorText } from "../../../utils/apolloErrorText.js";
import {
  toDateInputValue,
  formatSeasonRange,
  formatSeasonPrice,
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

  // Сравнение с form из замыкания, а не через updater setForm: setState внутри
  // чужого updater'а — side effect, под StrictMode он выполнился бы дважды.
  const handleFormChange = (next) => {
    setErrors((prevErr) => {
      const cleared = { ...prevErr };
      for (const k of Object.keys(next)) {
        if (next[k] !== form[k]) cleared[k] = undefined;
      }
      return cleared;
    });
    setForm(next);
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
      <div className={classes.title}>Сезонные цены</div>

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

      {!loading && !error && !seasons.length && !isAdding && (
        <div className={classes.empty}>Сезоны не заданы</div>
      )}

      {seasons.map((season) =>
        editingId === season.id ? (
          <SeasonRowEditor
            key={season.id}
            form={form}
            errors={errors}
            onChange={handleFormChange}
            showAirlinePrice={showAirlinePrice}
          >
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              minwidth={"160px"}
            >
              Сохранить сезон
            </Button>
            <button
              type="button"
              className={classes.cancel}
              onClick={closeForm}
              disabled={saving}
            >
              Отмена
            </button>
          </SeasonRowEditor>
        ) : (
          <div className={classes.chip} key={season.id}>
            <div className={classes.chipMain}>
              <div className={classes.chipRange}>
                {formatSeasonRange(season.startDate, season.endDate)}
              </div>
              {season.name && (
                <div className={classes.chipName}>{season.name}</div>
              )}
            </div>

            <div className={classes.chipPrices}>
              <span className={classes.chipPrice}>
                {formatSeasonPrice(season.price)} ₽
              </span>
              {showAirlinePrice &&
                (season.priceForAirline == null ? (
                  <span
                    className={classes.warn}
                    title="Отчёт возьмёт цену по договору, без наценки"
                  >
                    АК: не задана
                  </span>
                ) : (
                  <span className={classes.chipPriceAir}>
                    АК: {formatSeasonPrice(season.priceForAirline)} ₽
                  </span>
                ))}
            </div>

            {/* Во время сохранения иконки убираем: клик по карандашу открыл бы
                форму правки, которую завершающийся handleSubmit тут же стёр бы
                через closeForm(), а два параллельных run() дерутся за один
                флаг saving. */}
            {canEdit && !saving && !isFormOpen && (
              <div className={classes.chipButtons}>
                <EditPencilIcon
                  cursor="pointer"
                  onClick={() => openEdit(season)}
                />
                <DeleteIcon
                  cursor="pointer"
                  onClick={() => handleDelete(season)}
                />
              </div>
            )}
          </div>
        )
      )}

      {canEdit && isAdding && (
        <SeasonRowEditor
          form={form}
          errors={errors}
          onChange={handleFormChange}
          showAirlinePrice={showAirlinePrice}
        >
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            minwidth={"160px"}
          >
            Добавить
          </Button>
          <button
            type="button"
            className={classes.cancel}
            onClick={closeForm}
            disabled={saving}
          >
            Отмена
          </button>
        </SeasonRowEditor>
      )}

      {/* type задаём явно: примитив Button своего type не ставит; здесь и в
          «Отмена» это простые <button>, но правило то же. */}
      {canEdit && !isFormOpen && (
        <button type="button" className={classes.addLink} onClick={openAdd}>
          + Добавить сезон
        </button>
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
