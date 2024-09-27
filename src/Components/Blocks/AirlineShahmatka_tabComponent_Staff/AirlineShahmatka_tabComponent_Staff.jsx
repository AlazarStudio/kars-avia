import React, { useRef, useState } from "react";
import classes from './AirlineShahmatka_tabComponent_Staff.module.css';
import HotelTablePageComponent from "../HotelTablePageComponent/HotelTablePageComponent.jsx";
import Filter from "../Filter/Filter.jsx";

import { GET_HOTEL_ROOMS } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function AirlineShahmatka_tabComponent_Staff({ children, id, ...props }) {

    // const { loading, error, data } = useQuery(GET_HOTEL_ROOMS, {
    //     variables: { hotelId: id },
    // });

    const dataObject = [
        {
            room: '',
            place: '',
            start: '',
            startTime: '',
            end: '',
            endTime: '',
            client: '',
            public: false,
        }
    ];

    // let allRooms = [];

    // data && data.hotel.categories.map((category, index) => {
    //     return category.rooms.map((item) => (
    //         allRooms.push({
    //             room: `${item.name} - ${category.tariffs?.name}`,
    //             places: item.places
    //         })
    //     ));
    // });

    const allRooms = [
        { room: '№121', places: 1 },
        { room: '№122', places: 1 },
        { room: '№221', places: 2 },
        { room: '№222', places: 2 },
        { room: '№223', places: 2 },
        { room: '№224', places: 2 },
        { room: '№225', places: 2 },
        { room: '№226', places: 2 },
    ];

    const placesArray = allRooms.map(room => room.places);
    const uniquePlacesArray = [...new Set(placesArray)];
    uniquePlacesArray.sort((a, b) => a - b);

    const dataInfo = [
        { public: true, room: '№121', place: 1, start: '2024-09-01', startTime: '14:00', end: '2024-09-20', endTime: '10:00', client: 'Джатдоев А. С-А.' },
        // { public: true, room: '№122', place: 1, start: '2024-09-01', startTime: '14:00', end: '2024-09-10', endTime: '10:00', client: 'Джатдоев А. С-А.' },
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

    const filteredRequests = allRooms.filter(request => {
        const matchesRoom = request.room.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlaces = selectQuery === '' || request.places === parseInt(selectQuery);

        const matchingClients = dataInfo.filter(entry =>
            entry.client.toLowerCase().includes(searchQuery.toLowerCase()) &&
            entry.room === request.room
        );

        const matchesClient = matchingClients.length > 0;

        return (matchesRoom || matchesClient) && matchesPlaces;
    });

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
                    <select onChange={handleSelect}>
                        <option value="">Показать все</option>
                        {uniquePlacesArray.map((item, index) => (
                            <option value={`${item}`} key={index}>{item} - МЕСТНЫЕ</option>
                        ))}
                    </select>

                    {/* <Filter
                        toggleSidebar={toggleSidebar}
                        handleChange={handleChange}
                        buttonTitle={'Добавить бронь'}
                    /> */}
                </div>
            </div>

            {/* {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && ( */}
                <HotelTablePageComponent maxHeight={"635px"} allRooms={filteredRequests} data={dataInfo} idHotel={id} dataObject={dataObject} id={'hotels'} showAddBronForm={showAddBronForm} />
            {/* )} */}
        </>
    );
}

export default AirlineShahmatka_tabComponent_Staff;