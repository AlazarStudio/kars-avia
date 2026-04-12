import React from "react";
import { Alert, Backdrop, Button, Snackbar, Stack } from "@mui/material";

/** Выше `Sidebar` (z-index 10000 в Sidebar.module.css), иначе confirm оказывается под панелями */
const CONFIRM_Z = 11_000;

function MUIConfirm({
  open,
  message,
  onConfirm,
  onClose,
  confirmText = "Да",
  cancelText = "Нет",
  severity = "warning",
  anchorOrigin = { vertical: "top", horizontal: "center" },
  variant = "filled",
  minWidth = 320,
}) {
  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    onClose();
  };

  return (
    <>
      <Backdrop
        open={open}
        sx={{
          zIndex: CONFIRM_Z - 1,
          backgroundColor: "rgba(0, 0, 0, 0.2)",
        }}
      />
      <Snackbar
        open={open}
        onClose={handleClose}
        anchorOrigin={anchorOrigin}
        sx={{ zIndex: CONFIRM_Z }}
      >
        <Alert
          severity={severity}
          variant={variant}
          sx={{ width: "100%", minWidth, alignItems: "center" }}
          action={
            <Stack direction="row" spacing={1}>
              <Button color="inherit" size="small" onClick={onClose}>
                {cancelText}
              </Button>
              <Button color="inherit" size="small" onClick={onConfirm} autoFocus>
                {confirmText}
              </Button>
            </Stack>
          }
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default MUIConfirm;
