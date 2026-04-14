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
import { useToast } from "../../../contexts/ToastContext";
import { canAccessMenu } from "../../../utils/access";
import { useNavigate } from "react-router-dom";
import InfoTableDataDispatcherCompany from "../InfoTableDataDispatcherCompany/InfoTableDataDispatcherCompany";
import CreateRequestDispatcherCompany from "../CreateRequestDispatcherCompany/CreateRequestDispatcherCompany";
import ExistRequestDispatcherCompany from "../ExistRequestDispatcherCompany/ExistRequestDispatcherCompany";
import CreateRequestDispatcherDepartment from "../CreateRequestDispatcherDepartment/CreateRequestDispatcherDepartment";
import EditRequestDispatcherDepartment from "../EditRequestDispatcherDepartment/EditRequestDispatcherDepartment";
import ExistRequestCompany from "../ExistRequestCompany/ExistRequestCompany";
import SettingsSidebar from "../SettingsSidebar/SettingsSidebar";

function Company({ user, accessMenu }) {
  const token = getCookie("token");
  const navigate = useNavigate();
  const { success, error: notifyError } = useToast();
  const canCreate = canAccessMenu(accessMenu, "userCreate", user);
  const canEdit = canAccessMenu(accessMenu, "userUpdate", user);

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
    refetch: refetchPositions,
  } = useQuery(GET_DISPATCHER_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [departments, setDepartments] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (!dispatchersData?.dispatcherUsers?.users) return;
    const users = dispatchersData.dispatcherUsers.users;
    setDispatchers((prev) => {
      const copied = users.map((d) => {
        const positionFromData = d.position
          ? { ...d.position }
          : d.position;
        const prevDispatcher = prev.find((p) => p.id === d.id);
        const position =
          positionFromData ??
          (prevDispatcher?.position
            ? { ...prevDispatcher.position }
            : positionFromData);
        return { ...d, position };
      });
      return [...copied].sort((a, b) => a.name.localeCompare(b.name));
    });
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

  const [showSettingsSidebar, setShowSettingsSidebar] = useState(false);
  const [selectedDepartmentForSettings, setSelectedDepartmentForSettings] = useState(null);
  const settingsSidebarRef = useRef(null);

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

  const [dispatcherEditMode, setDispatcherEditMode] = useState(false);
  const [departmentEditMode, setDepartmentEditMode] = useState(false);

  const openViewDepartment = (department) => {
    setSelectedDepartment(department);
    setDepartmentEditMode(false);
    setShowEditDepartment(true);
  };

  const openEditDepartment = (department) => {
    if (!canEdit) return;
    setSelectedDepartment(department);
    setDepartmentEditMode(true);
    setShowEditDepartment(true);
  };

  const openViewDispatcher = (dispatcher) => {
    const index = dispatchers.findIndex((item) => item.id === dispatcher.id);
    setSelectedDispatcher({ ...dispatcher, index });
    setDispatcherEditMode(false);
    setShowEditDispatcher(true);
  };

  const openEditDispatcher = (dispatcher) => {
    if (!canEdit) return;
    const index = dispatchers.findIndex((item) => item.id === dispatcher.id);
    setSelectedDispatcher({ ...dispatcher, index });
    setDispatcherEditMode(true);
    setShowEditDispatcher(true);
  };

  const openAccessDepartment = (department) => {
    if (!canEdit) return;
    setSelectedDepartmentForSettings(department);
    setShowSettingsSidebar(true);
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
        success("Удаление отдела прошло успешно.");
        refetchDepartments();
      }

      if (deleteTarget.type === "dispatcher") {
        await deleteDispatcherUser({
          variables: {
            deleteUserId: deleteTarget.dispatcher.id,
          },
        });
        success("Удаление диспетчера прошло успешно.");
        refetchDispatchers();
        refetchDepartments();
      }
    } catch (error) {
      console.error("Ошибка при удалении", error);
      notifyError("Ошибка при удалении.");
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
            onViewDepartment={openViewDepartment}
            onDeleteDepartment={openDeleteDepartment}
            onOpenAccess={openAccessDepartment}
            onEditDispatcher={openEditDispatcher}
            onViewDispatcher={openViewDispatcher}
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
            onPositionCreated={(newPosition) => {
              setPositions((prev) =>
                [...(prev || []), newPosition].sort((a, b) =>
                  String(a?.name || "").localeCompare(String(b?.name || ""))
                )
              );
              refetchPositions();
            }}
            positions={positions}
            departments={departments}
          />
        )}

        {canEdit && (
          <ExistRequestCompany
            show={showEditDispatcher}
            onClose={() => setShowEditDispatcher(false)}
            chooseObject={selectedDispatcher}
            updateDispatcher={() => {}}
            openDeleteComponent={openDeleteDispatcherFromSidebar}
            positions={positions}
            departments={departments}
            initialEditMode={dispatcherEditMode}
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
          />
        )}

        {canEdit && (
          <EditRequestDispatcherDepartment
            show={showEditDepartment}
            onClose={() => setShowEditDepartment(false)}
            department={selectedDepartment}
            refetchDepartments={refetchDepartments}
            initialEditMode={departmentEditMode}
            onUpdated={() => refetchDepartments()}
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

        <SettingsSidebar
          show={showSettingsSidebar}
          sidebarRef={settingsSidebarRef}
          onClose={() => {
            setShowSettingsSidebar(false);
            setSelectedDepartmentForSettings(null);
          }}
          user={user}
          departmentId={selectedDepartmentForSettings?.id}
          departmentItem={selectedDepartmentForSettings}
          type="dispatcher"
        />
      </div>
    </>
  );
}

export default Company;
