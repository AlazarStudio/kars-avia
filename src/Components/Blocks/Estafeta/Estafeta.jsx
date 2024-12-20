import React, { useEffect, useState, useMemo } from "react";
import classes from './Estafeta.module.css';
import { useLocation, useNavigate } from "react-router-dom";
import Filter from "../Filter/Filter";
import InfoTableData from "../InfoTableData/InfoTableData";
import CreateRequest from "../CreateRequest/CreateRequest";
import ExistRequest from "../ExistRequest/ExistRequest";
import ChooseHotel from "../ChooseHotel/ChooseHotel";
import Header from "../Header/Header";
import { GET_REQUESTS, GET_AIRLINE, REQUEST_CREATED_SUBSCRIPTION, REQUEST_UPDATED_SUBSCRIPTION, GET_REQUESTS_ARCHIVED, getCookie, CANCEL_REQUEST } from '../../../../graphQL_requests.js';
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import ReactPaginate from 'react-paginate';

// Основной компонент страницы, отображающий список заявок с возможностью фильтрации, поиска и пагинации
function Estafeta({ user }) {
    const token = getCookie('token');
    const location = useLocation();
    const navigate = useNavigate();

    const [selectedAirline, setSelectedAirline] = useState(null);
    const [selectedAirport, setSelectedAirport] = useState(null);

    // Инициализация текущей страницы на основе параметров URL или по умолчанию
    const pageNumberRelay = new URLSearchParams(location.search).get("page");
    const currentPageRelay = pageNumberRelay ? parseInt(pageNumberRelay) - 1 : 0;

    // Состояние для фильтрации по статусу. Получаем фильтр из localStorage или устанавливаем значение по умолчанию
    const [statusFilter, setStatusFilter] = useState(() => {
        return localStorage.getItem("statusFilter") || "created / opened";
    });

    // Состояние для хранения информации о странице (для пагинации)
    const [pageInfo, setPageInfo] = useState({
        skip: currentPageRelay,
        take: 50
    });

    const query = statusFilter === "archived" ? GET_REQUESTS_ARCHIVED : GET_REQUESTS;

    // Запрос на получение списка заявок с использованием параметров пагинации
    const { loading, error, data, refetch } = useQuery(query, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            },
        },
        variables: { pagination: { skip: pageInfo.skip, take: pageInfo.take, status: statusFilter.split(" / ") } },
    });

    // Подписки для отслеживания создания и обновления заявок
    const { data: subscriptionData } = useSubscription(REQUEST_CREATED_SUBSCRIPTION);
    const { data: subscriptionUpdateData } = useSubscription(REQUEST_UPDATED_SUBSCRIPTION);

    // Локальное состояние для хранения новых заявок и всех заявок
    const [newRequests, setNewRequests] = useState([]);
    const [requests, setRequests] = useState([]);
    const [totalPages, setTotalPages] = useState(1);

    // Обработка данных подписки на создание заявок с проверкой статуса
    useEffect(() => {
        if (subscriptionData) {
            const newRequest = subscriptionData.requestCreated;
            const statusMatchesFilter = statusFilter.split(" / ").includes(newRequest.status);

            if (statusMatchesFilter) {
                setRequests((prevRequests) => {
                    const exists = prevRequests.some(request => request.id === newRequest.id);
                    if (!exists && currentPageRelay === 0) {
                        return [newRequest, ...prevRequests];
                    } else if (!exists) {
                        setNewRequests((prevNewRequests) => [newRequest, ...prevNewRequests]);
                    }
                    return prevRequests;
                });
            }
            refetch();
        }
    }, [subscriptionData, currentPageRelay, refetch, statusFilter]);

    // Обновление списка заявок на основе данных запроса и новых заявок
    useEffect(() => {
        if (data && data.requests?.requests) {
            let sortedRequests = [...data.requests.requests];
            if (currentPageRelay === 0 && newRequests.length > 0) {
                sortedRequests = [...newRequests, ...sortedRequests];
                setNewRequests([]);
            }

            setRequests(sortedRequests);
            setTotalPages(data.requests.totalPages);
        }
        if (data && data.requestArchive?.requests) {
            let sortedRequests = [...data.requestArchive.requests];
            if (currentPageRelay === 0 && newRequests.length > 0) {
                sortedRequests = [...newRequests, ...sortedRequests];
                setNewRequests([]);
            }

            setRequests(sortedRequests);
            setTotalPages(data.requestArchive.totalPages);
        }
        refetch();
    }, [data, currentPageRelay, newRequests, refetch]);

    // Обновление данных при получении новой информации по подписке на обновление заявок
    useEffect(() => {
        if (subscriptionUpdateData) refetch();
    }, [subscriptionUpdateData, refetch]);

    // Обновление состояния фильтрации по статусу
    const handleStatusChange = (value) => {
        setStatusFilter(value);
        localStorage.setItem("statusFilter", value);
    };

    // Управление состоянием боковых панелей для создания и просмотра заявок
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [existRequestData, setExistRequestData] = useState(null); // Для хранения данных match
    const [showChooseHotel, setShowChooseHotel] = useState(false);
    const [chooseObject, setChooseObject] = useState([]);
    const [chooseRequestID, setChooseRequestID] = useState();
    const [chooseCityRequest, setChooseCityRequest] = useState();

    // Функции для переключения видимости боковых панелей
    const toggleCreateSidebar = () => setShowCreateSidebar(!showCreateSidebar);
    const toggleRequestSidebar = () => setShowRequestSidebar(!showRequestSidebar);
    const toggleChooseHotel = () => setShowChooseHotel(!showChooseHotel);

    // Состояние фильтра и строки поиска для фильтрации заявок
    const [filterData, setFilterData] = useState({ filterSelect: '', filterDate: '' });
    const [searchQuery, setSearchQuery] = useState('');

    const handleChange = (e) => setFilterData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSearch = (e) => setSearchQuery(e.target.value);

    const handleOpenExistRequest = (matchData) => {
        setExistRequestData(matchData); // Сохраняем данные match
        setShowRequestSidebar(true);   // Открываем ExistRequest
    };

    // Запрос на отмену созданной, но не размещенной заявки
    const [cancelRequestMutation] = useMutation(CANCEL_REQUEST, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });

    const handleCancelRequest = async (id) => {
        try {
            // Отправка запроса с правильным ID заявки
            const response = await cancelRequestMutation({
                variables: {
                    cancelRequestId: id,
                },
            });
            // console.log("Заявка успешно отменена", response);
        } catch (error) {
            console.error("Ошибка при отмене заявки:", JSON.stringify(error));
        }
    };


    // Запрос для получения имени авиакомпании пользователя
    const [airlineName, setAirlineName] = useState();
    const { data: airlineData } = useQuery(GET_AIRLINE, { variables: { airlineId: user.airlineId } });

    useEffect(() => {
        if (airlineData) setAirlineName(airlineData.airline.name);
    }, [airlineData]);

    // Мемоизированная функция для фильтрации заявок на основе выбранных параметров
    const filteredRequests = useMemo(() => {
        return requests.filter(request => {
            const matchesSelect = !filterData.filterSelect || request.aviacompany.includes(filterData.filterSelect);
            const matchesDate = !filterData.filterDate || convertToDate(Number(request.createdAt)) === filterData.filterDate;
            const matchesSearch = searchQuery.toLowerCase();

            // Если выбрана авиакомпания, фильтруем по ней. Если "Все авиакомпании", не фильтруем.
            const matchesAirline = selectedAirline ? request.airline.id === selectedAirline.id : true;

            // Если выбран аэропорт, фильтруем по аэропорту. Если "Все аэропорты", не фильтруем.
            const matchesAirport = selectedAirport?.name ? request.airport.id === selectedAirport.id : true;

            const searchFields = [
                request.person.name,
                request.person.number,
                request.person.position,
                request.person.gender,
                request.airline.name,
                request.airport.name,
                request.airport.code,
                request.arrival,
                request.departure,
                request.status
            ];

            return matchesAirline && matchesAirport && matchesSelect && matchesDate && searchFields.some(field => field.toLowerCase().includes(matchesSearch));
        });
    }, [requests, filterData, searchQuery, selectedAirline, selectedAirport]);






    const filterList = ['Азимут', 'S7 airlines', 'Северный ветер'];

    // Обработчик для изменения текущей страницы при клике на элементы пагинации
    const handlePageClick = (event) => {
        const selectedPage = event.selected;
        setPageInfo(prev => ({ ...prev, skip: selectedPage }));
        navigate(`?page=${selectedPage + 1}`);
    };

    // Конвертация времени создания из милисекунд в дату
    function convertToDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString(); // возвращает дату в удобном для чтения формате
    }

    return (
        <div className={classes.section}>
            <Header>Эстафета</Header>
            <div className={classes.section_searchAndFilter}>
                <input
                    type="text"
                    placeholder="Поиск"
                    style={{ width: '500px' }}
                    value={searchQuery}
                    onChange={handleSearch}
                />
                <Filter
                    user={user}
                    isVisibleAirFiler={true}
                    toggleSidebar={toggleCreateSidebar}
                    handleChange={handleChange}
                    selectedAirline={selectedAirline}
                    setSelectedAirline={setSelectedAirline}
                    selectedAirport={selectedAirport}
                    setSelectedAirport={setSelectedAirport}
                    filterData={filterData}
                    buttonTitle={'Создать заявку'}
                    filterList={filterList}
                    needDate={true}
                    filterLocalData={localStorage.getItem("statusFilter")}
                    handleStatusChange={handleStatusChange} // передаем обработчик изменения статуса
                />
            </div>
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {/* Отображение таблицы заявок и компонентов пагинации */}
            {!loading && !error && requests && (
                <>
                    <InfoTableData toggleRequestSidebar={toggleRequestSidebar} requests={filteredRequests} chooseRequestID={chooseRequestID} setChooseObject={setChooseObject} setChooseRequestID={setChooseRequestID} />
                    <div className={classes.pagination}>
                        <ReactPaginate
                            previousLabel={'←'}
                            nextLabel={'→'}
                            breakLabel={'...'}
                            pageCount={totalPages}
                            marginPagesDisplayed={2}
                            pageRangeDisplayed={5}
                            onPageChange={handlePageClick}
                            forcePage={currentPageRelay}
                            containerClassName={classes.pagination}
                            activeClassName={classes.activePaginationNumber}
                            pageLinkClassName={classes.paginationNumber}
                        />
                    </div>
                </>
            )}
            {/* Боковые панели для создания и выбора заявок */}
            <CreateRequest show={showCreateSidebar} onClose={toggleCreateSidebar} onMatchFound={handleOpenExistRequest} user={user} />
            <ExistRequest setChooseCityRequest={setChooseCityRequest} show={showRequestSidebar} onClose={toggleRequestSidebar} setChooseRequestID={setChooseRequestID} setShowChooseHotel={setShowChooseHotel} chooseRequestID={chooseRequestID ? chooseRequestID : existRequestData} handleCancelRequest={handleCancelRequest} user={user} />
            <ChooseHotel chooseCityRequest={chooseCityRequest} show={showChooseHotel} onClose={toggleChooseHotel} chooseObject={chooseObject} chooseRequestID={chooseRequestID} id={'relay'} />
        </div>
    );
}

export default Estafeta;