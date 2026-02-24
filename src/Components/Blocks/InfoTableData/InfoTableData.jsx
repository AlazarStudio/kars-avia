import React, { useCallback, useEffect, useRef } from "react";
import classes from './InfoTableData.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { convertToDate, getMediaUrl } from "../../../../graphQL_requests";

// Основная таблица с данными о заявках
function InfoTableData({ user, toggleRequestSidebar, scrollToId, requests, setChooseObject, chooseRequestID, setChooseRequestID, pageInfo }) {
    // Функция для установки выбранного объекта и переключения боковой панели
    const handleObject = useCallback((id, arrival, departure, person, requestNumber) => {
        setChooseObject([{
            room: '',
            place: '',
            start: arrival.date,
            startTime: arrival.time,
            end: departure.date,
            endTime: departure.time,
            client: person?.name,
            public: false,
            clientId: person?.id,
            hotelId: '',
            requestId: id,
            requestNumber
        }]);
        setChooseRequestID(id);
        toggleRequestSidebar();
    }, [setChooseObject, setChooseRequestID, toggleRequestSidebar]);

    // Массив статусов для улучшения читаемости
    const statusLabels = {
        created: 'Создан',
        opened: 'В обработке',
        extended: 'Продлен',
        reduced: 'Сокращен',
        transferred: 'Перенесен',
        earlyStart: 'Ранний заезд',
        canceled: 'Отменен',
        archiving: 'Готов к архиву',
        archived: 'Архив',
        done: 'Размещен'
    };

    // Ref для контейнера списка
    const listContainerRef = useRef(null);

    // Прокрутка наверх при изменении `pageInfo`
    useEffect(() => {
      if (listContainerRef.current) {
          listContainerRef.current.scrollTo({
              top: 0,
              behavior: "instant",
          });
      }
    }, [pageInfo]);

    // useEffect(() => {
    //     if (!scrollToId || !listContainerRef.current) return;
    //     const el = listContainerRef.current.querySelector(`[data-id="${scrollToId}"]`);
    //     if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    // }, [scrollToId, requests]);

    // console.log(requests);
    

    return (
        <InfoTable>
            {/* Заголовки колонок */}
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>№</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w13}`} style={{justifyContent:'center'}}>Дата заявки</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Авиакомпания</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`} style={{justifyContent:'center', padding:'0 10px'}}>Аэропорт</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Прибытие</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Отъезд</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Статус</div>
            </div>

            {/* Данные о заявках */}
            <div className={classes.bottom} ref={listContainerRef}>
                {requests.map((item, index) => (
                    <div
                        className={`${classes.InfoTable_data} ${chooseRequestID === item.id && classes.InfoTable_data_active}`}
                        style={{ opacity: (item.status !== 'archiving' && item.status !== 'canceled' ) ? 1 : 0.5 }}
                        onClick={() => handleObject(item.id, item.arrival, item.departure, item.person, item.requestNumber)}
                        key={index}
                        // data-id={item.id}
                    >
                        {/* {item.status === 'created' && <div className={classes.newRequest}></div>} */}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>{item.requestNumber}</div>
                        {/* <div className={`${classes.InfoTable_data_elem} ${classes.w10}`} style={{justifyContent:'center', padding:'0'}}>{item.requestNumber?.slice(0, 4)}</div> */}
                        {item?.chat?.some(chat => 
                            chat.unreadMessagesCount > 0 && (
                                (user.hotelId && chat.hotelId === user.hotelId) ||
                                (user.airlineId && chat.airlineId === user.airlineId) ||
                                (!user.hotelId && !user.airlineId)
                            )
                            ) && <div className={classes.newRequest}></div>}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                {item.person ?
                                (
                                    <>
                                        <div className={classes.InfoTable_data_elem_title}>{item?.person?.name} {' '} {item?.reserve ? '(Резерв)' : ''} </div>
                                        <div className={classes.InfoTable_data_elem_moreInfo}>{item?.person?.position?.name?.split(' ')[0]}</div>
                                        {/* <div className={classes.InfoTable_data_elem_moreInfo}>{item?.person?.position?.split(' ')[0]}</div> */}
                                    </>
                                )
                                : "Предварительная бронь"}
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w13}`} style={{justifyContent:'center', padding:'0 0 0 10px'}}>{convertToDate(item.createdAt)}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`} style={{ padding: "0 10px" }}>
                            <div className={classes.InfoTable_data_elem_img} >
                                <img src={getMediaUrl(item.airline.images[0])} alt="" />
                            </div>
                            {item.airline.name}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`} style={{justifyContent:'center'}}>{item.airport?.code}</div>
                        {/* <div className={`${classes.InfoTable_data_elem} ${classes.w12}`} style={{justifyContent:'center'}}>{item.airport.name} ({item.airport?.code})</div> */}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                {/* <div className={classes.InfoTable_data_elem_title}>{item.arrival.flight}</div> */}
                                <div className={classes.InfoTable_data_elem_moreInfo}>
                                    <span><img src="/calendar.png" alt="" /> {convertToDate(item.arrival)}</span>
                                    <span><img src="/time.png" alt="" /> {convertToDate(item.arrival, true)}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                {/* <div className={classes.InfoTable_data_elem_title}>{item.departure.flight}</div> */}
                                <div className={classes.InfoTable_data_elem_moreInfo}>
                                    <span><img src="/calendar.png" alt="" /> {convertToDate(item.departure)}</span>
                                    <span><img src="/time.png" alt="" /> {convertToDate(item.departure, true)}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                            <div className={classes.InfoTable_data_elem_position}>
                                <div className={item.status}></div>
                                {statusLabels[item.status]}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </InfoTable>
    );
}

export default InfoTableData;


// import React, { useCallback, useEffect, useRef } from "react";
// import classes from './InfoTableData.module.css';
// import InfoTable from "../InfoTable/InfoTable";
// import { convertToDate, server } from "../../../../graphQL_requests";

// // Основная таблица с данными о заявках
// function InfoTableData({ user, toggleRequestSidebar, requests, setChooseObject, chooseRequestID, setChooseRequestID, pageInfo }) {
//     // Функция для установки выбранного объекта и переключения боковой панели
//     const handleObject = useCallback((id, arrival, departure, person, requestNumber) => {
//         setChooseObject([{
//             room: '',
//             place: '',
//             start: arrival.date,
//             startTime: arrival.time,
//             end: departure.date,
//             endTime: departure.time,
//             client: person?.name,
//             public: false,
//             clientId: person?.id,
//             hotelId: '',
//             requestId: id,
//             requestNumber
//         }]);
//         setChooseRequestID(id);
//         toggleRequestSidebar();
//     }, [setChooseObject, setChooseRequestID, toggleRequestSidebar]);

//     // Массив статусов для улучшения читаемости
//     const statusLabels = {
//         created: 'Создан',
//         opened: 'В обработке',
//         extended: 'Продлен',
//         reduced: 'Сокращен',
//         transferred: 'Перенесен',
//         earlyStart: 'Ранний заезд',
//         canceled: 'Отменен',
//         archiving: 'Готов к архиву',
//         archived: 'Архив',
//         done: 'Размещен'
//     };

//     // Ref для контейнера списка
//     const listContainerRef = useRef(null);

//     // Прокрутка наверх при изменении `pageInfo`
//     useEffect(() => {
//       if (listContainerRef.current) {
//           listContainerRef.current.scrollTo({
//               top: 0,
//               behavior: "instant",
//           });
//       }
//     }, [pageInfo]);

//     // console.log(requests);
    

//     return (
//         <InfoTable>
//             {/* Заголовки колонок */}
//             <div className={classes.InfoTable_title}>
//                 <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>№</div>
//                 <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>ФИО</div>
//                 <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Дата заявки</div>
//                 <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Авиакомпания</div>
//                 <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Аэропорт</div>
//                 <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Прибытие</div>
//                 <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Отъезд</div>
//                 <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Статус</div>
//             </div>

//             {/* Данные о заявках */}
//             <div className={classes.bottom} ref={listContainerRef}>
//                 {requests.map((item, index) => (
//                     <div
//                         className={`${classes.InfoTable_data} ${chooseRequestID === item.id && classes.InfoTable_data_active}`}
//                         style={{ opacity: (item.status !== 'archiving' && item.status !== 'canceled' ) ? 1 : 0.5 }}
//                         onClick={() => handleObject(item.id, item.arrival, item.departure, item.person, item.requestNumber)}
//                         key={index}
//                     >
//                         {/* {item.status === 'created' && <div className={classes.newRequest}></div>} */}
//                         <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{item.requestNumber?.slice(0, 4)}</div>
//                         {item?.chat?.some(chat => 
//                             chat.unreadMessagesCount > 0 && (
//                                 (user.hotelId && chat.hotelId === user.hotelId) ||
//                                 (user.airlineId && chat.airlineId === user.airlineId) ||
//                                 (!user.hotelId && !user.airlineId)
//                             )
//                             ) && <div className={classes.newRequest}></div>}
//                         <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
//                             <div className={classes.InfoTable_data_elem_information}>
//                                 {item.person ?
//                                 (
//                                     <>
//                                         <div className={classes.InfoTable_data_elem_title}>{item?.person?.name} {' '} {item?.reserve ? '(Резерв)' : ''} </div>
//                                         <div className={classes.InfoTable_data_elem_moreInfo}>{item?.person?.position.split(' ')[0]}</div>
//                                     </>
//                                 )
//                                 : "Предварительная бронь"}
//                             </div>
//                         </div>
//                         <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>{convertToDate(item.createdAt)}</div>
//                         <div className={`${classes.InfoTable_data_elem} ${classes.w15}`} style={{ padding: "0 10px" }}>
//                             <div className={classes.InfoTable_data_elem_img} >
//                                 <img src={`${server}${item.airline.images[0]}`} alt="" />
//                             </div>
//                             {item.airline.name}
//                         </div>
//                         <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>{item.airport.name} ({item.airport?.code})</div>
//                         <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
//                             <div className={classes.InfoTable_data_elem_information}>
//                                 {/* <div className={classes.InfoTable_data_elem_title}>{item.arrival.flight}</div> */}
//                                 <div className={classes.InfoTable_data_elem_moreInfo}>
//                                     <span><img src="/calendar.png" alt="" /> {convertToDate(item.arrival)}</span>
//                                     <span><img src="/time.png" alt="" /> {convertToDate(item.arrival, true)}</span>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
//                             <div className={classes.InfoTable_data_elem_information}>
//                                 {/* <div className={classes.InfoTable_data_elem_title}>{item.departure.flight}</div> */}
//                                 <div className={classes.InfoTable_data_elem_moreInfo}>
//                                     <span><img src="/calendar.png" alt="" /> {convertToDate(item.departure)}</span>
//                                     <span><img src="/time.png" alt="" /> {convertToDate(item.departure, true)}</span>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
//                             <div className={classes.InfoTable_data_elem_position}>
//                                 <div className={item.status}></div>
//                                 {statusLabels[item.status]}
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </InfoTable>
//     );
// }

// export default InfoTableData;
