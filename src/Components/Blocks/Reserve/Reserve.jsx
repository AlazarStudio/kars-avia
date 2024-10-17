import React, { useEffect, useState } from "react";
import classes from './Reserve.module.css';
import Filter from "../Filter/Filter";
import CreateRequestReserve from "../CreateRequestReserve/CreateRequestReserve";
import { requestsReserve } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataReserve from "../InfoTableDataReserve/InfoTableDataReserve";
import { GET_RESERVE_REQUESTS, REQUEST_RESERVE_CREATED_SUBSCRIPTION, REQUEST_RESERVE_UPDATED_SUBSCRIPTION } from "../../../../graphQL_requests";
import { useQuery, useSubscription } from "@apollo/client";
import { Link, useLocation } from "react-router-dom";

function Reserve({ children, user, ...props }) {
    let pageNumberReserve = useLocation().search.split("=")[1];
    let localPage = localStorage.getItem("currentPageReserve");
    let currentPageReserve = localPage ? localPage - 1 : pageNumberReserve ? pageNumberReserve - 1 : 0;

    const [pageInfo, setPageInfo] = useState({
        skip: Number(currentPageReserve),
        take: 50
    });

    const { loading, error, data, refetch } = useQuery(GET_RESERVE_REQUESTS, {
        variables: { pagination: { skip: pageInfo.skip, take: pageInfo.take } },
    });

    const { data: subscriptionData } = useSubscription(REQUEST_RESERVE_CREATED_SUBSCRIPTION);
    const { data: subscriptionUpdateData } = useSubscription(REQUEST_RESERVE_UPDATED_SUBSCRIPTION);

    const [newRequests, setNewRequests] = useState([]);
    const [requests, setRequests] = useState([]);
    const [totalPages, setTotalPages] = useState();

    useEffect(() => {
        if (pageNumberReserve) {
            localStorage.setItem('currentPageReserve', pageNumberReserve);
        }
    }, [pageNumberReserve]);

    useEffect(() => {
        if (subscriptionData) {
            const newRequest = subscriptionData.reserveCreated;

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

            refetch();
        }
    }, [subscriptionData, currentPageReserve, data]);

    useEffect(() => {
        if (data && data.reserves.reserves) {
            let sortedRequests = [...data.reserves.reserves];

            if (currentPageReserve === 0 && newRequests.length > 0) {
                sortedRequests = [...newRequests, ...sortedRequests];
                setNewRequests([]);
            }

            sortedRequests.sort((a, b) => {
                if (a.status === "done" && b.status !== "done") {
                    return 1;
                }
                if (a.status !== "done" && b.status === "done") {
                    return -1;
                }
                return 0;
            });

            setRequests(sortedRequests);
            setTotalPages(data.reserves.totalPages);
            refetch();
        }
    }, [data, currentPageReserve, newRequests]);

    useEffect(() => {
        if (subscriptionUpdateData) {
            refetch();
        }
    }, [subscriptionUpdateData, refetch]);

    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [showChooseHotel, setShowChooseHotel] = useState(false);

    const toggleCreateSidebar = () => {
        setShowCreateSidebar(!showCreateSidebar);
    };

    const toggleRequestSidebar = () => {
        setShowRequestSidebar(!showRequestSidebar);
    };

    const toggleChooseHotel = () => {
        setShowChooseHotel(!showChooseHotel);
    };

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

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredRequests = requests && requests.filter(request => {
        return (
            (filterData.filterSelect === '' || request.aviacompany.includes(filterData.filterSelect)) &&
            (filterData.filterDate === '' || request.date === filterData.filterDate) &&
            (
                request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.airline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.airport.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
                Number(request.passengers.length) == searchQuery
            )
        );
    });

    let filterList = ['Азимут', 'S7 airlines', 'Северный ветер'];

    function renderPagination(totalPages) {
        // Поменять на react-paginate
        const paginationItems = [];

        for (let i = 0; i < totalPages; i++) {
            paginationItems.push(
                <Link to={`?page=${i + 1}`}
                    key={i}
                    className={`${classes.paginationNumber} ${(i == currentPageReserve || (i == 0 && !currentPageReserve)) && classes.activePaginationNumber}`}
                    onClick={() => {
                        localStorage.setItem('currentPageReserve', i + 1);

                        setPageInfo(prevTarifs => {
                            return { ...prevTarifs, skip: i };
                        });
                    }}
                >
                    {i + 1}
                </Link>
            );
        }

        return paginationItems;
    }

    return (
        <>
            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>Резерв</Header>
                </div>

                <div className={classes.section_searchAndFilter}>
                    <input
                        type="text"
                        placeholder="Поиск"
                        style={{ 'width': '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <Filter
                        toggleSidebar={toggleCreateSidebar}
                        handleChange={handleChange}
                        filterData={filterData}
                        buttonTitle={'Создать заявку'}
                        filterList={filterList}
                        needDate={true}
                    />
                </div>

                {loading && <p>Loading...</p>}
                {error && <p>Error: {error.message}</p>}

                {!loading && !error && requests && (
                    <>
                        <InfoTableDataReserve paginationHeight={totalPages == 1 && '295px'} toggleRequestSidebar={toggleRequestSidebar} requests={filteredRequests} />

                        {totalPages > 1 &&
                            <div className={classes.pagination}>
                                {renderPagination(totalPages)}
                            </div>
                        }
                    </>
                )}

                <CreateRequestReserve show={showCreateSidebar} onClose={toggleCreateSidebar} user={user} />
            </div>
        </>
    );
}

export default Reserve;
