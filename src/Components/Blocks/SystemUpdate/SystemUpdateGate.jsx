import React from "react";
import { useAuth } from "../../../AuthContext";
import { useSystemUpdate } from "./useSystemUpdate";
import SystemUpdateModal from "./SystemUpdateModal";

// Гейт: модалка только для авторизованных USER. Внешние пользователи
// (EXTERNAL_USER) и неавторизованные — запрос не уходит, модалка не открывается.
export default function SystemUpdateGate() {
  const { user } = useAuth();
  const enabled = Boolean(user) && user?.subjectType !== "EXTERNAL_USER";

  const { systemUpdate, isOpen, dismissing, dismiss } = useSystemUpdate({
    enabled,
  });

  if (!enabled) return null;

  return (
    <SystemUpdateModal
      open={isOpen}
      title={systemUpdate?.title ?? null}
      message={systemUpdate?.message ?? null}
      version={systemUpdate?.version ?? null}
      publishedAt={systemUpdate?.publishedAt ?? null}
      dismissing={dismissing}
      onDismiss={dismiss}
    />
  );
}
