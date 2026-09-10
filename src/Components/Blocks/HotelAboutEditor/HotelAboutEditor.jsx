import { useEffect, useMemo, useRef, useState } from "react";
// Стили .ql-editor для просмотра: TextEditorOutput рисует ровно как вкладка
// «О гостинице», а сам редактор Quill из настроек гостиницы уходит.
import "react-quill/dist/quill.snow.css";
import classes from "./HotelAboutEditor.module.css";
import TextEditorOutput from "../TextEditorOutput/TextEditorOutput.jsx";
import AboutChecklist from "./AboutChecklist.jsx";
import AboutLaundry from "./AboutLaundry.jsx";
import { hasRichText } from "../../../utils/hotelDescription.js";
import {
  INFRASTRUCTURE_ITEMS,
  FACILITY_ITEMS,
  ROOM_GROUPS,
  buildHotelAboutHtml,
  parseHotelAbout,
} from "../../../utils/hotelAbout.js";

const INFRASTRUCTURE_GROUPS = [{ title: "", items: INFRASTRUCTURE_ITEMS }];
const FACILITY_GROUPS = [{ title: "", items: FACILITY_ITEMS }];

// Описание гостиницы по разделам. Хранится одним HTML в information.description:
// редактор разбирает его в галки и поля и собирает обратно (utils/hotelAbout.js).
export default function HotelAboutEditor({ description, name, location, isEditing, onChange }) {
  const [state, setState] = useState(() => parseHotelAbout(description));
  const [dirty, setDirty] = useState(false);
  // Описание, которому соответствует state: своё эхо после onChange не перечитываем,
  // иначе разбор на каждой букве сбивал бы ввод.
  const syncedRef = useRef(description);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (description === syncedRef.current) return;
    syncedRef.current = description;
    setState(parseHotelAbout(description));
    setDirty(false);
  }, [description]);

  // Сохранили — следующая сессия правки снова начинается с «нетронуто».
  useEffect(() => {
    if (!isEditing) setDirty(false);
  }, [isEditing]);

  const built = useMemo(
    () => buildHotelAboutHtml(state, { name, location }),
    [state, name, location]
  );

  // Пересобранный текст уходит в форму только после правки в редакторе:
  // нетронутое описание сохраняется байт в байт.
  useEffect(() => {
    if (!dirty) return;
    syncedRef.current = built;
    onChangeRef.current(built);
  }, [built, dirty]);

  const update = (section, value) => {
    setState((prev) => ({ ...prev, [section]: value }));
    setDirty(true);
  };

  const disabled = !isEditing;
  const previewHtml = dirty ? built : description;

  return (
    <div className={classes.layout}>
      <div className={classes.editor}>
        <section className={classes.section}>
          <MetaRow label="Название гостиницы" value={name} />
          <MetaRow label="Локация" value={location} />
        </section>

        <AboutChecklist
          title="Инфраструктура — рядом есть"
          groups={INFRASTRUCTURE_GROUPS}
          value={state.infrastructure}
          extraLabel="Уточнение"
          extraPlaceholder="Названия и расстояния: «Пятёрочка» — 200 м, аптека «Апрель»"
          disabled={disabled}
          onChange={(value) => update("infrastructure", value)}
        />
        <AboutChecklist
          title="Оснащение объекта"
          groups={FACILITY_GROUPS}
          value={state.facility}
          extraLabel="Другое"
          extraPlaceholder="Через запятую: комната отдыха, сауна с бассейном"
          disabled={disabled}
          onChange={(value) => update("facility", value)}
        />
        <AboutChecklist
          title="Оснащение номерного фонда"
          groups={ROOM_GROUPS}
          value={state.rooms}
          extraLabel="Другое"
          extraPlaceholder="Через запятую: утюг, гладильная доска"
          disabled={disabled}
          onChange={(value) => update("rooms", value)}
        />
        <AboutLaundry
          value={state.laundry}
          disabled={disabled}
          onChange={(value) => update("laundry", value)}
        />

        <section className={classes.section}>
          <div className={classes.sectionHead}>
            <span className={classes.sectionTitle}>Прочее</span>
          </div>
          <textarea
            className={classes.textarea}
            rows={3}
            value={state.other}
            placeholder={disabled ? "" : "Каждый пункт с новой строки. Например: Проживание с животными: разрешено"}
            disabled={disabled}
            onChange={(e) => update("other", e.target.value)}
          />
        </section>
      </div>

      <aside className={classes.preview}>
        <div className={classes.previewCaption}>Так увидят во вкладке «О гостинице»</div>
        {hasRichText(previewHtml) ? (
          <div className={classes.previewBody}>
            <TextEditorOutput description={previewHtml} />
          </div>
        ) : (
          <div className={classes.previewEmpty}>Описание пока пустое</div>
        )}
      </aside>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className={classes.metaRow}>
      <span className={classes.metaLabel}>{label}</span>
      <span className={classes.metaValue}>
        <span className={classes.metaText}>{value || "—"}</span>
        <span className={classes.metaHint}>из карточки</span>
      </span>
    </div>
  );
}
