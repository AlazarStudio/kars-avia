import React, { useState } from "react";
import classes from './HotelAbout_tabComponent.module.css';
import { requestsHotels } from '../../../requests.js';
import Button from "../../Standart/Button/Button.jsx";

function HotelAbout_tabComponent({ hotelName, ...props }) {
    const hotelData = requestsHotels.find(hotel => hotel.hotelName === hotelName);

    const [hotel, setHotel] = useState(hotelData);
    const [isEditing, setIsEditing] = useState(false);

    if (!hotel) {
        return <div className={classes.hotelAbout}>Отель не найден</div>;
    }

    const handleEditClick = () => {
        setIsEditing(!isEditing);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setHotel({
            ...hotel,
            [name]: value,
        });
    };

    return (
        <div className={classes.hotelAbout}>
            <div className={classes.hotelAbout_top}>
                <div className={classes.hotelAbout_top_complete}>
                    <div className={classes.hotelAbout_top_img}>
                        <img src={`/${hotel.hotelImage}`} alt={hotel.hotelName} />
                    </div>
                    <div className={classes.hotelAbout_top_title}>
                        <div className={classes.hotelAbout_top_title_name}>{hotel.hotelName}</div>
                        <div className={classes.hotelAbout_top_title_desc}>
                            <img src="/map.png" alt="" />
                            {hotel.hotelCity}, {hotel.hotelAdress}
                        </div>
                    </div>
                </div>
                <div className={classes.hotelAbout_top_button}>
                    <Button onClick={handleEditClick}>
                        {isEditing ? "Сохранить" : "Редактировать"}
                    </Button>
                </div>
            </div>
            <div className={classes.hotelAbout_info}>
                <div className={classes.hotelAbout_info_block}>
                    <div className={classes.hotelAbout_info_label}>
                        Адрес
                    </div>

                    <div className={classes.hotelAbout_info_item}>
                        <label>Страна</label>
                        <input
                            type="text"
                            name="hotelCountry"
                            value={hotel.hotelCountry}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.hotelAbout_info_input}
                        />
                    </div>
                    <div className={classes.hotelAbout_info_item}>
                        <label>Город</label>
                        <input
                            type="text"
                            name="hotelCity"
                            value={hotel.hotelCity}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.hotelAbout_info_input}
                        />
                    </div>
                    <div className={classes.hotelAbout_info_item}>
                        <label>Улица</label>
                        <input
                            type="text"
                            name="hotelAdress"
                            value={hotel.hotelAdress}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.hotelAbout_info_input}
                        />
                    </div>
                    <div className={classes.hotelAbout_info_item}>
                        <label>Индекс</label>
                        <input
                            type="text"
                            name="hotelIndex"
                            value={hotel.hotelIndex}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.hotelAbout_info_input}
                        />
                    </div>

                    <div className={classes.hotelAbout_info_label}>
                        Контакты
                    </div>
                    <div className={classes.hotelAbout_info_item}>
                        <label>Почта</label>
                        <input
                            type="email"
                            name="hotelEmail"
                            value={hotel.hotelEmail}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.hotelAbout_info_input}
                        />
                    </div>
                    <div className={classes.hotelAbout_info_item}>
                        <label>Телефон</label>
                        <input
                            type="tel"
                            name="hotelPhone"
                            value={hotel.hotelPhone}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.hotelAbout_info_input}
                        />
                    </div>
                </div>
                <div className={classes.hotelAbout_info_block}>
                    <div className={classes.hotelAbout_info_label}>
                        Реквизиты
                    </div>
                    <div className={classes.hotelAbout_info_item}>
                        <label>ИНН</label>
                        <input
                            type="text"
                            name="hotelInn"
                            value={hotel.hotelInn}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.hotelAbout_info_input}
                        />
                    </div>
                    <div className={classes.hotelAbout_info_item}>
                        <label>ОГРН</label>
                        <input
                            type="text"
                            name="hotelOgrn"
                            value={hotel.hotelOgrn}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.hotelAbout_info_input}
                        />
                    </div>
                    <div className={classes.hotelAbout_info_item}>
                        <label>Р/С</label>
                        <input
                            type="text"
                            name="hotelRs"
                            value={hotel.hotelRs}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.hotelAbout_info_input}
                        />
                    </div>

                    <div className={classes.hotelAbout_info_item}>
                        <label>В БАНКЕ</label>
                        <input
                            type="text"
                            name="hotelBank"
                            value={hotel.hotelBank}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.hotelAbout_info_input}
                        />
                    </div>
                    <div className={classes.hotelAbout_info_item}>
                        <label>БИК</label>
                        <input
                            type="text"
                            name="hotelBik"
                            value={hotel.hotelBik}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.hotelAbout_info_input}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HotelAbout_tabComponent;
