import React from "react";
import classes from './InfoTableDataAirlineCompany.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { getMediaUrl } from "../../../../graphQL_requests";
import SettingsIcon from "../../../shared/icons/SettingsIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import { useNavigate } from "react-router-dom";
import { menuAccess, roles } from "../../../roles";
import ReadinessIndicator from "../ReadinessIndicator/ReadinessIndicator";
import { computeDepartmentReadiness } from "../../../utils/dispatcherDepartmentReadiness";

function InfoTableDataAirlineCompany({ children, user, representative, accessMenu, airlineId, toggleRequestSidebar, onViewOtdel, requests, openDeleteComponent, toggleRequestEditNumber, onViewEmployee, openDeleteNomerComponent, onOpenSettings, ...props }) {
    const navigate = useNavigate();

    return (
        <InfoTable>
            <div className={classes.bottom} style={user?.airlineId && {height:"calc(100vh - 210px)"}}>
                {requests.map((item, index) => (
                    <div key={item.id || index}>
                        <div
                            className={classes.InfoTable_data}
                        >
                            <div className={`${classes.InfoTable_data_elem}`}>
                                <div
                                    className={classes.InfoTable_data_elem_title}
                                    style={onViewOtdel && !item.isNoDepartment ? { cursor: "pointer" } : undefined}
                                    onClick={onViewOtdel && !item.isNoDepartment ? () => onViewOtdel(item) : undefined}
                                >{item.name}</div>
                            </div>

                            <div className={classes.infoTable_buttons}>
                                {!item.isNoDepartment && (() => {
                                  const { done, total, groups: rGroups } = computeDepartmentReadiness(item);
                                  return <ReadinessIndicator done={done} total={total} groups={rGroups} />;
                                })()}
                                {(!user?.airlineId || accessMenu.userUpdate) && !item.isNoDepartment &&
                                <><EditPencilIcon cursor="pointer" strokeWidth={0.5} onClick={() => toggleRequestSidebar(item)} />
                                {!representative && (<SettingsIcon cursor={"pointer"} onClick={() => onOpenSettings ? onOpenSettings(item) : navigate("/airlineAccess", { state:{ item: item, airlineId: airlineId } } )} />)}
                                <DeleteIcon cursor="pointer" strokeWidth={0.5} onClick={() => openDeleteComponent(index, item.id)} /></>}
                            </div>

                        </div>
                        <div className={classes.InfoTable_BottomInfo}>
                            {item.users.map((employee, employeeIndex) => (
                                <div className={`${classes.InfoTable_BottomInfo__item}`} key={employeeIndex}>
                                    <div className={`${classes.InfoTable_BottomInfo__item___elem}`}>
                                        <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                                            <div className={classes.employeeImg}>
                                                <img src={employee.images?.[0] ? getMediaUrl(employee.images[0]) : '/no-avatar.png'} alt="avatar" className={classes.employeeAvatar} />
                                            </div>
                                            {user?.role === roles.superAdmin && (
                                                <span className={classes.onlineDot} style={{ background: employee.online ? '#22c55e' : '#ef4444' }} />
                                            )}
                                        </div>
                                        <div
                                            className={classes.employeeInfo}
                                            style={onViewEmployee ? { cursor: "pointer" } : undefined}
                                            onClick={onViewEmployee ? () => onViewEmployee(employee, item.name) : undefined}
                                        >
                                            <div className={classes.employeeName}>{employee.name}</div>
                                            <div className={classes.employeePost}>{employee.role === "AIRLINEADMIN" ? "Администратор" : "Модератор"}</div>
                                            <div className={classes.employeePost}>{employee.position?.name}</div>
                                        </div>
                                        <div className={classes.infoTable_buttons}>
                                            {(!user?.airlineId || accessMenu.userUpdate) && 
                                            <>
                                                <EditPencilIcon cursor="pointer" strokeWidth={0.5} onClick={() => toggleRequestEditNumber(employee, item.name)} /> 
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
