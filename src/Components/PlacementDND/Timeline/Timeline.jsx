import React, { memo, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import classes from "./Timeline.module.css";
import {
    format,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    addMonths,
    isToday,
} from "date-fns";
import { ru } from "date-fns/locale";

const Timeline = memo(({ handleCheckRoomsType, hoveredDayInMonth, currentMonth, setCurrentMonth, dayWidth, weekendColor, monthColor, leftWidth }) => {
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const handlePreviousMonth = () => {
        setCurrentMonth((prev) => addMonths(prev, -1));
    };

    const handleNextMonth = () => {
        setCurrentMonth((prev) => addMonths(prev, 1));
    };

    const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

    const [activeButton, setActiveButton] = useState(false);

    const handleCheckRoomsTypeInfo = (info) => {
        setActiveButton(info);
        handleCheckRoomsType(info);
    };
    return (
        <Box sx={{
            width: '100%',
            display: "flex", position: "sticky",
            top: 0,
            zIndex: 3,
            boxShadow: '0 0 10px #00000030'
        }}>
            <Box
                sx={{
                    width: `${leftWidth}px`,
                    borderLeft: '1px solid #ddd',
                    borderRight: '1px solid #ddd',
                    borderBottom: '1px solid #ddd',
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    justifyContent: "center",
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px'
                }}
            >
                <button className={`${classes.checkBTN} ${!activeButton ? classes.activeButton : ''}`} onClick={() => { handleCheckRoomsTypeInfo(false) }}>Квота</button>
                <button className={`${classes.checkBTN} ${activeButton ? classes.activeButton : ''}`} onClick={() => { handleCheckRoomsTypeInfo(true) }}>Резерв</button>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", borderBottom: "1px solid #ddd", width: `calc(100% - ${leftWidth}px)` }}>
                {/* Месяц и кнопки */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        height: "50px",
                        backgroundColor: "#f5f5f5",
                        borderBottom: "1px solid #ddd",
                        // borderTop: "1px solid #ddd",
                        borderRight: '1px solid #ddd',
                        padding: "0 10px",
                    }}
                >
                    <IconButton onClick={handlePreviousMonth} size="small">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", margin: "0 8px" }}>
                        {capitalizeFirstLetter(format(currentMonth, "LLLL yyyy", { locale: ru }))}
                    </Typography>
                    <IconButton onClick={handleNextMonth} size="small">
                        <ArrowForwardIcon />
                    </IconButton>
                </Box>

                {/* Дни месяца */}
                <Box sx={{ display: "flex", height: "30px" }}>
                    {daysInMonth.map((day, index) => {
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        const isCurrentDay = isToday(day);

                        let dateChoose = hoveredDayInMonth == format(day, "d", { locale: ru }) ? true : false;
                        return (
                            <Box
                                key={index}
                                sx={{
                                    width: `${dayWidth}px`,
                                    textAlign: "center",
                                    borderRight: "1px solid #ddd",
                                    padding: "2px 0",
                                    backgroundColor: dateChoose ? "#cce5ff" : isCurrentDay
                                        ? "#f3f292"
                                        : isWeekend
                                            ? weekendColor
                                            : "#fff",
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{ fontWeight: isCurrentDay ? "bold" : "normal" }}
                                >
                                    {format(day, "d", { locale: ru })}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box >
    );
});

export default Timeline;
