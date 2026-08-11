import { useCallback, useEffect, useRef, useState } from "react";

/** Сколько строка держится в выборке после того, как из неё ушёл курсор. */
export const PIN_GRACE_MS = 1500;

/**
 * Удерживает в отображаемой выборке строки, которые пользователь правит прямо
 * сейчас, даже если они перестали подходить под текущий фильтр.
 *
 * Задача, которую это решает: на вкладке «Предупреждения» лежат строки без
 * цены (`rowNeedsPrice` — есть сутки, но цена не проставлена). Как только в
 * поле цены появляется первая же цифра, условие перестаёт выполняться, строка
 * выпадает из выборки и исчезает с экрана — посреди набора «2500», на цифре
 * «2». То же самое на вкладке «Изменено», только наоборот.
 *
 * Одного `debounce` на значении для этого мало: пауза лишь отодвигает исчезание
 * на те же несколько сотен миллисекунд, а курсор в этот момент всё ещё в поле.
 * Поэтому закрепление держится двумя разными способами:
 *
 * - `hold` / `release` — пока курсор в поле строки, она закреплена без срока.
 *   Человек может думать сколько угодно, строка никуда не денется;
 * - `pin` + таймер — после ухода курсора строка живёт ещё `graceMs`, чтобы
 *   переход к соседнему полю той же строки не считался уходом.
 *
 * `clear` вызывается, когда пользователь сам пересобрал выборку (сменил фильтр
 * или поиск): там закрепления только мешали бы.
 *
 * @param {number} graceMs - сколько держать строку после ухода курсора
 * @returns {{pinned: Set<number>, pin: Function, hold: Function, release: Function, clear: Function}}
 */
export default function useEditingPins(graceMs = PIN_GRACE_MS) {
  const [pinned, setPinned] = useState(() => new Set());
  const timerRef = useRef(null);
  // Курсор внутри поля: пока true, таймер не заводится вообще.
  const holdingRef = useRef(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Пустой Set вместо нового при уже пустом состоянии — чтобы не гонять
  // перерисовку таблицы на 227 строк там, где ничего не изменилось.
  const dropAll = useCallback(() => {
    setPinned((prev) => (prev.size ? new Set() : prev));
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      dropAll();
    }, graceMs);
  }, [graceMs, dropAll, stopTimer]);

  const add = useCallback((uid) => {
    setPinned((prev) => (prev.has(uid) ? prev : new Set(prev).add(uid)));
  }, []);

  const pin = useCallback(
    (uid) => {
      add(uid);
      if (!holdingRef.current) startTimer();
    },
    [add, startTimer]
  );

  const hold = useCallback(
    (uid) => {
      holdingRef.current = true;
      stopTimer();
      add(uid);
    },
    [add, stopTimer]
  );

  const release = useCallback(() => {
    holdingRef.current = false;
    startTimer();
  }, [startTimer]);

  const clear = useCallback(() => {
    holdingRef.current = false;
    stopTimer();
    dropAll();
  }, [dropAll, stopTimer]);

  useEffect(() => stopTimer, [stopTimer]);

  return { pinned, pin, hold, release, clear };
}
