import React from "react";
import classes from './InfoTableDataAirlineCompany.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { server } from "../../../../graphQL_requests";
import SettingsIcon from "../../../shared/icons/SettingsIcon";
import { useNavigate } from "react-router-dom";
import { menuAccess } from "../../../roles";

function InfoTableDataAirlineCompany({ children, user, representative, accessMenu, airlineId, toggleRequestSidebar, requests, openDeleteComponent, toggleRequestEditNumber, openDeleteNomerComponent, ...props }) {
    const navigate = useNavigate();

    return (
        <InfoTable>
            <div className={classes.bottom} style={user?.airlineId && {height:"calc(100vh - 210px)"}}>
                {requests.map((item, index) => (
                    <div key={index}>
                        <div
                            className={classes.InfoTable_data}
                        >
                            <div className={`${classes.InfoTable_data_elem}`}>
                                <div className={classes.InfoTable_data_elem_title}>{item.name}</div>
                            </div>

                            <div className={classes.infoTable_buttons}>
                                {(!user?.airlineId || accessMenu.userUpdate) && 
                                <><img src="/editPassenger.png" alt="Edit" onClick={() => toggleRequestSidebar(item)} />
                                {/* <img src="/settings.png" alt="Edit" onClick={() => toggleRequestSidebar(item)} /> */}
                                {!representative && (<SettingsIcon cursor={"pointer"} strokeWidth={0.5} onClick={() => navigate("/access", { state:{ item: item, airlineId: airlineId } } )} />)}
                                <img src="/deletePassenger.png" alt="Delete" onClick={() => openDeleteComponent(index, item.id)} /></>}
                            </div>

                        </div>
                        <div className={classes.InfoTable_BottomInfo}>
                            {item.users.map((employee, employeeIndex) => (
                                <div className={`${classes.InfoTable_BottomInfo__item}`} key={employeeIndex}>
                                    <div className={`${classes.InfoTable_BottomInfo__item___elem}`}>
                                        <div className={classes.employeeImg}>
                                            <img src={ employee.images[0] ? `${server}${employee.images[0]}` : '/no-avatar.png'} alt="avatar" className={classes.employeeAvatar} />
                                        </div>
                                        <div className={classes.employeeInfo}>
                                            <div className={classes.employeeName}>{employee.name}</div>
                                            <div className={classes.employeePost}>{employee.role === "AIRLINEADMIN" ? "Администратор" : "Модератор"}</div>
                                            <div className={classes.employeePost}>{employee.position?.name}</div>
                                        </div>
                                        <div className={classes.infoTable_buttons}>
                                            <img src="/editPassenger.png" alt="Edit" onClick={() => toggleRequestEditNumber(employee, item.name)} /> 
                                            {(!user?.airlineId || accessMenu.userUpdate) && 
                                            <>
                                                <img src="/deletePassenger.png" alt="Delete" onClick={() => openDeleteNomerComponent(employee, item.name)} />
                                            </>}
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
