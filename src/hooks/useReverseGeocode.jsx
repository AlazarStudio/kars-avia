import { useCallback, useEffect, useRef, useState } from "react";
import { reverseGeocodeByCoordsWithYmaps } from "../../graphQL_requests";

/**
 * Обратный геокодинг координат в адрес с защитой от гонок.
 *
 * Каждый вызов resolve() получает номер поколения. Ответ, вернувшийся после того,
 * как поколение сменилось (пользователь успел кликнуть по другой точке), отбрасывается
 * на входе и не пишет состояние. Это делает невозможным сценарий, где медленный ответ
 * по старой точке перетирает адрес новой.
 *
 * Если ymaps ещё не загрузился, координаты буферизуются и доигрываются, когда API появится.
 *
 * @param {object|null} ymaps - экземпляр ymaps (из onLoad карты); должен быть в state, не в рефе
 */
export function useReverseGeocode(ymaps) {
  const [state, setState] = useState({
    address: "",
    approximate: false,
    loading: false,
  });

  const genRef = useRef(0);
  const pendingRef = useRef(null);
  const ymapsRef = useRef(ymaps);

  const run = useCallback(async (coords, gen) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await reverseGeocodeByCoordsWithYmaps(ymapsRef.current, coords);
      if (gen !== genRef.current) return; // устаревший ответ — выбрасываем
      setState({
        address: res.address,
        approximate: res.approximate,
        loading: false,
      });
    } catch (e) {
      console.error(e);
      if (gen !== genRef.current) return;
      setState({ address: "", approximate: false, loading: false });
    }
  }, []);

  const resolve = useCallback(
    (coords) => {
      const gen = ++genRef.current;
      if (!ymapsRef.current) {
        pendingRef.current = coords; // API ещё не готов — запомним
        setState((s) => ({ ...s, loading: true }));
        return;
      }
      run(coords, gen);
    },
    [run]
  );

  const reset = useCallback(() => {
    genRef.current += 1; // все летящие ответы становятся устаревшими
    pendingRef.current = null;
    setState({ address: "", approximate: false, loading: false });
  }, []);

  // ymaps загрузился — доигрываем отложенные координаты
  useEffect(() => {
    ymapsRef.current = ymaps;
    if (!ymaps || !pendingRef.current) return;
    const coords = pendingRef.current;
    pendingRef.current = null;
    const gen = ++genRef.current;
    run(coords, gen);
  }, [ymaps, run]);

  return { ...state, resolve, reset };
}
