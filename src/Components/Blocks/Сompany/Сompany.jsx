import React, { useState, useRef, useEffect } from "react";
import classes from "./Сompany.module.css";
import Filter from "../Filter/Filter";
import CreateRequestCompany from "../CreateRequestCompany/CreateRequestCompany";
import { requestsCompany } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataCompany from "../InfoTableDataCompany/InfoTableDataCompany";
import ExistRequestCompany from "../ExistRequestCompany/ExistRequestCompany";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  DELETE_DISPATCHER_USER,
  GET_DISPATCHERS,
  GET_DISPATCHERS_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import Notification from "../../Notification/Notification";

function Company({ children, user, ...props }) {
  const token = getCookie("token");

  const { loading, error, data, refetch } = useQuery(GET_DISPATCHERS);
  const { data: dataSubscription } = useSubscription(
    GET_DISPATCHERS_SUBSCRIPTION
  );

  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [chooseObject, setChooseObject] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const deleteComponentRef = useRef();

  const [companyData, setCompanyData] = useState([]);

  useEffect(() => {
    if (data) {
      const sortedDispatchers = [...data.dispatcherUsers].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setCompanyData(sortedDispatchers);
    }
    refetch();
  }, [data, dataSubscription, refetch]);

  const addDispatcher = (newDispatcher) => {
    setCompanyData(
      [...companyData, newDispatcher].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
  };

  const updateDispatcher = (updatedDispatcher, index) => {
    const newData = [...companyData];
    newData[index] = updatedDispatcher;
    setCompanyData(newData.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const [deleteDispatcherUser] = useMutation(DELETE_DISPATCHER_USER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });

  const deleteDispatcher = async (index, userID) => {
    let response_delete_user = await deleteDispatcherUser({
      variables: {
        deleteUserId: userID,
      },
    });
    if (response_delete_user) {
      setCompanyData(companyData.filter((_, i) => i !== index));
      setShowDelete(false);
      setShowRequestSidebar(false);
    }
  };

  const toggleCreateSidebar = () => {
    setShowCreateSidebar(!showCreateSidebar);
  };

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
  };

  const openDeleteComponent = (index, userID) => {
    setShowDelete(true);
    setDeleteIndex({ index, userID });
    setShowRequestSidebar(false); // Закрываем боковую панель при открытии компонента удаления
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
    setShowRequestSidebar(true); // Открываем боковую панель при закрытии компонента удаления
  };

  const [filterData, setFilterData] = useState({
    filterSelect: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5300); // 5 секунд уведомление + 300 мс для анимации
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilterData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRequests = companyData.filter((request) => {
    return (
      (filterData.filterSelect === "" ||
        request.role.includes(filterData.filterSelect)) &&
      (request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.position.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  let filterList = ["Модератор", "Администратор"];

  return (
    <>
      <div className={classes.section}>
        <Header>Компания</Header>

        <div className={classes.section_searchAndFilter}>
          {/* <input
                        type="text"
                        placeholder="Поиск"
                        style={{ width: '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    /> */}
          <MUITextField
            label={"Поиск"}
            className={classes.mainSearch}
            value={searchQuery}
            onChange={handleSearch}
          />
          <Filter
            toggleSidebar={toggleCreateSidebar}
            handleChange={handleChange}
            filterData={filterData}
            buttonTitle={"Добавить аккаунт диспетчера"}
            filterList={filterList}
            needDate={false}
          />
        </div>
        {loading && <MUILoader />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <InfoTableDataCompany
            toggleRequestSidebar={toggleRequestSidebar}
            requests={filteredRequests}
            setChooseObject={setChooseObject}
          />
        )}

        <CreateRequestCompany
          show={showCreateSidebar}
          onClose={toggleCreateSidebar}
          addDispatcher={addDispatcher}
          addNotification={addNotification}
        />

        <ExistRequestCompany
          show={showRequestSidebar}
          onClose={toggleRequestSidebar}
          chooseObject={chooseObject}
          updateDispatcher={updateDispatcher}
          openDeleteComponent={openDeleteComponent}
          deleteComponentRef={deleteComponentRef}
          filterList={filterList}
          addNotification={addNotification}
        />

        {showDelete && (
          <DeleteComponent
            ref={deleteComponentRef}
            remove={() =>
              deleteDispatcher(deleteIndex.index, deleteIndex.userID)
            }
            close={closeDeleteComponent}
            title={`Вы действительно хотите удалить диспетчера?`}
          />
        )}
        {notifications.map((n, index) => (
          <Notification
            key={n.id}
            text={n.text}
            status={n.status}
            index={index}
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
