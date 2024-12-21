import React, { useState, useEffect, useMemo } from "react";
import classes from './HotelsList.module.css';
import Filter from "../Filter/Filter";
import CreateRequestHotel from "../CreateRequestHotel/CreateRequestHotel";
import Header from "../Header/Header";
import InfoTableDataHotels from "../InfoTableDataHotels/InfoTableDataHotels";
import { useQuery, useSubscription } from "@apollo/client";
import { GET_HOTELS, GET_HOTELS_SUBSCRIPTION, GET_HOTELS_UPDATE_SUBSCRIPTION } from "../../../../graphQL_requests";
import { roles } from "../../../roles";
import ReactPaginate from "react-paginate";
import { useLocation, useNavigate } from "react-router-dom";

function HotelsList({ children, user, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);

    const { loading, error, data, refetch } = useQuery(GET_HOTELS);
    const { data: dataSubscription } = useSubscription(GET_HOTELS_SUBSCRIPTION);
    const { data: dataSubscriptionUpd } = useSubscription(GET_HOTELS_UPDATE_SUBSCRIPTION);

    const [companyData, setCompanyData] = useState([]);
    const [filterData, setFilterData] = useState({ filterSelect: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [pageInfo, setPageInfo] = useState({ skip: 0, take: 20 });

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (data && data.hotels) {
            const sortedHotels = [...data.hotels.hotels].sort((a, b) => a.city.localeCompare(b.city));
            setCompanyData(sortedHotels);
        }

        if (dataSubscription && dataSubscription.hotelCreated) {
            setCompanyData((prevCompanyData) => {
                const updatedData = [...prevCompanyData, dataSubscription.hotelCreated];
                return updatedData.sort((a, b) => a.city.localeCompare(b.city));
            });
        }

        if (dataSubscriptionUpd) refetch();
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredRequests = companyData.filter(request => {
        return (
            (filterData.filterSelect === '' || request.city.includes(filterData.filterSelect)) &&
            (
                request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.address.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    // Пагинация: учитываем текущую страницу
    const paginatedRequests = useMemo(() => {
        const start = pageInfo.skip * pageInfo.take;
        const end = start + pageInfo.take;
        return filteredRequests.slice(start, end);
    }, [filteredRequests, pageInfo]);

    const handlePageClick = (event) => {
        const selectedPage = event.selected;
        setPageInfo(prev => ({ ...prev, skip: selectedPage }));
        navigate(`?page=${selectedPage + 1}`);
    };

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
                    {(user.role === roles.superAdmin || user.role === roles.dispatcerAdmin) &&
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
                    <>
                        <InfoTableDataHotels
                            toggleRequestSidebar={toggleRequestSidebar}
                            requests={paginatedRequests.map((request, index) => ({
                                ...request,
                                order: pageInfo.skip * pageInfo.take + index + 1  // Добавляем порядковый номер
                            }))}
                        />

                        <div className={classes.pagination}>
                            <ReactPaginate
                                previousLabel={"←"}
                                nextLabel={"→"}
                                breakLabel={"..."}
                                pageCount={Math.ceil(filteredRequests.length / pageInfo.take)} // Количество страниц, основанное на отфильтрованных данных
                                marginPagesDisplayed={2}
                                pageRangeDisplayed={5}
                                onPageChange={handlePageClick}
                                forcePage={pageInfo.skip}
                                containerClassName={classes.pagination}
                                activeClassName={classes.activePaginationNumber}
                                pageLinkClassName={classes.paginationNumber}
                            />
                        </div>
                    </>
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
