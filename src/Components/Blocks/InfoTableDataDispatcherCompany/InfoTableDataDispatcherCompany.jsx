import React from "react";
import classes from "./InfoTableDataDispatcherCompany.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { getMediaUrl } from "../../../../graphQL_requests";
import SettingsIcon from "../../../shared/icons/SettingsIcon";
import { canAccessMenu, isDispatcherAdmin } from "../../../utils/access";

function InfoTableDataDispatcherCompany({
  user,
  groups,
  onEditDepartment,
  onDeleteDepartment,
  onOpenAccess,
  onEditDispatcher,
  onDeleteDispatcher,
  accessMenu,
}) {
  const canEdit = canAccessMenu(accessMenu, "userUpdate", user);

  return (
    <InfoTable>
      <div className={classes.bottom}>
        {groups.map((group, index) => (
          <div key={group.id || `no-department-${index}`}>
            <div className={classes.InfoTable_data}>
              <div className={`${classes.InfoTable_data_elem}`}>
                <div className={classes.InfoTable_data_elem_title}>
                  {group.name}
                </div>
              </div>

              <div className={classes.infoTable_buttons}>
                {!group.isNoDepartment && canEdit && (
                  <>
                    <img
                      src="/editPassenger.png"
                      alt="Edit"
                      onClick={() => onEditDepartment?.(group)}
                    />
                    <SettingsIcon
                      cursor={"pointer"}
                      strokeWidth={0.5}
                      onClick={() => onOpenAccess?.(group)}
                    />
                    <img
                      src="/deletePassenger.png"
                      alt="Delete"
                      onClick={() => onDeleteDepartment?.(group)}
                    />
                  </>
                )}
              </div>
            </div>

            <div className={classes.InfoTable_BottomInfo}>
              {/* {group.dispatchers.length === 0 && (
                <div className={classes.emptyDepartment}>Нет диспетчеров</div>
              )} */}
              {group.dispatchers.map((dispatcher, dispatcherIndex) => (
                <div
                  className={classes.InfoTable_BottomInfo__item}
                  key={dispatcher.id || dispatcherIndex}
                >
                  <div className={classes.InfoTable_BottomInfo__item___elem}>
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
                    <div className={classes.employeeInfo}>
                      <div className={classes.employeeName}>
                        {dispatcher.name}
                      </div>
                      <div className={classes.employeePost}>
                        {isDispatcherAdmin(dispatcher)
                          ? "Администратор"
                          : "Модератор"}
                      </div>
                      <div className={classes.employeePost}>
                        {dispatcher?.position?.name}
                      </div>
                    </div>
                    {canEdit && (
                      <div className={classes.infoTable_buttons}>
                        <img
                          src="/editPassenger.png"
                          alt="Edit"
                          onClick={() => onEditDispatcher?.(dispatcher)}
                        />
                        <img
                          src="/deletePassenger.png"
                          alt="Delete"
                          onClick={() => onDeleteDispatcher?.(dispatcher)}
                        />
                      </div>
                    )}
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

export default InfoTableDataDispatcherCompany;
