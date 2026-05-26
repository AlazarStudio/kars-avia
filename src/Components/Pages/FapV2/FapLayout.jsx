import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  GET_AIRLINE_DEPARTMENT,
  GET_DISPATCHER_DEPARTMENTS,
  getCookie,
} from "../../../../graphQL_requests";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import {
  isAirlineRole as isAirlineRoleCheck,
  isDispatcherRole as isDispatcherRoleCheck,
  isExternalUser,
} from "../../../utils/access";
import classes from "../../Pages/Main_page/Main_Page.module.css";

// Общий layout для всех страниц ФАП v2 (деталь / услуга / отчёт).
// Меню рендерится один раз, при навигации меняется только Outlet —
// раскладка не перемонтируется, нет моргания при переходах.
export default function FapLayout({ user }) {
  const token = getCookie("token");
  const [accessMenu, setAccessMenu] = useState({});
  const isDispatcherRole = isDispatcherRoleCheck(user);
  const isAirlineRole = isAirlineRoleCheck(user);
  const dispatcherDepartmentId = user?.dispatcherDepartmentId;

  const { data: airlineDepartmentData } = useQuery(GET_AIRLINE_DEPARTMENT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { airlineDepartmentId: user?.airlineDepartmentId },
    skip: !isAirlineRole || !user?.airlineDepartmentId,
  });

  const { data: dispatcherDepartmentsData } = useQuery(GET_DISPATCHER_DEPARTMENTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { pagination: { all: true } },
    skip: !isDispatcherRole,
  });

  useEffect(() => {
    if (isDispatcherRole) {
      const department =
        dispatcherDepartmentsData?.dispatcherDepartments?.departments?.find(
          (item) => item.id === dispatcherDepartmentId
        );
      setAccessMenu(department?.accessMenu || {});
      return;
    }
    if (isAirlineRole) {
      setAccessMenu(airlineDepartmentData?.airlineDepartment?.accessMenu || {});
      return;
    }
    setAccessMenu({});
  }, [isDispatcherRole, isAirlineRole, dispatcherDepartmentId, dispatcherDepartmentsData, airlineDepartmentData]);

  return (
    <div className={classes.main}>
      {!isExternalUser(user) && (
        <MenuDispetcher id="fapv2" user={user} accessMenu={accessMenu} />
      )}
      <Outlet context={{ user, accessMenu }} />
    </div>
  );
}
