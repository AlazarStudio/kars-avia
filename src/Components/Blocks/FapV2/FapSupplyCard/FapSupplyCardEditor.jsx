import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import classes from "./FapSupplyCard.module.css";
import {
  UPDATE_PASSENGER_REQUEST_SUPPLY,
  getCookie,
} from "../../../../../graphQL_requests";
import { useToast } from "../../../../contexts/ToastContext";
import { apolloErrorText } from "../../../../utils/apolloErrorText.js";
import { buildSupplyPatch, isSupplyDraftDirty, supplyDraftFromService, supplyTotal } from "../fapSupply.js";

// Правка факта поставки: диспетчер на не запертой заявке. showInternal —
// стоимость поставщику (только диспетчерским ролям; в реестр для АК не идёт).
export default function FapSupplyCardEditor({
  service,
  serviceKind,
  requestId,
  color,
  unitLabel,
  showInternal,
  onRefetch,
}) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const [draft, setDraft] = useState(() => supplyDraftFromService(service));
  // Черновик на момент загрузки/рефетча: подстановка из плана в него попадает
  // так же, как в draft, — иначе сама подстановка читалась бы как правка.
  const [initial, setInitial] = useState(() => supplyDraftFromService(service));
  const [saving, setSaving] = useState(false);

  const patch = buildSupplyPatch(service, draft);
  const dirty = Object.keys(patch).length > 0 && isSupplyDraftDirty(initial, draft);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Сброс черновика — только по скалярам факта и плана, а не по объекту
  // service целиком (он новый при каждом рефетче даже без реальных изменений).
  // Пока черновик грязный, не перетираем правку пользователя чужим рефетчем
  // (например, подпиской от другой сессии).
  useEffect(() => {
    if (dirtyRef.current) return;
    const next = supplyDraftFromService(service);
    setDraft(next);
    setInitial(next);
    // зависимости — скаляры услуги, а не объект service: новый объект от
    // рефетча не должен сбрасывать черновик
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    service?.supplier,
    service?.suppliedAt,
    service?.quantity,
    service?.unitPrice,
    service?.deliveryCost,
    service?.supplierCost,
    service?.plan?.peopleCount,
    service?.plan?.plannedAt,
  ]);

  const [updateSupply] = useMutation(UPDATE_PASSENGER_REQUEST_SUPPLY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const total = supplyTotal(draft);
  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const handleSave = async () => {
    if (!dirty) return;
    try {
      setSaving(true);
      await updateSupply({ variables: { requestId, service: serviceKind, patch } });
      success("Поставка сохранена");
      onRefetch?.();
    } catch (e) {
      notifyError(apolloErrorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={classes.card}>
      <div className={classes.title}>Поставка</div>
      <div className={classes.grid}>
        <label className={classes.field}>
          <span className={classes.label}>Поставщик</span>
          <input className={classes.input} value={draft.supplier} onChange={set("supplier")} placeholder="Моя столовая" />
        </label>
        <label className={classes.field}>
          <span className={classes.label}>Дата и время поставки</span>
          <input className={classes.input} type="datetime-local" value={draft.suppliedAt} onChange={set("suppliedAt")} />
        </label>
        <label className={classes.field}>
          <span className={classes.label}>{unitLabel}</span>
          <input className={classes.input} type="number" min={0} step={1} value={draft.quantity} onChange={set("quantity")} />
        </label>
        <label className={classes.field}>
          <span className={classes.label}>Цена за единицу (без НДС)</span>
          <input className={classes.input} type="number" min={0} step="0.01" value={draft.unitPrice} onChange={set("unitPrice")} />
        </label>
        <label className={classes.field}>
          <span className={classes.label}>Доставка (без НДС)</span>
          <input className={classes.input} type="number" min={0} step="0.01" value={draft.deliveryCost} onChange={set("deliveryCost")} />
        </label>
        {showInternal && (
          <label className={classes.field}>
            <span className={classes.label}>Стоимость поставщику</span>
            <input className={classes.input} type="number" min={0} step="0.01" value={draft.supplierCost} onChange={set("supplierCost")} title="Только диспетчеру, в реестр для АК не идёт" />
          </label>
        )}
      </div>
      <div className={classes.footer}>
        <span className={classes.total}>
          Сумма для АК: {draft.quantity || 0} × {draft.unitPrice || 0} + {draft.deliveryCost || 0} ={" "}
          <strong>{total.toLocaleString("ru-RU")} ₽</strong>
        </span>
        <button
          type="button"
          className={classes.saveBtn}
          style={{ background: color }}
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
