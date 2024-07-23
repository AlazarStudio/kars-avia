import React, { useState } from "react";
import classes from './ReservePlacement.module.css';
import { Link, useParams } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header"
import Filter from "../../Blocks/Filter/Filter";
import Button from "../../Standart/Button/Button";
import InfoTableDataReserve_passengers from "../../Blocks/InfoTableDataReserve_passengers/InfoTableDataReserve_passengers";

import { requestsReserve } from "../../../requests";

function ReservePlacement({ children, ...props }) {
    let { idRequest } = useParams();

    const [searchQuery, setSearchQuery] = useState('');

    const [showCreateSidebar, setShowCreateSidebar] = useState(false);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    }
    
    const toggleCreateSidebar = () => {
        setShowCreateSidebar(!showCreateSidebar);
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    const [filterData, setFilterData] = useState({
        filterAirport: '',
        filterDate: '',
    });

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
                    <Button>Добавить пассажира</Button>
                </div>

                <InfoTableDataReserve_passengers idRequest={idRequest} requests={requestsReserve}/>

            </div>

        </div>
    );
}

export default ReservePlacement;