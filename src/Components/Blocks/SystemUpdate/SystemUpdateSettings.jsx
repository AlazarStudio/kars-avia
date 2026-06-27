import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import classes from "./SystemNotificationsSettings.module.css";
import Button from "../../Standart/Button/Button";
import MUISwitch from "../MUISwitch/MUISwitch";
import MUILoader from "../MUILoader/MUILoader";
import { useToast } from "../../../contexts/ToastContext";
import {
  SYSTEM_UPDATE,
  UPDATE_SYSTEM_UPDATE,
  convertToDate,
  getCookie,
} from "../../../../graphQL_requests";

const VERSION_RE = /^\d+\.\d+\.\d+$/;

function SystemUpdateSettings() {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const { loading, error, data } = useQuery(SYSTEM_UPDATE, {
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    const su = data?.systemUpdate;
    if (!su) return;
    setEnabled(su.enabled === true);
    setVersion(su.version || "");
    setTitle(su.title || "");
    setMessage(su.message || "");
  }, [data]);

  const [updateSystemUpdate, { loading: saving }] = useMutation(
    UPDATE_SYSTEM_UPDATE,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      refetchQueries: [{ query: SYSTEM_UPDATE }],
    }
  );

  const handleSave = async () => {
    if (enabled) {
      if (!VERSION_RE.test(version.trim())) {
        notifyError("Версия должна быть в формате X.Y.Z");
        return;
      }
      if (!title.trim() || !message.trim()) {
        notifyError("Заполните заголовок и текст");
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
            message: message.trim() || null,
          },
        },
      });
      success("Релиз сохранён");
    } catch (err) {
      const code = err?.graphQLErrors?.[0]?.extensions?.code;
      if (code === "BAD_USER_INPUT") {
        notifyError("Проверьте версию, заголовок и текст");
      } else if (code === "FORBIDDEN" || code === "UNAUTHORIZED") {
        notifyError("Нет доступа");
      } else {
        notifyError("Не удалось сохранить релиз");
      }
    }
  };

  const previewTitle = title.trim();
  const previewVersion = version.trim();
  const previewLines = message.split("\n");
  const publishedAt = data?.systemUpdate?.publishedAt;
  const showPreview = enabled && previewTitle;

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
              placeholder="3.5.0"
            />
            <span className={classes.hint}>
              Формат X.Y.Z. Показывается один раз тем, у кого версия отличается.
            </span>
          </label>

          <label className={classes.field}>
            <span className={classes.label}>Заголовок</span>
            <input
              type="text"
              className={classes.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Что нового в версии 3.5.0"
            />
          </label>

          <label className={classes.field}>
            <span className={classes.label}>Текст</span>
            <div className={classes.textareaShell}>
              <textarea
                className={classes.textareaField}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder={"• Улучшены заявки\n• Новые фильтры отелей\n• Исправления в чатах"}
              />
              <div className={classes.textareaFooter}>
                <span className={classes.textareaFooterHint}>
                  Каждая строка — отдельный абзац
                </span>
                <span className={classes.textareaCount}>{message.length} симв.</span>
              </div>
            </div>
          </label>

          <div className={classes.actions}>
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
          <div className={classes.previewSub}>Как увидит пользователь</div>

          <div className={classes.screen}>
            {showPreview ? (
              <>
                <div className={classes.screenBar}>
                  <span className={classes.screenDotMini} />
                  <span className={classes.screenDotMini} />
                </div>
                <div className={classes.screenDim}>
                  <div className={classes.pvModal}>
                    <div className={classes.pvBrand}>
                      <div className={classes.pvIcon}>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                        </svg>
                      </div>
                      <div className={classes.pvBrandTitle}>{previewTitle}</div>
                      <div className={classes.pvBrandSpacer} />
                      {previewVersion && (
                        <div className={classes.pvBrandVersion}>{previewVersion}</div>
                      )}
                    </div>
                    <div className={classes.pvChanges}>
                      <div className={classes.pvChangesLabel}>Изменения</div>
                      <div className={classes.pvChangesList}>
                        {previewLines.map((line, i) =>
                          line.trim() ? (
                            <div key={i} className={classes.pvChangeRow}>
                              <span className={classes.pvCheck}>
                                <svg
                                  width="9"
                                  height="9"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              </span>
                              <span>{line}</span>
                            </div>
                          ) : null
                        )}
                      </div>
                      <div className={classes.pvModalActions}>
                        <span className={classes.pvBtn}>Понятно</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className={classes.previewEmpty}>
                Модалка скрыта (выключена или пустой заголовок).
              </div>
            )}
          </div>
          <div className={classes.caption}>
            Обновляется на лету при вводе. «Понятно» помечает версию просмотренной.
          </div>
        </div>
      </div>
    </>
  );
}

export default SystemUpdateSettings;
