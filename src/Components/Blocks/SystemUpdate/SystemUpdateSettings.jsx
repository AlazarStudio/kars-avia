import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import classes from "./SystemNotificationsSettings.module.css";
import Button from "../../Standart/Button/Button";
import MUISwitch from "../MUISwitch/MUISwitch";
import MUILoader from "../MUILoader/MUILoader";
import SystemUpdateCard from "./SystemUpdateCard";
import { useToast } from "../../../contexts/ToastContext";
import { useDialog } from "../../../contexts/DialogContext";
import systemUpdateTemplate from "../../../../scripts/systemUpdate.data.mjs";
import {
  AUDIENCE_ORDER,
  AUDIENCE_LABELS,
  SECTION_KEYS,
  SECTION_LABELS,
  SECTION_COLORS,
  audiencesArrayToState,
  stateToAudiencesArray,
  makeItem,
  countItems,
} from "./systemUpdateConstants";
import {
  SYSTEM_UPDATE,
  UPDATE_SYSTEM_UPDATE,
  convertToDate,
  getCookie,
} from "../../../../graphQL_requests";

const VERSION_RE = /^\d+\.\d+\.\d+(?:-\d+)?$/;

const emptyState = () => audiencesArrayToState([]);

function SystemUpdateSettings() {
  const token = getCookie("token");
  const { success, error: notifyError, info } = useToast();
  const { confirm: confirmDialog } = useDialog();

  const [enabled, setEnabled] = useState(false);
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [audiencesState, setAudiencesState] = useState(emptyState);
  const [activeAud, setActiveAud] = useState(AUDIENCE_ORDER[0]);

  const { loading, error, data } = useQuery(SYSTEM_UPDATE, {
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    const su = data?.systemUpdate;
    if (!su) return;
    setEnabled(su.enabled === true);
    setVersion(su.version || "");
    setTitle(su.title || "");
    setAudiencesState(audiencesArrayToState(su.audiences));
  }, [data]);

  const [updateSystemUpdate, { loading: saving }] = useMutation(
    UPDATE_SYSTEM_UPDATE,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      refetchQueries: [{ query: SYSTEM_UPDATE }],
    }
  );

  // --- мутаторы стейта пунктов ---
  const addItem = (sectionKey) => {
    setAudiencesState((prev) => ({
      ...prev,
      [activeAud]: {
        ...prev[activeAud],
        [sectionKey]: [...prev[activeAud][sectionKey], makeItem()],
      },
    }));
  };

  const removeItem = (sectionKey, key) => {
    setAudiencesState((prev) => ({
      ...prev,
      [activeAud]: {
        ...prev[activeAud],
        [sectionKey]: prev[activeAud][sectionKey].filter((it) => it._key !== key),
      },
    }));
  };

  const editItem = (sectionKey, key, field, value) => {
    setAudiencesState((prev) => ({
      ...prev,
      [activeAud]: {
        ...prev[activeAud],
        [sectionKey]: prev[activeAud][sectionKey].map((it) =>
          it._key === key ? { ...it, [field]: value } : it
        ),
      },
    }));
  };

  // Подставляет в форму шаблон релиза (scripts/systemUpdate.data.mjs) — без сохранения:
  // дальше владелец правит руками и жмёт «Сохранить».
  const handleFillFromTemplate = async () => {
    const hasData =
      !!version.trim() ||
      !!title.trim() ||
      countItems(stateToAudiencesArray(audiencesState)) > 0;

    if (hasData) {
      const ok = await confirmDialog(
        "Заполнить из шаблона? Версия, заголовок и все пункты будут заменены."
      );
      if (!ok) return;
    }

    setVersion(systemUpdateTemplate.version || "");
    setTitle(systemUpdateTemplate.title || "");
    setAudiencesState(audiencesArrayToState(systemUpdateTemplate.audiences));
    info("Шаблон подставлен. Проверьте и нажмите «Сохранить».");
  };

  const handleSave = async () => {
    const audiencesArray = stateToAudiencesArray(audiencesState);
    if (enabled) {
      // if (!VERSION_RE.test(version.trim())) {
      //   notifyError("Версия должна быть в формате X.Y.Z");
      //   return;
      // }
      if (!title.trim()) {
        notifyError("Заполните заголовок");
        return;
      }
      if (countItems(audiencesArray) < 1) {
        notifyError("Добавьте хотя бы один пункт");
        return;
      }
    }

    try {
      await updateSystemUpdate({
        variables: {
          input: {
            enabled,
            version: version.trim() || null,
            title: title.trim() || null,
            audiences: audiencesArray,
          },
        },
      });
      success("Релиз сохранён");
    } catch (err) {
      console.error("Ошибка сохранения релиза", err);
      const code = err?.graphQLErrors?.[0]?.extensions?.code;
      if (code === "BAD_USER_INPUT") {
        notifyError("Проверьте версию, заголовок и пункты");
      } else if (code === "FORBIDDEN" || code === "UNAUTHORIZED") {
        notifyError("Нет доступа");
      } else {
        notifyError("Не удалось сохранить релиз");
      }
    }
  };

  // --- превью выбранной аудитории по локальному стейту ---
  const previewSections = {};
  SECTION_KEYS.forEach((key) => {
    previewSections[key] = (audiencesState[activeAud]?.[key] || [])
      .filter((it) => (it.title || "").trim())
      .map((it) => ({ title: it.title.trim(), description: (it.description || "").trim() }));
  });
  const previewHasItems = SECTION_KEYS.some((k) => previewSections[k].length);
  const previewTitle = title.trim();
  const previewVersion = version.trim();
  const publishedAt = data?.systemUpdate?.publishedAt;
  const showPreview = enabled && previewTitle && previewHasItems;

  return (
    <>
      {loading && !data && <MUILoader />}
      {error && <p>Ошибка: {error.message}</p>}

      <div className={classes.split}>
        {/* LEFT: форма */}
        <div className={classes.formCol}>
          <div className={classes.publishRow}>
            <div>
              <div className={classes.publishTitle}>Публикация релиза</div>
              <div className={classes.publishHint}>
                Включено + версия новее → пользователь увидит модалку при входе.
              </div>
            </div>
            <MUISwitch
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          </div>

          <div className={classes.divider} />

          <span className={classes.sectionLabel}>Содержание</span>

          <label className={classes.field}>
            <span className={classes.label}>Версия</span>
            <input
              type="text"
              className={`${classes.input} ${classes.inputNarrow}`}
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="3.6.0"
            />
            <span className={classes.hint}>
              Формат X.Y.Z или X.Y.Z-N. Показывается один раз тем, у кого версия
              отличается.
            </span>
          </label>

          <label className={classes.field}>
            <span className={classes.label}>Заголовок</span>
            <input
              type="text"
              className={classes.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Что нового в версии 3.6.0"
            />
          </label>

          {/* под-табы аудитории */}
          <div className={classes.audPills} role="tablist">
            {AUDIENCE_ORDER.map((aud) => (
              <button
                key={aud}
                type="button"
                role="tab"
                aria-selected={activeAud === aud}
                className={`${classes.audPill} ${activeAud === aud ? classes.audPillOn : ""}`}
                onClick={() => setActiveAud(aud)}
              >
                {AUDIENCE_LABELS[aud]}
              </button>
            ))}
          </div>

          {/* секции активной аудитории */}
          {SECTION_KEYS.map((sectionKey) => {
            const items = audiencesState[activeAud]?.[sectionKey] || [];
            return (
              <div key={sectionKey} className={classes.editSec}>
                <div className={classes.editSecLabel}>
                  <span
                    className={classes.editSecDot}
                    style={{ background: SECTION_COLORS[sectionKey] }}
                  />
                  {SECTION_LABELS[sectionKey]}
                </div>
                {items.map((item) => (
                  <div key={item._key} className={classes.editItem}>
                    <input
                      type="text"
                      className={classes.input}
                      value={item.title}
                      onChange={(e) => editItem(sectionKey, item._key, "title", e.target.value)}
                      placeholder="Заголовок пункта"
                    />
                    <input
                      type="text"
                      className={classes.input}
                      value={item.description}
                      onChange={(e) => editItem(sectionKey, item._key, "description", e.target.value)}
                      placeholder="Описание (необязательно)"
                    />
                    <button
                      type="button"
                      className={classes.editRemove}
                      onClick={() => removeItem(sectionKey, item._key)}
                      aria-label="Удалить пункт"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={classes.editAdd}
                  onClick={() => addItem(sectionKey)}
                >
                  + добавить пункт
                </button>
              </div>
            );
          })}

          <div className={classes.actions}>
            <Button
              onClick={handleFillFromTemplate}
              disabled={saving || (loading && !data)}
              padding="0 18px"
              backgroundcolor="#fff"
              color="#0057C3"
              border="1px solid #0057C3"
            >
              Заполнить из шаблона
            </Button>
            <Button onClick={handleSave} disabled={saving} padding="0 28px">
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
            {publishedAt && (
              <span className={classes.savedMeta}>
                Последняя публикация: {convertToDate(publishedAt, true)}
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: живое превью */}
        <div className={classes.previewCol}>
          <span className={classes.sectionLabel}>Предпросмотр</span>
          <div className={classes.previewSub}>
            Аудитория: {AUDIENCE_LABELS[activeAud]}
          </div>

          <div className={classes.screen}>
            {showPreview ? (
              <>
                <div className={classes.screenBar}>
                  <span className={classes.screenDotMini} />
                  <span className={classes.screenDotMini} />
                </div>
                <div className={classes.screenDim}>
                  <SystemUpdateCard
                    title={previewTitle}
                    version={previewVersion}
                    audiences={[{ audience: activeAud, sections: previewSections }]}
                    isSuperAdmin={false}
                    preview
                  />
                </div>
              </>
            ) : (
              <div className={classes.previewEmpty}>
                Модалка скрыта (выключена, пустой заголовок или нет пунктов).
              </div>
            )}
          </div>
          <div className={classes.caption}>
            Обновляется на лету. Превью показывает выбранную аудиторию.
          </div>
        </div>
      </div>
    </>
  );
}

export default SystemUpdateSettings;
