import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
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
import FapWaterMealSection from "../FapWaterMealSection/FapWaterMealSection";
import FapLivingSection from "../FapLivingSection/FapLivingSection";
import FapTransferSection from "../FapTransferSection/FapTransferSection";
import FapBaggageSection from "../FapBaggageSection/FapBaggageSection";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import AddRepresentativeService from "../../AddRepresentativeService/AddRepresentativeService";

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
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [saving, setSaving] = useState(false);

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
    const ok = await confirm("Отменить заявку?");
    if (!ok) return;
    try {
      setSaving(true);
      await cancelRequest({
        variables: {
          id: request.id,
          cancelReason: cancelReason || undefined,
        },
      });
      setCancelReason("");
      setShowCancelForm(false);
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
      {/* Sticky header */}
      <div className={classes.stickyHeader}>
        <div className={classes.headerRow}>
          <div className={classes.headerLeft}>
            <button
              className={classes.backBtn}
              onClick={() => navigate("/fapv2")}
            >
              ←
            </button>
            <div className={classes.headerTitle}>
              {request.flightNumber}
            </div>
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
                <Button
                  backgroundcolor="#F6F7FB"
                  color="#545873"
                  onClick={() => setShowAddService(true)}
                >
                  + Услуга
                </Button>
                <Button
                  backgroundcolor="#FEF2F2"
                  color="#EF4444"
                  onClick={() => setShowCancelForm((v) => !v)}
                >
                  Отменить
                </Button>
              </>
            )}
          </div>
        </div>

        {showCancelForm && (
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className={classes.addFormInput}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #E4E4EF",
                borderRadius: "8px",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
              }}
              placeholder="Причина отмены (необязательно)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <Button backgroundcolor="var(--hover-gray)" color="#000" onClick={() => setShowCancelForm(false)}>
              Отмена
            </Button>
            <Button backgroundcolor="#EF4444" color="#fff" onClick={handleCancel} disabled={saving}>
              Подтвердить
            </Button>
          </div>
        )}
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

      {/* Service sections */}
      <div className={classes.content}>
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
    </div>
  );
}
