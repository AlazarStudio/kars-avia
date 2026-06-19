import { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { useMutation } from "@apollo/client";
import {
  CREATE_HOTEL_PREVIEW_LINK,
  convertToDate,
  getCookie,
} from "../../../../graphQL_requests";
import { useToast } from "../../../contexts/ToastContext";
import classes from "./HotelPreviewShareButton.module.css";

const PRESETS = [
  { value: 8, label: "8 часов" },
  { value: 24, label: "24 часа" },
  { value: 48, label: "48 часов" },
  { value: 72, label: "72 часа" },
];

const ShareIcon = (props) => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#8a8a99"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3CBC67"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M21.5 11.5V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

const CopyIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const ExternalIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#8a8a99"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

function HotelPreviewShareButton({ hotelId }) {
  const { success, error: notifyError } = useToast();
  const token = getCookie("token");

  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("24");
  const [result, setResult] = useState(null); // { link, expiresAt, hours }
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [createLink] = useMutation(CREATE_HOTEL_PREVIEW_LINK, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const clampHours = (v) => {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return 8;
    return Math.min(72, Math.max(8, n));
  };

  const closeModal = () => {
    if (loading) return;
    setOpen(false);
    setResult(null);
    setHours("24");
    setCopied(false);
  };

  const handleCreate = async () => {
    if (loading) return;
    const h = clampHours(hours);
    setHours(String(h));
    setLoading(true);
    try {
      const res = await createLink({ variables: { hotelId, hours: h } });
      const data = res?.data?.createHotelPreviewLink;
      if (data?.link) {
        setResult({ link: data.link, expiresAt: data.expiresAt, hours: h });
      } else {
        notifyError("Не удалось создать ссылку. Попробуйте ещё раз");
      }
    } catch (e) {
      const msg = e?.message || "";
      notifyError(
        msg.includes("Hotel not found")
          ? "Не удалось создать ссылку: гостиница недоступна"
          : "Не удалось создать ссылку. Попробуйте ещё раз"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.link) return;
    try {
      await navigator.clipboard.writeText(result.link);
      setCopied(true);
      success("Ссылка скопирована");
      setTimeout(() => setCopied(false), 1700);
    } catch {
      notifyError("Не удалось скопировать ссылку");
    }
  };

  const handleAgain = () => {
    setResult(null);
    setCopied(false);
  };

  const num = parseInt(hours, 10);

  return (
    <>
      <button
        className={classes.shareButton}
        onClick={() => setOpen(true)}
        aria-label="Поделиться ссылкой"
      >
        <ShareIcon
          width={18}
          height={18}
          stroke="currentColor"
          strokeWidth={1.7}
        />
        <span className={classes.tooltip}>Поделиться ссылкой</span>
      </button>

      <Modal
        open={open}
        onClose={closeModal}
        aria-labelledby="hpShareTitle"
        aria-describedby="hpShareDesc"
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: "rgba(20, 23, 45, 0.45)",
              backdropFilter: "blur(2px)",
            },
          },
        }}
      >
        <Box
          role="dialog"
          aria-modal="true"
          aria-labelledby="hpShareTitle"
          aria-describedby="hpShareDesc"
          className={classes.modal}
        >
          <div className={classes.header}>
            <ShareIcon className={classes.headerIcon} />
            <h2 id="hpShareTitle" className={classes.title}>
              Ссылка на просмотр гостиницы
            </h2>
            <button
              type="button"
              className={classes.closeBtn}
              aria-label="Закрыть"
              onClick={closeModal}
            >
              <CloseIcon />
            </button>
          </div>
          <p id="hpShareDesc" className={classes.subtitle}>
            Создайте временную ссылку — по ней можно открыть карточку гостиницы
            без входа в систему
          </p>

          <div className={classes.body} key={result ? "success" : "form"}>
            {!result ? (
              <>
                <div
                  className={`${classes.controlGroup} ${
                    loading ? classes.controlGroupBusy : ""
                  }`}
                >
                  <div className={classes.fieldLabel}>Срок действия ссылки</div>
                  <div
                    className={classes.chips}
                    role="radiogroup"
                    aria-label="Срок действия ссылки"
                  >
                    {PRESETS.map((p) => {
                      const active = num === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          className={`${classes.presetChip} ${
                            active ? classes.presetChipActive : ""
                          }`}
                          onClick={() => setHours(String(p.value))}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className={classes.hoursRow}>
                    <input
                      type="number"
                      min={8}
                      max={72}
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      onBlur={() => setHours(String(clampHours(hours)))}
                      aria-label="Свой срок в часах"
                      className={classes.hoursInput}
                    />
                    <span className={classes.hoursNote}>
                      Свой срок · от 8 до 72 ч
                    </span>
                  </div>
                  <div className={classes.hint}>
                    По истечении срока ссылка перестанет открываться
                  </div>
                </div>
                <button
                  type="button"
                  className={classes.primaryButton}
                  onClick={handleCreate}
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <span className={classes.spinner} />
                      <span>Создаём…</span>
                    </>
                  ) : (
                    <span>Создать ссылку</span>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className={classes.successHead}>
                  <CheckCircleIcon />
                  <span className={classes.successHeadText}>Ссылка готова</span>
                </div>

                <div className={classes.linkBlock}>
                  <div className={classes.fieldLabel}>Ссылка для просмотра</div>
                  <input
                    readOnly
                    value={result.link}
                    onFocus={(e) => e.target.select()}
                    aria-label="Ссылка для просмотра гостиницы"
                    className={classes.linkField}
                  />
                </div>

                <div className={classes.actions}>
                  <button
                    type="button"
                    className={`${classes.copyButton} ${
                      copied ? classes.copyButtonDone : ""
                    }`}
                    onClick={handleCopy}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    <span>{copied ? "Скопировано" : "Скопировать"}</span>
                  </button>
                  <button
                    type="button"
                    className={classes.openButton}
                    onClick={() =>
                      window.open(result.link, "_blank", "noopener,noreferrer")
                    }
                  >
                    <ExternalIcon />
                    <span>Открыть</span>
                  </button>
                </div>

                <div className={classes.accessBadge}>
                  <EyeIcon />
                  Доступ только на просмотр
                </div>

                <div className={classes.expiresRow}>
                  <ClockIcon />
                  <div className={classes.expiresText}>
                    Действует <span className={classes.expiresWord}>до</span>{" "}
                    <span className={classes.expiresValue}>
                      {convertToDate(result.expiresAt)},{" "}
                      {convertToDate(result.expiresAt, true)}
                    </span>{" "}
                    <span className={classes.expiresWord}>
                      (через {result.hours} ч)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className={classes.againButton}
                  onClick={handleAgain}
                >
                  Создать новую ссылку
                </button>
              </>
            )}
          </div>
        </Box>
      </Modal>
    </>
  );
}

export default HotelPreviewShareButton;
