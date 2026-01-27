import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useSubscription } from "@apollo/client";

import classes from "./TransferOrder.module.css";
import Header from "../Header/Header.jsx";
import MUITextField from "../MUITextField/MUITextField.jsx";

import {
  convertToDate,
  GET_TRANSFER_REQUEST,
  DRIVERS_QUERY,
  UPDATE_TRANSFER_REQUEST_MUTATION,
  YMAPS_KEY,
  getCookie,
  buildScheduledISO,
  TRANSFER_UPDATED_SUBSCRIPTION,
  GET_AIRLINES_RELAY,
} from "../../../../graphQL_requests.js";

import OrderInfoSidebar from "../OrderInfoSidebar/OrderInfoSidebar.jsx";
import DriverItem from "../DriverItem/DriverItem.jsx";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import { statusLabels } from "../../../roles.js";
import { canAccessMenu } from "../../../utils/access";

const isFinishedOrCanceled = (status) => {
  const s = String(status || "").toUpperCase();
  return s === "COMPLETED" || s === "CANCELLED";
};

// главное: НЕ добавляй "+00:00" руками.
// Собираем локальные дата+время -> Date -> toISOString() (UTC)
const buildISOFromLocalDateTime = (dateStr, timeStr) => {
  const d = String(dateStr || "").trim();
  const t = String(timeStr || "").trim();
  if (!d || !t) return null;
  const local = new Date(`${d}T${t}:00`); // интерпретируется как local time
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString(); // UTC Z
};

const EDITABLE_STATUSES = new Set([
  "PENDING",
  "ASSIGNED",
  "ACCEPTED",
  // "IN_PROGRESS_TO_CLIENT",
]);

function ConfirmAssignModal({ open, driver, loading, onClose, onConfirm }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !driver) return null;

  return (
    <div className={classes.confirmOverlay} onMouseDown={onClose}>
      <div
        className={classes.confirmModal}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={classes.confirmTitle}>Назначить водителя?</div>

        <div className={classes.confirmDriver}>
          <div className={classes.confirmDriverName}>{driver.name}</div>
          <div className={classes.confirmDriverMeta}>
            {(driver.car || "Авто не указано") +
              (driver.vehicleNumber ? ` • ${driver.vehicleNumber}` : "")}
          </div>
          <div className={classes.confirmDriverMeta}>
            Активных заявок: {driver.activeTransfersCount ?? 0}
          </div>
        </div>

        <div className={classes.confirmActions}>
          <button
            type="button"
            className={classes.confirmBtnSecondary}
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            type="button"
            className={classes.confirmBtnPrimary}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Назначаю..." : "Назначить"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Маршрут как подсказка (линия), не навигация.
 * points: [[lat,lng],[lat,lng]] | null
 */
function RouteHint({ ymaps, map, points }) {
  const routeRef = useRef(null);

  useEffect(() => {
    if (!ymaps || !map) return;

    // удалить старый маршрут
    if (routeRef.current) {
      try {
        map.geoObjects.remove(routeRef.current);
      } catch (_) {}
      routeRef.current = null;
    }

    if (!points || points.length < 2) return;

    const mr = new ymaps.multiRouter.MultiRoute(
      {
        referencePoints: points,
        params: { routingMode: "auto" },
      },
      {
        boundsAutoApply: false,
        wayPointVisible: false,
        viaPointVisible: false,
        pinVisible: false,
      }
    );

    routeRef.current = mr;
    map.geoObjects.add(mr);

    return () => {
      if (routeRef.current) {
        try {
          map.geoObjects.remove(routeRef.current);
        } catch (_) {}
        routeRef.current = null;
      }
    };
  }, [ymaps, map, JSON.stringify(points)]);

  return null;
}

// helpers: split datetime -> date/time
const pad = (n) => String(n).padStart(2, "0");
const toDateAndTime = (iso) => {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
};

function TransferOrder({ user, token, accessMenu }) {
  const params = useParams();
  const orderId = params.orderId || params.id;
  const navigate = useNavigate();

  const authToken = token || getCookie("token") || "";

  // --- edit mode (как в EditRequestTarifCategory) ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    personsId: "",
    fromAddress: "",
    toAddress: "",
    scheduledPickupAt: "", // DATE (YYYY-MM-DD)
    scheduledPickupAtTime: "", // TIME (HH:mm)
    baggage: "",
    description: "",
  });

  // ymaps api + instance карты
  const [ymapsApi, setYmapsApi] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  // --- 1) заявка ---
  const { data, loading: requestLoading, refetch } = useQuery(GET_TRANSFER_REQUEST, {
    variables: { transferId: orderId },
    context: {
      headers: { Authorization: authToken ? `Bearer ${authToken}` : "" },
    },
    skip: !orderId,
  });

  const transfer = data?.transfer || null;
  const status = String(transfer?.status || "").toUpperCase();
  const canEditByStatus = EDITABLE_STATUSES.has(status);
  const canUpdate = accessMenu
    ? canAccessMenu(accessMenu, "transferUpdate", user)
    : true;
  const canEditTransfer = canEditByStatus && canUpdate;

  // если статус стал неразрешённым — выходим из редактирования
  useEffect(() => {
    if (!canEditTransfer && isEditing) {
      setIsEditing(false);
    }
  }, [canEditTransfer, isEditing]);

  // init formData когда пришла заявка (и мы НЕ в редактировании)
  useEffect(() => {
    if (!transfer?.id) return;
    if (isEditing) return;

    const dtISO = transfer?.scheduledPickupAt || transfer?.createdAt || "";
    const { date, time } = toDateAndTime(dtISO);

    setFormData({
      personsId: (transfer?.persons || []).map((p) => p.id),
      fromAddress: transfer?.fromAddress || "",
      toAddress: transfer?.toAddress || "",
      scheduledPickupAt: date,
      scheduledPickupAtTime: time,
      baggage: transfer?.baggage || "",
      description: transfer?.description || "",
    });
  }, [transfer?.id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // --- 2) водители ---
  const [driversSearch, setDriversSearch] = useState("");

  const { data: driversData, loading: driversLoading } = useQuery(DRIVERS_QUERY, {
    variables: { pagination: { all: true } },
    context: {
      headers: { Authorization: authToken ? `Bearer ${authToken}` : "" },
    },
    fetchPolicy: "cache-and-network",
  });

  // --- 2.5) авиакомпании и сотрудники для выбора пассажиров ---
  const { data: airlinesData } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: { Authorization: authToken ? `Bearer ${authToken}` : "" },
    },
    skip: !transfer?.airlineId,
  });

  const selectedAirline = useMemo(() => {
    if (!airlinesData?.airlines?.airlines || !transfer?.airlineId) return null;
    return airlinesData.airlines.airlines.find(
      (airline) => airline.id === transfer.airlineId
    );
  }, [airlinesData, transfer?.airlineId]);

  const airlineStaffOptions = useMemo(() => {
    if (!selectedAirline?.staff) return [];
    return selectedAirline.staff.map((person) => ({
      id: person.id,
      label: `${person.name} ${person.position?.name || ""} ${person.gender || ""}`.trim(),
    }));
  }, [selectedAirline]);

  const drivers = useMemo(() => {
    if (status === "COMPLETED" || status === "CANCELLED") return [];

    const raw = driversData?.drivers?.drivers || [];

    const prepared = raw.map((d) => {
      const activeCount = (d.transfers || []).filter(
        (t) => !isFinishedOrCanceled(t.status)
      ).length;
      return { ...d, activeTransfersCount: activeCount };
    });

    const onlineOnly = prepared.filter((d) => d?.online === true);

    const q = driversSearch.trim().toLowerCase();
    const filtered = !q
      ? onlineOnly
      : onlineOnly.filter((d) =>
          [
            d.name,
            d.vehicleNumber,
            d.car,
            d.organization?.name,
            String(d.number || ""),
          ]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(q))
        );

    filtered.sort((a, b) => a.activeTransfersCount - b.activeTransfersCount);
    return filtered;
  }, [driversData, driversSearch]);

  const driverPoints = useMemo(
    () => drivers.filter((d) => d?.location?.lat != null && d?.location?.lng != null),
    [drivers]
  );

  const assignedDriverId = transfer?.driver?.id || null;

  const driverCoords = useMemo(() => {
    const lat = transfer?.driver?.location?.lat;
    const lng = transfer?.driver?.location?.lng;
    return lat != null && lng != null ? [lat, lng] : null;
  }, [transfer]);

  // --- 3) geocode from/to (берём из formData когда isEditing=true, иначе из transfer) ---
  const currentFromAddress = isEditing ? formData.fromAddress : transfer?.fromAddress;
  const currentToAddress = isEditing ? formData.toAddress : transfer?.toAddress;

  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);

  useEffect(() => {
    if (!ymapsApi) return;
    const addr = String(currentFromAddress || "").trim();
    if (!addr) return;

    let cancelled = false;

    ymapsApi
      .geocode(addr, { results: 1 })
      .then((res) => {
        const first = res?.geoObjects?.get?.(0);
        const coords = first?.geometry?.getCoordinates?.();
        if (!cancelled) setFromCoords(Array.isArray(coords) ? coords : null);
      })
      .catch(() => {
        if (!cancelled) setFromCoords(null);
      });

    return () => {
      cancelled = true;
    };
  }, [ymapsApi, currentFromAddress]);

  useEffect(() => {
    if (!ymapsApi) return;
    const addr = String(currentToAddress || "").trim();
    if (!addr) return;

    let cancelled = false;

    ymapsApi
      .geocode(addr, { results: 1 })
      .then((res) => {
        const first = res?.geoObjects?.get?.(0);
        const coords = first?.geometry?.getCoordinates?.();
        if (!cancelled) setToCoords(Array.isArray(coords) ? coords : null);
      })
      .catch(() => {
        if (!cancelled) setToCoords(null);
      });

    return () => {
      cancelled = true;
    };
  }, [ymapsApi, currentToAddress]);

  // --- 4) центр карты = fromCoords ---
  const mapCenter = useMemo(() => {
    return fromCoords || [44.225, 42.057];
  }, [fromCoords]);

  // --- 5) маршрут по статусу ---
  // const routePoints = useMemo(() => {
  //   if (
  //     (status === "ACCEPTED" || status === "IN_PROGRESS_TO_CLIENT") &&
  //     driverCoords &&
  //     fromCoords
  //   ) {
  //     return [driverCoords, fromCoords];
  //   }

  //   if (
  //     (status === "ARRIVED" ||
  //       status === "IN_PROGRESS_TO_HOTEL" ||
  //       status === "COMPLETED") &&
  //     fromCoords &&
  //     toCoords
  //   ) {
  //     return [fromCoords, toCoords];
  //   }

  //   return null;
  // }, [status, driverCoords, fromCoords, toCoords]);
  // --- 5) маршрут по статусу ---
// ✅ COMPLETED: from -> to
// ✅ ARRIVED / IN_PROGRESS_TO_HOTEL: driver -> to
// ✅ ACCEPTED / IN_PROGRESS_TO_CLIENT: driver -> from
const routePoints = useMemo(() => {
  // 1) Водитель едет к клиенту
  if (
    // (status === "ACCEPTED" || status === "IN_PROGRESS_TO_CLIENT") &&
    (status === "IN_PROGRESS_TO_CLIENT" || status === "CANCELLED") &&
    driverCoords &&
    fromCoords
  ) {
    return [driverCoords, fromCoords];
  }

  // 2) Начиная с ARRIVED (и дальше до завершения поездки) показываем водитель -> КУДА
  // (если у тебя статусы другие — добавь их сюда же)
  if (
    (status === "IN_PROGRESS_TO_HOTEL" || status === "CANCELLED") &&
    // (status === "ARRIVED" || status === "IN_PROGRESS_TO_HOTEL") &&
    driverCoords &&
    toCoords
  ) {
    return [driverCoords, toCoords];
  }

  // 3) Только когда COMPLETED — показываем from -> to
  if ((status === "COMPLETED" || status === "CANCELLED") && fromCoords && toCoords) {
    return [fromCoords, toCoords];
  }

  return null;
}, [status, driverCoords, fromCoords, toCoords]);


  // --- 6) мутации ---
  const [updateTransfer, { loading: assigning }] = useMutation(
    UPDATE_TRANSFER_REQUEST_MUTATION,
    {
      context: {
        headers: { Authorization: authToken ? `Bearer ${authToken}` : "" },
      },
    }
  );

  const handleAssignDriver = async (driverId) => {
    if (!canUpdate) return;
    if (!orderId || !driverId || assigning) return;

    await updateTransfer({
      variables: {
        updateTransferId: orderId,
        input: { driverId, status: "ASSIGNED", dispatcherId: user?.userId },
      },
      refetchQueries: [{ query: GET_TRANSFER_REQUEST, variables: { transferId: orderId } }],
      awaitRefetchQueries: true,
    });
  };

  // --- ✅ edit/save как в твоём примере ---
  const toggleEditOrSave = async () => {
    // если не редактируем -> включаем
    if (!isEditing) {
      if (!canEditTransfer) return;
      setIsEditing(true);
      return;
    }

    // если редактируем -> сохраняем
    if (!canEditTransfer) return;
    if (isSaving) return;

    setIsSaving(true);
    try {
      const scheduledPickupAt =
        formData.scheduledPickupAt && formData.scheduledPickupAtTime
          ? buildScheduledISO(formData.scheduledPickupAt, formData.scheduledPickupAtTime)
          : null;

      await updateTransfer({
        variables: {
          updateTransferId: orderId,
          input: {
            fromAddress: formData.fromAddress,
            toAddress: formData.toAddress,
            baggage: formData.baggage,
            description: formData.description,
            scheduledPickupAt,
            personsId: formData.personsId || [],
          },
        },
        refetchQueries: [{ query: GET_TRANSFER_REQUEST, variables: { transferId: orderId } }],
        awaitRefetchQueries: true,
      });

      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("Ошибка при сохранении заявки");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    if (!transfer?.id) {
      setIsEditing(false);
      return;
    }
    // вернуть из transfer
    const dtISO = transfer?.scheduledPickupAt || transfer?.createdAt || "";
    const { date, time } = toDateAndTime(dtISO);

    setFormData({
      personsId: (transfer?.persons || []).map((p) => p.id),
      fromAddress: transfer?.fromAddress || "",
      toAddress: transfer?.toAddress || "",
      scheduledPickupAt: date,
      scheduledPickupAtTime: time,
      baggage: transfer?.baggage || "",
      description: transfer?.description || "",
    });

    setIsEditing(false);
  };

  // --- 7) confirm назначения водителя ---
  const [confirm, setConfirm] = useState({ open: false, driver: null });

  const openConfirm = (driver) => {
    if (!canUpdate) return;
    if (!driver?.id) return;
    if (driver.id === assignedDriverId) return;
    setConfirm({ open: true, driver });
  };

  const closeConfirm = () => setConfirm({ open: false, driver: null });

  const confirmAssign = async () => {
    const driverId = confirm.driver?.id;
    if (!driverId) return;

    try {
      await handleAssignDriver(driverId);
      closeConfirm();
    } catch (e) {
      console.error(e);
    }
  };

  // --- 8) сайдбар (показ как было) ---
  const sidebarData = useMemo(() => {
    const dt = transfer?.scheduledPickupAt || transfer?.createdAt || null;
    return {
      name:
        transfer?.persons?.map((p) => p.name).filter(Boolean).join(", ") || "",
      fromAddress: transfer?.fromAddress || "",
      toAddress: transfer?.toAddress || "",
      orderDate: dt ? convertToDate(dt) : "",
      orderTime: dt ? convertToDate(dt, true) : "",
      description: transfer?.description || "",
      baggage: transfer?.baggage || "",
    };
  }, [transfer]);

    const { data: subscriptionUpdateData } = useSubscription(
    TRANSFER_UPDATED_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
    }
  );

  return (
    <div className={classes.page}>
      <Header>
        <div className={classes.titleHeader}>
          <div onClick={() => navigate(-1)} className={classes.backButton}>
            <img src="/arrow.png" alt="" />
          </div>
          {statusLabels[status] || status}
        </div>
      </Header>

      <div className={classes.dateLabel}>
        {transfer ? convertToDate(transfer.scheduledPickupAt) : ""}
      </div>

      <section className={classes.layout}>
        <div className={classes.mapAndList}>
          <div className={classes.mapWrapper} style={(status !== "PENDING" && status !== "ASSIGNED" && status !== "ACCEPTED") ? {height:"100%"} : {}}>
            <YMaps query={{ apikey: YMAPS_KEY, lang: "ru_RU", load: "package.full" }}>
              <Map
                state={{ center: mapCenter, zoom: 13 }}
                width="100%"
                height="100%"
                modules={["geocode", "multiRouter.MultiRoute"]}
                onLoad={(ymaps) => setYmapsApi(ymaps)}
                instanceRef={(ref) => {
                  if (ref) setMapInstance(ref);
                }}
              >
                {fromCoords && (
                  <Placemark
                    geometry={fromCoords}
                    options={{ preset: "islands#redIcon" }}
                    properties={{
                      balloonContent: `Откуда: ${currentFromAddress || ""}`,
                    }}
                  />
                )}

                {toCoords && (
                  <Placemark
                    geometry={toCoords}
                    options={{ preset: "islands#violetIcon" }}
                    properties={{
                      balloonContent: `Куда: ${currentToAddress || ""}`,
                    }}
                  />
                )}

                {driverPoints.map((d) => (
                  <Placemark
                    key={d.id}
                    geometry={[d.location.lat, d.location.lng]}
                    options={{
                      preset:
                        d.id === assignedDriverId
                          ? "islands#darkGreenAutoIcon"
                          : "islands#blueAutoIcon",
                    }}
                    properties={{
                      balloonContent: `${d.name} • активных: ${d.activeTransfersCount}`,
                    }}
                    onClick={() => openConfirm(d)}
                  />
                ))}

                <RouteHint ymaps={ymapsApi} map={mapInstance} points={routePoints} />
              </Map>
            </YMaps>
          </div>

            {status === "PENDING" || status === "ASSIGNED" || status === "ACCEPTED" ? (
          <>
          <div className={classes.nearestHeader}>
            <span>Ближайшие машины ({drivers.length})</span>
            <MUITextField
              className={classes.search}
              placeholder="Поиск"
              size="small"
              value={driversSearch}
              onChange={(e) => setDriversSearch(e.target.value)}
            />
          </div>

          <div className={classes.driversList}>
            {drivers.map((driver) => (
              <DriverItem
                key={driver.id}
                {...driver}
                activeTransfersCount={driver.activeTransfersCount}
                handleObject={() => openConfirm(driver)}
                btnTitle={driver.id === assignedDriverId ? "Назначен" : "Назначить"}
                disabled={assigning || driver.id === assignedDriverId || !canUpdate}
              />
            ))}
          </div>
</>
) : null}
        </div>

        <div className={classes.sidebar}>
          <OrderInfoSidebar
            data={sidebarData}
            loading={requestLoading || driversLoading}
            // edit props
            canEditByStatus={canEditTransfer}
            isEditing={isEditing}
            isSaving={isSaving}
            formData={formData}
            onChange={handleChange}
            setFormData={setFormData}
            onToggleEditOrSave={toggleEditOrSave}
            onCancelEditing={cancelEditing}
            airlineStaffOptions={airlineStaffOptions}
          />
        </div>
      </section>

      <ConfirmAssignModal
        open={confirm.open}
        driver={confirm.driver}
        loading={assigning}
        onClose={closeConfirm}
        onConfirm={confirmAssign}
      />
    </div>
  );
}

export default TransferOrder;


// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useQuery, useMutation } from "@apollo/client";

// import classes from "./TransferOrder.module.css";
// import Header from "../Header/Header.jsx";
// import MUITextField from "../MUITextField/MUITextField.jsx";

// import {
//   convertToDate,
//   GET_TRANSFER_REQUEST,
//   DRIVERS_QUERY,
//   UPDATE_TRANSFER_REQUEST_MUTATION,
//   YMAPS_KEY,
//   getCookie,
//   convertToDateOrigin,
// } from "../../../../graphQL_requests.js";

// import OrderInfoSidebar from "../OrderInfoSidebar/OrderInfoSidebar.jsx";
// import DriverItem from "../DriverItem/DriverItem.jsx";
// import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";

// const isFinishedOrCanceled = (status) => {
//   const s = String(status || "").toUpperCase();
//   return s === "COMPLETED" || s === "CANCELLED";
// };

// function ConfirmAssignModal({ open, driver, loading, onClose, onConfirm }) {
//   useEffect(() => {
//     if (!open) return;
//     const onKey = (e) => e.key === "Escape" && onClose();
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [open, onClose]);

//   if (!open || !driver) return null;

//   return (
//     <div className={classes.confirmOverlay} onMouseDown={onClose}>
//       <div
//         className={classes.confirmModal}
//         onMouseDown={(e) => e.stopPropagation()}
//         role="dialog"
//         aria-modal="true"
//       >
//         <div className={classes.confirmTitle}>Назначить водителя?</div>

//         <div className={classes.confirmDriver}>
//           <div className={classes.confirmDriverName}>{driver.name}</div>
//           <div className={classes.confirmDriverMeta}>
//             {(driver.car || "Авто не указано") +
//               (driver.vehicleNumber ? ` • ${driver.vehicleNumber}` : "")}
//           </div>
//           <div className={classes.confirmDriverMeta}>
//             Активных заявок: {driver.activeTransfersCount ?? 0}
//           </div>
//         </div>

//         <div className={classes.confirmActions}>
//           <button
//             type="button"
//             className={classes.confirmBtnSecondary}
//             onClick={onClose}
//             disabled={loading}
//           >
//             Отмена
//           </button>
//           <button
//             type="button"
//             className={classes.confirmBtnPrimary}
//             onClick={onConfirm}
//             disabled={loading}
//           >
//             {loading ? "Назначаю..." : "Назначить"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /**
//  * Маршрут как подсказка (линия), не навигация.
//  * points: [[lat,lng],[lat,lng]] | null
//  */
// function RouteHint({ ymaps, map, points }) {
//   const routeRef = useRef(null);

//   useEffect(() => {
//     if (!ymaps || !map) return;

//     // удалить старый маршрут
//     if (routeRef.current) {
//       try {
//         map.geoObjects.remove(routeRef.current);
//       } catch (_) {}
//       routeRef.current = null;
//     }

//     if (!points || points.length < 2) return;

//     const mr = new ymaps.multiRouter.MultiRoute(
//       {
//         referencePoints: points,
//         params: { routingMode: "auto" },
//       },
//       {
//         boundsAutoApply: false, // не двигаем карту автоматически
//         wayPointVisible: false,
//         viaPointVisible: false,
//         pinVisible: false,
//       }
//     );

//     routeRef.current = mr;
//     map.geoObjects.add(mr);

//     return () => {
//       if (routeRef.current) {
//         try {
//           map.geoObjects.remove(routeRef.current);
//         } catch (_) {}
//         routeRef.current = null;
//       }
//     };
//   }, [ymaps, map, JSON.stringify(points)]);

//   return null;
// }

// function TransferOrder({ user, token }) {
//   const params = useParams();
//   const orderId = params.orderId || params.id;
//   const navigate = useNavigate();

//   const authToken = token || getCookie("token") || "";

//   const [formData, setFormData] = useState({
//     personsId: "",
//     fromAddress: "",
//     toAddress: "",
//     scheduledPickupAt: "",
//     baggage: "",
//     description: ""
//   })

//   // ymaps api + instance карты (В state, чтобы RouteHint обновлялся)
//   const [ymapsApi, setYmapsApi] = useState(null);
//   const [mapInstance, setMapInstance] = useState(null);

//   // --- 1) заявка ---
//   const { data, loading: requestLoading } = useQuery(GET_TRANSFER_REQUEST, {
//     variables: { transferId: orderId },
//     context: {
//       headers: { Authorization: authToken ? `Bearer ${authToken}` : "" },
//     },
//     skip: !orderId,
//   });

//   const transfer = data?.transfer || null;
//   const status = String(transfer?.status || "").toUpperCase();

//   // --- 2) водители ---
//   const [driversSearch, setDriversSearch] = useState("");

//   const { data: driversData, loading: driversLoading } = useQuery(
//     DRIVERS_QUERY,
//     {
//       variables: { pagination: { all: true } },
//       context: {
//         headers: { Authorization: authToken ? `Bearer ${authToken}` : "" },
//       },
//       fetchPolicy: "cache-and-network",
//     }
//   );

//   const drivers = useMemo(() => {
//     const raw = driversData?.drivers?.drivers || [];

//     const prepared = raw.map((d) => {
//       const activeCount = (d.transfers || []).filter(
//         (t) => !isFinishedOrCanceled(t.status)
//       ).length;
//       return { ...d, activeTransfersCount: activeCount };
//     });

//     const onlineOnly = prepared.filter((d) => d?.online === true);

//     const q = driversSearch.trim().toLowerCase();
//     const filtered = !q
//       ? onlineOnly
//       : onlineOnly.filter((d) =>
//           [
//             d.name,
//             d.vehicleNumber,
//             d.car,
//             d.organization?.name,
//             String(d.number || ""),
//           ]
//             .filter(Boolean)
//             .some((x) => String(x).toLowerCase().includes(q))
//         );

//     filtered.sort((a, b) => a.activeTransfersCount - b.activeTransfersCount);
//     return filtered;
//   }, [driversData, driversSearch]);

//   const driverPoints = useMemo(
//     () =>
//       drivers.filter(
//         (d) => d?.location?.lat != null && d?.location?.lng != null
//       ),
//     [drivers]
//   );

//   const assignedDriverId = transfer?.driver?.id || null;

//   const driverCoords = useMemo(() => {
//     const lat = transfer?.driver?.location?.lat;
//     const lng = transfer?.driver?.location?.lng;
//     return lat != null && lng != null ? [lat, lng] : null;
//   }, [transfer]);

//   // --- 3) geocode from/to ---
//   const [fromCoords, setFromCoords] = useState(null);
//   const [toCoords, setToCoords] = useState(null);

//   useEffect(() => {
//     if (!ymapsApi) return;
//     const addr = String(transfer?.fromAddress || "").trim();
//     if (!addr) return;

//     let cancelled = false;

//     ymapsApi
//       .geocode(addr, { results: 1 })
//       .then((res) => {
//         const first = res?.geoObjects?.get?.(0);
//         const coords = first?.geometry?.getCoordinates?.();
//         if (!cancelled) setFromCoords(Array.isArray(coords) ? coords : null);
//       })
//       .catch(() => {
//         if (!cancelled) setFromCoords(null);
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [ymapsApi, transfer?.fromAddress]);

//   useEffect(() => {
//     if (!ymapsApi) return;
//     const addr = String(transfer?.toAddress || "").trim();
//     if (!addr) return;

//     let cancelled = false;

//     ymapsApi
//       .geocode(addr, { results: 1 })
//       .then((res) => {
//         const first = res?.geoObjects?.get?.(0);
//         const coords = first?.geometry?.getCoordinates?.();
//         if (!cancelled) setToCoords(Array.isArray(coords) ? coords : null);
//       })
//       .catch(() => {
//         if (!cancelled) setToCoords(null);
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [ymapsApi, transfer?.toAddress]);

//   // --- 4) центр карты = fromCoords (как ты просил) ---
//   const mapCenter = useMemo(() => {
//     return fromCoords || [44.225, 42.057];
//   }, [fromCoords]);

//   // --- 5) маршрут по статусу ---
//   const routePoints = useMemo(() => {
//     // ACCEPTED / IN_PROGRESS_TO_CLIENT: водитель -> from
//     if (
//       (status === "ACCEPTED" || status === "IN_PROGRESS_TO_CLIENT") &&
//       driverCoords &&
//       fromCoords
//     ) {
//       return [driverCoords, fromCoords];
//     }

//     // ARRIVED / IN_PROGRESS_TO_HOTEL / COMPLETED: from -> to
//     if (
//       (status === "ARRIVED" ||
//         status === "IN_PROGRESS_TO_HOTEL" ||
//         status === "COMPLETED") &&
//       fromCoords &&
//       toCoords
//     ) {
//       return [fromCoords, toCoords];
//     }

//     return null;
//   }, [status, driverCoords, fromCoords, toCoords]);

//   // --- 6) назначение водителя ---
//   const [updateTransfer, { loading: assigning }] = useMutation(
//     UPDATE_TRANSFER_REQUEST_MUTATION,
//     {
//       context: {
//         headers: { Authorization: authToken ? `Bearer ${authToken}` : "" },
//       },
//       // refetchQueries: [
//       //   { query: GET_TRANSFER_REQUEST, variables: { transferId: orderId } },
//       //   { query: DRIVERS_QUERY, variables: { pagination: { all: true } } },
//       // ],
//     }
//   );

//   const handleAssignDriver = async (driverId) => {
//     if (!orderId || !driverId || assigning) return;

//     await updateTransfer({
//       variables: {
//         updateTransferId: orderId,
//         input: { driverId, status: "ASSIGNED" },
//       },
//     });
//   };

//   const handleSubmit = async () => {

//     await updateTransfer({
//       variables: {
//         updateTransferId: orderId,
//         input: {  },
//       },
//     });
//   };

//   const [confirm, setConfirm] = useState({ open: false, driver: null });

//   const openConfirm = (driver) => {
//     if (!driver?.id) return;
//     if (driver.id === assignedDriverId) return;
//     setConfirm({ open: true, driver });
//   };

//   const closeConfirm = () => setConfirm({ open: false, driver: null });

//   const confirmAssign = async () => {
//     const driverId = confirm.driver?.id;
//     if (!driverId) return;

//     try {
//       await handleAssignDriver(driverId);
//       closeConfirm();
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   // --- 7) сайдбар ---
//   const sidebarData = useMemo(() => {
//     const dt = transfer?.scheduledPickupAt || transfer?.createdAt || null;
//     return {
//       name:
//         transfer?.persons
//           ?.map((p) => p.name)
//           .filter(Boolean)
//           .join(", ") || "",
//       fromAddress: transfer?.fromAddress || "",
//       toAddress: transfer?.toAddress || "",
//       orderDate: dt ? convertToDateOrigin(dt) : "",
//       orderTime: dt ? convertToDateOrigin(dt, true) : "",
//       description: transfer?.description || "",
//       baggage: transfer?.baggage || "",
//     };
//   }, [transfer]);
//   // console.log(fromCoords);

//   return (
//     <div className={classes.page}>
//       <Header>
//         <div className={classes.titleHeader}>
//           <div onClick={() => navigate(-1)} className={classes.backButton}>
//             <img src="/arrow.png" alt="" />
//           </div>
//           Назначить водителя
//         </div>
//       </Header>

//       {/* <div className={classes.filtersGroup}></div> */}

//       <div className={classes.dateLabel}>
//         {transfer ? convertToDate(transfer.createdAt) : ""}
//       </div>

//       <section className={classes.layout}>
//         <div className={classes.mapAndList}>
//           <div className={classes.mapWrapper}>
//             <YMaps
//               query={{ apikey: YMAPS_KEY, lang: "ru_RU", load: "package.full" }}
//             >
//               <Map
//                 // управляемая карта: state обновляет центр (в отличие от defaultState)
//                 state={{ center: mapCenter, zoom: 13 }}
//                 width="100%"
//                 height="100%"
//                 modules={["geocode", "multiRouter.MultiRoute"]}
//                 onLoad={(ymaps) => setYmapsApi(ymaps)}
//                 instanceRef={(ref) => {
//                   if (ref) setMapInstance(ref);
//                 }}
//               >
//                 {/* Откуда (клиент) */}
//                 {fromCoords && (
//                   <Placemark
//                     geometry={fromCoords}
//                     options={{ preset: "islands#redIcon" }}
//                     properties={{
//                       balloonContent: `Откуда: ${transfer?.fromAddress || ""}`,
//                     }}
//                   />
//                 )}

//                 {/* Куда */}
//                 {toCoords && (
//                   <Placemark
//                     geometry={toCoords}
//                     options={{ preset: "islands#violetIcon" }}
//                     properties={{
//                       balloonContent: `Куда: ${transfer?.toAddress || ""}`,
//                     }}
//                   />
//                 )}

//                 {/* Водители */}
//                 {driverPoints.map((d) => (
//                   <Placemark
//                     key={d.id}
//                     geometry={[d.location.lat, d.location.lng]}
//                     options={{
//                       preset:
//                         d.id === assignedDriverId
//                           ? "islands#darkGreenAutoIcon"
//                           : "islands#blueAutoIcon",
//                     }}
//                     properties={{
//                       balloonContent: `${d.name} • активных: ${d.activeTransfersCount}`,
//                     }}
//                     onClick={() => openConfirm(d)}
//                   />
//                 ))}

//                 {/* Маршрут-подсказка */}
//                 <RouteHint
//                   ymaps={ymapsApi}
//                   map={mapInstance}
//                   points={routePoints}
//                 />
//               </Map>
//             </YMaps>
//           </div>

//           <div className={classes.nearestHeader}>
//             <span>Ближайшие машины ({drivers.length})</span>
//             <MUITextField
//               className={classes.search}
//               placeholder="Поиск"
//               size="small"
//               value={driversSearch}
//               onChange={(e) => setDriversSearch(e.target.value)}
//             />
//           </div>

//           <div className={classes.driversList}>
//             {drivers.map((driver) => (
//               <DriverItem
//                 key={driver.id}
//                 {...driver}
//                 activeTransfersCount={driver.activeTransfersCount}
//                 handleObject={() => openConfirm(driver)}
//                 btnTitle={
//                   driver.id === assignedDriverId ? "Назначен" : "Назначить"
//                 }
//                 disabled={assigning || driver.id === assignedDriverId}
//               />
//             ))}
//           </div>
//         </div>

//         <div className={classes.sidebar}>
//           <OrderInfoSidebar
//             data={sidebarData}
//             loading={requestLoading || driversLoading}
//           />
//         </div>
//       </section>

//       <ConfirmAssignModal
//         open={confirm.open}
//         driver={confirm.driver}
//         loading={assigning}
//         onClose={closeConfirm}
//         onConfirm={confirmAssign}
//       />
//     </div>
//   );
// }

// export default TransferOrder;

// import React, { useMemo, useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useQuery, useMutation } from "@apollo/client";

// import classes from "./TransferOrder.module.css";
// import Header from "../Header/Header.jsx";
// import MUITextField from "../MUITextField/MUITextField.jsx";

// import {
//   convertToDate,
//   GET_TRANSFER_REQUEST,
//   DRIVERS_QUERY,
//   UPDATE_TRANSFER_REQUEST_MUTATION,
//   YMAPS_KEY,
//   getCookie,
// } from "../../../../graphQL_requests.js";

// import OrderInfoSidebar from "../OrderInfoSidebar/OrderInfoSidebar.jsx";
// import DriverItem from "../DriverItem/DriverItem.jsx";
// import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";

// const isFinishedOrCanceled = (status) => {
//   const s = String(status || "").toUpperCase();
//   return s === "COMPLETED" || s === "CANCELLED";
// };

// function ConfirmAssignModal({ open, driver, loading, onClose, onConfirm }) {
//   // ESC закрывает
//   useEffect(() => {
//     if (!open) return;
//     const onKey = (e) => e.key === "Escape" && onClose();
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [open, onClose]);

//   if (!open || !driver) return null;

//   return (
//     <div className={classes.confirmOverlay} onMouseDown={onClose}>
//       <div
//         className={classes.confirmModal}
//         onMouseDown={(e) => e.stopPropagation()}
//         role="dialog"
//         aria-modal="true"
//       >
//         <div className={classes.confirmTitle}>Назначить водителя?</div>

//         <div className={classes.confirmDriver}>
//           <div className={classes.confirmDriverName}>{driver.name}</div>
//           <div className={classes.confirmDriverMeta}>
//             {(driver.car || "Авто не указано") +
//               (driver.vehicleNumber ? ` • ${driver.vehicleNumber}` : "")}
//           </div>
//           <div className={classes.confirmDriverMeta}>
//             Активных заявок: {driver.activeTransfersCount ?? 0}
//           </div>
//         </div>

//         <div className={classes.confirmActions}>
//           <button
//             type="button"
//             className={classes.confirmBtnSecondary}
//             onClick={onClose}
//             disabled={loading}
//           >
//             Отмена
//           </button>
//           <button
//             type="button"
//             className={classes.confirmBtnPrimary}
//             onClick={onConfirm}
//             disabled={loading}
//           >
//             {loading ? "Назначаю..." : "Назначить"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function TransferOrder({ user, token }) {
//   const params = useParams();
//   const orderId = params.orderId || params.id; // на случай если роут /orders/:id
//   const navigate = useNavigate();

//   const authToken = token || getCookie("token") || "";

//   // --- 1) заявка ---
//   const { data, loading: requestLoading } = useQuery(GET_TRANSFER_REQUEST, {
//     variables: { transferId: orderId },
//     context: {
//       headers: { Authorization: authToken ? `Bearer ${authToken}` : "" },
//     },
//     skip: !orderId,
//   });
//   const transfer = data?.transfer || null;

//   // --- 2) водители ---
//   const [driversSearch, setDriversSearch] = useState("");

//   const { data: driversData, loading: driversLoading } = useQuery(DRIVERS_QUERY, {
//     variables: { pagination: { all: true } },
//     context: {
//       headers: { Authorization: authToken ? `Bearer ${authToken}` : "" },
//     },
//     fetchPolicy: "cache-and-network",
//   });

// const drivers = useMemo(() => {
//   const raw = driversData?.drivers?.drivers || [];

//   const prepared = raw.map((d) => {
//     const activeCount = (d.transfers || []).filter(
//       (t) => !isFinishedOrCanceled(t.status)
//     ).length;

//     return { ...d, activeTransfersCount: activeCount };
//   });

//   // ✅ показываем только online
//   const onlineOnly = prepared.filter((d) => d?.online === true);

//   // поиск
//   const q = driversSearch.trim().toLowerCase();
//   const filtered = !q
//     ? onlineOnly
//     : onlineOnly.filter((d) =>
//         [d.name, d.vehicleNumber, d.car, d.organization?.name, String(d.number || "")]
//           .filter(Boolean)
//           .some((x) => String(x).toLowerCase().includes(q))
//       );

//   // сортировка: сначала самые свободные
//   filtered.sort((a, b) => a.activeTransfersCount - b.activeTransfersCount);

//   return filtered;
// }, [driversData, driversSearch]);

//   // --- 3) карта: точки водителей ---
//   const driverPoints = useMemo(
//     () => drivers.filter((d) => d?.location?.lat != null && d?.location?.lng != null),
//     [drivers]
//   );

//   const assignedDriverId = transfer?.driver?.id || null;

//   const defaultCenter = useMemo(() => {
//     if (transfer?.driver?.location?.lat != null && transfer?.driver?.location?.lng != null) {
//       return [transfer.driver.location.lat, transfer.driver.location.lng];
//     }
//     if (driverPoints[0]) return [driverPoints[0].location.lat, driverPoints[0].location.lng];
//     return [44.225, 42.057];
//   }, [transfer, driverPoints]);

//   // --- 4) мутация назначения ---
//   const [updateTransfer, { loading: assigning }] = useMutation(
//     UPDATE_TRANSFER_REQUEST_MUTATION,
//     {
//       context: {
//         headers: { Authorization: authToken ? `Bearer ${authToken}` : "" },
//       },
//       refetchQueries: [
//         { query: GET_TRANSFER_REQUEST, variables: { transferId: orderId } },
//         { query: DRIVERS_QUERY, variables: { pagination: { all: true } } },
//       ],
//     }
//   );

//   const handleAssignDriver = async (driverId) => {
//     if (!orderId || !driverId || assigning) return;

//     await updateTransfer({
//       variables: {
//         updateTransferId: orderId,
//         input: { driverId, status: "ASSIGNED" },
//       },
//     });
//   };

//   // --- ✅ 5) confirm перед назначением ---
//   const [confirm, setConfirm] = useState({ open: false, driver: null });

//   const openConfirm = (driver) => {
//     if (!driver?.id) return;
//     if (driver.id === assignedDriverId) return; // уже назначен
//     setConfirm({ open: true, driver });
//   };

//   const closeConfirm = () => setConfirm({ open: false, driver: null });

//   const confirmAssign = async () => {
//     const driverId = confirm.driver?.id;
//     if (!driverId) return;

//     try {
//       await handleAssignDriver(driverId);
//       closeConfirm();
//     } catch (e) {
//       console.error(e);
//       // можно потом сюда тост/alert
//     }
//   };

//   // --- 6) сайдбар ---
//   const sidebarData = useMemo(() => {
//     const dt = transfer?.scheduledPickupAt || transfer?.createdAt || null;
//     return {
//       name: transfer?.persons?.map((p) => p.name).filter(Boolean).join(", ") || "",
//       fromAddress: transfer?.fromAddress || "",
//       toAddress: transfer?.toAddress || "",
//       orderDate: dt ? convertToDate(dt) : "",
//       orderTime: dt ? convertToDate(dt, true) : "",
//       description: transfer?.description || "",
//       baggage: transfer?.baggage || "",
//     };
//   }, [transfer]);

//   return (
//     <div className={classes.page}>
//       <Header>
//         <div className={classes.titleHeader}>
//           <div onClick={() => navigate(-1)} className={classes.backButton}>
//             <img src="/arrow.png" alt="" />
//           </div>
//           Назначить водителя
//         </div>
//       </Header>

//       <div className={classes.filtersRow}>
//         <div className={classes.filtersGroup}>
//           {/* <button className={`${classes.filterButton} ${classes.filterButton_active}`}>
//             Все водители
//           </button>
//           <button className={classes.filterButton}>На 2–4 человек</button>
//           <button className={classes.filterButton}>Дата</button> */}
//         </div>
//       </div>

//       <div className={classes.dateLabel}>
//         {transfer ? convertToDate(transfer.createdAt) : ""}
//       </div>

//       <section className={classes.layout}>
//         <div className={classes.mapAndList}>
//           <div className={classes.mapWrapper}>
//             <YMaps query={{ apikey: YMAPS_KEY, lang: "ru_RU" }}>
//               <Map
//                 defaultState={{ center: defaultCenter, zoom: 13 }}
//                 width="100%"
//                 height="100%"
//               >
//                 {driverPoints.map((d) => (
//                   <Placemark
//                     key={d.id}
//                     geometry={[d.location.lat, d.location.lng]}
//                     options={{
//                       preset:
//                         d.id === assignedDriverId
//                           ? "islands#darkGreenAutoIcon"
//                           : "islands#blueAutoIcon",
//                     }}
//                     properties={{
//                       balloonContent: `${d.name} • активных: ${d.activeTransfersCount}`,
//                     }}
//                     // ✅ вместо назначения — открываем подтверждение
//                     onClick={() => openConfirm(d)}
//                   />
//                 ))}
//               </Map>
//             </YMaps>
//           </div>

//           <div className={classes.nearestHeader}>
//             <span>Ближайшие машины ({drivers.length})</span>
//             <MUITextField
//               className={classes.search}
//               placeholder="Поиск"
//               size="small"
//               value={driversSearch}
//               onChange={(e) => setDriversSearch(e.target.value)}
//             />
//           </div>

//           <div className={classes.driversList}>
//             {drivers.map((driver) => (
//               <DriverItem
//                 key={driver.id}
//                 {...driver}
//                 activeTransfersCount={driver.activeTransfersCount}
//                 // хочешь — пусть и список тоже спрашивает подтверждение:
//                 handleObject={() => openConfirm(driver)}
//                 btnTitle={driver.id === assignedDriverId ? "Назначен" : "Назначить"}
//                 disabled={assigning || driver.id === assignedDriverId}
//               />
//             ))}
//           </div>
//         </div>

//         <div className={classes.sidebar}>
//           <OrderInfoSidebar
//             data={sidebarData}
//             loading={requestLoading || driversLoading}
//           />
//         </div>
//       </section>

//       <ConfirmAssignModal
//         open={confirm.open}
//         driver={confirm.driver}
//         loading={assigning}
//         onClose={closeConfirm}
//         onConfirm={confirmAssign}
//       />
//     </div>
//   );
// }

// export default TransferOrder;
