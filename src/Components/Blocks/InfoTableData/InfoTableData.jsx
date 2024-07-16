import React from "react";
import classes from './InfoTableData.module.css';
import InfoTable from "../InfoTable/InfoTable";

function InfoTableData({ children, toggleRequestSidebar, requests, ...props }) {

    return (
        <InfoTable >
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w8}`}>Дата</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Авиакомпания</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Аэропорт</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Прибытие</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Отъезд</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Статус</div>
            </div>

            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <div className={classes.InfoTable_data} onClick={toggleRequestSidebar} key={index}>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{item.id}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.fullName}</div>
                                <div className={classes.InfoTable_data_elem_moreInfo}>{item.post}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w8}`}>{item.date}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_img}>
                                <img src={`/${item.airport_icon}`} alt="" />
                            </div>
                            {item.aviacompany}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>{item.airport}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.arrival_title}</div>
                                <div className={classes.InfoTable_data_elem_moreInfo}>
                                    <span><img src="/calendar.png" alt="" /> {item.arrival_date}</span>
                                    <span><img src="/time.png" alt="" /> {item.arrival_time}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.departure_title}</div>
                                <div className={classes.InfoTable_data_elem_moreInfo}>
                                    <span><img src="/calendar.png" alt="" /> {item.departure_date}</span>
                                    <span><img src="/time.png" alt="" /> {item.departure_time}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                            <div className={classes.InfoTable_data_elem_position}>
                                <div className={item.statusCode}></div>
                                {item.status}
                            </div>
                        </div>
                    </div>
                ))}

            </div>
        </InfoTable>
    );
}

export default InfoTableData;