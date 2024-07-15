import React from "react";
import classes from './InfoTableData.module.css';
import InfoTable from "../InfoTable/InfoTable";

function InfoTableData({ children, toggleRequestSidebar, ...props }) {
    
    return (
        <InfoTable >
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Дата</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Авиакомпания</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Аэропорт</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Прибытие</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Отъезд</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Статус</div>
            </div>

            <div className={classes.bottom}>
                <div className={classes.InfoTable_data} onClick={toggleRequestSidebar}>
                    <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>01</div>
                    <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                        <div className={classes.InfoTable_data_elem_information}>
                            <div className={classes.InfoTable_data_elem_title}>Иванов И.И.</div>
                            <div className={classes.InfoTable_data_elem_moreInfo}>
                                КВС
                            </div>
                        </div>
                    </div>
                    <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>17 май 2024</div>
                    <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                        <div className={classes.InfoTable_data_elem_img}>
                            <img src="/azimut_preview.png" alt="" />
                        </div>
                        Азимут
                    </div>
                    <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>MRV</div>
                    <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                        <div className={classes.InfoTable_data_elem_information}>
                            <div className={classes.InfoTable_data_elem_title}>РС№002435</div>
                            <div className={classes.InfoTable_data_elem_moreInfo}>
                                <span><img src="/calendar.png" alt="" /> 17.05.2024</span>
                                <span><img src="/time.png" alt="" /> 13.50</span>
                            </div>
                        </div>
                    </div>
                    <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                        <div className={classes.InfoTable_data_elem_information}>
                            <div className={classes.InfoTable_data_elem_title}>РС№002435</div>
                            <div className={classes.InfoTable_data_elem_moreInfo}>
                                <span><img src="/calendar.png" alt="" /> 17.05.2024</span>
                                <span><img src="/time.png" alt="" /> 13.50</span>
                            </div>
                        </div></div>
                    <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                        <div className={classes.InfoTable_data_elem_position}>
                            <div className={classes.processing}></div>
                            В обработке
                        </div>
                    </div>
                </div>
            </div>
        </InfoTable>
    );
}

export default InfoTableData;