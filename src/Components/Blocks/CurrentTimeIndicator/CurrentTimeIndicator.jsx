import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { differenceInDays, startOfYear } from "date-fns";

function CurrentTimeIndicator({ year = new Date().getFullYear() }) {
    const [currentDayPosition, setCurrentDayPosition] = useState(0);

    useEffect(() => {
        const today = new Date();
        const startOfYearDate = startOfYear(new Date(year, 0, 1));
        const dayWidth = 30; // Ширина одной ячейки дня
        const daysSinceStartOfYear = differenceInDays(today, startOfYearDate);
        const position = daysSinceStartOfYear * dayWidth;
        setCurrentDayPosition(position);
    }, [year]);

    return (
        <Box
            sx={{
                position: "absolute",
                top: '30px', // Опускаем линию ниже, чтобы не пересекать строку месяца
                left: `${currentDayPosition}px`,
                width: "2px",
                height: "25px", // Высота только строки дней
                backgroundColor: "red",
                zIndex: 1,
            }}
        />
    );
}

export default CurrentTimeIndicator;
