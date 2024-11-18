import React from 'react';
import { Box, Typography } from '@mui/material';
import RoomRow from '../RoomRow/RoomRow';
import Timeline from '../Timeline/Timeline';
import CurrentTimeIndicator from '../CurrentTimeIndicator/CurrentTimeIndicator';

const DAY_WIDTH = 25;
const TOTAL_DAYS = 365;

const NewPlacement = () => {
    const rooms = ["Room 1", "Room 2", "Room 3", "Room 4"];

    return (
        <Box sx={{ position: "relative", height: '100vh', overflowY: 'auto' }}>
            <Typography variant="h4" align="center" gutterBottom>
                Room Scheduler
            </Typography>

            {/* Основной контейнер для временной шкалы и названий комнат */}
            <Box sx={{ display: 'flex', position: 'relative' }}>

                {/* Липкий блок с названиями комнат */}
                <Box
                    sx={{
                        position: 'sticky',
                        left: 0,
                        top: 0,
                        minWidth: '100px',
                        backgroundColor: '#f5f5f5',
                        zIndex: 2,
                        borderRight: '1px solid #ddd',
                    }}
                >
                    {/* Пустая строка для выравнивания с заголовком временной шкалы */}
                    <Box sx={{ height: '66px', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5' }} />

                    {rooms.map((room, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                height: '30px', // Принудительная высота строки комнаты
                                borderBottom: '1px solid #ddd',
                            }}
                        >
                            <Typography variant="body1" sx={{ textAlign: 'center', width: '100%' }}>
                                {room}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Горизонтально прокручиваемая часть с временной шкалой и сеткой расписания */}
                <Box sx={{ overflowX: 'auto', width: '100%' }}>
                    <Box sx={{ width: `${DAY_WIDTH * TOTAL_DAYS}px` }}> {/* Фиксированная ширина всей сетки */}
                        <Timeline year={2024} dayWidth={DAY_WIDTH} />
                        <CurrentTimeIndicator />
                        {rooms.map((room, index) => (
                            <RoomRow key={index} dayWidth={DAY_WIDTH} />
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default NewPlacement;
