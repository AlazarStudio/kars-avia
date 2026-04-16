import React, { useEffect, useState } from "react";
import FapDetail from "../../Blocks/FapV2/FapDetail/FapDetail";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import {
  GET_AIRLINE_DEPARTMENT,
  GET_DISPATCHER_DEPARTMENTS,
  getCookie,
} from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";
import {
  isAirlineRole as isAirlineRoleCheck,
  isDispatcherRole as isDispatcherRoleCheck,
} from "../../../utils/access";
import classes from "../../Pages/Main_page/Main_Page.module.css";

export default function FapDetailPage({ user }) {
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

  const { data: dispatcherDepartmentsData } = useQuery(
    GET_DISPATCHER_DEPARTMENTS,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      variables: { pagination: { all: true } },
      skip: !isDispatcherRole,
    }
  );

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
      <MenuDispetcher id="fapv2" user={user} accessMenu={accessMenu} />
      <FapDetail user={user} />
    </div>
  );
}
