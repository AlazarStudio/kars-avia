import React, { useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

function ManifestModal({
  open,
  onClose,
  handleFileChange,
  file,
  request,
  server,
  classes,
}) {
  const fileInputRef = useRef(null);

  const handleLabelClick = () => {
    fileInputRef.current && fileInputRef.current.click();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Манифест</DialogTitle>
      <DialogContent dividers>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Кастомная кнопка загрузки */}
          <label
            onClick={handleLabelClick}
            className={classes.downloadsButton}
            style={{ cursor: "pointer" }}
          >
            <img
              src="/edit.svg.png"
              alt="Редактировать"
              style={{ width: "15px" }}
            />{" "}
            Обновить манифест
            {/* {file ? file.name : ""} */}
          </label>
          {/* Ссылка для скачивания манифеста */}
          {request?.files && (
            <a
              href={request.files ? `${server}${request.files[0]}` : ""}
              target="_blank"
              className={classes.downloadsButton}
              rel="noopener noreferrer"
            >
              Загрузить манифест
              <img src="/download.png" alt="Скачать" />
            </a>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ManifestModal;
