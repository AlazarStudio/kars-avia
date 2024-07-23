import React from "react";
import classes from './InfoTableDataReserve.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";

function InfoTableDataReserve({ children, requests, ...props }) {

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

            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <Link to={`/reserve/reservePlacement/${index}`} className={classes.InfoTable_data} key={index}>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{item.id}</div>

                        <div className={`${classes.InfoTable_data_elem} ${classes.w8}`}>{item.date}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_img}>
                                <img src={`/${item.aviacompany_icon}`} alt="" />
                            </div>
                            {item.aviacompany}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>{item.airport}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.passengers.length}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.arrival_title}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.departure_title}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                            <div className={classes.InfoTable_data_elem_position}>
                                <div className={item.statusCode}></div>
                                {item.status}
                            </div>
                        </div>
                    </Link>
                ))}

            </div>
        </InfoTable>
    );
}

export default InfoTableDataReserve;