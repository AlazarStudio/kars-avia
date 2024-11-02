import React, { useState, useRef, useEffect } from "react";
import classes from './ChooseHotel.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useQuery } from "@apollo/client";
import { GET_HOTELS_RELAY } from "../../../../graphQL_requests";

function ChooseHotel({ show, onClose, chooseObject, id }) {
    const [formData, setFormData] = useState({
        city: '',
        hotel: '',
    });

    const [hotels, setHotels] = useState([]);

    let infoHotels = useQuery(GET_HOTELS_RELAY);

    useEffect(() => {
        if (infoHotels.data) {
            setHotels(infoHotels.data?.hotels || []);
        }
    }, [infoHotels]);

    const uniqueCities = [...new Set(hotels.map(hotel => hotel.city.trim()))].sort((a, b) => a.localeCompare(b));
    const filteredAirports = (formData && formData.city) ? hotels.filter(hotel => hotel.city.trim() === formData.city.trim()) : [];

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            city: '',
            hotel: '',
        });
    };

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены");
        if (success) {
            resetForm();
            onClose();
        }
    }

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
    }, [show, onClose]);

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Выбрать гостинницу</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Город</label>
                    <select name="city" placeholder="Введите город" value={formData.city} onChange={handleChange}>
                        <option value="">Выберите город</option>
                        {uniqueCities.map((city, index) => (
                            <option value={city} key={index}>{city}</option>
                        ))}
                    </select>

                    <label>Гостинница</label>
                    <select name="hotel" placeholder="Введите название гостиницы" value={formData.hotel} onChange={handleChange}>
                        <option value="">Выберите гостиницу</option>
                        {filteredAirports.map((hotel, index) => (
                            <option value={hotel.id} key={index}>{hotel.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={classes.requestButton}>
                <Button link={`/${id}/placement/${formData.hotel}`} dataObject={chooseObject}>Разместить<img src="/user-check.png" alt="" /></Button>
            </div>
        </Sidebar>
    );
}

export default ChooseHotel;