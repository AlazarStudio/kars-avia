import classes from "./HotelAboutEditor.module.css";
import MUISwitch from "../MUISwitch/MUISwitch.jsx";

// Прачечная и глажка: два переключателя + комментарий. Выключено всё и нет
// комментария — раздел в описание не пишется.
export default function AboutLaundry({ value, disabled, onChange }) {
  return (
    <section className={classes.section}>
      <div className={classes.sectionHead}>
        <span className={classes.sectionTitle}>Услуги прачечной / глажки</span>
      </div>
      {/* Неактивное состояние — затемнением контейнера, а не MUI-пропом disabled:
          так включённый и выключенный переключатели выглядят одинаково. */}
      <div className={`${classes.switches} ${disabled ? classes.rowDisabled : ""}`}>
        <MUISwitch
          label="Прачечная"
          checked={value.laundry}
          onChange={(e) => onChange({ ...value, laundry: e.target.checked })}
        />
        <MUISwitch
          label="Глажка"
          checked={value.ironing}
          onChange={(e) => onChange({ ...value, ironing: e.target.checked })}
        />
      </div>
      <label className={classes.extra}>
        <span className={classes.extraLabel}>Комментарий</span>
        <textarea
          className={classes.textarea}
          rows={2}
          value={value.extra}
          placeholder={disabled ? "" : "Например: гладильная комната на каждом этаже"}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, extra: e.target.value })}
        />
      </label>
    </section>
  );
}
