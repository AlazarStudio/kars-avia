import React, { useState } from "react";
import classes from './InfoTableDataAirlineCompany.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { getMediaUrl } from "../../../../graphQL_requests";
import SettingsIcon from "../../../shared/icons/SettingsIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import { menuAccess, roles } from "../../../roles";
import { canAccessMenu } from "../../../utils/access";
import ReadinessIndicator from "../ReadinessIndicator/ReadinessIndicator";
import { computeDepartmentReadiness } from "../../../utils/dispatcherDepartmentReadiness";

const collapseBtnStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "2px",
    color: "#9CA3B4",
    flexShrink: 0,
};

function InfoTableDataAirlineCompany({ children, user, representative, accessMenu, airlineId, toggleRequestSidebar, onViewOtdel, requests, openDeleteComponent, toggleRequestEditNumber, onViewEmployee, openDeleteNomerComponent, onOpenSettings, ...props }) {
    const canEditDepartment = !user?.airlineId || accessMenu.userUpdate;
    // Выдача доступов отделена от обычного взаимодействия с разделом: право
    // accessManage выдаёт суперадмин, canAccessMenu пропускает его по роли.
    const canManageAccess = canAccessMenu(accessMenu, "accessManage", user);
    const [collapsed, setCollapsed] = useState({});
    const toggleCollapse = (key) =>
        setCollapsed((c) => ({ ...c, [key]: !c[key] }));

    return (
        <InfoTable>
            <div className={classes.bottom} style={user?.airlineId && {height:"calc(100vh - 210px)"}}>
                {requests.map((item, index) => {
                    const depKey = item.id || `dep-${index}`;
                    const depOpen = !collapsed[depKey];
                    return (
                    <div key={item.id || index}>
                        <div
                            className={classes.InfoTable_data}
                        >
                            <div className={`${classes.InfoTable_data_elem}`} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <button
                                    type="button"
                                    style={collapseBtnStyle}
                                    onClick={() => toggleCollapse(depKey)}
                                    aria-label={depOpen ? "Свернуть отдел" : "Развернуть отдел"}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: depOpen ? "none" : "rotate(-90deg)", transition: "transform .18s ease" }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
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
                                {!item.isNoDepartment && <>
                                {canEditDepartment && (<EditPencilIcon cursor="pointer" strokeWidth={0.5} onClick={() => toggleRequestSidebar(item)} />)}
                                {canManageAccess && !representative && (<SettingsIcon cursor={"pointer"} onClick={() => onOpenSettings?.(item)} />)}
                                {canEditDepartment && (<DeleteIcon cursor="pointer" strokeWidth={0.5} onClick={() => openDeleteComponent(index, item.id)} />)}</>}
                            </div>

                        </div>
                        {depOpen && (
                        <div className={classes.InfoTable_BottomInfo}>
                            {item.users.map((employee, employeeIndex) => (
                                <div className={`${classes.InfoTable_BottomInfo__item}`} key={employeeIndex}>
                                    <div
                                        className={`${classes.InfoTable_BottomInfo__item___elem}`}
                                        style={onViewEmployee ? { cursor: "pointer" } : undefined}
                                        onClick={onViewEmployee ? () => onViewEmployee(employee, item.name) : undefined}
                                    >
                                        <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                                            <div className={classes.employeeImg}>
                                                <img src={employee.images?.[0] ? getMediaUrl(employee.images[0]) : '/no-avatar.png'} alt="avatar" className={classes.employeeAvatar} />
                                            </div>
                                            {user?.role === roles.superAdmin && (
                                                <span className={classes.onlineDot} style={{ background: employee.online ? '#22c55e' : '#ef4444' }} />
                                            )}
                                        </div>
                                        <div className={classes.employeeInfo}>
                                            <div className={classes.employeeName}>{employee.name}</div>
                                            <div className={classes.employeePost}>{employee.role === "AIRLINEADMIN" ? "Администратор" : "Модератор"}</div>
                                            <div className={classes.employeePost}>{employee.position?.name}</div>
                                        </div>
                                        <div
                                            className={classes.infoTable_buttons}
                                            onClick={(e) => e.stopPropagation()}
                                        >
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
                        )}
                    </div>
                    );
                })}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataAirlineCompany;
