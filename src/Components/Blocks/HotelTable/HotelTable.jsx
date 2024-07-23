import React, { useReducer, useEffect, useState } from 'react';
import Booking from '../Booking/Booking';
import classes from './HotelTable.module.css';
import BronInfo from '../BronInfo/BronInfo';
import { Link } from 'react-router-dom';

const initialState = {
    bookings: [],
    newBooking: {
        room: '',
        place: '',
        start: '2024-07-23',
        startTime: '14:00',
        end: '2024-07-27',
        endTime: '10:00',
        client: 'Джатдоев А. С-А.',
        public: false,
    },
    conflict: false,
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_BOOKINGS':
            return { ...state, bookings: action.payload };
        case 'UPDATE_NEW_BOOKING':
            const updatedBooking = { ...state.newBooking, [action.name]: action.value };
            return {
                ...state,
                newBooking: updatedBooking,
                conflict: checkBookingConflict(updatedBooking, state.bookings),
            };
        case 'RESET_NEW_BOOKING':
            return {
                ...state,
                newBooking: {
                    room: '',
                    place: '',
                    start: '',
                    startTime: '',
                    end: '',
                    endTime: '',
                    client: '',
                    public: false,
                },
                conflict: false,
            };
        case 'ADD_BOOKING':
            return {
                ...state,
                bookings: [...state.bookings, { ...state.newBooking, id: state.bookings.length + 1, public: true }],
            };
        default:
            return state;
    }
};

const checkBookingConflict = (newBooking, existingBookings) => {
    const newStart = new Date(newBooking.start + 'T' + newBooking.startTime);
    const newEnd = new Date(newBooking.end + 'T' + newBooking.endTime);

    for (const booking of existingBookings) {
        if (booking.room === newBooking.room && booking.place == newBooking.place) {
            const existingStart = new Date(booking.start + 'T' + booking.startTime);
            const existingEnd = new Date(booking.end + 'T' + booking.endTime);

            if (
                (newStart >= existingStart && newStart < existingEnd) ||
                (newEnd > existingStart && newEnd <= existingEnd) ||
                (newStart <= existingStart && newEnd >= existingEnd)
            ) {
                return true;
            }
        }
    }

    return false;
};

const HotelTable = ({ allRooms, data, idHotel }) => {
    const [state, dispatch] = useReducer(reducer, { ...initialState, bookings: data });
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [highlightedDay, setHighlightedDay] = useState(null);
    const today = new Date();

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

        const previewBooking = {
            ...state.newBooking,
            id: 'preview',
        };

        const renderBooking = (booking) => {
            if (booking.room === room && booking.place == place) {
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
                                className={`${classes.booking} ${endDate <= today && startDate <= today ? classes.booking_light : ''} ${state.conflict && booking.id === 'preview' ? classes.booking_conflict : ''}`}
                                style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    top: `50%`,
                                    transform: `translateY(-50%)`,
                                    backgroundColor: state.conflict && booking.id === 'preview' ? 'red' : (booking.public ? '#9FD923' : 'grey'),
                                    opacity: !booking.public ? 1 : null,
                                    borderTopLeftRadius: startDate.getMonth() === currentMonth ? '4px' : '0',
                                    borderBottomLeftRadius: startDate.getMonth() === currentMonth ? '4px' : '0',
                                    borderTopRightRadius: endDate.getMonth() === currentMonth ? '4px' : '0',
                                    borderBottomRightRadius: endDate.getMonth() === currentMonth ? '4px' : '0',
                                }}
                                onClick={toggleCreateSidebar}
                            >
                                <Booking>{booking.client}</Booking>
                            </div>
                        );
                    }
                }
            }
        };

        state.bookings.forEach(renderBooking);
        renderBooking(previewBooking);

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

        if (name === 'start' || name === 'end') {
            const inputDate = new Date(value);

            if (inputDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) {
                alert('Дата не может быть раньше сегодняшнего дня.');
                return;
            }

            if (name === 'end' && state.newBooking.start && inputDate < new Date(state.newBooking.start)) {
                alert('Дата окончания не может быть раньше даты начала.');
                return;
            }

            if (name === 'start' && state.newBooking.end && inputDate > new Date(state.newBooking.end)) {
                alert('Дата начала не может быть позже даты окончания.');
                return;
            }
        }

        dispatch({ type: 'UPDATE_NEW_BOOKING', name, value });
    };

    const handleAddBooking = () => {
        if (!state.newBooking.room || !state.newBooking.place || !state.newBooking.start || !state.newBooking.startTime || !state.newBooking.end || !state.newBooking.endTime || !state.newBooking.client) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }

        const startDate = new Date(state.newBooking.start);
        const endDate = new Date(state.newBooking.end);
        const startTime = getTimeHours(state.newBooking.startTime);
        const endTime = getTimeHours(state.newBooking.endTime);

        if (endDate < startDate || (endDate.getTime() === startDate.getTime() && endTime <= startTime)) {
            alert('Время окончания должно быть позже времени начала.');
            return;
        }

        if (state.conflict) {
            return;
        }

        dispatch({ type: 'ADD_BOOKING' });
        dispatch({ type: 'RESET_NEW_BOOKING' });
        setIsBron(true)
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

    const [showCreateSidebar, setShowCreateSidebar] = useState(false);

    const toggleCreateSidebar = () => {
        setShowCreateSidebar(!showCreateSidebar);
    };

    const [isBron, setIsBron] = useState(false);

    console.log(state);
    return (
        <>
            <div className={classes.tableData}>
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
                {!isBron ?
                    <div className={classes.formContainer}>
                        <select name="room" value={state.newBooking.room} onChange={handleInputChange}>
                            <option value="">Выберите комнату</option>
                            {allRooms.map((room, index) => (
                                <option key={index} value={room.room}>{room.room}</option>
                            ))}
                        </select>
                        <select name="place" value={state.newBooking.place} onChange={handleInputChange}>
                            <option value="">Выберите место</option>
                            {state.newBooking.room && Array.from({ length: allRooms.find(room => room.room === state.newBooking.room).places }, (_, i) => (
                                <option key={i} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                        <input disabled type="date" name="start" placeholder="Дата начала" value={state.newBooking.start} onChange={handleInputChange} />
                        <input disabled type="time" name="startTime" placeholder="Время начала" value={state.newBooking.startTime} onChange={handleInputChange} />
                        <input disabled type="date" name="end" placeholder="Дата окончания" value={state.newBooking.end} onChange={handleInputChange} />
                        <input disabled type="time" name="endTime" placeholder="Время окончания" value={state.newBooking.endTime} onChange={handleInputChange} />
                        <input disabled type="text" name="client" placeholder="Клиент" value={state.newBooking.client} onChange={handleInputChange} />

                        <br />
                        <button onClick={handleAddBooking}>Добавить бронирование</button>
                        <button className={classes.anotherHotel}>Выбрать другой отель</button>

                        {
                            state.conflict &&<div className={classes.conflictBlock}>В это время эта комната уже забронирована. <br /> Пожалуйста, выберите другую комнату или время.</div>
                        }
                    </div>
                    : 
                    <div className={classes.formContainer}>
                        <div className={classes.successBron}>Бронирование прошло успешно </div>

                        <Link to={'/'}>Вернуться назад</Link>
                    </div>
                }
            </div>

            <BronInfo show={showCreateSidebar} onClose={toggleCreateSidebar} />
        </>
    );
};

export default HotelTable;
