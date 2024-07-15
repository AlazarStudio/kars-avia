import React, { useState } from "react";
import classes from './Estafeta.module.css';
import { Link } from "react-router-dom";
import Filter from "../Filter/Filter";
import InfoTableData from "../InfoTableData/InfoTableData";
import CreateRequest from "../CreateRequest/CreateRequest";
import ExistRequest from "../ExistRequest/ExistRequest";

function Estafeta({ children, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);

    const toggleCreateSidebar = () => {
        setShowCreateSidebar(!showCreateSidebar);
    };

    const toggleRequestSidebar = () => {
        setShowRequestSidebar(!showRequestSidebar);
    };

    const [filterData, setFilterData] = useState({
        filterAirport: '',
        filterDate: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prevState => ({
            ...prevState,
            [name]: value
        }));
    }
    
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

                <div className={classes.section_searchAndFilter}>
                    <input type="text" placeholder="Поиск" style={{'width': '500px'}}/>
                    <Filter toggleSidebar={toggleCreateSidebar} handleChange={handleChange} filterData={filterData}/>
                </div>

                <InfoTableData toggleRequestSidebar={toggleRequestSidebar}/>

                <CreateRequest show={showCreateSidebar} onClose={toggleCreateSidebar} />
                <ExistRequest show={showRequestSidebar} onClose={toggleRequestSidebar} />
            </div>
        </>
    );
}

export default Estafeta;