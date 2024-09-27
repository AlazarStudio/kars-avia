import React, { useEffect, useRef, useState } from "react";
import classes from './AirlineShahmatka_tabComponent_Staff.module.css';
import Filter from "../Filter/Filter.jsx";

import { GET_AIRLINE_USERS } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";
import AirlineTablePageComponent from "../AirlineTablePageComponent/AirlineTablePageComponent.jsx";
import CreateRequestAirlineStaff from "../CreateRequestAirlineStaff/CreateRequestAirlineStaff.jsx";

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

    const [showAddCategory, setshowAddCategory] = useState(false);
    
    const toggleCategory = () => {
        setshowAddCategory(!showAddCategory)
    }
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
        { start: '2024-09-21', startTime: '14:00', end: '2024-09-29', endTime: '10:00', clientID: '66f68df2fa3cc14417aeab62' },
        { start: '2024-09-11', startTime: '14:00', end: '2024-09-19', endTime: '10:00', clientID: '66f69b8e1e5d55111906de92' },
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

    const filteredRequests = staff.filter(request => {
        const matchesSearch = searchQuery === '' ||
            // request.gender.toLowerCase().includes(searchQuery.toLowerCase()) ||
            // request.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.name.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesSearch;
    });

    return (
        <>
            <div className={classes.section_searchAndFilter}>
                <input
                    type="text"
                    placeholder="Поиск по ФИО сотрудника или должности"
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
                        toggleSidebar={toggleCategory}
                        handleChange={handleChange}
                        buttonTitle={'Добавить сотрудника'}
                    />
                </div>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && (
                <AirlineTablePageComponent maxHeight={"635px"} dataObject={filteredRequests} dataInfo={dataInfo} />
            )}


            <CreateRequestAirlineStaff id={id} show={showAddCategory} onClose={toggleCategory} addTarif={staff} setAddTarif={setStaff} />
        </>
    );
}

export default AirlineShahmatka_tabComponent_Staff;