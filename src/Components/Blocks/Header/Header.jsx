import React, { useEffect, useState } from "react";
import classes from './Header.module.css';
import { Link } from "react-router-dom";

function Header({ children, ...props }) {
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setDateTime(new Date());
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    const getFormattedDate = (date) => {
        const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];

        const dayOfWeek = daysOfWeek[date.getDay()];
        const dayOfMonth = date.getDate();
        const month = months[date.getMonth()];

        return `${dayOfWeek}, ${dayOfMonth} ${month}`;
    };

    const getFormattedTime = (date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    };

    return (
        <>
            <div className={classes.section_top_title}>{children}</div>

            <div className={classes.section_top_elems}>
                <div className={classes.section_top_elems_notify}>
                    <div className={classes.section_top_elems_notify_red}></div>
                    <img src="/notify.png" alt="" />
                </div>
                <div className={classes.section_top_elems_date}>{getFormattedDate(dateTime)} - {getFormattedTime(dateTime)}</div>
                <Link to={'/profile'} className={classes.section_top_elems_profile}>
                    <img src="/avatar.png" alt="" />
                </Link>
            </div>
        </>
    );
}

export default Header;