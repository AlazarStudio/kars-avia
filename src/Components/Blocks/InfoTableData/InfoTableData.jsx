import React, { useCallback } from "react";
import classes from './InfoTableData.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { convertToDate, server } from "../../../../graphQL_requests";

// Основная таблица с данными о заявках
function InfoTableData({ toggleRequestSidebar, requests, setChooseObject, chooseRequestID, setChooseRequestID }) {
    // Функция для установки выбранного объекта и переключения боковой панели
    const handleObject = useCallback((id, arrival, departure, person, requestNumber) => {
        setChooseObject([{
            room: '',
            place: '',
            start: arrival.date,
            startTime: arrival.time,
            end: departure.date,
            endTime: departure.time,
            client: person.name,
            public: false,
            clientId: person.id,
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

    return (
        <InfoTable>
            {/* Заголовки колонок */}
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>№</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Дата заявки</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Авиакомпания</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Аэропорт</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Прибытие</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Отъезд</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Статус</div>
            </div>

            {/* Данные о заявках */}
            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <div
                        className={`${classes.InfoTable_data} ${chooseRequestID === item.id && classes.InfoTable_data_active}`}
                        style={{ opacity: (item.status === 'done' || item.status === 'extended' || item.status === 'reduced' || item.status === 'transferred' || item.status === 'earlyStart' || item.status === 'canceled') ? 0.5 : 1 }}
                        onClick={() => handleObject(item.id, item.arrival, item.departure, item.person, item.requestNumber)}
                        key={index}
                    >
                        {item.status === 'created' && <div className={classes.newRequest}></div>}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{item.requestNumber?.split('-')[0]}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.person.name}</div>
                                <div className={classes.InfoTable_data_elem_moreInfo}>{item.person.position}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>{convertToDate(item.createdAt)}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`} style={{ padding: "0 10px" }}>
                            <div className={classes.InfoTable_data_elem_img}>
                                <img src={`${server}${item.airline.images[0]}`} alt="" />
                            </div>
                            {item.airline.name}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>{item.airport.name} ({item.airport?.code})</div>
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
