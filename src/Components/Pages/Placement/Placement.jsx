import React from "react";
import classes from './Placement.module.css';
import { Link, useParams } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header"
import HotelTable from "../../Blocks/HotelTable/HotelTable";

function Placement({ children, ...props }) {
    let { idHotel } = useParams();
    return (
        <div className={classes.main}>
            <MenuDispetcher />

            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>
                        <div className={classes.titleHeader}>
                            <Link to={'/relay'} className={classes.backButton}><img src="/arrow.png" alt="" /></Link>
                            Заявка №123MV077
                        </div>
                    </Header>
                </div>

                <HotelTable/>
            </div>
            
        </div>
    );
}

export default Placement;