import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "./FapDetail.module.css";
import {
  GET_PASSENGER_REQUEST,
  SET_PASSENGER_REQUEST_STATUS,
  CANCEL_PASSENGER_REQUEST,
  PASSENGER_REQUEST_UPDATED_SUBSCRIPTION,
  getCookie,
} from "../../../../../graphQL_requests";
import {
  SERVICE_CONFIG,
  SERVICE_STATUS_CONFIG,
  REQUEST_STATUS_CONFIG,
} from "../fapConstants";
import MUILoader from "../../MUILoader/MUILoader";
import Button from "../../../Standart/Button/Button";
import Header from "../../Header/Header";
import { useToast } from "../../../../contexts/ToastContext";
import AddRepresentativeService from "../../AddRepresentativeService/AddRepresentativeService";
import PassengerRequestLogs from "../../LogsHistory/PassengerRequestLogs";
import Message from "../../Message/Message";
import CopyIcon from "../../../../shared/icons/CopyIcon";
import { isExternalUser } from "../../../../utils/access";
import FapDestructiveModal from "../FapDestructiveModal/FapDestructiveModal";

const STATUS_TRANSITIONS = {
  CREATED: ["ACCEPTED"],
  ACCEPTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
};

const STATUS_ACTION_LABELS = {
  ACCEPTED: "Принять заявку",
  IN_PROGRESS: "Начать выполнение",
  COMPLETED: "Завершить заявку",
};

const STATUS_CONFIRM_CONFIG = {
  ACCEPTED: {
    title: "Принятие заявки",
    body: "Вы собираетесь принять заявку. После подтверждения она перейдёт в статус «Принята» и будет готова к дальнейшему выполнению.",
  },
  IN_PROGRESS: {
    title: "Начало выполнения",
    body: "Вы собираетесь перевести заявку в статус «В работе». Это означает, что исполнение заявки началось.",
  },
  COMPLETED: {
    title: "Завершение заявки",
    body: "Вы собираетесь завершить заявку. После подтверждения все услуги считаются выполненными. Это действие необратимо.",
  },
};

const SERVICE_KEYS = ["water", "meal", "living", "transfer", "baggage"];

function getServiceData(serviceKey, request) {
  switch (serviceKey) {
    case "water":    return request.waterService;
    case "meal":     return request.mealService;
    case "living":   return request.livingService;
    case "transfer": return request.transferService;
    case "baggage":  return request.baggageDeliveryService;
    default:         return null;
  }
}

function getServiceSummary(serviceKey, request) {
  switch (serviceKey) {
    case "water": {
      const s = request.waterService;
      return `${s?.people?.length ?? 0} / ${s?.plan?.peopleCount ?? 0} чел.`;
    }
    case "meal": {
      const s = request.mealService;
      return `${s?.people?.length ?? 0} / ${s?.plan?.peopleCount ?? 0} чел.`;
    }
    case "living": {
      const hotels = request.livingService?.plan?.hotels ?? [];
      const totalPeople = hotels.reduce((acc, h) => acc + (h.people?.length ?? 0), 0);
      const totalCap = hotels.reduce((acc, h) => acc + (h.capacity ?? 0), 0);
      return totalCap > 0 ? `${totalPeople} / ${totalCap} гостей` : `${hotels.length} отелей`;
    }
    case "transfer": {
      const drivers = request.transferService?.plan?.drivers ?? [];
      return `${drivers.length} водителей`;
    }
    case "baggage": {
      const drivers = request.baggageDeliveryService?.plan?.drivers ?? [];
      return `${drivers.length} водителей`;
    }
    default:
      return "";
  }
}

export default function FapDetail({ user }) {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const [showAddService, setShowAddService] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const { loading, data, refetch } = useQuery(GET_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId: requestId },
  });

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    onData: () => refetch(),
  });

  const [setStatus] = useMutation(SET_PASSENGER_REQUEST_STATUS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [cancelRequest] = useMutation(CANCEL_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const request = data?.passengerRequest;

  const representativePwaLink = useMemo(() => {
    const links = request?.representativeLinks || [];
    if (!Array.isArray(links) || links.length === 0) return "";
    const byDepartment = user?.representativeDepartmentId
      ? links.find(
          (item) =>
            String(item?.representativeDepartmentId) ===
              String(user.representativeDepartmentId) && item?.linkPWA
        )
      : null;
    if (byDepartment?.linkPWA) return byDepartment.linkPWA;
    const firstWithPwa = links.find((item) => item?.linkPWA);
    return firstWithPwa?.linkPWA || "";
  }, [request?.representativeLinks, user?.representativeDepartmentId]);

  const canCopyRepresentativeLink = !isExternalUser(user) && Boolean(representativePwaLink);

  const handleCopyRepresentativeLink = async () => {
    try {
      await navigator.clipboard.writeText(representativePwaLink);
      success("Ссылка представительства скопирована");
    } catch {
      notifyError("Не удалось скопировать ссылку");
    }
  };

  if (loading) {
    return (
      <div className={classes.loader}>
        <MUILoader />
      </div>
    );
  }

  if (!request) {
    return (
      <div className={classes.page}>
        <div style={{ padding: 40, color: "#94A3B8", fontFamily: "Inter" }}>
          Заявка не найдена
        </div>
      </div>
    );
  }

  const statusCfg = REQUEST_STATUS_CONFIG[request.status] || {};
  const nextStatuses = STATUS_TRANSITIONS[request.status] || [];
  const isFinal = request.status === "COMPLETED" || request.status === "CANCELLED";

  const allServicesAdded =
    !!request.waterService?.plan?.enabled &&
    !!request.mealService?.plan?.enabled &&
    !!request.livingService?.plan?.enabled &&
    !!request.transferService?.plan?.enabled &&
    !!request.baggageDeliveryService?.plan?.enabled;

  const handleConfirmStatus = async () => {
    if (!pendingStatus) return;
    try {
      setSaving(true);
      await setStatus({ variables: { id: request.id, status: pendingStatus } });
      setShowStatusDialog(false);
      setPendingStatus(null);
      refetch();
      success("Статус обновлён");
    } catch {
      notifyError("Ошибка при смене статуса");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (reason) => {
    try {
      setSaving(true);
      await cancelRequest({
        variables: {
          id: request.id,
          cancelReason: reason,
        },
      });
      setShowCancelModal(false);
      refetch();
      success("Заявка отменена");
    } catch {
      notifyError("Ошибка при отмене");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={classes.page}>
      <Header>
        <div className={classes.headerNav}>
          <button className={classes.backBtn} onClick={() => navigate("/fapv2")}>
            <img src="/arrow.png" alt="" />
          </button>
          <span className={classes.headerNavTitle}>Заявка {request.flightNumber}</span>
          {canCopyRepresentativeLink && (
            <button
              type="button"
              className={classes.representativeLinkBtn}
              onClick={handleCopyRepresentativeLink}
              title="Скопировать ссылку для представительства"
            >
              Ссылка <CopyIcon />
            </button>
          )}
        </div>
      </Header>

      {/* Sticky action bar */}
      <div className={classes.stickyHeader}>
        <div className={classes.headerRow}>
          <div className={classes.headerLeft}>
            <span
              className={classes.statusBadge}
              style={{ color: statusCfg.color, background: statusCfg.bg }}
            >
              {statusCfg.label || request.status}
            </span>
          </div>

          <div className={classes.headerRight}>
            {!isFinal && (
              <>
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    backgroundcolor="var(--dark-blue)"
                    color="#fff"
                    onClick={() => { setPendingStatus(s); setShowStatusDialog(true); }}
                    disabled={saving}
                  >
                    {STATUS_ACTION_LABELS[s] || REQUEST_STATUS_CONFIG[s]?.label}
                  </Button>
                ))}
                {!allServicesAdded && (
                  <Button
                    backgroundcolor="#F6F7FB"
                    color="#545873"
                    onClick={() => setShowAddService(true)}
                  >
                    + Услуга
                  </Button>
                )}
              </>
            )}
            <Button
              backgroundcolor={showLogs ? "var(--dark-blue)" : "#F6F7FB"}
              color={showLogs ? "#fff" : "#545873"}
              onClick={() => setShowLogs((v) => !v)}
            >
              История
            </Button>
            <Button
              backgroundcolor={showChat ? "var(--dark-blue)" : "#F6F7FB"}
              color={showChat ? "#fff" : "#545873"}
              onClick={() => setShowChat((v) => !v)}
            >
              Чат
            </Button>
            {!isFinal && (
              <Button
                backgroundcolor="#FEF2F2"
                color="#EF4444"
                onClick={() => setShowCancelModal(true)}
              >
                Отменить заявку
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content row: service nav cards + optional chat panel */}
      <div className={classes.contentRow}>
        <div className={classes.sectionsPane}>
          {SERVICE_KEYS.map((key) => {
            const cfg = SERVICE_CONFIG[key];
            const service = getServiceData(key, request);
            if (!service?.plan?.enabled) return null;
            const svcStatus = SERVICE_STATUS_CONFIG[service.status] || {};
            const summary = getServiceSummary(key, request);
            return (
              <div
                key={key}
                className={classes.section}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/fapv2/${request.id}/service/${key}`)}
              >
                <div className={classes.sectionHeader}>
                  <div className={classes.sectionHeaderLeft}>
                    <div className={classes.sectionDot} style={{ background: cfg.color }} />
                    <span className={classes.sectionName}>{cfg.label}</span>
                    <span
                      className={classes.svcStatusBadge}
                      style={{ color: svcStatus.color, background: svcStatus.bg }}
                    >
                      {svcStatus.label || service.status}
                    </span>
                  </div>
                  <div className={classes.sectionHeaderRight}>
                    {summary && (
                      <span style={{ fontSize: 14, color: "var(--main-gray)" }}>{summary}</span>
                    )}
                    <span style={{ fontSize: 18, color: "var(--main-gray)", lineHeight: 1 }}>›</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showChat && (
          <div className={classes.chatPane}>
            <div className={classes.chatPaneHeader}>
              <span className={classes.chatPaneTitle}>Чат</span>
              <button className={classes.chatPaneClose} onClick={() => setShowChat(false)}>
                ✕
              </button>
            </div>
            <div className={classes.chatPaneBody}>
              <Message
                activeTab="Комментарий"
                passengerRequestId={request.id}
                token={token}
                user={user}
                chatPadding="0"
                chatHeight="calc(100vh - 313px)"
              />
            </div>
          </div>
        )}
      </div>

      {showAddService && (
        <AddRepresentativeService
          show={showAddService}
          onClose={() => {
            setShowAddService(false);
            refetch();
          }}
          request={request}
        />
      )}

      <PassengerRequestLogs
        show={showLogs}
        onClose={() => setShowLogs(false)}
        passengerRequestId={request.id}
      />

      {/* Status change confirmation dialog */}
      <Dialog
        open={showStatusDialog}
        onClose={() => { setShowStatusDialog(false); setPendingStatus(null); }}
        PaperProps={{ sx: { borderRadius: "16px", minWidth: 440, maxWidth: 520 } }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--text)",
            borderBottom: "1px solid #F1F5F9",
            pb: 2,
          }}
        >
          {pendingStatus && STATUS_CONFIRM_CONFIG[pendingStatus]?.title}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important", pb: 1 }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#545873", margin: 0 }}>
            {pendingStatus && STATUS_CONFIRM_CONFIG[pendingStatus]?.body}
          </p>
        </DialogContent>
        <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
          <Button
            backgroundcolor="#F6F7FB"
            color="#545873"
            onClick={() => { setShowStatusDialog(false); setPendingStatus(null); }}
          >
            Назад
          </Button>
          <Button
            backgroundcolor="var(--dark-blue)"
            color="#fff"
            onClick={handleConfirmStatus}
            disabled={saving}
          >
            {saving ? "Сохранение..." : "Подтвердить"}
          </Button>
        </DialogActions>
      </Dialog>

      <FapDestructiveModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Отмена заявки"
        description="После отмены заявка перейдёт в статус «Отменена». Это действие необратимо."
        showReason
        reasonRequired={false}
        placeholder="Причина отмены (необязательно)"
        confirmText="Отменить заявку"
        cancelText="Назад"
        saving={saving}
      />
    </div>
  );
}
