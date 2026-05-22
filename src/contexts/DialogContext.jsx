import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import MUIAlert from "../Components/Standart/MUIAlert/MUIAlert.jsx";
import MUIConfirm from "../Components/Standart/MUIConfirm/MUIConfirm.jsx";

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [alertState, setAlertState] = useState({
    open: false,
    message: "",
    severity: "error",
    autoHideDuration: 4500,
    anchorOrigin: { vertical: "top", horizontal: "center" },
  });

  const [confirmState, setConfirmState] = useState({
    open: false,
    message: "",
    confirmText: "Да",
    cancelText: "Нет",
    severity: "warning",
    anchorOrigin: { vertical: "top", horizontal: "center" },
  });

  const confirmResolverRef = useRef(null);

  const showAlert = useCallback((messageOrOptions, severity = "error") => {
    if (typeof messageOrOptions === "string") {
      setAlertState((prev) => ({
        ...prev,
        open: true,
        message: messageOrOptions,
        severity,
      }));
      return;
    }

    const {
      message = "",
      severity: nextSeverity = "error",
      autoHideDuration = 4500,
      anchorOrigin = { vertical: "top", horizontal: "center" },
    } = messageOrOptions || {};

    setAlertState({
      open: true,
      message,
      severity: nextSeverity,
      autoHideDuration,
      anchorOrigin,
    });
  }, []);

  const closeAlert = useCallback((event, reason) => {
    if (reason === "clickaway") return;
    setAlertState((prev) => ({ ...prev, open: false }));
  }, []);

  const confirm = useCallback((messageOrOptions) => {
    return new Promise((resolve) => {
      const options =
        typeof messageOrOptions === "string"
          ? { message: messageOrOptions }
          : messageOrOptions || {};

      confirmResolverRef.current = resolve;
      setConfirmState({
        open: true,
        message: options.message || "",
        confirmText: options.confirmText || "Да",
        cancelText: options.cancelText || "Нет",
        severity: options.severity || "warning",
        anchorOrigin:
          options.anchorOrigin || { vertical: "top", horizontal: "center" },
      });
    });
  }, []);

  const handleConfirmClose = useCallback((result) => {
    setConfirmState((prev) => ({ ...prev, open: false }));
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }
  }, []);

  const value = useMemo(
    () => ({
      showAlert,
      closeAlert,
      confirm,
      isDialogOpen: alertState.open || confirmState.open,
    }),
    [showAlert, closeAlert, confirm, alertState.open, confirmState.open]
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <MUIAlert
        open={alertState.open}
        message={alertState.message}
        severity={alertState.severity}
        autoHideDuration={alertState.autoHideDuration}
        anchorOrigin={alertState.anchorOrigin}
        onClose={closeAlert}
      />
      <MUIConfirm
        open={confirmState.open}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        severity={confirmState.severity}
        anchorOrigin={confirmState.anchorOrigin}
        onConfirm={() => handleConfirmClose(true)}
        onClose={() => handleConfirmClose(false)}
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return context;
}
