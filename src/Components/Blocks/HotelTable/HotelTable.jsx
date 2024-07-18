import React, { useState, useEffect } from 'react';
import Booking from '../Booking/Booking';
import classes from './HotelTable.module.css';

const HotelTable = () => {
    const [bookings, setBookings] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const today = new Date();

    useEffect(() => {
        const data = [
            { room: '№121', place: 1, start: '2024-07-01', end: '2024-07-09', client: 'fio' },
            { room: '№122', place: 1, start: '2024-07-03', end: '2024-07-10', client: 'fio' },
            { room: '№123', place: 1, start: '2024-07-06', end: '2024-07-18', client: 'fio' },
            { room: '№221', place: 1, start: '2024-07-10', end: '2024-07-19', client: 'fio' },
            { room: '№221', place: 2, start: '2024-07-10', end: '2024-07-19', client: 'fio' },
            { room: '№222', place: 2, start: '2024-07-12', end: '2024-07-17', client: 'fio' },
            { room: '№321', place: 1, start: '2024-06-28', end: '2024-07-10', client: 'fio' },
            { room: '№321', place: 2, start: '2024-06-28', end: '2024-07-08', client: 'fio' },
            { room: '№321', place: 3, start: '2024-06-28', end: '2024-07-08', client: 'fio' },
            { room: '№324', place: 1, start: '2024-07-10', end: '2024-07-24', client: 'fio' },
            { room: '№324', place: 2, start: '2024-07-18', end: '2024-07-24', client: 'fio' },
            { room: '№324', place: 3, start: '2024-07-18', end: '2024-07-22', client: 'fio' },
        ];
        setBookings(data);
    }, []);

    const allRooms = [
        { room: '№121', places: 1 },
        { room: '№122', places: 1 },
        { room: '№123', places: 1 },
        { room: '№124', places: 1 },
        { room: '№221', places: 2 },
        { room: '№222', places: 2 },
        { room: '№223', places: 2 },
        { room: '№321', places: 3 },
        { room: '№322', places: 3 },
        { room: '№323', places: 3 },
        { room: '№324', places: 3 },
    ];

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            days.push(<th key={i} className={isToday ? classes.currentDay : ''}>{i}</th>);
        }
        return days;
    };

    const renderBookings = (room, place) => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const cells = [];
        let i = 1;

        while (i <= daysInMonth) {
            const date = new Date(currentYear, currentMonth, i);

            const booking = bookings.find(
                (b) =>
                    b.room === room &&
                    b.place === place &&
                    new Date(b.start).setHours(0, 0, 0, 0) <= date &&
                    new Date(b.end).setHours(0, 0, 0, 0) >= date
            );

            const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

            if (booking) {
                const startDate = new Date(booking.start);
                const endDate = new Date(booking.end);

                const startDay = startDate.getMonth() === currentMonth ? startDate.getDate() : 1;
                const endDay = endDate.getMonth() === currentMonth ? endDate.getDate() : daysInMonth;

                if (startDay <= i && endDay >= i) {
                    const colSpan = endDay - i + 1;

                    cells.push(
                        <td key={i} colSpan={colSpan} className={`
                            ${endDate <= today.setHours(0, 0, 0, 0) &&
                                startDate <= today.setHours(0, 0, 0, 0)
                                ?
                                classes.booking_light
                                :
                                classes.booking
                            } 
                            ${isToday ? classes.currentDay : ''}
                        `}>
                            <Booking>с {booking.start} по {booking.end}</Booking>
                        </td>
                    );
                    i += colSpan;
                } else {
                    cells.push(<td key={i} className={isToday ? classes.currentDay : ''}></td>);
                    i++;
                }
            } else {
                cells.push(<td key={i} className={isToday ? classes.currentDay : ''}></td>);
                i++;
            }
        }
        return cells;
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

    // Grouping rooms by number of places
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
                        <tr><td></td></tr>
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
                                                <td style={{width: '181px'}}>Место {placeIndex + 1}</td>
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
