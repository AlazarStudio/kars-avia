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
            { room: '№121', type: 'Одноместные', start: '2024-07-01', end: '2024-07-09', guest: 'с 01.07.2024 по 09.07.2024' },
            { room: '№122', type: 'Одноместные', start: '2024-07-03', end: '2024-07-10', guest: 'с 03.07.2024 по 10.07.2024' },
            { room: '№123', type: 'Одноместные', start: '2024-07-06', end: '2024-07-18', guest: 'с 06.07.2024 по 18.07.2024' },
            { room: '№221', type: 'Двухместные', start: '2024-07-10', end: '2024-07-19', guest: 'с 10.07.2024 по 19.07.2024' },
            { room: '№222', type: 'Двухместные', start: '2024-07-12', end: '2024-07-17', guest: 'с 12.07.2024 по 18.07.2024' },
            { room: '№321', type: 'Трехместные', start: '2024-06-28', end: '2024-07-10', guest: 'с 28.06.2024 по 10.07.2024' },
        ];
        setBookings(data);
    }, []);

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

    const renderBookings = (room) => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const cells = [];
        let i = 1;

        while (i <= daysInMonth) {
            const date = new Date(currentYear, currentMonth, i);

            const booking = bookings.find(
                (b) =>
                    b.room === room &&
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
                            <Booking>{booking.guest}</Booking>
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

    const roomTypes = ['Одноместные', 'Двухместные', 'Трехместные'];

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
        <div>

            <div className={classes.table}>
                <table className={classes.hotelTable}>
                    <thead>
                        <tr>
                            <th>
                                <div className={classes.controls}>
                                    <div onClick={previousMonth}><img src="/arrow-left.png" alt="" /></div>
                                    <span>{monthNames[currentMonth]} {currentYear}</span>
                                    <div onClick={nextMonth}><img src="/arrow-right.png" alt="" /></div>
                                </div>
                            </th>
                            {renderDays()}
                        </tr>
                    </thead>
                    <tbody>
                        {roomTypes.map((type) => (
                            <React.Fragment key={type}>
                                <tr>
                                    <td colSpan={getDaysInMonth(currentMonth, currentYear) + 1} className={classes.roomType}><b>{type}</b></td>
                                </tr>
                                {bookings
                                    .filter((booking) => booking.type === type)
                                    .map((booking) => (
                                        <tr key={booking.room}>
                                            <td>{booking.room}</td>
                                            {renderBookings(booking.room)}
                                        </tr>
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
