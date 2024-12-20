import React, { useReducer, useEffect, useState, useRef } from 'react';
import Booking from '../Booking/Booking';
import classes from './HotelTablePageComponent.module.css';
import Button from '../../Standart/Button/Button';
import BronInfo from '../BronInfo/BronInfo';
import { LinearProgress, Box, Typography, CircularProgress } from '@mui/material';
import { convertToDate } from '../../../../graphQL_requests';

const initialState = (data, dataObject) => ({
    bookings: data || [],
    newBookings: dataObject || [],
    currentBookingIndex: 0,
    countBooking: dataObject.length || 0,
    totalBookings: dataObject.length || 0,
    conflict: false,
});

const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_BOOKINGS':
            return { ...state, bookings: action.payload };
        case 'SET_SELECTED_BOOKING':
            return {
                ...state,
                selectedBooking: action.payload
            };
        case 'UPDATE_NEW_BOOKING':
            const updatedBookings = state.newBookings.map((booking, index) =>
                index === action.index ? { ...booking, [action.name]: action.value } : booking
            );
            const conflict = checkBookingConflict(updatedBookings[state.currentBookingIndex], state.bookings);
            return {
                ...state,
                newBookings: updatedBookings,
                conflict,
            };
        case 'RESET_NEW_BOOKINGS':
            return {
                ...state,
                newBookings: state.newBookings.map(() => ({
                    room: '',
                    place: '',
                    start: '',
                    end: '',
                    client: '',
                    public: false,
                })),
                conflict: false,
                currentBookingIndex: 0,
                countBooking: dataObject.length || 0,
                totalBookings: dataObject.length || 0
            };
        case 'ADD_BOOKING':
            return {
                ...state,
                bookings: [
                    ...state.bookings,
                    { ...state.newBookings[state.currentBookingIndex], id: state.bookings.length + 1, public: true },
                ],
                newBookings: state.newBookings.map(() => ({
                    room: '',
                    place: '',
                    start: '',
                    end: '',
                    client: '',
                    public: false,
                })),
                currentBookingIndex: state.currentBookingIndex,
                conflict: false,
                countBooking: state.countBooking - 1,
            };
        default:
            return state;
    }
};

const checkBookingConflict = (newBooking, existingBookings) => {
    const newStart = new Date(newBooking.start);
    const newEnd = new Date(newBooking.end);

    for (const booking of existingBookings) {
        if (booking.room === newBooking.room && booking.place == newBooking.place) {
            const existingStart = new Date(booking.start);
            const existingEnd = new Date(booking.end);

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

const HotelTablePageComponent = ({ allRooms, data, idHotel, dataObject, id, showAddBronForm, maxHeight }) => {
    const [state, dispatch] = useReducer(reducer, initialState(data, dataObject));
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [highlightedDay, setHighlightedDay] = useState(null);
    const today = new Date();
    const currentDayRef = useRef(null);
    const tableContainerRef = useRef(null);
    const [loading, setLoading] = useState(false); // State for loading

    useEffect(() => {
        if (dataObject) {
            const newBookings = dataObject.map(item => ({
                room: item.room,
                place: item.place,
                start: item.start,
                end: item.end,
                client: item.client,
                public: item.public,
            }));
            dispatch({ type: 'SET_BOOKINGS', payload: [...state.bookings, ...newBookings] });
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

        const renderBooking = (booking, isNew = false) => {
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

                        let getStartTime = convertToDate(booking.start, true)
                        let getEndTime = convertToDate(booking.end, true)

                        const startTime = getTimeHours(getStartTime);
                        const endTime = getTimeHours(getEndTime);

                        const dayWidth = 100 / daysInMonth;
                        const startOffset = startDate.getMonth() === currentMonth ? (startTime / 24) * dayWidth : 0;
                        const endOffset = endDate.getMonth() === currentMonth ? ((24 - endTime) / 24) * dayWidth : 0;

                        const left = (colStart - 1) * dayWidth + startOffset;
                        const width = ((colEnd - colStart + 1) * dayWidth) - startOffset - endOffset;

                        bookingElements.push(
                            <div
                                key={isNew ? `new-${booking.client.name}-${colStart}` : booking.id}
                                className={`${classes.booking} ${endDate <= today && startDate <= today ? classes.booking_light : ''} ${state.conflict && isNew ? classes.booking_conflict : ''}`}
                                style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    top: `50%`,
                                    transform: `translateY(-50%)`,
                                    backgroundColor: state.conflict && isNew ? 'red' : (booking.public ? '#9FD923' : 'grey'),
                                    opacity: !booking.public ? 1 : null,
                                    borderTopLeftRadius: startDate.getMonth() === currentMonth ? '4px' : '0',
                                    borderBottomLeftRadius: startDate.getMonth() === currentMonth ? '4px' : '0',
                                    borderTopRightRadius: endDate.getMonth() === currentMonth ? '4px' : '0',
                                    borderBottomRightRadius: endDate.getMonth() === currentMonth ? '4px' : '0',
                                }}
                                onClick={() => toggleCreateSidebar(booking)}
                            >
                                <Booking>{booking.client.name}</Booking>
                            </div>
                        );
                    }
                }
            }
        };

        state.bookings.forEach(booking => renderBooking(booking));
        if (state.newBookings[state.currentBookingIndex]) {
            renderBooking(state.newBookings[state.currentBookingIndex], true);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const index = state.currentBookingIndex;

        if (name === 'start' || name === 'end') {
            const inputDate = new Date(value);

            if (inputDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) {
                alert('Дата не может быть раньше сегодняшнего дня.');
                return;
            }

            if (name === 'end' && state.newBookings[index].start && inputDate < new Date(state.newBookings[index].start)) {
                alert('Дата окончания не может быть раньше даты начала.');
                return;
            }

            if (name === 'start' && state.newBookings[index].end && inputDate > new Date(state.newBookings[index].end)) {
                alert('Дата начала не может быть позже даты окончания.');
                return;
            }
        }

        dispatch({ type: 'UPDATE_NEW_BOOKING', name, value, index });
    };

    const handleAddBooking = () => {
        const booking = state.newBookings[state.currentBookingIndex];

        if (!booking.room || !booking.place || !booking.start || !booking.startTime || !booking.end || !booking.endTime || !booking.client) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }


        const startDate = new Date(booking.start);
        const endDate = new Date(booking.end);
        const startTime = getTimeHours(booking.startTime);
        const endTime = getTimeHours(booking.endTime);

        if (endDate < startDate || (endDate.getTime() === startDate.getTime() && endTime <= startTime)) {
            alert('Время окончания должно быть позже времени начала.');
            return;
        }

        if (state.conflict) {
            return;
        }

        let secundos = Math.round(Math.random() * 500) + 500;

        setLoading(true);

        setTimeout(() => {
            dispatch({ type: 'ADD_BOOKING' });
            setLoading(false);
        }, secundos);
    };

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

    const groupedRooms = allRooms && allRooms.reduce((acc, room) => {
        const key = room.places;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(room);
        return acc;
    }, {});

    const [showCreateSidebar, setShowCreateSidebar] = useState(false);

    const toggleCreateSidebar = (booking) => {
        dispatch({ type: 'SET_SELECTED_BOOKING', payload: booking });
        setShowCreateSidebar(!showCreateSidebar);
    };

    const currentBooking = state.newBookings[state.currentBookingIndex];

    return (
        <div className={classes.tableData}>
            <div className={classes.tableContainer} ref={tableContainerRef} style={{ "max-height": maxHeight }}>
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
                        {Object.keys(groupedRooms).map((places) => (
                            <React.Fragment key={places}>
                                <tr>
                                    <td className={`${classes.roomType} ${classes.stickyColumn}`}>
                                        <div className={classes.roomTypeBlock}><b>{places} - МЕСТНЫЕ</b></div>
                                    </td>
                                    <td colSpan={getDaysInMonth(currentMonth, currentYear)} className={`${classes.roomType}`}></td>
                                </tr>
                                {groupedRooms[places].map(({ room }) => (
                                    <React.Fragment key={room}>
                                        <tr>
                                            <td className={`${classes.roomType} ${classes.stickyColumn}`}><div className={classes.roomTypeBlock}><b>{room}</b></div></td>
                                            <td colSpan={getDaysInMonth(currentMonth, currentYear)} className={`${classes.roomType}`}></td>
                                        </tr>
                                        {[...Array(Number(places))].map((_, placeIndex) => (
                                            <tr key={`${room}-${placeIndex}`}>
                                                <td className={`${classes.stickyColumn}`} style={{ width: '181px' }}><div className={classes.roomTypeBlock}>Место {placeIndex + 1}</div></td>
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
            {showAddBronForm && currentBooking ? (
                <div className={classes.formContainer}>
                    <div className={classes.formContainer_title}>
                        Ввод данных о клиенте
                    </div>

                    {loading ? (
                        <div className={classes.loader}>
                            <CircularProgress />
                        </div>
                    ) :
                        <div className={classes.formContainer_items}>
                            <div className={classes.formContainer_items_item}>
                                <div className={classes.formContainer_items_item_data}>
                                    <div className={classes.formContainer_items_item_data_name}>Клиент</div>
                                    <div className={classes.formContainer_items_item_data_info}>
                                        <input
                                            type="text"
                                            name="client"
                                            value={currentBooking.client}
                                            onChange={handleInputChange}
                                            placeholder="Введите имя клиента"
                                        />
                                    </div>
                                </div>
                                <div className={classes.formContainer_items_item_data}>
                                    <div className={classes.formContainer_items_item_data_name}>Прибытие</div>
                                    <div className={classes.formContainer_items_item_data_info}>
                                        <input
                                            type="date"
                                            name="start"
                                            value={currentBooking.start}
                                            onChange={handleInputChange}
                                        />
                                        <input
                                            type="time"
                                            name="startTime"
                                            value={currentBooking.startTime}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className={classes.formContainer_items_item_data}>
                                    <div className={classes.formContainer_items_item_data_name}>Отъезд</div>
                                    <div className={classes.formContainer_items_item_data_info}>
                                        <input
                                            type="date"
                                            name="end"
                                            value={currentBooking.end}
                                            onChange={handleInputChange}
                                        />
                                        <input
                                            type="time"
                                            name="endTime"
                                            value={currentBooking.endTime}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className={classes.formContainer_items_item_data}>
                                    <div className={classes.formContainer_items_item_data_name}>Комната</div>
                                    <div className={classes.formContainer_items_item_data_info}>
                                        <select name="room" value={currentBooking.room} onChange={handleInputChange}>
                                            <option value="">Выберите комнату</option>
                                            {allRooms.map((room, index) => (
                                                <option key={index} value={room.room}>{room.room}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={classes.formContainer_items_item_data}>
                                    <div className={classes.formContainer_items_item_data_name}>Выберите место</div>
                                    <div className={classes.formContainer_items_item_data_info}>
                                        <select name="place" value={currentBooking.place} onChange={handleInputChange}>
                                            <option value="">Выберите место</option>
                                            {currentBooking.room && Array.from({ length: allRooms.find(room => room.room === currentBooking.room).places }, (_, i) => (
                                                <option key={i} value={i + 1}>{i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={classes.formContainer_items_item_data_buttons}>
                                    <button onClick={handleAddBooking}>Забронировать</button>
                                </div>

                                {state.conflict && <div className={classes.conflictBlock}>В это время эта комната уже забронирована. <br /> Пожалуйста, выберите другую комнату или время.</div>}
                            </div>
                        </div>
                    }
                </div>
            ) : null}
            <BronInfo show={showCreateSidebar} onClose={toggleCreateSidebar} data={state.selectedBooking} />
        </div >
    );
};

export default HotelTablePageComponent;
