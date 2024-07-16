import React, { useState, useEffect } from 'react';
import Booking from '../Booking/Booking';
import classes from './HotelTable.module.css';

const HotelTable = () => {
    const [bookings, setBookings] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    useEffect(() => {
        // Загрузка данных о бронированиях (замените на реальный API запрос)
        const data = [
            { room: '№121', start: '2024-07-01', end: '2024-07-08', guest: 'Иванов И.И.' },
            { room: '№122', start: '2024-07-03', end: '2024-07-07', guest: 'Иванов И.И.' },
            { room: '№123', start: '2024-07-10', end: '2024-07-11', guest: 'Гочияев Р. Р.' },
            { room: '№123', start: '2024-06-01', end: '2024-06-11', guest: 'Гочияев Р. Р.' },
            { room: '№123', start: '2024-06-28', end: '2024-07-04', guest: 'Гочияев Р. Р.' },
        ];
        setBookings(data);
    }, []);

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    console.log(new Date('2024-07-01'))

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(<th key={i}>{i}</th>);
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

            if (booking && new Date(booking.start).getDate() <= i && new Date(booking.end).getDate() >= i) {
                const startDate = new Date(booking.start);
                const endDate = new Date(booking.end);
                const colSpan = (Math.min(endDate.getDate(), daysInMonth) - i + 1)

                cells.push(
                    <td key={i} colSpan={colSpan} className={classes.booking}>
                        <Booking>{booking.guest}</Booking>
                    </td>
                );
                i += colSpan;
            } else {
                cells.push(<td key={i}></td>);
                i++;
            }
        }
        return cells;
    };

    const rooms = ['№121', '№122', '№123', '№124'];

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
            <div className={classes.controls}>
                <button onClick={previousMonth}>←</button>
                <span>{monthNames[currentMonth]} {currentYear}</span>
                <button onClick={nextMonth}>→</button>
            </div>
            <div className={classes.table}>
                <table className={classes.hotelTable}>
                    <thead>
                        <tr>
                            <th>Номер комнаты</th>
                            {renderDays()}
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map((room) => (
                            <tr key={room}>
                                <td>{room}</td>
                                {renderBookings(room)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HotelTable;

{/* <div className={classes.table}> */ }