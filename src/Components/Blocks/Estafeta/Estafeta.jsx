import React, { useEffect, useState } from "react";
import classes from './Estafeta.module.css';
import { Link, useLocation, useParams } from "react-router-dom";
import Filter from "../Filter/Filter";
import InfoTableData from "../InfoTableData/InfoTableData";
import CreateRequest from "../CreateRequest/CreateRequest";
import ExistRequest from "../ExistRequest/ExistRequest";
import ChooseHotel from "../ChooseHotel/ChooseHotel";
import Header from "../Header/Header";

function Estafeta({ children, requests, loading, error, user, setPageInfo, totalPages, pageNumber, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [showChooseHotel, setShowChooseHotel] = useState(false);
    const [chooseObject, setChooseObject] = useState([]);
    const [chooseRequestID, setChooseRequestID] = useState();

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
        return date.toISOString().split('T')[0];
    }


    const filteredRequests = requests && requests.filter(request => {
        return (
            (filterData.filterSelect === '' || request.aviacompany.includes(filterData.filterSelect)) &&
            (filterData.filterDate === '' || convertToDate(Number(request.createdAt)) == filterData.filterDate) &&
            (
                request.person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.person.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.person.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.person.gender.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.airportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

    function renderPagination(totalPages) {
        const paginationItems = [];

        for (let i = 0; i < totalPages; i++) {
            paginationItems.push(
                <Link to={`?page=${i + 1}`}
                    key={i}
                    className={`${classes.paginationNumber} ${(i == pageNumber || (i == 0 && !pageNumber)) && classes.activePaginationNumber}`}
                    onClick={() => {
                        localStorage.setItem('currentPageRelay', i + 1);

                        setPageInfo(prevTarifs => {
                            return { ...prevTarifs, skip: i };
                        });

                        // window.location.reload()
                    }}
                >
                    {i + 1}
                </Link>
            );
        }

        return paginationItems;
    }

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
                {loading && <p>Loading...</p>}
                {error && <p>Error: {error.message}</p>}

                {!loading && !error && requests && (
                    <>
                        <InfoTableData paginationHeight={totalPages == 1 && '295px'} toggleRequestSidebar={toggleRequestSidebar} requests={filteredRequests} chooseRequestID={chooseRequestID} setChooseObject={setChooseObject} setChooseRequestID={setChooseRequestID} />

                        {totalPages > 1 &&
                            <div className={classes.pagination}>
                                {renderPagination(totalPages)}
                            </div>
                        }
                    </>
                )}
                <CreateRequest show={showCreateSidebar} onClose={toggleCreateSidebar} />
                <ExistRequest show={showRequestSidebar} onClose={toggleRequestSidebar} setChooseRequestID={setChooseRequestID} setShowChooseHotel={setShowChooseHotel} chooseRequestID={chooseRequestID} user={user} />
                <ChooseHotel show={showChooseHotel} onClose={toggleChooseHotel} chooseObject={chooseObject} id={'relay'} />
            </div>
        </>
    );
}

export default Estafeta;
