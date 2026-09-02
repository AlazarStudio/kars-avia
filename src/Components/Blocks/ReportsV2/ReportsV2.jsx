import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import classes from "./ReportsV2.module.css";
import Header from "../Header/Header";
import ReportsV2List from "./ReportsV2List/ReportsV2List";
import ReportDraftsPanel from "./ReportDraftsPanel/ReportDraftsPanel";
import ReportDraftEditor from "./ReportDraftEditor/ReportDraftEditor";
import ReportCreateSidebar from "./ReportCreateSidebar/ReportCreateSidebar";
import ReportRulesSidebar from "./ReportRulesSidebar/ReportRulesSidebar";
import MUITextField from "../MUITextField/MUITextField";
import Button from "../../Standart/Button/Button";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";
import { roles } from "../../../roles";
import { buildDraftByReport, splitDraftsByStatus } from "./releasedReports";
import { canDeleteReport } from "./reportsV2Access.js";
import {
  ARCHIVE_REPORT,
  convertToDate,
  convertToDateNew,
  decodeJWT,
  DELETE_REPORT,
  DELETE_REPORT_DRAFT,
  GET_AIRLINE_POSITIONS,
  GET_AIRLINE_REPORT,
  GET_AIRPORTS_RELAY,
  GET_HOTEL_REPORT,
  GET_REPORT_DRAFTS,
  GET_REPORTS_SUBSCRIPTION,
  getCookie,
  RESTORE_REPORT,
  UNSUBMIT_AIRLINE_REPORT_DRAFT,
} from "../../../../graphQL_requests";

// Ключ localStorage раздела — намеренно отличается от старого "isAirline"
// (занят разделом «Отчёты» v1), иначе переключатели типа объекта двух
// разделов будут сбивать друг друга.
const IS_AIRLINE_STORAGE_KEY = "reportsV2IsAirline";

// Архив наполняется двумя путями сразу: крон бэка уносит туда отчёты старше
// двух декад, и то же делает кнопка «В архив». Пустой архив без этого текста
// читался бы как потеря отчётов.
const ARCHIVE_EMPTY_TEXT =
  "В архиве пусто. Сюда попадают отчёты старше двух декад и убранные вручную.";

// Сборка раздела «Отчёты v2» из готовых дочерних компонентов: шапка, плашка
// черновиков, список готовых отчётов и редактор строк черновика — вместо
// списка, когда черновик открыт. Роль/accessMenu решают только видимость
// действий (создание, правила), а не то, рендерится ли раздел вообще —
// это забота роутинга (регистрация в меню — отдельная задача).
export default function ReportsV2({ user, accessMenu }) {
  const token = getCookie("token");
  // Роль и права раздела читаем из токена напрямую — так же, как это уже
  // делают ReportCreateSidebar/ReportRulesSidebar. `user` из пропсов —
  // фолбэк на случай, если decodeJWT вернёт пустое значение; на исключение
  // (нет токена или он битый) этот код не рассчитан и его не перехватывает —
  // как и везде в проекте (см. тот же паттерн в Reports.jsx:32).
  const me = decodeJWT(token) || user;

  const { confirm } = useDialog();
  const { success, error: notifyError } = useToast();

  // Правила расчёта суток открывает и правит и супер, и диспетчер-админ.
  // Это ровно то, что разрешает бэк: `upsertReportPartialDaySetting` стоит под
  // `adminMiddleware`, а он пускает ["SUPERADMIN", "DISPATCHERADMIN"] — то есть
  // ту же пару, что и чтение. Раньше запись была закрыта только здесь.
  // roles.dispatcerAdmin — опечатка в ключе живёт в src/roles.js; «исправление»
  // даёт undefined и молча выключает гейт.
  const canOpenRules = me?.role === roles.superAdmin || me?.role === roles.dispatcerAdmin;
  const canEditRules = canOpenRules;
  const canCreate = !me?.airlineId || accessMenu?.reportCreate;
  // Удаление живёт только в архиве и гейтится ключом reportDelete — зеркало
  // бэкового assertCanDeleteSavedReport (супер и диспетчер-админ без ключа).
  const canDelete = canDeleteReport(me, accessMenu);
  const showTypeToggle = me?.role === roles.superAdmin || me?.role === roles.dispatcerAdmin;
  // Черновики — рабочий инструмент выпуска: АК и гостиница видят только
  // выпущенные отчёты (решение владельца 01.09). «Экранный вид» выпущенного
  // (CONFIRMED-черновик) остаётся всем.
  const showDrafts = me?.role === roles.superAdmin || me?.role === roles.dispatcerAdmin;
  // Единственное, что видит авиакомпания из кухни черновиков, — отправленный
  // ей на подтверждение. Диспетчерским ролям эта панель не нужна: у них та же
  // выборка лежит в «У авиакомпании на подтверждении».
  const isAirlineUser = !!me?.airlineId && !showDrafts;
  // Текст пустого списка зависит от аккаунта: диспетчер собирает отчёты по
  // любым АК/гостиницам, скоуп-роли видят только свои.
  const emptyText = me?.hotelId
    ? "Здесь появятся выпущенные отчёты по вашей гостинице. Соберите первый — выберите период."
    : me?.airlineId
      ? canCreate
        ? "Здесь появятся выпущенные отчёты по вашей авиакомпании. Соберите первый — за нужный период."
        : "Здесь появятся выпущенные отчёты по вашей авиакомпании."
      : "Здесь появятся выпущенные отчёты. Соберите первый — по авиакомпании или по гостинице, за нужный период.";

  const [isAirline, setIsAirline] = useState(() => {
    const saved = localStorage.getItem(IS_AIRLINE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : true;
  });

  // Паритет со старым разделом (Reports.jsx:52-63): гостиничной учётке — отчёты
  // гостиниц, авиакомпанейской — эскадрилья. Форс по привязке учётки, а не по
  // имени роли — так покрываются и модераторы; сохранённый в localStorage
  // переключатель супера не должен утаскивать скоуп-роль не в свой тип.
  useEffect(() => {
    if (me?.hotelId) setIsAirline(false);
    else if (me?.airlineId) setIsAirline(true);
  }, [me?.hotelId, me?.airlineId]);

  useEffect(() => {
    localStorage.setItem(IS_AIRLINE_STORAGE_KEY, JSON.stringify(isAirline));
  }, [isAirline]);

  // Вкладка «Архив» намеренно НЕ ложится в localStorage: раздел всегда должен
  // открываться на «Текущих», иначе учётка после одного захода в архив каждый
  // раз видит его вместо рабочего списка.
  const [showArchive, setShowArchive] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [draftId, setDraftId] = useState(null);
  // Один и тот же экран открывается в двух ролях: черновик правят, выпущенный
  // отчёт только смотрят. Отдельного маршрута не заводим — раздел живёт на
  // одном /reportsV2.
  const [draftMode, setDraftMode] = useState("edit");
  const [showCreate, setShowCreate] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const [airports, setAirports] = useState([]);
  const [positions, setPositions] = useState([]);

  const {
    data: reportsData,
    loading: reportsLoading,
    refetch: refetchReports,
  } = useQuery(isAirline ? GET_AIRLINE_REPORT : GET_HOTEL_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    // Пустой фильтр — это «текущие»: бэк сам отсекает по началу предыдущей
    // декады. Архив — тот же запрос с archived: true; Apollo разводит два
    // набора по переменным, поэтому переключение вкладки не мешает списки.
    variables: { filter: showArchive ? { archived: true } : {} },
  });

  const { data: positionsData } = useQuery(GET_AIRLINE_POSITIONS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: airportsData } = useQuery(GET_AIRPORTS_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Один запрос на все три статуса: `status` в фильтре не задаём, выборку
  // делим на клиенте (splitDraftsByStatus). Раздельные запросы держали бы три
  // независимых кэша одного и того же списка и требовали трёх рефетчей после
  // каждой отправки/отзыва. Скоуп режет бэк: авиакомпании он отдаёт только
  // SUBMITTED и CONFIRMED её собственной АК.
  const { data: draftsData, refetch: refetchDrafts } = useQuery(GET_REPORT_DRAFTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { filter: { type: isAirline ? "AIRLINE" : "HOTEL" } },
  });

  useSubscription(GET_REPORTS_SUBSCRIPTION, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    onData: () => {
      refetchReports();
    },
  });

  const [deleteReport] = useMutation(DELETE_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [archiveReport] = useMutation(ARCHIVE_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [restoreReport] = useMutation(RESTORE_REPORT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [deleteReportDraft] = useMutation(DELETE_REPORT_DRAFT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [unsubmitAirlineReportDraft] = useMutation(UNSUBMIT_AIRLINE_REPORT_DRAFT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  useEffect(() => {
    setAirports(airportsData?.airports || []);
  }, [airportsData]);

  useEffect(() => {
    setPositions(positionsData?.getAirlinePositions || []);
  }, [positionsData]);

  const reports = isAirline
    ? reportsData?.getAirlineReport?.[0]?.reports || []
    : reportsData?.getHotelReport?.[0]?.reports || [];

  const {
    open: draftsOpen,
    submitted: draftsSubmitted,
    confirmed: draftsConfirmed,
  } = useMemo(() => splitDraftsByStatus(draftsData?.reportDrafts), [draftsData]);

  // Список отчётов сам не знает, у какой строки есть экранный вид: связь живёт
  // на стороне черновика (savedReportId). Карту строим здесь и отдаём в список.
  const draftByReport = useMemo(() => buildDraftByReport(draftsConfirmed), [draftsConfirmed]);

  const q = searchQuery.trim().toLowerCase();
  const filteredReports = reports.filter((report) => {
    const name = isAirline ? report?.airline?.name : report?.hotel?.name;
    const createTime = convertToDate(report?.createdAt);
    const startTime = convertToDateNew(report?.startDate);
    const endTime = convertToDateNew(report?.endDate);
    return (
      name?.toLowerCase().includes(q) ||
      createTime.toLowerCase().includes(q) ||
      startTime.toLowerCase().includes(q) ||
      endTime.toLowerCase().includes(q)
    );
  });

  const handleDeleteReport = async (id) => {
    const ok = await confirm({
      message: "Вы действительно хотите удалить отчёт?",
      confirmText: "Удалить",
      cancelText: "Отмена",
    });
    if (!ok) return;
    try {
      await deleteReport({ variables: { deleteReportId: id } });
      success("Отчёт удалён");
      // Подписка GET_REPORTS_SUBSCRIPTION про удаление молчит — без рефетча
      // удалённая строка остаётся в архиве до перезагрузки страницы.
      refetchReports();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при удалении отчёта");
    }
  };

  const handleArchiveReport = async (id) => {
    const ok = await confirm({
      message: "Убрать отчёт в архив?",
      confirmText: "В архив",
      cancelText: "Отмена",
    });
    if (!ok) return;
    try {
      await archiveReport({ variables: { id } });
      success("Отчёт в архиве");
      refetchReports();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Не удалось убрать отчёт в архив");
    }
  };

  const handleRestoreReport = async (id) => {
    const ok = await confirm({
      message: "Вернуть отчёт из архива?",
      confirmText: "Восстановить",
      cancelText: "Отмена",
    });
    if (!ok) return;
    try {
      await restoreReport({ variables: { id } });
      success("Отчёт восстановлен");
      refetchReports();
    } catch (e) {
      // Строка могла попасть в архив по порогу декады, без ручного флага —
      // тогда бэк отвечает BAD_USER_INPUT «Report is not archived». Показываем
      // его текст: только он объясняет, почему кнопка не сработала.
      notifyError(e?.graphQLErrors?.[0]?.message || "Не удалось восстановить отчёт");
    }
  };

  const handleDeleteDraft = async (id) => {
    const ok = await confirm({
      message: "Удалить черновик? Это действие необратимо.",
      confirmText: "Удалить",
      cancelText: "Отмена",
    });
    if (!ok) return;
    try {
      await deleteReportDraft({ variables: { id } });
      success("Черновик удалён");
      refetchDrafts();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Не удалось удалить черновик");
    }
  };

  // Отзыв обратим и ничего не печатает — подтверждения не спрашиваем, в
  // отличие от удаления черновика.
  const handleUnsubmitDraft = async (id) => {
    try {
      await unsubmitAirlineReportDraft({ variables: { id } });
      success("Отправка отозвана");
      refetchDrafts();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Не удалось отозвать отправку");
    }
  };

  const handleDraftCreated = (id) => {
    setDraftId(id);
    refetchDrafts();
  };

  const handleOpenDraft = (id) => {
    setDraftMode("edit");
    setDraftId(id);
  };

  // Авиакомпания открывает отправленный ей черновик на чтение и подтверждение:
  // тот же экран, но без правки строк и без отзыва.
  const handleOpenSubmitted = (id) => {
    setDraftMode("review");
    setDraftId(id);
  };

  const handleOpenReleased = (reportId) => {
    const id = draftByReport.get(reportId);
    if (!id) return;
    setDraftMode("view");
    setDraftId(id);
  };

  const handleDraftBack = () => {
    setDraftId(null);
    setDraftMode("edit");
    refetchDrafts();
  };

  const handleDraftReplaced = (newId) => {
    setDraftId(newId);
    refetchDrafts();
  };

  const handleDraftConfirmed = () => {
    setDraftId(null);
    setDraftMode("edit");
    refetchDrafts();
    refetchReports();
  };

  // Отправка и отзыв, в отличие от подтверждения, экран не закрывают: черновик
  // никуда не делся, у него сменился статус — редактор перерисуется сам по
  // нормализованному кэшу, а рефетч нужен только панелям под ним.
  const handleDraftSubmitted = () => {
    refetchDrafts();
  };

  const handleDraftUnsubmitted = () => {
    refetchDrafts();
  };

  return (
    <div className={classes.section}>
      {/* Header в режиме редактора рендерит сам редактор: заголовок тот же
          «Отчеты v2», но со стрелкой «назад» рядом — а обработчик у неё свой,
          с проверкой несохранённых правок, и жить он должен там же. */}
      {draftId ? (
        <ReportDraftEditor
          draftId={draftId}
          mode={draftMode}
          airports={airports}
          onBack={handleDraftBack}
          onDraftReplaced={handleDraftReplaced}
          onConfirmed={handleDraftConfirmed}
          onSubmitted={handleDraftSubmitted}
          onUnsubmitted={handleDraftUnsubmitted}
        />
      ) : (
        <>
        {/* У супера два раздела «Отчётов» — ему оставляем «v2», остальные видят просто «Отчеты» */}
        <Header>{me?.role === roles.superAdmin ? "Отчеты v2" : "Отчеты"}</Header>
        <div className={classes.content}>
          {showTypeToggle && (
            <div className={classes.filter_wrapper}>
              <button
                type="button"
                onClick={() => setIsAirline(true)}
                className={isAirline === true ? classes.activeButton : null}
              >
                Авиакомпании
              </button>
              <button
                type="button"
                onClick={() => setIsAirline(false)}
                className={isAirline === false ? classes.activeButton : null}
              >
                Гостиницы
              </button>
            </div>
          )}

          {/* Отдельная полоса под типом объекта: тумблер типа видят только
              супер и диспетчер-админ, а архив нужен всем ролям — иначе после
              деплоя отчёты старше двух декад просто пропадут из раздела. */}
          <div className={classes.filter_wrapper}>
            <button
              type="button"
              onClick={() => setShowArchive(false)}
              className={showArchive === false ? classes.activeButton : null}
            >
              Текущие
            </button>
            <button
              type="button"
              onClick={() => setShowArchive(true)}
              className={showArchive === true ? classes.activeButton : null}
            >
              Архив
            </button>
          </div>

          <div className={classes.toolbar}>
            <MUITextField
              label={"Поиск по отчётам"}
              className={classes.mainSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className={classes.spacer} />

            {canOpenRules && (
              <Button
                type="button"
                onClick={() => setShowRules(true)}
                minwidth={"170px"}
                backgroundcolor={"#fff"}
                color={"var(--text)"}
                border={"1px solid #E4E4EF"}
              >
                Правила расчёта
              </Button>
            )}

            {canCreate && (
              <Button
                type="button"
                onClick={() => setShowCreate(true)}
                minwidth={"170px"}
              >
                Создать отчёт
              </Button>
            )}
          </div>

          {/* Черновики — про выпуск новых отчётов, в архиве им делать нечего */}
          {showDrafts && !showArchive && (
            <ReportDraftsPanel
              drafts={draftsOpen}
              isAirline={isAirline}
              onOpen={handleOpenDraft}
              onDelete={handleDeleteDraft}
            />
          )}

          {/* Отправленные ждут авиакомпанию, но выпустить их диспетчер вправе и
              сам — поэтому открываются тем же редактором, только без правки.
              Гостиничных черновиков этот путь не касается: их подтверждают из
              DRAFT, статуса SUBMITTED у них не бывает. */}
          {showDrafts && isAirline && !showArchive && (
            <ReportDraftsPanel
              drafts={draftsSubmitted}
              isAirline={isAirline}
              title="У авиакомпании на подтверждении"
              variant="submitted"
              onOpen={handleOpenDraft}
              onUnsubmit={handleUnsubmitDraft}
            />
          )}

          {/* Единственная панель черновиков у авиакомпании: то, что ждёт её
              подтверждения. Удаления и отзыва здесь нет — это сторона выпуска. */}
          {isAirlineUser && !showArchive && (
            <ReportDraftsPanel
              drafts={draftsSubmitted}
              isAirline
              title="На подтверждении"
              variant="submitted"
              onOpen={handleOpenSubmitted}
            />
          )}

          <ReportsV2List
            isAirline={isAirline}
            items={filteredReports}
            loading={reportsLoading}
            hasAnyReports={reports.length > 0}
            searchQuery={searchQuery}
            canCreate={canCreate}
            onCreateClick={() => setShowCreate(true)}
            onDelete={handleDeleteReport}
            archiveMode={showArchive}
            onArchive={handleArchiveReport}
            onRestore={handleRestoreReport}
            canDelete={canDelete}
            draftByReport={draftByReport}
            onOpenReleased={handleOpenReleased}
            emptyText={showArchive ? ARCHIVE_EMPTY_TEXT : emptyText}
          />
        </div>
        </>
      )}

      <ReportCreateSidebar
        show={showCreate}
        onClose={() => setShowCreate(false)}
        isAirline={isAirline}
        positions={positions}
        airports={airports}
        onDraftCreated={handleDraftCreated}
        canDraft={showDrafts}
      />

      <ReportRulesSidebar
        show={showRules}
        onClose={() => setShowRules(false)}
        canEdit={canEditRules}
      />
    </div>
  );
}

ReportsV2.propTypes = {
  user: PropTypes.object,
  accessMenu: PropTypes.object,
};
