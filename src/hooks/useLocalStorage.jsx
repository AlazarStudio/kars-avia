import { useState, useEffect } from "react";

export function useLocalStorage(key, defaultValue) {
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === key) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key]);

  const setValue = (val) => {
    localStorage.setItem(key, JSON.stringify(val));
    setState(val);
  };

  return [state, setValue];
}

// const [menuOpen, setMenuOpen] = useState(() => {
//   return JSON.parse(localStorage.getItem("menuOpen")) ?? true;
// });
// useEffect(() => {
//   const updateState = () => {
//     setMenuOpen(JSON.parse(localStorage.getItem("menuOpen")));
//   };

//   // Отслеживание изменений localStorage в других вкладках
//   window.addEventListener("storage", updateState);

//   // Перехват изменений в текущей вкладке
//   const originalSetItem = localStorage.setItem;
//   localStorage.setItem = function (key, value) {
//     originalSetItem.apply(this, arguments);
//     if (key === "menuOpen") {
//       updateState(); // Обновляем состояние
//     }
//   };

//   return () => {
//     window.removeEventListener("storage", updateState);
//     localStorage.setItem = originalSetItem; // Возвращаем исходный метод
//   };
// }, []);
// console.log(menuOpen);
