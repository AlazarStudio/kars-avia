import React from "react";
import Dialog from "@mui/material/Dialog";
import SystemUpdateCard from "./SystemUpdateCard";

// Тонкая обёртка: MUI Dialog + карточка релиза (дизайн v3).
// Paper прозрачный — белую поверхность/радиус/тень даёт сама карточка.
export default function SystemUpdateModal({
  open,
  title,
  version,
  audiences = [],
  isSuperAdmin = false,
  dismissing = false,
  onDismiss,
}) {
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      maxWidth={false}
      PaperProps={{
        sx: {
          background: "transparent",
          boxShadow: "none",
          borderRadius: "20px",
          overflow: "visible",
          maxWidth: 460,
          width: "92vw",
          margin: 2,
        },
      }}
    >
      <SystemUpdateCard
        title={title}
        version={version}
        audiences={audiences}
        isSuperAdmin={isSuperAdmin}
        dismissing={dismissing}
        onDismiss={onDismiss}
      />
    </Dialog>
  );
}
