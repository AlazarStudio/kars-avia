import React from "react";
import classes from './InfoTableDataTarifs.module.css';
import InfoTable from "../InfoTable/InfoTable";

function InfoTableDataTarifs({ children, toggleRequestSidebar, requests, openDeleteComponent, openDeleteComponentCategory, toggleEditTarifsCategory, ...props }) {
    return (
        <InfoTable>
            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <div key={index}>
                        <div
                            className={classes.InfoTable_data}
                        >
                            <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                <div className={classes.InfoTable_data_elem_title}>Тариф "{item.name}"</div>
                            </div>
                            <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                <div className={classes.InfoTable_data_elem_title}>Стоимость</div>
                            </div>
                            <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                <div className={classes.InfoTable_data_elem_title}>Стоимость для авиакомпаний</div>
                            </div>

                            <div className={classes.infoTable_buttons}>
                                <img src="/editPassenger.png" alt="" onClick={() => { toggleRequestSidebar(item) }} />
                                <img src="/deletePassenger.png" alt="" onClick={() => openDeleteComponent(index, item.id)} />
                            </div>

                        </div>
                        <div className={classes.InfoTable_BottomInfo}>
                            {item.category && [...item.category].sort((a, b) => a.name.localeCompare(b.name)).map((category, index) => (
                                <div className={`${classes.InfoTable_BottomInfo__item}`} key={index}>
                                    <div className={classes.infoTableData_items}>
                                        <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{category.name}</div>
                                        <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{category.prices.length > 0 && category.prices[0].amount} р / сутки</div>
                                        <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{category.prices.length > 0 && category.prices[0].amountair} р / сутки</div>
                                    </div>
                                    <div className={classes.infoTableData_buttons}>
                                        <img src="/editPassenger.png" alt="" onClick={() => toggleEditTarifsCategory(category, item)} />
                                        <img src="/deletePassenger.png" alt="" onClick={() => openDeleteComponentCategory(category, item)} />
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                ))}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataTarifs;
