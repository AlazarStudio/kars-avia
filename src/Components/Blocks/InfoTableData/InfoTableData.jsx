import React from "react";
import classes from './InfoTableData.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { server } from "../../../../graphQL_requests";

function InfoTableData({ children, toggleRequestSidebar, requests, setChooseObject, setChooseRequestID, ...props }) {
    const handleObject = (id, arrival, departure, persone, requestNumber) => {
        setChooseObject([
            {
                room: '',
                place: '',
                start: arrival.date,
                startTime: arrival.time,
                end: departure.date,
                endTime: departure.time,
                client: persone.name,
                public: false,
                clientId: persone.id,
                hotelId: '',
                requestId: id,
                requestNumber: requestNumber
            }
        ])
        setChooseRequestID(id)
        toggleRequestSidebar()
    }

    console.log(requests)

    function convertToDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString(); // возвращает дату в удобном для чтения формате
    }
    return (
        <InfoTable >
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>№</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Дата заявки</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Авиакомпания</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Аэропорт</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Прибытие</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Отъезд</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Статус</div>
            </div>

            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <div className={classes.InfoTable_data} onClick={() => handleObject(item.id, item.arrival, item.departure, item.person, item.requestNumber)} key={index}>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{item.requestNumber?.split('-')[0]}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.person.name}</div>
                                <div className={classes.InfoTable_data_elem_moreInfo}>{item.person.position}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>{convertToDate(Number(item.createdAt))}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`} style={{"padding": "0 10px" }}>
                            <div className={classes.InfoTable_data_elem_img}>
                                <img src={`${server}${item.airline.images[0]}`} alt="" />
                            </div>
                            {item.airline.name}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>{item.airport.code}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.arrival.flight}</div>
                                <div className={classes.InfoTable_data_elem_moreInfo}>
                                    <span><img src="/calendar.png" alt="" /> {convertToDate(item.arrival.date)}</span>
                                    <span><img src="/time.png" alt="" /> {item.arrival.time}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.departure.flight}</div>
                                <div className={classes.InfoTable_data_elem_moreInfo}>
                                    <span><img src="/calendar.png" alt="" /> {convertToDate(item.departure.date)}</span>
                                    <span><img src="/time.png" alt="" /> {item.departure.time}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>
                            <div className={classes.InfoTable_data_elem_position}>
                                <div className={item.status}></div>
                                {item.status == 'created' && 'Создан'}
                                {item.status == 'processing' && 'В обработке'}
                                {item.status == 'cancelled' && 'Отменен'}
                                {item.status == 'done' && 'Готово'}
                            </div>
                        </div>
                    </div>
                ))}

            </div>
        </InfoTable>
    );
}

export default InfoTableData;