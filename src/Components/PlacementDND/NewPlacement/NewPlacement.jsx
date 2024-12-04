import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import RoomRow from "../RoomRow/RoomRow";
import Timeline from "../Timeline/Timeline";
import CurrentTimeIndicator from "../CurrentTimeIndicator/CurrentTimeIndicator";
import { startOfMonth, addMonths, differenceInDays, endOfMonth, isWithinInterval, startOfDay, eachDayOfInterval } from "date-fns";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import EditRequestModal from "../EditRequestModal/EditRequestModal";
import DraggableRequest from "../DraggableRequest/DraggableRequest";
import ConfirmBookingModal from "../ConfirmBookingModal/ConfirmBookingModal";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import ExistRequestInHotel from "../../Blocks/ExistRequestInHotel/ExistRequestInHotel";
import { decodeJWT, generateTimestampId, GET_BRONS_HOTEL, GET_HOTEL, GET_HOTEL_ROOMS, GET_REQUESTS, getCookie, REQUEST_CREATED_SUBSCRIPTION, REQUEST_UPDATED_SUBSCRIPTION, UPDATE_HOTEL_BRON, UPDATE_REQUEST_RELAY } from "../../../../graphQL_requests";
import { } from "date-fns";
import Notification from "../../Notification/Notification";

const DAY_WIDTH = 30;
const LEFT_WIDTH = 220;
const WEEKEND_COLOR = "#efefef";
const MONTH_COLOR = "#ddd";

const NewPlacement = ({ idHotelInfo, searchQuery }) => {
    let { idHotel } = useParams();

    let hotelId = idHotelInfo ? idHotelInfo : idHotel

    const token = getCookie('token');
    const user = decodeJWT(token);

    // Получение информации об отеле
    const [hotelInfo, setHotelInfo] = useState('');

    const { loading: loadingHotel, error: errorHotel, data: dataHotel } = useQuery(GET_HOTEL, {
        variables: { hotelId: hotelId },
        fetchPolicy: 'network-only',
    });

    useEffect(() => {
        if (dataHotel && dataHotel.hotel) {
            setHotelInfo(dataHotel.hotel);
        }
    }, [dataHotel]);

    // Получение комнат отеля
    const { loading, error, data, refetch: roomsRefetch } = useQuery(GET_HOTEL_ROOMS, {
        variables: { hotelId: hotelId },
        fetchPolicy: 'network-only',
    });

    const [checkRoomsType, setCheckRoomsType] = useState(false);

    const handleCheckRoomsType = (info) => {
        setCheckRoomsType(info);
        roomsRefetch();
    }

    const rooms = useMemo(() => {
        if (!data || !data.hotel || !data.hotel.rooms) return [];

        return data.hotel.rooms
            .filter((room) => room.reserve === checkRoomsType)
            .map((room) => ({
                id: room.name.replace('№ ', ''),
                active: room.active,
                type: room.category === "onePlace" ? "single" : room.category === "twoPlace" ? "double" : '',
            }));
    }, [data, checkRoomsType]);

    // Получение броней отеля

    // При бронировании в шахматку не приходит hotelChess

    const [requests, setRequests] = useState([]);

    const { loading: bronLoading, error: bronError, data: bronData, refetch: bronRefetch } = useQuery(GET_BRONS_HOTEL, {
        variables: { hotelId: hotelId },
        fetchPolicy: 'network-only',
    });

    // Подписки для отслеживания создания и обновления заявок
    const { data: subscriptionData } = useSubscription(REQUEST_CREATED_SUBSCRIPTION, {
        onSubscriptionData: () => {
            bronRefetch(); // Обновляем данные после новых событий
        },
    });

    const { data: subscriptionUpdateData } = useSubscription(REQUEST_UPDATED_SUBSCRIPTION, {
        onSubscriptionData: () => {
            bronRefetch(); // Обновляем данные после новых событий
        },
    });

    const translateStatus = (status) => {
        switch (status) {
            case "done":
                return "Забронирован";
            case "extended":
                return "Продлен";
            case "reduced":
                return "Сокращен";
            case "transferred":
                return "Перенесен";
            case "earlyStart":
                return "Ранний заезд";
            default:
                return "Неизвестно";
        }
    };

    useEffect(() => {
        if (subscriptionUpdateData?.requestUpdated) {
            const updatedRequest = {
                id: subscriptionUpdateData.requestUpdated.id, // Используем ID из подписки
                checkInDate: new Date(subscriptionUpdateData.requestUpdated.arrival.date).toISOString().split("T")[0],
                checkInTime: new Date(subscriptionUpdateData.requestUpdated.arrival.date).toISOString().split("T")[1].slice(0, 5),
                checkOutDate: new Date(subscriptionUpdateData.requestUpdated.departure.date).toISOString().split("T")[0],
                checkOutTime: new Date(subscriptionUpdateData.requestUpdated.departure.date).toISOString().split("T")[1].slice(0, 5),
                status: translateStatus(subscriptionUpdateData.requestUpdated.status),
                guest: subscriptionUpdateData.requestUpdated.person?.name || "Неизвестный гость",
                requestID: subscriptionUpdateData.requestUpdated.id,
                airline: subscriptionUpdateData.requestUpdated.airline,
                personID: subscriptionUpdateData.requestUpdated.person?.id,
                room: subscriptionUpdateData.requestUpdated.room?.replace("№ ", "") || null,
            };

            setRequests((prevRequests) =>
                prevRequests.map((req) =>
                    req.id === updatedRequest.id ? updatedRequest : req
                )
            );
        }
    }, [subscriptionUpdateData]);

    useEffect(() => {
        if (bronData && bronData.hotel && bronData.hotel.hotelChesses) {
            const transformedData = bronData.hotel.hotelChesses.map((chess, index) => ({
                id: generateTimestampId(),
                room: chess.room.replace("№ ", ""),
                position: chess.place - 1,
                checkInDate: new Date(chess.start).toISOString().split("T")[0],
                checkInTime: new Date(chess.start).toISOString().split("T")[1].slice(0, 5),
                checkOutDate: new Date(chess.end).toISOString().split("T")[0],
                checkOutTime: new Date(chess.end).toISOString().split("T")[1].slice(0, 5),
                status: translateStatus(chess.request.status),
                guest: chess.client ? chess.client.name : "Неизвестный гость",
                requestID: chess.request.id,
                airline: chess.request.airline,
                personID: chess.client.id,
                chessID: chess.id,
            }));

            setRequests(transformedData);
        }
    }, [bronData]);

    // Получение новых заявок для размещения
    const [newRequests, setNewRequests] = useState([])

    const { loading: loadingBrons, error: errorBrons, data: dataBrons, refetch: refetchBrons } = useQuery(GET_REQUESTS, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        variables: { pagination: { skip: 0, take: 99999999, status: "all" } },
        fetchPolicy: 'network-only',
    });

    useEffect(() => {
        if (subscriptionData?.requestCreated) {
            const newRequest = {
                id: generateTimestampId(), // Генерация уникального ID для фронтенда
                checkInDate: new Date(subscriptionData.requestCreated.arrival.date).toISOString().split("T")[0],
                checkInTime: new Date(subscriptionData.requestCreated.arrival.date).toISOString().split("T")[1].slice(0, 5),
                checkOutDate: new Date(subscriptionData.requestCreated.departure.date).toISOString().split("T")[0],
                checkOutTime: new Date(subscriptionData.requestCreated.departure.date).toISOString().split("T")[1].slice(0, 5),
                status: "Ожидает",
                guest: subscriptionData.requestCreated.person?.name || "Неизвестный гость",
                requestID: subscriptionData.requestCreated.id,
                airline: subscriptionData.requestCreated.airline,
                personID: subscriptionData.requestCreated.person?.id,
            };

            setNewRequests((prev) => [...prev, newRequest]);
        }
    }, [subscriptionData]);

    useEffect(() => {
        if (
            dataBrons &&
            dataBrons.requests &&
            dataBrons.requests.requests &&
            hotelInfo.city // Проверяем, что `hotelInfo.city` установлен
        ) {
            const filteredRequests = dataBrons.requests.requests.filter(
                (request) =>
                    request.status === "created" &&
                    request.airport.city === hotelInfo.city
            );

            const transformedRequests = filteredRequests.map((request) => ({
                id: generateTimestampId(), // Используем уникальный ID
                checkInDate: new Date(request.arrival.date).toISOString().split("T")[0],
                checkInTime: new Date(request.arrival.date).toISOString().split("T")[1].slice(0, 5),
                checkOutDate: new Date(request.departure.date).toISOString().split("T")[0],
                checkOutTime: new Date(request.departure.date).toISOString().split("T")[1].slice(0, 5),
                status: "Ожидает",
                guest: request.person ? request.person.name : "Неизвестный гость",
                requestID: request.id,
                airline: request.airline,
                personID: request.person.id,
            }));

            setNewRequests(transformedRequests);
        }
    }, [dataBrons, hotelInfo.city, refetchBrons]);

    // ----------------------------------------------------------------

    const scrollContainerRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editableRequest, setEditableRequest] = useState(null);
    const [originalRequest, setOriginalRequest] = useState(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [activeDragItem, setActiveDragItem] = useState(null);
    const [activeDragItemOld, setActiveDragItemOld] = useState(null);

    // Глобальное состояние перетаскивания
    const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

    const [updateHotelBron] = useMutation(UPDATE_HOTEL_BRON, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
        onCompleted: () => {
            refetchBrons(); // Обновляем данные вручную
            bronRefetch();
        },
    });

    const [updateRequest] = useMutation(UPDATE_REQUEST_RELAY, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
        onCompleted: () => {
            refetchBrons(); // Обновляем данные вручную
            bronRefetch();
        },
    });

    const handleUpdateRequest = (updatedRequest) => {
        setRequests((prevRequests) =>
            prevRequests.map((req) =>
                req.id === updatedRequest.id ? updatedRequest : req
            )
        );
    };

    const [highlightedDatesOld, setHighlightedDatesOld] = useState([]);
    const [isClick, setIsClick] = useState(false);

    const handleDragStart = (event) => {
        const { active } = event;
        const draggedItem = newRequests.find((req) => req.id === parseInt(active.id));
        const draggedItemOld = requests.find((req) => req.id === parseInt(active.id));
        setActiveDragItem(draggedItem);
        setActiveDragItemOld(draggedItemOld);
        setIsDraggingGlobal(true)

        handleDragStartForRequest(draggedItemOld)
    };

    const daysInMonthOld = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const handleDragStartForRequest = (request) => {
        if (!request) {
            return;
        }
        const dragStart = startOfDay(new Date(request.checkInDate));
        const dragEnd = startOfDay(new Date(request.checkOutDate));

        const datesToHighlight = daysInMonthOld.filter(
            (date) => date.getTime() >= dragStart.getTime() && date.getTime() <= dragEnd.getTime()
        );

        setHighlightedDatesOld(datesToHighlight);
    };

    const handleDragEnd = async (event) => {
        setIsDraggingGlobal(false);
        setActiveDragItem(null);
        setHighlightedDatesOld([]);

        const { active, over } = event;

        if (!over) {
            // addNotification("Дроп произошел вне шахматки", "error");
            return; // Если дроп происходит вне шахматки, ничего не делаем
        }

        const draggedRequest =
            newRequests.find((req) => req.id === parseInt(active.id)) ||
            requests.find((req) => req.id === parseInt(active.id));

        if (!draggedRequest) {
            addNotification("Не удалось определить заявку для перемещения", "error");
            return;
        }

        const targetRoomId = over?.id;

        if (!targetRoomId) {
            addNotification("Целевая комната не определена!", "error");
            return;
        }

        const targetRoom = rooms.find((room) => room.id === targetRoomId);
        const isDouble = targetRoom?.type === "double";

        const overlappingRequests = requests.filter(
            (req) =>
                req.room === targetRoomId &&
                !(
                    new Date(req.checkOutDate) <= new Date(draggedRequest.checkInDate) ||
                    new Date(req.checkInDate) >= new Date(draggedRequest.checkOutDate)
                )
        );

        const occupiedPositions = overlappingRequests.map((req) => req.position);

        if (newRequests.includes(draggedRequest)) {
            // Если это новая заявка
            if (targetRoom.active) {
                if (isDouble) {
                    // Проверяем доступные позиции для двухместной комнаты
                    const availablePosition = [0, 1].find((pos) => !occupiedPositions.includes(pos));

                    if (availablePosition === undefined) {
                        addNotification("Все позиции заняты в этой комнате!", "error");
                        return;
                    }

                    const newRequest = {
                        ...draggedRequest,
                        room: targetRoomId,
                        position: availablePosition,
                        status: "Ожидает",
                    };

                    setRequests((prevRequests) => {
                        const exists = prevRequests.some((req) => req.id === newRequest.id);
                        if (exists) {
                            addNotification(`Заявка с id ${newRequest.id} уже существует!`, "error");
                            return prevRequests;
                        }
                        return [...prevRequests, newRequest];
                    });

                    // Открываем модальное окно для подтверждения
                    setSelectedRequest(newRequest);
                    setIsConfirmModalOpen(true);
                } else {
                    // Для одноместной комнаты
                    if (occupiedPositions.length > 0) {
                        addNotification("Место занято в комнате!", "error");
                        return;
                    }

                    const newRequest = {
                        ...draggedRequest,
                        room: targetRoomId,
                        position: 0,
                        status: "Ожидает",
                    };

                    setRequests((prevRequests) => {
                        const exists = prevRequests.some((req) => req.id === newRequest.id);
                        if (exists) {
                            addNotification(`Заявка с id ${newRequest.id} уже существует!`, "error");
                            return prevRequests;
                        }
                        return [...prevRequests, newRequest];
                    });

                    // Открываем модальное окно для подтверждения
                    setSelectedRequest(newRequest);
                    setIsConfirmModalOpen(true);
                }
            } else {
                addNotification("Комната не активна!", "error");
                return;
            }
        } else {
            // Перемещение существующих заявок
            if (targetRoom.active) {
                if (draggedRequest.room === targetRoomId) {
                    // Перемещение внутри одной комнаты
                    const targetPosition = parseInt(over.data.current?.position || 0);

                    if (draggedRequest.position !== targetPosition) {
                        setRequests((prevRequests) =>
                            prevRequests.map((request) => {
                                if (request.room === targetRoomId) {
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
                    // Перемещение между комнатами
                    if (isDouble) {
                        const availablePosition = [0, 1].find((pos) => {
                            const isPositionOccupied = overlappingRequests.some(
                                (req) => req.position === pos
                            );
                            return !isPositionOccupied; // Только свободные позиции
                        });

                        if (availablePosition === undefined) {
                            addNotification("Место занято в комнате!", "error");
                            return;
                        }

                        const bookingInput = {
                            hotelChesses: [
                                {
                                    clientId: draggedRequest.personID, // ID клиента
                                    hotelId: hotelId, // ID отеля
                                    requestId: draggedRequest.requestID, // ID заявки
                                    room: `№ ${targetRoomId}`, // Номер комнаты
                                    place: Number(availablePosition) + 1, // Позиция в комнате (если двухместная)
                                    id: draggedRequest.chessID, // Позиция в комнате (если двухместная)
                                },
                            ],
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
                            addNotification("Произошла ошибка при подтверждении бронирования", "error");
                            // console.log("Произошла ошибка при подтверждении бронирования", err);
                        }

                    } else {
                        if (occupiedPositions.length > 0) {
                            addNotification("Место занято в комнате!", "error");
                            return;
                        }

                        const bookingInput = {
                            hotelChesses: [
                                {
                                    clientId: draggedRequest.personID, // ID клиента
                                    hotelId: hotelId, // ID отеля
                                    requestId: draggedRequest.requestID, // ID заявки
                                    room: `№ ${targetRoomId}`, // Номер комнаты
                                    place: 1, // Позиция в комнате (если двухместная)
                                    id: draggedRequest.chessID, // Позиция в комнате (если двухместная)
                                },
                            ],
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
                            addNotification("Произошла ошибка при подтверждении бронирования", "error");
                            // console.log("Произошла ошибка при подтверждении бронирования", err);
                        }
                    }
                }
            } else {
                addNotification("Комната не активна!", "error");
                return;
            }
        }
    };

    const handleOpenModal = (request, originalRequest) => {
        setOriginalRequest(originalRequest)
        setEditableRequest(request);
        setIsModalOpen(true);
    };

    const handleSaveChanges = async (updatedRequest) => {
        setRequests((prevRequests) =>
            prevRequests.map((req) =>
                req.id === updatedRequest.id ? updatedRequest : req
            )
        );
        setOriginalRequest(null);
        setIsModalOpen(false);

        // console.log(updatedRequest)

        try {
            await updateRequest({
                variables: {
                    updateRequestId: updatedRequest.requestID,
                    input: {
                        arrival: {
                            date: `${updatedRequest.checkInDate}T${updatedRequest.checkInTime}:00.000Z`,
                        },
                        departure: {
                            date: `${updatedRequest.checkOutDate}T${updatedRequest.checkOutTime}:00.000Z`,
                        },
                        status: updatedRequest.status == 'Сокращен'
                            ?
                            'reduced'
                            :
                            updatedRequest.status == 'Продлен'
                                ?
                                'extended'
                                :
                                updatedRequest.status == 'Ранний заезд'
                                    ?
                                    'earlyStart'
                                    :
                                    ''
                    },
                },
            });
            updatedRequest.status == 'Сокращен' ? addNotification("Заявка сокращена успешно", "success") :
                updatedRequest.status == 'Продлен' ? addNotification("Заявка продлена успешно", "success") :
                    updatedRequest.status == 'Ранний заезд' ? addNotification("Заезд успешно изменен", "success") :
                        addNotification("Заявка успешно изменена", "success")
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

    const daysInMonth = differenceInDays(endOfMonth(currentMonth), currentMonth) + 1;
    const containerWidth = daysInMonth * DAY_WIDTH;

    const confirmBooking = async (request) => {
        const bookingInput = {
            hotelChesses: [
                {
                    clientId: request.personID, // ID клиента
                    start: `${request.checkInDate}T${request.checkInTime}:00.000Z`, // Форматируем дату заезда
                    end: `${request.checkOutDate}T${request.checkOutTime}:00.000Z`, // Форматируем дату выезда
                    hotelId: hotelId, // ID отеля
                    requestId: request.requestID, // ID заявки
                    room: `№ ${request.room}`, // Номер комнаты
                    place: Number(request.position) + 1, // Позиция в комнате (если двухместная)
                    public: true, // Флаг публичности (если применимо)
                },
            ],
        }

        try {
            await updateHotelBron({
                variables: {
                    updateHotelId: hotelId,
                    input: bookingInput,
                },
            });
            addNotification("Бронь успешно добавлена", "success");
        } catch (err) {
            console.log("Произошла ошибка при подтверждении бронирования", err);
        }

        setSelectedRequest(null);
        setIsConfirmModalOpen(false);
    };

    const handleCancelBooking = async () => {
        if (selectedRequest) {
            // Создаем новую копию заявки с очищенными полями
            const updatedRequest = {
                ...selectedRequest,
                id: generateTimestampId(), // Генерируем новый уникальный id
                room: null, // Убираем комнату
                position: null, // Убираем позицию
            };

            // Добавляем заявку обратно в список новых заявок
            setNewRequests((prevNewRequests) => [
                ...prevNewRequests,
                updatedRequest,
            ]);

            // Удаляем заявку из шахматки
            setRequests((prevRequests) =>
                prevRequests.filter((req) => req.id !== selectedRequest.id)
            );

            setNewRequests((prevRequests) =>
                prevRequests.filter((req) => req.id !== selectedRequest.id)
            );

            try {
                // Рефетч данных
                await bronRefetch?.();
                await refetchBrons?.();
            } catch (error) {
                console.log("Ошибка при обновлении данных:", error);
            }
        }

        // Закрываем модальное окно
        setIsConfirmModalOpen(false);
        setSelectedRequest(null);
    };

    const [showChooseHotel, setShowChooseHotel] = useState(false);

    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [selectedRequestID, setSelectedRequestID] = useState(null);

    const toggleRequestSidebar = (requestID) => {
        setSelectedRequestID(requestID);
        setShowRequestSidebar(true);
    };

    const startOfCurrentMonth = startOfMonth(currentMonth);
    const endOfCurrentMonth = endOfMonth(currentMonth);

    const filteredRequests = useMemo(() => {
        if (!searchQuery) return requests

        return requests.filter((request) =>
            (
                request.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (request.room && request.room.toLowerCase().includes(searchQuery.toLowerCase())) ||
                request.requestID.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.airline.name.toLowerCase().includes(searchQuery.toLowerCase())
            ) && (
                isWithinInterval(new Date(request.checkInDate), { start: startOfCurrentMonth, end: endOfCurrentMonth }) ||
                isWithinInterval(new Date(request.checkOutDate), { start: startOfCurrentMonth, end: endOfCurrentMonth }) ||
                (new Date(request.checkInDate) <= endOfCurrentMonth && new Date(request.checkOutDate) >= startOfCurrentMonth)
            )
        );
    }, [requests, searchQuery, startOfCurrentMonth, endOfCurrentMonth]);

    const filteredRooms = useMemo(() => {
        if (!searchQuery) return rooms

        return rooms.filter((room) =>
            filteredRequests.some((request) => request.room === room.id) ||
            room.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [rooms, filteredRequests, searchQuery]);


    const [notifications, setNotifications] = useState([]);

    const addNotification = (text, status) => {
        const id = Date.now(); // Уникальный ID
        setNotifications((prev) => [
            ...prev,
            { id, text, status },
        ]);

        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5300); // 5 секунд уведомление + 300 мс для анимации
    };

    const [hoveredDayInMonth, setHoveredDayInMonth] = useState(null);
    const [hoveredRoom, setHoveredRoom] = useState(null);

    return (
        <>
            <DndContext onDragStart={(e) => handleDragStart(e)} onDragEnd={handleDragEnd}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '30px' }}>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Box sx={{ position: "relative", height: 'fit-content', maxHeight: user.role == 'HOTELADMIN' ? '76vh' : '67vh', overflow: 'hidden', overflowY: 'scroll', width: '100%', borderBottom: '1px solid #ddd', borderTop: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
                            <Timeline
                                hoveredDayInMonth={hoveredDayInMonth}
                                currentMonth={currentMonth}
                                setCurrentMonth={setCurrentMonth}
                                dayWidth={DAY_WIDTH}
                                weekendColor={WEEKEND_COLOR}
                                monthColor={MONTH_COLOR}
                                leftWidth={LEFT_WIDTH}
                                handleCheckRoomsType={handleCheckRoomsType}
                            />
                            <Box sx={{ display: 'flex', position: 'relative', height: '100%', overflow: 'hidden' }}>
                                <Box
                                    sx={{
                                        left: 0,
                                        top: 0,
                                        minWidth: `${LEFT_WIDTH}px`,
                                        width: `${LEFT_WIDTH}px`,
                                        maxWidth: `${LEFT_WIDTH}px`,
                                        backgroundColor: '#f5f5f5',
                                        zIndex: 2,
                                    }}
                                >
                                    {filteredRooms.map((room, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                height: room.type === 'double' ? '80px' : '40px',
                                                borderBottom: index + 1 == filteredRooms.length ? '1px solid #dddddd00' : '1px solid #ddd',
                                                borderRight: '1px solid #ddd',
                                                borderLeft: '1px solid #ddd',
                                                backgroundColor: hoveredRoom == room.id ? "#cce5ff" : !room.active ? '#a9a9a9' : '#f5f5f5',
                                                opacity: !room.active ? '0.5' : '1'
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                sx={{ textAlign: 'center', width: '100%', fontSize: '14px', padding: '0 10px' }}
                                            >
                                                {room.id} {!room.active ? '(не работает)' : ''}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>

                                <Box
                                    sx={{ width: `calc(100% - ${LEFT_WIDTH}px)` }}
                                    ref={scrollContainerRef}
                                >
                                    <Box sx={{ overflow: 'hidden' }}>
                                        <CurrentTimeIndicator dayWidth={DAY_WIDTH} />
                                        {filteredRooms.map((room, index) => (
                                            <RoomRow
                                                setHoveredRoom={setHoveredRoom}
                                                setHoveredDayInMonth={setHoveredDayInMonth}
                                                borderBottomDraw={index + 1 == filteredRooms.length ? true : false}
                                                userRole={user.role}
                                                key={room.id}
                                                dayWidth={DAY_WIDTH}
                                                weekendColor={WEEKEND_COLOR}
                                                monthColor={MONTH_COLOR}
                                                room={room}
                                                requests={filteredRequests.filter((req) => req.room === room.id)}
                                                allRequests={filteredRequests} // Передаем все заявки
                                                currentMonth={currentMonth}
                                                onUpdateRequest={handleUpdateRequest}
                                                isDraggingGlobal={isDraggingGlobal}
                                                onOpenModal={handleOpenModal} // Прокидываем в RoomRow
                                                toggleRequestSidebar={toggleRequestSidebar}
                                                activeDragItem={activeDragItem}
                                                highlightedDatesOld={highlightedDatesOld}
                                                isClick={isClick}
                                                setIsClick={setIsClick}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>


                    <Box sx={{ width: "300px", height: 'fit-content', backgroundColor: "#fff", border: '1px solid #ddd' }}>
                        <Typography variant="h6" sx={{ borderBottom: '1px solid #ddd', textAlign: "center", fontSize: '14px', fontWeight: '700', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            Заявки по эстафете в городе {hotelInfo.city}
                        </Typography>

                        {newRequests?.length > 0 ?
                            <Box sx={{ display: 'flex', gap: '5px', flexDirection: 'column', height: 'fit-content', maxHeight: '485px', padding: "5px", overflow: 'hidden', overflowY: 'scroll' }}>
                                {newRequests.map((request) => (
                                    <DraggableRequest
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
                                    />
                                ))}
                            </Box>
                            :
                            <Typography variant="h6" sx={{ padding: '10px ', textAlign: "center", fontSize: '14px', height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                Заявок не найдено
                            </Typography>
                        }
                    </Box>
                </Box>

                {/* DragOverlay */}
                <DragOverlay style={{ pointerEvents: 'none' }}>
                    {activeDragItem ? (
                        <DraggableRequest
                            userRole={user.role}
                            request={activeDragItem}
                            dayWidth={DAY_WIDTH}
                            currentMonth={currentMonth}
                            isDraggingGlobal={true}
                            toggleRequestSidebar={toggleRequestSidebar}
                            isClick={isClick}
                            setIsClick={setIsClick}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext >

            {/* Модальное окно для редактирования заявки */}
            < EditRequestModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveChanges}
                request={editableRequest}
            />

            <ConfirmBookingModal
                isOpen={isConfirmModalOpen}
                onClose={handleCancelBooking}
                onConfirm={confirmBooking}
                request={selectedRequest}
            />

            <ExistRequestInHotel
                show={showRequestSidebar}
                onClose={() => setShowRequestSidebar(false)}
                setShowChooseHotel={setShowChooseHotel}
                chooseRequestID={selectedRequestID}
                user={user}
            />

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

export default NewPlacement;