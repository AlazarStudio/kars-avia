import React, { useState } from "react";
import classes from './Estafeta.module.css';
import { Link } from "react-router-dom";
import Filter from "../Filter/Filter";
import InfoTableData from "../InfoTableData/InfoTableData";
import CreateRequest from "../CreateRequest/CreateRequest";
import ExistRequest from "../ExistRequest/ExistRequest";
import ChooseHotel from "../ChooseHotel/ChooseHotel";

import { requests } from "../../../requests";
import Header from "../Header/Header";

function Estafeta({ children, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [showChooseHotel, setShowChooseHotel] = useState(false);
    const [chooseObject, setChooseObject] = useState({});

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
                    <Header>Эстафета</Header>
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

                <InfoTableData toggleRequestSidebar={toggleRequestSidebar} requests={filteredRequests} setChooseObject={setChooseObject}/>

                <CreateRequest show={showCreateSidebar} onClose={toggleCreateSidebar} />
                <ExistRequest show={showRequestSidebar} onClose={toggleRequestSidebar} setShowChooseHotel={setShowChooseHotel} />
                <ChooseHotel show={showChooseHotel} onClose={toggleChooseHotel} chooseObject={chooseObject}/>
            </div>
        </>
    );
}

export default Estafeta;
