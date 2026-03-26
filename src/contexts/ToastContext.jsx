import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import Notification from "../Components/Notification/Notification.jsx";
import { fullNotifyTime, notifyTime } from "../roles.js";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((text, status = "success") => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  }, []);

  const value = useMemo(
    () => ({
      notify,
      success: (text) => notify(text, "success"),
      error: (text) => notify(text, "error"),
      warning: (text) => notify(text, "warning"),
      info: (text) => notify(text, "info"),
    }),
    [notify]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {notifications.map((n, index) => (
        <Notification
          key={n.id}
          text={n.text}
          status={n.status}
          index={index}
          time={notifyTime}
          onClose={() => {
            setNotifications((prev) =>
              prev.filter((notif) => notif.id !== n.id)
            );
          }}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
