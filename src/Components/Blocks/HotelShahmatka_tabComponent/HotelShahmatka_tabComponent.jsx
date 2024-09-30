import React, { useRef, useState } from "react";
import classes from './HotelShahmatka_tabComponent.module.css';
import HotelTablePageComponent from "../HotelTablePageComponent/HotelTablePageComponent";
import Filter from "../Filter/Filter";

import { GET_HOTEL_ROOMS } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function HotelShahmatka_tabComponent({ children, id, ...props }) {

    const { loading, error, data } = useQuery(GET_HOTEL_ROOMS, {
        variables: { hotelId: id },
    });

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

    let allRooms = [];

    data && data.hotel.categories.map((category, index) => {
        return category.rooms.map((item) => (
            allRooms.push({
                room: item.name,
                places: item.places
            })
        ))
    });

    allRooms.sort((a, b) => a.room.localeCompare(b.room));

    const placesArray = allRooms.map(room => room.places);
    const uniquePlacesArray = [...new Set(placesArray)];
    uniquePlacesArray.sort((a, b) => a - b);

    const dataInfo = [];

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

    const filteredRequests = data && allRooms.filter(request => {
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

            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && (
                <HotelTablePageComponent maxHeight={"635px"} allRooms={filteredRequests} data={dataInfo} idHotel={id} dataObject={dataObject} id={'hotels'} showAddBronForm={showAddBronForm} />
            )}
        </>
    );
}

export default HotelShahmatka_tabComponent;