import React, { useEffect, useState } from "react";
import classes from './HotelAbout_tabComponent.module.css';
import { gql, useQuery, useMutation } from "@apollo/client";
import Button from "../../Standart/Button/Button.jsx";
import { server, getCookie, GET_HOTEL, UPDATE_HOTEL, decodeJWT } from '../../../../graphQL_requests.js';

function HotelAbout_tabComponent({ id }) {
    const [userRole, setUserRole] = useState();
    const token = getCookie('token');

    useEffect(() => {
        setUserRole(decodeJWT(token).role);
    }, [token]);

    const { loading, error, data } = useQuery(GET_HOTEL, {
        variables: { hotelId: id },
    });

    const [hotel, setHotel] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [updateHotel] = useMutation(UPDATE_HOTEL, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    useEffect(() => {
        if (data) {
            setHotel(data.hotel);
        }
    }, [data]);

    const handleEditClick = async () => {
        if (isEditing) {
            try {
                await updateHotel({
                    variables: {
                        updateHotelId: hotel.id,
                        input: {
                            name: hotel.name,
                            country: hotel.country,
                            city: hotel.city,
                            address: hotel.address,
                            bank: hotel.bank,
                            bik: hotel.bik,
                            email: hotel.email,
                            index: hotel.index,
                            inn: hotel.inn,
                            number: hotel.number,
                            link: hotel.link,
                            description: hotel.description,
                            ogrn: hotel.ogrn,
                            rs: hotel.rs,
                            breakfast: {
                                start: hotel.breakfast.start,
                                end: hotel.breakfast.end
                            },
                            lunch:
                            {
                                start: hotel.lunch.start,
                                end: hotel.lunch.end
                            },
                            dinner: {
                                start: hotel.dinner.start,
                                end: hotel.dinner.end
                            }
                        }
                    }
                });
                // alert('Данные успешно сохранены');
            } catch (err) {
                console.error('Произошла ошибка при сохранении данных');
            }
        }
        setIsEditing(!isEditing);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setHotel((prevHotel) => {
            // Проверяем, начинается ли name с "breakfast", "lunch" или "dinner"
            if (name.startsWith("breakfast")) {
                return {
                    ...prevHotel,
                    breakfast: {
                        ...prevHotel.breakfast,
                        [name.replace("breakfast", "").toLowerCase()]: value,
                    },
                };
            } else if (name.startsWith("lunch")) {
                return {
                    ...prevHotel,
                    lunch: {
                        ...prevHotel.lunch,
                        [name.replace("lunch", "").toLowerCase()]: value,
                    },
                };
            } else if (name.startsWith("dinner")) {
                return {
                    ...prevHotel,
                    dinner: {
                        ...prevHotel.dinner,
                        [name.replace("dinner", "").toLowerCase()]: value,
                    },
                };
            } else {
                // Для остальных полей
                return {
                    ...prevHotel,
                    [name]: value,
                };
            }
        });
    };


    return (
        <>
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && hotel && (
                <div className={classes.hotelAbout}>
                    <div className={classes.hotelAbout_top}>
                        <div className={classes.hotelAbout_top_complete}>
                            <div className={classes.hotelAbout_top_img}>
                                <img src={`${server}${hotel.images[0]}`} alt={hotel.name} />
                            </div>
                            <div className={classes.hotelAbout_top_title}>
                                <div className={classes.hotelAbout_top_title_name}>{hotel.name}</div>
                                <div className={classes.hotelAbout_top_title_desc}>
                                    {hotel.city && hotel.city &&
                                        <>
                                            <img src="/map.png" alt="" />
                                            {hotel.city}, {hotel.address}
                                        </>
                                    }
                                    {hotel.link &&
                                        <>
                                            <img src="/web.png" alt="" />
                                            <a href={`${/^(https?:\/\/)/.test(hotel.link) ? hotel.link : 'https://' + hotel.link}`} target="_blank">{hotel.link}</a>
                                        </>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className={classes.hotelAbout_top_button}>
                            {(userRole == 'SUPERADMIN' || userRole == 'HOTELADMIN' || userRole == 'DISPATCHERADMIN') &&
                                <Button onClick={handleEditClick}>
                                    {isEditing ? "Сохранить" : "Редактировать"}
                                </Button>
                            }
                        </div>
                    </div>

                    <div className={classes.hotelAbout_info}>
                        <div className={classes.hotelAbout_info_block_meal}>
                            <div className={classes.hotelAbout_info_label}>Расписание питания</div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>Завтрак</label>
                                <div className={classes.mealTime}>
                                    <label>с</label>
                                    <input
                                        type="time"
                                        name="breakfastStart"
                                        value={hotel.breakfast.start || ""}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={classes.hotelAbout_info_input}
                                    />

                                    <label>до</label>
                                    <input
                                        type="time"
                                        name="breakfastEnd"
                                        value={hotel.breakfast.end || ""}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={classes.hotelAbout_info_input}
                                    />
                                </div>
                            </div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>Обед</label>
                                <div className={classes.mealTime}>
                                    <label>с</label>
                                    <input
                                        type="time"
                                        name="lunchStart"
                                        value={hotel.lunch.start || ""}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={classes.hotelAbout_info_input}
                                    />

                                    <label>до</label>
                                    <input
                                        type="time"
                                        name="lunchEnd"
                                        value={hotel.lunch.end || ""}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={classes.hotelAbout_info_input}
                                    />
                                </div>
                            </div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>Ужин</label>
                                <div className={classes.mealTime}>
                                    <label>с</label>
                                    <input
                                        type="time"
                                        name="dinnerStart"
                                        value={hotel.dinner.start || ""}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={classes.hotelAbout_info_input}
                                    />

                                    <label>до</label>
                                    <input
                                        type="time"
                                        name="dinnerEnd"
                                        value={hotel.dinner.end || ""}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={classes.hotelAbout_info_input}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={classes.hotelAbout_info_block}>
                            <div className={classes.hotelAbout_info_label}>Адрес</div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>Страна</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={hotel.country || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>Город</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={hotel.city || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>Улица</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={hotel.address || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>Индекс</label>
                                <input
                                    type="text"
                                    name="index"
                                    value={hotel.index || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                        </div>
                        <div className={classes.hotelAbout_info_block}>
                            <div className={classes.hotelAbout_info_label}>Контакты</div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>Почта</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={hotel.email || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>Телефон</label>
                                <input
                                    type="tel"
                                    name="number"
                                    value={hotel.number || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>Ссылка</label>
                                <input
                                    type="tel"
                                    name="link"
                                    value={hotel.link || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                        </div>
                        <div className={classes.hotelAbout_info_block}>
                            <div className={classes.hotelAbout_info_label}>Реквизиты</div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>ИНН</label>
                                <input
                                    type="text"
                                    name="inn"
                                    value={hotel.inn || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>ОГРН</label>
                                <input
                                    type="text"
                                    name="ogrn"
                                    value={hotel.ogrn || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>Р/С</label>
                                <input
                                    type="text"
                                    name="rs"
                                    value={hotel.rs || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>В БАНКЕ</label>
                                <input
                                    type="text"
                                    name="bank"
                                    value={hotel.bank || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                            <div className={classes.hotelAbout_info_item}>
                                <label>БИК</label>
                                <input
                                    type="text"
                                    name="bik"
                                    value={hotel.bik || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                        </div>
                        <div className={classes.hotelAbout_info_block}>
                            <div className={classes.hotelAbout_info_label}>Информация об отеле</div>

                            <div className={classes.hotelAbout_info_item}>
                                <label>Название отеля</label>
                                <input
                                    type="tel"
                                    name="name"
                                    value={hotel.name || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                            <div className={classes.hotelAbout_info_item_info}>
                                <label>Описание</label>
                                <textarea
                                    type="text"
                                    name="description"
                                    value={hotel.description || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={classes.hotelAbout_info_input}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default HotelAbout_tabComponent;
