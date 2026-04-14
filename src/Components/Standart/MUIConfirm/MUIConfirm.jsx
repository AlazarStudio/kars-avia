import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

const SEVERITY_CONFIG = {
  warning: {
    icon: <HelpOutlineRoundedIcon sx={{ color: "text.secondary", fontSize: 28 }} />,
    confirmColor: "primary",
  },
  error: {
    icon: <ErrorOutlineRoundedIcon sx={{ color: "error.main", fontSize: 28 }} />,
    confirmColor: "error",
  },
  info: {
    icon: <HelpOutlineRoundedIcon sx={{ color: "text.secondary", fontSize: 28 }} />,
    confirmColor: "primary",
  },
  success: {
    icon: <HelpOutlineRoundedIcon sx={{ color: "text.secondary", fontSize: 28 }} />,
    confirmColor: "primary",
  },
};

function MUIConfirm({
  open,
  message,
  onConfirm,
  onClose,
  confirmText = "Да",
  cancelText = "Нет",
  severity = "warning",
}) {
  const { icon, confirmColor } = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.warning;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
        {icon}
        Подтверждение
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm} autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MUIConfirm;
