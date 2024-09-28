import React, { useEffect, useState } from "react";
import classes from './Header.module.css';
import { Link } from "react-router-dom";
import { decodeJWT, GET_DISPATCHER, getCookie, server } from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";

function Header({ children, ...props }) {
    const token = getCookie('token');

    const [userID, setUserID] = useState();

    useEffect(() => {
        if (token) {
            setUserID(decodeJWT(token).userId);
        }
    }, [token]);

    const { loading, error, data } = useQuery(GET_DISPATCHER, {
        variables: { userId: userID },
    });

    console.log(userID, data)

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

            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && (
                <div className={classes.section_top_elems}>
                    <div className={classes.section_top_elems_notify}>
                        <div className={classes.section_top_elems_notify_red}></div>
                        <img src="/notify.png" alt="" />
                    </div>
                    <div className={classes.section_top_elems_date}>
                        <div>{getFormattedDate()}</div>
                    </div>
                    <div className={classes.section_top_elems_profile}>
                        <img src={data.user.images ? `${server}${data.user.images[0]}` :`/no-avatar.png`} alt="" />
                    </div>
                </div>
            )}
        </>
    );
}

export default Header;