import React, { useReducer, useEffect, useState, useRef } from 'react';
import classes from './AirlineTablePageComponent.module.css';
import { CircularProgress } from '@mui/material';
import { CANCEL_REQUEST, convertToDate, getCookie } from '../../../../graphQL_requests';
import ExistRequest from '../ExistRequest/ExistRequest';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';

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

const AirlineTablePageComponent = ({ dataObject, dataInfo, maxHeight, userHeight, toggleCategoryUpdate, setSelectedStaff, user }) => {
    const token = getCookie('token');
    const [state, dispatch] = useReducer(reducer, initialState(dataObject, dataInfo));
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [highlightedDay, setHighlightedDay] = useState(null);
    const [highlightedStaffId, setHighlightedStaffId] = useState(null);
    const today = new Date();
    const currentDayRef = useRef(null);
    const tableContainerRef = useRef(null);

    // console.log(state);

    const [chooseRequestID, setChooseRequestID] = useState(null);
    const [showERequestSidebar, setShowERequestSidebar] = useState(false);
    const navigate = useNavigate();

    const handleBookingClick = (info) => {
        // console.log(info);
        setChooseRequestID(info.requestId); // Устанавливаем requestId в состояние
        setShowERequestSidebar(true); // Открываем ExistRequest
    };
    

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

    useEffect(() => {
        dispatch({ type: 'SET_FLIGHT_INFO', payload: dataInfo });
    }, [dataInfo]);
    

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

        let staffFlightInfo = state.flightInfo.filter(info => info.clientID === staffMember.id);

        staffFlightInfo = staffFlightInfo.sort((a, b) => {
            const durationA = new Date(a.end) - new Date(a.start);
            const durationB = new Date(b.end) - new Date(b.start);
            return durationA - durationB;
        });

        // console.log(staffFlightInfo);
        

        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isHighlighted = i === highlightedDay;
            cells.push(
                <td
                    key={i}
                    style={{ height: `${staffFlightInfo.length ? `${staffFlightInfo.length * (35 + staffFlightInfo.length - 1) + 10}px` : '45px'}` }}
                    className={`${isToday ? classes.currentDay : ''} ${isHighlighted ? classes.highlightedDay : ''} ${staffMember.id === highlightedStaffId ? classes.highlightedRow : ''}`}
                    onMouseEnter={() => {
                        setHighlightedDay(i);
                        setHighlightedStaffId(staffMember.id);
                      }}
                      onMouseLeave={() => {
                        setHighlightedDay(null);
                        setHighlightedStaffId(null);
                      }}
                ></td>
            );
        }

        staffFlightInfo.forEach((info, index) => {
            const { start, end, startTime, endTime, hotelName } = info;
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

                    const dayWidth = 100 / daysInMonth;

                    let getStartTime = convertToDate(start, true)
                    let getEndTime = convertToDate(end, true)

                    // const startTimeNew = getTimeHours(getStartTime);
                    // const endTimeNew = getTimeHours(getEndTime);

                    // const startTimeNew = new Date(start).getHours();
                    // const endTimeNew = new Date(end).getHours();

                    const startTimeNew = (new Date(start).getHours() - 3) % 24;
                    const endTimeNew = (new Date(end).getHours() - 3) % 24;

                    // console.log("startTimeNew", startTimeNew)
                    // console.log("endTimeNew", endTimeNew)

                    const startOffset = startDate.getMonth() === currentMonth ? (startTimeNew / 24) * dayWidth : 0;
                    const endOffset = endDate.getMonth() === currentMonth ? ((24 - endTimeNew) / 24) * dayWidth : 0;

                    // const startOffset = (startTimeNew / 24) * dayWidth;
                    // const endOffset = (endTimeNew / 24) * dayWidth;

                    // console.log("startOffset", startOffset)
                    // console.log("endOffset", endOffset)

                    const left = (colStart - 1) * dayWidth + startOffset;
                    const width = (colEnd - colStart + 1) * dayWidth - endOffset - startOffset;
                    // const width = (colEnd - colStart) * dayWidth - startOffset + endOffset;


                    function shortenString(str, maxLength) {
                        if (str.length > maxLength) {
                            return str.substring(0, maxLength) + '...';
                        } else {
                            return str;
                        }
                    }

                    // Получаем ширину контейнера в px
                    const containerWidth = tableContainerRef.current?.offsetWidth || 0;
                    // Переводим нашу процентную ширину в пиксели
                    const bookingWidthInPx = (width / 100) * containerWidth;

                    // Задаём порог, ниже которого не показываем название
                    const minBlockPx = 38;

                    // По умолчанию текст пустой
                    let displayName = "";
                    if (bookingWidthInPx >= minBlockPx) {
                    // Если блок хотя бы 38px, обрезаем/оставляем название
                    displayName = shortenString(
                        hotelName,
                        // Пример: если ширина >= 100px, берём maxLength=100, иначе 25
                        bookingWidthInPx >= 100 ? 100 : 25
                    );
                    } else {
                    // Иначе вообще не показываем текст
                    displayName = "...";
                    }

                    // let strName = shortenString(`В ${hotelName} с ${startDate.toLocaleDateString()} по ${endDate.toLocaleDateString()}`, width >= 25 ? 100 : 25)
                    let strName = shortenString(`${hotelName}`, width >= 25 ? 100 : 25)

                    bookingElements.push(
                        <div
                            key={`${info.clientID}-${index}`}
                            onClick={() => info.reserveId ?  window.open(`/reserve/reservePlacement/${info.reserveId}`, "_blank") : handleBookingClick(info)}
                            className={classes.booking}
                            style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                top: '5px',
                                transform: `translateY(${index * (staffFlightInfo.length + 35)}px)`,
                                zIndex: "1",
                                // zIndex: staffFlightInfo.length - index,
                                backgroundColor: '#9FD923',
                                borderRadius: '4px',
                            }}
                        >
                            {displayName}
                        </div>
                    );
                }
            }
        });

        return (
            <td colSpan={daysInMonth} className={classes.bookingCell} style={{ height: `${staffFlightInfo.length * 35 + 10}px ` }} >
                {cells}
                {bookingElements}
            </td >
        );
    };

    // Запрос на отмену созданной, но не размещенной заявки
        const [cancelRequestMutation] = useMutation(CANCEL_REQUEST, {
            context: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });
    
        const handleCancelRequest = async (id) => {
            try {
                // Отправка запроса с правильным ID заявки
                const response = await cancelRequestMutation({
                    variables: {
                        cancelRequestId: id,
                    },
                });
                // console.log("Заявка успешно отменена", response);
            } catch (error) {
                console.error("Ошибка при отмене заявки:", JSON.stringify(error));
            }
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
        <>
            <div className={classes.tableData}>
                <div className={classes.tableContainer} ref={tableContainerRef} style={{ "maxHeight": maxHeight, height: userHeight ? userHeight : "" }}>
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
                            {state.bookings.map((staffMember, index) => (
                                <tr key={staffMember.id}>
                                    <td className={`${classes.stickyColumn}`}>
                                        <div className={classes.staffInfo} onClick={() => {
                                            toggleCategoryUpdate()
                                            setSelectedStaff(staffMember)

                                        }}>
                                            <b>{`${index+1}. ${staffMember.name}`}</b> <p className={classes.staffInfoPosition}>{staffMember.position.split(' ')[0]}</p>
                                        </div>
                                    </td>
                                    {renderBookings(staffMember)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div >
            <ExistRequest
                show={showERequestSidebar}
                onClose={() => setShowERequestSidebar(false)}
                chooseRequestID={chooseRequestID}
                setChooseRequestID={setChooseRequestID}
                // handleCancelRequest={handleCancelRequest}
                user={user}
            />
        </>
    
    );
};

export default AirlineTablePageComponent;
