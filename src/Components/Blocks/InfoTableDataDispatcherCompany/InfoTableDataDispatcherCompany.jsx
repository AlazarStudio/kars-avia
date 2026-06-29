import React, { useState } from "react";
import classes from "./InfoTableDataDispatcherCompany.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { getMediaUrl } from "../../../../graphQL_requests";
import SettingsIcon from "../../../shared/icons/SettingsIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import { canAccessMenu, isDispatcherAdmin } from "../../../utils/access";
import { roles } from "../../../roles";
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

function InfoTableDataDispatcherCompany({
  user,
  groups,
  onEditDepartment,
  onDeleteDepartment,
  onOpenAccess,
  onEditDispatcher,
  onDeleteDispatcher,
  onViewDepartment,
  onViewDispatcher,
  accessMenu,
}) {
  const canEdit = canAccessMenu(accessMenu, "userUpdate", user);
  const [collapsed, setCollapsed] = useState({});
  const toggleCollapse = (key) =>
    setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  return (
    <InfoTable>
      <div className={classes.bottom}>
        {groups.map((group, index) => {
          const depKey = group.id || `dep-${index}`;
          const depOpen = !collapsed[depKey];
          return (
          <div key={group.id || `no-department-${index}`}>
            <div className={classes.InfoTable_data}>
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
                  style={onViewDepartment && !group.isNoDepartment ? { cursor: "pointer" } : undefined}
                  onClick={onViewDepartment && !group.isNoDepartment ? () => onViewDepartment(group) : undefined}
                >
                  {group.name}
                </div>
              </div>

              <div className={classes.infoTable_buttons}>
                {!group.isNoDepartment && (() => {
                  const { done, total, groups: rGroups } = computeDepartmentReadiness(group);
                  return <ReadinessIndicator done={done} total={total} groups={rGroups} />;
                })()}
                {!group.isNoDepartment && canEdit && (
                  <>
                    <EditPencilIcon
                      cursor="pointer"
                      onClick={() => onEditDepartment?.(group)}
                    />
                    <SettingsIcon
                      cursor="pointer"
                      onClick={() => onOpenAccess?.(group)}
                    />
                    <DeleteIcon
                      cursor="pointer"
                      onClick={() => onDeleteDepartment?.(group)}
                    />
                  </>
                )}
              </div>
            </div>

            {depOpen && (
            <div className={classes.InfoTable_BottomInfo}>
              {group.dispatchers.map((dispatcher, dispatcherIndex) => (
                <div
                  className={classes.InfoTable_BottomInfo__item}
                  key={dispatcher.id || dispatcherIndex}
                >
                  <div
                    className={classes.InfoTable_BottomInfo__item___elem}
                    style={onViewDispatcher ? { cursor: "pointer" } : undefined}
                    onClick={onViewDispatcher ? () => onViewDispatcher(dispatcher) : undefined}
                  >
                    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                      <div className={classes.employeeImg}>
                        <img
                          src={
                            dispatcher.images?.[0]
                              ? getMediaUrl(dispatcher.images[0])
                              : "/no-avatar.png"
                          }
                          alt="avatar"
                          className={classes.employeeAvatar}
                        />
                      </div>
                      {user?.role === roles.superAdmin && (
                        <span className={classes.onlineDot} style={{ background: dispatcher.online ? '#22c55e' : '#ef4444' }} />
                      )}
                    </div>
                    <div className={classes.employeeInfo}>
                      <div className={classes.employeeName}>
                        {dispatcher.name}
                      </div>
                      <div className={classes.employeePost}>
                        {dispatcher?.position?.name}
                      </div>
                    </div>
                    {canEdit && (
                      <div
                        className={classes.infoTable_buttons}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EditPencilIcon
                          cursor="pointer"
                          onClick={() => onEditDispatcher?.(dispatcher)}
                        />
                        <DeleteIcon
                          cursor="pointer"
                          onClick={() => onDeleteDispatcher?.(dispatcher)}
                        />
                      </div>
                    )}
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

export default InfoTableDataDispatcherCompany;
