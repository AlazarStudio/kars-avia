import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "./useDebounce";
import { geocodeByTextRU } from "../../graphQL_requests";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

/**
 * Подсказки адресов по тексту с защитой от гонок и лишних запросов.
 *
 * Единственный владелец запросов подсказок. Каждый запрос получает номер поколения;
 * ответ, вернувшийся после смены поколения, отбрасывается и не пишет состояние —
 * поэтому устаревший список не может перетереть свежий.
 *
 * Начальный query считается уже принятым: хук ищет только то, что пользователь изменил сам.
 * Иначе поле, смонтированное с готовым адресом (редактирование заявки), само себя искало бы
 * и открывало выпадашку без нажатия клавиш — useDebounce отдаёт value сразу, без задержки.
 *
 * anchor — координаты ПОДТВЕРЖДЁННОГО адреса. Если якоря нет, center не передаётся вовсе,
 * и geocodeByTextRU уходит в ветку поиска по всей России (один запрос вместо пяти
 * вокруг случайного центра с жёстким rspn=1).
 *
 * @param {string} query - текущий текст
 * @param {[number, number]|null} anchor - координаты подтверждённого адреса
 */
export function useAddressSuggestions(query, anchor) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const genRef = useRef(0);
  const acceptedRef = useRef((query || "").trim());
  const anchorRef = useRef(anchor);

  // якорь влияет на СЛЕДУЮЩИЙ запрос, а не переигрывает текущий, поэтому он читается
  // через реф и не стоит в зависимостях эффекта поиска. Иначе смена якоря (например,
  // после клика по подсказке) перезапускала бы поиск по ещё не продебаунсенному
  // старому тексту и снова открывала список поверх заполненного поля.
  useEffect(() => {
    anchorRef.current = anchor;
  }, [anchor]);

  /**
   * «Значение принято» — закрыть список и не открывать его заново по этому же тексту.
   * Аргумент обязателен: в момент клика по подсказке query в замыкании ещё старый
   * (setQuery до перерисовки не виден), и без явного значения сюда попал бы огрызок ввода.
   *
   * Значение хранится нормализованным (trim) и сравнивается с trim() от debouncedQuery:
   * потребитель — контролируемый инпут, текст проходит через родителя, и гард обязан
   * пережить лишние пробелы по краям.
   */
  const accept = useCallback((value) => {
    genRef.current += 1; // летящие ответы становятся устаревшими
    acceptedRef.current = (value || "").trim();
    setSuggestions([]);
    setLoading(false);
    setNotFound(false);
  }, []);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < MIN_QUERY_LENGTH) {
      genRef.current += 1;
      setSuggestions([]);
      setLoading(false);
      setNotFound(false);
      return;
    }

    // уже принято — не ищем и гасим всё летящее: запрос, стартовавший до принятия,
    // иначе доехал бы с совпадающим поколением и перезаписал список
    if (debouncedQuery.trim() === acceptedRef.current) {
      genRef.current += 1;
      setSuggestions([]);
      setLoading(false);
      setNotFound(false);
      return;
    }

    const gen = ++genRef.current;
    setLoading(true);
    setNotFound(false);

    (async () => {
      let list = [];
      try {
        const currentAnchor = anchorRef.current;
        const options =
          currentAnchor && currentAnchor.length === 2
            ? { center: currentAnchor, initialRadiusKm: 20, maxRadiusKm: 80, stepKm: 20 }
            : undefined; // нет якоря → поиск по всей России
        list = await geocodeByTextRU(debouncedQuery, options);
      } catch (e) {
        console.error(e);
        list = [];
      }

      if (gen !== genRef.current) return; // устаревший ответ — выбрасываем

      setSuggestions(list);
      setLoading(false);
      setNotFound(list.length === 0);
    })();

    return () => {
      genRef.current += 1; // смена запроса / размонтирование — летящее в утиль
    };
  }, [debouncedQuery]);

  return { suggestions, loading, notFound, accept };
}
