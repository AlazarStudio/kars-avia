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

    const removePassenger = (index) => {
        setPlacement(prevPlacement =>
            prevPlacement.filter((_, i) => i !== index)
        );
        closeDeletecomponent()
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

    const [hotels, setHotels] = useState([]);

    let infoHotels = useQuery(GET_HOTELS_RELAY);

    useEffect(() => {
        if (infoHotels.data) {
            setHotels(infoHotels.data?.hotels || []);
        }
    }, [infoHotels]);

    const uniqueCities = [...new Set(hotels.map(hotel => hotel.city.trim()))].sort((a, b) => a.localeCompare(b));
    const filteredAirports = (formData && formData.city) ? hotels.filter(hotel => hotel.city.trim() === formData.city.trim()) : [];

    console.log(request?.airport?.city)
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
                    <div className={classes.filterCityAndHotel}>
                        <select name="city" placeholder="Введите город" value={formData.city} onChange={handleChange}>
                            <option value="">Выберите город</option>
                            {uniqueCities.map((city, index) => (
                                <option value={city} key={index}>{city}</option>
                            ))}
                        </select>
                        {formData.city &&
                            <select name="hotel" placeholder="Введите название гостиницы" value={formData.hotel} onChange={handleChange}>
                                <option value="">Выберите гостиницу</option>
                                {filteredAirports.map((hotel, index) => (
                                    <option value={hotel.id} key={index}>{hotel.name}</option>
                                ))}
                            </select>
                        }
                    </div>

                    <Button onClick={toggleCreateSidebar}>Добавить пассажира</Button>
                </div>
                {loading && <p>Loading...</p>}
                {error && <p>Error: {error.message}</p>}

                {!loading && !error && request && (
                    <>
                        <InfoTableDataReserve_passengers
                            placement={placement ? placement : []}
                            toggleUpdateSidebar={toggleUpdateSidebar}
                            setIdPassangerForUpdate={setIdPassangerForUpdate}
                            openDeletecomponent={openDeletecomponent}
                            toggleChooseHotel={toggleChooseHotel}
                            user={user}
                        />

                        <AddNewPassenger
                            show={showCreateSidebar}
                            onClose={toggleCreateSidebar}
                            onAddPassenger={addPassenger}
                            request={request}
                        />

                        <UpdatePassanger
                            show={showUpdateSidebar}
                            onClose={toggleUpdateSidebar}
                            placement={placement ? placement[idPassangerForUpdate] : []}
                            idPassangerForUpdate={idPassangerForUpdate}
                            updatePassenger={updatePassenger}
                        />

                        <ChooseHotel show={showChooseHotel} onClose={toggleChooseHotel} chooseObject={placement} id={'reserve'} />

                        {showDelete && <DeleteComponent remove={removePassenger} index={idDelete} close={closeDeletecomponent} title={`Вы действительно хотите удалить пассажира? `} />}
                    </>
                )}
            </div>

        </div>
    );
}

export default ReservePlacement;