import React, { useState, useEffect } from 'react';
import Booking from '../Booking/Booking';
import classes from './HotelTable.module.css';
import dayjs from 'dayjs';

const HotelTable = ({ allRooms, data }) => {
    const [bookings, setBookings] = useState(data);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [highlightedDay, setHighlightedDay] = useState(null);
    const today = new Date();

    const [newBooking, setNewBooking] = useState({
        room: '',
        place: '',
        start: '',
        startTime: '',
        end: '',
        endTime: '',
        client: ''
    });

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
                <th key={i} className={`${isToday ? classes.currentDay : ''} ${isHighlighted ? classes.highlightedDay : ''}`}>
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

        bookings.forEach(booking => {
            if (booking.room === room && booking.place === place) {
                const startDate = new Date(booking.start);
                const endDate = new Date(booking.end);

                const isBookingInCurrentMonth = (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) ||
                    (endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear) ||
                    (startDate < new Date(currentYear, currentMonth + 1, 0) && endDate > new Date(currentYear, currentMonth, 1));

                if (isBookingInCurrentMonth) {
                    const startDay = startDate.getMonth() === currentMonth ? startDate.getDate() : 1;
                    const endDay = endDate.getMonth() === currentMonth ? endDate.getDate() : daysInMonth;

                    if (startDay <= daysInMonth && endDay >= 1) {
                        const colStart = Math.max(startDay, 1);
                        const colEnd = Math.min(endDay, daysInMonth);

                        const startTime = getTimeHours(booking.startTime);
                        const endTime = getTimeHours(booking.endTime);

                        const dayWidth = 100 / daysInMonth;
                        const startOffset = startDate.getMonth() === currentMonth ? (startTime / 24) * dayWidth : 0;
                        const endOffset = endDate.getMonth() === currentMonth ? ((24 - endTime) / 24) * dayWidth : 0;

                        const left = (colStart - 1) * dayWidth + startOffset;
                        const width = ((colEnd - colStart + 1) * dayWidth) - startOffset - endOffset;

                        bookingElements.push(
                            <div
                                key={booking.id}
                                className={`${classes.booking} ${endDate <= today && startDate <= today ? classes.booking_light : ''}`}
                                style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    top: `50%`,
                                    transform: `translateY(-50%)`,
                                    'border-top-left-radius': startDate.getMonth() === currentMonth ? '4px' : '0',
                                    'border-bottom-left-radius': startDate.getMonth() === currentMonth ? '4px' : '0',
                                    'border-top-right-radius': endDate.getMonth() === currentMonth ? '4px' : '0',
                                    'border-bottom-right-radius': endDate.getMonth() === currentMonth ? '4px' : '0',
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewBooking(prevState => ({ ...prevState, [name]: value }));
    };

    const handleAddBooking = () => {
        setBookings(prevBookings => [...prevBookings, { ...newBooking, id: bookings.length + 1 }]);
        setNewBooking({
            room: '',
            place: '',
            start: '',
            startTime: '',
            end: '',
            endTime: '',
            client: ''
        });
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