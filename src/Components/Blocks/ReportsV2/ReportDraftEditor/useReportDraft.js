import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_REPORT_DRAFT,
  UPDATE_REPORT_DRAFT,
  CONFIRM_REPORT_DRAFT,
  SUBMIT_AIRLINE_REPORT_DRAFT,
  UNSUBMIT_AIRLINE_REPORT_DRAFT,
  DELETE_REPORT_DRAFT,
  RECREATE_REPORT_DRAFT,
  getCookie,
} from "../../../../../graphQL_requests";
import {
  DRAFT_ROW_FIELDS,
  attachRowKeys,
  prepareRowsForSave,
  recalcRow,
  rowsEqual,
  sumTotalDebt,
} from "../reportDraftRows";

// Типы редактируемых полей: число приводится к Number (пустое — null, как и
// раньше), счётчики питания — к целому (GraphQL Int отверг бы 2.5), текст
// уходит строкой как есть, «заморозка» — булево.
const NUMERIC_FIELDS = new Set([
  "totalDays",
  "pricePerDay",
  "totalMealCost",
  "breakfastCount",
  "lunchCount",
  "dinnerCount",
]);
const INTEGER_FIELDS = new Set(["breakfastCount", "lunchCount", "dinnerCount"]);

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
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [unsubmitting, setUnsubmitting] = useState(false);
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

  // «Правлено» — ПРОИЗВОДНАЯ от данных, а не пометка по факту клика: строка
  // считается правленой, пока хоть одно её поле расходится со snapshot.
  // Раньше пометка ставилась в setCell и не снималась — правка «туда-обратно»
  // (3 → 3,5 → 3) навсегда оставляла чип «Изменено». Сравнение по контрактным
  // полям, как в rowsEqual; ?? null уравнивает undefined и null.
  const editedUids = useMemo(() => {
    const snapByUid = new Map(snapshot.map((row) => [row._uid, row]));
    const out = new Set();
    for (const row of rows) {
      const snapRow = snapByUid.get(row._uid);
      if (!snapRow) continue;
      for (const key of DRAFT_ROW_FIELDS) {
        if ((row[key] ?? null) !== (snapRow[key] ?? null)) {
          out.add(row._uid);
          break;
        }
      }
    }
    return out;
  }, [rows, snapshot]);

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
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => {
        if (row._uid !== uid) return row;

        let value = rawValue;
        if (field === "frozen") {
          value = Boolean(rawValue);
        } else if (NUMERIC_FIELDS.has(field)) {
          value =
            rawValue === "" || rawValue === null || rawValue === undefined
              ? null
              : Number(rawValue);
          if (INTEGER_FIELDS.has(field) && value !== null) {
            value = Math.round(value);
          }
        } else {
          // Текстовые поля (ФИО, даты, категория, комната, должность) —
          // строкой как есть: бэк хранит их строками без разбора.
          value = rawValue ?? "";
        }

        const next = { ...row, [field]: value };
        // Пересчёт производных — ТОЛЬКО от полей, из которых они считаются.
        // recalcRow на любом поле переписал бы «Стоимость проживания»
        // произведением «сутки × цена» и у строк с подселением, где бэк
        // делил стоимость номера по сегментам.
        if (field === "totalDays" || field === "pricePerDay") {
          return recalcRow(next);
        }
        if (field === "totalMealCost") {
          return {
            ...next,
            totalDebt:
              (Number(next.totalLivingCost) || 0) + (Number(value) || 0),
          };
        }
        return next;
      }),
    }));
  }, []);

  // Применяет к строке ГОТОВЫЙ патч из нескольких полей разом (пересчёты
  // дат/питания собирает вызывающий код в чистых хелперах — см.
  // applyDateChange/applyMealCountChange в reportDraftEditorUtils). Значения
  // приходят уже нормализованными, коэрция setCell здесь не выполняется.
  const setRowPatch = useCallback((uid, patch) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => (row._uid === uid ? { ...row, ...patch } : row)),
    }));
  }, []);

  const removeRow = useCallback((uid) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => row._uid !== uid),
    }));
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
  }, []);

  // Возвращает ВСЕ строки к snapshot: и правки полей, и удаления строк —
  // snapshot целиком заменяет rows.
  const resetAll = useCallback(() => {
    setState((prev) => ({ ...prev, rows: prev.snapshot.map((row) => ({ ...row })) }));
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

  // Значение поля в snapshot — для подсказки «Было: X» и отката одного поля.
  const snapshotValue = useCallback(
    (uid, field) => {
      const snapRow = snapshot.find((r) => r._uid === uid);
      return snapRow ? snapRow[field] : undefined;
    },
    [snapshot]
  );

  const [updateReportDraft] = useMutation(UPDATE_REPORT_DRAFT, { context: authContext });
  const [confirmReportDraft] = useMutation(CONFIRM_REPORT_DRAFT, { context: authContext });
  const [submitAirlineReportDraft] = useMutation(SUBMIT_AIRLINE_REPORT_DRAFT, {
    context: authContext,
  });
  const [unsubmitAirlineReportDraft] = useMutation(UNSUBMIT_AIRLINE_REPORT_DRAFT, {
    context: authContext,
  });
  const [recreateReportDraftMutation] = useMutation(RECREATE_REPORT_DRAFT, {
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

  // Отправка авиакомпании: тот же порядок, что и у подтверждения — сначала
  // сохранить. Бэк показывает АК строки из базы, а не то, что осталось в
  // редакторе, поэтому несохранённая правка уехала бы мимо адресата.
  //
  // Мутация возвращает id/status/submittedAt того же ReportDraft — Apollo
  // кладёт их в нормализованный кэш, и открытый редактор сам переезжает в
  // read-only состояние SUBMITTED, без отдельного рефетча.
  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      if (!rowsEqual(rows, snapshot)) {
        await save();
      }
      const { data: result } = await submitAirlineReportDraft({ variables: { id: draftId } });
      return result?.submitAirlineReportDraft;
    } finally {
      setSubmitting(false);
    }
  }, [rows, snapshot, save, draftId, submitAirlineReportDraft]);

  // Отзыв возвращает черновик в DRAFT — единственный способ снова его править
  // после отправки. Сохранять нечего: в SUBMITTED редактор read-only.
  const unsubmit = useCallback(async () => {
    setUnsubmitting(true);
    try {
      const { data: result } = await unsubmitAirlineReportDraft({ variables: { id: draftId } });
      return result?.unsubmitAirlineReportDraft;
    } finally {
      setUnsubmitting(false);
    }
  }, [draftId, unsubmitAirlineReportDraft]);

  // Пересоздание НА МЕСТЕ (recreateReportDraft): бэк собирает строки заново
  // из свежих заявок и СЛИВАЕТ ручные правки по «липким» полям, помечая
  // изменившиеся ячейки changedKeys. Прежняя пара «создать новый + удалить
  // старый» теряла правки и меняла id черновика (ломая ссылку на него) —
  // ровно то, о чём была задача №64. id не меняется, поэтому вызывающему
  // возвращается тот же draftId.
  const recreate = useCallback(async () => {
    setRecreating(true);
    try {
      // Пересборка сливает правки из БАЗЫ — несохранённое (в том числе только
      // что поставленные галочки «заморозить») сначала сохраняется, иначе
      // диалог обещает «правки сохранятся», а они молча пропали бы.
      if (!rowsEqual(rows, snapshot)) {
        await save();
      }
      const { data: result } = await recreateReportDraftMutation({
        variables: { id: draftId },
      });
      const nextRows = result?.recreateReportDraft?.rows;
      if (nextRows) {
        const next = attachRowKeys(nextRows);
        setState({ rows: next, snapshot: next });
      }
      return draftId;
    } finally {
      setRecreating(false);
    }
  }, [draftId, rows, snapshot, save, recreateReportDraftMutation]);

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
    submitting,
    unsubmitting,
    deleting,
    recreating,
    dirty,
    editedUids,
    total,
    serverTotal,
    deletedCount,
    setCell,
    setRowPatch,
    removeRow,
    resetRow,
    resetAll,
    fieldEdited,
    snapshotValue,
    save,
    confirmAndExport,
    submit,
    unsubmit,
    recreate,
    removeDraft,
  };
}
