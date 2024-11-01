import React, { useEffect, useState } from "react";
import classes from './ReservePlacement.module.css';
import { Link, useParams } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header"
import Filter from "../../Blocks/Filter/Filter";
import Button from "../../Standart/Button/Button";
import InfoTableDataReserve_passengers from "../../Blocks/InfoTableDataReserve_passengers/InfoTableDataReserve_passengers";

import { requestsReserve } from "../../../requests";
import AddNewPassenger from "../../Blocks/AddNewPassenger/AddNewPassenger";
import UpdatePassanger from "../../Blocks/UpdatePassanger/UpdatePassanger";
import DeleteComponent from "../../Blocks/DeleteComponent/DeleteComponent";
import ChooseHotel from "../../Blocks/ChooseHotel/ChooseHotel";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import { DELETE_PASSENGER_FROM_HOTEL, DELETE_PERSON_FROM_HOTEL, GET_HOTELS_RELAY, GET_RESERVE_REQUEST, GET_RESERVE_REQUEST_HOTELS, GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION, GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS, getCookie } from "../../../../graphQL_requests";
import CreateRequestHotel from "../../Blocks/CreateRequestHotel/CreateRequestHotel";
import CreateRequestHotelReserve from "../../Blocks/CreateRequestHotelReserve/CreateRequestHotelReserve";

function ReservePlacement({ children, user, ...props }) {
    const token = getCookie('token');

    let { idRequest } = useParams();
    const [request, setRequest] = useState([]);
    const [placement, setPlacement] = useState([]);

    const [showCreateSidebarHotel, setShowCreateSidebarHotel] = useState(false);

    const { data: subscriptionData } = useSubscription(GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION);
    const { data: subscriptionDataPerson } = useSubscription(GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS);

    const { loading, error, data, refetch } = useQuery(GET_RESERVE_REQUEST, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
        variables: { reserveId: idRequest },
    });

    const { loading: loadingHotel, error: errorHotel, data: dataHotel, refetch: refetchHotel } = useQuery(GET_RESERVE_REQUEST_HOTELS, {
        variables: { reservationHotelsId: idRequest },
    });

    useEffect(() => {
        if (data && data.reserve && dataHotel) {
            setRequest(data.reserve);

            const transformedData = dataHotel.reservationHotels.map(item => ({
                hotel: {
                    reservationHotelId: item.id,
                    id: item.hotel.id,
                    name: item.hotel.name,
                    passengersCount: item.capacity.toString(),
                    city: item.hotel.city,
                    requestId: item.reserve.id,
                    passengers: item.passengers.map((passenger, index) => ({
                        name: passenger.name || "не указано",
                        gender: passenger.gender || "не указано",
                        number: passenger.number || "не указано",
                        type: passenger.type || "не указано",
                        order: index + 1,
                        id: passenger.id || `id-${index}`
                    })),
                    person: item.person
                }
            }));

            setPlacement(transformedData);

            // Обработка подписки для новой гостиницы
            if (subscriptionData) {
                const newHotelData = {
                    hotel: {
                        reservationHotelId: subscriptionData.reserveHotel.id,
                        id: subscriptionData.reserveHotel.hotel.id,
                        name: subscriptionData.reserveHotel.hotel.name,
                        passengersCount: subscriptionData.reserveHotel.capacity.toString(),
                        city: subscriptionData.reserveHotel.hotel.city,
                        requestId: subscriptionData.reserveHotel.reserve.id,
                        passengers: subscriptionData.reserveHotel.passengers.map((passenger, index) => ({
                            name: passenger.name || "не указано",
                            gender: passenger.gender || "не указано",
                            number: passenger.number || "не указано",
                            type: passenger.type || "не указано",
                            order: index + 1,
                            id: passenger.id || `id-${index}`
                        })),
                        person: subscriptionData.reserveHotel.person
                    }
                };

                setPlacement(prevPlacement => {
                    const isDuplicate = prevPlacement.some(item => item.hotel.id === newHotelData.hotel.id);
                    return isDuplicate ? prevPlacement : [...prevPlacement, newHotelData];
                });
            }

            // Обработка подписки для сотрудников и пассажиров
            if (subscriptionDataPerson) {
                const { reservePersons } = subscriptionDataPerson;
                const hotelId = reservePersons.reserveHotel.id;

                setPlacement(prevPlacement =>
                    prevPlacement.map(hotelData => {
                        if (hotelData.hotel.id === hotelId) {
                            return {
                                ...hotelData,
                                hotel: {
                                    ...hotelData.hotel,
                                    passengers: [
                                        ...hotelData.hotel.passengers,
                                        ...reservePersons.passengers.map((passenger, index) => ({
                                            name: passenger.name || "не указано",
                                            gender: passenger.gender || "не указано",
                                            number: passenger.number || "не указано",
                                            type: passenger.type || "не указано",
                                            order: hotelData.hotel.passengers.length + index + 1,
                                            id: passenger.id || `id-${index}`
                                        }))
                                    ],
                                    person: [
                                        ...hotelData.hotel.person,
                                        ...reservePersons.person.map(person => ({
                                            id: person.id,
                                            name: person.name,
                                            number: person.number || "не указано",
                                            gender: person.gender || "не указано"
                                        }))
                                    ]
                                }
                            };
                        }
                        return hotelData;
                    })
                );
            }

            refetch();
            refetchHotel();
        }
    }, [data, dataHotel, subscriptionData, subscriptionDataPerson]);


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
        setIdDelete({ guest, hotel })
    };

    const closeDeletecomponent = () => {
        setshowDelete(false);
    };

    const [idPassangerForUpdate, setIdPassangerForUpdate] = useState();

    const addPassenger = (newPassenger) => {
        setPlacement(prevPlacement => [...prevPlacement, newPassenger]);
    };

    const updatePassenger = (updatedPassenger, index) => {
        setPlacement(prevPlacement =>
            prevPlacement.map((passenger, i) =>
                i === index ? updatedPassenger : passenger
            )
        );
    };

    const [deletePersonFromHotel] = useMutation(DELETE_PERSON_FROM_HOTEL, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const [deletePassengerFromHotel] = useMutation(DELETE_PASSENGER_FROM_HOTEL, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const removePassenger = async (guest) => {
        if (guest.guest.type == 'Сотрудник') {
            try {
                let deletePerson = await deletePersonFromHotel({
                    variables: {
                        reserveHotelId: guest.hotel.hotel.reservationHotelId,
                        airlinePersonalId: guest.guest.id,
                    }
                });

                if (deletePerson.data) {
                    closeDeletecomponent();
                }
            } catch (e) {
                console.error(e);
            }
        }

        if (guest.guest.type == 'Пассажир') {
            try {
                let deletePassenger = await deletePassengerFromHotel({
                    variables: {
                        deletePassengerFromReserveId: guest.guest.id,
                    }
                });

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
        city: '',
        hotel: '',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prevState => ({
                ...prevState,
                meals: {
                    ...prevState.meals,
                    [name]: checked
                }
            }));
        } else if (name === 'included') {
            setFormData(prevState => ({
                ...prevState,
                meals: {
                    ...prevState.meals,
                    included: value
                }
            }));
        } else {
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    }

    const [searchQuery, setSearchQuery] = useState('');
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredPlacement = placement
        .map((item) => {

            const filteredPassengers = item.hotel.passengers.filter((passenger) =>
                passenger.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            const filteredPersons = item.hotel.person.filter((person) =>
                person.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            const isHotelMatch = item.hotel.name.toLowerCase().includes(searchQuery.toLowerCase());

            if (filteredPassengers.length > 0 || filteredPersons.length > 0 || isHotelMatch) {
                return {
                    ...item,
                    hotel: {
                        ...item.hotel,
                        passengers: filteredPassengers,
                        person: filteredPersons,
                    },
                };
            }

            return null;
        })
        .filter((item) => item !== null);

    const [showChooseHotels, setShowChooseHotels] = useState(0);

    useEffect(() => {
        const totalPassengers = placement.reduce((acc, item) => acc + Number(item.hotel.passengersCount), 0);
        setShowChooseHotels(totalPassengers);
    }, [placement]);

    const toggleCreateSidebarHotel = () => {
        setShowCreateSidebarHotel(!showCreateSidebarHotel);
    };

    return (
        <div className={classes.main}>
            <MenuDispetcher id={'reserve'} />

            <div className={classes.section}>
                <Header>
                    <div className={classes.titleHeader}>
                        <Link to={user.role == 'HOTELADMIN' ? '/reserveRequests' : '/reserve'} className={classes.backButton}><img src="/arrow.png" alt="" /></Link>
                        Заявка {request.reserveNumber}
                    </div>
                </Header>

                <div className={classes.section_searchAndFilter}>
                    <input
                        type="text"
                        placeholder="Поиск"
                        style={{ width: '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    />

                    <div className={classes.btnsReserve}>
                        {user.role != 'HOTELADMIN' && <Button onClick={toggleCreateSidebarHotel}>Добавить новую гостиницу</Button>}

                        <Button onClick={toggleCreateSidebar}>
                            {user.role == 'HOTELADMIN' ? 'Выбрать количество пассажиров' : 'Добавить гостиницу'}
                        </Button>
                    </div>
                </div>
                {loading && <p>Loading...</p>}
                {error && <p>Error: {error.message}</p>}

                {!loading && !error && request && (
                    <>
                        <InfoTableDataReserve_passengers
                            placement={filteredPlacement}
                            setPlacement={setPlacement}
                            toggleUpdateSidebar={toggleUpdateSidebar}
                            setIdPassangerForUpdate={setIdPassangerForUpdate}
                            openDeletecomponent={openDeletecomponent}
                            toggleChooseHotel={toggleChooseHotel}
                            user={user}
                            request={request}
                            airline={request.airline}
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

                        <ChooseHotel show={showChooseHotel} onClose={toggleChooseHotel} chooseObject={placement} id={'reserve'} />

                        {showDelete && <DeleteComponent remove={removePassenger} index={idDelete} close={closeDeletecomponent} title={`Вы действительно хотите удалить гостя? `} />}
                    </>
                )}
            </div>

        </div>
    );
}

export default ReservePlacement;