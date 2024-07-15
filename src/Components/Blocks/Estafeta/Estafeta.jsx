import React, { useState } from "react";
import classes from './Estafeta.module.css';
import { Link } from "react-router-dom";
import Filter from "../Filter/Filter";
import InfoTableData from "../InfoTableData/InfoTableData";
import CreateRequest from "../CreateRequest/CreateRequest";

function Estafeta({ children, ...props }) {
    const [showSidebar, setShowSidebar] = useState(false);

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
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
                    <Filter toggleSidebar={toggleSidebar} handleChange={handleChange} filterData={filterData}/>
                </div>

                <InfoTableData />

                <CreateRequest show={showSidebar} onClose={toggleSidebar} />
            </div>
        </>
    );
}

export default Estafeta;