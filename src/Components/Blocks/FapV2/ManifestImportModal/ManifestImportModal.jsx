import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "../../../Standart/Button/Button";
import ManifestUploadField from "../ManifestUploadField/ManifestUploadField";

// Импорт манифеста (форма ПМ) из шапки реестра. Разобранный файл живёт здесь и
// сбрасывается на каждом открытии — наружу уходит только подтверждённый импорт.
export default function ManifestImportModal({
  open,
  onClose,
  expectedFlightNumber,
  saving = false,
  onImport,
}) {
  const [parsed, setParsed] = useState(null);

  useEffect(() => {
    if (!open) return;
    setParsed(null);
  }, [open]);

  const count = parsed?.people?.length || 0;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle
        sx={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "var(--text)",
          borderBottom: "1px solid #F1F5F9",
          pb: 2,
        }}
      >
        Импорт манифеста
      </DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        <ManifestUploadField
          parsed={parsed}
          onParsed={setParsed}
          onClear={() => setParsed(null)}
          expectedFlightNumber={expectedFlightNumber}
        />
      </DialogContent>
      <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
        <Button
          backgroundcolor="#F1F4FB"
          color="#545873"
          onClick={onClose}
          disabled={saving}
        >
          Отмена
        </Button>
        <Button
          backgroundcolor="var(--dark-blue)"
          color="#fff"
          onClick={() => onImport?.(parsed)}
          disabled={saving || count === 0}
        >
          {count > 0 ? `Добавить ${count} в реестр` : "Добавить в реестр"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
