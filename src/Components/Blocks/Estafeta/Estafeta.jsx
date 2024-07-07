import React from "react";
import classes from './Estafeta.module.css';
import { Link } from "react-router-dom";

function Estafeta({ children, ...props }) {

    return (
        <>
            <div className={classes.section}>
                <div className={classes.section_top}>
                    <div className={classes.section_top_title}>Эстафета</div>
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
                </div>
            </div>
        </>
    );
}

export default Estafeta;