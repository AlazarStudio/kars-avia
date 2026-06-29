import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import classes from "./AvatarUpload.module.css";
import CloseIcon from "../../../shared/icons/CloseIcon";
import CheckCircleIcon from "../../../shared/icons/CheckCircleIcon";
import RestoreIcon from "../../../shared/icons/RestoreIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";
import ImageIcon from "../../../shared/icons/ImageIcon";
import getCroppedImg from "./getCroppedImg";
import Button from "../../Standart/Button/Button";
import { getMediaUrl } from "../../../../graphQL_requests";

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

// Универсальный кастомный инпут для аватара с обрезкой (react-easy-crop).
// value — File | string (url существующего файла) | null
// onChange(file | null)
// onError(message) — превышение размера/неверный тип
function AvatarUpload({
  value,
  onChange,
  onError,
  label = "Загрузить аватар",
  variant = "avatar", // "avatar" → /no-avatar.png, "image" → иконка изображения
  maxSizeMB = 8,
  accept = "image/*",
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);

  // Состояние кропа
  const [cropSrc, setCropSrc] = useState(null);
  const [cropName, setCropName] = useState("avatar.png");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isFile = value instanceof File;

  useEffect(() => {
    if (!isFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value, isFile]);

  // Освобождаем objectURL источника кропа
  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  // Готовый url: либо превью File, либо медиа-url существующей строки
  const imageUrl = isFile
    ? preview
    : typeof value === "string" && value
    ? getMediaUrl(value)
    : null;

  const validateFile = (file) => {
    if (!file) return false;
    if (accept === "image/*" && !file.type.startsWith("image/")) {
      onError?.("Можно загрузить только изображение.");
      return false;
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      onError?.(`Размер файла не должен превышать ${maxSizeMB} МБ!`);
      return false;
    }
    return true;
  };

  // Открываем кроп-модалку для выбранного файла
  const startCrop = (file) => {
    if (!validateFile(file)) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropName(file.name);
    setCropSrc(URL.createObjectURL(file));
  };

  const handleSelect = (e) => {
    startCrop(e.target.files?.[0]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    startCrop(e.dataTransfer.files?.[0]);
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const closeCrop = () => {
    setCropSrc(null);
    setIsSaving(false);
  };

  const handleConfirmCrop = async () => {
    if (!croppedAreaPixels) return;
    try {
      setIsSaving(true);
      const file = await getCroppedImg(cropSrc, croppedAreaPixels, cropName);
      onChange?.(file);
      closeCrop();
    } catch (err) {
      console.error("Ошибка обрезки изображения:", err);
      onError?.("Не удалось обрезать изображение.");
      setIsSaving(false);
    }
  };

  const fileName = isFile ? value.name : "";
  const fileSize = isFile ? formatSize(value.size) : "";
  const hasValue = !!imageUrl;

  return (
    <>
      <div
        className={`${classes.dropzone} ${isDragging ? classes.dragging : ""} ${
          disabled ? classes.disabled : ""
        }`}
        onClick={hasValue ? undefined : openPicker}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div
          className={`${classes.preview} ${
            hasValue
              ? classes.previewSquare
              : variant === "image"
              ? classes.previewEmpty
              : ""
          }`}
        >
          {hasValue ? (
            <img src={imageUrl} alt="Аватар" />
          ) : variant === "image" ? (
            <ImageIcon width={20} height={20} color="#8A93AC" />
          ) : (
            <img src="/no-avatar.png" alt="Аватар" />
          )}
        </div>

        {hasValue ? (
          <>
            <div className={classes.info}>
              <span className={classes.title}>
                <span className={classes.fileName}>
                  {fileName || "Текущий аватар"}
                </span>
                <CheckCircleIcon width={16} height={16} />
              </span>
              <span className={classes.hint}>
                {fileSize ? `${fileSize} · ` : ""}загружено
              </span>
            </div>

            {!disabled && (
              <div className={classes.actions}>
                <button
                  type="button"
                  className={classes.iconBtn}
                  onClick={openPicker}
                  title="Заменить"
                >
                  <RestoreIcon strokeWidth={1.2} />
                </button>
                <button
                  type="button"
                  className={classes.iconBtn}
                  onClick={handleRemove}
                  title="Удалить"
                >
                  <DeleteIcon strokeWidth={1.2} />
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={classes.info}>
              <span className={classes.title}>{label}</span>
              <span className={classes.hint}>
                PNG, JPG · до {maxSizeMB} МБ
              </span>
            </div>
            <span className={classes.selectBtn}>Выбрать</span>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleSelect}
          disabled={disabled}
          hidden
        />
      </div>

      {cropSrc &&
        createPortal(
          <div
            className={classes.cropOverlay}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
          <div className={classes.cropModal}>
            <div className={classes.cropHeader}>
              <span>Обрезка аватара</span>
              <button
                type="button"
                className={classes.cropClose}
                onClick={closeCrop}
                title="Закрыть"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>

            <div className={classes.cropArea}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className={classes.cropControls}>
              <span className={classes.cropZoomLabel}>Масштаб</span>
              <div className={classes.cropZoomRow}>
                <ImageIcon width={18} height={18} />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className={classes.cropZoom}
                />
                <ImageIcon width={24} height={24} />
              </div>
            </div>

            <div className={classes.cropActions}>
              <Button
                type="button"
                onClick={closeCrop}
                backgroundcolor="#F1F4FB"
                color="#191919"
              >
                Отмена
              </Button>
              <Button
                type="button"
                onClick={handleConfirmCrop}
                disabled={isSaving || !croppedAreaPixels}
              >
                {isSaving ? "Сохранение..." : "Применить"}
              </Button>
            </div>
          </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default AvatarUpload;
