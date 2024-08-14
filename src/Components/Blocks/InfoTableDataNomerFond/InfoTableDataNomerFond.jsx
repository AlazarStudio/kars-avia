import React from "react";
import classes from './InfoTableDataNomerFond.module.css';
import InfoTable from "../InfoTable/InfoTable";

function InfoTableDataNomerFond({ children, toggleRequestSidebar, requests, openDeleteComponent, toggleRequestEditNumber, ...props }) {

    return (
        <InfoTable>
            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <div key={index}>
                        <div
                            className={classes.InfoTable_data}
                        >
                            <div className={`${classes.InfoTable_data_elem}`}>
                                <div className={classes.InfoTable_data_elem_title}>{item.type}-местные</div>
                            </div>

                            <div className={classes.infoTable_buttons}>
                                <img src="/editPassenger.png" alt="" onClick={() => toggleRequestSidebar(item)} />
                                <img src="/deletePassenger.png" alt="" onClick={() => openDeleteComponent(index)} />
                            </div>

                        </div>
                        <div className={classes.InfoTable_BottomInfo}>
                            <div className={`${classes.InfoTable_BottomInfo__item}`}>
                                {item.numbers.map((elem, index) => (
                                    <div className={`${classes.InfoTable_BottomInfo__item___elem}`} key={index}>
                                        {elem}
                                        <div className={classes.infoTable_buttons}>
                                            <img src="/editPassenger.png" alt="" onClick={() => toggleRequestEditNumber(elem, item.type)}/>
                                            <img src="/deletePassenger.png" alt="" />
                                        </div>
                                    </div>

                                ))}
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataNomerFond;
