import React, { useState, useRef, useEffect } from "react";
import classes from './AirlinesList.module.css';
import Filter from "../Filter/Filter";
import { requestsAirlanes } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataAirlines from "../InfoTableDataAirlines/InfoTableDataAirlines";
import CreateRequestAirline from "../CreateRequestAirline/CreateRequestAirline";
import { GET_AIRLINES, GET_AIRLINES_SUBSCRIPTION, GET_AIRLINES_UPDATE_SUBSCRIPTION } from "../../../../graphQL_requests";
import { useQuery, useSubscription } from "@apollo/client";

function AirlinesList({ children, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);

    const [companyData, setCompanyData] = useState([]);
    const { loading, error, data, refetch } = useQuery(GET_AIRLINES);
    const { data: dataSubscription } = useSubscription(GET_AIRLINES_SUBSCRIPTION);
    const { data: dataSubscriptionUpd } = useSubscription(GET_AIRLINES_UPDATE_SUBSCRIPTION);

    useEffect(() => {
        if (data && data.airlines) {
            const sortedAirlines = [...data.airlines].sort((a, b) => a.name.localeCompare(b.name));
            setCompanyData(sortedAirlines);
        }

        if (dataSubscription && dataSubscription.hotelCreated) {
            setCompanyData((prevCompanyData) => {
                const updatedData = [...prevCompanyData, dataSubscription.airlineCreated];
                return updatedData.sort((a, b) => a.name.localeCompare(b.name));
            });
        }

        refetch()
    }, [data, refetch, dataSubscription, dataSubscriptionUpd]);

    const addHotel = (airline) => {
        setCompanyData([...companyData, airline].sort((a, b) => a.name.localeCompare(b.name)));
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
                request.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    let filterList = ['Москва', 'Санкт-Петербург'];

    return (
        <>
            <div className={classes.section}>
                <Header>Авиакомпании</Header>

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

                {loading && <p>Loading...</p>}
                {error && <p>Error: {error.message}</p>}
                {!loading && !error && (
                    <InfoTableDataAirlines
                        toggleRequestSidebar={toggleRequestSidebar}
                        requests={filteredRequests}
                    />
                )}

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
