import React from "react";
import { Box, Typography } from "@mui/material";
import { format, eachDayOfInterval, addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

function Timeline({ year = new Date().getFullYear(), dayWidth }) {
    const months = Array.from({ length: 12 }, (_, i) => startOfMonth(addMonths(new Date(year, 0, 1), i)));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #ddd' }}>
            {/* Строка месяцев */}
            <Box sx={{ display: 'flex', height: '30px', borderBottom: '1px solid #ddd' }}> {/* Принудительная высота строки месяца */}
                {months.map((month, index) => {
                    const daysInMonth = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
                    return (
                        <Box
                            key={index}
                            sx={{
                                textAlign: 'center',
                                borderRight: '1px solid #ddd',
                                width: `${dayWidth * daysInMonth.length}px`,
                                backgroundColor: '#f5f5f5',
                                padding: '4px 0'
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                {format(month, 'MMMM yyyy')}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            {/* Строка дней */}
            <Box sx={{ display: 'flex', height: '30px' }}> {/* Принудительная высота строки дней */}
                {eachDayOfInterval({ start: startOfYear(new Date(year, 0, 1)), end: endOfYear(new Date(year, 11, 31)) }).map((day, index) => (
                    <Box
                        key={index}
                        sx={{
                            width: `${dayWidth}px`,
                            textAlign: 'center',
                            borderRight: index % 7 === 6 ? '2px solid #ddd' : '1px solid #ddd',
                            backgroundColor: '#fff',
                            padding: '2px 0'
                        }}
                    >
                        <Typography variant="caption">
                            {format(day, 'd')}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

export default Timeline;
