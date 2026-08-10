import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_REPORT_DRAFT,
  UPDATE_REPORT_DRAFT,
  CONFIRM_REPORT_DRAFT,
  DELETE_REPORT_DRAFT,
  CREATE_AIRLINE_REPORT_DRAFT,
  CREATE_HOTEL_REPORT_DRAFT,
  getCookie,
} from "../../../../../graphQL_requests";
import {
  attachRowKeys,
  prepareRowsForSave,
  recalcRow,
  rowsEqual,
  sumTotalDebt,
} from "../reportDraftRows";

/**
 * Состояние и мутации редактора черновика отчёта. Весь GraphQL живёт здесь —
 * `ReportDraftEditor` только рендерит то, что возвращает хук.
 *
 * @param {string|null|undefined} draftId - id черновика (`ReportDraft.id`)
 */
export default function useReportDraft(draftId) {
  const token = getCookie("token");
  const authContext = { headers: { Authorization: `Bearer ${token}` } };

  // rows и snapshot живут в одном стейте: та же схема, что и в
  // ReportRulesSidebar. cache-and-network отвечает дважды (кэш, потом сеть),
  // и внутри функционального апдейтера нужно синхронно сравнить актуальные
  // rows с актуальным snapshot — без гонки между двумя отдельными setState.
  const [state, setState] = useState({ rows: [], snapshot: [] });
  const { rows, snapshot } = state;
  const [editedUids, setEditedUids] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [recreating, setRecreating] = useState(false);

  const { data, loading } = useQuery(GET_REPORT_DRAFT, {
    variables: { id: draftId },
    skip: !draftId,
    fetchPolicy: "cache-and-network",
    context: authContext,
  });

  const draft = data?.reportDraft ?? null;

  // Смена draftId (компонент переиспользован для другого черновика без
  // размонтирования) — сбрасываем локальный стейт, иначе правки одного
  // черновика могли бы утечь в другой.
  useEffect(() => {
    setState({ rows: [], snapshot: [] });
    setEditedUids(new Set());
  }, [draftId]);

  // snapshot всегда подтягивается к самым свежим данным сервера. rows
  // подтягиваются вместе с ним, только если пользователь ещё ничего не
  // поправил (rows на данный момент равны своему snapshot). Если правки уже
  // есть — локальные rows не трогаем, иначе второй ответ cache-and-network
  // молча затрёт то, что человек только что ввёл.
  useEffect(() => {
    if (!draft) return;
    const next = attachRowKeys(draft.rows);
    setState((prev) => {
      const userEdited = !rowsEqual(prev.rows, prev.snapshot);
      return { rows: userEdited ? prev.rows : next, snapshot: next };
    });
  }, [draft]);

  const dirty = !rowsEqual(rows, snapshot);
  const total = sumTotalDebt(rows);

  // "Расчёт сервера" — сумма по snapshot. ВАЖНО: после успешного save()
  // snapshot переезжает на только что сохранённые значения (см. save() ниже),
  // поэтому serverTotal/resetRow/resetAll после сохранения возвращают к
  // последнему СОХРАНЁННОМУ состоянию, а не к тому, что бэк насчитал при
  // создании черновика. Это осознанное и честное поведение: "откат" — это
  // отказ от ещё не сохранённых правок, а не путешествие к первоначальному
  // снимку, который уже потерял актуальность в тот момент, когда его в
  // последний раз сохранили поверх.
  const serverTotal = sumTotalDebt(snapshot);
  const deletedCount = snapshot.length - rows.length;

  // Правит одно поле одной строки и пересчитывает производные ТОЛЬКО у неё
  // (см. JSDoc recalcRow в reportDraftRows.js: бэк при совместном проживании
  // делит стоимость номера между жильцами по временным сегментам, и наивный
  // пересчёт остальных строк переписал бы суммы людям, которых никто не
  // редактировал).
  const setCell = useCallback((uid, field, rawValue) => {
    const value =
      rawValue === "" || rawValue === null || rawValue === undefined
        ? null
        : Number(rawValue);
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((row) =>
        row._uid === uid ? recalcRow({ ...row, [field]: value }) : row
      ),
    }));
    setEditedUids((prev) => (prev.has(uid) ? prev : new Set(prev).add(uid)));
  }, []);

  const removeRow = useCallback((uid) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => row._uid !== uid),
    }));
    setEditedUids((prev) => {
      if (!prev.has(uid)) return prev;
      const next = new Set(prev);
      next.delete(uid);
      return next;
    });
  }, []);

  // Возвращает одну строку к значениям из snapshot (по _uid) и снимает с неё
  // пометку "правлена". Ничего не делает для строки, которой уже нет в rows
  // (удалённая строка отменяется через resetAll, а не через это) — .map
  // просто не найдёт совпадение и молча пропустит.
  const resetRow = useCallback((uid) => {
    setState((prev) => {
      const snapRow = prev.snapshot.find((row) => row._uid === uid);
      if (!snapRow) return prev;
      return {
        ...prev,
        rows: prev.rows.map((row) => (row._uid === uid ? { ...snapRow } : row)),
      };
    });
    setEditedUids((prev) => {
      if (!prev.has(uid)) return prev;
      const next = new Set(prev);
      next.delete(uid);
      return next;
    });
  }, []);

  // Возвращает ВСЕ строки к snapshot: и правки полей, и удаления строк —
  // snapshot целиком заменяет rows.
  const resetAll = useCallback(() => {
    setState((prev) => ({ ...prev, rows: prev.snapshot.map((row) => ({ ...row })) }));
    setEditedUids(new Set());
  }, []);

  // Сравнивает одно поле строки с тем же полем той же строки (по _uid) в
  // snapshot — нужно, чтобы подсветить точкой конкретное правленое поле, а не
  // всю строку целиком.
  const fieldEdited = useCallback(
    (row, field) => {
      const snapRow = snapshot.find((r) => r._uid === row?._uid);
      if (!snapRow) return false;
      return row?.[field] !== snapRow[field];
    },
    [snapshot]
  );

  const [updateReportDraft] = useMutation(UPDATE_REPORT_DRAFT, { context: authContext });
  const [confirmReportDraft] = useMutation(CONFIRM_REPORT_DRAFT, { context: authContext });
  const [createAirlineReportDraft] = useMutation(CREATE_AIRLINE_REPORT_DRAFT, {
    context: authContext,
  });
  const [createHotelReportDraft] = useMutation(CREATE_HOTEL_REPORT_DRAFT, {
    context: authContext,
  });
  const [deleteReportDraft] = useMutation(DELETE_REPORT_DRAFT, { context: authContext });

  // Ошибки мутаций намеренно не глотаются: нет try/catch, только try/finally.
  // Если await бросит исключение, state не тронется (обновление rows/snapshot
  // ниже просто не выполнится), а вызывающий компонент получит исключение и
  // сам покажет тост — локальные правки при этом останутся на месте.
  const save = useCallback(async () => {
    setSaving(true);
    try {
      const { data: result } = await updateReportDraft({
        variables: { id: draftId, rows: prepareRowsForSave(rows) },
      });
      const savedRows = result?.updateReportDraft?.rows;
      if (savedRows) {
        const next = attachRowKeys(savedRows);
        setState({ rows: next, snapshot: next });
      }
      setEditedUids(new Set());
    } finally {
      setSaving(false);
    }
  }, [draftId, rows, updateReportDraft]);

  const confirmAndExport = useCallback(
    async (format = "xlsx") => {
      setConfirming(true);
      try {
        if (!rowsEqual(rows, snapshot)) {
          await save();
        }
        const { data: result } = await confirmReportDraft({
          variables: { id: draftId, format },
        });
        return result?.confirmReportDraft;
      } finally {
        setConfirming(false);
      }
    },
    [rows, snapshot, save, draftId, confirmReportDraft]
  );

  // Пересоздание: сначала создаём новый черновик из исходного снимка
  // фильтра, и только при успехе удаляем старый. Обратный порядок оставил бы
  // пользователя без обоих черновиков при сбое создания.
  const recreate = useCallback(async () => {
    setRecreating(true);
    try {
      const snap = draft?.filterJson || {};
      const input = {
        filter: {
          startDate: snap.startDate,
          endDate: snap.endDate,
          airlineId: snap.airlineId,
          hotelId: snap.hotelId,
          airportId: snap.airportId,
          personId: snap.personId,
          positionId: snap.positionId,
          position: snap.position,
          region: snap.region,
        },
        format: snap.format || "xlsx",
      };
      const createFilterInput = {
        meal: snap.meal !== false,
        living: snap.living !== false,
      };

      const createMutation =
        draft?.type === "AIRLINE" ? createAirlineReportDraft : createHotelReportDraft;
      const { data: created } = await createMutation({ variables: { input, createFilterInput } });
      const newId =
        created?.createAirlineReportDraft?.id || created?.createHotelReportDraft?.id;

      await deleteReportDraft({ variables: { id: draftId } });
      return newId;
    } finally {
      setRecreating(false);
    }
  }, [draft, draftId, createAirlineReportDraft, createHotelReportDraft, deleteReportDraft]);

  const removeDraft = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteReportDraft({ variables: { id: draftId } });
    } finally {
      setDeleting(false);
    }
  }, [draftId, deleteReportDraft]);

  return {
    draft,
    rows,
    loading,
    saving,
    confirming,
    deleting,
    recreating,
    dirty,
    editedUids,
    total,
    serverTotal,
    deletedCount,
    setCell,
    removeRow,
    resetRow,
    resetAll,
    fieldEdited,
    save,
    confirmAndExport,
    recreate,
    removeDraft,
  };
}
