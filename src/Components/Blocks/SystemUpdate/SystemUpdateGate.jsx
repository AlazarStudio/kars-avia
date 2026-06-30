import React from "react";
import { useAuth } from "../../../AuthContext";
import { useSystemUpdate } from "./useSystemUpdate";
import SystemUpdateModal from "./SystemUpdateModal";

// Гейт: модалка только для авторизованных USER. EXTERNAL_USER и гости — запрос не уходит.
export default function SystemUpdateGate() {
  const { user } = useAuth();
  const enabled = Boolean(user) && user?.subjectType !== "EXTERNAL_USER";

  const { systemUpdate, isOpen, dismissing, dismiss } = useSystemUpdate({ enabled });

  if (!enabled) return null;

  return (
    <SystemUpdateModal
      open={isOpen}
      title={systemUpdate?.title ?? null}
      version={systemUpdate?.version ?? null}
      publishedAt={systemUpdate?.publishedAt ?? null}
      audiences={systemUpdate?.audiences ?? []}
      isSuperAdmin={user?.role === "SUPERADMIN"}
      dismissing={dismissing}
      onDismiss={dismiss}
    />
  );
}
