import React, { useState, useRef, useEffect } from "react";
import classes from './HotelsList.module.css';
import Filter from "../Filter/Filter";
import CreateRequestHotel from "../CreateRequestHotel/CreateRequestHotel";
import { requestsHotels } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataHotels from "../InfoTableDataHotels/InfoTableDataHotels";
import { gql, useQuery } from "@apollo/client";
import { GET_HOTELS } from "../../../../graphQL_requests";

function HotelsList({ children, user, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);

    const { loading, error, data, refetch } = useQuery(GET_HOTELS);
    const [companyData, setCompanyData] = useState([]);

    useEffect(() => {
        if (data && data.hotels) {
            const sortedHotels = [...data.hotels].sort((a, b) => a.name.localeCompare(b.name));
            setCompanyData(sortedHotels);
        }
        refetch()
    }, [data, refetch]);

    const addHotel = (newHotel) => {
        setCompanyData([...companyData, newHotel].sort((a, b) => a.name.localeCompare(b.name)));
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
            (filterData.filterSelect === '' || request.city.includes(filterData.filterSelect)) &&
            (
                request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.address.toLowerCase().includes(searchQuery.toLowerCase())
                // request.quote.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    let filterList = ['Москва', 'Санкт-Петербург'];

    return (
        <>
            <div className={classes.section}>
                <Header>Гостиницы</Header>

                <div className={classes.section_searchAndFilter}>
                    <input
                        type="text"
                        placeholder="Поиск"
                        style={{ width: '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    {(user.role == 'SUPERADMIN' || user.role == 'DISPATCHERADMIN') &&
                        <Filter
                            toggleSidebar={toggleCreateSidebar}
                            handleChange={handleChange}
                            filterData={filterData}
                            buttonTitle={'Добавить гостиницу'}
                            filterList={filterList}
                            needDate={false}
                        />
                    }
                </div>
                {loading && <p>Loading...</p>}
                {error && <p>Error: {error.message}</p>}

                {!loading && !error && (
                    <InfoTableDataHotels
                        toggleRequestSidebar={toggleRequestSidebar}
                        requests={filteredRequests}
                    />

                )}
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
