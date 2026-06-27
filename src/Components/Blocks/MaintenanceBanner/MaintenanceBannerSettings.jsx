import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import classes from "../SystemUpdate/SystemNotificationsSettings.module.css";
import Button from "../../Standart/Button/Button";
import MUISwitch from "../MUISwitch/MUISwitch";
import MUILoader from "../MUILoader/MUILoader";
import { useToast } from "../../../contexts/ToastContext";
import {
  MAINTENANCE_BANNER,
  UPDATE_MAINTENANCE_BANNER,
  getCookie,
} from "../../../../graphQL_requests";
import {
  formatCountdown,
  useMaintenanceCountdown,
} from "./useMaintenanceCountdown";

// ISO (UTC) -> значение для <input type="datetime-local"> в локальном времени
function isoToLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Локальное datetime-local -> ISO (UTC)
function localInputToISO(local) {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function MaintenanceBannerSettings() {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [endsAtLocal, setEndsAtLocal] = useState("");

  const { loading, error, data } = useQuery(MAINTENANCE_BANNER, {
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    const banner = data?.maintenanceBanner;
    if (!banner) return;
    setEnabled(banner.enabled === true);
    setMessage(banner.message || "");
    setEndsAtLocal(isoToLocalInput(banner.endsAt));
  }, [data]);

  const [updateBanner, { loading: saving }] = useMutation(
    UPDATE_MAINTENANCE_BANNER,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      refetchQueries: [{ query: MAINTENANCE_BANNER }],
    }
  );

  const handleSave = async () => {
    if (enabled && !message.trim()) {
      notifyError("Укажите текст плашки");
      return;
    }

    try {
      await updateBanner({
        variables: {
          input: {
            enabled,
            message: message.trim() || null,
            endsAt: localInputToISO(endsAtLocal),
          },
        },
      });
      success("Настройки плашки сохранены");
    } catch (err) {
      const code = err?.graphQLErrors?.[0]?.extensions?.code;
      if (code === "BAD_USER_INPUT") {
        notifyError("Укажите текст плашки");
      } else if (code === "FORBIDDEN" || code === "UNAUTHORIZED") {
        notifyError("Нет доступа");
      } else {
        notifyError("Не удалось сохранить настройки");
      }
    }
  };

  // Превью по локальному состоянию формы
  const previewMessage = message.trim();
  const previewEndsAtISO = localInputToISO(endsAtLocal);
  const previewLeft = useMaintenanceCountdown(previewEndsAtISO);
  const showPreview = enabled && previewMessage;

  return (
    <>
      {loading && !data && <MUILoader />}
      {error && <p>Ошибка: {error.message}</p>}

      <div className={classes.split}>
        {/* LEFT: форма */}
        <div className={classes.formCol}>
          <div className={classes.publishRow}>
            <div>
              <div className={classes.publishTitle}>Показывать плашку</div>
              <div className={classes.publishHint}>
                Видна всем, включая страницу входа.
              </div>
            </div>
            <MUISwitch
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          </div>

          <div className={classes.divider} />

          <label className={classes.field}>
            <span className={classes.label}>Текст плашки</span>
            <div className={classes.textareaShell}>
              <textarea
                className={classes.textareaField}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Плановые работы. Возможны кратковременные перебои."
              />
              <div className={classes.textareaFooter}>
                <span className={classes.textareaFooterHint}>
                  Показывается одной строкой
                </span>
                <span className={classes.textareaCount}>{message.length} симв.</span>
              </div>
            </div>
          </label>

          <label className={classes.field}>
            <span className={classes.label}>Окончание работ (необязательно)</span>
            <div className={classes.dateRow}>
              <input
                type="datetime-local"
                className={`${classes.input} ${classes.dateInput}`}
                value={endsAtLocal}
                onChange={(e) => setEndsAtLocal(e.target.value)}
              />
              {endsAtLocal && (
                <Button
                  backgroundcolor="#AFB4BA"
                  padding="0 16px"
                  onClick={() => setEndsAtLocal("")}
                >
                  Очистить
                </Button>
              )}
            </div>
          </label>

          <div className={classes.actions}>
            <Button onClick={handleSave} disabled={saving} padding="0 28px">
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>

        {/* RIGHT: живое превью */}
        <div className={classes.previewCol}>
          <span className={classes.sectionLabel}>Предпросмотр</span>
          <div className={classes.previewSub}>Как увидит пользователь</div>

          <div className={classes.screen}>
            {showPreview ? (
              <>
                <div className={classes.pvBanner}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 0 0 3.53 21H20.47A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className={classes.pvBannerMsg}>{previewMessage}</span>
                  {previewEndsAtISO && previewLeft != null && (
                    <span className={classes.pvBannerTimer}>
                      {formatCountdown(previewLeft)}
                    </span>
                  )}
                </div>
                <div className={classes.pvPage}>
                  <div className={classes.pvPageHead} />
                  <div className={classes.pvPageLine} />
                  <div className={classes.pvPageLine} />
                </div>
              </>
            ) : (
              <div className={classes.previewEmpty}>
                Плашка скрыта (выключена или пустой текст).
              </div>
            )}
          </div>
          <div className={classes.caption}>
            Таймер тикает в реальном времени. Выкл/истёк → полоса исчезает.
          </div>
        </div>
      </div>
    </>
  );
}

export default MaintenanceBannerSettings;
