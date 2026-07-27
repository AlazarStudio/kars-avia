import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@apollo/client";
import classes from "./FapBaggageTripPage.module.css";
import {
  COMPLETE_PASSENGER_REQUEST_BAGGAGE_DRIVER_DELIVERY,
  REMOVE_PASSENGER_REQUEST_BAGGAGE_DRIVER,
  getCookie,
} from "../../../../../graphQL_requests";
import { formatDateTime, formatTime } from "../fapConstants";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";
import { useBaggageTripDraft } from "../hooks/useBaggageTripDraft";
import FapBaggageTripFields, {
  deriveTripCost,
} from "../FapBaggageTripFields/FapBaggageTripFields";
import FapHeaderActions from "../FapHeaderActions/FapHeaderActions";
import BaggageTagsInput from "../BaggageTagsInput/BaggageTagsInput";
import CatalogPickerModal, {
  personKey,
} from "../CatalogPickerModal/CatalogPickerModal";
import BaggageIcon from "../../../../shared/icons/BaggageIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import CopyIcon from "../../../../shared/icons/CopyIcon";

const BG_FG = "#64748B";
const BG_BG = "#F1F5F9";

const TASK_STATUS = {
  ACTIVE: { label: "В работе", color: "#F59E0B", bg: "#FFFBEB" },
  DONE: { label: "Завершён", color: "#10B981", bg: "#ECFDF5" },
};

// Пассажиров берём только из реестра заявки, поэтому пустой реестр — это тупик.
// Называем раздел так же, как чип в шапке заявки («Реестр»), чтобы подсказка
// вела в существующее место интерфейса.
const EMPTY_REGISTRY_HINT =
  "Реестр заявки пуст — сначала добавьте пассажиров в разделе «Реестр»";

const PlusSvg = ({ size = 14, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
const CheckSvg = ({ size = 15, color = "#fff", strokeWidth = 2.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 12l5 5L20 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PhoneSvg = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M22 17v3a2 2 0 0 1-2 2A19 19 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8l-1.3 1.3a16 16 0 0 0 6.6 6.6l1.3-1.3a2 2 0 0 1 1.8-.6l3 .5A2 2 0 0 1 22 17Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const PinSvg = ({ size = 15, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 1 1 18 0Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="3" stroke={color} strokeWidth={strokeWidth} />
  </svg>
);
const MapSvg = ({ size = 15, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const LinkSvg = ({ size = 14, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Клиентский ключ строки пассажира уходит из объекта перед сравнением с
// сервером: в модели его нет. delete сохраняет порядок остальных ключей —
// сравнение с serverPeopleKey идёт по строке JSON.
const stripRowKey = (row) => {
  const rest = { ...row };
  delete rest._rowKey;
  return rest;
};

// Идентичность пассажира для поиска дублей. Новые пассажиры приходят только из
// реестра заявки, то есть с personId, но в уже сохранённых поездках остались
// строки, вписанные руками до отказа от ручного ввода: у них personId нет и
// опознать их можно только по нормализованному ФИО.
const normalizeName = (name) =>
  String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

// Сервер/пикер → строка черновика. reportCost держим строкой: это значение
// <input type="number">, пустая строка означает «сумма не указана».
const toDraftRow = (person) => ({
  personId: person.personId ?? null,
  fullName: person.fullName ?? "",
  phone: person.phone ?? null,
  personType: person.personType ?? "PASSENGER",
  personCategory: person.personCategory ?? null,
  airlinePersonalId: person.airlinePersonalId ?? null,
  baggageTags: Array.isArray(person.baggageTags) ? person.baggageTags : [],
  reportCost: person.reportCost != null ? String(person.reportCost) : "",
  addressTo: person.addressTo ?? "",
});

// Строка черновика → PassengerServiceDriverPersonInput.
const toPersonInput = (row) => ({
  personId: row.personId || null,
  fullName: row.fullName.trim(),
  phone: row.phone || null,
  personType: row.personType || "PASSENGER",
  personCategory: row.personCategory || null,
  airlinePersonalId: row.airlinePersonalId || null,
  baggageTags: row.baggageTags,
  reportCost: row.reportCost === "" ? null : Number(row.reportCost),
  addressTo: row.addressTo.trim() || null,
});

const buildMapUrl = (from, to) => {
  const f = (from || "").trim();
  const t = (to || "").trim();
  if (f && t) {
    return `https://yandex.ru/maps/?rtext=${encodeURIComponent(f)}~${encodeURIComponent(t)}&rtt=auto`;
  }
  const addr = f || t;
  if (!addr) return "";
  return `https://yandex.ru/maps/?text=${encodeURIComponent(addr)}`;
};

export default function FapBaggageTripPage({
  request,
  driverIndex,
  onRefetch,
  canEdit = true,
  showLinks = true,
  user,
}) {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();

  const service = request?.baggageDeliveryService;
  const drivers = useMemo(() => service?.drivers || [], [service]);
  const index = Number(driverIndex);
  const driver = drivers[index] || null;

  const isCancelled = service?.status === "CANCELLED";
  const isCompleted = service?.status === "COMPLETED" || isCancelled;
  const canAct = canEdit && !isCompleted;

  const savedPassengers = useMemo(
    () => request?.savedPassengers || [],
    [request]
  );
  const registryEmpty = !(savedPassengers?.length > 0);

  const [completeDelivery] = useMutation(
    COMPLETE_PASSENGER_REQUEST_BAGGAGE_DRIVER_DELIVERY,
    { context: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const [removeDriver] = useMutation(REMOVE_PASSENGER_REQUEST_BAGGAGE_DRIVER, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Список пассажиров приходит из кэша новой ссылкой на каждый refetch, поэтому
  // синхронизируемся по содержимому, а не по ссылке: иначе чужой refetch стёр бы
  // набранное. Сравниваем в форме черновика — у неё стабильный порядок ключей и
  // строковая сумма, так что «сервер → строка → сервер» не даёт ложного dirty.
  const serverPeopleKey = JSON.stringify((driver?.people || []).map(toDraftRow));

  // Стойкого id у пассажира поездки нет: personId есть только у реестрового,
  // вписанного руками опознать нечем. А ключ по позиции — ловушка: после
  // удаления соседа React отдаёт инстанс строки следующему пассажиру вместе с
  // его внутренним стейтом, и ненабранный токен из BaggageTagsInput уехал бы к
  // чужим биркам. Поэтому выдаём каждой строке собственный ключ в момент её
  // появления — он живёт ровно столько же, сколько сама строка, и переживает
  // удаление любого соседа.
  const rowKeySeq = useRef(0);
  const withRowKey = (row) => ({ ...row, _rowKey: (rowKeySeq.current += 1) });

  const [peopleDraft, setPeopleDraft] = useState(() =>
    JSON.parse(serverPeopleKey).map(withRowKey)
  );

  // У строк пассажиров полей много и фокус ходит между ними, а BaggageTagsInput
  // своих onFocus/onBlur не отдаёт. Поэтому смотрим не на флаг, а на живой
  // activeElement: флаг, выставленный в строке, которую потом размонтировали,
  // остался бы висеть и навсегда заморозил синхронизацию страницы.
  // Ref держим на всём блоке пассажиров, а не на одной таблице: добавление
  // из реестра тоже правит несохранённый список.
  const paxBlockRef = useRef(null);

  useEffect(() => {
    if (paxBlockRef.current?.contains(document.activeElement)) return;
    setPeopleDraft(JSON.parse(serverPeopleKey).map(withRowKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverPeopleKey]);

  const {
    vehicleType,
    setVehicleType,
    deliveredAt,
    setDeliveredAt,
    onDeliveredAtFocus,
    onDeliveredAtBlur,
    dirty: tripFieldsDirty,
    assertValid,
    save: saveTrip,
    saving: savingFields,
  } = useBaggageTripDraft({
    driver,
    requestId: request?.id,
    driverIndex: index,
    onRefetch,
  });

  const peopleChanged =
    JSON.stringify(peopleDraft.map(stripRowKey)) !== serverPeopleKey;
  const isDirty = tripFieldsDirty || peopleChanged;
  const hasPeople = peopleDraft.length > 0;

  const tripCost = deriveTripCost(peopleDraft, driver);

  // Багаж пассажира везёт одна поездка: расписанных по другим поездкам в выборе
  // не предлагаем. Своих страница исключает сама — по черновику, чтобы ещё не
  // сохранённое добавление тоже не предлагалось повторно.
  const takenByOtherTrips = useMemo(
    () =>
      new Set(
        drivers.flatMap((d, j) =>
          j === index
            ? []
            : (d.people ?? []).map((p) => personKey(p)).filter(Boolean)
        )
      ),
    [drivers, index]
  );

  const excludeKeys = useMemo(() => {
    const keys = new Set(takenByOtherTrips);
    const usedNames = new Set();
    peopleDraft.forEach((row) => {
      if (row.personId) keys.add(row.personId);
      const name = normalizeName(row.fullName);
      if (name) usedNames.add(name);
    });
    // Строку без personId (осталась от прежнего ручного ввода) реестр не знает
    // по id, поэтому её карточку в реестре гасим по ФИО — иначе один человек
    // уедет в поездку дважды.
    savedPassengers.forEach((p) => {
      if (p.personId && usedNames.has(normalizeName(p.fullName))) keys.add(p.personId);
    });
    return keys;
  }, [takenByOtherTrips, peopleDraft, savedPassengers]);

  const patchRow = (rowIndex, changes) =>
    setPeopleDraft((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, ...changes } : row))
    );
  const removeRow = (rowIndex) =>
    setPeopleDraft((prev) => prev.filter((_, i) => i !== rowIndex));

  // Добавление правит черновик, а не шлёт мутацию: список пассажиров уходит
  // целиком одним патчем вместе с остальными правками по кнопке «Сохранить».
  const handlePickPeople = (selected) => {
    setPeopleDraft((prev) => {
      const seenIds = new Set(prev.map((row) => row.personId).filter(Boolean));
      const seenNames = new Set(
        prev.map((row) => normalizeName(row.fullName)).filter(Boolean)
      );
      const additions = selected
        .filter(
          (p) =>
            (!p.personId || !seenIds.has(p.personId)) &&
            !seenNames.has(normalizeName(p.fullName))
        )
        .map((p) => withRowKey(toDraftRow(p)));
      return [...prev, ...additions];
    });
    setPickerOpen(false);
  };

  const handleSave = async () => {
    if (!assertValid()) return;
    const extra = {};
    if (peopleChanged) {
      const badCost = peopleDraft.find(
        (row) => row.reportCost !== "" && !Number.isFinite(Number(row.reportCost))
      );
      if (badCost) {
        notifyError(`Некорректная сумма у пассажира «${badCost.fullName || "—"}»`);
        return;
      }
      const noName = peopleDraft.find((row) => !row.fullName.trim());
      if (noName) {
        notifyError("У пассажира не указано ФИО");
        return;
      }
      extra.people = peopleDraft.map(toPersonInput);
    }
    await saveTrip(extra);
  };

  const handleCompleteDelivery = async () => {
    const ok = await confirm("Отметить доставку выполненной?");
    if (!ok) return;
    try {
      setSaving(true);
      await completeDelivery({
        variables: { requestId: request.id, driverIndex: index },
      });
      onRefetch?.();
      success("Доставка отмечена выполненной");
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDriver = async () => {
    const ok = await confirm("Удалить заявку? Это действие нельзя отменить.");
    if (!ok) return;
    try {
      setSaving(true);
      await removeDriver({
        variables: { requestId: request.id, driverIndex: index },
      });
      success("Заявка удалена");
      // Поездки больше нет — оставаться на её странице некуда, уходим к услуге.
      navigate(`/far/${requestId}/service/baggage`);
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при удалении");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (url) => {
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => success("Ссылка скопирована"))
      .catch(() => notifyError("Не удалось скопировать ссылку"));
  };

  if (!driver) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>Поездка не найдена</div>
      </div>
    );
  }

  const done = !!driver.deliveryCompletedAt;
  const statusCfg = TASK_STATUS[done ? "DONE" : "ACTIVE"];
  const hasRoute = driver.addressFrom || driver.addressTo;
  const mapUrl = hasRoute ? buildMapUrl(driver.addressFrom, driver.addressTo) : "";
  const linkUrl = driver.linkPWA || driver.link || "";
  const linkLabel = driver.linkPWA ? "Сканер" : driver.link ? "Ссылка" : "";
  const hasReportData =
    !!driver.vehicleType || tripCost.value != null || !!driver.deliveryCompletedAt;

  return (
    <div className={classes.root}>
      {/* ── Header ── */}
      <div className={classes.headPanel}>
        <div className={classes.headRow1}>
          <div
            className={classes.headIcon}
            style={{ background: BG_BG, color: BG_FG }}
          >
            <BaggageIcon size={24} strokeWidth={2} />
          </div>
          <div className={classes.headText}>
            <div className={classes.headTitleRow}>
              <span className={classes.headNumber} style={{ color: BG_FG }}>
                №{index + 1}
              </span>
              <span className={classes.headTitle}>
                {driver.fullName || "Водитель не указан"}
              </span>
              <span
                className={classes.statusPill}
                style={{ background: statusCfg.bg, color: statusCfg.color }}
              >
                <span
                  className={classes.statusDot}
                  style={{ background: statusCfg.color }}
                />
                {statusCfg.label}
              </span>
            </div>
            {driver.phone && (
              <div className={classes.headSub}>
                <PhoneSvg color="#545873" />
                <strong>{driver.phone}</strong>
              </div>
            )}
          </div>

          {showLinks && linkUrl && (
            <button
              type="button"
              className={classes.linkBtn}
              onClick={() => copyLink(linkUrl)}
              title={`Скопировать ссылку «${linkLabel}»`}
            >
              <LinkSvg color="var(--dark-blue)" /> {linkLabel} <CopyIcon />
            </button>
          )}

          {hasRoute && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.mapBtn}
              title="Открыть маршрут на карте"
            >
              <MapSvg color="var(--dark-blue)" /> На карте
            </a>
          )}

          {done ? (
            <span className={classes.completeBadge}>
              <CheckSvg size={15} color="#10B981" strokeWidth={2.6} /> Завершён
            </span>
          ) : (
            canAct && (
              <button
                type="button"
                className={classes.completeBtn}
                onClick={handleCompleteDelivery}
                disabled={saving}
              >
                <CheckSvg /> Завершить
              </button>
            )
          )}

          {canAct && (
            <button
              type="button"
              className={`${classes.iconBtn} ${classes.iconBtnDanger}`}
              onClick={handleRemoveDriver}
              title="Удалить заявку"
              disabled={saving}
            >
              <DeleteIcon cursor="pointer" />
            </button>
          )}

          <FapHeaderActions
            request={request}
            user={user}
            canEdit={canAct}
            onRefetch={onRefetch}
          />
        </div>

        <div className={classes.headRow2}>
          <div className={classes.metric}>
            <span className={classes.metricLabel}>Пассажиров</span>
            <span className={classes.metricValue}>{peopleDraft.length}</span>
          </div>
          <div className={classes.metricDivider} />
          <div className={classes.metric}>
            <span className={classes.metricLabel}>Подача</span>
            <span className={classes.metricValue}>
              {driver.pickupAt ? formatTime(driver.pickupAt) : "не указана"}
            </span>
          </div>
          <div className={classes.metricDivider} />
          <div className={classes.metric}>
            <span className={classes.metricLabel}>Доставлено</span>
            <span className={classes.metricValue}>
              {driver.deliveryCompletedAt
                ? formatDateTime(driver.deliveryCompletedAt)
                : "—"}
            </span>
          </div>
        </div>

        {hasRoute && (
          <div className={classes.headRow3}>
            <PinSvg size={15} color={BG_FG} style={{ marginTop: 2, flexShrink: 0 }} />
            <div className={classes.routeAddr}>
              {driver.addressFrom && <strong>{driver.addressFrom}</strong>}
              {driver.addressFrom && driver.addressTo && (
                <span className={classes.routeArrow} style={{ color: BG_FG }}>
                  →
                </span>
              )}
              {driver.addressTo && <strong>{driver.addressTo}</strong>}
            </div>
          </div>
        )}

        {driver.description && (
          <div className={classes.headRow4}>{driver.description}</div>
        )}
      </div>

      {/* ── Passengers: address + tags + cost per person ── */}
      {/* На чтении у пустой поездки внутри карточки не осталось бы ничего —
          пустую рамку не рисуем. */}
      {(canAct || hasPeople || hasReportData) && (
        <div className={classes.card}>
          {(canAct || hasPeople) && (
            <div className={classes.paxBlock} ref={paxBlockRef}>
              <div className={classes.paxHead}>
                <span className={classes.paxTitle}>
                  Пассажиры
                  <span className={classes.paxCount}>{peopleDraft.length}</span>
                </span>
                {canAct && peopleChanged && (
                  <span className={classes.paxDirty}>есть несохранённые изменения</span>
                )}
                {canAct && (
                  <span className={classes.paxHeadActions}>
                    {/* Кнопку не прячем: добавить пассажира больше неоткуда, и
                        исчезнувшее действие читалось бы как поломка. Гасим и
                        объясняем причину. */}
                    <button
                      type="button"
                      className={classes.paxAddBtn}
                      onClick={() => setPickerOpen(true)}
                      disabled={registryEmpty}
                      title={registryEmpty ? EMPTY_REGISTRY_HINT : undefined}
                    >
                      <PlusSvg size={13} color="currentColor" /> Из реестра
                    </button>
                  </span>
                )}
              </div>

              <div className={classes.paxTable}>
                <div
                  className={`${classes.paxRow} ${classes.paxHeadRow} ${
                    canAct ? "" : classes.paxRowRO
                  }`}
                >
                  <span>ФИО</span>
                  <span>Адрес доставки</span>
                  <span>Номера бирок</span>
                  <span>Сумма, ₽</span>
                  {canAct && <span />}
                </div>

                {peopleDraft.length === 0 ? (
                  <div className={classes.paxEmpty}>
                    {canAct && registryEmpty
                      ? EMPTY_REGISTRY_HINT
                      : "Пассажиры не добавлены"}
                  </div>
                ) : (
                  peopleDraft.map((row, rowIndex) =>
                    canAct ? (
                      <div key={row._rowKey} className={classes.paxRow}>
                        <span className={classes.paxName} title={row.fullName}>
                          {row.fullName || "—"}
                        </span>
                        <input
                          type="text"
                          value={row.addressTo}
                          onChange={(e) => patchRow(rowIndex, { addressTo: e.target.value })}
                          placeholder="Адрес доставки"
                          className={classes.paxInput}
                        />
                        <BaggageTagsInput
                          value={row.baggageTags}
                          onChange={(next) => patchRow(rowIndex, { baggageTags: next })}
                        />
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={row.reportCost}
                          onChange={(e) => patchRow(rowIndex, { reportCost: e.target.value })}
                          placeholder="0"
                          className={classes.paxInput}
                        />
                        <button
                          type="button"
                          className={`${classes.iconBtn} ${classes.iconBtnDanger} ${classes.paxDelBtn}`}
                          onClick={() => removeRow(rowIndex)}
                          title="Убрать пассажира из поездки"
                        >
                          <DeleteIcon cursor="pointer" />
                        </button>
                      </div>
                    ) : (
                      <div
                        key={row._rowKey}
                        className={`${classes.paxRow} ${classes.paxRowRO}`}
                      >
                        <span className={classes.paxName} title={row.fullName}>
                          {row.fullName || "—"}
                        </span>
                        <span className={classes.paxValue} title={row.addressTo}>
                          {row.addressTo || "—"}
                        </span>
                        <BaggageTagsInput value={row.baggageTags} disabled />
                        <span className={classes.paxValue}>
                          {row.reportCost === ""
                            ? "—"
                            : `${Number(row.reportCost).toLocaleString("ru-RU")} ₽`}
                        </span>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          )}

          {/* ── Trip fields: vehicle type + derived cost + delivery date ── */}
          <FapBaggageTripFields
            canEdit={canAct}
            accent={BG_FG}
            hasReportData={hasReportData}
            vehicleType={canAct ? vehicleType : driver.vehicleType || ""}
            onVehicleTypeChange={setVehicleType}
            deliveredAt={deliveredAt}
            onDeliveredAtChange={setDeliveredAt}
            onDeliveredAtFocus={onDeliveredAtFocus}
            onDeliveredAtBlur={onDeliveredAtBlur}
            deliveredAtText={
              driver.deliveryCompletedAt
                ? formatDateTime(driver.deliveryCompletedAt)
                : "—"
            }
            costText={tripCost.text}
            costHint={tripCost.hint}
            onSave={handleSave}
            saveDisabled={!isDirty || savingFields || saving}
            saving={savingFields}
          />
        </div>
      )}

      {pickerOpen && (
        <CatalogPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          savedPassengers={savedPassengers}
          excludeKeys={excludeKeys}
          onConfirm={handlePickPeople}
          title="Добавить пассажиров в поездку"
        />
      )}
    </div>
  );
}
