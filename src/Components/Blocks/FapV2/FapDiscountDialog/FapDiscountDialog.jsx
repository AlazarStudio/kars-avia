import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "../../../Standart/Button/Button";
import FapSelect from "../FapSelect/FapSelect";
import { PERSON_CATEGORY_BADGE } from "../fapConstants";
import { DISCOUNT_ZONES, zoneMembers, buildDiscountPatch } from "../fapDiscountZones";
import { plural } from "../../../../utils/plural";
import classes from "./FapDiscountDialog.module.css";

// Акцент раздела «Проживание» — как в FapHotelPage/FapLivingPage (общего источника нет).
const LIV = "#10B981";
const QUICK_PERCENTS = [5, 10, 15];

const EMPTY_PRESETS = { infant: false, child: false };
const EMPTY_CUSTOM = { on: false, value: "" };

const clampInput = (v) => String(Math.min(100, Math.max(0, Number(v) || 0)));

// Диалог «Применить скидки»: собирает набор скидок и зону, отдаёт готовый патч
// { [index]: number|null } родителю. Ничего не хранит — состояние сбрасывается
// на каждом открытии, результат живёт только в строках отчёта.
export default function FapDiscountDialog({ open, targets = [], onClose, onApply }) {
  const [presets, setPresets] = useState(EMPTY_PRESETS);
  const [custom, setCustom] = useState(EMPTY_CUSTOM);
  const [zone, setZone] = useState("all");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setPresets(EMPTY_PRESETS);
      setCustom(EMPTY_CUSTOM);
      setZone("all");
      setSelected([]);
      setSearch("");
    }
    prevOpenRef.current = open;
  }, [open]);

  // Счётчики в подписях — по составу зоны, без учёта applicable: они называют
  // людей, а не строки, которые примут скидку. «Индивидуально» — без счётчика.
  const zoneOptions = useMemo(
    () =>
      DISCOUNT_ZONES.map((z) =>
        z.value === "custom"
          ? { value: z.value, label: z.label }
          : { value: z.value, label: `${z.label} (${zoneMembers(targets, z.value).length})` }
      ),
    [targets]
  );

  const listRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return targets
      .filter((t) => !q || (t.fullName ?? "").toLowerCase().includes(q))
      .slice()
      .sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "", "ru"));
  }, [targets, search]);

  const selectableIndices = useMemo(
    () => listRows.filter((t) => t.applicable).map((t) => t.index),
    [listRows]
  );
  const allSelected =
    selectableIndices.length > 0 && selectableIndices.every((i) => selected.includes(i));

  const patch = useMemo(
    () => buildDiscountPatch({ targets, zone, selectedIndices: selected, presets, custom }),
    [targets, zone, selected, presets, custom]
  );
  const affected = Object.keys(patch).length;

  const toggleOne = (index) =>
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((x) => x !== index) : [...prev, index]
    );

  const toggleAll = () =>
    setSelected((prev) =>
      allSelected
        ? prev.filter((i) => !selectableIndices.includes(i))
        : [...new Set([...prev, ...selectableIndices])]
    );

  // Клик по чипу и ввод в поле сами ставят галочку «Своя скидка»; снятие галочки
  // очищает поле, иначе выключенное значение осталось бы висеть на экране.
  const pickPercent = (n) => setCustom({ on: true, value: String(n) });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle
        sx={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "var(--text)",
          borderBottom: "1px solid #F1F5F9",
          pb: 2,
        }}
      >
        Применить скидки
      </DialogTitle>
      <DialogContent
        sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}
      >
        <p className={classes.hint}>
          Скидка проставится гостям выбранной зоны и сохранится в отчёте. Категорийные
          пункты возвращают свою категорию к скидке по умолчанию.
        </p>

        <div className={classes.field}>
          <span className={classes.label}>Скидки</span>

          <label className={classes.presetRow}>
            <span className={classes.selectBox}>
              <input
                type="checkbox"
                checked={presets.infant}
                onChange={(e) => setPresets((p) => ({ ...p, infant: e.target.checked }))}
              />
            </span>
            <span>Инфант — 0 ₽</span>
            <span className={classes.presetNote}>100 %, по умолчанию</span>
          </label>

          <label className={classes.presetRow}>
            <span className={classes.selectBox}>
              <input
                type="checkbox"
                checked={presets.child}
                onChange={(e) => setPresets((p) => ({ ...p, child: e.target.checked }))}
              />
            </span>
            <span>Ребёнок — 50 %</span>
            <span className={classes.presetNote}>по умолчанию</span>
          </label>

          <div className={classes.presetRow}>
            <label className={classes.presetLabel}>
              <span className={classes.selectBox}>
                <input
                  type="checkbox"
                  checked={custom.on}
                  onChange={(e) =>
                    setCustom((p) => (e.target.checked ? { ...p, on: true } : EMPTY_CUSTOM))
                  }
                />
              </span>
              <span>Своя скидка</span>
            </label>
            <span className={classes.presetSpacer} />
            <span className={classes.chips}>
              {QUICK_PERCENTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${classes.chip} ${
                    custom.on && Number(custom.value) === n && custom.value !== ""
                      ? classes.chipActive
                      : ""
                  }`}
                  onClick={() => pickPercent(n)}
                >
                  {n} %
                </button>
              ))}
            </span>
            <span className={classes.customValue}>
              <input
                type="number"
                min={0}
                max={100}
                className={classes.customInput}
                value={custom.value}
                onChange={(e) =>
                  // Кламп на вводе, как в ячейке колонки «Скидка»: иначе набранные
                  // «500» ушли бы в патч, а деньги посчитались бы по 100 %.
                  setCustom({
                    on: true,
                    value: e.target.value === "" ? "" : clampInput(e.target.value),
                  })
                }
                placeholder="—"
              />
              <span className={classes.customSuffix}>%</span>
            </span>
          </div>
        </div>

        <div className={classes.field}>
          <span className={classes.label}>Применить к</span>
          <FapSelect value={zone} onChange={setZone} options={zoneOptions} accent={LIV} />
        </div>

        {zone === "custom" && (
          <div className={classes.field}>
            <input
              className={classes.search}
              placeholder="Поиск по ФИО…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <label className={classes.selectAllLabel}>
              <input
                type="checkbox"
                checked={allSelected}
                disabled={selectableIndices.length === 0}
                onChange={toggleAll}
              />
              <span>Выбрать всех ({selectableIndices.length})</span>
            </label>
            <div className={classes.list}>
              {listRows.length === 0 ? (
                <div className={classes.empty}>Ничего не найдено</div>
              ) : (
                listRows.map((t) => {
                  const badge = PERSON_CATEGORY_BADGE[t.category] ?? PERSON_CATEGORY_BADGE.ADULT;
                  return (
                    <label
                      key={t.index}
                      className={`${classes.row} ${t.applicable ? "" : classes.rowDisabled}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(t.index)}
                        disabled={!t.applicable}
                        onChange={() => toggleOne(t.index)}
                      />
                      <span className={classes.rowName}>{t.fullName || "—"}</span>
                      <span
                        className={classes.badge}
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                      <span className={classes.rowRoom}>
                        {t.applicable
                          ? t.roomNumber || "без номера"
                          : `${t.roomNumber || "без номера"} · нет тарифа`}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        <span className={`${classes.affected} ${affected === 0 ? classes.affectedEmpty : ""}`}>
          {affected === 0
            ? "Выберите скидку и зону"
            : `Затронет ${affected} ${plural(affected, ["гостя", "гостей", "гостей"])}`}
        </span>
      </DialogContent>
      <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
        <Button backgroundcolor="#F6F7FB" color="#545873" onClick={onClose}>
          Отмена
        </Button>
        <Button
          backgroundcolor="var(--dark-blue)"
          color="#fff"
          onClick={() => onApply(patch)}
          disabled={affected === 0}
        >
          Применить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

FapDiscountDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  targets: PropTypes.arrayOf(
    PropTypes.shape({
      index: PropTypes.number.isRequired,
      fullName: PropTypes.string,
      category: PropTypes.oneOf(["ADULT", "CHILD", "INFANT"]).isRequired,
      roomNumber: PropTypes.string,
      placementKind: PropTypes.number,
      applicable: PropTypes.bool,
    })
  ),
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};
