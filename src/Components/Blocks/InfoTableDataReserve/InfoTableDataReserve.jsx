import React from "react";
import classes from './InfoTableDataReserve.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";
import { server } from "../../../../graphQL_requests";

function InfoTableDataReserve({ children, requests, paginationHeight, ...props }) {

    function convertToDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString(); // возвращает дату в удобном для чтения формате
    }
    return (
        <InfoTable >
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w8}`}>Дата</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Авиакомпания</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Аэропорт</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Количество человек</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Прибытие</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Отъезд</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Статус</div>
            </div>

            <div className={classes.bottom} style={{ height: `calc(100vh - ${paginationHeight})` }} >
                {requests.map((item, index) => (
                    <Link to={`/reserve/reservePlacement/${item.id}`} className={classes.InfoTable_data} key={index} style={{ opacity: item.status == 'done' && '0.5' }} >
                        {item.status == 'created' && <div className={classes.newRequest}></div>}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{item.reserveNumber.split('-')[0]}</div>

                        <div className={`${classes.InfoTable_data_elem} ${classes.w8}`}>{convertToDate(Number(item.createdAt))}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_img}>
                                <img src={`${server}${item.airline?.images[0]}`} alt="" />
                            </div>
                            {item.airline?.name}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>{item.airport?.code}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.passengerCount ? item.passengerCount : 0}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{convertToDate(item.arrival.date)} - {item.arrival.time}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{convertToDate(item.departure.date)} - {item.departure.time}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                            <div className={classes.InfoTable_data_elem_position}>
                                <div className={item.status}></div>
                                {item.status == 'created' && 'Создан'}
                                {item.status == 'processing' && 'В обработке'}
                                {item.status == 'cancelled' && 'Отменен'}
                                {item.status == 'done' && 'Готово'}
                            </div>
                        </div>
                    </Link>
                ))}

            </div>
        </InfoTable>
    );
}

export default InfoTableDataReserve;