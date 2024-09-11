import React, { useState } from "react";
import classes from './Estafeta.module.css';
import { Link } from "react-router-dom";
import Filter from "../Filter/Filter";
import InfoTableData from "../InfoTableData/InfoTableData";
import CreateRequest from "../CreateRequest/CreateRequest";
import ExistRequest from "../ExistRequest/ExistRequest";
import ChooseHotel from "../ChooseHotel/ChooseHotel";

// import { requests } from "../../../requests";
import Header from "../Header/Header";

function Estafeta({ children, requests, ...props }) {
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
        filterSelect: '',
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

    function convertToDate(timestamp) {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0]; // возвращает дату в формате YYYY-MM-DD
    }

    const filteredRequests = requests.filter(request => {
        return (
            (filterData.filterSelect === '' || request.aviacompany.includes(filterData.filterSelect)) &&
            (filterData.filterDate === '' || convertToDate(Number(request.createdAt)) == filterData.filterDate) &&
            (
                request.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                // request.airline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.airport.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival.flight.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure.flight.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.status.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    let filterList = ['Азимут', 'S7 airlines', 'Северный ветер']

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
                    <Filter
                        toggleSidebar={toggleCreateSidebar}
                        handleChange={handleChange}
                        filterData={filterData}
                        buttonTitle={'Создать заявку'}
                        filterList={filterList}
                        needDate={true}
                    />
                </div>

                <InfoTableData toggleRequestSidebar={toggleRequestSidebar} requests={filteredRequests} setChooseObject={setChooseObject} />

                <CreateRequest show={showCreateSidebar} onClose={toggleCreateSidebar} />
                <ExistRequest show={showRequestSidebar} onClose={toggleRequestSidebar} setShowChooseHotel={setShowChooseHotel} />
                <ChooseHotel show={showChooseHotel} onClose={toggleChooseHotel} chooseObject={chooseObject} id={'relay'} />
            </div>
        </>
    );
}

export default Estafeta;
