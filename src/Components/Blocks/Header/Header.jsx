import React from "react";
import classes from './Header.module.css';
import { Link } from "react-router-dom";

function Header({ children, ...props }) {
    return (
        <>
            <div className={classes.section_top_title}>{children}</div>
            <div className={classes.section_top_elems}>
                <div className={classes.section_top_elems_notify}>
                    <div className={classes.section_top_elems_notify_red}></div>
                    <img src="/notify.png" alt="" />
                </div>
                <div className={classes.section_top_elems_date}>Чт, 25 апреля</div>
                <Link to={'/profile'} className={classes.section_top_elems_profile}>
                    <img src="/avatar.png" alt="" />
                </Link>
            </div>
        </>
    );
}

export default Header;