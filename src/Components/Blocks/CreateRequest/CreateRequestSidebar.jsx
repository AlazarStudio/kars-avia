import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import CreateRequest from "./CreateRequest";
import ImportBulkRequests from "../ImportBulkRequests/ImportBulkRequests";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import { isSuperAdmin } from "../../../utils/access";
import { useDialog } from "../../../contexts/DialogContext.jsx";
import classes from "./CreateRequestSidebar.module.css";

// Единая панель «Создать заявку»: сегмент Одиночная / Массовая сверху.
// Массовая (импорт XLSX) доступна только суперадмину — иначе показываем только одиночную форму.
function CreateRequestSidebar({ show, onClose, onMatchFound, onImported, user }) {
  const { isDialogOpen } = useDialog();
  const wrapRef = useRef();
  const activeCloseRef = useRef(null);
  const [mode, setMode] = useState("single");
  const canBulk = isSuperAdmin(user);

  // Активный режим регистрирует свой обработчик закрытия (с guard несохранённых изменений)
  const registerClose = (fn) => {
    activeCloseRef.current = fn;
  };
  const requestClose = () => {
    if (activeCloseRef.current) activeCloseRef.current();
    else onClose();
  };

  // При каждом открытии — сброс на «Одиночную»
  useEffect(() => {
    if (show) setMode("single");
  }, [show]);

  // Единый click-outside на всю панель; закрытие делегируется активному режиму
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest?.(".MuiSnackbar-root")) return;
      if (event.target.closest?.("[data-script-runner-control]")) return;
      if (document.body.dataset.scriptRunnerPickMode === "true") return;
      if (wrapRef.current?.contains(event.target)) return;
      if (activeCloseRef.current) activeCloseRef.current();
      else onClose();
    };
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, isDialogOpen, onClose]);

  return (
    <Sidebar show={show} sidebarRef={wrapRef}>
      <div className={classes.header}>
        <span className={classes.title}>Создать заявку</span>
        <span className={classes.close} onClick={requestClose}>
          <CloseIcon />
        </span>
      </div>

      {canBulk && (
        <div className={classes.modeRow}>
          <div className={classes.segment}>
            <button
              type="button"
              className={mode === "single" ? classes.segActive : ""}
              onClick={() => setMode("single")}
            >
              Одиночная
            </button>
            <button
              type="button"
              className={mode === "bulk" ? classes.segActive : ""}
              onClick={() => setMode("bulk")}
            >
              Массовая
            </button>
          </div>
        </div>
      )}

      {mode === "single" ? (
        <CreateRequest
          embedded
          show={show}
          onClose={onClose}
          onMatchFound={onMatchFound}
          user={user}
          registerClose={registerClose}
        />
      ) : (
        <ImportBulkRequests
          embedded
          show={show}
          onClose={onClose}
          user={user}
          onImported={onImported}
          registerClose={registerClose}
        />
      )}
    </Sidebar>
  );
}

export default CreateRequestSidebar;
