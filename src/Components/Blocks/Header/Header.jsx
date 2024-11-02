import React, { useEffect, useState, useMemo } from "react";
import classes from './Header.module.css';
import { Link } from "react-router-dom";
import { decodeJWT, GET_DISPATCHER, getCookie, server } from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";

function Header({ children }) {
    // Получаем токен из cookies
    const token = getCookie('token');

    // Извлечение ID пользователя из токена
    const userID = useMemo(() => token ? decodeJWT(token).userId : null, [token]);

    // Запрос данных пользователя на основе userID
    const { loading, error, data } = useQuery(GET_DISPATCHER, {
        variables: { userId: userID },
        skip: !userID  // Пропускаем запрос, если нет userID
    });

    // Форматируем текущую дату с помощью useMemo для мемоизации результата
    const formattedDate = useMemo(() => {
        const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
        const currentDate = new Date();

        return `${daysOfWeek[currentDate.getDay()]}, ${currentDate.getDate()} ${months[currentDate.getMonth()]}`;
    }, []);

    return (
        <div className={classes.section_top}>
            {/* Заголовок страницы */}
            <div className={classes.section_top_title}>{children}</div>

            {/* Отображение состояния загрузки и ошибок */}
            {loading && <p>Загрузка...</p>}
            {error && <p>Ошибка: {error.message}</p>}

            {/* Основные элементы заголовка (уведомления, дата, профиль) */}
            {!loading && !error && (
                <div className={classes.section_top_elems}>
                    {/* Иконка уведомлений */}
                    <div className={classes.section_top_elems_notify}>
                        <div className={classes.section_top_elems_notify_red}></div>
                        <img src="/notify.png" alt="Уведомления" />
                    </div>

                    {/* Отображение текущей даты */}
                    <div className={classes.section_top_elems_date}>
                        <div>{formattedDate}</div>
                    </div>

                    {/* Аватар профиля пользователя */}
                    <div className={classes.section_top_elems_profile}>
                        <img
                            src={data?.user?.images?.[0] ? `${server}${data.user.images[0]}` : "/no-avatar.png"}
                            alt="Профиль пользователя"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Header;
