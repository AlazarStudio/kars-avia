import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./AirlineCompany_tabComponent.module.css";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import Filter from "../Filter/Filter";

import { requestsAirlinesCompany } from "../../../requests";
import CreateRequestAirlineCompany from "../CreateRequestAirlineCompany/CreateRequestAirlineCompany";
import EditRequestAirlineOtdel from "../EditRequestAirlineOtdel/EditRequestAirlineOtdel";
import EditRequestAirlineCompany from "../EditRequestAirlineCompany/EditRequestAirlineCompany";
import InfoTableDataAirlineCompany from "../InfoTableDataAirlineCompany/InfoTableDataAirlineCompany";
import CreateRequestAirlineOtdel from "../CreateRequestAirlineOtdel/CreateRequestAirlineOtdel";
import {
  decodeJWT,
  DELETE_AIRLINE_DEPARTMENT,
  DELETE_AIRLINE_MANAGER,
  GET_AIRLINE_COMPANY,
  GET_AIRLINE_POSITIONS,
  GET_AIRLINE_USERS_POSITIONS,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_ALL_POSITIONS,
  GET_DISPATCHERS_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import Notification from "../../Notification/Notification";
import { fullNotifyTime, menuAccess, notifyTime } from "../../../roles";
import SettingsSidebar from "../SettingsSidebar/SettingsSidebar";

function AirlineCompany_tabComponent({ children, id, user, accessMenu, ...props }) {
  const token = getCookie("token");

  const { loading, error, data, refetch } = useQuery(GET_AIRLINE_COMPANY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !id,
    variables: { airlineId: id },
  });

  const {
    loading: positionsLoading,
    error: positionsError,
    data: positionsData,
  } = useQuery(GET_AIRLINE_USERS_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !id,
  });

  const {
    loading: airlinePositionsLoading,
    error: airlinePositionsError,
    data: airlinePositionsData,
  } = useQuery(GET_AIRLINE_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !id,
  });

  const { data: dataSubscriptionUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        refetch();
      },
    }
  );

  const { data: dataSubscription } = useSubscription(
    GET_DISPATCHERS_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        refetch();
      },
    }
  );

  // console.log(dataSubscriptionUpd);

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime); // 5 секунд уведомление + 300 мс для анимации
  };

  const [addTarif, setAddTarif] = useState([]);
  const [showAddTarif, setShowAddTarif] = useState(false);
  const [showAddCategory, setshowAddCategory] = useState(false);

  const [positions, setPositions] = useState([]);
  const [airlinePositions, setAirlinePositions] = useState([]);

  const [showDelete, setShowDelete] = useState(false);

  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteNomer, setDeleteNomer] = useState(null);

  const [searchTarif, setSearchTarif] = useState("");
  const [selectQuery, setSelectQuery] = useState("");
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [showEditNomer, setShowEditNomer] = useState(false);
  const [selectedNomer, setSelectedNomer] = useState({});

  const [showSettingsSidebar, setShowSettingsSidebar] = useState(false);
  const [selectedDepartmentForSettings, setSelectedDepartmentForSettings] = useState(null);
  const settingsSidebarRef = useRef(null);
  const airlineUsers = data?.airline?.users || [];

  useEffect(() => {
    if (data && id) {
      const sortedTarifs = data.airline.department
        .map((tarif) => ({
          ...tarif,
          users: [...tarif.users].sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAddTarif(sortedTarifs);
      // setPositions(data.airline?.department?.position);
      refetch();
    }
  }, [data, id, refetch]);

  useEffect(() => {
    if (positionsData && airlinePositionsData) {
      setPositions(positionsData?.getAirlineUserPositions);
      setAirlinePositions(airlinePositionsData?.getAirlinePositions);
    }
  }, [positionsData, airlinePositionsData]);

  // console.log(positionsData);

  // console.log(positions);

  const handleSearchTarif = (e) => {
    setSearchTarif(e.target.value);
  };

  const handleSelect = (e) => {
    setSelectQuery(e.target.value);
  };

  const deleteComponentRef = useRef();

  const toggleTarifs = () => {
    setShowAddTarif(!showAddTarif);
  };

  const toggleCategory = () => {
    setshowAddCategory(!showAddCategory);
  };

  const toggleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowEditCategory(true);
  };

  const handleEditCategory = (updatedCategory) => {
    setAddTarif(updatedCategory);
    setShowEditCategory(false);
    setSelectedCategory(null);
  };

  const [deleteAirlineDepartment] = useMutation(DELETE_AIRLINE_DEPARTMENT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });

  const deleteTarif = async (index, id) => {
    try {
      let request = await deleteAirlineDepartment({
        variables: {
          deleteAirlineDepartmentId: id,
        },
      });

      if (request) {
        setAddTarif(addTarif.filter((_, i) => i !== index));
        setShowDelete(false);
        setShowEditCategory(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openDeleteNomerComponent = (user, category) => {
    setDeleteNomer({ user, category });
    setShowDelete(true);
  };

  const [deleteAirlineManager] = useMutation(DELETE_AIRLINE_MANAGER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });

  const deleteNomerFromCategory = async () => {
    let request = await deleteAirlineManager({
      variables: {
        deleteUserId: deleteNomer.user.id,
      },
    });

    if (request) {
      setAddTarif((prevTarifs) => {
        return prevTarifs.map((tarif) => {
          if (tarif.name === deleteNomer.category) {
            const updatedNumbers = tarif.users.filter(
              (user) => user.id !== deleteNomer.user.id
            );
            return { ...tarif, users: updatedNumbers };
          }
          return tarif;
        });
      });

      setShowDelete(false);
      setDeleteNomer(null);
      refetch();
    }
  };

  const openDeleteComponent = (index, id) => {
    setShowDelete(true);
    setDeleteIndex({ index, id });
    setShowEditCategory(false);
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
    setShowEditCategory(false);
  };

  const toggleEditNomer = (user, department) => {
    setSelectedNomer({ user, department });
    setShowEditNomer(true);
  };

  const handleEditNomer = (updatedNomer) => {
    setAddTarif(updatedNomer);
    setShowEditNomer(false);
    setSelectedNomer({});
  };

  const openSettings = (department) => {
    setSelectedDepartmentForSettings(department);
    setShowSettingsSidebar(true);
  };

  // const uniqueCategories = Array.from(new Set(addTarif.map(request => request.type)));

  // const filteredRequestsTarif = addTarif.filter(request => {
  //     const matchesCategory = selectQuery === '' || request.name.toLowerCase().includes(selectQuery.toLowerCase());

  //     const matchesSearch = searchTarif === '' ||
  //         request.name.toLowerCase().includes(searchTarif.toLowerCase()) ||
  //         request.users.some(user =>
  //             user.name.toLowerCase().includes(searchTarif.toLowerCase()) ||
  //             user.role.toLowerCase().includes(searchTarif.toLowerCase())
  //         );

  //     return matchesCategory && matchesSearch;
  // });

  const filteredRequestsEmployees = useMemo(() => {
    const query = searchTarif.trim().toLowerCase();
    const baseDepartments = addTarif.map((department) => ({
      ...department,
      users: [...(department.users || [])],
    }));

    const departmentIds = new Set(baseDepartments.map((department) => department.id));
    const noDepartmentUsers = (airlineUsers || []).filter((airlineUser) => {
      const departmentId = airlineUser?.airlineDepartmentId;
      return !departmentId || !departmentIds.has(departmentId);
    });

    if (noDepartmentUsers.length > 0) {
      baseDepartments.push({
        id: "no-department",
        name: "Без отдела",
        isNoDepartment: true,
        users: noDepartmentUsers,
      });
    }

    if (!query) {
      return baseDepartments;
    }

    return baseDepartments
      .map((department) => {
        const filteredUsers = (department.users || []).filter(
          (departmentUser) =>
            departmentUser?.name?.toLowerCase().includes(query) ||
            departmentUser?.role?.toLowerCase().includes(query)
        );

        if (
          filteredUsers.length > 0 ||
          department?.name?.toLowerCase().includes(query)
        ) {
          return {
            ...department,
            users: filteredUsers.length > 0 ? filteredUsers : department.users,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [addTarif, airlineUsers, searchTarif]);

  // console.log(filteredRequestsEmployees);

  return (
    <>
      <div className={classes.section_searchAndFilter}>
        <MUITextField
          label={"Поиск по аккаунтам"}
          className={classes.mainSearch}
          value={searchTarif}
          onChange={handleSearchTarif}
        />
        {(!user?.airlineId || accessMenu.userCreate) && (
          <div className={classes.section_searchAndFilter_filter}>
            <Filter
              toggleSidebar={toggleCategory}
              handleChange={""}
              buttonTitle={"Добавить отдел"}
            />
            <Filter
              toggleSidebar={toggleTarifs}
              handleChange={""}
              buttonTitle={"Добавить пользователя"}
            />
          </div>
        )}
      </div>
      {loading && <MUILoader fullHeight={"60vh"} />}
      {error && <p>Error: {error.message}</p>}

      {!loading && !error && (
        <InfoTableDataAirlineCompany
          user={user}
          accessMenu={accessMenu}
          airlineId={id}
          toggleRequestSidebar={toggleEditCategory}
          toggleRequestEditNumber={toggleEditNomer}
          requests={filteredRequestsEmployees}
          openDeleteComponent={openDeleteComponent}
          openDeleteNomerComponent={openDeleteNomerComponent}
          onOpenSettings={openSettings}
        />
      )}

      {(!user?.airlineId || accessMenu.userCreate) && (
        <>
          <CreateRequestAirlineCompany
            id={id}
            show={showAddTarif}
            onClose={toggleTarifs}
            onCreated={() => refetch()}
            addTarif={addTarif}
            setAddTarif={setAddTarif}
            positions={positions}
            addNotification={addNotification}
          />
          <CreateRequestAirlineOtdel
            id={id}
            show={showAddCategory}
            onClose={toggleCategory}
            addTarif={addTarif}
            setAddTarif={setAddTarif}
            positions={airlinePositions}
            addNotification={addNotification}
          />
        </>
      )}
      <EditRequestAirlineCompany
        id={id}
        show={showEditNomer}
        accessMenu={accessMenu}
        onClose={() => setShowEditNomer(false)}
        user={user}
        selectedUser={selectedNomer.user}
        department={selectedNomer.department}
        onSubmit={handleEditNomer}
        addTarif={addTarif}
        positions={positions}
        addNotification={addNotification}
        openDeleteComponent={openDeleteNomerComponent}
      />
      {(!user?.airlineId || accessMenu.userUpdate) && (
        <>
          <EditRequestAirlineOtdel
            id={id}
            positions={airlinePositions}
            show={showEditCategory}
            onClose={() => setShowEditCategory(false)}
            category={selectedCategory}
            onSubmit={handleEditCategory}
            addNotification={addNotification}
          />
        </>
      )}

      {showDelete && (
        <DeleteComponent
          ref={deleteComponentRef}
          remove={
            deleteNomer
              ? deleteNomerFromCategory
              : () => deleteTarif(deleteIndex.index, deleteIndex.id)
          }
          close={closeDeleteComponent}
          title={`Вы действительно хотите удалить ${
            deleteNomer ? "менеджера" : "отдел"
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
        airlineId={id}
        departmentItem={selectedDepartmentForSettings}
        type="airline"
      />

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
    </>
  );
}

export default AirlineCompany_tabComponent;
