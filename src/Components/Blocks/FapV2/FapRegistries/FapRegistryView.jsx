import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import classes from "./FapRegistryView.module.css";
import {
  GET_PASSENGER_SERVICE_REGISTRY,
  REBUILD_PASSENGER_SERVICE_REGISTRY,
  DELETE_PASSENGER_SERVICE_REGISTRY,
  SUBMIT_PASSENGER_SERVICE_REGISTRY,
  UNSUBMIT_PASSENGER_SERVICE_REGISTRY,
  SET_PASSENGER_SERVICE_REGISTRY_AIRLINE_APPROVED,
  convertToDate,
  getCookie,
} from "../../../../../graphQL_requests";
import Header from "../../Header/Header";
import MUILoader from "../../MUILoader/MUILoader";
import MUISwitch from "../../MUISwitch/MUISwitch";
import FapOverflowMenu from "../FapOverflowMenu/FapOverflowMenu";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";
import FapAirlineCommentNote from "../FapAirlineCommentNote/FapAirlineCommentNote";
import FapRegistryStageChip from "./FapRegistryStageChip";
import FapRegistryCreateSidebar from "./FapRegistryCreateSidebar";
import { useDialog } from "../../../../contexts/DialogContext";
import { useToast } from "../../../../contexts/ToastContext";
import { apolloErrorText } from "../../../../utils/apolloErrorText.js";
import { formatDateTime } from "../fapConstants";
import { registryKindLabel } from "../fapRegistryStages";
import { registryColumns, registryMoney as money } from "../fapRegistryColumns";
import { registryMenuActions } from "../fapRegistryMenu";
import { downloadRegistryWorkbook } from "../reports/buildRegistrySheets.js";
import {
  isAirlineRole,
  isDispatcherRole,
  isSuperAdmin,
} from "../../../../utils/access";
import DownloadIcon from "../../../../shared/icons/DownloadIcon";
import EditIcon from "../../../../shared/icons/EditIcon";

export default function FapRegistryView({ id, user, canManage, onClose }) {
  const token = getCookie("token");
  const auth = { context: { headers: { Authorization: `Bearer ${token}` } } };
  const { confirm } = useDialog();
  const { success, error: notifyError } = useToast();
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const isDispatcher = isSuperAdmin(user) || isDispatcherRole(user);
  const isAirline = isAirlineRole(user);
  const [internal, setInternal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_PASSENGER_SERVICE_REGISTRY, {
    ...auth,
    variables: { id },
    fetchPolicy: "network-only",
  });
  // Последний успешно загруженный снимок: сбой refetch() обнуляет data, и без
  // запоминания карточка после успешной мутации ушла бы в вечный лоадер.
  const loadedRef = useRef(null);
  if (data?.passengerServiceRegistry) loadedRef.current = data.passengerServiceRegistry;
  const registry = data?.passengerServiceRegistry ?? loadedRef.current;

  // Битый или чужой id — тост и назад к списку, без второго тоста при ремаунте.
  // Сетевая/серверная ошибка — не то же самое, что «реестра нет»: текст ошибки
  // информативнее и не вводит в заблуждение при временном сбое сети.
  // Закрывает только неудача ПЕРВОЙ загрузки (loadedRef ещё пуст): сбой refetch()
  // из run() уже после успешной мутации показывает тост оттуда, карточка остаётся
  // с прежними строками.
  const closedRef = useRef(false);
  useEffect(() => {
    if (loading || closedRef.current || loadedRef.current) return;
    if (error) {
      closedRef.current = true;
      notifyError(apolloErrorText(error));
      onClose();
    } else if (!registry) {
      closedRef.current = true;
      notifyError("Реестр не найден");
      onClose();
    }
  }, [loading, error, registry, notifyError, onClose]);

  const [rebuild] = useMutation(REBUILD_PASSENGER_SERVICE_REGISTRY, auth);
  const [remove] = useMutation(DELETE_PASSENGER_SERVICE_REGISTRY, auth);
  const [submit] = useMutation(SUBMIT_PASSENGER_SERVICE_REGISTRY, auth);
  const [unsubmit] = useMutation(UNSUBMIT_PASSENGER_SERVICE_REGISTRY, auth);
  const [setApproved] = useMutation(SET_PASSENGER_SERVICE_REGISTRY_AIRLINE_APPROVED, auth);

  // refresh: false — после удаления перечитывать нечего, иначе поверх «Реестр
  // удалён» ляжет ошибка отсутствующей записи.
  const run = async (fn, okText, { refresh = true } = {}) => {
    try {
      setBusy(true);
      await fn();
      if (okText) success(okText);
      if (refresh) await refetch();
      return true;
    } catch (e) {
      notifyError(apolloErrorText(e));
      return false;
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const download = async (withInternal) => {
    try {
      await downloadRegistryWorkbook(registry, { internal: withInternal });
    } catch (e) {
      notifyError("Ошибка экспорта");
      console.error(e);
    }
  };

  if (loading || !registry) {
    return (
      <div className={classes.loader}>
        <MUILoader fullHeight="60vh" />
      </div>
    );
  }

  const stage = registry.stage;
  const approved = stage === "APPROVED";
  const submitted = Boolean(registry.submittedAt);
  const columns = registryColumns(registry.kind, { internal: isDispatcher && internal });
  const rows = registry.rows ?? [];
  const missingPrice =
    registry.kind === "BAGGAGE" ? rows.filter((r) => r.price == null).length : 0;
  const city = registry.airport?.city ?? "";
  const comment = registry.airlineComment
    ? { text: registry.airlineComment, at: registry.airlineCommentAt }
    : null;

  // Что умеет каждое действие; кто и на какой стадии его видит — registryMenuActions.
  const ACTIONS = {
    rebuild: {
      label: "Пересобрать",
      onClick: () => run(() => rebuild({ variables: { id } }), "Строки пересобраны"),
    },
    editHeader: {
      label: "Изменить шапку",
      icon: EditIcon,
      onClick: () => setShowEdit(true),
    },
    submit: {
      label: "Отправить АК",
      onClick: () => run(() => submit({ variables: { id } }), "Отправлено авиакомпании"),
    },
    unsubmit: {
      label: "Отозвать отправку",
      onClick: () => run(() => unsubmit({ variables: { id } }), "Отправка отозвана"),
    },
    downloadInternal: {
      label: "Скачать книгу",
      icon: DownloadIcon,
      onClick: () => download(true),
    },
    download: {
      label: "Скачать",
      icon: DownloadIcon,
      onClick: () => download(false),
    },
    delete: {
      label: "Удалить",
      tone: "danger",
      onClick: async () => {
        if (!(await confirm("Удалить реестр? Действие необратимо."))) return;
        const ok = await run(() => remove({ variables: { id } }), "Реестр удалён", {
          refresh: false,
        });
        if (!ok) return;
        closedRef.current = true;
        onClose();
      },
    },
    approve: {
      label: "Утвердить",
      onClick: async () => {
        if (!(await confirm("Утвердить реестр?"))) return;
        run(() => setApproved({ variables: { id, approved: true } }), "Реестр утверждён");
      },
    },
    revokeApproval: {
      label: "Отозвать утверждение",
      tone: "danger",
      onClick: () => setRevokeOpen(true),
    },
    returnForRework: {
      label: "Вернуть на доработку",
      tone: "danger",
      onClick: () => setRevokeOpen(true),
    },
  };

  const menuItems = registryMenuActions({
    submitted,
    approved,
    isDispatcher,
    isAirline,
    canManage,
  }).map((key) => (key === "sep" ? { sep: true } : ACTIONS[key]));

  return (
    <>
      <Header>
        <div className={classes.headerNav}>
          <button className={classes.backBtn} onClick={onClose} aria-label="К списку">
            <img src="/arrow.png" alt="" />
          </button>
          <span className={classes.headerNavTitle}>
            Реестр №{registry.number} — {registryKindLabel(registry.kind)}
          </span>
        </div>
      </Header>

      <div className={classes.card}>
        <div className={classes.head}>
          <div className={classes.headText}>
            <div className={classes.title}>
              {registry.airline?.nameFull || registry.airline?.name}
              {city ? `, г. ${city}` : ""}
            </div>
            <div className={classes.sub}>
              Период {convertToDate(registry.periodStart)} — {convertToDate(registry.periodEnd)} ·
              строк {registry.totals?.rowsCount ?? 0}
              {missingPrice > 0 && (
                <span className={classes.warn}> · без цены: {missingPrice}</span>
              )}
            </div>
            <div className={classes.steps}>
              <FapRegistryStageChip registry={registry} />
              {registry.submittedAt && (
                <span className={classes.stepDate}>
                  отправлен {formatDateTime(registry.submittedAt)}
                </span>
              )}
              {registry.airlineApprovedAt && (
                <span className={classes.stepDate}>
                  утверждён {formatDateTime(registry.airlineApprovedAt)}
                </span>
              )}
            </div>
          </div>
          <div className={classes.headRight}>
            {isDispatcher && (
              <MUISwitch
                label="Внутренние колонки"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
              />
            )}
            <FapOverflowMenu
              items={menuItems.map((i) => (i.sep ? i : { ...i, disabled: busy }))}
            />
          </div>
        </div>

        <FapAirlineCommentNote
          comment={comment}
          revoked={stage === "RETURNED"}
          isAirlineViewer={isAirline}
          entityLabel="реестра"
          revokedTitle={
            isAirline ? "Вы вернули реестр на доработку" : "Авиакомпания вернула реестр на доработку"
          }
        />

        <div className={classes.tableWrap}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th>п/п</th>
                {columns.map((c) => (
                  <th key={c.key} className={c.money ? classes.right : ""}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={`${r.requestId}-${r.tripId ?? r.serviceKind}-${i}`}
                  className={[
                    registry.kind === "BAGGAGE" && r.price == null ? classes.rowWarn : "",
                    r.requestId ? classes.rowLink : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={
                    r.requestId
                      ? () => window.open(`/far/${r.requestId}`, "_blank", "noopener")
                      : undefined
                  }
                  title={r.requestId ? "Открыть заявку в новой вкладке" : undefined}
                >
                  <td>{i + 1}</td>
                  {columns.map((c) => (
                    <td key={c.key} className={c.money ? classes.right : ""}>
                      {c.get ? c.get(r) : (r[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className={classes.empty}>
                    Строк нет — в периоде нет доставок или поставок
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={columns.length + 1} className={classes.totals}>
                  Итого для АК: <strong>{money(registry.totals?.airlineTotal)}</strong>
                  {isDispatcher && internal && (
                    <>
                      {" "}
                      · внутренняя стоимость:{" "}
                      <strong>{money(registry.totals?.internalCost)}</strong> · разница:{" "}
                      <strong>
                        {money(
                          (registry.totals?.airlineTotal ?? 0) -
                            (registry.totals?.internalCost ?? 0),
                        )}
                      </strong>
                    </>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <FapDestructiveModal
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onConfirm={async (reason) => {
          const ok = await run(
            () => setApproved({ variables: { id, approved: false, comment: reason } }),
            approved ? "Утверждение отозвано" : "Реестр возвращён на доработку",
          );
          if (ok) setRevokeOpen(false);
        }}
        title={approved ? "Отозвать утверждение реестра" : "Вернуть реестр на доработку"}
        description="Диспетчер получит причину и исправит реестр."
        reasonLabel="Причина"
        placeholder="Что исправить…"
        confirmText={approved ? "Отозвать" : "Вернуть"}
        cancelText="Отмена"
        saving={busy}
      />

      {isDispatcher && canManage && (
        <FapRegistryCreateSidebar
          show={showEdit}
          onClose={() => setShowEdit(false)}
          airlines={[]}
          airports={[]}
          registry={registry}
          onUpdated={() => {
            setShowEdit(false);
            refetch();
          }}
        />
      )}
    </>
  );
}
