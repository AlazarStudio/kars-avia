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
import { useQuery } from "@apollo/client";
import { GET_HOTELS_RELAY, GET_RESERVE_REQUEST } from "../../../../graphQL_requests";

function ReservePlacement({ children, user, ...props }) {
    let { idRequest } = useParams();
    const [request, setRequest] = useState([]);
    const [placement, setPlacement] = useState([]);

    const { loading, error, data } = useQuery(GET_RESERVE_REQUEST, {
        variables: { reserveId: idRequest },
    });

    useEffect(() => {
        if (data && data.reserve) {
            setRequest(data?.reserve || []);
            setPlacement(data?.reserve.person || []);
        }
    }, [data]);


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

    const openDeletecomponent = (index) => {
        setshowDelete(true);
        setIdDelete(index)
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

    const removePassenger = (guest) => {
        setPlacement((prevPlacement) =>
            prevPlacement.map((item) => {
                // Копируем отель, чтобы изменить его списки
                const updatedHotel = { ...item.hotel };

                // Проверяем тип гостя и обновляем соответствующий массив
                if (guest.type === 'Пассажир') {
                    updatedHotel.passengers = updatedHotel.passengers.filter(
                        (passenger) => passenger.id !== guest.id
                    );
                } else if (guest.type === 'Сотрудник') {
                    updatedHotel.person = updatedHotel.person.filter(
                        (person) => person.id !== guest.id
                    );
                }

                // Возвращаем обновленный отель в массиве размещений
                return { ...item, hotel: updatedHotel };
            })
        );

        closeDeletecomponent();
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
                passenger.passenger.toLowerCase().includes(searchQuery.toLowerCase())
            );
            const filteredPersons = item.hotel.person.filter((person) =>
                person.passenger.toLowerCase().includes(searchQuery.toLowerCase())
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


    return (
        <div className={classes.main}>
            <MenuDispetcher id={'reserve'} />

            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>
                        <div className={classes.titleHeader}>
                            <Link to={'/reserve'} className={classes.backButton}><img src="/arrow.png" alt="" /></Link>
                            Заявка {request.reserveNumber}
                        </div>
                    </Header>
                </div>

                <div className={classes.section_searchAndFilter}>
                    <input
                        type="text"
                        placeholder="Поиск"
                        style={{ width: '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    />


                    <Button onClick={toggleCreateSidebar}>Добавить гостиницу</Button>
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
                        />

                        <UpdatePassanger
                            show={showUpdateSidebar}
                            onClose={toggleUpdateSidebar}
                            placement={placement ? placement[idPassangerForUpdate] : []}
                            idPassangerForUpdate={idPassangerForUpdate}
                            updatePassenger={updatePassenger}
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