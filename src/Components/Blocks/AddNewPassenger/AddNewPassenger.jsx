import React, { useState, useRef, useEffect, useMemo } from "react";
import classes from './AddNewPassenger.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery } from "@apollo/client";
import { ADD_HOTEL_TO_RESERVE, GET_HOTELS_RELAY, getCookie } from "../../../../graphQL_requests";

function AddNewPassenger({ show, onClose, request, placement, setPlacement, user, hotelInfo, showChooseHotels, setshowModalForAddHotelInReserve, setShowReserveInfo }) {
    const [city, setCity] = useState("");
    const [hotel, setHotel] = useState('');

    useEffect(() => {
        setHotel(user.hotelId ? user.hotelId : hotelInfo?.id)
    }, [user, hotelInfo]);

    const token = getCookie('token');

    const [formData, setFormData] = useState({
        passengers: '',
        city: '',
        hotel: hotel ? hotel : "",
        requestId: request?.id
    });

    // console.log(request?.id);
    

    const resetForm = () => {
        setFormData({
            passengers: '',
            city: city, // Используем значение из состояния `city`
            hotel: hotel ? hotel : "",
            requestId: request?.id
        });
    };

    const sidebarRef = useRef();

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены?");
        if (success) {
            resetForm();
            setError('')
            onClose();
            setShowReserveInfo && setShowReserveInfo(false)
        }
    };

    const [error, setError] = useState('');
    const handleChange = (e) => {
        const { name, value } = e.target;
        const maxCount = request.passengerCount;
        const maxCountChoose = request.passengerCount - showChooseHotels;
    
        if (name === 'passengers' && Number(value) + showChooseHotels > maxCount) {
            setError(`Максимальное количество пассажиров - ${maxCount}. Другие гостиницы уже выбрали ${showChooseHotels} пассажиров. Вы можете выбрать не более ${maxCountChoose} пассажиров`);
            setFormData(prevState => ({
                ...prevState,
                [name]: maxCountChoose
            }));
        } else {
            setError('');
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };
    

    const [createRequest] = useMutation(ADD_HOTEL_TO_RESERVE, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const isFormValid = () => {
        return (
            formData.passengers &&
            formData.city &&
            formData.hotel &&
            formData.requestId
        );
    };

    const handleSubmit = async () => {
        if (!isFormValid()) {
            alert("Пожалуйста, заполните все обязательные поля.");
            return;
        }

        try {
            let reserverAddHotel = await createRequest({
                variables: {
                    reservationId: request?.id,
                    hotelId: formData.hotel,
                    capacity: Number(formData.passengers)
                }
            });

            if (reserverAddHotel.data) {
                resetForm();
                onClose();
                setshowModalForAddHotelInReserve && setshowModalForAddHotelInReserve(true)
                setShowReserveInfo && setShowReserveInfo(true)
            }
        } catch (e) {
            console.error(e);
            if (e.message.startsWith('This reserve and hotel combination already exists.')) {
                setError('Эта гостиница уже выбрана.')
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                closeButton();
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [show]);

    const { data } = useQuery(GET_HOTELS_RELAY);
    const hotels = data?.hotels.hotels || [];
    
    // Уникальные города с мемоизацией
    const uniqueCities = useMemo(() => {
        return [...new Set(hotels.map(hotel => hotel.information?.city.trim()))].sort();
    }, [hotels]);
    
    useEffect(() => {
        // Инициализация при первом рендере
        // if (!formData.city && request?.airport?.city && uniqueCities.includes(request.airport.city)) {
            const selectedCity = request?.airport?.city;
            setCity(selectedCity);
            setFormData(prevFormData => ({
                ...prevFormData,
                city: selectedCity,
                requestId: request?.id,
                hotel: hotel ? hotel : "",
            }));
        // }
        // setFormData(prevFormData => ({
        //     ...prevFormData,
        //     requestId: request?.id,
        // }));
    }, [request, uniqueCities]); // Зависимости строго ограничены

    // console.log(request.id);
    
    // console.log(formData);
    
    
    


    const addedHotelIds = placement.map((item) => item.hotel.name);
    const filteredHotels = formData.city
        ? hotels.filter((hotel) => hotel.information?.city.trim() === formData.city.trim())
        : [];
    // console.log(request?.airport?.city);
    

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>{user.role == 'HOTELADMIN' ? 'Выбрать количество' : 'Добавить гостиницу'}</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    {error &&
                        <>
                            <div className={classes.warningMessage}>
                                <strong>Внимание:</strong> <br /> {error}
                            </div>
                        </>
                    }
                    {user.role != 'HOTELADMIN' && <label>Город</label>}
                    <select hidden={user.role == 'HOTELADMIN' && true} name="city" value={formData.city} onChange={handleChange}>
                        <option value="">Выберите город</option>
                        {uniqueCities.map((city, index) => (
                            <option value={city} key={index}>{city}</option>
                        ))}
                    </select>
                    {formData.city && (
                        <>
                            {user.role != 'HOTELADMIN' && <label>Гостиница</label>}
                            <select hidden={user.role == 'HOTELADMIN' && true} name="hotel" value={formData.hotel} onChange={handleChange}>
                                <option value="">Выберите гостиницу</option>
                                {filteredHotels.map((hotel, index) => (
                                    <option
                                        value={hotel.id}
                                        key={index}
                                        disabled={addedHotelIds.includes(hotel.id)}
                                    >
                                        {hotel.name} {addedHotelIds.includes(hotel.id) ? '(уже добавлен)' : ''}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    <label>Количество пассажиров</label>
                    <input
                        type="number"
                        name="passengers"
                        placeholder="Пример: 30"
                        min="1"
                        max={request.passengerCount - showChooseHotels}
                        value={formData.passengers}
                        onChange={handleChange}
                    />

                </div>
            </div>

            <div className={classes.requestButton}>
                <Button onClick={handleSubmit}>{user.role == 'HOTELADMIN' ? 'Добавить' : 'Добавить гостиницу'}</Button>
            </div>
        </Sidebar>
    );
}

export default AddNewPassenger;
