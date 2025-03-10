import React, { useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

import classes from "./ManifestModal.module.css";
import { roles } from "../../../roles";

function ManifestModal({
  user,
  open,
  onClose,
  handleFileChange,
  file,
  request,
  server,
}) {
  const fileInputRef = useRef(null);

  const handleLabelClick = () => {
    fileInputRef.current && fileInputRef.current.click();
  };

  // console.log(user);

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
        <div className={classes.downloadsButtonsWrapper}>
          {/* Кастомная кнопка загрузки */}
          {user?.role === roles.hotelAdmin ? null : (
            <label
              onClick={handleLabelClick}
              className={classes.downloadsButton}
              style={{ cursor: "pointer" }}
            >
              Обновить манифест
              <img
                src="/edit.svg.png"
                alt="Редактировать"
                style={{ width: "15px" }}
              />{" "}
              {/* {file ? file.name : ""} */}
            </label>
          )}

          {/* Ссылка для скачивания манифеста */}
          {request?.files && (
            <a
              href={request.files ? `${server}${request.files[0]}` : ""}
              target="_blank"
              className={classes.downloadsButton}
              rel="noopener noreferrer"
            >
              Скачать манифест
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
