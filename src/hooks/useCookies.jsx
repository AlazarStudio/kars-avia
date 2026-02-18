import { useState, useEffect } from 'react';

export const useCookies = () => {
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // Добавляем флаг инициализации

  useEffect(() => {
    // Проверяем, было ли уже принято соглашение
    const accepted = localStorage.getItem('cookiesAccepted');
    if (accepted === 'true') {
      setCookiesAccepted(true);
    }
    setIsInitialized(true); // Помечаем, что инициализация завершена
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setCookiesAccepted(true);
    // initializeAnalytics();
  };

  const initializeAnalytics = () => {
    console.log('Analytics initialized');
  };

  return {
    cookiesAccepted,
    acceptCookies,
    isInitialized // Возвращаем флаг инициализации
  };
};