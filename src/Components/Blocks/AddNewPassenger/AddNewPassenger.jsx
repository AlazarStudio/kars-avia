import React, { useState, useRef, useEffect } from "react";
import classes from './AddNewPassenger.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useQuery } from "@apollo/client";
import { GET_HOTELS_RELAY } from "../../../../graphQL_requests";

function AddNewPassenger({ show, onClose, request, placement, setPlacement }) {
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        setPlacement([...placement, {
            hotel: {
                name: formData.hotel,
                passengersCount: formData.passengers,
                city: formData.city,
                requestId: formData.requestId,
                passengers: [],
                person: [],
            }
        }])
        resetForm();
        onClose();
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
    const filteredHotels = formData.city ? hotels.filter(hotel => hotel.city.trim() === formData.city.trim()) : [];

    // console.log(formData)
    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Добавить гостиницу</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Город</label>
                    <select name="city" value={formData.city} onChange={handleChange}>
                        <option value="">Выберите город</option>
                        {uniqueCities.map((city, index) => (
                            <option value={city} key={index}>{city}</option>
                        ))}
                    </select>
                    {formData.city &&
                        <>
                            <label>Гостиница</label>
                            <select name="hotel" value={formData.hotel} onChange={handleChange}>
                                <option value="">Выберите гостиницу</option>
                                {filteredHotels.map((hotel, index) => (
                                    <option value={hotel.id} key={index}>{hotel.name}</option>
                                ))}
                            </select>
                        </>
                    }
                    <label>Количество пассажиров</label>
                    <input
                        type="number"
                        name="passengers"
                        placeholder="Пример: 30"
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
