import { useEffect, useState } from "react";
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
import { GearIcon, PlusIcon } from "./ReportsV2Icons";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";
import { roles } from "../../../roles";
import {
  convertToDate,
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
} from "../../../../graphQL_requests";

// Ключ localStorage раздела — намеренно отличается от старого "isAirline"
// (занят разделом «Отчёты» v1), иначе переключатели типа объекта двух
// разделов будут сбивать друг друга.
const IS_AIRLINE_STORAGE_KEY = "reportsV2IsAirline";

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

  const canOpenRules = me?.role === roles.superAdmin || me?.role === roles.dispatcerAdmin;
  const canEditRules = me?.role === roles.superAdmin;
  const canCreate = !me?.airlineId || accessMenu?.reportCreate;
  const showTypeToggle = me?.role === roles.superAdmin || me?.role === roles.dispatcerAdmin;

  const [isAirline, setIsAirline] = useState(() => {
    const saved = localStorage.getItem(IS_AIRLINE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem(IS_AIRLINE_STORAGE_KEY, JSON.stringify(isAirline));
  }, [isAirline]);

  const [searchQuery, setSearchQuery] = useState("");
  const [draftId, setDraftId] = useState(null);
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
    variables: { filter: {} },
  });

  const { data: positionsData } = useQuery(GET_AIRLINE_POSITIONS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: airportsData } = useQuery(GET_AIRPORTS_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: draftsData, refetch: refetchDrafts } = useQuery(GET_REPORT_DRAFTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { filter: { type: isAirline ? "AIRLINE" : "HOTEL", status: "DRAFT" } },
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

  const [deleteReportDraft] = useMutation(DELETE_REPORT_DRAFT, {
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

  const drafts = draftsData?.reportDrafts || [];

  const q = searchQuery.trim().toLowerCase();
  const filteredReports = reports.filter((report) => {
    const name = isAirline ? report?.airline?.name : report?.hotel?.name;
    const createTime = convertToDate(report?.createdAt);
    const startTime = convertToDate(report?.startDate);
    const endTime = convertToDate(report?.endDate);
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
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при удалении отчёта");
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

  const handleDraftCreated = (id) => {
    setDraftId(id);
    refetchDrafts();
  };

  const handleDraftBack = () => {
    setDraftId(null);
    refetchDrafts();
  };

  const handleDraftReplaced = (newId) => {
    setDraftId(newId);
    refetchDrafts();
  };

  const handleDraftConfirmed = () => {
    setDraftId(null);
    refetchDrafts();
    refetchReports();
  };

  return (
    <div className={classes.section}>
      <Header>Отчеты v2</Header>

      {draftId ? (
        <ReportDraftEditor
          draftId={draftId}
          onBack={handleDraftBack}
          onDraftReplaced={handleDraftReplaced}
          onConfirmed={handleDraftConfirmed}
        />
      ) : (
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

          <div className={classes.toolbar}>
            <MUITextField
              label={"Поиск по отчётам"}
              className={classes.mainSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className={classes.spacer} />

            {canOpenRules && (
              <button
                type="button"
                className={classes.rulesBtn}
                onClick={() => setShowRules(true)}
              >
                <GearIcon size={17} />
                Правила расчёта
              </button>
            )}

            {canCreate && (
              <button
                type="button"
                className={classes.createBtn}
                onClick={() => setShowCreate(true)}
              >
                <PlusIcon size={17} />
                Создать отчёт
              </button>
            )}
          </div>

          <ReportDraftsPanel
            drafts={drafts}
            isAirline={isAirline}
            onOpen={setDraftId}
            onDelete={handleDeleteDraft}
          />

          <ReportsV2List
            isAirline={isAirline}
            items={filteredReports}
            loading={reportsLoading}
            hasAnyReports={reports.length > 0}
            searchQuery={searchQuery}
            canCreate={canCreate}
            onCreateClick={() => setShowCreate(true)}
            onDelete={handleDeleteReport}
          />
        </div>
      )}

      <ReportCreateSidebar
        show={showCreate}
        onClose={() => setShowCreate(false)}
        isAirline={isAirline}
        positions={positions}
        airports={airports}
        onDraftCreated={handleDraftCreated}
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
