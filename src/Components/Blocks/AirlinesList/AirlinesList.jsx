import React, { useState, useRef } from "react";
import classes from './AirlinesList.module.css';
import Filter from "../Filter/Filter";
import { requestsAirlanes } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataAirlines from "../InfoTableDataAirlines/InfoTableDataAirlines";
import CreateRequestAirline from "../CreateRequestAirline/CreateRequestAirline";

function AirlinesList({ children, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    
    const [companyData, setCompanyData] = useState(requestsAirlanes);

    const addHotel = (newHotel) => {
        setCompanyData([...companyData, newHotel]);
    };

    const toggleCreateSidebar = () => {
        setShowCreateSidebar(!showCreateSidebar);
    };

    const toggleRequestSidebar = () => {
        setShowRequestSidebar(!showRequestSidebar);
    };

    const [filterData, setFilterData] = useState({
        filterSelect: '',
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

    const filteredRequests = companyData.filter(request => {
        return (
            (
                request.airlineName.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    let filterList = ['Москва', 'Санкт-Петербург'];

    return (
        <>
            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>Авиакомпании</Header>
                </div>

                <div className={classes.section_searchAndFilter}>
                    <input
                        type="text"
                        placeholder="Поиск"
                        style={{ width: '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <Filter
                        toggleSidebar={toggleCreateSidebar}
                        handleChange={handleChange}
                        filterData={filterData}
                        buttonTitle={'Добавить авиакомпанию'}
                        needDate={false}
                    />
                </div>

                <InfoTableDataAirlines 
                    toggleRequestSidebar={toggleRequestSidebar} 
                    requests={filteredRequests}  
                />

                <CreateRequestAirline 
                    show={showCreateSidebar} 
                    onClose={toggleCreateSidebar} 
                    addHotel={addHotel} 
                />
            </div>
        </>
    );
}

export default AirlinesList;
