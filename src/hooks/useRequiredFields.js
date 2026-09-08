import { useEffect, useState } from "react";

// Селектор первого «горящего» элемента формы: подпись / нативный инпут / поле MUI
export const INVALID_SELECTOR = ".fieldInvalid, .inputInvalid, .Mui-error";

// Пусто: null, undefined, "", []. 0 и false — заполнено.
export function isEmptyValue(value) {
  if (value == null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function getMissingKeys(values, requiredKeys) {
  return requiredKeys.filter((key) => isEmptyValue(values?.[key]));
}

// values — состояние формы; requiredKeys — обязательные СЕЙЧАС ключи;
// containerRef — где искать первое невалидное поле (по умолчанию document).
function useRequiredFields(values, requiredKeys, containerRef) {
  const [attempt, setAttempt] = useState(0);
  const missing = getMissingKeys(values, requiredKeys);

  useEffect(() => {
    if (!attempt) return;
    const root = containerRef?.current ?? document;
    const target = root.querySelector(INVALID_SELECTOR);
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [attempt, containerRef]);

  const invalid = (key) => attempt > 0 && missing.includes(key);

  const validate = () => {
    if (missing.length === 0) return true;
    setAttempt((n) => n + 1);
    return false;
  };

  const reset = () => setAttempt(0);

  return { invalid, validate, reset };
}

export default useRequiredFields;
