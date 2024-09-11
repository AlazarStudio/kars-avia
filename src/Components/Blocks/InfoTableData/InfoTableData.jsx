import React from "react";
import classes from './InfoTableData.module.css';
import InfoTable from "../InfoTable/InfoTable";

function InfoTableData({ children, toggleRequestSidebar, requests, setChooseObject, ...props }) {
    const handleObject = () => {
        setChooseObject([
            {
                room: '',
                place: '',
                start: '2024-07-26',
                startTime: '14:00',
                end: '2024-07-31',
                endTime: '10:00',
                client: 'Джатдоев А. С-А.',
                public: false,
            }
        ])
        toggleRequestSidebar()
    }
    function convertToDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString(); // возвращает дату в удобном для чтения формате
    }
    return (
        <InfoTable >
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w8}`}>Дата заявки</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Авиакомпания</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Аэропорт</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Прибытие</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Отъезд</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Статус</div>
            </div>

            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <div className={classes.InfoTable_data} onClick={handleObject} key={index}>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{index + 1}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.fullName}</div>
                                <div className={classes.InfoTable_data_elem_moreInfo}>{item.position}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w8}`}>{convertToDate(Number(item.createdAt))}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_img}>
                                <img src={`/${item.aviacompany_icon}`} alt="" />
                            </div>
                            {/* {item.airlineId} */}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>{item.airport}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.arrival.flight}</div>
                                <div className={classes.InfoTable_data_elem_moreInfo}>
                                    <span><img src="/calendar.png" alt="" /> {item.arrival.date}</span>
                                    <span><img src="/time.png" alt="" /> {item.arrival.time}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.departure.flight}</div>
                                <div className={classes.InfoTable_data_elem_moreInfo}>
                                    <span><img src="/calendar.png" alt="" /> {item.departure.date}</span>
                                    <span><img src="/time.png" alt="" /> {item.departure.time}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                            <div className={classes.InfoTable_data_elem_position}>
                                <div className={item.status}></div>
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