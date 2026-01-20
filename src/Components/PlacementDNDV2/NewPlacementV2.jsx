import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Tooltip, Typography } from "@mui/material";
import {
  AutoScrollActivator,
  DndContext,
  DragOverlay,
} from "@dnd-kit/core";
import { VariableSizeList } from "react-window";
import { eachDayOfInterval, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import { useMutation } from "@apollo/client";
import TimelineV2 from "./components/TimelineV2";
import RoomRowV2 from "./components/RoomRowV2";
import DraggableRequestV2 from "./components/DraggableRequestV2";
import ConfirmBookingModalV2 from "./components/ConfirmBookingModalV2";
import EditRequestModalV2 from "./components/EditRequestModalV2";
import AddPassengersModalV2 from "./components/AddPassengersModalV2";
import Notification from "../Notification/Notification";
import AddNewPassengerPlacement from "../Blocks/AddNewPassengerPlacement/AddNewPassengerPlacement";
import ExistReserveMess from "../Blocks/ExistReserveMess/ExistReserveMess";
import MUILoader from "../Blocks/MUILoader/MUILoader";
import ExistRequest from "../Blocks/ExistRequest/ExistRequest";
import EditRequestNomerFond from "../Blocks/EditRequestNomerFond/EditRequestNomerFond";
import { useWindowSize } from "../../hooks/useWindowSize";
import { roles } from "../../roles";
import {
  convertToDate,
  generateTimestampId,
  getCookie,
  server,
  UPDATE_HOTEL_BRON,
  UPDATE_REQUEST_RELAY,
} from "../../../graphQL_requests";
import { usePlacementData } from "./hooks/usePlacementData";
import { buildFilteredRooms, filterRequestsBySearch } from "./utils/placementFilters";
import { hasOverlap, getOverlappingRequests } from "./utils/placementOverlap";
import { getAvailablePosition } from "./utils/placementPositions";

const DAY_WIDTH = 40;
const LEFT_WIDTH = 220;
const WEEKEND_COLOR = "#efefef";
const MONTH_COLOR = "#ddd";

const NewPlacementV2 = ({ idHotelInfo, searchQuery, user }) => {
  const { idHotel, requestId } = useParams();

  const hotelId = idHotelInfo ? idHotelInfo : idHotel;
  const token = getCookie("token");

  const [checkRoomsType, setCheckRoomsType] = useState(false);
  const [hasInitialLoadCompleted, setHasInitialLoadCompleted] = useState(false);

  const [showEditNomer, setShowEditNomer] = useState(false);
  const [selectedNomer, setSelectedNomer] = useState(null);

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPassengersModalOpen, setIsAddPassengersModalOpen] =
    useState(false);
  const [editableRequest, setEditableRequest] = useState(null);
  const [originalRequest, setOriginalRequest] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [activeDragItem, setActiveDragItem] = useState(null);
  const [activeDragItemOld, setActiveDragItemOld] = useState(null);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

  const [highlightedDatesOld, setHighlightedDatesOld] = useState([]);
  const [isClick, setIsClick] = useState(false);

  const [, setShowChooseHotel] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [selectedRequestID, setSelectedRequestID] = useState(null);

  const [showReserveInfo, setShowReserveInfo] = useState(false);
  const [openReserveId, setOpenReserveId] = useState("");
  const [showModalForAddHotelInReserve, setshowModalForAddHotelInReserve] =
    useState(false);
  const [showCreateSidebarReserveOne, setShowCreateSidebarReserveOne] =
    useState(false);
  const [showChooseHotels, setShowChooseHotels] = useState(0);
  const [showRequestSidebarMess, setShowChooseHotelMess] = useState(false);

  const {
    hotelInfo,
    loadingHotel,
    loadingRooms,
    loadingRequests,
    loadingReserves,
    loadingReserveOne,
    loadingHotelReserveOne,
    rooms,
    roomsRefetch,
    requests,
    setRequests,
    newRequests,
    setNewRequests,
    bronLoading,
    bronRefetch,
    refetchBrons,
    refetchReserves,
    refetchReserveOne,
    refetchHotelReserveOne,
    requestsReserves,
    requestsReserveOne,
    requestsHotelReserveOne,
    newReservePassangers,
  } = usePlacementData({
    hotelId,
    token,
    currentMonth,
    openReserveId,
    showModalForAddHotelInReserve,
  });

  const initialLoading =
    Boolean(hotelId) &&
    (loadingHotel ||
      loadingRooms ||
      bronLoading ||
      loadingRequests ||
      loadingReserves ||
      loadingReserveOne ||
      loadingHotelReserveOne);

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

  const handleCheckRoomsType = (info) => {
    setCheckRoomsType(info);
  };

  const handleUpdateRequest = (updatedRequest) => {
    setRequests((prevRequests) =>
      prevRequests.map((req) =>
        req.id === updatedRequest.id ? updatedRequest : req
      )
    );
  };

  const daysInMonthOld = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDragStartForRequest = (request) => {
    if (!request) return;
    const dragStart = startOfDay(new Date(request.checkInDate));
    const dragEnd = startOfDay(new Date(request.checkOutDate));

    const datesToHighlight = daysInMonthOld.filter(
      (date) =>
        date.getTime() >= dragStart.getTime() &&
        date.getTime() <= dragEnd.getTime()
    );

    setHighlightedDatesOld(datesToHighlight);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const draggedItem =
      newRequests.find((req) => req.id === parseInt(active.id, 10)) ||
      newReservePassangers.find((req) => req.id === parseInt(active.id, 10));
    const draggedItemOld = requests.find(
      (req) => req.id === parseInt(active.id, 10)
    );
    const activeItem = draggedItemOld || draggedItem;
    setActiveDragItem(activeItem);
    setActiveDragItemOld(draggedItemOld);
    setIsDraggingGlobal(true);

    handleDragStartForRequest(draggedItemOld);
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
    }
  };

  const handleDragEnd = async (event) => {
    setIsDraggingGlobal(false);
    setActiveDragItem(null);
    setHighlightedDatesOld([]);
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
    }

    const { active, over } = event;

    if (!over) {
      return;
    }

    const draggedRequest =
      newReservePassangers.find((req) => req.id === parseInt(active.id, 10)) ||
      newRequests.find((req) => req.id === parseInt(active.id, 10)) ||
      requests.find((req) => req.id === parseInt(active.id, 10));

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

      let bookingInput;

      if (draggedRequest.isRequest && draggedRequest.status !== "Архив") {
        bookingInput = {
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
      } else if (!draggedRequest.isRequest && draggedRequest.status !== "Архив") {
        bookingInput = {
          hotelChesses: [
            {
              status: "done",
              reserveId: draggedRequest.requestID,
              roomId: targetRoomId,
              place: targetPosition + 1,
              clientId: draggedRequest.personID,
              id: draggedRequest.chessID,
            },
          ],
        };
      }

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
    } else if (newReservePassangers.includes(draggedRequest)) {
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

          let bookingInput;

          if (draggedRequest.isRequest && draggedRequest.status !== "Архив") {
            bookingInput = {
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
          } else if (
            !draggedRequest.isRequest &&
            draggedRequest.status !== "Архив"
          ) {
            bookingInput = {
              hotelChesses: [
                {
                  clientId: draggedRequest.personID,
                  hotelId: hotelId,
                  reserveId: draggedRequest.requestID,
                  roomId: targetRoom.roomId,
                  place: Number(availablePosition) + 1,
                  id: draggedRequest.chessID,
                },
              ],
            };
          } else {
            addNotification(
              "Эту заявку нельзя перемещать, так как она в архиве",
              "error"
            );
            return;
          }

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
          }
        }
      } else {
        addNotification("Комната не активна!", "error");
        return;
      }
    }
  };

  const handleOpenModal = (request, originalRequest) => {
    setOriginalRequest(originalRequest);
    setEditableRequest(request);
    setIsModalOpen(true);
  };

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
    let bookingInput;

    if (request.reserveId) {
      bookingInput = {
        hotelChesses: [
          {
            clientId: request.personID,
            start: `${request.checkInDate}T${request.checkInTime}:00.000Z`,
            end: `${request.checkOutDate}T${request.checkOutTime}:00.000Z`,
            hotelId: hotelId,
            reserveId: request.reserveId ? request.reserveId : "",
            roomId: `${request.roomId}`,
            place: Number(request.position) + 1,
            public: true,
            status: "done",
          },
        ],
      };
    } else if (request.requestID) {
      bookingInput = {
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
    }

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
      refetchHotelReserveOne();
    } catch (err) {
      console.error("Произошла ошибка при подтверждении бронирования", err);
    }
  };

  const handleCancelBooking = async () => {
    if (selectedRequest) {
      const updatedRequest = {
        ...selectedRequest,
        id: generateTimestampId(),
        room: null,
        position: null,
      };

      setNewRequests((prevNewRequests) => [
        ...prevNewRequests,
        updatedRequest,
      ]);

      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== selectedRequest.id)
      );

      setNewRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== selectedRequest.id)
      );

      try {
        await bronRefetch?.();
        await refetchBrons?.();
      } catch (error) {
        console.log("Ошибка при обновлении данных:", error);
      }
    }

    setIsConfirmModalOpen(false);
    setSelectedRequest(null);
  };

  const toggleRequestSidebar = (requestID) => {
    setSelectedRequestID(requestID);
    setShowRequestSidebar(true);
  };

  const startOfCurrentMonth = startOfMonth(currentMonth);
  const endOfCurrentMonth = endOfMonth(currentMonth);

  const filteredRequests = useMemo(
    () =>
      filterRequestsBySearch({
        requests,
        searchQuery,
        startOfCurrentMonth,
        endOfCurrentMonth,
      }),
    [requests, searchQuery, startOfCurrentMonth, endOfCurrentMonth]
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

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5300);
  };

  const [hoveredDayInMonth, setHoveredDayInMonth] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);

  const handleOpenReserveInfo = async (reserveId) => {
    setOpenReserveId(reserveId);
    setShowReserveInfo(true);

    try {
      const { data } = await refetchHotelReserveOne({
        reservationHotelsId: reserveId,
      });

      const hasHotelWithId = data.reservationHotels.some(
        (hotel) => hotel.hotel.id === hotelInfo.id
      );

      if (hasHotelWithId) {
        setshowModalForAddHotelInReserve(true);
      } else {
        setshowModalForAddHotelInReserve(false);
        toggleCreateSidebarReserveOne();
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных резерва отелей:", error);
    }
  };

  const handleCloseReserveInfo = () => {
    setOpenReserveId("");
    setShowReserveInfo(false);
    setshowModalForAddHotelInReserve(false);
  };

  const toggleCreateSidebarReserveOne = () => {
    setShowCreateSidebarReserveOne(!showCreateSidebarReserveOne);
  };

  useEffect(() => {
    const totalPassengers = requestsHotelReserveOne.reduce(
      (acc, item) => acc + Number(item.capacity),
      0
    );
    setShowChooseHotels(totalPassengers);
  }, [requestsHotelReserveOne]);

  const handleOpenAddPassengersModal = () => {
    setIsAddPassengersModalOpen(true);
  };

  const handleCloseAddPassengersModal = () => {
    setIsAddPassengersModalOpen(false);
  };

  const targetReserveHotels = requestsHotelReserveOne.filter(
    (item) => item.hotel?.id === hotelId
  );
  const targetReserveHotelCapacity = targetReserveHotels[0]?.capacity;
  const targetReserveHotelCPassPersonCount =
    targetReserveHotels[0]?.passengers?.length +
    targetReserveHotels[0]?.person?.length;

  const filteredRequestsReserves = requestsReserves.filter((request) => {
    const infoHotel = request.hotel.find(
      (hotel) => hotel.hotel?.id === hotelId
    );
    const totalCapacity = request.hotel.reduce(
      (sum, hotel) => sum + hotel.capacity,
      0
    );

    return request.passengerCount > totalCapacity || !!infoHotel;
  });

  const listRef = useRef(null);
  const ListOuterElement = useMemo(() => {
    const Outer = React.forwardRef(({ style, onScroll, ...rest }, ref) => (
      <div
        ref={ref}
        {...rest}
        onScroll={(event) => {
          if (event.currentTarget.scrollLeft !== 0) {
            event.currentTarget.scrollLeft = 0;
          }
          if (onScroll) onScroll(event);
        }}
        style={{ ...style, overflowX: "hidden" }}
      />
    ));
    Outer.displayName = "ListOuterElement";
    return Outer;
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
    }
  }, [filteredRooms]);

  const toggleRequestSidebarMess = () =>
    setShowChooseHotelMess(!showRequestSidebarMess);

  const getRoomHeight = (index) => {
    const room = filteredRooms[index];
    return 50 * room.type;
  };

  const itemKey = (index) => {
    const room = filteredRooms[index];
    return room.roomId;
  };

  const containerRef = useRef(null);
  const [dayWidthLength, setDayWidthLength] = useState(DAY_WIDTH);
  const daysInMonth1 = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
    }
  }, [currentMonth]);

  useEffect(() => {
    const updateDayWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newDayWidth = containerWidth / daysInMonth1.length;
        setDayWidthLength(newDayWidth);
      }
    };

    updateDayWidth();

    const observer = new ResizeObserver(updateDayWidth);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [daysInMonth1]);

  const { height } = useWindowSize();

  const hasScrolledRef = useRef(false);
  const roomIndex = useMemo(() => {
    if (!requestId) return -1;
    return filteredRooms.findIndex((room) =>
      room.requests?.some((req) => req.requestID === requestId)
    );
  }, [filteredRooms, requestId]);

  useEffect(() => {
    if (roomIndex >= 0 && listRef.current) {
      listRef.current.scrollToItem(roomIndex, "center");
      hasScrolledRef.current = true;
    }
  }, [roomIndex, requestId]);

  return (
    <>
      <DndContext
        onDragStart={(e) => handleDragStart(e)}
        onDragEnd={handleDragEnd}
        autoScroll={{
          enabled: true,
          threshold: { x: 1, y: 0.08 },
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
            const canScrollX = element.scrollWidth > element.clientWidth;
            return canScrollY && !canScrollX;
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: "30px" }}>
          <Box
            sx={{
              overflow: "hidden",
              flex: 1,
              minWidth: 0,
              maxWidth: "100%",
              overflowX: "hidden",
            }}
          >
            <Box
              sx={{
                position: "relative",
                height: user?.role == roles.hotelAdmin ? "76vh" : "67vh",
                maxHeight: user?.role == roles.hotelAdmin ? "76vh" : "67vh",
                overflow: "hidden",
                overflowX: "hidden",
                width: "100%",
              }}
            >
              <TimelineV2
                user={user}
                hoveredDayInMonth={hoveredDayInMonth}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                dayWidth={dayWidthLength}
                weekendColor={WEEKEND_COLOR}
                monthColor={MONTH_COLOR}
                leftWidth={LEFT_WIDTH}
                handleCheckRoomsType={handleCheckRoomsType}
                setShowReserveInfo={setShowReserveInfo}
                setshowModalForAddHotelInReserve={
                  setshowModalForAddHotelInReserve
                }
              />
              <VariableSizeList
                ref={listRef}
                outerElementType={ListOuterElement}
                itemCount={filteredRooms.length}
                itemSize={getRoomHeight}
                itemKey={itemKey}
                width="100%"
                height={
                  user?.role === roles.hotelAdmin && height > 880
                    ? 610
                    : user?.role === roles.hotelAdmin && height < 830
                    ? 420
                    : user?.role === roles.hotelAdmin && height < 880
                    ? 530
                    : user?.role !== roles.hotelAdmin && height < 830
                    ? 390
                    : user?.role !== roles.hotelAdmin && height < 900
                    ? 460
                    : 530
                }
                overscanCount={5}
                style={{ overflowY: "scroll", overflowX: "hidden" }}
              >
                {({ index, style }) => {
                  const room = filteredRooms[index];
                  return (
                    <div
                      style={{
                        ...style,
                        pointerEvents: "auto",
                        borderBottom: "1px solid #ddd",
                      }}
                      key={room.roomId}
                    >
                      <Box sx={{ display: "flex" }}>
                        <Box
                          sx={{
                            minWidth: `${LEFT_WIDTH}px`,
                            width: `${LEFT_WIDTH}px`,
                            maxWidth: `${LEFT_WIDTH}px`,
                            borderLeft: "1px solid #ddd",
                            borderRight: "1px solid #ddd",
                            borderBottom: "1px solid #ddd",
                            display: "flex",
                            alignItems: "center",
                            overflow: "hidden",
                            zIndex: 15,
                            backgroundColor:
                              hoveredRoom === room.roomId
                                ? "#cce5ff"
                                : !room.active
                                ? "#a9a9a9"
                                : "#fff",
                          }}
                        >
                          <Tooltip
                            title={`${room.roomType !== "apartment" ? "№" : ""} ${room.id} ${
                              room.roomType !== "apartment"
                                ? room?.roomKind?.name
                                : ""
                            } ${
                              room.descriptionSecond ? room.descriptionSecond : ""
                            } ${!room.active ? "(не работает)" : ""}`}
                            arrow
                            placement="top"
                            enterDelay={1000}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                width: "100%",
                                textAlign: "left",
                                fontSize: "14px",
                                padding: "0 12px",
                                overflow: "hidden",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                color: "#545873",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 2,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  cursor: "pointer",
                                }}
                                onClick={() => {
                                  setSelectedNomer(room);
                                  setShowEditNomer(true);
                                }}
                              >
                                <p
                                  style={
                                    room.type === 1
                                      ? {
                                          fontSize: "12px",
                                          display: "-webkit-box",
                                          WebkitLineClamp: 1,
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                        }
                                      : { fontSize: "12px" }
                                  }
                                >
                                  {room.roomType !== "apartment" ? "№" : ""}{" "}
                                  {room.id}{" "}
                                  {room.roomType !== "apartment"
                                    ? room?.roomKind?.name
                                    : ""}
                                </p>
                                <p
                                  style={
                                    room.type === 1
                                      ? {
                                          fontSize: "10px",
                                          display: "-webkit-box",
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                        }
                                      : { fontSize: "10px" }
                                  }
                                >
                                  {room.descriptionSecond}
                                </p>
                              </div>
                              {!room.active ? "(не работает)" : ""}
                              <Box
                                component="span"
                                sx={{
                                  minWidth: "37px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                  gap: "5px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "2px",
                                    fontSize: "12px",
                                  }}
                                >
                                  <img
                                    src="/roomPlacePersonWhite.png"
                                    style={{ verticalAlign: "top", width: "12px" }}
                                    alt=""
                                  />
                                  {`x ${room.type}`}
                                </div>
                                {room.beds ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "2px",
                                      fontSize: "12px",
                                    }}
                                  >
                                    <img
                                      src="/roomsIcon.png"
                                      style={{ verticalAlign: "top", height: "12px" }}
                                      alt=""
                                    />
                                    {`x ${room.beds}`}
                                  </div>
                                ) : null}
                              </Box>
                            </Typography>
                          </Tooltip>
                        </Box>
                        <Box sx={{ width: `calc(100% - ${LEFT_WIDTH}px)` }}>
                          <RoomRowV2
                            requestId={requestId}
                            hotelAccess={hotelInfo?.access}
                            setHoveredRoom={setHoveredRoom}
                            setHoveredDayInMonth={setHoveredDayInMonth}
                            borderBottomDraw={index + 1 === filteredRooms.length}
                            user={user}
                            key={room.roomId}
                            containerRef={containerRef}
                            dayWidth={dayWidthLength}
                            weekendColor={WEEKEND_COLOR}
                            monthColor={MONTH_COLOR}
                            room={room}
                            requests={filteredRequests.filter(
                              (req) => req.room?.id === room.roomId
                            )}
                            allRequests={filteredRequests}
                            currentMonth={currentMonth}
                            onUpdateRequest={handleUpdateRequest}
                            isDraggingGlobal={isDraggingGlobal}
                            onOpenModal={handleOpenModal}
                            toggleRequestSidebar={toggleRequestSidebar}
                            activeDragItem={activeDragItem}
                            highlightedDatesOld={highlightedDatesOld}
                            isClick={isClick}
                            setIsClick={setIsClick}
                            checkRoomsType={checkRoomsType}
                          />
                        </Box>
                      </Box>
                    </div>
                  );
                }}
              </VariableSizeList>
            </Box>
          </Box>

          {!checkRoomsType && (
            <Box
              sx={{
                minWidth: "330px",
                maxWidth: "330px",
                height: "fit-content",
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: "10px",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  padding: "15px",
                  borderBottom: "1px solid #ddd",
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: "700",
                  minHeight: "50px",
                  height: "fit-content",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Заявки по эскадрильи в городе {hotelInfo?.information?.city}
              </Typography>
              {newRequests?.length > 0 &&
              ((user?.hotelId && hotelInfo?.access) || !user?.hotelId) ? (
                <Box
                  sx={{
                    display: "flex",
                    gap: "5px",
                    flexDirection: "column",
                    height: "fit-content",
                    maxHeight: "485px",
                    padding: "5px",
                    overflow: "hidden",
                    overflowY: "scroll",
                    scrollbarWidth: "none"
                  }}
                >
                  {newRequests
                    .slice()
                    .sort((a, b) => {
                      if (a.requestID === requestId) return -1;
                      if (b.requestID === requestId) return 1;
                      return 0;
                    })
                    .filter((request) => {
                      const shouldFilter =
                        user?.hotelId && hotelInfo?.access;

                      return shouldFilter ? request.hotelId === hotelId : true;
                    })
                    .map((request) => (
                      <DraggableRequestV2
                        hotelAccess={hotelInfo?.access || true}
                        requestId={requestId}
                        userRole={user?.role}
                        key={request.id}
                        request={request}
                        dayWidth={DAY_WIDTH}
                        currentMonth={currentMonth}
                        onUpdateRequest={handleUpdateRequest}
                        allRequests={requests}
                        isDraggingGlobal={isDraggingGlobal}
                        isClick={isClick}
                        setIsClick={setIsClick}
                        checkRoomsType={checkRoomsType}
                      />
                    ))}
                </Box>
              ) : (
                <Typography
                  variant="h6"
                  sx={{
                    padding: "10px ",
                    textAlign: "center",
                    fontSize: "14px",
                    height: "calc(100% - 50px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Заявок не найдено
                </Typography>
              )}
            </Box>
          )}

          {checkRoomsType && !showReserveInfo && !showModalForAddHotelInReserve && (
            <Box
              sx={{
                minWidth: "330px",
                maxWidth: "330px",
                height: "fit-content",
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: "10px",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  padding: "10px",
                  borderBottom: "1px solid #ddd",
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: "700",
                  minHeight: "50px",
                  height: "fit-content",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Заявки по пассажирам в городе {hotelInfo?.information?.city}
              </Typography>

              {filteredRequestsReserves?.length > 0 &&
              ((user?.hotelId && hotelInfo?.access) || !user?.hotelId) ? (
                <Box
                  sx={{
                    display: "flex",
                    gap: "5px",
                    flexDirection: "column",
                    height: "fit-content",
                    maxHeight: "518px",
                    padding: "5px",
                    overflow: "hidden",
                    overflowY: "scroll",
                  }}
                >
                  {filteredRequestsReserves.map((request) => (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "5px",
                        width: "100%",
                        padding: "5px",
                        cursor: "pointer",
                        textAlign: "center",
                        fontSize: "12px",
                        backgroundColor: "#adadad",
                        border: "1px solid #757575",
                        color: "#fff",
                        borderRadius: "3px",
                      }}
                      onClick={() => handleOpenReserveInfo(request.id)}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={`${server}${request.airline.images[0]}`}
                          alt=""
                          style={{
                            height: "25px",
                            width: "25px",
                            objectFit: "cover",
                            borderRadius: "50%",
                            marginRight: "5px",
                          }}
                        />
                        {request.airline.name} -{" "}
                        {request?.reserveForPerson ? "экипаж" : "пассажиры"}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {convertToDate(request.arrival)} -{" "}
                        {convertToDate(request.departure)}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography
                  variant="h6"
                  sx={{
                    padding: "10px ",
                    textAlign: "center",
                    fontSize: "14px",
                    height: "calc(100% - 50px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Заявок не найдено
                </Typography>
              )}
            </Box>
          )}

          {checkRoomsType &&
            showReserveInfo &&
            showModalForAddHotelInReserve && (
              <Box
                sx={{
                  width: "300px",
                  height: "fit-content",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    padding: "5px",
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid #ddd",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: "700",
                    minHeight: "50px",
                    height: "fit-content",
                    justifyContent: "center",
                    lineHeight: "normal",
                  }}
                >
                  <img
                    src="/arrow-left-back.png"
                    alt=""
                    style={{
                      height: "16px",
                      cursor: "pointer",
                      marginRight: "10px",
                    }}
                    onClick={handleCloseReserveInfo}
                  />
                  Заявка {requestsReserveOne?.reserveNumber?.split("-")[0]} -{" "}
                  {requestsReserveOne?.reserveForPerson ? "экипаж" : "пассажиры"}
                  {targetReserveHotelCPassPersonCount <
                    targetReserveHotelCapacity && (
                    <img
                      src="/addReserve.png"
                      alt=""
                      style={{
                        height: "16px",
                        cursor: "pointer",
                        marginLeft: "10px",
                      }}
                      onClick={handleOpenAddPassengersModal}
                    />
                  )}
                  <img
                    src="/chat.png"
                    alt=""
                    style={{
                      height: "18px",
                      cursor: "pointer",
                      marginLeft: "10px",
                    }}
                    onClick={toggleRequestSidebarMess}
                  />
                </Typography>

                {newReservePassangers?.length > 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      gap: "5px",
                      flexDirection: "column",
                      height: "fit-content",
                      maxHeight: "485px",
                      padding: "5px",
                      overflow: "hidden",
                      overflowY: "scroll",
                    }}
                  >
                    {newReservePassangers.map((request) => (
                      <DraggableRequestV2
                        hotelAccess={hotelInfo?.access || false}
                        requestId={requestId}
                        userRole={user.role}
                        key={request.id}
                        request={request}
                        dayWidth={DAY_WIDTH}
                        currentMonth={currentMonth}
                        onUpdateRequest={handleUpdateRequest}
                        allRequests={requests}
                        isDraggingGlobal={isDraggingGlobal}
                        isClick={isClick}
                        setIsClick={setIsClick}
                        checkRoomsType={checkRoomsType}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="h6"
                    sx={{
                      padding: "10px ",
                      textAlign: "center",
                      fontSize: "14px",
                      height: "calc(100% - 50px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Заявок не найдено
                  </Typography>
                )}
              </Box>
            )}
        </Box>

        <DragOverlay
          adjustScale={false}
          dropAnimation={null}
          style={{ pointerEvents: "none" }}
        >
          {activeDragItem ? (
            <DraggableRequestV2
              hotelAccess={hotelInfo?.access || false}
              requestId={requestId}
              userRole={user?.role}
              request={activeDragItem}
              dayWidth={dayWidthLength}
              currentMonth={currentMonth}
              isDraggingGlobal={true}
              toggleRequestSidebar={toggleRequestSidebar}
              isClick={isClick}
              setIsClick={setIsClick}
              checkRoomsType={checkRoomsType}
              isOverlay={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <EditRequestModalV2
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveChanges}
        request={editableRequest}
      />

      <AddPassengersModalV2
        isOpen={isAddPassengersModalOpen}
        onClose={handleCloseAddPassengersModal}
        isPerson={requestsReserveOne?.reserveForPerson}
        airlineId={requestsReserveOne?.airline?.id}
        reserveId={requestsReserveOne?.id}
        hotelId={hotelInfo?.id}
        token={token}
        openReserveId={openReserveId}
      />

      <ConfirmBookingModalV2
        isOpen={isConfirmModalOpen}
        onClose={handleCancelBooking}
        onConfirm={confirmBooking}
        request={selectedRequest}
      />

      <ExistRequest
        show={showRequestSidebar}
        onClose={() => setShowRequestSidebar(false)}
        setChooseRequestID={setSelectedRequestID}
        setShowChooseHotel={setShowChooseHotel}
        chooseRequestID={selectedRequestID}
        user={user}
      />

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

      <AddNewPassengerPlacement
        show={showCreateSidebarReserveOne}
        onClose={toggleCreateSidebarReserveOne}
        request={requestsReserveOne}
        placement={requestsHotelReserveOne ? requestsHotelReserveOne : []}
        user={user}
        hotelInfo={hotelInfo}
        showChooseHotels={showChooseHotels}
        setShowChooseHotels={setShowChooseHotels}
        setshowModalForAddHotelInReserve={setshowModalForAddHotelInReserve}
        setShowReserveInfo={setShowReserveInfo}
      />

      <ExistReserveMess
        hotelId={hotelInfo?.id}
        show={showRequestSidebarMess}
        onClose={toggleRequestSidebarMess}
        chooseRequestID={openReserveId}
        user={user}
      />

      {!hasInitialLoadCompleted && initialLoading && (
        <Box
          sx={{
            position: "absolute",
            top: "auto",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#F1F4FB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <MUILoader
            fullHeight={
              user?.role === roles.hotelAdmin && height > 800
                ? "82vh"
                : user?.role === roles.hotelAdmin && height < 800
                ? "75vh"
                : user?.role !== roles.hotelAdmin && height > 870
                ? "83vh"
                : "68vh"
            }
          />
        </Box>
      )}
    </>
  );
};

export default NewPlacementV2;
