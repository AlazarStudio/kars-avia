import React, { useEffect, useState } from "react";
import classes from './InfoTableDataReserve_passengers.module.css';
import InfoTable from "../InfoTable/InfoTable";
import Button from "../../Standart/Button/Button";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import ChooseHotel from "../ChooseHotel/ChooseHotel";

function InfoTableDataReserve_passengers({ children, placement, toggleUpdateSidebar, setIdPassangerForUpdate, openDeletecomponent, toggleChooseHotel, user, ...props }) {
    const handleUpdate = (id) => {
        toggleUpdateSidebar()
        setIdPassangerForUpdate(id)
    }

    return (
        <InfoTable >
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Пол</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Номер телефона</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Прибытие</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Отъезд</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Действия</div>
            </div>

            <div className={classes.bottom}>
                {placement.map((item, index) => (
                    <div className={classes.InfoTable_data} key={index}>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{index + 1}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>{item.client}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>{item.sex}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>{item.phone}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <span><img src="/calendar.png" alt="" /> {item.start}</span>
                            <span><img src="/time.png" alt="" /> {item.startTime}</span>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <span><img src="/calendar.png" alt="" /> {item.end}</span>
                            <span><img src="/time.png" alt="" /> {item.endTime}</span>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <img src="/editPassenger.png" alt="" onClick={() => handleUpdate(index)} />
                            <img src="/deletePassenger.png" alt="" onClick={() => openDeletecomponent(index)} />
                        </div>
                    </div>
                ))}
            </div>


            <div className={classes.counting}>
                <div className={classes.countingPeople}>
                    <img src="/peopleCount.png" alt="" />
                    {placement.length} человек
                </div>
                {/* {(user.role == 'SUPERADMIN' || user.role == 'DISPATCHERADMIN') &&
                    <Button onClick={toggleChooseHotel}>Разместить <img src="/user-check.png" alt="" /></Button>
                } */}
            </div>

        </InfoTable>


    );
}

export default InfoTableDataReserve_passengers;