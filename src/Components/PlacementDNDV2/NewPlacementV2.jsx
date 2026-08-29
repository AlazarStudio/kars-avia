import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import {
  AutoScrollActivator,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { startOfDay } from "date-fns";
import { useMutation } from "@apollo/client";
import BoardToolbar from "./components/BoardToolbar";
import GridHeader from "./components/GridHeader";
import RoomRowV2 from "./components/RoomRowV2";
import PlacementBarV2 from "./components/PlacementBarV2";
import TrayCardV2 from "./components/TrayCardV2";
import UnplacedTray from "./components/UnplacedTray";
import ConfirmBookingModalV2 from "./components/ConfirmBookingModalV2";
import EditRequestModalV2 from "./components/EditRequestModalV2";
import Notification from "../Notification/Notification";
import MUILoader from "../Blocks/MUILoader/MUILoader";
import ExistRequest from "../Blocks/ExistRequest/ExistRequest";
import EditRequestNomerFond from "../Blocks/EditRequestNomerFond/EditRequestNomerFond";
import { roles } from "../../roles";
import {
  canAccessMenu,
  getDispatcherAccess,
} from "../../utils/access";
import {
  getCookie,
  UPDATE_HOTEL_BRON,
  UPDATE_REQUEST_RELAY,
} from "../../../graphQL_requests";
import { usePlacementData } from "./hooks/usePlacementData";
import { buildFilteredRooms, filterRequestsBySearch } from "./utils/placementFilters";
import { hasOverlap, getOverlappingRequests } from "./utils/placementOverlap";
import { getAvailablePosition } from "./utils/placementPositions";
import { buildPeriod, shiftAnchor } from "./utils/placementPeriod";
import classes from "./NewPlacementV2.module.css";

const LABEL_WIDTH = 240;
// Нижний предел ширины дня — защита от нулевой/отрицательной ширины
// контейнера, а не от «слишком узкого» месяца: период всегда виден целиком.
const MIN_DAY_WIDTH = 8;
// Клик по плашке не должен запускать drag — 5px порог незаметен рукой.
const DRAG_ACTIVATION_DISTANCE = 5;

const sameId = (a, b) => String(a) === String(b);

const NewPlacementV2 = ({ idHotelInfo, user, accessMenu, onCreateRequest }) => {
  const { idHotel, requestId } = useParams();

  const hotelId = idHotelInfo ? idHotelInfo : idHotel;
  const token = getCookie("token");

  const dispatcherCanChat = getDispatcherAccess(accessMenu, "requestChat", user);
  const dispatcherCanUpdate = getDispatcherAccess(
    accessMenu,
    "requestUpdate",
    user
  );
  const canCreate = user?.role !== roles.hotelAdmin;

  const [hasInitialLoadCompleted, setHasInitialLoadCompleted] = useState(false);

  const [showEditNomer, setShowEditNomer] = useState(false);
  const [selectedNomer, setSelectedNomer] = useState(null);

  const [view, setView] = useState("month");
  const [anchor, setAnchor] = useState(new Date());
  const period = useMemo(() => buildPeriod(view, anchor), [view, anchor]);

  const [searchQuery, setSearchQuery] = useState("");
  const [trayOpen, setTrayOpen] = useState(null); // null = авто по данным
  const [dragTarget, setDragTarget] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableRequest, setEditableRequest] = useState(null);
  const [originalRequest, setOriginalRequest] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [activeDragItem, setActiveDragItem] = useState(null);
  const [activeDragItemOld, setActiveDragItemOld] = useState(null);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

  const [highlightedDates, setHighlightedDates] = useState([]);

  const [, setShowChooseHotel] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [selectedRequestID, setSelectedRequestID] = useState(null);

  const gridScrollRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Период всегда влезает в ширину доски: горизонтального скролла нет,
  // ширина дня — производная от фактической ширины контейнера.
  useLayoutEffect(() => {
    const node = gridScrollRef.current;
    if (!node) return undefined;
    const measure = () => setContainerWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Дробную ширину не округляем: округление копит рассинхрон ячеек и плашек.
  const dayW = useMemo(() => {
    const daysCount = period.days.length || 1;
    return Math.max((containerWidth - LABEL_WIDTH) / daysCount, MIN_DAY_WIDTH);
  }, [containerWidth, period]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
    useSensor(KeyboardSensor)
  );

  const periodStart = useMemo(() => period.start.toISOString(), [period]);
  const periodEnd = useMemo(() => period.end.toISOString(), [period]);

  const {
    hotelInfo,
    loadingHotel,
    loadingRooms,
    rooms,
    roomsRefetch,
    requests,
    setRequests,
    newRequests,
    bronLoading,
    bronRefetch,
    refetchBrons,
  } = usePlacementData({
    hotelId,
    token,
    periodStart,
    periodEnd,
  });

  const initialLoading =
    Boolean(hotelId) && (loadingHotel || loadingRooms || bronLoading);

  useEffect(() => {
    if (!initialLoading && !hasInitialLoadCompleted) {
      setHasInitialLoadCompleted(true);
    }
  }, [hasInitialLoadCompleted, initialLoading]);

  useEffect(() => {
    setHasInitialLoadCompleted(false);
  }, [hotelId]);

  const [updateHotelBron] = useMutation(UPDATE_HOTEL_BRON, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    onCompleted: () => {
      refetchBrons();
      bronRefetch();
    },
  });

  const [updateRequest] = useMutation(UPDATE_REQUEST_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    onCompleted: () => {
      refetchBrons();
      bronRefetch();
    },
  });

  const handleUpdateRequest = useCallback(
    (updatedRequest) => {
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === updatedRequest.id ? updatedRequest : req
        )
      );
    },
    [setRequests]
  );

  const handleDragStartForRequest = (request) => {
    if (!request) return;
    const dragStart = startOfDay(new Date(request.checkInDate));
    const dragEnd = startOfDay(new Date(request.checkOutDate));

    const datesToHighlight = period.days.filter(
      (date) =>
        date.getTime() >= dragStart.getTime() &&
        date.getTime() <= dragEnd.getTime()
    );

    setHighlightedDates(datesToHighlight);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const draggedItem = newRequests.find((req) => sameId(req.id, active.id));
    const draggedItemOld = requests.find((req) => sameId(req.id, active.id));
    const activeItem = draggedItemOld || draggedItem;
    setActiveDragItem(activeItem);
    setActiveDragItemOld(draggedItemOld);
    setIsDraggingGlobal(true);
    setDragTarget(null);

    handleDragStartForRequest(activeItem);
  };

  // Подсказка-подсветка целевой койки. Валидацию дропа НЕ дублирует —
  // фактические проверки остаются в handleDragEnd.
  const handleDragOver = (event) => {
    const { over } = event;
    if (!over || !activeDragItem) {
      setDragTarget(null);
      return;
    }
    const [roomId, positionStr] = String(over.id).split("-");
    const position = parseInt(positionStr, 10);
    const room = rooms.find((r) => r.roomId === roomId);
    if (!room) {
      setDragTarget(null);
      return;
    }
    const occupied = requests.some((req) => {
      if (req.room?.id !== roomId || req.position !== position) return false;
      if (req.id === activeDragItem.id) return false;
      const s = new Date(`${req.checkInDate}T${req.checkInTime}`);
      const e = new Date(`${req.checkOutDate}T${req.checkOutTime}`);
      const ds = new Date(
        `${activeDragItem.checkInDate}T${activeDragItem.checkInTime}`
      );
      const de = new Date(
        `${activeDragItem.checkOutDate}T${activeDragItem.checkOutTime}`
      );
      return !(e <= ds || s >= de);
    });
    setDragTarget({ roomId, position, valid: room.active && !occupied });
  };

  const handleDragEnd = async (event) => {
    setIsDraggingGlobal(false);
    setActiveDragItem(null);
    setHighlightedDates([]);
    setDragTarget(null);

    const { active, over } = event;

    if (!over) {
      return;
    }

    const draggedRequest =
      newRequests.find((req) => sameId(req.id, active.id)) ||
      requests.find((req) => sameId(req.id, active.id));

    // легаси-плашки резерва инертны: бэк игнорирует их запись (hotel.resolver: reserve disabled)
    if (draggedRequest && !draggedRequest.isRequest) {
      return;
    }

    const [targetRoomId, targetPositionStr] = over.id.split("-");
    const targetPosition = parseInt(targetPositionStr, 10);

    if (!targetRoomId) {
      addNotification("Целевая комната не определена!", "error");
      return;
    }

    const targetRoom = rooms.find((room) => room.roomId === targetRoomId);
    const currentRoom = rooms.find(
      (room) => room.roomId === draggedRequest?.room?.id
    );

    if (!targetRoom) {
      addNotification("Текущая или целевая комната не найдена", "error");
      return;
    }

    if (!currentRoom) {
      const overlappingRequests = getOverlappingRequests({
        requests,
        targetRoomId,
        draggedRequest,
      });

      const occupiedPositions = overlappingRequests.map((req) => req.position);
      const availablePosition = getAvailablePosition(
        targetRoom.type,
        occupiedPositions
      );

      if (availablePosition === undefined) {
        addNotification("Все позиции заняты в этой комнате!", "error");
        return;
      }

      const newRequest = {
        ...draggedRequest,
        room: targetRoomId,
        roomId: targetRoom.roomId,
        position: availablePosition,
        status: "Ожидает",
      };

      setRequests((prevRequests) => {
        const exists = prevRequests.some((req) => req.id === newRequest.id);
        if (exists) {
          addNotification(
            `Заявка с id ${newRequest.id} уже существует!`,
            "error"
          );
          return prevRequests;
        }
        return [...prevRequests, newRequest];
      });

      setSelectedRequest(newRequest);
      setIsConfirmModalOpen(true);
      return;
    }

    if (currentRoom.roomId === targetRoomId) {
      const newCheckIn = new Date(
        `${draggedRequest.checkInDate}T${draggedRequest.checkInTime}:00`
      );
      const newCheckOut = new Date(
        `${draggedRequest.checkOutDate}T${draggedRequest.checkOutTime}:00`
      );

      const occupied = requests.some((req) => {
        if (req.room?.id !== targetRoomId || req.position !== targetPosition) {
          return false;
        }

        const existingStart = new Date(
          `${req.checkInDate}T${req.checkInTime}:00`
        );
        const existingEnd = new Date(
          `${req.checkOutDate}T${req.checkOutTime}:00`
        );

        return !(existingEnd <= newCheckIn || existingStart >= newCheckOut);
      });

      if (draggedRequest.position === targetPosition) {
        return;
      }

      if (occupied) {
        addNotification("Место занято в комнате!", "error");
        return;
      }

      if (draggedRequest?.status === "Архив") {
        addNotification(
          "Эту заявку нельзя перемещать, так как она в архиве",
          "error"
        );
        return;
      }

      const bookingInput = {
        hotelChesses: [
          {
            status: "done",
            requestId: draggedRequest.requestID,
            roomId: targetRoomId,
            place: targetPosition + 1,
            clientId: draggedRequest.personID,
            id: draggedRequest.chessID,
          },
        ],
      };

      try {
        await updateHotelBron({
          variables: {
            updateHotelId: hotelId,
            input: bookingInput,
          },
        });
        addNotification(
          "Заявка перемещена в комнату " + (targetPosition + 1),
          "success"
        );
      } catch (err) {
        addNotification("Ошибка при перемещении внутри номера", "error");
      }
      return;
    }

    const overlappingRequests = getOverlappingRequests({
      requests,
      targetRoomId,
      draggedRequest,
    });
    const occupiedPositions = overlappingRequests.map((req) => req.position);

    if (newRequests.includes(draggedRequest)) {
      if (targetRoom.active) {
        const availablePosition = getAvailablePosition(
          targetRoom.type,
          occupiedPositions
        );

        if (availablePosition === undefined) {
          addNotification("Все позиции заняты в этой комнате!", "error");
          return;
        }

        const newRequest = {
          ...draggedRequest,
          room: targetRoomId,
          roomId: targetRoom.roomId,
          position: availablePosition,
          status: "Ожидает",
        };

        setRequests((prevRequests) => {
          const exists = prevRequests.some((req) => req.id === newRequest.id);
          if (exists) {
            addNotification(
              `Заявка с id ${newRequest.id} уже существует!`,
              "error"
            );
            return prevRequests;
          }
          return [...prevRequests, newRequest];
        });

        setSelectedRequest(newRequest);
        setIsConfirmModalOpen(true);
      } else {
        addNotification("Комната не активна!", "error");
        return;
      }
    } else {
      if (targetRoom.active) {
        if (draggedRequest.room?.id === targetRoomId) {
          const targetPosition = parseInt(over.data.current?.position || 0, 10);

          if (draggedRequest.position !== targetPosition) {
            setRequests((prevRequests) =>
              prevRequests.map((request) => {
                if (request.room?.id === targetRoomId) {
                  if (request.id === draggedRequest.id) {
                    return { ...request, position: targetPosition };
                  } else if (request.position === targetPosition) {
                    return { ...request, position: draggedRequest.position };
                  }
                }
                return request;
              })
            );
          }
        } else {
          const availablePosition = getAvailablePosition(
            targetRoom.type,
            occupiedPositions
          );

          if (availablePosition === undefined) {
            addNotification("Место занято в комнате!", "error");
            return;
          }

          if (draggedRequest.status === "Архив") {
            addNotification(
              "Эту заявку нельзя перемещать, так как она в архиве",
              "error"
            );
            return;
          }

          const bookingInput = {
            hotelChesses: [
              {
                requestId: draggedRequest.requestID,
                roomId: targetRoom.roomId,
                place: Number(availablePosition) + 1,
                clientId: draggedRequest.personID,
                id: draggedRequest.chessID,
              },
            ],
          };

          try {
            await updateHotelBron({
              variables: {
                updateHotelId: hotelId,
                input: bookingInput,
              },
            });
            addNotification("Бронь успешно перемещена", "success");
          } catch (err) {
            addNotification(
              "Произошла ошибка при подтверждении бронирования",
              "error"
            );
            console.error(err)
          }
        }
      } else {
        addNotification("Комната не активна!", "error");
        return;
      }
    }
  };

  const handleOpenModal = useCallback((request, originalRequest) => {
    setOriginalRequest(originalRequest);
    setEditableRequest(request);
    setIsModalOpen(true);
  }, []);

  const handleSaveChanges = async (updatedRequest) => {
    const originalCheckIn = new Date(
      `${editableRequest.checkInDate}T${editableRequest.checkInTime}`
    );
    const originalCheckOut = new Date(
      `${editableRequest.checkOutDate}T${editableRequest.checkOutTime}`
    );
    const newCheckIn = new Date(
      `${updatedRequest.checkInDate}T${updatedRequest.checkInTime}`
    );
    const newCheckOut = new Date(
      `${updatedRequest.checkOutDate}T${updatedRequest.checkOutTime}`
    );

    let newStatus = updatedRequest.status;

    if (
      newCheckIn.getTime() === originalCheckIn.getTime() &&
      newCheckOut.getTime() === originalCheckOut.getTime()
    ) {
      newStatus = editableRequest.status;
    } else {
      if (newCheckIn > originalCheckIn) {
        newStatus = "Сокращен";
      } else if (newCheckIn < originalCheckIn) {
        newStatus = "Ранний заезд";
      }

      if (newCheckOut > originalCheckOut) {
        newStatus = "Продлен";
      } else if (newCheckOut < originalCheckOut) {
        newStatus = "Сокращен";
      }
    }

    const requestToSave = {
      ...updatedRequest,
      status: newStatus,
    };

    if (hasOverlap({ requests, updatedRequest: requestToSave })) {
      addNotification(
        "Изменение заявки недопустимо: пересечение с другой заявкой!",
        "error"
      );
      return;
    }

    setRequests((prevRequests) =>
      prevRequests.map((req) =>
        req.id === requestToSave.id ? requestToSave : req
      )
    );

    setOriginalRequest(null);
    setIsModalOpen(false);

    try {
      await updateRequest({
        variables: {
          updateRequestId: requestToSave.requestID,
          input: {
            arrival: `${requestToSave.checkInDate}T${requestToSave.checkInTime}:00.000Z`,
            departure: `${requestToSave.checkOutDate}T${requestToSave.checkOutTime}:00.000Z`,
            status:
              newStatus === "Сокращен"
                ? "reduced"
                : newStatus === "Продлен"
                  ? "extended"
                  : newStatus === "Ранний заезд"
                    ? "earlyStart"
                    : newStatus === "Перенесен"
                      ? "transferred"
                      : newStatus === "Забронирован"
                        ? "done"
                        : newStatus === "Готов к архиву"
                          ? "archiving"
                          : "",
          },
        },
      });

      addNotification(
        newStatus === "Сокращен"
          ? "Заявка сокращена успешно"
          : newStatus === "Продлен"
            ? "Заявка продлена успешно"
            : newStatus === "Ранний заезд"
              ? "Заезд успешно изменен"
              : "Заявка успешно изменена",
        "success"
      );
    } catch (err) {
      console.log("Произошла ошибка при подтверждении бронирования", err);
    }
  };

  const handleCloseModal = () => {
    if (originalRequest) {
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === originalRequest.id ? originalRequest : req
        )
      );
    }
    setOriginalRequest(null);
    setEditableRequest(null);
    setIsModalOpen(false);
  };

  const confirmBooking = async (request) => {
    const bookingInput = {
      hotelChesses: [
        {
          clientId: request.personID,
          start: `${request.checkInDate}T${request.checkInTime}:00.000Z`,
          end: `${request.checkOutDate}T${request.checkOutTime}:00.000Z`,
          hotelId: hotelId,
          requestId: request.requestID ? request.requestID : "",
          roomId: `${request.roomId}`,
          place: Number(request.position) + 1,
          public: true,
        },
      ],
    };

    try {
      setSelectedRequest(null);
      setIsConfirmModalOpen(false);
      await updateHotelBron({
        variables: {
          updateHotelId: hotelId,
          input: bookingInput,
        },
      });
      addNotification("Бронь успешно добавлена", "success");
    } catch (err) {
      console.error("Произошла ошибка при подтверждении бронирования", err);
    }
  };

  const handleCancelBooking = () => {
    if (selectedRequest) {
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== selectedRequest.id)
      );
    }

    setIsConfirmModalOpen(false);
    setSelectedRequest(null);
  };

  const toggleRequestSidebar = useCallback((requestID) => {
    setSelectedRequestID(requestID);
    setShowRequestSidebar(true);
  }, []);

  const handleRoomClick = useCallback((item) => {
    setSelectedNomer(item);
    setShowEditNomer(true);
  }, []);

  const filteredRequests = useMemo(
    () =>
      filterRequestsBySearch({
        requests,
        searchQuery,
        startOfCurrentMonth: period.start,
        endOfCurrentMonth: period.end,
      }),
    [requests, searchQuery, period]
  );

  const filteredRooms = useMemo(
    () =>
      buildFilteredRooms({
        rooms,
        filteredRequests,
        searchQuery,
      }),
    [rooms, filteredRequests, searchQuery]
  );

  const filteredNewRequests = useMemo(() => {
    const canSeeUnplaced = (user?.hotelId && hotelInfo?.access) || !user?.hotelId;
    if (!canSeeUnplaced) return [];

    const shouldFilter = Boolean(user?.hotelId && hotelInfo?.access);

    return newRequests
      .slice()
      .sort((a, b) => {
        if (a.requestID === requestId) return -1;
        if (b.requestID === requestId) return 1;
        return 0;
      })
      .filter((request) => (shouldFilter ? request.hotelId === hotelId : true));
  }, [newRequests, user, hotelInfo, hotelId, requestId]);

  // Список скрыт гейтом доступа гостиницы — пустой лоток тогда не означает
  // «всё размещено», поэтому лоток показывает нейтральный текст.
  const unplacedHidden = Boolean(
    user?.hotelId && hotelInfo && !hotelInfo.access
  );

  const trayOpenEffective = trayOpen ?? filteredNewRequests.length > 0;

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5300);
  };

  // Скролл к строке заявки из URL (блинк плашки живёт в самой плашке)
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (!requestId || hasScrolledRef.current || !gridScrollRef.current) return;
    const room = filteredRooms.find((item) =>
      item.requests?.some((req) => req.requestID === requestId)
    );
    if (!room) return;
    const scroller = gridScrollRef.current;
    const rowEl = scroller.querySelector(`[data-room-id="${room.roomId}"]`);
    if (!rowEl) return;
    // Ручной скролл только грид-контейнера: scrollIntoView дёргал всю страницу.
    const rowRect = rowEl.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const rowTop = rowRect.top - scrollerRect.top + scroller.scrollTop;
    scroller.scrollTop = Math.max(
      0,
      rowTop - scroller.clientHeight / 2 + rowRect.height / 2
    );
    hasScrolledRef.current = true;
  }, [filteredRooms, requestId]);

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={(e) => handleDragStart(e)}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        autoScroll={{
          enabled: true,
          // threshold.x: 0 — зона срабатывания горизонтального автоскролла
          // нулевая, ось X не дёргается при перетаскивании вниз.
          threshold: { x: 0, y: 0.08 },
          acceleration: 28,
          interval: 2,
          activator: AutoScrollActivator.Pointer,
          canScroll: (element) => {
            if (!(element instanceof HTMLElement)) return false;
            const style = getComputedStyle(element);
            const overflowY = style.overflowY;
            const canScrollY =
              (overflowY === "auto" || overflowY === "scroll") &&
              element.scrollHeight > element.clientHeight;
            // Горизонтальный автоскролл выключен через threshold.x, поэтому
            // живой горизонтальный скролл сетки не должен глушить вертикальный.
            return canScrollY;
          },
        }}
      >
        <div className={classes.card}>
          <BoardToolbar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            trayOpen={trayOpenEffective}
            onToggleTray={() => setTrayOpen(!trayOpenEffective)}
            trayCount={filteredNewRequests.length}
            onCreateRequest={onCreateRequest}
            canCreate={canCreate}
          />

          <div className={classes.boardRow}>
            <div
              className={classes.gridScroll}
              ref={gridScrollRef}
              data-grid-scroll=""
            >
              <div className={classes.gridInner}>
                <GridHeader
                  view={view}
                  period={period}
                  dayW={dayW}
                  onSetView={setView}
                  onShift={(dir) =>
                    setAnchor((prev) => shiftAnchor(view, prev, dir))
                  }
                  onToday={() => setAnchor(new Date())}
                />

                {filteredRooms.map((room) => (
                  <RoomRowV2
                    key={room.roomId}
                    room={room}
                    days={period.days}
                    dayW={dayW}
                    period={period}
                    dragTarget={
                      dragTarget?.roomId === room.roomId ? dragTarget : null
                    }
                    highlightedDates={highlightedDates}
                    requestId={requestId}
                    hotelAccess={hotelInfo?.access}
                    user={user}
                    allRequests={filteredRequests}
                    onUpdateRequest={handleUpdateRequest}
                    onOpenModal={handleOpenModal}
                    isDraggingGlobal={isDraggingGlobal}
                    toggleRequestSidebar={toggleRequestSidebar}
                    onRoomClick={handleRoomClick}
                  />
                ))}
              </div>
            </div>

            <UnplacedTray
              open={trayOpenEffective}
              onClose={() => setTrayOpen(false)}
              city={hotelInfo?.information?.city}
              items={filteredNewRequests}
              listHidden={unplacedHidden}
              onCreateRequest={onCreateRequest}
              canCreate={canCreate}
              requestId={requestId}
              toggleRequestSidebar={toggleRequestSidebar}
            />
          </div>

          {!hasInitialLoadCompleted && initialLoading && (
            <div className={classes.loader}>
              <MUILoader fullHeight="100%" />
            </div>
          )}
        </div>

        <DragOverlay
          adjustScale={false}
          dropAnimation={null}
          style={{ pointerEvents: "none" }}
        >
          {activeDragItem ? (
            activeDragItemOld ? (
              <PlacementBarV2
                request={activeDragItem}
                period={period}
                dayW={dayW}
                hotelAccess={hotelInfo?.access || false}
                requestId={requestId}
                user={user}
                isDraggingGlobal={true}
                isOverlay={true}
              />
            ) : (
              <TrayCardV2
                request={activeDragItem}
                requestId={requestId}
                isOverlay={true}
              />
            )
          ) : null}
        </DragOverlay>
      </DndContext>

      <EditRequestModalV2
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveChanges}
        request={editableRequest}
      />

      <ConfirmBookingModalV2
        isOpen={isConfirmModalOpen}
        onClose={handleCancelBooking}
        onConfirm={confirmBooking}
        request={selectedRequest}
      />
      {canAccessMenu(accessMenu, "requestMenu", user) && (
        <ExistRequest
          show={showRequestSidebar}
          onClose={() => setShowRequestSidebar(false)}
          setChooseRequestID={setSelectedRequestID}
          setShowChooseHotel={setShowChooseHotel}
          chooseRequestID={selectedRequestID}
          user={user}
          dispatcherCanChat={dispatcherCanChat}
          dispatcherCanUpdate={dispatcherCanUpdate}
          accessMenu={accessMenu}
        />
      )}

      {showEditNomer && (
        <EditRequestNomerFond
          show={showEditNomer}
          onClose={() => setShowEditNomer(false)}
          type={hotelInfo?.type}
          nomer={selectedNomer}
          id={hotelId}
          roomId={selectedNomer?.roomId}
          roomsRefetch={roomsRefetch}
        />
      )}

      {notifications.map((n, index) => (
        <Notification
          key={n.id}
          text={n.text}
          status={n.status}
          index={index}
          onClose={() => {
            setNotifications((prev) => prev.filter((notif) => notif.id !== n.id));
          }}
        />
      ))}
    </>
  );
};

export default NewPlacementV2;
