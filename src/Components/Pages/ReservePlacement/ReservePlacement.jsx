import React, { useEffect, useState } from "react";
import classes from './ReservePlacement.module.css';
import { Link, useParams } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header"
import Filter from "../../Blocks/Filter/Filter";
import Button from "../../Standart/Button/Button";
import InfoTableDataReserve_passengers from "../../Blocks/InfoTableDataReserve_passengers/InfoTableDataReserve_passengers";

import { requestsReserve } from "../../../requests";
import AddNewPassenger from "../../Blocks/AddNewPassenger/AddNewPassenger";

function ReservePlacement({ children, ...props }) {
    let { idRequest } = useParams();

    const [showCreateSidebar, setShowCreateSidebar] = useState(false);

    const toggleCreateSidebar = () => {
        setShowCreateSidebar(!showCreateSidebar);
    };

    const [placement, setPlacement] = useState([]);

    useEffect(() => {
        if (requestsReserve[idRequest]) {
            setPlacement(requestsReserve[idRequest].passengers);
        }
    }, [idRequest, requestsReserve]);

    const addPassenger = (newPassenger) => {
        setPlacement(prevPlacement => [...prevPlacement, newPassenger]);
    };


    return (
        <div className={classes.main}>
            <MenuDispetcher id={'reserve'} />

            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>
                        <div className={classes.titleHeader}>
                            <Link to={'/reserve'} className={classes.backButton}><img src="/arrow.png" alt="" /></Link>
                            Заявка №123MV077
                        </div>
                    </Header>
                </div>

                <div className={classes.section_searchAndFilter}>
                    <Button onClick={toggleCreateSidebar}>Добавить пассажира</Button>
                </div>

                <InfoTableDataReserve_passengers placement={placement} />

                <AddNewPassenger
                    show={showCreateSidebar}
                    onClose={toggleCreateSidebar}
                    onAddPassenger={addPassenger}
                    arrival_date={requestsReserve[idRequest].arrival_date}
                    arrival_time={requestsReserve[idRequest].arrival_time}
                    departure_date={requestsReserve[idRequest].departure_date}
                    departure_time={requestsReserve[idRequest].departure_time}
                />
            </div>

        </div>
    );
}

export default ReservePlacement;