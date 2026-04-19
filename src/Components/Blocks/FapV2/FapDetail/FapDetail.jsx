import React, { useState } from "react";
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
  REQUEST_STATUS_CONFIG,
  formatDate,
  formatDateTime,
} from "../fapConstants";
import MUILoader from "../../MUILoader/MUILoader";
import Button from "../../../Standart/Button/Button";
import Header from "../../Header/Header";
import FapWaterMealSection from "../FapWaterMealSection/FapWaterMealSection";
import FapLivingSection from "../FapLivingSection/FapLivingSection";
import FapTransferSection from "../FapTransferSection/FapTransferSection";
import FapBaggageSection from "../FapBaggageSection/FapBaggageSection";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import AddRepresentativeService from "../../AddRepresentativeService/AddRepresentativeService";
import PassengerRequestLogs from "../../LogsHistory/PassengerRequestLogs";
import Message from "../../Message/Message";

const STATUS_TRANSITIONS = {
  CREATED: ["ACCEPTED"],
  ACCEPTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
};

export default function FapDetail({ user }) {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();

  const [showAddService, setShowAddService] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showChat, setShowChat] = useState(false);

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
  const isFinal =
    request.status === "COMPLETED" || request.status === "CANCELLED";

  const allServicesAdded =
    !!request.waterService?.plan?.enabled &&
    !!request.mealService?.plan?.enabled &&
    !!request.livingService?.plan?.enabled &&
    !!request.transferService?.plan?.enabled &&
    !!request.baggageDeliveryService?.plan?.enabled;

  const handleStatusChange = async (newStatus) => {
    const ok = await confirm(
      `Перевести заявку в статус «${REQUEST_STATUS_CONFIG[newStatus]?.label}»?`
    );
    if (!ok) return;
    try {
      setSaving(true);
      await setStatus({ variables: { id: request.id, status: newStatus } });
      refetch();
      success("Статус обновлён");
    } catch {
      notifyError("Ошибка при смене статуса");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      setSaving(true);
      await cancelRequest({
        variables: {
          id: request.id,
          cancelReason: cancelReason.trim() || undefined,
        },
      });
      setCancelReason("");
      setShowCancelDialog(false);
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
          <button
            className={classes.backBtn}
            onClick={() => navigate("/fapv2")}
          >
            <img src="/arrow.png" alt="" />
          </button>
          <span className={classes.headerNavTitle}>
            Заявка {request.flightNumber}
          </span>
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
                    onClick={() => handleStatusChange(s)}
                    disabled={saving}
                  >
                    {REQUEST_STATUS_CONFIG[s]?.label}
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
                onClick={() => setShowCancelDialog(true)}
              >
                Отменить
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className={classes.infoBar}>
        {request.airline?.name && (
          <div className={classes.infoItem}>
            <span className={classes.infoLabel}>Авиакомпания</span>
            <span className={classes.infoValue}>{request.airline.name}</span>
          </div>
        )}
        {request.airline?.name && <div className={classes.divider} />}
        {(request.routeFrom || request.routeTo) && (
          <>
            <div className={classes.infoItem}>
              <span className={classes.infoLabel}>Маршрут</span>
              <span className={classes.infoValue}>
                {[request.routeFrom, request.routeTo]
                  .filter(Boolean)
                  .join(" → ")}
              </span>
            </div>
            <div className={classes.divider} />
          </>
        )}
        {request.flightDate && (
          <>
            <div className={classes.infoItem}>
              <span className={classes.infoLabel}>Дата рейса</span>
              <span className={classes.infoValue}>
                {formatDate(request.flightDate)}
              </span>
            </div>
            <div className={classes.divider} />
          </>
        )}
        {request.plannedPassengersCount && (
          <div className={classes.infoItem}>
            <span className={classes.infoLabel}>Пассажиров</span>
            <span className={classes.infoValue}>
              {request.plannedPassengersCount}
            </span>
          </div>
        )}
        {request.statusTimes?.acceptedAt && (
          <>
            <div className={classes.divider} />
            <div className={classes.infoItem}>
              <span className={classes.infoLabel}>Принято</span>
              <span className={classes.infoValue}>
                {formatDateTime(request.statusTimes.acceptedAt)}
              </span>
            </div>
          </>
        )}
        {request.earlyCompletionReason && (
          <>
            <div className={classes.divider} />
            <div className={classes.infoItem}>
              <span className={classes.infoLabel}>Причина завершения</span>
              <span className={classes.infoValue}>
                {request.earlyCompletionReason}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Content row: sections + optional chat panel */}
      <div className={classes.contentRow}>
        <div className={classes.sectionsPane}>
          <FapWaterMealSection
            service={request.waterService}
            serviceKind="WATER"
            label={SERVICE_CONFIG.water.label}
            color={SERVICE_CONFIG.water.color}
            requestId={request.id}
            onRefetch={refetch}
          />
          <FapWaterMealSection
            service={request.mealService}
            serviceKind="MEAL"
            label={SERVICE_CONFIG.meal.label}
            color={SERVICE_CONFIG.meal.color}
            requestId={request.id}
            onRefetch={refetch}
          />
          <FapLivingSection
            service={request.livingService}
            color={SERVICE_CONFIG.living.color}
            request={request}
            onRefetch={refetch}
          />
          <FapTransferSection
            service={request.transferService}
            color={SERVICE_CONFIG.transfer.color}
            request={request}
            onRefetch={refetch}
          />
          <FapBaggageSection
            service={request.baggageDeliveryService}
            color={SERVICE_CONFIG.baggage.color}
            request={request}
            onRefetch={refetch}
          />
        </div>

        {showChat && (
          <div className={classes.chatPane}>
            <div className={classes.chatPaneHeader}>
              <span className={classes.chatPaneTitle}>Чат</span>
              <button
                className={classes.chatPaneClose}
                onClick={() => setShowChat(false)}
              >
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
                chatHeight="calc(100vh - 386px)"
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

      {/* Cancel confirmation dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false);
          setCancelReason("");
        }}
        PaperProps={{ sx: { borderRadius: "16px", minWidth: 440, maxWidth: 500 } }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#EF4444",
            borderBottom: "1px solid #F1F5F9",
            pb: 2,
          }}
        >
          Отмена заявки
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important", pb: 1 }}>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              color: "#545873",
              margin: "0 0 16px",
            }}
          >
            После отмены заявка перейдёт в статус «Отменена». Это действие необратимо.
          </p>
          <textarea
            className={classes.cancelTextarea}
            rows={4}
            placeholder="Причина отмены (необязательно)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
          <Button
            backgroundcolor="#F6F7FB"
            color="#545873"
            onClick={() => {
              setShowCancelDialog(false);
              setCancelReason("");
            }}
          >
            Назад
          </Button>
          <Button
            backgroundcolor="#EF4444"
            color="#fff"
            onClick={handleCancel}
            disabled={saving}
          >
            {saving ? "Отмена..." : "Отменить заявку"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
