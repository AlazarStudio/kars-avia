import React, { useEffect, useState } from "react";
import classes from './Header.module.css';
import { Link } from "react-router-dom";

function Header({ children, ...props }) {
    const getFormattedDate = () => {
        const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];

        const dayOfWeek = daysOfWeek[new Date().getDay()];
        const dayOfMonth = new Date().getDate();
        const month = months[new Date().getMonth()];

        return `${dayOfWeek}, ${dayOfMonth} ${month}`;
    };

    return (
        <>
            <div className={classes.section_top_title}>{children}</div>

            <div className={classes.section_top_elems}>
                <div className={classes.section_top_elems_notify}>
                    <div className={classes.section_top_elems_notify_red}></div>
                    <img src="/notify.png" alt="" />
                </div>
                <div className={classes.section_top_elems_date}>
                    <div>{getFormattedDate()}</div>
                </div>
                <Link to={'/profile'} className={classes.section_top_elems_profile}>
                    <img src="/avatar.png" alt="" />
                </Link>
            </div>
        </>
    );
}

export default Header;