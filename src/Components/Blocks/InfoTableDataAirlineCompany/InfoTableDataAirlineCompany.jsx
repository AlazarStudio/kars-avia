import React from "react";
import classes from './InfoTableDataAirlineCompany.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { getMediaUrl } from "../../../../graphQL_requests";
import SettingsIcon from "../../../shared/icons/SettingsIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import { useNavigate } from "react-router-dom";
import { menuAccess } from "../../../roles";

function InfoTableDataAirlineCompany({ children, user, representative, accessMenu, airlineId, toggleRequestSidebar, requests, openDeleteComponent, toggleRequestEditNumber, openDeleteNomerComponent, onOpenSettings, ...props }) {
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
                                <><EditPencilIcon cursor="pointer" strokeWidth={0.5} onClick={() => toggleRequestSidebar(item)} />
                                {/* <img src="/settings.png" alt="Edit" onClick={() => toggleRequestSidebar(item)} /> */}
                                {!representative && (<SettingsIcon cursor={"pointer"} strokeWidth={0.5} onClick={() => onOpenSettings ? onOpenSettings(item) : navigate("/airlineAccess", { state:{ item: item, airlineId: airlineId } } )} />)}
                                <DeleteIcon cursor="pointer" strokeWidth={0.5} onClick={() => openDeleteComponent(index, item.id)} /></>}
                            </div>

                        </div>
                        <div className={classes.InfoTable_BottomInfo}>
                            {item.users.map((employee, employeeIndex) => (
                                <div className={`${classes.InfoTable_BottomInfo__item}`} key={employeeIndex}>
                                    <div className={`${classes.InfoTable_BottomInfo__item___elem}`}>
                                        <div className={classes.employeeImg}>
                                            <img src={getMediaUrl(employee.images[0]) ?? '/no-avatar.png'} alt="avatar" className={classes.employeeAvatar} />
                                        </div>
                                        <div className={classes.employeeInfo}>
                                            <div className={classes.employeeName}>{employee.name}</div>
                                            <div className={classes.employeePost}>{employee.role === "AIRLINEADMIN" ? "Администратор" : "Модератор"}</div>
                                            <div className={classes.employeePost}>{employee.position?.name}</div>
                                        </div>
                                        <div className={classes.infoTable_buttons}>
                                            <EditPencilIcon cursor="pointer" strokeWidth={0.5} onClick={() => toggleRequestEditNumber(employee, item.name)} /> 
                                            {(!user?.airlineId || accessMenu.userUpdate) && 
                                            <>
                                                <DeleteIcon cursor="pointer" strokeWidth={0.5} onClick={() => openDeleteNomerComponent(employee, item.name)} />
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
