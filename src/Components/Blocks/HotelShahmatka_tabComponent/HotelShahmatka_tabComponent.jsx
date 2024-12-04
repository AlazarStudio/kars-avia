import React, { useEffect, useState } from "react";
import classes from './HotelShahmatka_tabComponent.module.css';
// import HotelTablePageComponent from "../HotelTablePageComponent/HotelTablePageComponent";

import { GET_BRONS_HOTEL, GET_HOTEL_ROOMS } from '../../../../graphQL_requests.js';
import { useQuery } from "@apollo/client";
import NewPlacement from "../../PlacementDND/NewPlacement/NewPlacement.jsx";

function HotelShahmatka_tabComponent({ id }) {
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

    data && data.hotel.rooms.map((item) => (
        allRooms.push({
            room: item.name,
            places: item.places
        })
    ));

    allRooms.sort((a, b) => a.room.localeCompare(b.room));

    const placesArray = allRooms.map(room => room.places);
    const uniquePlacesArray = [...new Set(placesArray)];
    uniquePlacesArray.sort((a, b) => a - b);

    const [hotelBronsInfo, setHotelBronsInfo] = useState([]);

    const { loading: bronLoading, error: bronError, data: bronData } = useQuery(GET_BRONS_HOTEL, {
        variables: { hotelId: id },
    });

    useEffect(() => {
        if (bronData && bronData.hotel && bronData.hotel.hotelChesses) {
            setHotelBronsInfo(bronData.hotel.hotelChesses);
        }
    }, [bronData]);

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
        setShowAddBronForm(!showAddBronForm);
    }

    const filteredRequests = allRooms.filter(request => {
        const matchesRoom = request.room.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlaces = selectQuery === '' || request.places === parseInt(selectQuery);

        const matchingClients = hotelBronsInfo.filter(entry =>
            entry.client.name && entry.client.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            entry.room === request.room
        );

        const matchesClient = matchingClients.length > 0;

        return (matchesRoom || matchesClient) && matchesPlaces;
    });


    if (loading || bronLoading) return <p>Loading...</p>;
    if (error || bronError) return <p>Error: {error ? error.message : bronError.message}</p>;

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

                <div className={classes.legend}>
                    <div className={classes.legendLine}>
                        <div className={classes.legendInfo} style={{ border: '1px solid #9e9e9e', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#9e9e9e' }}></div>
                            <div className={classes.legendInfoText}> Создан</div>
                        </div>
                        <div className={classes.legendInfo} style={{ border: '1px solid #2196f3', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#2196f3' }}></div>
                            <div className={classes.legendInfoText}> Продлен</div>
                        </div>
                    </div>

                    <div className={classes.legendLine}>
                        <div className={classes.legendInfo} style={{ border: '1px solid #4caf50', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#4caf50' }}></div>
                            <div className={classes.legendInfoText}> Забронирован</div>
                        </div>

                        <div className={classes.legendInfo} style={{ border: '1px solid #9575cd', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#9575cd' }}></div>
                            <div className={classes.legendInfoText}> Ранний заезд</div>
                        </div>
                    </div>

                    <div className={classes.legendLine}>
                        <div className={classes.legendInfo} style={{ border: '1px solid #ff9800', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#ff9800' }}></div>
                            <div className={classes.legendInfoText}> Перенесен</div>
                        </div>
                        <div className={classes.legendInfo} style={{ border: '1px solid #f44336', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#f44336' }}></div>
                            <div className={classes.legendInfoText}> Сокращен</div>
                        </div>

                    </div>
                </div>

                {/* <div className={classes.section_searchAndFilter_filter}>
                    <select onChange={handleSelect}>
                        <option value="">Показать все</option>
                        {uniquePlacesArray.map((item, index) => (
                            <option value={`${item}`} key={index}>{item} - МЕСТНЫЕ</option>
                        ))}
                    </select>
                    <div onClick={toggleSidebar}>Добавить бронь</div> 
                </div>*/}
            </div>

            <NewPlacement idHotelInfo={id} searchQuery={searchQuery} />

            {/* {(hotelBronsInfo.length === 0) &&
                <HotelTablePageComponent maxHeight={"635px"} allRooms={filteredRequests} data={[]} idHotel={id} dataObject={dataObject} id={'hotels'} showAddBronForm={showAddBronForm} />
            }

            {(hotelBronsInfo.length !== 0) &&
                <HotelTablePageComponent maxHeight={"635px"} allRooms={filteredRequests} data={hotelBronsInfo} idHotel={id} dataObject={dataObject} id={'hotels'} showAddBronForm={showAddBronForm} />
            } */}

        </>
    );
}

export default HotelShahmatka_tabComponent;
