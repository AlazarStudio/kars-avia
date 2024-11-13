import React, { useEffect, useState } from "react";
import classes from './Reserve.module.css';
import Filter from "../Filter/Filter";
import CreateRequestReserve from "../CreateRequestReserve/CreateRequestReserve";
import { requestsReserve } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataReserve from "../InfoTableDataReserve/InfoTableDataReserve";
import { GET_AIRLINE, GET_HOTEL_CITY, GET_HOTEL_TARIFS, GET_RESERVE_REQUESTS, REQUEST_RESERVE_CREATED_SUBSCRIPTION, REQUEST_RESERVE_UPDATED_SUBSCRIPTION } from "../../../../graphQL_requests";
import { useQuery, useSubscription } from "@apollo/client";
import { useLocation, useNavigate } from "react-router-dom";
import ReactPaginate from 'react-paginate';

function Reserve({ children, user, idHotel, ...props }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Получение текущей страницы из URL или localStorage
    let pageNumberReserve = new URLSearchParams(location.search).get("page");
    let localPage = localStorage.getItem("currentPageReserve");
    let currentPageReserve = localPage ? parseInt(localPage) - 1 : pageNumberReserve ? parseInt(pageNumberReserve) - 1 : 0;

    // Состояние для фильтрации по статусу
    const [statusFilter, setStatusFilter] = useState(() => {
        return localStorage.getItem("statusFilterReserve") || "created / opened";
    });

    // Состояние для управления параметрами пагинации
    const [pageInfo, setPageInfo] = useState({
        skip: currentPageReserve,
        take: 50
    });

    // Запрос на получение списка заявок с учетом пагинации
    const { loading, error, data, refetch } = useQuery(GET_RESERVE_REQUESTS, {
        variables: { pagination: { skip: pageInfo.skip, take: pageInfo.take, status: statusFilter.split(" / ") } },
    });

    // Обновление состояния фильтрации по статусу
    const handleStatusChange = (value) => {
        setStatusFilter(value);
        localStorage.setItem("statusFilterReserve", value);
    };

    // Подписки на создание и обновление заявок
    const { data: subscriptionData } = useSubscription(REQUEST_RESERVE_CREATED_SUBSCRIPTION);
    const { data: subscriptionUpdateData } = useSubscription(REQUEST_RESERVE_UPDATED_SUBSCRIPTION);

    const [newRequests, setNewRequests] = useState([]);
    const [requests, setRequests] = useState([]);
    const [totalPages, setTotalPages] = useState(1);

    // Сохранение текущей страницы в localStorage
    useEffect(() => {
        if (pageNumberReserve) {
            localStorage.setItem('currentPageReserve', pageNumberReserve);
        }
    }, [pageNumberReserve]);

    // Обновление списка заявок при добавлении новых через подписку
    useEffect(() => {
        if (subscriptionData) {
            const newRequest = subscriptionData.reserveCreated;
            const statusMatchesFilter = statusFilter.split(" / ").includes(newRequest.status);

            if (statusMatchesFilter) {
                setRequests((prevRequests) => {
                    const exists = prevRequests.some(request => request.id === newRequest.id);
                    if (!exists) {
                        if (currentPageReserve === 0) {
                            return [newRequest, ...prevRequests];
                        } else {
                            setNewRequests((prevNewRequests) => [newRequest, ...prevNewRequests]);
                        }
                    }
                    return prevRequests;
                });
            }
            refetch();
        }
    }, [subscriptionData, currentPageReserve, refetch]);

    // Обновление данных заявок из запроса и новых заявок
    useEffect(() => {
        if (data && data.reserves.reserves) {
            let sortedRequests = [...data.reserves.reserves];
            if (currentPageReserve === 0 && newRequests.length > 0) {
                sortedRequests = [...newRequests, ...sortedRequests];
                setNewRequests([]);
            }
            setRequests(sortedRequests);
            setTotalPages(data.reserves.totalPages);
        }
    }, [data, currentPageReserve, newRequests]);

    // Обновление при изменении заявок через подписку на обновление
    useEffect(() => {
        if (subscriptionUpdateData) {
            refetch();
        }
    }, [subscriptionUpdateData, refetch]);

    // Обработчик смены страницы
    const handlePageClick = (event) => {
        const selectedPage = event.selected;
        setPageInfo((prev) => ({ ...prev, skip: selectedPage }));
        localStorage.setItem('currentPageReserve', selectedPage + 1);
        navigate(`?page=${selectedPage + 1}`);
    };

    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [showChooseHotel, setShowChooseHotel] = useState(false);

    const toggleCreateSidebar = () => setShowCreateSidebar(!showCreateSidebar);
    const toggleRequestSidebar = () => setShowRequestSidebar(!showRequestSidebar);
    const toggleChooseHotel = () => setShowChooseHotel(!showChooseHotel);

    const [filterData, setFilterData] = useState({
        filterSelect: '',
        filterDate: '',
    });
    const [searchQuery, setSearchQuery] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };
    const handleSearch = (e) => setSearchQuery(e.target.value);

    const [hotelCity, setHotelCity] = useState();
    const { data: hotelData } = useQuery(GET_HOTEL_CITY, { variables: { hotelId: idHotel } });
    useEffect(() => {
        if (hotelData) setHotelCity(hotelData.hotel.city);
    }, [hotelData]);

    const [airlineName, setAirlineName] = useState();
    const { data: airlineData } = useQuery(GET_AIRLINE, { variables: { airlineId: user.airlineId } });
    useEffect(() => {
        if (airlineData) setAirlineName(airlineData.airline.name);
    }, [airlineData]);

    const filteredRequests = requests && requests.filter(request => {
        const matchesSelect = !filterData.filterSelect || request.aviacompany.includes(filterData.filterSelect);
        const matchesDate = !filterData.filterDate || request.date === filterData.filterDate;
        const matchesSearchQuery = [
            request.id.toLowerCase(),
            request.airport?.city.toLowerCase(),
            request.airline?.name.toLowerCase(),
            request.airport?.name.toLowerCase(),
            request.airport?.code.toLowerCase(),
            request.arrival?.date.toLowerCase(),
            request.departure?.date.toLowerCase(),
            request.status?.toLowerCase()
        ].some(field => field.includes(searchQuery.toLowerCase()));

        const matchesCity = hotelCity ? request.airport?.city.toLowerCase() === hotelCity.toLowerCase() : true;
        const matchesAirline = airlineName ? request.airline?.name.toLowerCase() === airlineName.toLowerCase() : true;

        return matchesCity && matchesSelect && matchesDate && matchesSearchQuery && matchesAirline;
    });

    const filterList = ['Азимут', 'S7 airlines', 'Северный ветер'];
    return (
        <>
            <div className={classes.section}>
                <Header>Резерв</Header>
                <div className={classes.section_searchAndFilter}>
                    <input
                        type="text"
                        placeholder="Поиск"
                        style={{ 'width': '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <Filter
                        user={user}
                        toggleSidebar={toggleCreateSidebar}
                        handleChange={handleChange}
                        filterData={filterData}
                        buttonTitle={'Создать заявку'}
                        filterList={filterList}
                        needDate={true}
                        filterLocalData={localStorage.getItem("statusFilterReserve")}
                        handleStatusChange={handleStatusChange} // передаем обработчик изменения статуса
                    />
                </div>

                {loading && <p>Loading...</p>}
                {error && <p>Error: {error.message}</p>}

                {!loading && !error && requests && (
                    <>
                        <InfoTableDataReserve
                            paginationHeight={totalPages === 1 && '295px'}
                            toggleRequestSidebar={toggleRequestSidebar}
                            requests={filteredRequests}
                        />
                        <div className={classes.pagination}>
                            <ReactPaginate
                                previousLabel={'←'}
                                nextLabel={'→'}
                                breakLabel={'...'}
                                pageCount={totalPages}
                                marginPagesDisplayed={2}
                                pageRangeDisplayed={5}
                                onPageChange={handlePageClick}
                                forcePage={currentPageReserve}
                                containerClassName={classes.pagination}
                                activeClassName={classes.activePaginationNumber}
                                pageLinkClassName={classes.paginationNumber}
                            />
                        </div>
                    </>
                )}

                <CreateRequestReserve show={showCreateSidebar} onClose={toggleCreateSidebar} user={user} />
            </div>
        </>
    );
}

export default Reserve;
