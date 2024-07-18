import React, { useState, useEffect } from 'react';
import Booking from '../Booking/Booking';
import classes from './HotelTable.module.css';
import dayjs from 'dayjs';

const HotelTable = ({ allRooms, data }) => {
    const [bookings, setBookings] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const today = new Date();

    useEffect(() => {
        setBookings(data);
    }, [data]);

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            days.push(
                <th key={i} className={isToday ? classes.currentDay : ''}>
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

    const renderBookings = (room, place) => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const cells = [];
        const bookingElements = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            cells.push(<td key={i} className={isToday ? classes.currentDay : ''}></td>);
        }

        bookings.forEach(booking => {
            if (booking.room === room && booking.place === place) {
                const startDate = new Date(booking.start);
                const endDate = new Date(booking.end);

                // Проверяем, пересекаются ли даты бронирования с текущим месяцем
                const isBookingInCurrentMonth = (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) ||
                    (endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear) ||
                    (startDate < new Date(currentYear, currentMonth + 1, 0) && endDate > new Date(currentYear, currentMonth, 1));

                if (isBookingInCurrentMonth) {
                    const startDay = startDate.getMonth() === currentMonth ? startDate.getDate() : 1;
                    const endDay = endDate.getMonth() === currentMonth ? endDate.getDate() : daysInMonth;

                    if (startDay <= daysInMonth && endDay >= 1) {
                        const colStart = Math.max(startDay, 1);
                        const colEnd = Math.min(endDay, daysInMonth);

                        let startTime = getTimeHours(booking.startTime) <= 20 ? getTimeHours(booking.startTime) : 20.5
                        let endTime = getTimeHours(booking.endTime) <= 23 ? getTimeHours(booking.endTime) : 24

                        let koefStart = 0;
                        let koefEnd = 0;

                        let koef = 0.16;

                        if (startDate.getMonth() === currentMonth) {
                            koefStart = koef
                        }
                        
                        if (endDate.getMonth() === currentMonth) {
                            koefEnd = koef
                        }

                        const left = (((colStart - 1) / daysInMonth) * 100) + (startTime * koefStart);
                        const width = (((colEnd - colStart) / daysInMonth) * 100) - (startTime * koefStart) + (endTime * koefEnd);

                        bookingElements.push(
                            <div
                                key={booking.id}
                                className={`${classes.booking} ${endDate <= today && startDate <= today ? classes.booking_light : ''}`}
                                style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    top: `50%`,
                                    transform: `translateY(-50%)`
                                }}
                            >
                                <Booking>{booking.client}</Booking>
                            </div>
                        );
                    }
                }
            }
        });

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

    const groupedRooms = allRooms.reduce((acc, room) => {
        const key = room.places;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(room);
        return acc;
    }, {});

    return (
        <div>
            <div className={classes.tableContainer}>
                <table className={classes.hotelTable}>
                    <thead className={classes.stickyHeader}>
                        <tr>
                            <th>
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
                        {Object.keys(groupedRooms).map((places) => (
                            <React.Fragment key={places}>
                                <tr>
                                    <td colSpan={getDaysInMonth(currentMonth, currentYear) + 1} className={classes.roomType}>
                                        <b>{places} - МЕСТНЫЕ КОМНАТЫ</b>
                                    </td>
                                </tr>
                                {groupedRooms[places].map(({ room }) => (
                                    <React.Fragment key={room}>
                                        <tr>
                                            <td colSpan={getDaysInMonth(currentMonth, currentYear) + 1} className={classes.roomType}><b>{room}</b></td>
                                        </tr>
                                        {[...Array(Number(places))].map((_, placeIndex) => (
                                            <tr key={`${room}-${placeIndex}`}>
                                                <td style={{ width: '181px' }}>Место {placeIndex + 1}</td>
                                                {renderBookings(room, placeIndex + 1)}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HotelTable;
