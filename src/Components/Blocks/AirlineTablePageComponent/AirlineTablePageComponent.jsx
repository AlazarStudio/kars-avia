import React, { useReducer, useEffect, useState, useRef } from 'react';
import classes from './AirlineTablePageComponent.module.css';
import { CircularProgress } from '@mui/material';

const initialState = (data, dataInfo) => ({
    bookings: data || [],
    flightInfo: dataInfo || [],
});

const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_BOOKINGS':
            return { ...state, bookings: action.payload };
        case 'SET_FLIGHT_INFO':
            return { ...state, flightInfo: action.payload };
        default:
            return state;
    }
};

const AirlineTablePageComponent = ({ dataObject, dataInfo, maxHeight, toggleCategoryUpdate, setSelectedStaff }) => {
    const [state, dispatch] = useReducer(reducer, initialState(dataObject, dataInfo));
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [highlightedDay, setHighlightedDay] = useState(null);
    const today = new Date();
    const currentDayRef = useRef(null);
    const tableContainerRef = useRef(null);

    useEffect(() => {
        if (dataObject) {
            const newBookings = dataObject.map(item => ({
                id: item.id,
                name: item.name,
                gender: item.gender,
                number: item.number,
                position: item.position,
            }));
            dispatch({ type: 'SET_BOOKINGS', payload: newBookings });
        }
    }, [dataObject]);

    useEffect(() => {
        if (tableContainerRef.current && currentDayRef.current) {
            tableContainerRef.current.scrollLeft = currentDayRef.current.offsetLeft;
        }
    }, [currentMonth, currentYear]);

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isHighlighted = i === highlightedDay;
            days.push(
                <th
                    key={i}
                    className={`${isToday ? classes.currentDay : ''} ${isHighlighted ? classes.highlightedDay : ''}`}
                    ref={isToday ? currentDayRef : null}
                >
                    <div className={classes.topDayBlock}>{i <= 9 ? '0' + i : i}</div>
                </th>
            );
        }
        return days;
    };

    const getTimeHours = (timeString) => {
        const [hours] = timeString.split(':');
        return parseInt(hours, 10);
    };

    const renderBookings = (staffMember) => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const cells = [];
        const bookingElements = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isHighlighted = i === highlightedDay;
            cells.push(
                <td
                    key={i}
                    className={`${isToday ? classes.currentDay : ''} ${isHighlighted ? classes.highlightedDay : ''}`}
                    onMouseEnter={() => setHighlightedDay(i)}
                    onMouseLeave={() => setHighlightedDay(null)}
                ></td>
            );
        }

        // Найти информацию о полетах для этого сотрудника по id
        const staffFlightInfo = state.flightInfo.find(info => info.clientID === staffMember.id);
        if (staffFlightInfo) {
            const { start, end, startTime, endTime } = staffFlightInfo;
            const startDate = new Date(start);
            const endDate = new Date(end);

            const isFlightInCurrentMonth =
                (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) ||
                (endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear) ||
                (startDate < new Date(currentYear, currentMonth + 1, 0) && endDate > new Date(currentYear, currentMonth, 1));

            if (isFlightInCurrentMonth) {
                const startDay = startDate.getMonth() === currentMonth ? startDate.getDate() : 1;
                const endDay = endDate.getMonth() === currentMonth ? endDate.getDate() : daysInMonth;

                if (startDay <= daysInMonth && endDay >= 1) {
                    const colStart = Math.max(startDay, 1);
                    const colEnd = Math.min(endDay, daysInMonth);

                    const startFlightTime = getTimeHours(startTime);
                    const endFlightTime = getTimeHours(endTime);

                    const dayWidth = 100 / daysInMonth;
                    const startOffset = startDate.getMonth() === currentMonth ? (startFlightTime / 24) * dayWidth : 0;
                    const endOffset = endDate.getMonth() === currentMonth ? ((24 - endFlightTime) / 24) * dayWidth : 0;

                    const left = (colStart - 1) * dayWidth + startOffset;
                    const width = ((colEnd - colStart + 1) * dayWidth) - startOffset - endOffset;

                    bookingElements.push(
                        <div
                            key={staffFlightInfo.clientID}
                            className={`${classes.booking} ${endDate <= today && startDate <= today ? classes.booking_light : ''}`}
                            style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                top: `50%`,
                                transform: `translateY(-50%)`,
                                backgroundColor: '#9FD923',
                                borderTopLeftRadius: startDate.getMonth() === currentMonth ? '4px' : '0',
                                borderBottomLeftRadius: startDate.getMonth() === currentMonth ? '4px' : '0',
                                borderTopRightRadius: endDate.getMonth() === currentMonth ? '4px' : '0',
                                borderBottomRightRadius: endDate.getMonth() === currentMonth ? '4px' : '0',
                            }}
                        >
                            {`Полёт с ${startDate.toLocaleDateString()} по ${endDate.toLocaleDateString()}`}
                        </div>
                    );
                }
            }
        }

        return (
            <td colSpan={daysInMonth} className={classes.bookingCell}>
                {cells}
                {bookingElements}
            </td>
        );
    };

    const previousMonth = () => {
        setCurrentMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1));
        if (currentMonth === 0) {
            setCurrentYear((prevYear) => prevYear - 1);
        }
    };

    const nextMonth = () => {
        setCurrentMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1));
        if (currentMonth === 11) {
            setCurrentYear((prevYear) => prevYear + 1);
        }
    };

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

    return (
        <div className={classes.tableData}>
            <div className={classes.tableContainer} ref={tableContainerRef} style={{ "maxHeight": maxHeight }}>
                <table className={classes.hotelTable}>
                    <thead className={classes.stickyHeader}>
                        <tr>
                            <th className={classes.stickyColumn}>
                                <div className={classes.controls}>
                                    <div onClick={previousMonth}><img src="/arrow-left.png" alt="previous month" /></div>
                                    <span>{monthNames[currentMonth]} {currentYear}</span>
                                    <div onClick={nextMonth}><img src="/arrow-right.png" alt="next month" /></div>
                                </div>
                            </th>
                            {renderDays()}
                        </tr>
                    </thead>
                    <tbody>
                        {state.bookings.map((staffMember) => (
                            <tr key={staffMember.id}>
                                <td className={`${classes.stickyColumn}`}>
                                    <div className={classes.staffInfo} onClick={() => {
                                        toggleCategoryUpdate()
                                        setSelectedStaff(staffMember)
                                        
                                    }}>
                                        <b>{staffMember.name}</b> - {staffMember.position}
                                    </div>
                                </td>
                                {renderBookings(staffMember)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default AirlineTablePageComponent;