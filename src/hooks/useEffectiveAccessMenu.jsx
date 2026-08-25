import { useMemo } from "react";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_AIRLINE_DEPARTMENT,
  GET_DISPATCHER_DEPARTMENTS,
  GET_USER_EFFECTIVE_ACCESS_MENU,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  getCookie,
} from "../../graphQL_requests";
import {
  isAirlineRole as isAirlineRoleCheck,
  isDispatcherRole as isDispatcherRoleCheck,
  resolveEffectiveAccessMenu,
} from "../utils/access";

// Единый источник резолюции доступа для ЛЮБОЙ роли (диспетчер, авиакомпания,
// гостиница и т.д.). Мёрж: { ...отдел, ...effective } — серверный
// effectiveAccessMenu (учитывает приоритет должности над отделом; null у
// должности → наследование отдела) спредится ПОСЛЕДНИМ и побеждает по
// каждому ключу; отдел — база/фолбэк. У ролей без отдела (гостиница) базы нет,
// но per-user слой (User.accessMenu) бэк резолвит и без него.
export function useEffectiveAccessMenu(user) {
  const token = getCookie("token");
  const isDispatcherRole = isDispatcherRoleCheck(user);
  const isAirlineRole = isAirlineRoleCheck(user);
  const dispatcherDepartmentId = user?.dispatcherDepartmentId;

  const { data: airlineDepartmentData, refetch: refetchAirlineDepartment } =
    useQuery(GET_AIRLINE_DEPARTMENT, {
      context: { headers: { Authorization: `Bearer ${token}` } },
      variables: { airlineDepartmentId: user?.airlineDepartmentId },
      skip: !isAirlineRole || !user?.airlineDepartmentId,
    });

  const { data: dispatcherDepartmentsData } = useQuery(GET_DISPATCHER_DEPARTMENTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { pagination: { all: true } },
    skip: !isDispatcherRole,
  });

  const { data: effectiveData, refetch: refetchEffective } = useQuery(
    GET_USER_EFFECTIVE_ACCESS_MENU,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      variables: { userId: user?.userId },
      skip: !user?.userId,
    }
  );

  useSubscription(GET_AIRLINES_UPDATE_SUBSCRIPTION, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    skip: !isAirlineRole || !user?.airlineDepartmentId,
    onData: () => {
      refetchAirlineDepartment();
      refetchEffective();
    },
  });

  return useMemo(() => {
    const department = dispatcherDepartmentsData?.dispatcherDepartments?.departments?.find(
      (item) => item.id === dispatcherDepartmentId
    );
    const departmentAccessMenu = isDispatcherRole
      ? department?.accessMenu
      : airlineDepartmentData?.airlineDepartment?.accessMenu;

    return resolveEffectiveAccessMenu({
      isDispatcherRole,
      isAirlineRole,
      departmentAccessMenu,
      effectiveAccessMenu: effectiveData?.user?.effectiveAccessMenu,
    });
  }, [
    isDispatcherRole,
    isAirlineRole,
    dispatcherDepartmentId,
    dispatcherDepartmentsData,
    airlineDepartmentData,
    effectiveData,
  ]);
}
