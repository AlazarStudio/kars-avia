import React, { useState, useRef, useEffect } from "react";
import classes from './AddNewPassenger.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery } from "@apollo/client";
import { ADD_HOTEL_TO_RESERVE, GET_HOTELS_RELAY, getCookie } from "../../../../graphQL_requests";

function AddNewPassenger({ show, onClose, request, placement, setPlacement }) {
    const token = getCookie('token');

    const [formData, setFormData] = useState({
        passengers: '',
        city: '',
        hotel: '',
        requestId: ''
    });

    useEffect(() => {
        if (request) {
            setFormData({ ...formData, requestId: request.id });
        }
    }, [request]);

    const resetForm = () => {
        setFormData({
            ...formData,
            passengers: '',
            city: '',
            hotel: '',
        });
    };

    const sidebarRef = useRef();

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены?");
        if (success) {
            resetForm();
            onClose();
        }
    };

    const [error, setError] = useState('');
    const handleChange = (e) => {
        const { name, value } = e.target;
        const maxCount = request.passengerCount;

        if (value > maxCount) {
            setError(`Максимальное количество пассажиров - ${maxCount}`);
            setFormData(prevState => ({
                ...prevState,
                [name]: maxCount
            }));
        } else {
            setError('');
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    }

    const [createRequest] = useMutation(ADD_HOTEL_TO_RESERVE, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const handleSubmit = async () => {
        try {
            let reserverAddHotel = await createRequest({
                variables: {
                    reservationId: formData.requestId,
                    hotelId: formData.hotel,
                    capacity: Number(formData.passengers)
                }
            });

            if (reserverAddHotel.data) {
                resetForm();
                onClose();
            }
        } catch (e) {
            console.error(e);
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
    const hotels = data?.hotels || [];
    const uniqueCities = [...new Set(hotels.map(hotel => hotel.city.trim()))].sort();

    // Получаем ID отелей, которые уже добавлены в заявку
    const addedHotelIds = placement.map((item) => item.hotel.name);

    // Фильтруем список отелей по выбранному городу
    const filteredHotels = formData.city
        ? hotels.filter((hotel) => hotel.city.trim() === formData.city.trim())
        : [];

    // console.log(formData)
    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Добавить гостиницу</div>
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
                    <label>Город</label>
                    <select name="city" value={formData.city} onChange={handleChange}>
                        <option value="">Выберите город</option>
                        {uniqueCities.map((city, index) => (
                            <option value={city} key={index}>{city}</option>
                        ))}
                    </select>
                    {formData.city && (
                        <>
                            <label>Гостиница</label>
                            <select name="hotel" value={formData.hotel} onChange={handleChange}>
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
                        max={request.passengerCount}
                        value={formData.passengers}
                        onChange={handleChange}
                    />

                </div>
            </div>

            <div className={classes.requestButon}>
                <Button onClick={handleSubmit}>Добавить гостиницу</Button>
            </div>
        </Sidebar>
    );
}

export default AddNewPassenger;
