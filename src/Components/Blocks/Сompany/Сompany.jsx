import React, { useState } from "react";
import classes from './Сompany.module.css';
import Filter from "../Filter/Filter";
import CreateRequestCompany from "../CreateRequestCompany/CreateRequestCompany";

import { requestsReserve } from "../../../requests";
import Header from "../Header/Header";
import InfoTableData from "../InfoTableData/InfoTableData";
import ExistRequest from "../ExistRequest/ExistRequest";

function Сompany({ children, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [showChooseHotel, setShowChooseHotel] = useState(false);
    const [chooseObject, setChooseObject] = useState([]);

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

    let filterList = ['Модератор', 'Администратор']

    return (
        <>
            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>Компания</Header>
                </div>

                <div className={classes.section_searchAndFilter}>
                    <input
                        type="text"
                        placeholder="Поиск"
                        style={{ 'width': '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <Filter
                        toggleSidebar={toggleCreateSidebar}
                        handleChange={handleChange}
                        filterData={filterData}
                        buttonTitle={'Добавить аккаунт диспетчера'}
                        filterList={filterList}
                        needDate={false}
                    />
                </div>

                <InfoTableData toggleRequestSidebar={toggleRequestSidebar} requests={filteredRequests} setChooseObject={setChooseObject} />

                <CreateRequestCompany show={showCreateSidebar} onClose={toggleCreateSidebar} />
                <ExistRequest show={showRequestSidebar} onClose={toggleRequestSidebar} setShowChooseHotel={setShowChooseHotel} />
            </div>
        </>
    );
}

export default Сompany;
