import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Tooltip, Typography } from "@mui/material";
import RoomRow from "../RoomRow/RoomRow";
import Timeline from "../Timeline/Timeline";
import CurrentTimeIndicator from "../CurrentTimeIndicator/CurrentTimeIndicator";
import { startOfMonth, addMonths, differenceInDays, endOfMonth, isWithinInterval, startOfDay, eachDayOfInterval } from "date-fns";
import { AutoScrollActivator, closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
import EditRequestModal from "../EditRequestModal/EditRequestModal";
import AddPassengersModal from "../AddPassengersModal/AddPassengersModal";
import DraggableRequest from "../DraggableRequest/DraggableRequest";
import ConfirmBookingModal from "../ConfirmBookingModal/ConfirmBookingModal";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import ExistRequestInHotel from "../../Blocks/ExistRequestInHotel/ExistRequestInHotel";
import { convertToDate, decodeJWT, generateTimestampId, GET_BRONS_HOTEL, GET_HOTEL, GET_HOTEL_MIN, GET_HOTEL_ROOMS, GET_REQUESTS, GET_RESERVE_REQUEST, GET_RESERVE_REQUEST_HOTELS, GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS, GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS_PLACEMENT, GET_RESERVE_REQUESTS, getCookie, getMediaUrl, REQUEST_CREATED_SUBSCRIPTION, REQUEST_RESERVE_CREATED_SUBSCRIPTION, REQUEST_RESERVE_UPDATED_SUBSCRIPTION, REQUEST_UPDATED_SUBSCRIPTION, UPDATE_HOTEL_BRON, UPDATE_REQUEST_RELAY } from "../../../../graphQL_requests";
import { } from "date-fns";
import Notification from "../../Notification/Notification";
import AddNewPassengerPlacement from "../../Blocks/AddNewPassengerPlacement/AddNewPassengerPlacement";
import ExistReserveMess from "../../Blocks/ExistReserveMess/ExistReserveMess";
import { roles } from "../../../roles";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import ExistRequest from "../../Blocks/ExistRequest/ExistRequest";
import { VariableSizeList } from "react-window";
import EditRequestNomerFond from "../../Blocks/EditRequestNomerFond/EditRequestNomerFond";
import { useWindowSize } from "../../../hooks/useWindowSize";

const DAY_WIDTH = 40;
const LEFT_WIDTH = 220;
const WEEKEND_COLOR = "#efefef";
const MONTH_COLOR = "#ddd";

const NewPlacement = ({ idHotelInfo, searchQuery, params, user }) => {
    let { idHotel, requestId } = useParams();
    const navigate = useNavigate();

    let hotelId = idHotelInfo ? idHotelInfo : idHotel

    const token = getCookie('token');
    // const user = decodeJWT(token);

    // Получение информации об отеле
    const [hotelInfo, setHotelInfo] = useState('');

    const { loading: loadingHotel, error: errorHotel, data: dataHotel } = useQuery(GET_HOTEL_MIN, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        variables: { hotelId: hotelId },
        fetchPolicy: 'network-only',
        skip: !hotelId
    });
    // console.log(hotelId);
    
    useEffect(() => {
        if (dataHotel && dataHotel.hotel) {
            setHotelInfo(dataHotel.hotel);
        }
    }, [dataHotel]);

    // Получение комнат отеля
    const { loading, error, data, refetch: roomsRefetch } = useQuery(GET_HOTEL_ROOMS, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        variables: { hotelId: hotelId },
        fetchPolicy: 'network-only',
        skip: !hotelId
    });

    const [checkRoomsType, setCheckRoomsType] = useState(false);

    const handleCheckRoomsType = (info) => {
        setCheckRoomsType(info);
    }

    const [isLoading, setIsLoading] = useState(false);

    const [showEditNomer, setShowEditNomer] = useState(false);
    const [selectedNomer, setSelectedNomer] = useState(null);

    // console.log(selectedNomer);
    

    const rooms = useMemo(() => {
        if (!data || !data.hotel || !data.hotel.rooms) return [];

        return data.hotel.rooms
            // .filter((room) => room.reserve === checkRoomsType)
            .map((room) => ({
                roomId: room.id,
                reserve: room.reserve,
                id: room.name,
                // type: room.category === "onePlace" ? "single" : room.category === "twoPlace" ? "double" : '',
                type: room.places,
                roomType: room.type,
                category: room.category,
                beds: room.beds,
                active: room.active,
                roomKind: room.roomKind,
                description: room.description,
                descriptionSecond: room.descriptionSecond
            }))
            .sort((a, b) => {
                // Сначала сортируем по reserve (false < true)
                if (a.reserve !== b.reserve) {
                    return a.reserve - b.reserve;
                }
                // Затем сортируем по id по возрастанию
                return a.id.localeCompare(b.id, undefined, { numeric: true });
            });
    }, [data]);

    // console.log(data?.hotel?.rooms);
    

    // Получение броней отеля

    // При бронировании в шахматку не приходит hotelChess

    const [requests, setRequests] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    
      const firstDay = startOfMonth(currentMonth).toISOString();
      const lastDay = endOfMonth(currentMonth).toISOString()
    //   console.log(firstDay);
    //   console.log(lastDay);

    const { loading: bronLoading, error: bronError, data: bronData, refetch: bronRefetch } = useQuery(GET_BRONS_HOTEL, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        variables: { 
            hotelId: hotelId, 
            hcPagination: {
                start: firstDay, 
                end: lastDay
            } 
        },
        fetchPolicy: 'network-only',
        skip: !hotelId
    });

    // console.log(bronData)

    // Подписки для отслеживания создания и обновления заявок
    const { data: subscriptionData } = useSubscription(REQUEST_CREATED_SUBSCRIPTION, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        onData: () => {
            bronRefetch(); // Обновляем данные после новых событий
            refetchBrons(); 
        },
    });

    const { data: subscriptionUpdateData } = useSubscription(REQUEST_UPDATED_SUBSCRIPTION, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        onData: () => {
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
            case "archived":
                return "Архив";
            case "archiving":
                return "Готов к архиву";
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
                room: {
                    id: chess.room?.id,  
                    name: chess.room?.name,
                    category: chess.room?.category,
                    places: chess.room?.places,
                    active: chess.room?.active,
                    reserve: chess.room?.reserve,
                },
                position: chess.place - 1,
                checkInDate: new Date(chess.start).toISOString().split("T")[0],
                checkInTime: new Date(chess.start).toISOString().split("T")[1].slice(0, 5),
                checkOutDate: new Date(chess.end).toISOString().split("T")[0],
                checkOutTime: new Date(chess.end).toISOString().split("T")[1].slice(0, 5),
                status: translateStatus(chess.request ? chess.request?.status : chess.status),
                guest: chess.client ? chess.client.name : chess.passenger?.name,
                guestPosition: chess.client?.position?.name,
                requestID: chess.request ? chess.request?.id : chess.reserve?.id,
                isRequest: chess.request ? true : false,
                airline: chess.request ? chess.request?.airline : chess.reserve?.airline,
                personID: chess.client ? chess.client?.id : chess.passenger?.id,
                chessID: chess.id,
                requestNumber: chess.request ? chess.request?.requestNumber : chess.reserve?.reserveNumber,
            }));

            setRequests(transformedData);
        }
    }, [bronData]);

    // console.log(requests);
    

    // Получение новых заявок для размещения
    const [newRequests, setNewRequests] = useState([])

    const { loading: loadingBrons, error: errorBrons, data: dataBrons, refetch: refetchBrons } = useQuery(GET_REQUESTS, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        variables: { pagination: { skip: 0, take: 99999999, status: ["created", "opened"] } },
        fetchPolicy: 'network-only',
    });

    // console.log(dataBrons);

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
            hotelInfo.information?.city // Проверяем, что `hotelInfo.city` установлен
        ) {
            const filteredRequests = dataBrons.requests.requests.filter(
                (request) =>
                    // (request.status === "created" || request.status === "opened") &&
                    request.airport.city === hotelInfo.information?.city
            );

            const transformedRequests = filteredRequests.map((request) => ({
                id: generateTimestampId(), // Используем уникальный ID
                checkInDate: new Date(request.arrival).toISOString().split("T")[0],
                checkInTime: new Date(request.arrival).toISOString().split("T")[1].slice(0, 5),
                checkOutDate: new Date(request.departure).toISOString().split("T")[0],
                checkOutTime: new Date(request.departure).toISOString().split("T")[1].slice(0, 5),
                status: "Ожидает",
                guest: request.person ? request.person.name : "Неизвестный гость",
                guestPosition: request.person ? request.person.position?.name : "",
                requestID: request.id,
                requestNumber: request.requestNumber,
                isRequest: true,
                airline: request.airline,
                personID: request?.person?.id,
                hotelId: request?.hotelId,
            }));

            setNewRequests(transformedRequests);
        }
    }, [dataBrons, hotelInfo.information?.city, refetchBrons]);

    // console.log(dataBrons?.requests?.requests)
    // console.log(newRequests);
    

    // ----------------------------------------------------------------

    const scrollContainerRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddPassengersModalOpen, setIsAddPassengersModalOpen] = useState(false);
    const [editableRequest, setEditableRequest] = useState(null);
    const [originalRequest, setOriginalRequest] = useState(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [activeDragItem, setActiveDragItem] = useState(null);
    const [activeDragItemOld, setActiveDragItemOld] = useState(null);

    // Глобальное состояние перетаскивания
    const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

    const [updateHotelBron] = useMutation(UPDATE_HOTEL_BRON, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Apollo-Require-Preflight': 'true',
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
                // 'Apollo-Require-Preflight': 'true',
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
        const activeItem = draggedItemOld || draggedItem;
        setActiveDragItem(activeItem);
        setActiveDragItemOld(draggedItemOld);
        setIsDraggingGlobal(true)

        handleDragStartForRequest(draggedItemOld)
        if (listRef.current) {
            listRef.current.resetAfterIndex(0, true);
        }
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

    const getAvailablePosition = (roomType, occupiedPositions) => {
        const maxPositions = Array.from({ length: roomType }, (_, i) => i);
        return maxPositions.find((pos) => !occupiedPositions.includes(pos));
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
            // addNotification("Дроп произошел вне шахматки", "error");
            return; // Если дроп происходит вне шахматки, ничего не делаем
        }
    
        const draggedRequest =
            newReservePassangers.find((req) => req.id === parseInt(active.id)) ||
            newRequests.find((req) => req.id === parseInt(active.id)) ||
            requests.find((req) => req.id === parseInt(active.id));
        
        // if (draggedRequest?.status === 'Архив' && user.role !== roles.superAdmin) {
        //     addNotification("Эту заявку нельзя перемещать, так как она в архиве", "error");
        //     return;
        // } else if (draggedRequest?.status === 'Архив' && user.role === roles.superAdmin) {
        //     addNotification("SUPERADMIN", "info");
        //     return;
        // }
    
        // if (!draggedRequest) {
        //     addNotification("Не удалось определить заявку для перемещения", "error");
        //     return;
        // }

    
        // Разбираем over.id вида "ROOM123-2" → roomId="ROOM123", targetPosition=2
        const [targetRoomId, targetPositionStr] = over.id.split('-');
        const targetPosition = parseInt(targetPositionStr, 10);


        if (!targetRoomId) {
            addNotification("Целевая комната не определена!", "error");
            return;
        }
    
        const targetRoom = rooms.find((room) => room.roomId === targetRoomId);
        const currentRoom = rooms.find((room) => room.roomId === draggedRequest?.room?.id);
        

        if (!targetRoom) {
            addNotification("Текущая или целевая комната не найдена", "error");
            return;
        }
        // Проверяем случай, если у новой заявки нет currentRoom
        if (!currentRoom) {
            // Проверяем доступные позиции в целевой комнате
            const overlappingRequests = requests.filter((req) => {
                const reqCheckIn = new Date(`${req.checkInDate}T${req.checkInTime}:00`);
                const reqCheckOut = new Date(`${req.checkOutDate}T${req.checkOutTime}:00`);
                const draggedCheckIn = new Date(`${draggedRequest.checkInDate}T${draggedRequest.checkInTime}:00`);
                const draggedCheckOut = new Date(`${draggedRequest.checkOutDate}T${draggedRequest.checkOutTime}:00`);

                return (
                    req.room?.id === targetRoomId &&
                    !(
                        reqCheckOut <= draggedCheckIn || // Если выезд заявки до заезда перетаскиваемой заявки
                        reqCheckIn >= draggedCheckOut    // Если заезд заявки после выезда перетаскиваемой заявки
                    )
                );
            });
            
            const occupiedPositions = overlappingRequests.map((req) => req.position);
            const availablePosition = getAvailablePosition(targetRoom.type, occupiedPositions);

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
                    addNotification(`Заявка с id ${newRequest.id} уже существует!`, "error");
                    return prevRequests;
                }
                return [...prevRequests, newRequest];
            });

            // Открываем модальное окно для подтверждения
            setSelectedRequest(newRequest);
            setIsConfirmModalOpen(true);
            return;
        }

    
        // Проверяем, если это перемещение внутри одного номера
        if (currentRoom.roomId === targetRoomId) {
            // 2.1. Если целевая «ячейка» уже занята — ошибка
            // 1) Сначала парсим даты перетаскиваемой заявки
            const newCheckIn  = new Date(`${draggedRequest.checkInDate}T${draggedRequest.checkInTime}:00`);
            const newCheckOut = new Date(`${draggedRequest.checkOutDate}T${draggedRequest.checkOutTime}:00`);

            // 2) Теперь ищем, есть ли в целевом слоте заявка, даты которой пересекаются с нашей
            const occupied = requests.some(req => {
                // 2.1) Только заявки в той же комнате и на ту же позицию
                if (req.room?.id !== targetRoomId || req.position !== targetPosition) {
                    return false;
                }

                // 2.2) Парсим даты уже забронированной заявки
                const existingStart = new Date(`${req.checkInDate}T${req.checkInTime}:00`);
                const existingEnd   = new Date(`${req.checkOutDate}T${req.checkOutTime}:00`);

                // 2.3) Проверяем пересечение интервалов:
                //     пересечение есть, если НЕ (existingEnd <= newCheckIn || existingStart >= newCheckOut)
                return !(existingEnd <= newCheckIn || existingStart >= newCheckOut);
            });

            // 2.2. Если позиция не изменилась — выходим
            if (draggedRequest.position === targetPosition) {
                return;
            }

            if (occupied) {
                addNotification("Место занято в комнате!", "error");
                return;
            }

            if (draggedRequest?.status === 'Архив') {
                addNotification("Эту заявку нельзя перемещать, так как она в архиве", "error");
                return;
            }

            let bookingInput

            if (draggedRequest.isRequest && draggedRequest.status !== 'Архив') {
                    bookingInput = {
                        hotelChesses: [{
                            status: 'done',
                            requestId: draggedRequest.requestID,
                            roomId: targetRoomId,
                            place: targetPosition + 1,      // +1, т.к. сервер считает от 1
                            clientId: draggedRequest.personID,
                            id: draggedRequest.chessID,
                    }],
                }
            } else if (!draggedRequest.isRequest && draggedRequest.status !== 'Архив') {
                bookingInput = {
                    hotelChesses: [{
                        status: 'done',
                        reserveId: draggedRequest.requestID,
                        roomId: targetRoomId,
                        place: targetPosition + 1,      // +1, т.к. сервер считает от 1
                        clientId: draggedRequest.personID,
                        id: draggedRequest.chessID,
                }],
            }
            }
        
            // 2.3. Выполняем мутацию на сервере только с новым place
            try {
                setIsLoading(true)
                await updateHotelBron({
                    variables: {
                    updateHotelId: hotelId,
                    input: bookingInput,
                    },
                });
                //   await updateRequest({
                //     variables: {
                //         updateRequestId: draggedRequest.requestID,
                //         input: {
                //             status: 'done'
                //         }
                //     }
                //   })
                addNotification("Заявка перемещена в комнату " + (targetPosition + 1), "success");
            } catch (err) {
                setIsLoading(false)
                addNotification("Ошибка при перемещении внутри номера", "error");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
            return;
        }
      
        const isDouble = targetRoom?.type === 2;
    

        const overlappingRequests = requests.filter((req) => {
            // Собираем дату + время для каждой заявки и для draggedRequest
            const reqStart = new Date(`${req.checkInDate}T${req.checkInTime}:00`);
            const reqEnd   = new Date(`${req.checkOutDate}T${req.checkOutTime}:00`);
            const dragStart = new Date(`${draggedRequest.checkInDate}T${draggedRequest.checkInTime}:00`);
            const dragEnd   = new Date(`${draggedRequest.checkOutDate}T${draggedRequest.checkOutTime}:00`);
        
            // Проверяем, что заявка в той же комнате
            // и интервалы [reqStart, reqEnd] и [dragStart, dragEnd] пересекаются
            return (
                req.room?.id === targetRoomId &&
                !(reqEnd <= dragStart || reqStart >= dragEnd)
            );
        });

        const occupiedPositions = overlappingRequests.map((req) => req.position);

        if (newRequests.includes(draggedRequest)) {
            // Если это новая заявка
            if (targetRoom.active) {
                // Проверяем доступные позиции для двухместной комнаты
                const availablePosition = getAvailablePosition(targetRoom.type, occupiedPositions);

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
                        addNotification(`Заявка с id ${newRequest.id} уже существует!`, "error");
                        // console.log('This is here');
                        return prevRequests;
                    }
                    return [...prevRequests, newRequest];
                });
    
                // Открываем модальное окно для подтверждения
                setSelectedRequest(newRequest);
                setIsConfirmModalOpen(true);
            } else {
                addNotification("Комната не активна!", "error");
                return;
            }
        } else if (newReservePassangers.includes(draggedRequest)) {
            // Если это новая заявка
            if (targetRoom.active) {
                // Проверяем доступные позиции для двухместной комнаты
                const availablePosition = getAvailablePosition(targetRoom.type, occupiedPositions);
    
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
                        addNotification(`Заявка с id ${newRequest.id} уже существует!`, "error");
                        return prevRequests;
                    }
                    return [...prevRequests, newRequest];
                });
    
                // Открываем модальное окно для подтверждения
                setSelectedRequest(newRequest);
                setIsConfirmModalOpen(true);
            } else {
                addNotification("Комната не активна!", "error");
                return;
            }
        } else {
            // Перемещение существующих заявок
            if (targetRoom.active) {
                if (draggedRequest.room?.id === targetRoomId) {
                    // Перемещение внутри одной комнаты
                    const targetPosition = parseInt(over.data.current?.position || 0);
    
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
                    // Перемещение между комнатами
                    const availablePosition = getAvailablePosition(targetRoom.type, occupiedPositions);
    
                    if (availablePosition === undefined) {
                        addNotification("Место занято в комнате!", "error");
                        return;
                    }
    
                    let bookingInput;
    
                    if (draggedRequest.isRequest && draggedRequest.status !== 'Архив') {
                        bookingInput = {
                            hotelChesses: [
                                {
                                    requestId: draggedRequest.requestID, // ID заявки
                                    roomId: targetRoom.roomId,
                                    place: Number(availablePosition) + 1, // Позиция в комнате (если двухместная)
                                    clientId: draggedRequest.personID, // ID клиента
                                    id: draggedRequest.chessID, // Позиция в комнате (если двухместная)
                                },
                            ],
                        };
                    } else if (!draggedRequest.isRequest && draggedRequest.status !== 'Архив') {
                        bookingInput = {
                            hotelChesses: [
                                {
                                    clientId: draggedRequest.personID, // ID клиента
                                    hotelId: hotelId, // ID отеля
                                    reserveId: draggedRequest.requestID, // ID заявки
                                    roomId: targetRoom.roomId,
                                    place: Number(availablePosition) + 1, // Позиция в комнате (если двухместная)
                                    id: draggedRequest.chessID, // Позиция в комнате (если двухместная)
                                },
                            ],
                        };
                    } else {
                        addNotification("Эту заявку нельзя перемещать, так как она в архиве", "error");
                        return;
                    }
    
                    try {
                        setIsLoading(true)
                        await updateHotelBron({
                            variables: {
                                updateHotelId: hotelId,
                                input: bookingInput,
                            },
                        });
                        addNotification("Бронь успешно перемещена", "success");
                    } catch (err) {
                        addNotification("Произошла ошибка при подтверждении бронирования", "error");
                        console.error("Произошла ошибка при подтверждении бронирования", err);
                    } finally {
                        setIsLoading(false)
                    }
                }
            } else {
                addNotification("Комната не активна!", "error");
                return;
            }
        }
    };

    // console.log(newRequests);
    
    
    const handleOpenModal = (request, originalRequest) => {
        setOriginalRequest(originalRequest)
        setEditableRequest(request);
        setIsModalOpen(true);
    };

    // Функция проверки пересечения заявок с учетом приведения room к идентификатору
    const isOverlap = (updatedRequest) => {
        // Получаем идентификатор комнаты для updatedRequest
        // const updatedRoomId =
        // updatedRequest.room && typeof updatedRequest.room === "object"
        //     ? updatedRequest.room.id
        //     : updatedRequest.room;
        const updatedRoomId = updatedRequest.room.id
    
        // Фильтруем заявки в той же комнате, используя идентификатор
        const roomRequests = requests.filter((req) => {
        const reqRoomId =
            req.room && typeof req.room === "object" ? req.room.id : req.room;
        return reqRoomId === updatedRoomId;
        });
    
        const updatedCheckIn = new Date(
        `${updatedRequest.checkInDate}T${updatedRequest.checkInTime}`
        );
        const updatedCheckOut = new Date(
        `${updatedRequest.checkOutDate}T${updatedRequest.checkOutTime}`
        );
    
        return roomRequests.some((otherRequest) => {
        // Пропускаем саму заявку
        if (otherRequest.id === updatedRequest.id) return false;
        // Если заявки находятся на разных позициях в комнате – пересечение не учитываем
        if (otherRequest.position !== updatedRequest.position) return false;
    
        const otherCheckIn = new Date(
            `${otherRequest.checkInDate}T${otherRequest.checkInTime}`
        );
        const otherCheckOut = new Date(
            `${otherRequest.checkOutDate}T${otherRequest.checkOutTime}`
        );
        // Если интервалы не пересекаются, возвращаем false
        return !(updatedCheckOut <= otherCheckIn || updatedCheckIn >= otherCheckOut);
        });
    };
  
  

    const handleSaveChanges = async (updatedRequest) => {
        // Определяем изменения в дате заезда или выезда
        const originalCheckIn = new Date(`${editableRequest.checkInDate}T${editableRequest.checkInTime}`);
        const originalCheckOut = new Date(`${editableRequest.checkOutDate}T${editableRequest.checkOutTime}`);
        const newCheckIn = new Date(`${updatedRequest.checkInDate}T${updatedRequest.checkInTime}`);
        const newCheckOut = new Date(`${updatedRequest.checkOutDate}T${updatedRequest.checkOutTime}`);
    
        let newStatus = updatedRequest.status;
    
        // Если дата заезда и дата выезда не изменились, статус не меняется
        if (newCheckIn.getTime() === originalCheckIn.getTime() && newCheckOut.getTime() === originalCheckOut.getTime()) {
            newStatus = editableRequest.status; // Оставляем текущий статус
            // setIsModalOpen(false);
            // return;
        } else {
            // Если дата заезда изменена
            if (newCheckIn > originalCheckIn) {
                newStatus = "Сокращен";
            } else if (newCheckIn < originalCheckIn) {
                newStatus = "Ранний заезд";
            }

            // Если дата выезда изменена
            if (newCheckOut > originalCheckOut) {
                newStatus = "Продлен";
            } else if (newCheckOut < originalCheckOut) {
                newStatus = "Сокращен";
            }
        }
    
        // Обновляем статус заявки
        const requestToSave = {
            ...updatedRequest,
            status: newStatus,
        };

        // Добавляем проверку пересечения
        if (isOverlap(requestToSave)) {
            addNotification("Изменение заявки недопустимо: пересечение с другой заявкой!", "error");
            return; // Не сохраняем изменения, если есть пересечение
        }
    
        // Сохраняем изменения локально
        setRequests((prevRequests) =>
            prevRequests.map((req) =>
                req.id === requestToSave.id ? requestToSave : req
            )
        );
    
        setOriginalRequest(null);
        setIsModalOpen(false);
    
        // Сохраняем изменения на сервере
        try {
            setIsLoading(true)
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
                            : newStatus === 'Перенесен' 
                            ? "transferred"
                            : newStatus === 'Забронирован' 
                            ? "done"
                            : newStatus === 'Готов к архиву' 
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
        } finally {
            setIsLoading(false)
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
                        // room: `${request.room}`, // Номер комнаты
                        roomId: `${request.roomId}`,
                        place: Number(request.position) + 1, // Позиция в комнате (если двухместная)
                        public: true, // Флаг публичности (если применимо)
                        status: 'done'
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
                        // room: `${request.room}`, // Номер комнаты
                        roomId: `${request.roomId}`,
                        place: Number(request.position) + 1, // Позиция в комнате (если двухместная)
                        public: true, // Флаг публичности (если применимо)
                    },
                ],
            }
        }

        try {
            setIsLoading(true)
            setSelectedRequest(null);
            setIsConfirmModalOpen(false);
            await updateHotelBron({
                variables: {
                    updateHotelId: hotelId,
                    input: bookingInput,
                },
            });
            addNotification("Бронь успешно добавлена", "success");
            refetchHotelReserveOne()
        } catch (err) {
            console.error("Произошла ошибка при подтверждении бронирования", err);
        } finally {
            setIsLoading(false)
        }
    };

    // console.log(requests);
    

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

        // console.log(requests.filter((request) =>
        // {
        //     request.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
        //     (request.room?.name && request.room?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        //     request.requestID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        //     request.airline.name.toLowerCase().includes(searchQuery.toLowerCase())
        // }))
        

        return requests.filter((request) =>
            (
                request?.guest?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (request?.guestPosition ? request.guestPosition.toLowerCase().includes(searchQuery.toLowerCase()) : null) ||
                (request?.room && request.room?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                request.requestID.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.airline?.name.toLowerCase().includes(searchQuery.toLowerCase())
            ) && (
                isWithinInterval(new Date(request.checkInDate), { start: startOfCurrentMonth, end: endOfCurrentMonth }) ||
                isWithinInterval(new Date(request.checkOutDate), { start: startOfCurrentMonth, end: endOfCurrentMonth }) ||
                (new Date(request.checkInDate) <= endOfCurrentMonth && new Date(request.checkOutDate) >= startOfCurrentMonth)
            )
        );
    }, [requests, searchQuery, startOfCurrentMonth, endOfCurrentMonth]);
    // console.log(requests);
    

    // const filteredRequests = useMemo(() => {
    //     if (!searchQuery) return requests;
      
    //     return requests.filter((request) => {
    //       const lowerSearch = searchQuery.toLowerCase();
    //       return (
    //         (request.guest?.toLowerCase() || "").includes(lowerSearch) ||
    //         (request.room && request.room.name.toLowerCase().includes(lowerSearch)) ||
    //         (request.requestID?.toLowerCase() || "").includes(lowerSearch) ||
    //         (request.airline?.name?.toLowerCase() || "").includes(lowerSearch)
    //       );
    //     });
    //   }, [requests, searchQuery]);

    // console.log(filteredRequests);
    
    

    // const filteredRooms = useMemo(() => {
    //     if (!searchQuery) return rooms

    //     return rooms.filter((room) =>
    //         // filteredRequests.some((request) => request.room?.name === room.id) ||
    //         filteredRequests.some((request) => request.room?.id === room.roomId) ||
    //         room.id.toLowerCase().includes(searchQuery.toLowerCase())
    //     );
    // }, [rooms, filteredRequests, searchQuery]);

    // const filteredRooms = useMemo(() => {
    //     // Если нет поискового запроса, просто берём все комнаты,
    //     // иначе фильтруем по существующей логике
    //     const baseFiltered = !searchQuery
    //       ? rooms
    //       : rooms.filter((room) =>
    //           filteredRequests.some((request) => request.room?.id === room.roomId) ||
    //           room.id.toLowerCase().includes(searchQuery.toLowerCase())
    //         );
      
    //     // Сортируем:
    //     // 1) Сначала по полю `reserve` так, чтобы false шёл раньше true
    //     // 2) Если `reserve` одинаковое, то сравниваем по `type` по возрастанию
    //     return [...baseFiltered].sort((a, b) => {
    //       if (a.reserve === b.reserve) {
    //         // Если type числовой:
    //         return a.type - b.type;
    //         // Если type — строка, то используйте:
    //         // return a.type.localeCompare(b.type);
    //       }
    //       // false должно идти раньше true
    //       return a.reserve ? 1 : -1;
    //     });
    //   }, [rooms, filteredRequests, searchQuery]);

    const filteredRooms = useMemo(() => {
        // 1) Отбираем baseFiltered по вашему поиску
        const baseFiltered = !searchQuery
            ? rooms
            : rooms.filter(room =>
                filteredRequests.some(request => request.room?.id === room.roomId) ||
                room.id.toLowerCase().includes(searchQuery.toLowerCase())
            );

        // 2) К каждому объекту «приклеиваем» массив заявок для этой комнаты
        const withRequests = baseFiltered.map(room => ({
            ...room,
            requests: filteredRequests.filter(req => req.room?.id === room.roomId)
        }));

        // 3) Сортируем по reserve и по type
        return withRequests.sort((a, b) => {
            if (a.reserve === b.reserve) {
            return a.type - b.type;
            }
            return a.reserve ? 1 : -1;
        });
        }, [rooms, filteredRequests, searchQuery]);

    //   console.log(filteredRooms);
      
      


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

    const { data: subscriptionDataPerson } = useSubscription(GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS_PLACEMENT, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        onData: () => {
            bronRefetch();
        }
    });
    const { data: subscriptionDataReserve } = useSubscription(REQUEST_RESERVE_UPDATED_SUBSCRIPTION, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        onData: () => {
            bronRefetch();
        }
    });

    // console.log(subscriptionDataPerson)

    const { loading: loadingReserves, error: errorReserves, data: dataReserves, refetch: refetchReserves } = useQuery(GET_RESERVE_REQUESTS, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        variables: { pagination: { skip: 0, take: 999999999 } },
    });

    // console.log(dataReserves);
    

    const { loading: loadingReserveOne, error: errorReserveOne, data: dataReserveOne, refetch: refetchReserveOne } = useQuery(GET_RESERVE_REQUEST, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Apollo-Require-Preflight': 'true',
            },
        },
        variables: { reserveId: openReserveId },
    });

    const { loading: loadingHotelReserveOne, error: errorHotelReserveOne, data: dataHotelReserveOne, refetch: refetchHotelReserveOne } = useQuery(GET_RESERVE_REQUEST_HOTELS, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        variables: { reservationHotelsId: openReserveId },
    });


    const [requestsReserves, setRequestsReserves] = useState([]);
    const [requestsReserveOne, setRequestsReserveOne] = useState([]);
    const [requestsHotelReserveOne, setRequestsHotelReserveOne] = useState([]);
    const [showModalForAddHotelInReserve, setshowModalForAddHotelInReserve] = useState(false);

    const [newReservePassangers, setnewReservePassangers] = useState([]);

    // console.log(requestsReserves);
    

    useEffect(() => {
        if (dataReserves && dataReserves.reserves.reserves) {
            const sortedRequests = dataReserves.reserves.reserves.filter(
                (reserve) => reserve.airport?.city === hotelInfo.information?.city
            );
            setRequestsReserves(sortedRequests);
        }

        if (openReserveId && dataReserveOne) {
            setRequestsReserveOne(dataReserveOne.reserve);
        }

        if (openReserveId && dataHotelReserveOne) {
            setRequestsHotelReserveOne(dataHotelReserveOne.reservationHotels);
        }
    }, [dataReserves, dataReserveOne, dataHotelReserveOne, hotelInfo.information?.city, openReserveId]);

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

            const bronedPersons = reservePassangers.flatMap(item =>
                item.reserve?.hotelChess?.map(chess => chess.passenger?.id || chess.client?.id).filter(Boolean) || []
            );

            const transformedRequests = reservePassangers.flatMap((reservePassanger) => {
                // Объединяем поля person и passengers в один массив
                const combinedPersons = [...(reservePassanger?.person || []), ...(reservePassanger?.passengers || [])];

                const filteredPersons = combinedPersons.filter(person => !bronedPersons.includes(person.id));

                return filteredPersons.map((request) => {
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

            const bronedPersons = reservePassangers.flatMap(item =>
                item.reserve?.hotelChess?.map(chess => chess.passenger?.id || chess.client?.id).filter(Boolean) || []
            );

            const { reservePersons } = subscriptionDataPerson;

            let isPerson = reservePassangers[0]?.person?.length > 0 ? true : false;
            let isPassanger = reservePassangers[0]?.passengers?.length > 0 ? true : false;

            const transformedRequests = reservePassangers.flatMap((reservePassanger) => {
                const combinedPersons = (isPerson && !isPassanger) ? [...(reservePersons?.reserveHotel.person || [])] : (!isPerson && isPassanger) ? [...(reservePersons?.reserveHotel.passengers || [])] : [];

                const filteredPersons = combinedPersons.filter(person => !bronedPersons.includes(person.id));

                return filteredPersons.map((request) => {
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
        const totalPassengers = requestsHotelReserveOne.reduce((acc, item) => acc + Number(item.capacity), 0);
        setShowChooseHotels(totalPassengers);
    }, [requestsHotelReserveOne]);

    const handleOpenAddPassengersModal = () => {
        setIsAddPassengersModalOpen(true);
    };

    const handleCloseAddPassengersModal = () => {
        setIsAddPassengersModalOpen(false);
    };

    const targetReserveHotels = requestsHotelReserveOne.filter(item => item.hotel?.id === hotelId);
    const targetReserveHotelCapacity = targetReserveHotels[0]?.capacity;
    const targetReserveHotelCPassPersonCount = targetReserveHotels[0]?.passengers?.length + targetReserveHotels[0]?.person?.length;

    const filteredRequestsReserves = requestsReserves.filter((request) => {
        const infoHotel = request.hotel.find(hotel => hotel.hotel?.id === hotelId);
        const totalCapacity = request.hotel.reduce((sum, hotel) => sum + hotel.capacity, 0);

        return request.passengerCount > totalCapacity || !!infoHotel;
    });

    // ref для управления списком
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
                style={{ ...style, overflowX: 'hidden' }}
            />
        ));
        Outer.displayName = "ListOuterElement";
        return Outer;
    }, []);

    // При изменении filteredRooms сбрасываем кэш
    useEffect(() => {
        if (listRef.current) {
        // resetAfterIndex(0, true) – пересчитать всё заново
        listRef.current.resetAfterIndex(0, true);
        }
    }, [filteredRooms]);
    
    const [showRequestSidebarMess, setShowChooseHotelMess] = useState(false);

    const toggleRequestSidebarMess = () => setShowChooseHotelMess(!showRequestSidebarMess);

    const getRoomHeight = index => {
        const room = filteredRooms[index];
        return 50 * room.type; // Высота комнаты зависит от типа
    };

    // Дополнительно можно передать itemKey, чтобы «привязать» каждый индекс к roomId
    const itemKey = (index) => {
        const room = filteredRooms[index];
        return room.roomId; 
    };

    // Для виртуального списка вычисления на уровне родительского компонента
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
                const containerWidth = containerRef.current.offsetWidth; // Get container width
                const newDayWidth = containerWidth / daysInMonth1.length; // Calculate day width
                setDayWidthLength(newDayWidth);
            }
        };

        updateDayWidth();

        const observer = new ResizeObserver(updateDayWidth);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    }, [daysInMonth1])
        // console.log(showRequestSidebar);

    // const [listHeight, setListHeight] = useState(0);
    // const heightContainerRef = useRef(null);
        
    // useEffect(() => {
    //   if (heightContainerRef.current) {
    //     setListHeight(heightContainerRef.current.offsetHeight);
    //   }
    // }, [heightContainerRef, filteredRequests, window.innerWidth]);

      const { height } = useWindowSize();

      
    // в начале компонента
    const hasScrolledRef = useRef(false);
    // Получаем индекс комнаты, где есть нужная requestId:
    const roomIndex = useMemo(() => {
    if (!requestId) return -1;
    return filteredRooms.findIndex(room =>
        room.requests?.some(req => req.requestID === requestId)
    );
    }, [filteredRooms, requestId]);

    // По изменению roomIndex или requestId — скроллим:
    // useEffect(() => {
    // if (roomIndex >= 0 && listRef.current) {
    //     listRef.current.scrollToItem(roomIndex, "center");
    // }
    // }, [roomIndex]);
    useEffect(() => {
    if (roomIndex >= 0 && listRef.current 
        // && !hasScrolledRef.current
    ) {
        listRef.current.scrollToItem(roomIndex, "center");
        hasScrolledRef.current = true;  // помечаем, что прокрутка уже была
        
        // navigate(`/hotels/${hotelId}`)
    }
    }, [roomIndex, requestId]);
// console.log(requestId);


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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '30px' }}>
                    <Box 
                        sx={{ overflow: 'hidden', flex: 1, minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }} 
                        // ref={heightContainerRef}
                    >
                        <Box
                            
                            sx={{ 
                                position: "relative", 
                                height: user?.role == roles.hotelAdmin ? '76vh' : '67vh', 
                                maxHeight: user?.role == roles.hotelAdmin ? '76vh' : '67vh', 
                                overflow: 'hidden',
                                overflowX: 'hidden',
                                width: '100%', 
                                // borderBottom: '1px solid #ddd',
                                // borderTop: '1px solid #ddd',
                                // borderRight: '1px solid #ddd'
                            }}
                        >
                            <Timeline
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
                                setshowModalForAddHotelInReserve={setshowModalForAddHotelInReserve}
                            />
                            <VariableSizeList
                                ref={listRef}
                                outerElementType={ListOuterElement}
                                itemCount={filteredRooms.length}
                                itemSize={getRoomHeight}
                                itemKey={itemKey}
                                width="100%"
                                // height={listHeight}
                                height={(user?.role === roles.hotelAdmin && height > 880) 
                                    ? 610 : 
                                    (user?.role === roles.hotelAdmin && height < 830)
                                    ? 420 :
                                    (user?.role === roles.hotelAdmin && height < 880) 
                                    ? 530 : 
                                    (user?.role !== roles.hotelAdmin && height < 830)
                                    ? 390 :
                                    (user?.role !== roles.hotelAdmin && height < 900)
                                    ? 460
                                    : 530} // или другое подходящее значение
                                overscanCount={5}
                                style={{ overflowY: 'scroll', overflowX:'hidden' }}
                            >
                                {({ index, style }) => {
                                    const room = filteredRooms[index];
                                    return (
                                    <div style={{ ...style, pointerEvents: 'auto', borderBottom: '1px solid #ddd' }} key={room.roomId}>
                                        <Box sx={{ display: 'flex' }}>
                                        {/* Левая колонка с названиями комнат */}
                                            <Box
                                                sx={{
                                                    minWidth: `${LEFT_WIDTH}px`,
                                                    width: `${LEFT_WIDTH}px`,
                                                    maxWidth: `${LEFT_WIDTH}px`,
                                                    // backgroundColor: '#f5f5f5',
                                                    borderLeft: '1px solid #ddd',
                                                    borderRight: '1px solid #ddd',
                                                    // borderTop: '1px solid #ddd',
                                                    borderBottom: '1px solid #ddd',
                                                    // borderBottom: index + 1 === filteredRooms.length ? '1px solid transparent' : '1px solid #ddd',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    overflow: 'hidden',
                                                    zIndex: 15,
                                                    backgroundColor: hoveredRoom === room.roomId ? "#cce5ff" : !room.active ? '#a9a9a9' : '#fff',
                                                    // backgroundColor: hoveredRoom === room.roomId ? "#cce5ff" : !room.active ? '#a9a9a9' : '#f5f5f5'
                                                }}
                                            >
                                                <Tooltip
                                                    title={`${room.roomType !== "apartment" ? "№" : ""} ${room.id} ${room.roomType !== "apartment" ? room?.roomKind?.name : ""} ${room.descriptionSecond ? room.descriptionSecond : ""} ${!room.active ? '(не работает)' : ''}`}
                                                    arrow
                                                    placement="top"
                                                    enterDelay={1000}
                                                >
                                                    {/* {console.log(room)} */}
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            width: '100%',
                                                            textAlign: 'left',
                                                            fontSize: '14px',
                                                            padding: '0 12px',
                                                            overflow: 'hidden',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            // alignItems: 'flex-start',
                                                            color: '#545873',
                                                            WebkitBoxOrient: 'vertical',
                                                            WebkitLineClamp: 2,
                                                        }}
                                                    >
                                                        <div 
                                                            style={{ display: 'flex', flexDirection:'column', cursor: 'pointer' }}
                                                            onClick={() => {
                                                                setSelectedNomer(room); // room – объект с данными номера
                                                                setShowEditNomer(true);
                                                            }}
                                                        >
                                                            <p 
                                                              style={
                                                                room.type === 1 ?
                                                                {
                                                                fontSize: '12px',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 1,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                              } : {
                                                                fontSize: '12px',
                                                              }}
                                                            >
                                                                {room.roomType !== "apartment" ? "№" : ""} {room.id} {room.roomType !== "apartment" ? room?.roomKind?.name : ""}
                                                            </p> 
                                                            <p
                                                            style={
                                                                room.type === 1 ?
                                                                {
                                                                fontSize: '10px',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                              } : {
                                                                fontSize: '10px',
                                                              }}
                                                            >
                                                                {room.descriptionSecond}
                                                            </p> 
                                                        </div>
                                                        {!room.active ? '(не работает)' : ''}
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                minWidth:'37px',
                                                                display: 'flex',
                                                                flexDirection:'column',
                                                                alignItems: 'flex-end',
                                                                gap: '5px'
                                                            }}
                                                        >
                                                            {/* <img src="/roomPlace.png" style={{ verticalAlign: 'top' }} alt="" /> */}
                                                            {/* <img src="/roomPlacePerson.png" style={{ verticalAlign: 'top', width: '20px' }} alt="" /> */}
                                                            <div style={{ display:'flex', alignItems:'center', gap: '2px', fontSize: '12px' }}>
                                                                <img src="/roomPlacePersonWhite.png" style={{ verticalAlign: 'top', width: '12px'}} alt="" />
                                                                {`x ${room.type}`}
                                                            </div>
                                                            {room.beds ? (
                                                            <div style={{ display:'flex', alignItems:'center', gap: '2px', fontSize: '12px' }}>
                                                                <img src="/roomsIcon.png" style={{ verticalAlign: 'top', height: '12px'}} alt="" />
                                                                {`x ${room.beds}`}
                                                            </div>
                                                            ) : null}
                                                        </Box>
                                                        {/* {console.log(room)} */}
                                                    </Typography>
                                                </Tooltip>
                                            </Box>
                                        {/* Правая колонка с заявками */}
                                            <Box sx={{ width: `calc(100% - ${LEFT_WIDTH}px)` }}>
                                                <RoomRow
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
                                                    requests={filteredRequests.filter((req) => req.room?.id === room.roomId)}
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


                    {!checkRoomsType && 
                        <Box sx={{ minWidth: "330px", maxWidth:"330px", height: 'fit-content', backgroundColor: "#fff", border: '1px solid #ddd', borderRadius: '10px' }}>
                            <Typography variant="h6" sx={{ padding: '15px', borderBottom: '1px solid #ddd', textAlign: "center", fontSize: '14px', fontWeight: '700', minHeight: '50px', height: 'fit-content', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                Заявки по эскадрильи в городе {hotelInfo.information?.city}
                            </Typography>
                            {newRequests?.length > 0 && (user?.hotelId && hotelInfo?.access || !user?.hotelId) ?
                                <Box sx={{ display: 'flex', gap: '5px', flexDirection: 'column', height: 'fit-content', maxHeight: '485px', padding: "5px", overflow: 'hidden', overflowY: 'scroll' }}>
                                    {newRequests
                                        .slice() // Создаём копию массива, чтобы не мутировать исходный
                                        .sort((a, b) => {
                                            if (a.requestID === requestId) return -1; // Если `a` — нужный request, он идёт первым
                                            if (b.requestID === requestId) return 1; // Если `b` — нужный request, он идёт позже
                                            return 0; // Остальные остаются на своих местах
                                        })
                                        .filter(request => {
                                            // если условие ложно — не фильтруем, возвращаем всё
                                            const shouldFilter = (user?.hotelId && hotelInfo?.access)
                                            
                                            return shouldFilter
                                            ? request.hotelId === hotelId  // при shouldFilter=true оставляем только совпадающие
                                            
                                            : true;                         // при shouldFilter=false — пропускаем все
                                        })
                                        .map((request) => (
                                            <DraggableRequest
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
                                :
                                <Typography variant="h6" sx={{ padding: '10px ', textAlign: "center", fontSize: '14px', height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    Заявок не найдено
                                </Typography>
                            }
                        </Box>
                        
                    }

                    {checkRoomsType && !showReserveInfo && !showModalForAddHotelInReserve &&
                        <Box sx={{ minWidth: "330px", maxWidth:"330px", height: 'fit-content', backgroundColor: "#fff", border: '1px solid #ddd', borderRadius: '10px' }}>
                            <Typography variant="h6" sx={{ padding:'10px', borderBottom: '1px solid #ddd', textAlign: "center", fontSize: '14px', fontWeight: '700', minHeight: '50px', height: 'fit-content', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                Заявки по пассажирам в городе {hotelInfo.information?.city}
                            </Typography>

                            {filteredRequestsReserves?.length > 0 && (user?.hotelId && hotelInfo?.access || !user?.hotelId) ?
                                <Box sx={{ display: 'flex', gap: '5px', flexDirection: 'column', height: 'fit-content', maxHeight: '518px', padding: "5px", overflow: 'hidden', overflowY: 'scroll' }}>
                                    {filteredRequestsReserves.map((request) => (
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
                                            backgroundColor: "#adadad",
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
                                                <img 
                                                    src={getMediaUrl(request.airline.images[0])} 
                                                    alt="" 
                                                    style={{ 
                                                        height: '25px',
                                                        width: '25px', 
                                                        objectFit:'cover', 
                                                        borderRadius: '50%', 
                                                        marginRight: '5px'
                                                        }}
                                                />
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
                            <Typography variant="h6" sx={{ padding: '5px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd', textAlign: "center", fontSize: '14px', fontWeight: '700', minHeight: '50px', height: 'fit-content', justifyContent: 'center', lineHeight: 'normal' }}>
                                <img src="/arrow-left-back.png" alt="" style={{ height: '16px', cursor: 'pointer', marginRight: '10px' }}
                                    onClick={handleCloseReserveInfo}
                                />

                                Заявка {requestsReserveOne?.reserveNumber?.split('-')[0]} - {requestsReserveOne?.reserveForPerson ? 'экипаж' : 'пассажиры'}

                                {targetReserveHotelCPassPersonCount < targetReserveHotelCapacity &&
                                    <img src="/addReserve.png" alt="" style={{ height: '16px', cursor: 'pointer', marginLeft: '10px' }} onClick={handleOpenAddPassengersModal} />
                                }

                                <img src="/chat.png" alt="" style={{ height: '18px', cursor: 'pointer', marginLeft: '10px' }} onClick={toggleRequestSidebarMess} />
                            </Typography>

                            {newReservePassangers?.length > 0 ?
                                <Box sx={{ display: 'flex', gap: '5px', flexDirection: 'column', height: 'fit-content', maxHeight: '485px', padding: "5px", overflow: 'hidden', overflowY: 'scroll' }}>
                                    {newReservePassangers.map((request) => (
                                        <DraggableRequest
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
                                :
                                <Typography variant="h6" sx={{ padding: '10px ', textAlign: "center", fontSize: '14px', height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    Заявок не найдено
                                </Typography>
                            }
                        </Box>
                    }
                </Box>

                {/* DragOverlay */}

                <DragOverlay adjustScale={false} dropAnimation={null} style={{ pointerEvents: 'none' }}>
                    {activeDragItem ? (
                        <DraggableRequest
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
                openReserveId={openReserveId}
            />

            <ConfirmBookingModal
                isOpen={isConfirmModalOpen}
                onClose={handleCancelBooking}
                onConfirm={confirmBooking}
                request={selectedRequest}
            />

            {/* <ExistRequestInHotel
                show={showRequestSidebar}
                onClose={() => setShowRequestSidebar(false)}
                setShowChooseHotel={setShowChooseHotel}
                chooseRequestID={selectedRequestID}
                setChooseRequestID={setSelectedRequestID}
                user={user}
            /> */}

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
                    // Другие необходимые пропсы: id, category, reserve, active, onSubmit, uniqueCategories, tarifs, addTarif, setAddTarif, addNotification и т.д.
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

            <ExistReserveMess hotelId={hotelInfo.id} show={showRequestSidebarMess} onClose={toggleRequestSidebarMess} chooseRequestID={openReserveId} user={user} />


            {(loading || isLoading || bronLoading) && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 'auto', left: 0, right: 0, bottom: 0,
                        backgroundColor: '#F1F4FB', // цвет фона
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                    }}
                >
                    <MUILoader 
                    fullHeight={user?.role === roles.hotelAdmin && height > 800 
                    ? '82vh' 
                    : user?.role === roles.hotelAdmin && height < 800 
                    ? '75vh' 
                    : user?.role !== roles.hotelAdmin && height > 870 
                    ? '83vh' 
                    : '68vh'} />
                </Box>
            )}
        </>
        
    );
};

export default NewPlacement;