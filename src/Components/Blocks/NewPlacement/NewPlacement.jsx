import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import RoomRow from '../RoomRow/RoomRow';
import Timeline from '../Timeline/Timeline';
import CurrentTimeIndicator from '../CurrentTimeIndicator/CurrentTimeIndicator';
import { isLeapYear, startOfYear, differenceInDays } from 'date-fns';

const DAY_WIDTH = 30;
const TOTAL_DAYS = isLeapYear(new Date()) ? 366 : 365;
const WEEKEND_COLOR = '#efefef';
const MONTH_COLOR = '#ddd';

const NewPlacement = () => {
    const rooms = ["101", "102", "103", "104", "105", "106", "107", "108"];
    const scrollContainerRef = useRef(null);

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
            checkOutDate: "2024-11-28",
            checkOutTime: "15:00",
            guest: "Петров Петр Петрович"
        },
    ]);

    useEffect(() => {
        const today = new Date();
        const startOfYearDate = startOfYear(new Date());
        const daysSinceStartOfYear = differenceInDays(today, startOfYearDate);
        const scrollPosition = daysSinceStartOfYear * DAY_WIDTH;

        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollPosition;
        }
    }, []);

    const onRequestMove = (movedRequest, newRoom) => {
        setRequests((prevRequests) =>
            prevRequests.map((request) =>
                request === movedRequest ? { ...request, room: newRoom } : request
            )
        );
    };

    return (
        <Box sx={{ position: "relative", height: '100vh', overflow: 'hidden' }}>
            <Typography variant="h4" align="center" gutterBottom>
                Room Scheduler
            </Typography>

            <Box sx={{ display: 'flex', position: 'relative' }}>
                <Box
                    sx={{
                        position: 'sticky',
                        left: 0,
                        top: 0,
                        minWidth: '100px',
                        backgroundColor: '#f5f5f5',
                        zIndex: 2,
                    }}
                >
                    <Box
                        sx={{
                            height: '61px',
                            borderBottom: '1px solid #ddd',
                            borderRight: '1px solid #ddd',
                            backgroundColor: '#f5f5f5',
                        }}
                    />
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
                    sx={{ overflowX: 'auto', width: '100%' }}
                    ref={scrollContainerRef}
                >
                    <Box sx={{ width: `${Math.round(DAY_WIDTH * TOTAL_DAYS)}px` }}>
                        <Timeline
                            year={2024}
                            dayWidth={DAY_WIDTH}
                            weekendColor={WEEKEND_COLOR}
                            monthColor={MONTH_COLOR}
                        />

                        <CurrentTimeIndicator dayWidth={DAY_WIDTH} />

                        {rooms.map((room, index) => (
                            <RoomRow
                                key={index}
                                dayWidth={DAY_WIDTH}
                                weekendColor={WEEKEND_COLOR}
                                monthColor={MONTH_COLOR}
                                room={room}
                                requests={requests.filter(request => request.room === room)}
                                onRequestMove={onRequestMove}
                            />
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};


export default NewPlacement;
