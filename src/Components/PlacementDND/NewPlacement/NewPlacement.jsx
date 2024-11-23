import React, { useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import RoomRow from "../RoomRow/RoomRow";
import Timeline from "../Timeline/Timeline";
import CurrentTimeIndicator from "../CurrentTimeIndicator/CurrentTimeIndicator";
import { startOfMonth, addMonths, differenceInDays, endOfMonth } from "date-fns";
import { DndContext } from "@dnd-kit/core";
import EditRequestModal from "../EditRequestModal/EditRequestModal";

const DAY_WIDTH = 30;
const WEEKEND_COLOR = "#efefef";
const MONTH_COLOR = "#ddd";

const NewPlacement = () => {
    const rooms = useMemo(() => [
        { id: "101", type: "single" },
        { id: "102", type: "double" },
        { id: "103", type: "single" },
        { id: "104", type: "double" },
        { id: "105", type: "single" },
        { id: "106", type: "double" },
        { id: "107", type: "single" },
        { id: "108", type: "double" },
        { id: "109", type: "single" },
        { id: "110", type: "double" },
    ], []);

    const scrollContainerRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editableRequest, setEditableRequest] = useState(null);
    const [originalRequest, setOriginalRequest] = useState(null);

    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [requests, setRequests] = useState([
        {
            id: 1,
            room: "101",
            position: 0,
            checkInDate: "2024-11-19",
            checkInTime: "14:00",
            checkOutDate: "2024-11-25",
            checkOutTime: "12:00",
            status: "Забронирован",
            guest: "Иванов Иван Иванович"
        },
        {
            id: 2,
            room: "102",
            position: 0,
            checkInDate: "2024-11-25",
            checkInTime: "16:00",
            checkOutDate: "2024-12-08",
            checkOutTime: "15:00",
            status: "Продлен",
            guest: "Петров Петр Петрович"
        },
        {
            id: 3,
            room: "102",
            position: 1,
            checkInDate: "2024-11-22",
            checkInTime: "14:00",
            checkOutDate: "2024-11-28",
            checkOutTime: "15:00",
            status: "Сокращен",
            guest: "Петров Петр Петрович"
        },
        {
            id: 4,
            room: "101",
            position: 0,
            checkInDate: "2024-11-25",
            checkInTime: "14:00",
            checkOutDate: "2024-11-30",
            checkOutTime: "12:00",
            status: "Забронирован",
            guest: "Иванов Иван Иванович"
        },
        {
            id: 5,
            room: "104",
            position: 0,
            checkInDate: "2024-11-16",
            checkInTime: "14:00",
            checkOutDate: "2024-11-25",
            checkOutTime: "12:00",
            status: "Забронирован",
            guest: "Иванов Иван Иванович"
        },
    ]);

    const handleUpdateRequest = (updatedRequest) => {
        setRequests((prevRequests) =>
            prevRequests.map((req) =>
                req.id === updatedRequest.id ? updatedRequest : req
            )
        );
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        const draggedRequest = requests.find((req) => req.id === parseInt(active.id));
        const targetRoomId = over.id;

        if (!draggedRequest) return;

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
            const targetRoom = rooms.find((room) => room.id === targetRoomId);
            const isDouble = targetRoom.type === "double";

            const overlappingRequests = requests.filter(
                (req) =>
                    req.room === targetRoomId &&
                    !(
                        new Date(req.checkOutDate) <= new Date(draggedRequest.checkInDate) ||
                        new Date(req.checkInDate) >= new Date(draggedRequest.checkOutDate)
                    )
            );

            const occupiedPositions = overlappingRequests.map((req) => req.position);

            if (isDouble) {
                const availablePosition = [0, 1].find((pos) => !occupiedPositions.includes(pos));

                if (availablePosition === undefined) {
                    console.warn("Место занято в целевой комнате!");
                    return;
                }

                setRequests((prevRequests) =>
                    prevRequests.map((req) =>
                        req.id === draggedRequest.id
                            ? { ...req, room: targetRoomId, position: availablePosition }
                            : req
                    )
                );
            } else {
                if (overlappingRequests.length > 0) {
                    console.warn("Место занято в целевой комнате!");
                    return;
                }

                setRequests((prevRequests) =>
                    prevRequests.map((req) =>
                        req.id === draggedRequest.id
                            ? { ...req, room: targetRoomId, position: 0 }
                            : req
                    )
                );
            }
        }
    };


    const handleOpenModal = (request, originalRequest) => {
        setOriginalRequest(originalRequest)
        setEditableRequest(request);
        setIsModalOpen(true);
    };


    const handleSaveChanges = (updatedRequest) => {
        setRequests((prevRequests) =>
            prevRequests.map((req) =>
                req.id === updatedRequest.id ? updatedRequest : req
            )
        );
        setOriginalRequest(null);
        setIsModalOpen(false);
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

    return (
        <>
            <DndContext onDragEnd={handleDragEnd}>
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
                            sx={{ width: `${containerWidth}px` }}
                            ref={scrollContainerRef}
                        >
                            <Box sx={{ overflow: 'hidden', width: `${containerWidth}px` }}>
                                <CurrentTimeIndicator dayWidth={DAY_WIDTH} />

                                {rooms.map((room) => (
                                    <RoomRow
                                        key={room.id}
                                        dayWidth={DAY_WIDTH}
                                        weekendColor={WEEKEND_COLOR}
                                        monthColor={MONTH_COLOR}
                                        room={room}
                                        requests={requests.filter((req) => req.room === room.id)}
                                        allRequests={requests} // Передаем все заявки
                                        currentMonth={currentMonth}
                                        onUpdateRequest={handleUpdateRequest}
                                        onOpenModal={handleOpenModal} // Прокидываем в RoomRow
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </DndContext>

            {/* Модальное окно для редактирования заявки */}
            <EditRequestModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveChanges}
                request={editableRequest} // Передаём заявку
            />

        </>
    );
};

export default NewPlacement;
