import React, { useState, useRef } from "react";
import classes from './HotelsList.module.css';
import Filter from "../Filter/Filter";
import CreateRequestHotel from "../CreateRequestHotel/CreateRequestHotel";
import { requestsHotels } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataHotels from "../InfoTableDataHotels/InfoTableDataHotels";

function HotelsList({ children, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    
    const [companyData, setCompanyData] = useState(requestsHotels);

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
            (filterData.filterSelect === '' || request.hotelCity.includes(filterData.filterSelect)) &&
            (
                request.hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.hotelCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.hotelAdress.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.hotelKvota.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    let filterList = ['Москва', 'Санкт-Петербург'];

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
                        style={{ width: '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <Filter
                        toggleSidebar={toggleCreateSidebar}
                        handleChange={handleChange}
                        filterData={filterData}
                        buttonTitle={'Добавить гостиницу'}
                        filterList={filterList}
                        needDate={false}
                    />
                </div>

                <InfoTableDataHotels 
                    toggleRequestSidebar={toggleRequestSidebar} 
                    requests={filteredRequests}  
                />

                <CreateRequestHotel 
                    show={showCreateSidebar} 
                    onClose={toggleCreateSidebar} 
                    addHotel={addHotel} 
                />
            </div>
        </>
    );
}

export default HotelsList;
