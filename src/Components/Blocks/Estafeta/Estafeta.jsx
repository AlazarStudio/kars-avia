import React, { useState } from "react";
import classes from './Estafeta.module.css';
import { Link } from "react-router-dom";
import Filter from "../Filter/Filter";
import InfoTableData from "../InfoTableData/InfoTableData";
import CreateRequest from "../CreateRequest/CreateRequest";
import ExistRequest from "../ExistRequest/ExistRequest";

import { requests } from "../../../requests";
import DeleteComponent from "../DeleteComponent/DeleteComponent";

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

    const [searchQuery, setSearchQuery] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    }

    const filteredRequests = requests.filter(request => {
        return (
            (filterData.filterAirport === '' || request.aviacompany.includes(filterData.filterAirport)) &&
            (filterData.filterDate === '' || request.date === filterData.filterDate) &&
            (
                request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.post.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.aviacompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.airport.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival_date.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival_time.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure_date.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure_time.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.status.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

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

                {/* <DeleteComponent title={'Вы действительно хотите удалить заявку?'}/> */}

                <div className={classes.section_searchAndFilter}>
                    <input
                        type="text"
                        placeholder="Поиск"
                        style={{ 'width': '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <Filter toggleSidebar={toggleCreateSidebar} handleChange={handleChange} filterData={filterData} />
                </div>

                <InfoTableData toggleRequestSidebar={toggleRequestSidebar} requests={filteredRequests} />

                <CreateRequest show={showCreateSidebar} onClose={toggleCreateSidebar} />
                <ExistRequest show={showRequestSidebar} onClose={toggleRequestSidebar} />
            </div>
        </>
    );
}

export default Estafeta;
