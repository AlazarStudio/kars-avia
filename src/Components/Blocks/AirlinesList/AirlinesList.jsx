import React, { useState, useEffect, useMemo } from "react";
import classes from './AirlinesList.module.css';
import Filter from "../Filter/Filter";
import { GET_AIRLINES, GET_AIRLINES_SUBSCRIPTION, GET_AIRLINES_UPDATE_SUBSCRIPTION } from "../../../../graphQL_requests";
import { useQuery, useSubscription } from "@apollo/client";
import Header from "../Header/Header";
import InfoTableDataAirlines from "../InfoTableDataAirlines/InfoTableDataAirlines";
import CreateRequestAirline from "../CreateRequestAirline/CreateRequestAirline";
import ReactPaginate from "react-paginate";
import { useLocation, useNavigate } from "react-router-dom";

function AirlinesList({ children, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [companyData, setCompanyData] = useState([]);
    const [filterData, setFilterData] = useState({ filterSelect: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [pageInfo, setPageInfo] = useState({ skip: 0, take: 20 });

    const { loading, error, data, refetch } = useQuery(GET_AIRLINES);
    const { data: dataSubscription } = useSubscription(GET_AIRLINES_SUBSCRIPTION);
    const { data: dataSubscriptionUpd } = useSubscription(GET_AIRLINES_UPDATE_SUBSCRIPTION);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (data && data.airlines) {
            const sortedAirlines = [...data.airlines.airlines].sort((a, b) => a.name.localeCompare(b.name));
            setCompanyData(sortedAirlines);
        }

        if (dataSubscription && dataSubscription.hotelCreated) {
            setCompanyData((prevCompanyData) => {
                const updatedData = [...prevCompanyData, dataSubscription.airlineCreated];
                return updatedData.sort((a, b) => a.name.localeCompare(b.name));
            });
        }

        refetch();
    }, [data, refetch, dataSubscription, dataSubscriptionUpd]);

    const addAirline = (airline) => {
        setCompanyData([...companyData, airline].sort((a, b) => a.name.localeCompare(b.name)));
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

    // Фильтрация запросов по имени авиакомпании
    const filteredRequests = companyData.filter(request => {
        return request.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Пагинация: вычисляем элементы для отображения на текущей странице
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
                <Header>Авиакомпании</Header>

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
                        buttonTitle={'Добавить авиакомпанию'}
                        needDate={false}
                    />
                </div>

                {loading && <p>Loading...</p>}
                {error && <p>Error: {error.message}</p>}

                {!loading && !error && (
                    <>
                        <InfoTableDataAirlines
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
                                pageCount={Math.ceil(filteredRequests.length / pageInfo.take)} // Количество страниц на основе отфильтрованных данных
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

                <CreateRequestAirline
                    show={showCreateSidebar}
                    onClose={toggleCreateSidebar}
                    addHotel={addAirline}
                />
            </div>
        </>
    );
}

export default AirlinesList;
