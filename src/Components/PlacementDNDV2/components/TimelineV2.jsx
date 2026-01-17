import React, { memo, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import classes from "./TimelineV2.module.css";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  addMonths,
  isToday,
} from "date-fns";
import { ru } from "date-fns/locale";

const TimelineV2 = memo(
  ({
    user,
    handleCheckRoomsType,
    hoveredDayInMonth,
    currentMonth,
    setCurrentMonth,
    dayWidth,
    weekendColor,
    monthColor,
    leftWidth,
    setShowReserveInfo,
    setshowModalForAddHotelInReserve,
  }) => {
    const safeCurrentMonth =
      currentMonth instanceof Date ? currentMonth : new Date(currentMonth);

    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(safeCurrentMonth),
      end: endOfMonth(safeCurrentMonth),
    });

    const handlePreviousMonth = () => {
      setCurrentMonth((prev) => {
        const prevDate = prev instanceof Date ? prev : new Date(prev);
        return addMonths(prevDate, -1);
      });
    };

    const handleNextMonth = () => {
      setCurrentMonth((prev) => {
        const prevDate = prev instanceof Date ? prev : new Date(prev);
        return addMonths(prevDate, 1);
      });
    };

    const capitalizeFirstLetter = (string) =>
      string.charAt(0).toUpperCase() + string.slice(1);

    const [activeButton, setActiveButton] = useState(false);

    const handleCheckRoomsTypeInfo = (info) => {
      setActiveButton(info);
      handleCheckRoomsType(info);
    };

    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          position: "sticky",
          top: 0,
          zIndex: 3,
        }}
      >
        <Box
          sx={{
            width: `${leftWidth}px`,
            borderRadius: "10px 0px 0px 0px",
            borderTop: "1px solid #ddd",
            borderLeft: "1px solid #ddd",
            borderRight: "1px solid #ddd",
            borderBottom: "1px solid #ddd",
            boxShadow: "0px 8px 10px -5px #00000030",
            backgroundColor: "#fff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
            padding: "10px",
          }}
        >
          <button
            className={`${classes.checkBTN} ${
              !activeButton ? classes.activeButton : ""
            }`}
            onClick={() => {
              handleCheckRoomsTypeInfo(false);
              setShowReserveInfo(false);
              setshowModalForAddHotelInReserve(false);
            }}
          >
            Квота
          </button>
          <button
            className={`${classes.checkBTN} ${
              activeButton ? classes.activeButton : ""
            }`}
            onClick={() => {
              handleCheckRoomsTypeInfo(true);
              setShowReserveInfo(false);
              setshowModalForAddHotelInReserve(false);
            }}
          >
            Резерв
          </button>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            borderBottom: "1px solid #ddd",
            width: `calc(100% - 228px)`,
            boxShadow: "0px 8px 10px -5px #00000030",
          }}
        >
          <Box
            sx={{
              borderRadius: "0px 10px 0px 0px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "50px",
              backgroundColor: "#fff",
              borderBottom: "1px solid #ddd",
              borderTop: "1px solid #ddd",
              borderRight: "1px solid #ddd",
              padding: "0 10px",
            }}
          >
            <IconButton onClick={handlePreviousMonth} size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: "bold", margin: "0 8px" }}
            >
              {capitalizeFirstLetter(
                format(safeCurrentMonth, "LLLL yyyy", { locale: ru })
              )}
            </Typography>
            <IconButton onClick={handleNextMonth} size="small">
              <ArrowForwardIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", height: "30px" }}>
            {daysInMonth.map((day, index) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isCurrentDay = isToday(day);

              const dateChoose =
                hoveredDayInMonth == format(day, "d", { locale: ru });

              return (
                <Box
                  key={index}
                  sx={{
                    width: `${dayWidth}px`,
                    textAlign: "center",
                    borderRight: "1px solid #ddd",
                    padding: "2px 0",
                    backgroundColor: dateChoose
                      ? "#cce5ff"
                      : isCurrentDay
                      ? "#f3f292"
                      : isWeekend
                      ? weekendColor
                      : "#fff",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isCurrentDay ? "bold" : "normal",
                      letterSpacing: 0,
                    }}
                  >
                    {format(day, "d", { locale: ru })}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    );
  }
);

export default TimelineV2;
