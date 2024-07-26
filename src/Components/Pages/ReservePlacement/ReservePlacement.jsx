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
import UpdatePassanger from "../../Blocks/UpdatePassanger/UpdatePassanger";
import DeleteComponent from "../../Blocks/DeleteComponent/DeleteComponent";
import ChooseHotel from "../../Blocks/ChooseHotel/ChooseHotel";

function ReservePlacement({ children, ...props }) {
    let { idRequest } = useParams();

    const [showCreateSidebar, setShowCreateSidebar] = useState(false);

    const toggleCreateSidebar = () => {
        setShowCreateSidebar(!showCreateSidebar);
    };

    const [showUpdateSidebar, setShowUpdateSidebar] = useState(false);

    const toggleUpdateSidebar = () => {
        setShowUpdateSidebar(!showUpdateSidebar);
    };

    const [idDelete, setIdDelete] = useState();
    const [showDelete, setshowDelete] = useState(false);

    const openDeletecomponent = (index) => {
        setshowDelete(true);
        setIdDelete(index)
    };

    const closeDeletecomponent = () => {
        setshowDelete(false);
    };

    const [idPassangerForUpdate, setIdPassangerForUpdate] = useState();

    const [placement, setPlacement] = useState([]);

    useEffect(() => {
        if (requestsReserve[idRequest]) {
            setPlacement(requestsReserve[idRequest].passengers);
        }
    }, [idRequest, requestsReserve]);

    const addPassenger = (newPassenger) => {
        setPlacement(prevPlacement => [...prevPlacement, newPassenger]);
    };

    const updatePassenger = (updatedPassenger, index) => {
        setPlacement(prevPlacement =>
            prevPlacement.map((passenger, i) =>
                i === index ? updatedPassenger : passenger
            )
        );
    };

    const removePassenger = (index) => {
        setPlacement(prevPlacement =>
            prevPlacement.filter((_, i) => i !== index)
        );
        closeDeletecomponent()
    };


    const [showChooseHotel, setShowChooseHotel] = useState(false);
    const toggleChooseHotel = () => {
        setShowChooseHotel(!showChooseHotel);
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

                <InfoTableDataReserve_passengers
                    placement={placement}
                    toggleUpdateSidebar={toggleUpdateSidebar}
                    setIdPassangerForUpdate={setIdPassangerForUpdate}
                    openDeletecomponent={openDeletecomponent}
                    toggleChooseHotel={toggleChooseHotel}
                />

                <AddNewPassenger
                    show={showCreateSidebar}
                    onClose={toggleCreateSidebar}
                    onAddPassenger={addPassenger}
                    start={requestsReserve[idRequest].arrival_date}
                    startTime={requestsReserve[idRequest].arrival_time}
                    end={requestsReserve[idRequest].departure_date}
                    endTime={requestsReserve[idRequest].departure_time}
                />

                <UpdatePassanger
                    show={showUpdateSidebar}
                    onClose={toggleUpdateSidebar}
                    placement={placement[idPassangerForUpdate]}
                    idPassangerForUpdate={idPassangerForUpdate}
                    updatePassenger={updatePassenger}
                />

                <ChooseHotel show={showChooseHotel} onClose={toggleChooseHotel} chooseObject={placement} id={'reserve'} />

                {showDelete && <DeleteComponent remove={removePassenger} index={idDelete} close={closeDeletecomponent} title={`Вы действительно хотите удалить пассажира? `} />}
            </div>

        </div>
    );
}

export default ReservePlacement;