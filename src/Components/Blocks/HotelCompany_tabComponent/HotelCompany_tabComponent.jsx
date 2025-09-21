import React, { useState, useRef, useEffect } from "react";
import classes from "./HotelCompany_tabComponent.module.css";
import Filter from "../Filter/Filter";
import { requestsCompanyHotel } from "../../../requests";
import InfoTableDataCompany from "../InfoTableDataCompany/InfoTableDataCompany";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import CreateRequestCompanyHotel from "../CreateRequestCompanyHotel/CreateRequestCompanyHotel";
import ExistRequestCompanyHotel from "../ExistRequestCompanyHotel/ExistRequestCompanyHotel";

import {
  getCookie,
  GET_HOTEL_USERS,
  DELETE_HOTEL_USER,
  decodeJWT,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  GET_DISPATCHERS_SUBSCRIPTION,
  GET_HOTEL_POSITIONS,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUITextField from "../MUITextField/MUITextField.jsx";
import Notification from "../../Notification/Notification.jsx";
import { fullNotifyTime, notifyTime } from "../../../roles.js";

function HotelCompany_tabComponent({ children, id, ...props }) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const { loading, error, data, refetch } = useQuery(GET_HOTEL_USERS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { hotelId: id },
  });

  const {
    loading: positionsLoading,
    error: positionsError,
    data: positionsData,
  } = useQuery(GET_HOTEL_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: dataSubscriptionUpd } = useSubscription(
    GET_HOTELS_UPDATE_SUBSCRIPTION,
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

  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [chooseObject, setChooseObject] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const deleteComponentRef = useRef();

  const [companyData, setCompanyData] = useState([]);

  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (data) {
      setCompanyData(data.hotelUsers.users);
      refetch();
    }
  }, [data, refetch]);

  useEffect(() => {
    if (positionsData) {
      setPositions(positionsData?.getHotelPositions);
    }
  }, [positionsData]);

  const addDispatcher = (newDispatcher) => {
    setCompanyData([...companyData, newDispatcher]);
  };

  const [isLoading, setIsLoading] = useState(false);

  const updateDispatcher = (updatedDispatcher, index) => {
    setIsLoading(true);
    const newData = [...companyData];
    newData[index] = updatedDispatcher;
    setCompanyData(newData);
    setIsLoading(false);
  };

  const [deleteHotelUser] = useMutation(DELETE_HOTEL_USER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });

  const deleteDispatcher = async (index, userID) => {
    let response_delete_user = await deleteHotelUser({
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

  const openDeleteComponent = async (index, userID) => {
    setShowDelete(true);
    setDeleteIndex({ index, userID });
    setShowRequestSidebar(false);
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
    setShowRequestSidebar(true);
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
      (filterData.filterSelect === "" ||
        request.role.includes(filterData.filterSelect)) &&
      (request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.position.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // let filterList = ['Модератор', 'Администратор', 'Пользователь'];
  return (
    <>
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
          buttonTitle={"Добавить пользователя"}
          // filterList={filterList}
          needDate={false}
        />
      </div>

      {loading && <MUILoader fullHeight={"60vh"} />}
      {error && <p>Error: {error.message}</p>}

      {!loading && !error && (
        <InfoTableDataCompany
          id={id}
          user={user}
          toggleRequestSidebar={toggleRequestSidebar}
          requests={filteredRequests}
          setChooseObject={setChooseObject}
        />
      )}

      <CreateRequestCompanyHotel
        id={id}
        show={showCreateSidebar}
        onClose={toggleCreateSidebar}
        addDispatcher={addDispatcher}
        positions={positions}
        addNotification={addNotification}
      />

      <ExistRequestCompanyHotel
        id={id}
        show={showRequestSidebar}
        onClose={toggleRequestSidebar}
        chooseObject={chooseObject}
        updateDispatcher={updateDispatcher}
        openDeleteComponent={openDeleteComponent}
        deleteComponentRef={deleteComponentRef}
        isLoading={isLoading}
        positions={positions}
        addNotification={addNotification}
        // filterList={filterList}
      />

      {showDelete && (
        <DeleteComponent
          ref={deleteComponentRef}
          remove={() => deleteDispatcher(deleteIndex.index, deleteIndex.userID)}
          close={closeDeleteComponent}
          title={`Вы действительно хотите удалить пользователя?`}
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
    </>
  );
}

export default HotelCompany_tabComponent;
