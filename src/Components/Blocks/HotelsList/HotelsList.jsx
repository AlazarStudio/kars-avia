import React, { useState, useRef, useEffect } from "react";
import classes from './HotelsList.module.css';
import Filter from "../Filter/Filter";
import CreateRequestHotel from "../CreateRequestHotel/CreateRequestHotel";
import { requestsHotels } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataHotels from "../InfoTableDataHotels/InfoTableDataHotels";
import { gql, useQuery } from "@apollo/client";

function HotelsList({ children, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);

    const GET_HOTELS = gql`
        query Hotel {
            hotels {
                id
                name
                city
                address
                quote
            }
        }
    `;

    const { loading, error, data } = useQuery(GET_HOTELS);
    const [companyData, setCompanyData] = useState([]);

    useEffect(() => {
        if (data && data.hotels) {
            const sortedHotels = [...data.hotels].reverse();
            let sorted = [];
            sortedHotels.map((hotel) => {
                sorted.push({
                    id: hotel.id,
                    hotelName: hotel.name,
                    hotelCity: hotel.city,
                    hotelAdress: hotel.address,
                    hotelKvota: hotel.quote,
                    // hotelImage: hotel.images
                    hotelImage: 'hotelImage.png'
                })
            })

            setCompanyData(sorted);
        }
    }, [data]);


    const addHotel = (newHotel) => {
        setCompanyData([...companyData, newHotel]);
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
            (filterData.filterSelect === '' || request.hotelCity.includes(filterData.filterSelect)) &&
            (
                request.hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.hotelCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.hotelAdress.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.hotelKvota.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    // console.log(filteredRequests)

    let filterList = ['Москва', 'Санкт-Петербург'];

    return (
        <>
            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>Гостиницы</Header>
                </div>

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
                        buttonTitle={'Добавить гостиницу'}
                        filterList={filterList}
                        needDate={false}
                    />
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
