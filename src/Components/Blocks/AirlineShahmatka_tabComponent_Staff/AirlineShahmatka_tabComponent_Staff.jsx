import React, { useEffect, useRef, useState } from "react";
import classes from "./AirlineShahmatka_tabComponent_Staff.module.css";
import Filter from "../Filter/Filter.jsx";

import {
  decodeJWT,
  DELETE_AIRLINE_STAFF,
  GET_AIRLINE_POSITIONS,
  GET_AIRLINE_USERS,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_ALL_POSITIONS,
  GET_BRONS_HOTEL,
  GET_STAFF_HOTELS,
  getCookie,
  REQUEST_CREATED_SUBSCRIPTION,
  REQUEST_UPDATED_SUBSCRIPTION,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import AirlineTablePageComponent from "../AirlineTablePageComponent/AirlineTablePageComponent.jsx";
import CreateRequestAirlineStaff from "../CreateRequestAirlineStaff/CreateRequestAirlineStaff.jsx";
import UpdateRequestAirlineStaff from "../UpdateRequestAirlineStaff/UpdateRequestAirlineStaff.jsx";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
import {
  fullNotifyTime,
  notifyTime,
  // positions,
  roles,
} from "../../../roles.js";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUITextField from "../MUITextField/MUITextField.jsx";
import Notification from "../../Notification/Notification.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";

function AirlineShahmatka_tabComponent_Staff({ children, id, ...props }) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const { loading, error, data, refetch } = useQuery(GET_AIRLINE_USERS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { airlineId: id },
  });

  const {
    loading: positionsLoading,
    error: positionsError,
    data: positionsData,
  } = useQuery(GET_AIRLINE_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [staff, setStaff] = useState([]);

  useEffect(() => {
    if (data) {
      setStaff(data.airline.staff);
      refetch();
    }
  }, [data, refetch]);

  // console.log(staff);

  const [hotelBronsInfo, setHotelBronsInfo] = useState([]);

  const {
    loading: bronLoading,
    error: bronError,
    data: bronData,
    refetch: bronRefetch,
  } = useQuery(GET_STAFF_HOTELS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { airlineStaffsId: id },
  });

  useEffect(() => {
    if (bronData && bronData.airlineStaffs) {
      setHotelBronsInfo(bronData.airlineStaffs);
    }
    bronRefetch();
  }, [bronData, bronRefetch]);
  // console.log(hotelBronsInfo);

  // Подписки для отслеживания создания и обновления заявок
  const { data: subscriptionData } = useSubscription(
    REQUEST_CREATED_SUBSCRIPTION,
    {
      onData: () => {
        bronRefetch(); // Обновляем данные после новых событий
        refetch();
      },
    }
  );

  const { data: subscriptionUpdateData } = useSubscription(
    REQUEST_UPDATED_SUBSCRIPTION,
    {
      onData: () => {
        bronRefetch(); // Обновляем данные после новых событий
        refetch();
      },
    }
  );

  const { data: dataSubscriptionUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION,
    {
      onData: () => {
        bronRefetch();
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
    }, fullNotifyTime);
  };

  const [showAddCategory, setshowAddCategory] = useState(false);
  const [showUpdateCategory, setshowUpdateCategory] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState();

  const [positions, setPositions] = useState([]);

  const [showDelete, setShowDelete] = useState(false);

  const toggleCategory = () => {
    setshowAddCategory(!showAddCategory);
  };

  const toggleCategoryUpdate = () => {
    setshowUpdateCategory(!showUpdateCategory);
  };

  const dataInfo =
    hotelBronsInfo &&
    hotelBronsInfo.flatMap((person) =>
      person.hotelChess.map((hotel) => ({
        start: hotel.start,
        requestNumber: hotel?.request?.requestNumber,
        startTime: hotel.startTime,
        end: hotel.end,
        endTime: hotel.endTime,
        clientID: hotel.clientId,
        requestId: hotel.requestId,
        reserveId: hotel.reserveId,
        hotelName: hotel.hotel.name,
      }))
    );

  // console.log(dataInfo.map((item) => item.requestId));
  // console.log(dataInfo);

  useEffect(() => {
    if (positionsData) {
      setPositions(positionsData?.getAirlinePositions);
    }
  }, [positionsData]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectQuery, setSelectQuery] = useState("");
  const [showAddBronForm, setShowAddBronForm] = useState(false);

  const [deleteIndex, setDeleteIndex] = useState(null);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelect = (e) => {
    setSelectQuery(e.target.value);
  };

  const toggleSidebar = () => {
    setShowAddBronForm(!showAddBronForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilterData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Обработчик изменения выбранной должности
  const handlePositionChange = (event, newValue) => {
    setSelectedPosition(newValue || "");
  };

  // const filteredRequests = staff
  //   .filter((request) => {
  //     const matchesSearch =
  //       searchQuery === "" ||
  //       // request.gender.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       // request.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       request.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       request.name.toLowerCase().includes(searchQuery.toLowerCase());

  //     return matchesSearch;
  //   })
  //   .sort((a, b) => a.name.localeCompare(b.name));

  // Фильтрация заявок по поисковому запросу и выбранной должности
  const filteredRequests = staff
    .filter((request) => {
      const matchesSearch =
        searchQuery === "" ||
        request.position?.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        request.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPosition =
        selectedPosition === "" || request.position?.name === selectedPosition;
      return matchesSearch && matchesPosition;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const deleteComponentRef = useRef();

  const closeDeleteComponent = () => {
    setShowDelete(false);
    setshowUpdateCategory(true);
  };

  const [deleteAirlineStaff] = useMutation(DELETE_AIRLINE_STAFF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const deleteTarif = async (user) => {
    try {
      let request = await deleteAirlineStaff({
        variables: {
          deleteAirlineStaffId: user.id,
        },
      });

      if (request) {
        setStaff(staff.filter((staffMember) => staffMember.id !== user.id));
        setShowDelete(false);
        setshowUpdateCategory(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || bronLoading) return <MUILoader fullHeight={"70vh"} />;
  if (error || bronError)
    return <p>Error: {error ? error.message : bronError.message}</p>;

  return (
    <>
      <div className={classes.section_searchAndFilter}>
        <div className={classes.section_searchAndFilter}>
          <MUITextField
            label={"Поиск по ФИО сотрудника или должности"}
            className={classes.mainSearch}
            value={searchQuery}
            onChange={handleSearch}
          />
          <MUIAutocomplete
            dropdownWidth={"140px"}
            label={"Должность"}
            options={positions.map((position) => position.name)}
            value={selectedPosition}
            onChange={handlePositionChange}
          />
        </div>
        <div className={classes.section_searchAndFilter_filter}>
          <Filter
            toggleSidebar={toggleCategory}
            handleChange={handleChange}
            buttonTitle={"Добавить сотрудника"}
          />
        </div>
      </div>

      {hotelBronsInfo.length === 0 && (
        <AirlineTablePageComponent
          toggleCategoryUpdate={toggleCategoryUpdate}
          maxHeight={
            user.role === roles.dispatcerAdmin || user.role === roles.superAdmin
              ? "635px"
              : "745px"
          }
          userHeight={
            user.role !== roles.dispatcerAdmin && user.role !== roles.superAdmin
              ? "calc(100vh - 210px)"
              : ""
          }
          dataObject={filteredRequests}
          dataInfo={[]}
          setSelectedStaff={setSelectedStaff}
          user={user}
          positions={positions}
        />
      )}

      {hotelBronsInfo.length !== 0 && (
        <AirlineTablePageComponent
          toggleCategoryUpdate={toggleCategoryUpdate}
          maxHeight={
            user.role === roles.dispatcerAdmin || user.role === roles.superAdmin
              ? "635px"
              : "745px"
          }
          userHeight={
            user.role !== roles.dispatcerAdmin && user.role !== roles.superAdmin
              ? "calc(100vh - 210px)"
              : ""
          }
          dataObject={filteredRequests}
          dataInfo={dataInfo}
          setSelectedStaff={setSelectedStaff}
          user={user}
          positions={positions}
        />
      )}

      <CreateRequestAirlineStaff
        id={id}
        show={showAddCategory}
        onClose={toggleCategory}
        addTarif={staff}
        setAddTarif={setStaff}
        addNotification={addNotification}
        positions={positions}
      />
      <UpdateRequestAirlineStaff
        id={id}
        setDeleteIndex={setDeleteIndex}
        show={showUpdateCategory}
        setShowDelete={setShowDelete}
        onClose={toggleCategoryUpdate}
        selectedStaff={selectedStaff}
        setAddTarif={setStaff}
        addNotification={addNotification}
        positions={positions}
      />

      {showDelete && (
        <DeleteComponent
          ref={deleteComponentRef}
          remove={() => deleteTarif(deleteIndex)}
          close={closeDeleteComponent}
          title={`Вы действительно хотите удалить сотрудника?`}
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

export default AirlineShahmatka_tabComponent_Staff;
