import React, { memo } from "react";
import { Box, Typography } from "@mui/material";
import { format, eachDayOfInterval, addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, isToday } from "date-fns";
import { ru } from "date-fns/locale";

const Timeline = memo(({ year = new Date().getFullYear(), dayWidth, weekendColor, monthColor }) => {
    const months = Array.from({ length: 12 }, (_, i) => startOfMonth(addMonths(new Date(year, 0, 1), i)));
    const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);
    const currentMonthIndex = new Date().getMonth();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #ddd' }}>
            {/* Строка месяцев */}
            <Box sx={{ display: 'flex', height: '30px', borderBottom: '1px solid #ddd' }}>
                {months.map((month, index) => {
                    const daysInMonth = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
                    const isActiveMonth = index === currentMonthIndex;

                    return (
                        <Box
                            key={index}
                            sx={{
                                textAlign: 'center',
                                borderRight: `3px solid ${monthColor}`,
                                width: `${Math.round(dayWidth * daysInMonth.length)}px`,
                                backgroundColor: isActiveMonth ? '#f3f292' : '#f5f5f5',
                                padding: '4px 0',
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                {capitalizeFirstLetter(format(month, 'LLLL yyyy', { locale: ru }))}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>


            {/* Строка дней */}
            <Box sx={{ display: 'flex', height: '30px' }}>
                {eachDayOfInterval({ start: startOfYear(new Date(year, 0, 1)), end: endOfYear(new Date(year, 11, 31)) }).map((day, index) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isLastDayOfMonth = day.getDate() === endOfMonth(day).getDate();
                    const isCurrentDay = isToday(day);

                    return (
                        <Box
                            key={index}
                            sx={{
                                width: `${dayWidth}px`,
                                textAlign: 'center',
                                borderRight: isLastDayOfMonth ? `3px solid ${monthColor}` : '1px solid #ddd',
                                padding: '2px 0',
                                backgroundColor: isCurrentDay
                                    ? '#f3f292'
                                    : isWeekend
                                        ? weekendColor
                                        : '#fff',
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: isCurrentDay ? 'bold' : 'normal',
                                }}
                            >
                                {format(day, 'd', { locale: ru })}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

        </Box>
    );
})

export default Timeline;
