import React, { useEffect, useRef, useState } from "react";
import classes from './AirlineShahmatka_tabComponent_Staff.module.css';
import Filter from "../Filter/Filter.jsx";

import { GET_AIRLINE_USERS } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";
import AirlineTablePageComponent from "../AirlineTablePageComponent/AirlineTablePageComponent.jsx";

function AirlineShahmatka_tabComponent_Staff({ children, id, ...props }) {

    const { loading, error, data } = useQuery(GET_AIRLINE_USERS, {
        variables: { airlineId: id },
    });

    const [staff, setStaff] = useState([]);

    useEffect(() => {
        if (data) {
            setStaff(data.airline.staff);
        }
    }, [data]);

    // const dataObject = [
    //     {
    //         room: '',
    //         place: '',
    //         start: '',
    //         startTime: '',
    //         end: '',
    //         endTime: '',
    //         client: '',
    //         public: false,
    //     }
    // ];

    // let allRooms = [];

    // data && data.hotel.categories.map((category, index) => {
    //     return category.rooms.map((item) => (
    //         allRooms.push({
    //             room: `${item.name} - ${category.tariffs?.name}`,
    //             places: item.places
    //         })
    //     ));
    // });

    // const allRooms = [
    //     { room: '№121', places: 1 },
    //     { room: '№122', places: 1 },
    //     { room: '№221', places: 2 },
    //     { room: '№222', places: 2 },
    // ];

    // const placesArray = allRooms.map(room => room.places);
    // const uniquePlacesArray = [...new Set(placesArray)];
    // uniquePlacesArray.sort((a, b) => a - b);

    const dataInfo = [
        { start: '2024-09-21', startTime: '14:00', end: '2024-09-29', endTime: '10:00', clientID: 'fe2a8fb8-06e4-43bf-9887-3490071a2a5c' },
        { start: '2024-09-11', startTime: '14:00', end: '2024-09-19', endTime: '10:00', clientID: '1b877aff-4b8b-46b6-8695-84cdfdc41e1f' },
    ];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectQuery, setSelectQuery] = useState('');
    const [showAddBronForm, setShowAddBronForm] = useState(false);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    }

    const handleSelect = (e) => {
        setSelectQuery(e.target.value);
    }

    const toggleSidebar = () => {
        setShowAddBronForm(!showAddBronForm)
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    // const filteredRequests = allRooms.filter(request => {
    //     const matchesRoom = request.room.toLowerCase().includes(searchQuery.toLowerCase());
    //     const matchesPlaces = selectQuery === '' || request.places === parseInt(selectQuery);

    //     const matchingClients = dataInfo.filter(entry =>
    //         entry.client.toLowerCase().includes(searchQuery.toLowerCase()) &&
    //         entry.room === request.room
    //     );

    //     const matchesClient = matchingClients.length > 0;

    //     return (matchesRoom || matchesClient) && matchesPlaces;
    // });

    return (
        <>
            <div className={classes.section_searchAndFilter}>
                <input
                    type="text"
                    placeholder="Поиск по номеру комнаты или ФИО клиента"
                    style={{ 'width': '500px' }}
                    value={searchQuery}
                    onChange={handleSearch}
                />
                <div className={classes.section_searchAndFilter_filter}>
                    {/* <select onChange={handleSelect}>
                        <option value="">Показать все</option>
                        {uniquePlacesArray.map((item, index) => (
                            <option value={`${item}`} key={index}>{item} - МЕСТНЫЕ</option>
                        ))}
                    </select> */}

                    <Filter
                        toggleSidebar={toggleSidebar}
                        handleChange={handleChange}
                        buttonTitle={'Добавить сотрудника'}
                    />
                </div>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && (
                <AirlineTablePageComponent maxHeight={"635px"} dataObject={staff} dataInfo={dataInfo}/>
            )}
        </>
    );
}

export default AirlineShahmatka_tabComponent_Staff;