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

// Вынеси вверх файла (до компонента) или внутрь renderBookings
const packIntoLanes = (events) => {
  // сортируем по start, при равенстве по end
  const sorted = [...events].sort((a, b) =>
    new Date(a.start) - new Date(b.start) || new Date(a.end) - new Date(b.end)
  );
  const laneEnds = []; // laneEnds[i] = последний end в дорожке i (ms)
  const laid = [];

  for (const ev of sorted) {
    const s = new Date(ev.start).getTime();
    const e = new Date(ev.end).getTime();
    // ищем первую дорожку без пересечения
    let lane = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (s >= laneEnds[i]) { lane = i; break; }
    }
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(e); }
    else { laneEnds[lane] = Math.max(laneEnds[lane], e); }

    laid.push({ ...ev, __lane: lane, __s: s, __e: e });
  }
  return { laid, laneCount: laneEnds.length };
};


const AirlineTablePageComponent = ({ dataObject, dataInfo, maxHeight, userHeight, toggleCategoryUpdate, setSelectedStaff, user, accessMenu, currentMonth, currentYear, previousMonth, nextMonth, }) => {
    const token = getCookie('token');
    const [state, dispatch] = useReducer(reducer, initialState(dataObject, dataInfo));
    // const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    // const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
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

    // const renderBookings = (staffMember) => {
    //     const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    //     const cells = [];
    //     const bookingElements = [];

    //     // console.log(state)

    //     let staffFlightInfo = state.flightInfo?.filter(info => info?.clientID === staffMember?.id) || [];
        

    //     staffFlightInfo = staffFlightInfo.sort((a, b) => {
    //         const durationA = new Date(a.end) - new Date(a.start);
    //         const durationB = new Date(b.end) - new Date(b.start);
    //         return durationA - durationB;
    //     });

    //     // console.log(staffFlightInfo);
        

    //     for (let i = 1; i <= daysInMonth; i++) {
    //         const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    //         const isHighlighted = i === highlightedDay;
    //         cells.push(
    //             <td
    //                 key={i}
    //                 style={{ height: '45px' }}
    //                 // style={{ height: `${staffFlightInfo.length ? `${staffFlightInfo.length * (35 + staffFlightInfo.length - 1) + 10}px` : '45px'}` }}
    //                 className={`${isToday ? classes.currentDay : ''} ${isHighlighted ? classes.highlightedDay : ''} ${staffMember.id === highlightedStaffId ? classes.highlightedRow : ''}`}
    //                 onMouseEnter={() => {
    //                     setHighlightedDay(i);
    //                     setHighlightedStaffId(staffMember.id);
    //                   }}
    //                   onMouseLeave={() => {
    //                     setHighlightedDay(null);
    //                     setHighlightedStaffId(null);
    //                   }}
    //             ></td>
    //         );
    //     }

    //     staffFlightInfo.forEach((info, index) => {
    //         const { start, end, startTime, endTime, hotelName } = info;
    //         // console.log(info);
            
    //         const startDate = new Date(start);
    //         const endDate = new Date(end);

    //         const isFlightInCurrentMonth =
    //             (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) ||
    //             (endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear) ||
    //             (startDate < new Date(currentYear, currentMonth + 1, 0) && endDate > new Date(currentYear, currentMonth, 1));

    //         if (isFlightInCurrentMonth) {
    //             const startDay = startDate.getMonth() === currentMonth ? startDate.getDate() : 1;
    //             const endDay = endDate.getMonth() === currentMonth ? endDate.getDate() : daysInMonth;

    //             if (startDay <= daysInMonth && endDay >= 1) {
    //                 const colStart = Math.max(startDay, 1);
    //                 const colEnd = Math.min(endDay, daysInMonth);

    //                 const dayWidth = 100 / daysInMonth;

    //                 let getStartTime = convertToDate(start, true)
    //                 let getEndTime = convertToDate(end, true)

    //                 // const startTimeNew = getTimeHours(getStartTime);
    //                 // const endTimeNew = getTimeHours(getEndTime);

    //                 // const startTimeNew = new Date(start).getHours();
    //                 // const endTimeNew = new Date(end).getHours();

    //                 const startTimeNew = (new Date(start).getHours() - 3) % 24;
    //                 const endTimeNew = (new Date(end).getHours() - 3) % 24;

    //                 // console.log("startTimeNew", startTimeNew)
    //                 // console.log("endTimeNew", endTimeNew)

    //                 const startOffset = startDate.getMonth() === currentMonth ? (startTimeNew / 24) * dayWidth : 0;
    //                 const endOffset = endDate.getMonth() === currentMonth ? ((24 - endTimeNew) / 24) * dayWidth : 0;

    //                 // const startOffset = (startTimeNew / 24) * dayWidth;
    //                 // const endOffset = (endTimeNew / 24) * dayWidth;

    //                 // console.log("startOffset", startOffset)
    //                 // console.log("endOffset", endOffset)

    //                 const left = (colStart - 1) * dayWidth + startOffset;
    //                 const width = (colEnd - colStart + 1) * dayWidth - endOffset - startOffset;
    //                 // const width = (colEnd - colStart) * dayWidth - startOffset + endOffset;


    //                 function shortenString(str, maxLength) {
    //                     if (str?.length > maxLength) {
    //                         return str.substring(0, maxLength) + '...';
    //                     } else {
    //                         return str;
    //                     }
    //                 }

    //                 // Получаем ширину контейнера в px
    //                 const containerWidth = tableContainerRef.current?.offsetWidth || 0;
    //                 // Переводим нашу процентную ширину в пиксели
    //                 const bookingWidthInPx = (width / 100) * containerWidth;

    //                 // Задаём порог, ниже которого не показываем название
    //                 const minBlockPx = 90;

    //                 // По умолчанию текст пустой
    //                 let displayName = "";
    //                 if (bookingWidthInPx >= minBlockPx) {
    //                 // Если блок хотя бы 38px, обрезаем/оставляем название
    //                 // displayName = shortenString(
    //                 //     hotelName,
    //                 //     // Пример: если ширина >= 100px, берём maxLength=100, иначе 25
    //                 //     bookingWidthInPx >= 100 ? 100 : 25
    //                 // );
    //                 displayName = shortenString(
    //                     info.requestNumber,
    //                     // Пример: если ширина >= 100px, берём maxLength=100, иначе 25
    //                     bookingWidthInPx >= 100 ? 100 : 25
    //                 );
    //                 } else {
    //                 // Иначе вообще не показываем текст
    //                 displayName = "...";
    //                 }

    //                 // let strName = shortenString(`В ${hotelName} с ${startDate.toLocaleDateString()} по ${endDate.toLocaleDateString()}`, width >= 25 ? 100 : 25)
    //                 let strName = shortenString(`${hotelName}`, width >= 25 ? 100 : 25)
    //                 const getStatusColors = (status) => {
    //                     switch (status) {
    //                     case "done":
    //                         return { backgroundColor: "#4caf50", borderColor: "#388e3c" };
    //                     case "extended":
    //                         return { backgroundColor: "#2196f3", borderColor: "#1976d2" };
    //                     case "reduced":
    //                         return { backgroundColor: "#f44336", borderColor: "#d32f2f" };
    //                     case "transferred":
    //                         return { backgroundColor: "#ff9800", borderColor: "#e9831a" };
    //                     case "earlyStart":
    //                         return { backgroundColor: "#9575cd", borderColor: "#865ecc" };
    //                     case "archived":
    //                         return { backgroundColor: "#3b653d", borderColor: "#1b5e20" };
    //                     case "archiving":
    //                         return { backgroundColor: "#638ea4", borderColor: "#78909c" };
    //                     default:
    //                         return { backgroundColor: "#fff", borderColor: "#E4E4EF" };
    //                     }
    //                 };
    //                 // console.log(info);
                    
    //                 bookingElements.push(
    //                     <div
    //                         key={`${info.clientID}-${index}`}
    //                         onClick={() => info.reserveId ?  window.open(`/reserve/reservePlacement/${info.reserveId}`, "_blank") : handleBookingClick(info)}
    //                         className={classes.booking}
    //                         style={{
    //                             left: `${left}%`,
    //                             width: `${width}%`,
    //                             top: '5px',
    //                             // transform: `translateY(${index * (staffFlightInfo.length + 35)}px)`,
    //                             zIndex: "1",
    //                             // zIndex: staffFlightInfo.length - index,
    //                             backgroundColor: getStatusColors(info.status).backgroundColor,
    //                             color: "#fff",
    //                             // backgroundColor: '#9FD923',
    //                             borderRadius: '4px',
    //                         }}
    //                     >
    //                         {displayName}
    //                     </div>
    //                 );
    //             }
    //         }
    //     });

    //     return (
    //         <td colSpan={daysInMonth} className={classes.bookingCell} style={{ height: `45px` }} >
    //             {cells}
    //             {bookingElements}
    //         </td >
    //     );
    // };

    // Запрос на отмену созданной, но не размещенной заявки
    const renderBookings = (staffMember) => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const cells = [];
    const bookingElements = [];

    let staffFlightInfo = state.flightInfo?.filter(info => info?.clientID === staffMember?.id) || [];

    // 1) раскладываем интервалы по дорожкам
    const { laid, laneCount } = packIntoLanes(staffFlightInfo);

    // 2) рисуем блоки (твоя логика left/width + добавляем top по дорожке)
    const dayWidth = 100 / daysInMonth;
    const LANE_H = 45;           // высота строки события
    const TOP_PAD = 5;           // верхний отступ внутри ячейки
    const GAP = 4;

    // 3) высота строки = базовая + высота дорожек
    const rowMin = 45;
    //   const rowH = Math.max(rowMin, laneCount * (LANE_H + 4));
    
    const rowH = Math.max(45, laneCount * (LANE_H));
    // console.log(rowH);

    // высветление колонок как у тебя
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
        const isHighlighted = i === highlightedDay;
        cells.push(
        <td
            key={i}
            style={{ height: `${rowH}px` }}
            className={`${isToday ? classes.currentDay : ''} ${isHighlighted ? classes.highlightedDay : ''} ${staffMember.id === highlightedStaffId ? classes.highlightedRow : ''}`}
            onMouseEnter={() => { setHighlightedDay(i); setHighlightedStaffId(staffMember.id); }}
            onMouseLeave={() => { setHighlightedDay(null); setHighlightedStaffId(null); }}
        />
        );
    }

    laid.forEach((info, index) => {
        const startDate = new Date(info.start);
        const endDate   = new Date(info.end);

        const inMonth =
        (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) ||
        (endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear) ||
        (startDate < new Date(currentYear, currentMonth + 1, 0) && endDate > new Date(currentYear, currentMonth, 1));

        if (!inMonth) return;

        const startDay = startDate.getMonth() === currentMonth ? startDate.getDate() : 1;
        const endDay   = endDate.getMonth() === currentMonth ? endDate.getDate() : daysInMonth;

        const colStart = Math.max(startDay, 1);
        const colEnd   = Math.min(endDay, daysInMonth);

        // твои смещения по часам (оставил логику как у тебя)
        const startTimeNew = (new Date(info.start).getHours() - 3) % 24;
        const endTimeNew   = (new Date(info.end).getHours() - 3) % 24;

        const startOffset = startDate.getMonth() === currentMonth ? (startTimeNew / 24) * dayWidth : 0;
        const endOffset   = endDate.getMonth() === currentMonth ? ((24 - endTimeNew) / 24) * dayWidth : 0;

        const left  = (colStart - 1) * dayWidth + startOffset;
        const width = (colEnd - colStart + 1) * dayWidth - endOffset - startOffset;

        // вычисляем текст как у тебя (сокращения)
        const containerWidth = tableContainerRef.current?.offsetWidth || 0;
        const bookingWidthInPx = (width / 100) * containerWidth;
        const minBlockPx = 90;
        const shortenString = (str, max) => (str?.length > max ? str.slice(0, max) + '...' : str || '');
        const displayName =
        bookingWidthInPx >= minBlockPx
            ? shortenString(info.requestNumber, bookingWidthInPx >= 100 ? 100 : 25)
            : '...';

        const getStatusColors = (status) => {
        switch (status) {
            case "done":        return { backgroundColor: "#4caf50", borderColor: "#388e3c" };
            case "extended":    return { backgroundColor: "#2196f3", borderColor: "#1976d2" };
            case "reduced":     return { backgroundColor: "#f44336", borderColor: "#d32f2f" };
            case "transferred": return { backgroundColor: "#ff9800", borderColor: "#e9831a" };
            case "earlyStart":  return { backgroundColor: "#9575cd", borderColor: "#865ecc" };
            case "archived":    return { backgroundColor: "#3b653d", borderColor: "#1b5e20" };
            case "archiving":   return { backgroundColor: "#638ea4", borderColor: "#78909c" };
            default:            return { backgroundColor: "#fff", borderColor: "#E4E4EF" };
        }
        };

        bookingElements.push(
        <div
            key={`${info.clientID}-${index}`}
            onClick={() => info.reserveId ? window.open(`/reserve/reservePlacement/${info.reserveId}`, "_blank") : handleBookingClick(info)}
            className={classes.booking}
            style={{
                position: 'absolute',
                left: `${left}%`,
                width: `${width}%`,
                top: `${TOP_PAD + info.__lane * (LANE_H)}px`, // ← уводим вниз по дорожке
                lineHeight: `${LANE_H}px`,
                borderRadius: '4px',
                zIndex: 1,
                backgroundColor: getStatusColors(info.status).backgroundColor,
                color: '#fff',
            }}
        >
            {displayName}
        </div>
        );
    });

    return (
        <td colSpan={daysInMonth} className={classes.bookingCell} style={{ height: `${rowH}px`, position: 'relative' }}>
        {cells}
        {bookingElements}
        </td>
    );
    };
    
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

    // const previousMonth = () => {
    //     setCurrentMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1));
    //     if (currentMonth === 0) {
    //         setCurrentYear((prevYear) => prevYear - 1);
    //     }
    // };

    // const nextMonth = () => {
    //     setCurrentMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1));
    //     if (currentMonth === 11) {
    //         setCurrentYear((prevYear) => prevYear + 1);
    //     }
    // };

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
                                        <div className={classes.staffWrapper}>
                                            <p className={classes.staffIndex}>{index+1}</p>
                                            <div className={classes.staffInfo} onClick={() => {
                                                toggleCategoryUpdate()
                                                setSelectedStaff(staffMember)
                                            }}>
                                                {/* <b>{`${index+1}. ${staffMember.name}`}</b> <p className={classes.staffInfoPosition}>{staffMember.position.split(' ')[0]}</p> */}
                                                <p style={{wordBreak:'break-all'}}>{staffMember.name} <span className={classes.staffInfoPosition} style={{wordBreak:'normal'}}>{staffMember.position?.name}</span></p> 
                                            </div>
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
                accessMenu={accessMenu}
            />
        </>
    
    );
};

export default AirlineTablePageComponent;


// import React, { useReducer, useEffect, useState, useRef } from 'react';
// import classes from './AirlineTablePageComponent.module.css';
// import { CircularProgress } from '@mui/material';
// import { CANCEL_REQUEST, convertToDate, getCookie } from '../../../../graphQL_requests';
// import ExistRequest from '../ExistRequest/ExistRequest';
// import { useNavigate } from 'react-router-dom';
// import { useMutation } from '@apollo/client';

// const initialState = (data, dataInfo) => ({
//     bookings: data || [],
//     flightInfo: dataInfo || [],
// });

// const reducer = (state, action) => {
//     switch (action.type) {
//         case 'SET_BOOKINGS':
//             return { ...state, bookings: action.payload };
//         case 'SET_FLIGHT_INFO':
//             return { ...state, flightInfo: action.payload };
//         default:
//             return state;
//     }
// };

// const AirlineTablePageComponent = ({ dataObject, dataInfo, maxHeight, userHeight, toggleCategoryUpdate, setSelectedStaff, user }) => {
//     const token = getCookie('token');
//     const [state, dispatch] = useReducer(reducer, initialState(dataObject, dataInfo));
//     const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
//     const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
//     const [highlightedDay, setHighlightedDay] = useState(null);
//     const [highlightedStaffId, setHighlightedStaffId] = useState(null);
//     const today = new Date();
//     const currentDayRef = useRef(null);
//     const tableContainerRef = useRef(null);

//     // console.log(state);

//     const [chooseRequestID, setChooseRequestID] = useState(null);
//     const [showERequestSidebar, setShowERequestSidebar] = useState(false);
//     const navigate = useNavigate();

//     const handleBookingClick = (info) => {
//         // console.log(info);
//         setChooseRequestID(info.requestId); // Устанавливаем requestId в состояние
//         setShowERequestSidebar(true); // Открываем ExistRequest
//     };
    

//     useEffect(() => {
//         if (dataObject) {
//             const newBookings = dataObject.map(item => ({
//                 id: item.id,
//                 name: item.name,
//                 gender: item.gender,
//                 number: item.number,
//                 position: item.position,
//             }));
//             dispatch({ type: 'SET_BOOKINGS', payload: newBookings });
//         }
//     }, [dataObject]);

//     useEffect(() => {
//         if (tableContainerRef.current && currentDayRef.current) {
//             tableContainerRef.current.scrollLeft = currentDayRef.current.offsetLeft;
//         }
//     }, [currentMonth, currentYear]);

//     useEffect(() => {
//         dispatch({ type: 'SET_FLIGHT_INFO', payload: dataInfo });
//     }, [dataInfo]);
    

//     const getDaysInMonth = (month, year) => {
//         return new Date(year, month + 1, 0).getDate();
//     };

//     const renderDays = () => {
//         const daysInMonth = getDaysInMonth(currentMonth, currentYear);
//         const days = [];
//         for (let i = 1; i <= daysInMonth; i++) {
//             const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
//             const isHighlighted = i === highlightedDay;
//             days.push(
//                 <th
//                     key={i}
//                     className={`${isToday ? classes.currentDay : ''} ${isHighlighted ? classes.highlightedDay : ''}`}
//                     ref={isToday ? currentDayRef : null}
//                 >
//                     <div className={classes.topDayBlock}>{i <= 9 ? '0' + i : i}</div>
//                 </th>
//             );
//         }
//         return days;
//     };

//     const getTimeHours = (timeString) => {
//         const [hours] = timeString.split(':');
//         return parseInt(hours, 10);
//     };

//     const renderBookings = (staffMember) => {
//         const daysInMonth = getDaysInMonth(currentMonth, currentYear);
//         const cells = [];
//         const bookingElements = [];

//         let staffFlightInfo = state.flightInfo.filter(info => info.clientID === staffMember.id);

//         staffFlightInfo = staffFlightInfo.sort((a, b) => {
//             const durationA = new Date(a.end) - new Date(a.start);
//             const durationB = new Date(b.end) - new Date(b.start);
//             return durationA - durationB;
//         });

//         // console.log(staffFlightInfo);
        

//         for (let i = 1; i <= daysInMonth; i++) {
//             const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
//             const isHighlighted = i === highlightedDay;
//             cells.push(
//                 <td
//                     key={i}
//                     style={{ height: `${staffFlightInfo.length ? `${staffFlightInfo.length * (35 + staffFlightInfo.length - 1) + 10}px` : '45px'}` }}
//                     className={`${isToday ? classes.currentDay : ''} ${isHighlighted ? classes.highlightedDay : ''} ${staffMember.id === highlightedStaffId ? classes.highlightedRow : ''}`}
//                     onMouseEnter={() => {
//                         setHighlightedDay(i);
//                         setHighlightedStaffId(staffMember.id);
//                       }}
//                       onMouseLeave={() => {
//                         setHighlightedDay(null);
//                         setHighlightedStaffId(null);
//                       }}
//                 ></td>
//             );
//         }

//         staffFlightInfo.forEach((info, index) => {
//             const { start, end, startTime, endTime, hotelName } = info;
//             // console.log(info);
            
//             const startDate = new Date(start);
//             const endDate = new Date(end);

//             const isFlightInCurrentMonth =
//                 (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) ||
//                 (endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear) ||
//                 (startDate < new Date(currentYear, currentMonth + 1, 0) && endDate > new Date(currentYear, currentMonth, 1));

//             if (isFlightInCurrentMonth) {
//                 const startDay = startDate.getMonth() === currentMonth ? startDate.getDate() : 1;
//                 const endDay = endDate.getMonth() === currentMonth ? endDate.getDate() : daysInMonth;

//                 if (startDay <= daysInMonth && endDay >= 1) {
//                     const colStart = Math.max(startDay, 1);
//                     const colEnd = Math.min(endDay, daysInMonth);

//                     const dayWidth = 100 / daysInMonth;

//                     let getStartTime = convertToDate(start, true)
//                     let getEndTime = convertToDate(end, true)

//                     // const startTimeNew = getTimeHours(getStartTime);
//                     // const endTimeNew = getTimeHours(getEndTime);

//                     // const startTimeNew = new Date(start).getHours();
//                     // const endTimeNew = new Date(end).getHours();

//                     const startTimeNew = (new Date(start).getHours() - 3) % 24;
//                     const endTimeNew = (new Date(end).getHours() - 3) % 24;

//                     // console.log("startTimeNew", startTimeNew)
//                     // console.log("endTimeNew", endTimeNew)

//                     const startOffset = startDate.getMonth() === currentMonth ? (startTimeNew / 24) * dayWidth : 0;
//                     const endOffset = endDate.getMonth() === currentMonth ? ((24 - endTimeNew) / 24) * dayWidth : 0;

//                     // const startOffset = (startTimeNew / 24) * dayWidth;
//                     // const endOffset = (endTimeNew / 24) * dayWidth;

//                     // console.log("startOffset", startOffset)
//                     // console.log("endOffset", endOffset)

//                     const left = (colStart - 1) * dayWidth + startOffset;
//                     const width = (colEnd - colStart + 1) * dayWidth - endOffset - startOffset;
//                     // const width = (colEnd - colStart) * dayWidth - startOffset + endOffset;


//                     function shortenString(str, maxLength) {
//                         if (str?.length > maxLength) {
//                             return str.substring(0, maxLength) + '...';
//                         } else {
//                             return str;
//                         }
//                     }

//                     // Получаем ширину контейнера в px
//                     const containerWidth = tableContainerRef.current?.offsetWidth || 0;
//                     // Переводим нашу процентную ширину в пиксели
//                     const bookingWidthInPx = (width / 100) * containerWidth;

//                     // Задаём порог, ниже которого не показываем название
//                     const minBlockPx = 90;

//                     // По умолчанию текст пустой
//                     let displayName = "";
//                     if (bookingWidthInPx >= minBlockPx) {
//                     // Если блок хотя бы 38px, обрезаем/оставляем название
//                     // displayName = shortenString(
//                     //     hotelName,
//                     //     // Пример: если ширина >= 100px, берём maxLength=100, иначе 25
//                     //     bookingWidthInPx >= 100 ? 100 : 25
//                     // );
//                     displayName = shortenString(
//                         info.requestNumber,
//                         // Пример: если ширина >= 100px, берём maxLength=100, иначе 25
//                         bookingWidthInPx >= 100 ? 100 : 25
//                     );
//                     } else {
//                     // Иначе вообще не показываем текст
//                     displayName = "...";
//                     }

//                     // let strName = shortenString(`В ${hotelName} с ${startDate.toLocaleDateString()} по ${endDate.toLocaleDateString()}`, width >= 25 ? 100 : 25)
//                     let strName = shortenString(`${hotelName}`, width >= 25 ? 100 : 25)

//                     bookingElements.push(
//                         <div
//                             key={`${info.clientID}-${index}`}
//                             onClick={() => info.reserveId ?  window.open(`/reserve/reservePlacement/${info.reserveId}`, "_blank") : handleBookingClick(info)}
//                             className={classes.booking}
//                             style={{
//                                 left: `${left}%`,
//                                 width: `${width}%`,
//                                 top: '5px',
//                                 transform: `translateY(${index * (staffFlightInfo.length + 35)}px)`,
//                                 zIndex: "1",
//                                 // zIndex: staffFlightInfo.length - index,
//                                 backgroundColor: '#9FD923',
//                                 borderRadius: '4px',
//                             }}
//                         >
//                             {displayName}
//                         </div>
//                     );
//                 }
//             }
//         });

//         return (
//             <td colSpan={daysInMonth} className={classes.bookingCell} style={{ height: `${staffFlightInfo.length * 35 + 10}px ` }} >
//                 {cells}
//                 {bookingElements}
//             </td >
//         );
//     };

//     // Запрос на отмену созданной, но не размещенной заявки
//         const [cancelRequestMutation] = useMutation(CANCEL_REQUEST, {
//             context: {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             },
//         });
    
//         const handleCancelRequest = async (id) => {
//             try {
//                 // Отправка запроса с правильным ID заявки
//                 const response = await cancelRequestMutation({
//                     variables: {
//                         cancelRequestId: id,
//                     },
//                 });
//                 // console.log("Заявка успешно отменена", response);
//             } catch (error) {
//                 console.error("Ошибка при отмене заявки:", JSON.stringify(error));
//             }
//         };

//     const previousMonth = () => {
//         setCurrentMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1));
//         if (currentMonth === 0) {
//             setCurrentYear((prevYear) => prevYear - 1);
//         }
//     };

//     const nextMonth = () => {
//         setCurrentMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1));
//         if (currentMonth === 11) {
//             setCurrentYear((prevYear) => prevYear + 1);
//         }
//     };

//     const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

//     return (
//         <>
//             <div className={classes.tableData}>
//                 <div className={classes.tableContainer} ref={tableContainerRef} style={{ "maxHeight": maxHeight, height: userHeight ? userHeight : "" }}>
//                     <table className={classes.hotelTable}>
//                         <thead className={classes.stickyHeader}>
//                             <tr>
//                                 <th className={classes.stickyColumn}>
//                                     <div className={classes.controls}>
//                                         <div onClick={previousMonth}><img src="/arrow-left.png" alt="previous month" /></div>
//                                         <span>{monthNames[currentMonth]} {currentYear}</span>
//                                         <div onClick={nextMonth}><img src="/arrow-right.png" alt="next month" /></div>
//                                     </div>
//                                 </th>
//                                 {renderDays()}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {state.bookings.map((staffMember, index) => (
//                                 <tr key={staffMember.id}>
//                                     <td className={`${classes.stickyColumn}`}>
//                                         <div className={classes.staffWrapper}>
//                                             <p className={classes.staffIndex}>{index+1}</p>
//                                             <div className={classes.staffInfo} onClick={() => {
//                                                 toggleCategoryUpdate()
//                                                 setSelectedStaff(staffMember)
//                                             }}>
//                                                 {/* <b>{`${index+1}. ${staffMember.name}`}</b> <p className={classes.staffInfoPosition}>{staffMember.position.split(' ')[0]}</p> */}
//                                                 <p style={{wordBreak:'break-all'}}>{staffMember.name} <span className={classes.staffInfoPosition} style={{wordBreak:'normal'}}>{staffMember.position?.name}</span></p> 
//                                             </div>
//                                         </div>
//                                     </td>
//                                     {renderBookings(staffMember)}
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div >
//             <ExistRequest
//                 show={showERequestSidebar}
//                 onClose={() => setShowERequestSidebar(false)}
//                 chooseRequestID={chooseRequestID}
//                 setChooseRequestID={setChooseRequestID}
//                 // handleCancelRequest={handleCancelRequest}
//                 user={user}
//             />
//         </>
    
//     );
// };

// export default AirlineTablePageComponent;
