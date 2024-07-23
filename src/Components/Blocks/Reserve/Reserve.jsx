import React, { useState } from "react";
import classes from './Reserve.module.css';
import Filter from "../Filter/Filter";
import CreateRequestReserve from "../CreateRequestReserve/CreateRequestReserve";

import { requestsReserve } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataReserve from "../InfoTableDataReserve/InfoTableDataReserve";

function Reserve({ children, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [showChooseHotel, setShowChooseHotel] = useState(false);

    const toggleCreateSidebar = () => {
        setShowCreateSidebar(!showCreateSidebar);
    };

    const toggleRequestSidebar = () => {
        setShowRequestSidebar(!showRequestSidebar);
    };

    const toggleChooseHotel = () => {
        setShowChooseHotel(!showChooseHotel);
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

    const filteredRequests = requestsReserve.filter(request => {
        return (
            (filterData.filterAirport === '' || request.aviacompany.includes(filterData.filterAirport)) &&
            (filterData.filterDate === '' || request.date === filterData.filterDate) &&
            (
                request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.aviacompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.airport.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.passengers.length == searchQuery
            )
        );
    });

    return (
        <>
            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>Резерв</Header>
                </div>

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

                <InfoTableDataReserve toggleRequestSidebar={toggleRequestSidebar} requests={filteredRequests} />

                <CreateRequestReserve show={showCreateSidebar} onClose={toggleCreateSidebar} />
            </div>
        </>
    );
}

export default Reserve;
