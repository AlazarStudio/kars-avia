import React from "react";
import classes from './InfoTableDataAirlineCompany.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { server } from "../../../../graphQL_requests";

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
                                <div className={classes.InfoTable_data_elem_title}>{item.name}</div>
                            </div>

                            <div className={classes.infoTable_buttons}>
                                <img src="/editPassenger.png" alt="Edit" onClick={() => toggleRequestSidebar(item)} />
                                <img src="/deletePassenger.png" alt="Delete" onClick={() => openDeleteComponent(index, item.id)} />
                            </div>

                        </div>
                        <div className={classes.InfoTable_BottomInfo}>
                            {item.users.map((employee, employeeIndex) => (
                                <div className={`${classes.InfoTable_BottomInfo__item}`} key={employeeIndex}>
                                    <div className={`${classes.InfoTable_BottomInfo__item___elem}`}>
                                        <div className={classes.employeeImg}>
                                            <img src={`${server}${employee.images[0]}`} alt="avatar" className={classes.employeeAvatar} />
                                        </div>
                                        <div className={classes.employeeInfo}>
                                            <div className={classes.employeeName}>{employee.name}</div>
                                            <div className={classes.employeePost}>{employee.role}</div>
                                            <div className={classes.employeePost}>{employee.position}</div>
                                        </div>
                                        <div className={classes.infoTable_buttons}>
                                            <img src="/editPassenger.png" alt="Edit" onClick={() => toggleRequestEditNumber(employee, item.name)} />
                                            <img src="/deletePassenger.png" alt="Delete" onClick={() => openDeleteNomerComponent(employee, item.name)} />
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
