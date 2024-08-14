import React from "react";
import classes from './InfoTableDataTarifs.module.css';
import InfoTable from "../InfoTable/InfoTable";

function InfoTableDataTarifs({ children, toggleRequestSidebar, requests, openDeleteComponent, ...props }) {

    return (
        <InfoTable>
            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <div key={index}>
                        <div
                            className={classes.InfoTable_data}
                        >
                            <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                <div className={classes.InfoTable_data_elem_title}>Тариф "{item.tarifName}"</div>
                            </div>
                            <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                <div className={classes.InfoTable_data_elem_title}>Стоимость</div>
                            </div>
                            <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                <div className={classes.InfoTable_data_elem_title}>Стоимость для авиакомпаний</div>
                            </div>

                            <div className={classes.infoTable_buttons}>
                                <img src="/editPassenger.png" alt="" onClick={() => {toggleRequestSidebar(item)}}/>
                                <img src="/deletePassenger.png" alt=""  onClick={() => openDeleteComponent(index)}/>
                            </div>

                        </div>
                        <div className={classes.InfoTable_BottomInfo}>
                            <div className={`${classes.InfoTable_BottomInfo__item}`}>
                                <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>Одноместный номер</div>
                                <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{item.tarif_сategory_one_place} р / сутки</div>
                                <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{item.tarif_airline_one_place} р / сутки</div>
                            </div>
                            <div className={`${classes.InfoTable_BottomInfo__item}`}>
                                <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>Двухместный номер</div>
                                <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{item.tarif_сategory_two_place} р / сутки</div>
                                <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{item.tarif_airline_two_place} р / сутки</div>
                            </div>
                            <div className={`${classes.InfoTable_BottomInfo__item}`}>
                                <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>Трехместный номер</div>
                                <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{item.tarif_сategory_three_place} р / сутки</div>
                                <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{item.tarif_airline_three_place} р / сутки</div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataTarifs;
