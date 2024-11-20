import React, { useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import RoomRow from '../RoomRow/RoomRow';
import Timeline from '../Timeline/Timeline';
import CurrentTimeIndicator from '../CurrentTimeIndicator/CurrentTimeIndicator';
import { startOfMonth, addMonths, differenceInDays, endOfMonth } from 'date-fns';
import { DndContext } from '@dnd-kit/core';

const DAY_WIDTH = 30;
const WEEKEND_COLOR = '#efefef';
const MONTH_COLOR = '#ddd';

const NewPlacement = () => {
    const rooms = useMemo(() => [
        "101", "102", "103", "104", "105", "106", "107", "108", "109", "110",
        "201", "202", "203", "204", "205", "206", "207", "208", "209", "210",
        "301", "302", "303", "304", "305", "306", "307", "308", "309", "310",
    ], []);

    const scrollContainerRef = useRef(null);

    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [requests, setRequests] = useState([
        {
            id: 1,
            room: "101",
            checkInDate: "2024-11-19",
            checkInTime: "14:00",
            checkOutDate: "2024-11-25",
            checkOutTime: "12:00",
            guest: "Иванов Иван Иванович"
        },
        {
            id: 2,
            room: "102",
            checkInDate: "2024-11-22",
            checkInTime: "14:00",
            checkOutDate: "2024-12-08",
            checkOutTime: "15:00",
            guest: "Петров Петр Петрович"
        },
    ]);

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        const draggedRequest = requests.find((req) => req.id === parseInt(active.id));
        const newRoom = over.id;

        if (draggedRequest.room !== newRoom) {
            const draggedStartDate = new Date(`${draggedRequest.checkInDate}T${draggedRequest.checkInTime}`);
            const draggedEndDate = new Date(`${draggedRequest.checkOutDate}T${draggedRequest.checkOutTime}`);

            // Проверка пересечений в новой комнате
            const hasConflict = requests.some((request) => {
                if (request.room === newRoom && request.id !== draggedRequest.id) {
                    const existingStartDate = new Date(`${request.checkInDate}T${request.checkInTime}`);
                    const existingEndDate = new Date(`${request.checkOutDate}T${request.checkOutTime}`);
                    return (
                        (draggedStartDate >= existingStartDate && draggedStartDate < existingEndDate) || // Начало новой брони внутри существующей
                        (draggedEndDate > existingStartDate && draggedEndDate <= existingEndDate) || // Конец новой брони внутри существующей
                        (draggedStartDate <= existingStartDate && draggedEndDate >= existingEndDate) // Новая бронь полностью охватывает существующую
                    );
                }
                return false;
            });

            if (!hasConflict) {
                // Только если конфликтов нет, обновляем состояние
                setRequests((prevRequests) =>
                    prevRequests.map((request) =>
                        request.id === draggedRequest.id ? { ...request, room: newRoom } : request
                    )
                );
            } else {
                // Логика, если есть конфликт
                console.warn("Конфликт бронирования!");
            }
        }
    };

    const daysInMonth = differenceInDays(endOfMonth(currentMonth), currentMonth) + 1; // Количество дней в месяце
    const containerWidth = daysInMonth * DAY_WIDTH; // Общая ширина контейнера

    return (
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
                            // position: 'sticky',
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
                                    height: '30px',
                                    borderBottom: '1px solid #ddd',
                                    borderRight: '1px solid #ddd',
                                    backgroundColor: '#f5f5f5',
                                }}
                            >
                                <Typography
                                    variant="body1"
                                    sx={{ textAlign: 'center', width: '100%', fontSize: '14px' }}
                                >
                                    {room}
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
                                    key={room}
                                    dayWidth={DAY_WIDTH}
                                    weekendColor={WEEKEND_COLOR}
                                    monthColor={MONTH_COLOR}
                                    room={room}
                                    requests={requests.filter((req) => req.room === room)}
                                    currentMonth={currentMonth}
                                />
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </DndContext>
    );
};

export default NewPlacement;
