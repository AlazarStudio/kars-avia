import { useEffect, useRef } from "react";
import { convertToDate } from "../../graphQL_requests";

function buildNotificationParams(notification) {
  if (!notification) return null;

  const typename = notification.__typename;

  if (typename === "RequestCreatedNotification") {
    const airline = notification.airline?.name ?? "Авиакомпания";
    const arrival = notification.arrival
      ? convertToDate(notification.arrival, true)
      : "—";
    return {
      title: "Новая заявка",
      body: `${airline} · заезд ${arrival}`,
    };
  }

  if (typename === "ExtendRequestNotification") {
    const airline = notification.airline?.name ?? "Авиакомпания";
    const newEnd = notification.newEnd
      ? convertToDate(notification.newEnd, true)
      : "—";
    return {
      title: "Продление заявки",
      body: `${airline} · до ${newEnd}`,
    };
  }

  if (typename === "ReserveCreatedNotification") {
    const airline = notification.airline?.name ?? "Авиакомпания";
    const arrival = notification.arrival
      ? convertToDate(notification.arrival, true)
      : "—";
    return {
      title: "Новый резерв",
      body: `${airline} · заезд ${arrival}`,
    };
  }

  if (typename === "ReserveUpdatedNotification") {
    const airline = notification.airline?.name ?? "Авиакомпания";
    return {
      title: "Резерв обновлён",
      body: `${airline}`,
    };
  }

  if (typename === "MessageSentNotification") {
    return {
      title: "Новое сообщение",
      body: notification.text ?? "",
    };
  }

  return null;
}

export function useBrowserNotifications() {
  const permissionRef = useRef(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        permissionRef.current = p;
      });
    } else {
      permissionRef.current = Notification.permission;
    }
  }, []);

  function notify(notificationPayload) {
    if (typeof Notification === "undefined") return;
    if (permissionRef.current !== "granted") return;

    const params = buildNotificationParams(notificationPayload);
    if (!params) return;

    const n = new Notification(params.title, {
      body: params.body,
      icon: "/favicon.ico",
      tag: `karsavia-${notificationPayload.__typename}-${
        notificationPayload.requestId ??
        notificationPayload.reserveId ??
        notificationPayload.chat?.id ??
        Date.now()
      }`,
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
  }

  return { notify };
}
