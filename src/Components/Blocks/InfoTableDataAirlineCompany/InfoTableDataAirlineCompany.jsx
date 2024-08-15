import React from "react";
import classes from './InfoTableDataAirlineCompany.module.css';
import InfoTable from "../InfoTable/InfoTable";

function InfoTableDataAirlineCompany({ children, toggleRequestSidebar, requests, openDeleteComponent, toggleRequestEditNumber, openDeleteNomerComponent, ...props }) {

    return (
        <InfoTable>
            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <div key={index}>
                        <div
                            className={classes.InfoTable_data}
                        >
                            <div className={`${classes.InfoTable_data_elem}`}>
                                <div className={classes.InfoTable_data_elem_title}>{item.type}</div>
                            </div>

                            <div className={classes.infoTable_buttons}>
                                <img src="/editPassenger.png" alt="Edit" onClick={() => toggleRequestSidebar(item)} />
                                <img src="/deletePassenger.png" alt="Delete" onClick={() => openDeleteComponent(index)} />
                            </div>

                        </div>
                        <div className={classes.InfoTable_BottomInfo}>
                            {item.numbers.map((employee, employeeIndex) => (
                                <div className={`${classes.InfoTable_BottomInfo__item}`} key={employeeIndex}>
                                    <div className={`${classes.InfoTable_BottomInfo__item___elem}`}>
                                        <img src={`/${employee.avatar}`} alt="avatar" className={classes.employeeAvatar} />
                                        <div className={classes.employeeInfo}>
                                            <div className={classes.employeeName}>{employee.fio}</div>
                                            <div className={classes.employeePost}>{employee.post}</div>
                                        </div>
                                        <div className={classes.infoTable_buttons}>
                                            <img src="/editPassenger.png" alt="Edit" onClick={() => toggleRequestEditNumber(employee, item.type)} />
                                            <img src="/deletePassenger.png" alt="Delete" onClick={() => openDeleteNomerComponent(employee, item.type)} />
                                        </div>
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

export default InfoTableDataAirlineCompany;
