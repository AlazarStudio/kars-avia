import React, { useEffect, useState } from "react";
import classes from "./ReservePlacement.module.css";
import { Link, useParams } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header";
import Filter from "../../Blocks/Filter/Filter";
import Button from "../../Standart/Button/Button";
import InfoTableDataReserve_passengers from "../../Blocks/InfoTableDataReserve_passengers/InfoTableDataReserve_passengers";

import { requestsReserve } from "../../../requests";
import AddNewPassenger from "../../Blocks/AddNewPassenger/AddNewPassenger";
import UpdatePassanger from "../../Blocks/UpdatePassanger/UpdatePassanger";
import DeleteComponent from "../../Blocks/DeleteComponent/DeleteComponent";
import ChooseHotel from "../../Blocks/ChooseHotel/ChooseHotel";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  CREATE_RESERVE_REPORT,
  DELETE_PASSENGER_FROM_HOTEL,
  DELETE_PERSON_FROM_HOTEL,
  GET_HOTELS_RELAY,
  GET_RESERVE_REQUEST,
  GET_RESERVE_REQUEST_HOTELS,
  GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION,
  GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS,
  getCookie,
  REQUEST_RESERVE_UPDATED_SUBSCRIPTION,
  server,
} from "../../../../graphQL_requests";
import CreateRequestHotel from "../../Blocks/CreateRequestHotel/CreateRequestHotel";
import CreateRequestHotelReserve from "../../Blocks/CreateRequestHotelReserve/CreateRequestHotelReserve";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import Notification from "../../Notification/Notification";
import { fullNotifyTime, notifyTime } from "../../../roles";
import MUITextField from "../../Blocks/MUITextField/MUITextField";
import ManifestModal from "../../Blocks/ManifestModal/ManifestModal";
import InfoTableDataReservePassengers from "../../Blocks/InfoTableDataReservePassengers/InfoTableDataReservePassengers";

function ReservePlacement({ children, user, ...props }) {
  const token = getCookie("token");

  let { idRequest } = useParams();
  const [request, setRequest] = useState([]);
  const [placement, setPlacement] = useState([]);

  const [showCreateSidebarHotel, setShowCreateSidebarHotel] = useState(false);

  const { data: subscriptionData } = useSubscription(
    GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
        refetchHotel();
      },
    }
  );
  const { data: subscriptionDataPerson } = useSubscription(
    GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS,
    {
      onData: () => {
        refetch();
        refetchHotel();
      },
    }
  );

  const { data: subscriptionDataUpdate } = useSubscription(
    REQUEST_RESERVE_UPDATED_SUBSCRIPTION,
    {
      onComplete: () => {
        refetch();
      },
    }
  );

  // console.log(subscriptionDataUpdate);
  // console.log(subscriptionData);

  const { loading, error, data, refetch } = useQuery(GET_RESERVE_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { reserveId: idRequest },
  });

  const {
    loading: loadingHotel,
    error: errorHotel,
    data: dataHotel,
    refetch: refetchHotel,
  } = useQuery(GET_RESERVE_REQUEST_HOTELS, {
    variables: { reservationHotelsId: idRequest },
  });

  // console.log(dataHotel);

  useEffect(() => {
    if (data && data.reserve && dataHotel) {
      setRequest(data.reserve);

      const getClientInfo = (client, hotelChess, isPassenger) => {
        const clientInfo = isPassenger
          ? hotelChess.find((entry) => entry.passenger?.id === client)
          : hotelChess.find((entry) => entry.client?.id === client);
        return clientInfo;
      };

      const transformedData = dataHotel.reservationHotels.map((item) => ({
        hotel: {
          reservationHotelId: item.id,
          id: item.hotel.id,
          name: item.hotel.name,
          passengersCount: item.capacity.toString(),
          city: item.hotel.city,
          requestId: item.reserve.id,
          passengers: item.passengers.map((passenger, index) => ({
            status: getClientInfo(passenger.id, item.hotelChess, true)
              ? getClientInfo(passenger.id, item.hotelChess, true).status
              : "waiting",
            room: getClientInfo(passenger.id, item.hotelChess, true)
              ? getClientInfo(passenger.id, item.hotelChess, true).room
              : "-",
            name: passenger.name || "не указано",
            gender: passenger.gender || "не указано",
            number: passenger.number || "не указано",
            type: passenger.type || "не указано",
            order: index + 1,
            id: passenger.id || `id-${index}`,
          })),
          // person: item.person.map((pers, index) => ({
          //     status: getClientInfo(pers.id, item.hotelChess, false) ? getClientInfo(pers.id, item.hotelChess, false).status : 'waiting',
          //     room: getClientInfo(pers.id, item.hotelChess, false) ? getClientInfo(pers.id, item.hotelChess, false).room : '-',
          //     name: pers.name || "не указано",
          //     gender: pers.gender || "не указано",
          //     number: pers.number || "не указано",
          //     type: pers.type || "не указано",
          //     order: index + 1,
          //     id: pers.id || `id-${index}`
          // })),
        },
      }));

      setPlacement(transformedData);

      // Обработка подписки для новой гостиницы
      //   if (subscriptionData) {
      //     const newHotelData = {
      //       hotel: {
      //         reservationHotelId: subscriptionData.reserveHotel.id,
      //         id: subscriptionData.reserveHotel.hotel.id,
      //         name: subscriptionData.reserveHotel.hotel.name,
      //         passengersCount: subscriptionData.reserveHotel.capacity.toString(),
      //         city: subscriptionData.reserveHotel.hotel.city,
      //         requestId: subscriptionData.reserveHotel.reserve.id,
      //         passengers: subscriptionData.reserveHotel.passengers.map(
      //           (passenger, index) => ({
      //             name: passenger.name || "не указано",
      //             gender: passenger.gender || "не указано",
      //             number: passenger.number || "не указано",
      //             type: passenger.type || "не указано",
      //             order: index + 1,
      //             id: passenger.id || `id-${index}`,
      //           })
      //         ),
      //         // person: subscriptionData.reserveHotel.person.map((pers, index) => ({
      //         //     name: pers.name || "не указано",
      //         //     gender: pers.gender || "не указано",
      //         //     number: pers.number || "не указано",
      //         //     type: pers.type || "не указано",
      //         //     order: index + 1,
      //         //     id: pers.id || `id-${index}`
      //         // })),
      //       },
      //     };

      //     setPlacement((prevPlacement) => {
      //       const isDuplicate = prevPlacement.some(
      //         (item) => item.hotel.id === newHotelData.hotel.id
      //       );
      //       return isDuplicate ? prevPlacement : [...prevPlacement, newHotelData];
      //     });
      //     refetch();
      //     // refetchHotel();
      //   }

      //   // Обработка подписки для сотрудников и пассажиров
      //   if (subscriptionDataPerson) {
      //     const { reservePersons } = subscriptionDataPerson;
      //     const hotelId = reservePersons.reserveHotel.id;

      //     setPlacement((prevPlacement) =>
      //       prevPlacement.map((hotelData) => {
      //         if (hotelData.hotel.id === hotelId) {
      //           return {
      //             ...hotelData,
      //             hotel: {
      //               ...hotelData.hotel,
      //               passengers: [
      //                 ...hotelData.hotel.passengers,
      //                 ...reservePersons.passengers.map((passenger, index) => ({
      //                   name: passenger.name || "не указано",
      //                   gender: passenger.gender || "не указано",
      //                   number: passenger.number || "не указано",
      //                   type: passenger.type || "не указано",
      //                   order: hotelData.hotel.passengers.length + index + 1,
      //                   id: passenger.id || `id-${index}`,
      //                 })),
      //               ],
      //               // person: [
      //               //     ...hotelData.hotel.person,
      //               //     ...reservePersons.person.map(person => ({
      //               //         id: person.id,
      //               //         name: person.name,
      //               //         number: person.number || "не указано",
      //               //         gender: person.gender || "не указано",
      //               //     }))
      //               // ]
      //             },
      //           };
      //         }
      //         return hotelData;
      //       })
      //     );
      //     refetch();
      //     // refetchHotel();
      //   }
      // refetch();
    }
  }, [data, dataHotel, subscriptionData, subscriptionDataPerson]);

  //   useEffect(() => {
  //     if (subscriptionDataPerson) {
  //       const { reservePersons } = subscriptionDataPerson;
  //       const hotelId = reservePersons.reserveHotel.id;

  //       setPlacement((prevPlacement) =>
  //         prevPlacement.map((hotelData) => {
  //           if (hotelData.hotel.id === hotelId) {
  //             return {
  //               ...hotelData,
  //               hotel: {
  //                 ...hotelData.hotel,
  //                 passengers: [
  //                   ...hotelData.hotel.passengers,
  //                   ...reservePersons.passengers.map((passenger, index) => ({
  //                     name: passenger.name || "не указано",
  //                     gender: passenger.gender || "не указано",
  //                     number: passenger.number || "не указано",
  //                     type: passenger.type || "не указано",
  //                     order: hotelData.hotel.passengers.length + index + 1,
  //                     id: passenger.id || `id-${index}`,
  //                   })),
  //                 ],
  //                 // person: [
  //                 //     ...hotelData.hotel.person,
  //                 //     ...reservePersons.person.map(person => ({
  //                 //         id: person.id,
  //                 //         name: person.name,
  //                 //         number: person.number || "не указано",
  //                 //         gender: person.gender || "не указано",
  //                 //     }))
  //                 // ]
  //               },
  //             };
  //           }
  //           return hotelData;
  //         })
  //       );
  //       refetchHotel();
  //     }
  //   }, [refetchHotel, subscriptionDataPerson]);

  // console.log(subscriptionData);
  //   console.log(subscriptionDataPerson);

  const [showCreateSidebar, setShowCreateSidebar] = useState(false);

  const toggleCreateSidebar = () => {
    setShowCreateSidebar(!showCreateSidebar);
  };

  const [showUpdateSidebar, setShowUpdateSidebar] = useState(false);

  const toggleUpdateSidebar = () => {
    setShowUpdateSidebar(!showUpdateSidebar);
  };

  const [idDelete, setIdDelete] = useState();
  const [showDelete, setshowDelete] = useState(false);

  const openDeletecomponent = (guest, hotel) => {
    setshowDelete(true);
    setIdDelete({ guest, hotel });
  };

  const closeDeletecomponent = () => {
    setshowDelete(false);
  };

  const [idPassangerForUpdate, setIdPassangerForUpdate] = useState();

  const addPassenger = (newPassenger) => {
    setPlacement((prevPlacement) => [...prevPlacement, newPassenger]);
  };

  const updatePassenger = (updatedPassenger, index) => {
    setPlacement((prevPlacement) =>
      prevPlacement.map((passenger, i) =>
        i === index ? updatedPassenger : passenger
      )
    );
  };

  const [deletePersonFromHotel] = useMutation(DELETE_PERSON_FROM_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });

  const [deletePassengerFromHotel] = useMutation(DELETE_PASSENGER_FROM_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });

  const [createReserveReport] = useMutation(CREATE_RESERVE_REPORT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const createPassengerList = async (reserveId) => {
    try {
      await createReserveReport({
        variables: {
          reserveId: reserveId,
          format: "xlsx",
        },
      });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const removePassenger = async (guest) => {
    if (guest.guest.type == "Сотрудник") {
      try {
        let deletePerson = await deletePersonFromHotel({
          variables: {
            reserveHotelId: guest.hotel.hotel.reservationHotelId,
            airlinePersonalId: guest.guest.id,
          },
        });

        if (deletePerson.data) {
          closeDeletecomponent();
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (guest.guest.type == "Пассажир") {
      try {
        let deletePassenger = await deletePassengerFromHotel({
          variables: {
            deletePassengerFromReserveId: guest.guest.id,
          },
        });
        await createPassengerList(request.id);

        if (deletePassenger.data) {
          closeDeletecomponent();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const [showChooseHotel, setShowChooseHotel] = useState(false);
  const toggleChooseHotel = () => {
    setShowChooseHotel(!showChooseHotel);
  };

  const [formData, setFormData] = useState({
    city: "",
    hotel: "",
  });

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prevState) => ({
        ...prevState,
        meals: {
          ...prevState.meals,
          [name]: checked,
        },
      }));
    } else if (name === "included") {
      setFormData((prevState) => ({
        ...prevState,
        meals: {
          ...prevState.meals,
          included: value,
        },
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredPlacement = placement
    .map((item) => {
      const filteredPassengers = item.hotel.passengers.filter((passenger) =>
        passenger.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // console.log(filteredPassengers);

      // const filteredPersons = item.hotel.person.filter((person) =>
      //     person.name.toLowerCase().includes(searchQuery.toLowerCase())
      // );

      const isHotelMatch = item.hotel.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (filteredPassengers.length > 0 || isHotelMatch) {
        return {
          ...item,
          hotel: {
            ...item.hotel,
            passengers: filteredPassengers,
            // person: filteredPersons,
          },
        };
      }

      return null;
    })
    .filter((item) => item !== null);

  // console.log(filteredPlacement);

  const [showChooseHotels, setShowChooseHotels] = useState(0);

  useEffect(() => {
    const totalPassengers = placement.reduce(
      (acc, item) => acc + Number(item.hotel.passengersCount),
      0
    );
    setShowChooseHotels(totalPassengers);
  }, [placement]);

  const toggleCreateSidebarHotel = () => {
    setShowCreateSidebarHotel(!showCreateSidebarHotel);
  };

  // const exists = filteredPlacement.some(
  //   (item) => item.hotel.id === user.hotelId
  // );
  const exists = placement.some((item) => item.hotel.id === user.hotelId);

  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // console.log(request);
  const [openManifestModal, setOpenManifestModal] = useState(false);

  return (
    <div className={classes.main}>
      <MenuDispetcher id={"reserve"} />

      <div className={classes.section}>
        <Header>
          <div className={classes.titleHeader}>
            <Link
              to={user.role == "HOTELADMIN" ? "/reserveRequests" : "/reserve"}
              className={classes.backButton}
            >
              <img src="/arrow.png" alt="" />
            </Link>
            Заявка {request.reserveNumber}
          </div>
        </Header>

        <div className={classes.section_searchAndFilter}>
          {/* <input
            type="text"
            placeholder="Поиск"
            style={{ width: "400px" }}
            value={searchQuery}
            onChange={handleSearch}
          /> */}
          <MUITextField
            className={classes.mainSearch}
            label={"Поиск"}
            value={searchQuery}
            onChange={handleSearch}
          />

          <div className={classes.downloadsButtonsWrapper}>
            {request?.files && request?.files.length !== 0 ? (
              <>
                <Button
                  onClick={() => setOpenManifestModal(true)}
                  className={classes.downloadsButton}
                >
                  Манифест
                </Button>
                {/* <input
                  type="file"
                  id="fileUpload"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />

                <label htmlFor="fileUpload" className={classes.downloadsButton}>
                  <img src="/edit.svg.png" alt="" style={{ width: "15px" }} />{" "}
                  Манифест
                </label>
                <a
                  href={request?.files ? `${server}${request?.files[0]}` : ""}
                  target="_blank"
                  className={classes.downloadsButton}
                >
                  Манифест
                  <img src="/download.png" alt="" />
                </a> */}
              </>
            ) : !request?.files ? (
              <MUILoader loadSize={"35px"} />
            ) : (
              <>
                {user?.hotelId ? null : (
                  <>
                    <input
                      type="file"
                      id="fileUpload"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />

                    {/* Кастомная кнопка загрузки */}
                    <label
                      htmlFor="fileUpload"
                      className={classes.downloadsButton}
                    >
                      <img
                        src="/plus.png"
                        alt=""
                        style={{ width: "15px", filter: "invert(100%)" }}
                      />{" "}
                      {/* {file ? file?.name : "Манифест"} */}
                      Манифест
                    </label>
                  </>
                )}
              </>
            )}
            {request?.passengerList?.length !== 0 ? (
              <a
                href={`${server}${request?.passengerList}`}
                // onClick={() => {
                //   request?.passengerList.length === 0
                //     ? createPassengerList(request?.id)
                //     : null;
                // }}
                target="_blank"
                className={classes.downloadsButton}
              >
                Расселение
                <img src="/download.png" alt="" />{" "}
              </a>
            ) : null}
            {/* {console.log(request)} */}
            {user?.airlineId ? null : (
              <div className={classes.btnsReserve}>
                {user.role != 'HOTELADMIN' && <Button onClick={toggleCreateSidebarHotel}>Создать гостиницу</Button>} 
                {/* {console.log(!exists && request.passengerCount === showChooseHotels)} */}
                {/* {!exists && request.passengerCount === showChooseHotels ? null : (
                <Button onClick={toggleCreateSidebar}>
                  {user.role == "HOTELADMIN"
                    ? "Выбрать количество пассажиров"
                    : "Добавить гостиницу"}
                </Button>
              )} */}
                {exists &&
                request.passengerCount === showChooseHotels ? null : (
                  <Button onClick={toggleCreateSidebar}>
                    {user.role == "HOTELADMIN"
                      ? "Выбрать количество пассажиров"
                      : "Добавить гостиницу"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        {loading && <MUILoader />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && request && (
          <>
            <InfoTableDataReservePassengers
              placement={filteredPlacement}
              allHotelPlacement={placement}
              setPlacement={setPlacement}
              toggleUpdateSidebar={toggleUpdateSidebar}
              setIdPassangerForUpdate={setIdPassangerForUpdate}
              openDeletecomponent={openDeletecomponent}
              toggleChooseHotel={toggleChooseHotel}
              user={user}
              request={request}
              airline={request.airline}
              manifest={file}
              addNotification={addNotification}
              setFile={setFile}
              refetch={refetch}
              refetchHotel={refetchHotel}
              createPassengerList={createPassengerList}
            />

            <AddNewPassenger
              show={showCreateSidebar}
              onClose={toggleCreateSidebar}
              request={request}
              placement={placement ? placement : []}
              setPlacement={setPlacement}
              user={user}
              showChooseHotels={showChooseHotels}
              setShowChooseHotels={setShowChooseHotels}
            />

            <UpdatePassanger
              show={showUpdateSidebar}
              onClose={toggleUpdateSidebar}
              placement={placement ? placement[idPassangerForUpdate] : []}
              idPassangerForUpdate={idPassangerForUpdate}
              updatePassenger={updatePassenger}
            />

            <CreateRequestHotelReserve
              show={showCreateSidebarHotel}
              onClose={toggleCreateSidebarHotel}
            />

            <ChooseHotel
              show={showChooseHotel}
              onClose={toggleChooseHotel}
              chooseObject={placement}
              id={"reserve"}
            />

            <ManifestModal
              user={user}
              open={openManifestModal}
              onClose={() => setOpenManifestModal(false)}
              handleFileChange={handleFileChange}
              file={file}
              request={request}
              server={server}
              classes={classes}
            />

            {showDelete && (
              <DeleteComponent
                remove={removePassenger}
                index={idDelete}
                close={closeDeletecomponent}
                title={`Вы действительно хотите удалить гостя? `}
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
        )}
      </div>
    </div>
  );
}

export default ReservePlacement;
