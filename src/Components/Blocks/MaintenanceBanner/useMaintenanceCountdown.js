import { useEffect, useState } from "react";

// Возвращает оставшееся время до endsAt в миллисекундах.
// null — таймер не нужен (endsAt не задан).
export function useMaintenanceCountdown(endsAt) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    if (!endsAt) {
      setLeft(null);
      return;
    }

    const end = new Date(endsAt).getTime();

    const tick = () => {
      const diff = end - Date.now();
      setLeft(diff > 0 ? diff : 0);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return left;
}

// Форматирование миллисекунд в строку обратного отсчёта.
// >24ч → "Dд HH:MM:SS", иначе "HH:MM:SS".
export function formatCountdown(ms) {
  if (ms == null) return "";

  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, "0");
  const time = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return days > 0 ? `${days}д ${time}` : time;
}
