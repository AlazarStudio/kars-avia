import React, { useEffect, useState } from "react";
import classes from './Estafeta.module.css';
import { Link, useLocation, useParams } from "react-router-dom";
import Filter from "../Filter/Filter";
import InfoTableData from "../InfoTableData/InfoTableData";
import CreateRequest from "../CreateRequest/CreateRequest";
import ExistRequest from "../ExistRequest/ExistRequest";
import ChooseHotel from "../ChooseHotel/ChooseHotel";
import Header from "../Header/Header";
import { GET_REQUESTS, getCookie, REQUEST_CREATED_SUBSCRIPTION, REQUEST_UPDATED_SUBSCRIPTION } from '../../../../graphQL_requests.js';
import { useQuery, useSubscription } from "@apollo/client";

function Estafeta({ children, user, ...props }) {
    let pageNumberRelay = useLocation().search.split("=")[1];

    let localPage = localStorage.getItem("currentPageRelay");

    let currentPageRelay = localPage ? localPage - 1 : pageNumberRelay ? pageNumberRelay - 1 : 0

    const [pageInfo, setPageInfo] = useState({
        skip: Number(currentPageRelay),
        take: 50
    });

    const { loading, error, data, refetch } = useQuery(GET_REQUESTS, {
        variables: { pagination: { skip: pageInfo.skip, take: pageInfo.take } },
    });
    const { data: subscriptionData } = useSubscription(REQUEST_CREATED_SUBSCRIPTION);
    const { data: subscriptionUpdateData } = useSubscription(REQUEST_UPDATED_SUBSCRIPTION);

    const [newRequests, setNewRequests] = useState([]);
    const [requests, setRequests] = useState([]);
    const [totalPages, setTotalPages] = useState();

    useEffect(() => {
        if (pageNumberRelay) {
            localStorage.setItem('currentPageRelay', pageNumberRelay);
        }
    }, [pageNumberRelay]);

    useEffect(() => {
        if (subscriptionData) {
            const newRequest = subscriptionData.requestCreated;

            setRequests((prevRequests) => {
                const exists = prevRequests.some(request => request.id === newRequest.id);
                if (!exists) {
                    if (currentPageRelay === 0) {
                        return [newRequest, ...prevRequests];
                    } else {
                        setNewRequests((prevNewRequests) => [newRequest, ...prevNewRequests]);
                    }
                }
                return prevRequests;
            });

            refetch();
        }
    }, [subscriptionData, currentPageRelay, data]);

    useEffect(() => {
        if (data && data.requests.requests) {
            let sortedRequests = [...data.requests.requests];

            if (currentPageRelay === 0 && newRequests.length > 0) {
                sortedRequests = [...newRequests, ...sortedRequests];
                setNewRequests([]);
            }

            setRequests(sortedRequests);
            setTotalPages(data.requests.totalPages);
            refetch()
        }
    }, [data, currentPageRelay, newRequests]);

    useEffect(() => {
        if (subscriptionUpdateData) {
            // console.log('New update subscription data received:', subscriptionUpdateData);
            refetch();
        }
    }, [subscriptionUpdateData, refetch]);


    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [showChooseHotel, setShowChooseHotel] = useState(false);
    const [chooseObject, setChooseObject] = useState([]);
    const [chooseRequestID, setChooseRequestID] = useState();

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
    }

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    }

    function convertToDate(timestamp) {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0];
    }


    const filteredRequests = requests && requests.filter(request => {
        return (
            (filterData.filterSelect === '' || request.aviacompany.includes(filterData.filterSelect)) &&
            (filterData.filterDate === '' || convertToDate(Number(request.createdAt)) == filterData.filterDate) &&
            (
                request.person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.person.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.person.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.person.gender.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.airportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival.flight.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.arrival.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure.flight.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.departure.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.status.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    let filterList = ['Азимут', 'S7 airlines', 'Северный ветер']

    function renderPagination(totalPages) {
        // Поменять на react-paginate
        const paginationItems = [];

        for (let i = 0; i < totalPages; i++) {
            paginationItems.push(
                <Link to={`?page=${i + 1}`}
                    key={i}
                    className={`${classes.paginationNumber} ${(i == currentPageRelay || (i == 0 && !currentPageRelay)) && classes.activePaginationNumber}`}
                    onClick={() => {
                        localStorage.setItem('currentPageRelay', i + 1);

                        setPageInfo(prevTarifs => {
                            return { ...prevTarifs, skip: i };
                        });

                        // window.location.reload()
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
                    <Header>Эстафета</Header>
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
                        <InfoTableData paginationHeight={totalPages == 1 && '295px'} toggleRequestSidebar={toggleRequestSidebar} requests={filteredRequests} chooseRequestID={chooseRequestID} setChooseObject={setChooseObject} setChooseRequestID={setChooseRequestID} />

                        {totalPages > 1 &&
                            <div className={classes.pagination}>
                                {renderPagination(totalPages)}
                            </div>
                        }
                    </>
                )}
                <CreateRequest show={showCreateSidebar} onClose={toggleCreateSidebar} />
                <ExistRequest show={showRequestSidebar} onClose={toggleRequestSidebar} setChooseRequestID={setChooseRequestID} setShowChooseHotel={setShowChooseHotel} chooseRequestID={chooseRequestID} user={user} />
                <ChooseHotel show={showChooseHotel} onClose={toggleChooseHotel} chooseObject={chooseObject} id={'relay'} />
            </div>
        </>
    );
}

export default Estafeta;
