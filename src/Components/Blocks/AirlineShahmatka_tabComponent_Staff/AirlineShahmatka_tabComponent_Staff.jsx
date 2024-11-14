import React, { useEffect, useRef, useState } from "react";
import classes from './AirlineShahmatka_tabComponent_Staff.module.css';
import Filter from "../Filter/Filter.jsx";

import { decodeJWT, DELETE_AIRLINE_STAFF, GET_AIRLINE_USERS, GET_BRONS_HOTEL, GET_STAFF_HOTELS, getCookie } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";
import AirlineTablePageComponent from "../AirlineTablePageComponent/AirlineTablePageComponent.jsx";
import CreateRequestAirlineStaff from "../CreateRequestAirlineStaff/CreateRequestAirlineStaff.jsx";
import UpdateRequestAirlineStaff from "../UpdateRequestAirlineStaff/UpdateRequestAirlineStaff.jsx";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";

function AirlineShahmatka_tabComponent_Staff({ children, id, ...props }) {
    const [userRole, setUserRole] = useState();
    const token = getCookie('token');

    useEffect(() => {
        setUserRole(decodeJWT(token).role);
    }, [token]);

    const { loading, error, data } = useQuery(GET_AIRLINE_USERS, {
        variables: { airlineId: id },
    });

    const [staff, setStaff] = useState([]);

    useEffect(() => {
        if (data) {
            setStaff(data.airline.staff);
        }
    }, [data]);

    const [hotelBronsInfo, setHotelBronsInfo] = useState([]);

    const { loading: bronLoading, error: bronError, data: bronData } = useQuery(GET_STAFF_HOTELS, {
        variables: { airlineStaffsId: id },
    });

    useEffect(() => {
        if (bronData && bronData.airlineStaffs) {
            setHotelBronsInfo(bronData.airlineStaffs);
        }
    }, [bronData]);

    const [showAddCategory, setshowAddCategory] = useState(false);
    const [showUpdateCategory, setshowUpdateCategory] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState();

    const [showDelete, setShowDelete] = useState(false);

    const toggleCategory = () => {
        setshowAddCategory(!showAddCategory)
    }

    const toggleCategoryUpdate = () => {
        setshowUpdateCategory(!showUpdateCategory)
    }

    const dataInfo = hotelBronsInfo && hotelBronsInfo.flatMap(person =>
        person.hotelChess.map(hotel => ({
            start: hotel.start,
            startTime: hotel.startTime,
            end: hotel.end,
            endTime: hotel.endTime,
            clientID: hotel.clientId,
            hotelName: hotel.hotel.name
        }))
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [selectQuery, setSelectQuery] = useState('');
    const [showAddBronForm, setShowAddBronForm] = useState(false);

    const [deleteIndex, setDeleteIndex] = useState(null);

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
    }).sort((a, b) => a.name.localeCompare(b.name));

    const deleteComponentRef = useRef();

    const closeDeleteComponent = () => {
        setShowDelete(false);
        setshowUpdateCategory(true);
    };

    const [deleteAirlineStaff] = useMutation(DELETE_AIRLINE_STAFF, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const deleteTarif = async (user) => {
        try {
            let request = await deleteAirlineStaff({
                variables: {
                    "deleteAirlineStaffId": user.id
                }
            });

            if (request) {
                setStaff(staff.filter(staffMember => staffMember.id !== user.id));
                setShowDelete(false);
                setshowUpdateCategory(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading || bronLoading) return <p>Loading...</p>;
    if (error || bronError) return <p>Error: {error ? error.message : bronError.message}</p>;

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


            {(hotelBronsInfo.length === 0) &&
                <AirlineTablePageComponent toggleCategoryUpdate={toggleCategoryUpdate} maxHeight={"635px"} dataObject={filteredRequests} dataInfo={[]} setSelectedStaff={setSelectedStaff} />
            }

            {(hotelBronsInfo.length !== 0) &&
                <AirlineTablePageComponent toggleCategoryUpdate={toggleCategoryUpdate} maxHeight={"635px"} dataObject={filteredRequests} dataInfo={dataInfo} setSelectedStaff={setSelectedStaff} />
            }

            <CreateRequestAirlineStaff id={id} show={showAddCategory} onClose={toggleCategory} addTarif={staff} setAddTarif={setStaff} />
            <UpdateRequestAirlineStaff id={id} setDeleteIndex={setDeleteIndex} show={showUpdateCategory} setShowDelete={setShowDelete} onClose={toggleCategoryUpdate} selectedStaff={selectedStaff} setAddTarif={setStaff} />

            {showDelete && (
                <DeleteComponent
                    ref={deleteComponentRef}
                    remove={() => deleteTarif(deleteIndex)}
                    close={closeDeleteComponent}
                    title={`Вы действительно хотите удалить сотрудника?`}
                />
            )}
        </>
    );
}

export default AirlineShahmatka_tabComponent_Staff;