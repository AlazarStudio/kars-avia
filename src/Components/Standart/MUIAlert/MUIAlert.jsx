import React from "react";
import { Alert, Backdrop, Snackbar } from "@mui/material";

/** Выше `Sidebar` (z-index 10000), иначе алерт оказывается под боковыми панелями */
const ALERT_Z = 11_000;

function MUIAlert({
  open,
  message,
  severity = "error",
  onClose,
  autoHideDuration = 4500,
  anchorOrigin = { vertical: "top", horizontal: "center" },
  variant = "filled",
  minWidth = 320,
}) {
  return (
    <>
      <Backdrop
        open={open}
        sx={{
          zIndex: ALERT_Z - 1,
          backgroundColor: "rgba(0, 0, 0, 0.2)",
        }}
      />
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={onClose}
        anchorOrigin={anchorOrigin}
        sx={{ zIndex: ALERT_Z }}
      >
        <Alert
          onClose={onClose}
          severity={severity}
          variant={variant}
          sx={{ width: "100%", minWidth, justifyContent: "center" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default MUIAlert;
