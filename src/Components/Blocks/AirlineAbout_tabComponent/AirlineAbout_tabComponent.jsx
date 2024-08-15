import React, { useState } from "react";
import classes from './AirlineAbout_tabComponent.module.css';
import { requestsAirlanes } from '../../../requests.js';
import Button from "../../Standart/Button/Button.jsx";

function AirlineAbout_tabComponent({ airlineName, ...props }) {
    const airlineData = requestsAirlanes.find(airline => airline.airlineName === airlineName);

    const [airline, setairline] = useState(airlineData);
    const [isEditing, setIsEditing] = useState(false);

    if (!airline) {
        return <div className={classes.airlineAbout}>Отель не найден</div>;
    }

    const handleEditClick = () => {
        setIsEditing(!isEditing);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setairline({
            ...airline,
            [name]: value,
        });
    };

    return (
        <div className={classes.airlineAbout}>
            <div className={classes.airlineAbout_top}>
                <div className={classes.airlineAbout_top_complete}>
                    <div className={classes.airlineAbout_top_img}>
                        <img src={`/${airline.airlineImage}`} alt={airline.airlineName} />
                    </div>
                    <div className={classes.airlineAbout_top_title}>
                        <div className={classes.airlineAbout_top_title_name}>{airline.airlineName}</div>
                        <div className={classes.airlineAbout_top_title_desc}>
                            <img src="/map.png" alt="" />
                            {airline.airlineCity}, {airline.airlineAdress}
                        </div>
                    </div>
                </div>
                <div className={classes.airlineAbout_top_button}>
                    <Button onClick={handleEditClick}>
                        {isEditing ? "Сохранить" : "Редактировать"}
                    </Button>
                </div>
            </div>
            <div className={classes.airlineAbout_info}>
                <div className={classes.airlineAbout_info_block}>
                    <div className={classes.airlineAbout_info_label}>
                        Адрес
                    </div>

                    <div className={classes.airlineAbout_info_item}>
                        <label>Страна</label>
                        <input
                            type="text"
                            name="airlineCountry"
                            value={airline.airlineCountry}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                        />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                        <label>Город</label>
                        <input
                            type="text"
                            name="airlineCity"
                            value={airline.airlineCity}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                        />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                        <label>Улица</label>
                        <input
                            type="text"
                            name="airlineAdress"
                            value={airline.airlineAdress}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                        />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                        <label>Индекс</label>
                        <input
                            type="text"
                            name="airlineIndex"
                            value={airline.airlineIndex}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                        />
                    </div>

                    <div className={classes.airlineAbout_info_label}>
                        Контакты
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                        <label>Почта</label>
                        <input
                            type="email"
                            name="airlineEmail"
                            value={airline.airlineEmail}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                        />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                        <label>Телефон</label>
                        <input
                            type="tel"
                            name="airlinePhone"
                            value={airline.airlinePhone}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                        />
                    </div>
                </div>
                <div className={classes.airlineAbout_info_block}>
                    <div className={classes.airlineAbout_info_label}>
                        Реквизиты
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                        <label>ИНН</label>
                        <input
                            type="text"
                            name="airlineInn"
                            value={airline.airlineInn}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                        />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                        <label>ОГРН</label>
                        <input
                            type="text"
                            name="airlineOgrn"
                            value={airline.airlineOgrn}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                        />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                        <label>Р/С</label>
                        <input
                            type="text"
                            name="airlineRs"
                            value={airline.airlineRs}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                        />
                    </div>

                    <div className={classes.airlineAbout_info_item}>
                        <label>В БАНКЕ</label>
                        <input
                            type="text"
                            name="airlineBank"
                            value={airline.airlineBank}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                        />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                        <label>БИК</label>
                        <input
                            type="text"
                            name="airlineBik"
                            value={airline.airlineBik}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AirlineAbout_tabComponent;
