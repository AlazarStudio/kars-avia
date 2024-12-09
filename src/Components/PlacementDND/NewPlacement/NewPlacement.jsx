import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Tooltip, Typography } from "@mui/material";
import RoomRow from "../RoomRow/RoomRow";
import Timeline from "../Timeline/Timeline";
import CurrentTimeIndicator from "../CurrentTimeIndicator/CurrentTimeIndicator";
import { startOfMonth, addMonths, differenceInDays, endOfMonth, isWithinInterval, startOfDay, eachDayOfInterval } from "date-fns";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import EditRequestModal from "../EditRequestModal/EditRequestModal";
import AddPassengersModal from "../AddPassengersModal/AddPassengersModal";
import DraggableRequest from "../DraggableRequest/DraggableRequest";
import ConfirmBookingModal from "../ConfirmBookingModal/ConfirmBookingModal";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import ExistRequestInHotel from "../../Blocks/ExistRequestInHotel/ExistRequestInHotel";
import { convertToDate, decodeJWT, generateTimestampId, GET_BRONS_HOTEL, GET_HOTEL, GET_HOTEL_ROOMS, GET_REQUESTS, GET_RESERVE_REQUEST, GET_RESERVE_REQUEST_HOTELS, GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS, GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS_PLACEMENT, GET_RESERVE_REQUESTS, getCookie, REQUEST_CREATED_SUBSCRIPTION, REQUEST_RESERVE_CREATED_SUBSCRIPTION, REQUEST_RESERVE_UPDATED_SUBSCRIPTION, REQUEST_UPDATED_SUBSCRIPTION, server, UPDATE_HOTEL_BRON, UPDATE_REQUEST_RELAY } from "../../../../graphQL_requests";
import { } from "date-fns";
import Notification from "../../Notification/Notification";
import AddNewPassengerPlacement from "../../Blocks/AddNewPassengerPlacement/AddNewPassengerPlacement";

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
        // roomsRefetch();
    }

    const rooms = useMemo(() => {
        if (!data || !data.hotel || !data.hotel.rooms) return [];

        return data.hotel.rooms
            // .filter((room) => room.reserve === checkRoomsType)
            .map((room) => ({
                id: room.name,
                reserve: room.reserve,
                active: room.active,
                type: room.category === "onePlace" ? "single" : room.category === "twoPlace" ? "double" : '',
            }));
    }, [data]);

    // Получение броней отеля

    // При бронировании в шахматку не приходит hotelChess

    const [requests, setRequests] = useState([]);

    const { loading: bronLoading, error: bronError, data: bronData, refetch: bronRefetch } = useQuery(GET_BRONS_HOTEL, {
        variables: { hotelId: hotelId },
        fetchPolicy: 'network-only',
    });

    // console.log(bronData)

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
                checkInDate: new Date(subscriptionUpdateData.requestUpdated.arrival).toISOString().split("T")[0],
                checkInTime: new Date(subscriptionUpdateData.requestUpdated.arrival).toISOString().split("T")[1].slice(0, 5),
                checkOutDate: new Date(subscriptionUpdateData.requestUpdated.departure).toISOString().split("T")[0],
                checkOutTime: new Date(subscriptionUpdateData.requestUpdated.departure).toISOString().split("T")[1].slice(0, 5),
                status: translateStatus(subscriptionUpdateData.requestUpdated.status),
                guest: subscriptionUpdateData.requestUpdated.person?.name || "Неизвестный гость",
                requestID: subscriptionUpdateData.requestUpdated.id,
                airline: subscriptionUpdateData.requestUpdated.airline,
                personID: subscriptionUpdateData.requestUpdated.person?.id,
                room: subscriptionUpdateData.requestUpdated.room || null,
                isRequest: true
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
                room: chess.room,
                position: chess.place - 1,
                checkInDate: new Date(chess.start).toISOString().split("T")[0],
                checkInTime: new Date(chess.start).toISOString().split("T")[1].slice(0, 5),
                checkOutDate: new Date(chess.end).toISOString().split("T")[0],
                checkOutTime: new Date(chess.end).toISOString().split("T")[1].slice(0, 5),
                status: translateStatus(chess.request ? chess.request?.status : chess.reserve?.status),
                guest: chess.client ? chess.client.name : "Неизвестный гость",
                requestID: chess.request ? chess.request?.id : chess.reserve?.id,
                isRequest: chess.request ? true : false,
                airline: chess.request ? chess.request?.airline : chess.reserve?.airline,
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
                checkInDate: new Date(subscriptionData.requestCreated.arrival).toISOString().split("T")[0],
                checkInTime: new Date(subscriptionData.requestCreated.arrival).toISOString().split("T")[1].slice(0, 5),
                checkOutDate: new Date(subscriptionData.requestCreated.departure).toISOString().split("T")[0],
                checkOutTime: new Date(subscriptionData.requestCreated.departure).toISOString().split("T")[1].slice(0, 5),
                status: "Ожидает",
                guest: subscriptionData.requestCreated.person?.name || "Неизвестный гость",
                requestID: subscriptionData.requestCreated.id,
                isRequest: true,
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
                checkInDate: new Date(request.arrival).toISOString().split("T")[0],
                checkInTime: new Date(request.arrival).toISOString().split("T")[1].slice(0, 5),
                checkOutDate: new Date(request.departure).toISOString().split("T")[0],
                checkOutTime: new Date(request.departure).toISOString().split("T")[1].slice(0, 5),
                status: "Ожидает",
                guest: request.person ? request.person.name : "Неизвестный гость",
                requestID: request.id,
                isRequest: true,
                airline: request.airline,
                personID: request.person.id,
            }));

            setNewRequests(transformedRequests);
        }
    }, [dataBrons, hotelInfo.city, refetchBrons]);

    // console.log(newRequests)

    // ----------------------------------------------------------------

    const scrollContainerRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddPassengersModalOpen, setIsAddPassengersModalOpen] = useState(false);
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
        const draggedItem = newRequests.find((req) => req.id === parseInt(active.id)) || newReservePassangers.find((req) => req.id === parseInt(active.id));
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
            newReservePassangers.find((req) => req.id === parseInt(active.id)) ||
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
        }
        else if (newReservePassangers.includes(draggedRequest)) {
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
        }
        else {
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

                        console.log(draggedRequest)

                        let bookingInput;

                        if (draggedRequest.isRequest) {
                            bookingInput = {
                                hotelChesses: [
                                    {
                                        clientId: draggedRequest.personID, // ID клиента
                                        hotelId: hotelId, // ID отеля
                                        requestId: draggedRequest.requestID, // ID заявки
                                        room: `${targetRoomId}`, // Номер комнаты
                                        place: Number(availablePosition) + 1, // Позиция в комнате (если двухместная)
                                        id: draggedRequest.chessID, // Позиция в комнате (если двухместная)
                                    },
                                ],
                            }
                        } else if (!draggedRequest.isRequest) {
                            bookingInput = {
                                hotelChesses: [
                                    {
                                        clientId: draggedRequest.personID, // ID клиента
                                        hotelId: hotelId, // ID отеля
                                        requestId: draggedRequest.requestID, // ID заявки
                                        room: `${targetRoomId}`, // Номер комнаты
                                        place: Number(availablePosition) + 1, // Позиция в комнате (если двухместная)
                                        id: draggedRequest.chessID, // Позиция в комнате (если двухместная)
                                    },
                                ],
                            }
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
                            console.log("Произошла ошибка при подтверждении бронирования", err);
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
                                    room: `${targetRoomId}`, // Номер комнаты
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
                            console.log("Произошла ошибка при подтверждении бронирования", err);
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
                        arrival: `${updatedRequest.checkInDate}T${updatedRequest.checkInTime}:00.000Z`,
                        departure: `${updatedRequest.checkOutDate}T${updatedRequest.checkOutTime}:00.000Z`,
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
        let bookingInput;

        if (request.reserveId) {
            bookingInput = {
                hotelChesses: [
                    {
                        clientId: request.personID, // ID клиента
                        start: `${request.checkInDate}T${request.checkInTime}:00.000Z`, // Форматируем дату заезда
                        end: `${request.checkOutDate}T${request.checkOutTime}:00.000Z`, // Форматируем дату выезда
                        hotelId: hotelId, // ID отеля
                        reserveId: request.reserveId ? request.reserveId : '', // ID заявки
                        room: `${request.room}`, // Номер комнаты
                        place: Number(request.position) + 1, // Позиция в комнате (если двухместная)
                        public: true, // Флаг публичности (если применимо)
                    },
                ],
            }
        } else if (request.requestID) {
            bookingInput = {
                hotelChesses: [
                    {
                        clientId: request.personID, // ID клиента
                        start: `${request.checkInDate}T${request.checkInTime}:00.000Z`, // Форматируем дату заезда
                        end: `${request.checkOutDate}T${request.checkOutTime}:00.000Z`, // Форматируем дату выезда
                        hotelId: hotelId, // ID отеля
                        requestId: request.requestID ? request.requestID : '', // ID заявки
                        room: `${request.room}`, // Номер комнаты
                        place: Number(request.position) + 1, // Позиция в комнате (если двухместная)
                        public: true, // Флаг публичности (если применимо)
                    },
                ],
            }
        }

        console.log(hotelId)
        console.log(bookingInput)

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


    // Резерв

    const [showReserveInfo, setShowReserveInfo] = useState(false);
    const [openReserveId, setOpenReserveId] = useState('');

    // const { data: subscriptionDataReserves } = useSubscription(REQUEST_RESERVE_CREATED_SUBSCRIPTION);
    // const { data: subscriptionUpdateDataReserves } = useSubscription(REQUEST_RESERVE_UPDATED_SUBSCRIPTION);

    const { data: subscriptionDataPerson } = useSubscription(GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS_PLACEMENT);


    const { loading: loadingReserves, error: errorReserves, data: dataReserves, refetch: refetchReserves } = useQuery(GET_RESERVE_REQUESTS, {
        variables: { pagination: { skip: 0, take: 999999999 } },
    });

    const { loading: loadingReserveOne, error: errorReserveOne, data: dataReserveOne, refetch: refetchReserveOne } = useQuery(GET_RESERVE_REQUEST, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
        variables: { reserveId: openReserveId },
    });

    const { loading: loadingHotelReserveOne, error: errorHotelReserveOne, data: dataHotelReserveOne, refetch: refetchHotelReserveOne } = useQuery(GET_RESERVE_REQUEST_HOTELS, {
        variables: { reservationHotelsId: openReserveId },
    });

    const [requestsReserves, setRequestsReserves] = useState([]);
    const [requestsReserveOne, setRequestsReserveOne] = useState([]);
    const [requestsHotelReserveOne, setRequestsHotelReserveOne] = useState([]);
    const [showModalForAddHotelInReserve, setshowModalForAddHotelInReserve] = useState(false);

    const [newReservePassangers, setnewReservePassangers] = useState([]);

    useEffect(() => {
        if (dataReserves && dataReserves.reserves.reserves) {
            const sortedRequests = dataReserves.reserves.reserves.filter(
                (reserve) => reserve.airport?.city === hotelInfo.city
            );
            setRequestsReserves(sortedRequests);
        }

        if (openReserveId && dataReserveOne) {
            setRequestsReserveOne(dataReserveOne.reserve);
        }

        if (openReserveId && dataHotelReserveOne) {
            setRequestsHotelReserveOne(dataHotelReserveOne.reservationHotels);
        }
    }, [dataReserves, dataReserveOne, dataHotelReserveOne, hotelInfo.city, openReserveId]);

    const handleOpenReserveInfo = async (reserveId) => {
        setOpenReserveId(reserveId);
        setShowReserveInfo(true);

        try {
            const { data } = await refetchHotelReserveOne({ reservationHotelsId: reserveId });

            const hasHotelWithId = data.reservationHotels.some(
                (hotel) => hotel.hotel.id === hotelInfo.id
            );

            if (hasHotelWithId) {
                setshowModalForAddHotelInReserve(true)
            } else {
                setshowModalForAddHotelInReserve(false)
                toggleCreateSidebarReserveOne()
            }
        } catch (error) {
            console.error("Ошибка при загрузке данных резерва отелей:", error);
        }
    };

    useEffect(() => {
        if (showModalForAddHotelInReserve) {
            const reservePassangers = requestsHotelReserveOne.filter(
                (hotel) => hotel.hotel.id === hotelInfo.id
            );

            const transformedRequests = reservePassangers.flatMap((reservePassanger) => {
                // Объединяем поля person и passengers в один массив
                const combinedPersons = [...(reservePassanger?.person || []), ...(reservePassanger?.passengers || [])];

                return combinedPersons.map((request) => {
                    const arrivalDate = reservePassanger?.reserve?.arrival;
                    const departureDate = reservePassanger?.reserve?.departure;

                    // Проверяем наличие дат
                    if (!arrivalDate || !departureDate) {
                        console.warn("Некорректные данные для дат:", { arrivalDate, departureDate });
                        return null; // Пропускаем некорректные элементы
                    }

                    return {
                        id: generateTimestampId(),
                        checkInDate: new Date(arrivalDate).toISOString().split("T")[0],
                        checkInTime: new Date(arrivalDate).toISOString().split("T")[1].slice(0, 5),
                        checkOutDate: new Date(departureDate).toISOString().split("T")[0],
                        checkOutTime: new Date(departureDate).toISOString().split("T")[1].slice(0, 5),
                        status: "Ожидает",
                        guest: request.name ? request.name : "Неизвестный гость",
                        reserveId: reservePassanger?.reserve?.id,
                        isRequest: false,
                        airline: reservePassanger?.reserve?.airline,
                        personID: request.id,
                    };
                }).filter(Boolean); // Убираем null-значения
            });


            setnewReservePassangers(transformedRequests);
        }
    }, [requestsHotelReserveOne, showModalForAddHotelInReserve]);

    useEffect(() => {
        if (subscriptionDataPerson?.reservePersons) {
            const reservePassangers = requestsHotelReserveOne.filter(
                (hotel) => hotel.hotel.id === hotelInfo.id
            );

            const { reservePersons } = subscriptionDataPerson;

            let isPerson = reservePassangers[0]?.person?.length > 0 ? true : false;
            let isPassanger = reservePassangers[0]?.passengers?.length > 0 ? true : false;

            const transformedRequests = reservePassangers.flatMap((reservePassanger) => {
                const combinedPersons = (isPerson && !isPassanger) ? [...(reservePersons?.reserveHotel.person || [])] : (!isPerson && isPassanger) ? [...(reservePersons?.reserveHotel.passengers || [])] : [];

                return combinedPersons.map((request) => {
                    const arrivalDate = reservePassanger?.reserve?.arrival;
                    const departureDate = reservePassanger?.reserve?.departure;

                    // Проверяем наличие дат
                    if (!arrivalDate || !departureDate) {
                        console.warn("Некорректные данные для дат:", { arrivalDate, departureDate });
                        return null; // Пропускаем некорректные элементы
                    }

                    return {
                        id: generateTimestampId(),
                        checkInDate: new Date(arrivalDate).toISOString().split("T")[0],
                        checkInTime: new Date(arrivalDate).toISOString().split("T")[1].slice(0, 5),
                        checkOutDate: new Date(departureDate).toISOString().split("T")[0],
                        checkOutTime: new Date(departureDate).toISOString().split("T")[1].slice(0, 5),
                        status: "Ожидает",
                        guest: request.name ? request.name : "Неизвестный гость",
                        reserveId: reservePassanger?.reserve?.id,
                        isRequest: false,
                        airline: reservePassanger?.reserve?.airline,
                        personID: request.id,
                    };
                }).filter(Boolean); // Убираем null-значения
            });

            // Добавляем уникальные записи в newReservePassangers
            setnewReservePassangers((prevReservePassangers) => {
                const existingIds = new Set(prevReservePassangers.map((item) => item.personID));
                const newEntries = transformedRequests.filter(
                    (item) => !existingIds.has(item.personID)
                );
                return [...prevReservePassangers, ...newEntries];
            });
            refetchHotelReserveOne()
        }
    }, [subscriptionDataPerson, refetchHotelReserveOne]);

    const handleCloseReserveInfo = () => {
        setOpenReserveId('');
        setShowReserveInfo(false);
        setshowModalForAddHotelInReserve(false)
    }

    const [showCreateSidebarReserveOne, setShowCreateSidebarReserveOne] = useState(false);

    const toggleCreateSidebarReserveOne = () => {
        setShowCreateSidebarReserveOne(!showCreateSidebarReserveOne);
    };

    const [showChooseHotels, setShowChooseHotels] = useState(0);

    useEffect(() => {
        const totalPassengers = requestsHotelReserveOne.reduce((acc, item) => acc + Number(item.hotel.passengersCount), 0);
        setShowChooseHotels(totalPassengers);
    }, [requestsHotelReserveOne]);

    // console.log(requestsReserves)

    const handleOpenAddPassengersModal = () => {
        setIsAddPassengersModalOpen(true);
    };

    const handleCloseAddPassengersModal = () => {
        setIsAddPassengersModalOpen(false);
    };

    // console.log(newReservePassangers)
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
                                                height: room.type === 'double' ? '100px' : '50px',
                                                borderBottom: index + 1 == filteredRooms.length ? '1px solid #dddddd00' : '1px solid #ddd',
                                                borderRight: '1px solid #ddd',
                                                borderLeft: '1px solid #ddd',
                                                backgroundColor: hoveredRoom == room.id ? "#cce5ff" : !room.active ? '#a9a9a9' : '#f5f5f5',
                                                opacity: !room.active ? '0.5' : '1',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <Tooltip title={`${room.id} ${!room.active ? '(не работает)' : ''}`}
                                                arrow
                                                placement="top"
                                                enterDelay={1000}
                                            >
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        textAlign: 'left',
                                                        width: `${LEFT_WIDTH}px`,
                                                        fontSize: '14px',
                                                        padding: '0 10px',
                                                        overflow: 'hidden',
                                                        display: '-webkit-box',
                                                        WebkitBoxOrient: 'vertical',
                                                        WebkitLineClamp: 2
                                                    }}
                                                >
                                                    {room.id} {!room.active ? '(не работает)' : ''} {room.reserve ? '(резерв)' : ''}
                                                </Typography>
                                            </Tooltip>
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
                                                checkRoomsType={checkRoomsType}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>


                    {!checkRoomsType &&
                        <Box sx={{ width: "300px", height: 'fit-content', backgroundColor: "#fff", border: '1px solid #ddd' }}>
                            <Typography variant="h6" sx={{ borderBottom: '1px solid #ddd', textAlign: "center", fontSize: '14px', fontWeight: '700', minHeight: '50px', height: 'fit-content', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    }

                    {checkRoomsType && !showReserveInfo && !showModalForAddHotelInReserve &&
                        <Box sx={{ width: "300px", height: 'fit-content', backgroundColor: "#fff", border: '1px solid #ddd' }}>
                            <Typography variant="h6" sx={{ borderBottom: '1px solid #ddd', textAlign: "center", fontSize: '14px', fontWeight: '700', minHeight: '50px', height: 'fit-content', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                Заявки по резерву в городе {hotelInfo.city}
                            </Typography>

                            {requestsReserves?.length > 0 ?
                                <Box sx={{ display: 'flex', gap: '5px', flexDirection: 'column', height: 'fit-content', maxHeight: '518px', padding: "5px", overflow: 'hidden', overflowY: 'scroll' }}>
                                    {requestsReserves.map((request) => (
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '5px',
                                            width: '100%',
                                            padding: '5px',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            fontSize: '12px',
                                            backgroundColor: "#9e9e9e",
                                            border: "1px solid #757575",
                                            color: '#fff',
                                            borderRadius: '3px',
                                        }}
                                            onClick={() => handleOpenReserveInfo(request.id)}
                                        >
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <img src={`${server}${request.airline.images[0]}`} alt="" style={{ height: '20px', marginRight: '5px' }} />
                                                {request.airline.name} - {request?.reserveForPerson ? 'экипаж' : 'пассажиры'}
                                            </Box>
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                {convertToDate(request.arrival)} - {convertToDate(request.departure)}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                                :
                                <Typography variant="h6" sx={{ padding: '10px ', textAlign: "center", fontSize: '14px', height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    Заявок не найдено
                                </Typography>
                            }
                        </Box>
                    }

                    {checkRoomsType && showReserveInfo && showModalForAddHotelInReserve &&
                        <Box sx={{ width: "300px", height: 'fit-content', backgroundColor: "#fff", border: '1px solid #ddd' }}>
                            <Typography variant="h6" sx={{ padding: '5px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd', textAlign: "center", fontSize: '14px', fontWeight: '700', minHeight: '50px', height: 'fit-content', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 'normal' }}>
                                <img src="/arrow-left-back.png" alt="" style={{ height: '16px', cursor: 'pointer', marginRight: '10px' }}
                                    onClick={handleCloseReserveInfo}
                                />
                                Заявка {requestsReserveOne?.reserveNumber} - {requestsReserveOne?.reserveForPerson ? 'экипаж' : 'пассажиры'}
                                <img src="/addReserve.png" alt="" style={{ height: '16px', cursor: 'pointer', marginLeft: '10px' }} onClick={handleOpenAddPassengersModal} />
                            </Typography>

                            {newReservePassangers?.length > 0 ?
                                <Box sx={{ display: 'flex', gap: '5px', flexDirection: 'column', height: 'fit-content', maxHeight: '485px', padding: "5px", overflow: 'hidden', overflowY: 'scroll' }}>
                                    {newReservePassangers.map((request) => (
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
                    }
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
            <EditRequestModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveChanges}
                request={editableRequest}
            />

            <AddPassengersModal
                isOpen={isAddPassengersModalOpen}
                onClose={handleCloseAddPassengersModal}
                isPerson={requestsReserveOne?.reserveForPerson}
                airlineId={requestsReserveOne?.airline?.id}
                reserveId={requestsReserveOne?.id}
                hotelId={hotelInfo.id}
                token={token}
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
        </>
    );
};

export default NewPlacement;