import React, { useState, useRef, useEffect } from "react";
import classes from "./MyCompany.module.css";
import Filter from "../Filter/Filter";
import Header from "../Header/Header";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  COMPANY_CHANGE_SUBSCRIPTION,
  DELETE_DISPATCHER_USER,
  GET_ALL_COMPANIES,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import Notification from "../../Notification/Notification";
import { fullNotifyTime, notifyTime } from "../../../roles";
import InfoTableDataMyCompany from "../InfoTableDataMyCompany/InfoTableDataMyCompany";
import CreateRequestMyCompany from "../CreateRequestMyCompany/CreateRequestMyCompany";
import ExistRequestMyCompany from "../ExistRequestMyCompany/ExistRequestMyCompany";

function MyCompany({ children, user, ...props }) {
  const token = getCookie("token");

  const { loading, error, data, refetch } = useQuery(GET_ALL_COMPANIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [chooseObject, setChooseObject] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const deleteComponentRef = useRef();

  const [companyData, setCompanyData] = useState([]);

  useEffect(() => {
    if (data) {
      const sortedDispatchers = [...data.getAllCompany].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setCompanyData(sortedDispatchers);
    }
    // refetch();
  }, [data]);

  const addDispatcher = (newDispatcher) => {
    // setCompanyData(
    //   [...companyData, newDispatcher].sort((a, b) =>
    //     a.name.localeCompare(b.name)
    //   )
    // );
    // refetch();
  };

  const updateDispatcher = (updatedDispatcher, index) => {
    // const newData = [...companyData];
    // newData[index] = updatedDispatcher;
    // setCompanyData(newData.sort((a, b) => a.name.localeCompare(b.name)));
    // refetch();
  };

  const [deleteDispatcherUser] = useMutation(DELETE_DISPATCHER_USER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const deleteDispatcher = async (index, userID) => {
    try {
      let response_delete_user = await deleteDispatcherUser({
        variables: {
          deleteUserId: userID,
        },
      });
      if (response_delete_user) {
        setCompanyData(companyData.filter((_, i) => i !== index));
        setShowDelete(false);
        setShowRequestSidebar(false);
        addNotification("Удаление диспетчера прошло успешно.", "success");
      }
    } catch (error) {
      console.error("Ошибка при удалении пользователя", error);
      // addNotification(
      //   "Ошибка, у вас недостаточно прав для удаления диспетчера.",
      //   "error"
      // );
      alert("Ошибка при удалении пользователя");
    }
  };

  const { data: dataSubscriptionUpd } = useSubscription(
    COMPANY_CHANGE_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
    }
  );

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
    }, fullNotifyTime);
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
      request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request?.information?.inn
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request?.information?.ogrn
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  });

  return (
    <>
      <div className={classes.section}>
        <Header>ГК Карс</Header>

        <div className={classes.section_searchAndFilter}>
          <MUITextField
            label={"Поиск по компаниям"}
            className={classes.mainSearch}
            value={searchQuery}
            onChange={handleSearch}
          />
          <Filter
            toggleSidebar={toggleCreateSidebar}
            handleChange={handleChange}
            filterData={filterData}
            buttonTitle={"Добавить компанию"}
            needDate={false}
          />
        </div>
        {loading && <MUILoader />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <InfoTableDataMyCompany
            toggleRequestSidebar={toggleRequestSidebar}
            requests={filteredRequests}
            setChooseObject={setChooseObject}
            openDeleteComponent={openDeleteComponent}
          />
        )}

        <CreateRequestMyCompany
          show={showCreateSidebar}
          onClose={toggleCreateSidebar}
          addDispatcher={addDispatcher}
          addNotification={addNotification}
        />

        <ExistRequestMyCompany
          show={showRequestSidebar}
          onClose={toggleRequestSidebar}
          chooseObject={chooseObject}
          updateDispatcher={updateDispatcher}
          openDeleteComponent={openDeleteComponent}
          deleteComponentRef={deleteComponentRef}
          addNotification={addNotification}
        />

        {showDelete && (
          <DeleteComponent
            ref={deleteComponentRef}
            remove={() =>
              deleteDispatcher(deleteIndex.index, deleteIndex.userID)
            }
            close={closeDeleteComponent}
            title={`Вы действительно хотите удалить компанию?`}
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

export default MyCompany;
