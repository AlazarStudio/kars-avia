import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./Сompany.module.css";
import Filter from "../Filter/Filter";
import Header from "../Header/Header";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  DELETE_DISPATCHER_DEPARTMENT,
  DELETE_DISPATCHER_USER,
  GET_ALL_DISPATCHERS,
  GET_DISPATCHER_DEPARTMENTS,
  GET_DISPATCHER_POSITIONS,
  GET_DISPATCHERS_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import Notification from "../../Notification/Notification";
import { fullNotifyTime, notifyTime, roles } from "../../../roles";
import { useNavigate } from "react-router-dom";
import InfoTableDataDispatcherCompany from "../InfoTableDataDispatcherCompany/InfoTableDataDispatcherCompany";
import CreateRequestDispatcherCompany from "../CreateRequestDispatcherCompany/CreateRequestDispatcherCompany";
import ExistRequestDispatcherCompany from "../ExistRequestDispatcherCompany/ExistRequestDispatcherCompany";
import CreateRequestDispatcherDepartment from "../CreateRequestDispatcherDepartment/CreateRequestDispatcherDepartment";
import EditRequestDispatcherDepartment from "../EditRequestDispatcherDepartment/EditRequestDispatcherDepartment";

function Company({ user, accessMenu }) {
  const token = getCookie("token");
  const navigate = useNavigate();
  const canCreate = !!accessMenu?.userCreate || user?.role === roles.superAdmin;
  const canEdit = !!accessMenu?.userUpdate || user?.role === roles.superAdmin;

  const {
    loading: dispatchersLoading,
    error: dispatchersError,
    data: dispatchersData,
    refetch: refetchDispatchers,
  } = useQuery(GET_ALL_DISPATCHERS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    loading: departmentsLoading,
    error: departmentsError,
    data: departmentsData,
    refetch: refetchDepartments,
  } = useQuery(GET_DISPATCHER_DEPARTMENTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: { all: true },
    },
  });

  // console.log(dispatchersData)
  // console.log(departmentsData)

  const { data: dataSubscription } = useSubscription(
    GET_DISPATCHERS_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const {
    loading: positionsLoading,
    error: positionsError,
    data: positionsData,
  } = useQuery(GET_DISPATCHER_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const [departments, setDepartments] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (dispatchersData?.dispatcherUsers?.users) {
      const sortedDispatchers = [...dispatchersData.dispatcherUsers.users].sort(
        (a, b) => a.name.localeCompare(b.name)
      );
      setDispatchers(sortedDispatchers);
    }
  }, [dispatchersData]);

  useEffect(() => {
    if (departmentsData?.dispatcherDepartments?.departments) {
      const sortedDepartments = [
        ...departmentsData.dispatcherDepartments.departments,
      ].sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(sortedDepartments);
    }
  }, [departmentsData]);

  useEffect(() => {
    if (positionsData) {
      setPositions(positionsData?.getDispatcherPositions);
    }
  }, [positionsData]);

  useEffect(() => {
    if (dataSubscription) {
      refetchDispatchers();
      refetchDepartments();
    }
  }, [dataSubscription, refetchDispatchers, refetchDepartments]);

  const [showCreateDispatcher, setShowCreateDispatcher] = useState(false);
  const [showEditDispatcher, setShowEditDispatcher] = useState(false);
  const [selectedDispatcher, setSelectedDispatcher] = useState(null);

  const [showCreateDepartment, setShowCreateDepartment] = useState(false);
  const [showEditDepartment, setShowEditDepartment] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const deleteComponentRef = useRef();

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const [deleteDispatcherUser] = useMutation(DELETE_DISPATCHER_USER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [deleteDispatcherDepartment] = useMutation(DELETE_DISPATCHER_DEPARTMENT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const openEditDepartment = (department) => {
    if (!canEdit) return;
    setSelectedDepartment(department);
    setShowEditDepartment(true);
  };

  const openEditDispatcher = (dispatcher) => {
    if (!canEdit) return;
    const index = dispatchers.findIndex((item) => item.id === dispatcher.id);
    setSelectedDispatcher({ ...dispatcher, index });
    setShowEditDispatcher(true);
  };

  const openAccessDepartment = (department) => {
    if (!canEdit) return;
    navigate("/dispatcherAccess", {
      state: { departmentId: department?.id },
    });
  };

  const openDeleteDepartment = (department) => {
    if (!canEdit) return;
    setDeleteTarget({ type: "department", department });
    setShowDelete(true);
    setShowEditDepartment(false);
  };

  const openDeleteDispatcher = (dispatcher) => {
    if (!canEdit) return;
    setDeleteTarget({ type: "dispatcher", dispatcher });
    setShowDelete(true);
    setShowEditDispatcher(false);
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "department") {
        await deleteDispatcherDepartment({
          variables: {
            deleteDispatcherDepartmentId: deleteTarget.department.id,
          },
        });
        addNotification("Удаление отдела прошло успешно.", "success");
        refetchDepartments();
      }

      if (deleteTarget.type === "dispatcher") {
        await deleteDispatcherUser({
          variables: {
            deleteUserId: deleteTarget.dispatcher.id,
          },
        });
        addNotification("Удаление диспетчера прошло успешно.", "success");
        refetchDispatchers();
        refetchDepartments();
      }
    } catch (error) {
      console.error("Ошибка при удалении", error);
      addNotification("Ошибка при удалении.", "error");
    } finally {
      setShowDelete(false);
    }
  };

  const openDeleteDispatcherFromSidebar = (index, userId) => {
    const dispatcher = dispatchers.find((item) => item.id === userId) || {
      id: userId,
    };
    openDeleteDispatcher(dispatcher);
  };

  const filteredDispatchers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return dispatchers;

    return dispatchers.filter((dispatcher) => {
      return (
        dispatcher.name?.toLowerCase().includes(query) ||
        dispatcher.role?.toLowerCase().includes(query) ||
        dispatcher.position?.name?.toLowerCase().includes(query)
      );
    });
  }, [dispatchers, searchQuery]);

  const groups = useMemo(() => {
    const groupsList = departments.map((department) => ({
      ...department,
      dispatchers: [],
    }));

    const departmentMap = new Map(
      groupsList.map((department) => [department.id, department])
    );

    const noDepartment = {
      id: "no-department",
      name: "Без отдела",
      isNoDepartment: true,
      dispatchers: [],
    };

    filteredDispatchers.forEach((dispatcher) => {
      const department = departmentMap.get(dispatcher.dispatcherDepartmentId);
      if (department) {
        department.dispatchers.push(dispatcher);
      } else {
        noDepartment.dispatchers.push(dispatcher);
      }
    });

    const sorted = [...departmentMap.values()].map((department) => ({
      ...department,
      dispatchers: [...department.dispatchers].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));

    if (noDepartment.dispatchers.length > 0) {
      sorted.push({
        ...noDepartment,
        dispatchers: [...noDepartment.dispatchers].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      });
    }

    return sorted;
  }, [departments, filteredDispatchers]);

  const isLoading = dispatchersLoading || departmentsLoading || positionsLoading;
  const hasError = dispatchersError || departmentsError || positionsError;

  return (
    <>
      <div className={classes.section}>
        <Header>Пользователи</Header>

        <div className={classes.section_searchAndFilter}>
          <MUITextField
            label={"Поиск по аккаунтам"}
            className={classes.mainSearch}
            value={searchQuery}
            onChange={handleSearch}
          />
          {canCreate && (
            <div className={classes.section_searchAndFilter_filter}>
              <Filter
                toggleSidebar={() => setShowCreateDepartment(true)}
                handleChange={""}
                buttonTitle={"Добавить отдел"}
              />
              <Filter
                toggleSidebar={() => setShowCreateDispatcher(true)}
                handleChange={""}
                buttonTitle={"Добавить аккаунт диспетчера"}
              />
            </div>
          )}
        </div>

        {isLoading && <MUILoader />}
        {hasError && <p>Error: {hasError.message}</p>}

        {!isLoading && !hasError && (
          <InfoTableDataDispatcherCompany
            user={user}
            groups={groups}
            onEditDepartment={openEditDepartment}
            onDeleteDepartment={openDeleteDepartment}
            onOpenAccess={openAccessDepartment}
            onEditDispatcher={openEditDispatcher}
            onDeleteDispatcher={openDeleteDispatcher}
            accessMenu={accessMenu}
          />
        )}

        {canCreate && (
          <CreateRequestDispatcherCompany
            show={showCreateDispatcher}
            onClose={() => setShowCreateDispatcher(false)}
            onCreated={() => {
              refetchDispatchers();
              refetchDepartments();
            }}
            positions={positions}
            departments={departments}
            addNotification={addNotification}
          />
        )}

        {canEdit && (
          <ExistRequestDispatcherCompany
            show={showEditDispatcher}
            onClose={() => setShowEditDispatcher(false)}
            chooseObject={selectedDispatcher}
            updateDispatcher={() => {}}
            openDeleteComponent={openDeleteDispatcherFromSidebar}
            positions={positions}
            departments={departments}
            addNotification={addNotification}
            onUpdated={() => {
              refetchDispatchers();
              refetchDepartments();
            }}
          />
        )}

        {canCreate && (
          <CreateRequestDispatcherDepartment
            show={showCreateDepartment}
            onClose={() => setShowCreateDepartment(false)}
            onCreated={() => refetchDepartments()}
            addNotification={addNotification}
          />
        )}

        {canEdit && (
          <EditRequestDispatcherDepartment
            show={showEditDepartment}
            onClose={() => setShowEditDepartment(false)}
            department={selectedDepartment}
            onUpdated={() => refetchDepartments()}
            addNotification={addNotification}
          />
        )}

        {showDelete && (
          <DeleteComponent
            ref={deleteComponentRef}
            remove={handleDelete}
            close={closeDeleteComponent}
            title={`Вы действительно хотите удалить ${
              deleteTarget?.type === "dispatcher" ? "диспетчера" : "отдел"
            }?`}
          />
        )}

        {notifications.map((n, index) => (
          <Notification
            key={n.id}
            text={n.text}
            status={n.status}
            index={index}
            time={notifyTime}
            onClose={() => {
              setNotifications((prev) =>
                prev.filter((notif) => notif.id !== n.id)
              );
            }}
          />
        ))}
      </div>
    </>
  );
}

export default Company;
