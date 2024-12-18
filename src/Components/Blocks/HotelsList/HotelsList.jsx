import React, { useState, useRef, useEffect } from "react";
import classes from './HotelsList.module.css';
import Filter from "../Filter/Filter";
import CreateRequestHotel from "../CreateRequestHotel/CreateRequestHotel";
import { requestsHotels } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataHotels from "../InfoTableDataHotels/InfoTableDataHotels";
import { gql, useQuery, useSubscription } from "@apollo/client";
import { GET_HOTELS, GET_HOTELS_SUBSCRIPTION, GET_HOTELS_UPDATE_SUBSCRIPTION } from "../../../../graphQL_requests";
import { roles } from "../../../roles";

function HotelsList({ children, user, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);

    const { loading, error, data, refetch } = useQuery(GET_HOTELS);
    const { data: dataSubscription } = useSubscription(GET_HOTELS_SUBSCRIPTION);
    const { data: dataSubscriptionUpd } = useSubscription(GET_HOTELS_UPDATE_SUBSCRIPTION);

    const [companyData, setCompanyData] = useState([]);

    useEffect(() => {
        if (data && data.hotels) {
            const sortedHotels = [...data.hotels].sort((a, b) => a.city.localeCompare(b.city));
            setCompanyData(sortedHotels);
        }

        if (dataSubscription && dataSubscription.hotelCreated) {
            setCompanyData((prevCompanyData) => {
                const updatedData = [...prevCompanyData, dataSubscription.hotelCreated];
                return updatedData.sort((a, b) => a.city.localeCompare(b.city));
            });
        }

        refetch()
    }, [data, refetch, dataSubscription, dataSubscriptionUpd]);


    const addHotel = (newHotel) => {
        setCompanyData([...companyData, newHotel].sort((a, b) => a.city.localeCompare(b.city)));
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
                    {(user.role == roles.superAdmin || user.role == roles.dispatcerAdmin) &&
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
