import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import RoomRow from "../RoomRow/RoomRow";
import Timeline from "../Timeline/Timeline";
import CurrentTimeIndicator from "../CurrentTimeIndicator/CurrentTimeIndicator";
import { startOfMonth, addMonths, differenceInDays, endOfMonth } from "date-fns";
import { DndContext } from "@dnd-kit/core";
import EditRequestModal from "../EditRequestModal/EditRequestModal";
import DraggableRequest from "../DraggableRequest/DraggableRequest";
import ConfirmBookingModal from "../ConfirmBookingModal/ConfirmBookingModal";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import { decodeJWT, generateTimestampId, GET_BRONS_HOTEL, GET_HOTEL, GET_HOTEL_ROOMS, GET_REQUESTS, getCookie, REQUEST_CREATED_SUBSCRIPTION, REQUEST_UPDATED_SUBSCRIPTION, UPDATE_HOTEL_BRON, UPDATE_REQUEST_RELAY } from "../../../../graphQL_requests";

const DAY_WIDTH = 30;
const WEEKEND_COLOR = "#efefef";
const MONTH_COLOR = "#ddd";

const NewPlacement = () => {
    let { idHotel } = useParams();

    const token = getCookie('token');
    const user = decodeJWT(token);

    // Получение информации об отеле
    const [hotelInfo, setHotelInfo] = useState('');

    const { loading: loadingHotel, error: errorHotel, data: dataHotel } = useQuery(GET_HOTEL, {
        variables: { hotelId: idHotel },
        fetchPolicy: 'network-only',
    });

    useEffect(() => {
        if (dataHotel && dataHotel.hotel) {
            setHotelInfo(dataHotel.hotel);
        }
    }, [dataHotel]);

    // Получение комнат отеля
    const { loading, error, data } = useQuery(GET_HOTEL_ROOMS, {
        variables: { hotelId: idHotel },
        fetchPolicy: 'network-only',
    });

    const rooms = useMemo(() => {
        if (!data || !data.hotel || !data.hotel.rooms) return [];

        return data.hotel.rooms.map((room) => ({
            id: room.name.replace('№ ', ''),
            type: room.category === "onePlace" ? "single" : room.category === "twoPlace" ? "double" : '',
        }));
    }, [data]);

    // Получение броней отеля

    // При бронировании в шахматку не приходит hotelChess

    const [requests, setRequests] = useState([]);

    const { loading: bronLoading, error: bronError, data: bronData, refetch: bronRefetch } = useQuery(GET_BRONS_HOTEL, {
        variables: { hotelId: idHotel },
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

    const handleDragEnd = async (event) => {
        setIsDraggingGlobal(false);

        const { active, over } = event;

        if (!over) return; // Если дроп происходит вне шахматки, ничего не делаем

        const draggedRequest =
            newRequests.find((req) => req.id === parseInt(active.id)) ||
            requests.find((req) => req.id === parseInt(active.id));

        if (!draggedRequest) return;

        const targetRoomId = over?.id;

        if (!targetRoomId) {
            console.error("Целевая комната не определена!");
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
            if (isDouble) {
                // Проверяем доступные позиции для двухместной комнаты
                const availablePosition = [0, 1].find((pos) => !occupiedPositions.includes(pos));

                if (availablePosition === undefined) {
                    console.warn("Все позиции заняты в этой комнате!");
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
                        console.warn(`Заявка с id ${newRequest.id} уже существует в массиве requests!`);
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
                    console.warn("Место занято в однокомнатной комнате!");
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
                        console.warn(`Заявка с id ${newRequest.id} уже существует в массиве requests!`);
                        return prevRequests;
                    }
                    return [...prevRequests, newRequest];
                });

                // Открываем модальное окно для подтверждения
                setSelectedRequest(newRequest);
                setIsConfirmModalOpen(true);
            }
        } else {
            // Перемещение существующих заявок
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
                        console.warn("Места заняты в двухместной комнате!");
                        return;
                    }

                    const bookingInput = {
                        hotelChesses: [
                            {
                                clientId: draggedRequest.personID, // ID клиента
                                hotelId: idHotel, // ID отеля
                                requestId: draggedRequest.requestID, // ID заявки
                                room: `№ ${targetRoomId}`, // Номер комнаты
                                place: Number(availablePosition) + 1, // Позиция в комнате (если двухместная)
                                id: draggedRequest.chessID, // Позиция в комнате (если двухместная)
                            },
                        ],
                    }

                    try {
                        let request = await updateHotelBron({
                            variables: {
                                updateHotelId: idHotel,
                                input: bookingInput,
                            },
                        });

                        console.log(request)

                        if (request) {
                            await updateRequest({
                                variables: {
                                    updateRequestId: draggedRequest.requestID,
                                    input: {
                                        status: "transferred"
                                    },
                                },
                            });
                        }
                        // console.log('Перенесен между местами в номере')
                    } catch (err) {
                        console.error("Произошла ошибка при подтверждении бронирования", err);
                    }

                } else {
                    if (occupiedPositions.length > 0) {
                        console.warn("Место занято в однокомнатной комнате!");
                        return;
                    }

                    const bookingInput = {
                        hotelChesses: [
                            {
                                clientId: draggedRequest.personID, // ID клиента
                                hotelId: idHotel, // ID отеля
                                requestId: draggedRequest.requestID, // ID заявки
                                room: `№ ${targetRoomId}`, // Номер комнаты
                                place: 1, // Позиция в комнате (если двухместная)
                                id: draggedRequest.chessID, // Позиция в комнате (если двухместная)
                            },
                        ],
                    }

                    try {
                        let request = await updateHotelBron({
                            variables: {
                                updateHotelId: idHotel,
                                input: bookingInput,
                            },
                        });

                        console.log(request)

                        if (request) {
                            await updateRequest({
                                variables: {
                                    updateRequestId: draggedRequest.requestID,
                                    input: {
                                        status: "transferred"
                                    },
                                },
                            });
                        }

                        // console.log('Перенесен в другой номер')
                    } catch (err) {
                        console.error("Произошла ошибка при подтверждении бронирования", err);
                    }
                }
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

        console.log(updatedRequest)

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
        } catch (err) {
            console.error("Произошла ошибка при подтверждении бронирования", err);
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
                    hotelId: idHotel, // ID отеля
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
                    updateHotelId: idHotel,
                    input: bookingInput,
                },
            });

        } catch (err) {
            console.error("Произошла ошибка при подтверждении бронирования", err);
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
                console.error("Ошибка при обновлении данных:", error);
            }
        }

        // Закрываем модальное окно
        setIsConfirmModalOpen(false);
        setSelectedRequest(null);
    };


    return (
        <>
            <DndContext onDragStart={() => setIsDraggingGlobal(true)} onDragEnd={handleDragEnd}>
                <Box sx={{ display: 'flex', gap: '50px' }}>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Box sx={{ position: "relative", height: 'fit-content', maxHeight: '100vh', overflow: 'hidden', overflowY: 'scroll', width: `calc(${containerWidth}px + 108px)` }}>
                            <Timeline
                                currentMonth={currentMonth}
                                setCurrentMonth={setCurrentMonth}
                                dayWidth={DAY_WIDTH}
                                weekendColor={WEEKEND_COLOR}
                                monthColor={MONTH_COLOR}
                            />
                            <Box sx={{ display: 'flex', position: 'relative', height: '100%', overflow: 'hidden' }}>
                                <Box
                                    sx={{
                                        left: 0,
                                        top: 0,
                                        minWidth: '100px',
                                        backgroundColor: '#f5f5f5',
                                        zIndex: 2,
                                    }}
                                >
                                    {rooms.map((room, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                height: room.type === 'double' ? '80px' : '40px',
                                                borderBottom: '1px solid #ddd',
                                                borderRight: '1px solid #ddd',
                                                backgroundColor: '#f5f5f5',
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                sx={{ textAlign: 'center', width: '100%', fontSize: '14px' }}
                                            >
                                                {room.id}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>

                                <Box
                                    sx={{ width: `${containerWidth} px` }}
                                    ref={scrollContainerRef}
                                >
                                    <Box sx={{ overflow: 'hidden', width: `${containerWidth}px` }}>
                                        <CurrentTimeIndicator dayWidth={DAY_WIDTH} />

                                        {rooms.map((room) => (
                                            <RoomRow
                                                userRole={user.role}
                                                key={room.id}
                                                dayWidth={DAY_WIDTH}
                                                weekendColor={WEEKEND_COLOR}
                                                monthColor={MONTH_COLOR}
                                                room={room}
                                                requests={requests.filter((req) => req.room === room.id)}
                                                allRequests={requests} // Передаем все заявки
                                                currentMonth={currentMonth}
                                                onUpdateRequest={handleUpdateRequest}
                                                isDraggingGlobal={isDraggingGlobal}
                                                onOpenModal={handleOpenModal} // Прокидываем в RoomRow
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>


                    <Box sx={{ width: "300px", height: 'fit-content', backgroundColor: "#fff", border: '1px solid #ddd' }}>
                        <Typography variant="h6" sx={{ borderBottom: '1px solid #ddd', textAlign: "center", fontSize: '14px', fontWeight: '700', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            Заявки в городе {hotelInfo.city}
                        </Typography>

                        {newRequests?.length > 0 ?
                            <Box sx={{ display: 'flex', gap: '5px', flexDirection: 'column', padding: "10px" }}>
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
            </DndContext >

            {/* Модальное окно для редактирования заявки */}
            < EditRequestModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveChanges}
                request={editableRequest} // Передаём заявку
            />

            <ConfirmBookingModal
                isOpen={isConfirmModalOpen}
                onClose={handleCancelBooking}
                onConfirm={confirmBooking}
                request={selectedRequest}
            />

        </>
    );
};

export default NewPlacement;