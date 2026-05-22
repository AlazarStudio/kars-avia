import React, { useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";

import { TL_CANCELLATION_PENALTY, getCookie } from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import classes from "./TlCancelDialog.module.css";

export default function TlCancelDialog({ bookingId, onConfirm, onClose, confirming }) {
  const token = getCookie("token");
  const [errorMsg, setErrorMsg] = useState("");

  const [fetchPenalty, { data, loading, error }] = useLazyQuery(
    TL_CANCELLATION_PENALTY,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      fetchPolicy: "network-only",
    }
  );

  useEffect(() => {
    if (bookingId) {
      fetchPenalty({ variables: { bookingId } });
    }
  }, [bookingId, fetchPenalty]);

  const penalty = data?.tlCancellationPenalty;
  const hasPenalty = penalty && Number(penalty.penalty) > 0;

  const confirm = async () => {
    setErrorMsg("");
    try {
      await onConfirm();
    } catch (e) {
      setErrorMsg(e?.message || String(e));
    }
  };

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.dialog} onClick={(e) => e.stopPropagation()}>
        <div>
          <div className={classes.title}>Отмена бронирования TravelLine</div>
          <div className={classes.sub}>
            Номер брони: <code>{bookingId}</code>
          </div>
        </div>

        {loading ? (
          <div className={classes.loader}>
            <MUILoader loadSize="28px" color="#0057C3" />
            <span>Рассчитываем штраф за отмену…</span>
          </div>
        ) : error ? (
          <div className={`${classes.box} ${classes.boxWarn}`}>
            Не удалось рассчитать штраф: {error.message}. Можно попробовать всё равно отменить —
            окончательное условие проверит TravelLine.
          </div>
        ) : penalty ? (
          hasPenalty ? (
            <div className={`${classes.box} ${classes.boxDanger}`}>
              <div className={classes.boxTitle}>
                Штраф за отмену: {Number(penalty.penalty).toLocaleString("ru-RU")} {penalty.currency}
              </div>
              {penalty.penaltyType && (
                <div className={classes.boxText}>Тип: {penalty.penaltyType}</div>
              )}
              {penalty.description && (
                <div className={classes.boxText}>{penalty.description}</div>
              )}
            </div>
          ) : (
            <div className={`${classes.box} ${classes.boxOk}`}>
              ✓ Бесплатная отмена — штраф не начисляется
            </div>
          )
        ) : (
          <div className={classes.box}>Подтвердите отмену бронирования.</div>
        )}

        {errorMsg && <div className={`${classes.box} ${classes.boxDanger}`}>{errorMsg}</div>}

        <div className={classes.actions}>
          <button
            type="button"
            className={classes.btnDanger}
            onClick={confirm}
            disabled={confirming}
          >
            {confirming ? "Отменяем…" : "Подтвердить отмену"}
          </button>
          <button type="button" className={classes.btnSecondary} onClick={onClose} disabled={confirming}>
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
