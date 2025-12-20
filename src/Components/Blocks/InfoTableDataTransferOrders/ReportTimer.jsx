import React, { useState, useEffect } from "react";
import classes from "./InfoTableDataTransferOrders.module.css";

// Функция для форматирования обратного отсчета времени
const formatTimeRemaining = (ms) => {
  if (ms < 0) return null; // Время уже прошло
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м ${seconds}с`;
  } else if (minutes > 0) {
    return `${minutes}м ${seconds}с`;
  } else {
    return `${seconds}с`;
  }
};

// Компонент обратного отсчета для отчета
const ReportTimer = ({ item }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [color, setColor] = useState("#3B6C54");

  useEffect(() => {
    const scheduledTime = item.scheduledPickupAt
      ? new Date(item.scheduledPickupAt)
      : null;
    const finishedAt = item.finishedAt ? new Date(item.finishedAt) : null;
    const isCompleted = item.status === "COMPLETED" || finishedAt;

    // Если заявка завершена - показываем "Отчет" зеленым
    if (isCompleted) {
      setTimeRemaining("Отчет");
      setColor("#3B6C54");
      return;
    }

    // Если нет времени начала - не показываем индикатор
    if (!scheduledTime) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const timeDiff = scheduledTime.getTime() - now.getTime();
      const twoHoursInMs = 2 * 60 * 60 * 1000;

      if (timeDiff < 0) {
        // Время уже прошло
        setTimeRemaining("Просрочен");
        setColor("var(--red)");
      } else if (timeDiff < twoHoursInMs) {
        // Менее 2 часов - красный таймер
        setTimeRemaining(formatTimeRemaining(timeDiff));
        setColor("var(--red)");
      } else {
        // Больше 2 часов - зеленый таймер
        setTimeRemaining(formatTimeRemaining(timeDiff));
        setColor("#4caf50");
      }
    };

    // Обновляем сразу
    updateTimer();

    // Обновляем каждую секунду
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [item.scheduledPickupAt, item.finishedAt, item.status]);

  if (!timeRemaining) return null;

  return (
    <div
      className={classes.reportIndicator}
      style={{ color: color }}
    >
      {timeRemaining}
    </div>
  );
};

export default ReportTimer;

