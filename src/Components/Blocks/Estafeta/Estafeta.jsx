import React, { useEffect, useState, useMemo, useRef } from "react";
import classes from "./Estafeta.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import Filter from "../Filter/Filter";
import InfoTableData from "../InfoTableData/InfoTableData";
import GroupedRequests from "../GroupedRequests/GroupedRequests";
import CreateRequestSidebar from "../CreateRequest/CreateRequestSidebar";
import ExistRequest from "../ExistRequest/ExistRequest";
import ChooseHotel from "../ChooseHotel/ChooseHotel";
import Header from "../Header/Header";
import {
  GET_REQUESTS,
  GET_AIRLINE,
  REQUEST_CREATED_SUBSCRIPTION,
  REQUEST_UPDATED_SUBSCRIPTION,
  GET_REQUESTS_ARCHIVED,
  REQUESTS_BY_GROUP,
  getCookie,
  CANCEL_REQUEST,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import ReactPaginate from "react-paginate";
import { Box, CircularProgress, TextField } from "@mui/material";
import FilterPopoverButton from "../FilterPopoverButton/FilterPopoverButton";
import MUITextField from "../MUITextField/MUITextField.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import { menuAccess, statusMapping, roles } from "../../../roles.js";
import {
  canCreateRequest as canCreateRequestAccess,
  getDispatcherAccess,
} from "../../../utils/access";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
import { useDebounce } from "../../../hooks/useDebounce.jsx";
import Button from "../../Standart/Button/Button.jsx";

// Основной компонент страницы, отображающий список заявок с возможностью фильтрации, поиска и пагинации
function Estafeta({ user, accessMenu }) {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  // console.log(accessMenu);
  const dispatcherCanChat = getDispatcherAccess(
    accessMenu,
    "requestChat",
    user,
  );
  const dispatcherCanUpdate = getDispatcherAccess(
    accessMenu,
    "requestUpdate",
    user,
  );
  const canCreateRequest = canCreateRequestAccess(user, accessMenu);

  const { search, pathname, state } = useLocation();

  const requestIdFromState = state?.requestId || null;

  // Ссылки из писем бэка: /relay?id=<requestId>&chatId=<chatId> — открываем карточку и её чат
  const deepLink = useMemo(() => {
    const p = new URLSearchParams(search);
    return { id: p.get("id"), chatId: p.get("chatId") };
  }, [search]);

  const requestIdToOpen = requestIdFromState || deepLink.id;

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [selectedAirport, setSelectedAirport] = useState(null);

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    if (requestIdToOpen) {
      setChooseRequestID(requestIdToOpen);
      setShowRequestSidebar(true);
    }
  }, [requestIdToOpen]);

  // Инициализация текущей страницы на основе параметров URL или по умолчанию
  const pageNumberRelay = new URLSearchParams(location.search).get("page");
  const currentPageRelay = pageNumberRelay ? parseInt(pageNumberRelay) - 1 : 0;

  // Состояние для фильтрации по статусу. Получаем фильтр из localStorage или устанавливаем значение по умолчанию
  const [statusFilter, setStatusFilter] = useState(() => {
    return localStorage.getItem("statusFilter") || "all";
  });

  const canUseGroups = user?.role === roles.superAdmin;
  const [viewMode, setViewMode] = useState(
    () =>
      (canUseGroups && localStorage.getItem("requestViewMode")) || "list"
  );
  const isGroups =
    canUseGroups && viewMode === "groups" && statusFilter !== "archived";
  const GROUPS_PER_PAGE = 10;
  const [groups, setGroups] = useState([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState(null);
  const [detailPage, setDetailPage] = useState(0);
  useEffect(() => {
    setDetailPage(0);
  }, [selectedGroupKey]);

  // Состояние для хранения информации о странице (для пагинации)
  const [pageInfo, setPageInfo] = useState({
    skip: currentPageRelay,
    take: 50,
  });

  const query =
    statusFilter === "archived" ? GET_REQUESTS_ARCHIVED : GET_REQUESTS;

  // Запрос на получение списка заявок с использованием параметров пагинации
  const { loading, error, data, refetch } = useQuery(query, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: isGroups,
    variables: {
      pagination: {
        skip: pageInfo.skip,
        take: pageInfo.take,
        status: statusFilter.split(" / "),
        airlineId: selectedAirline?.id,
        airportId: selectedAirport?.id,
        arrival: dateRange.startDate?.toISOString(),
        departure: dateRange.endDate?.toISOString(),
        search: debouncedSearch,
      },
    },
  });

  const {
    loading: groupsLoading,
    error: groupsError,
    data: groupsData,
    refetch: groupsRefetch,
  } = useQuery(REQUESTS_BY_GROUP, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    skip: !isGroups,
    variables: {
      pagination: {
        skip: pageInfo.skip,
        take: GROUPS_PER_PAGE,
        status: statusFilter.split(" / "),
        airlineId: selectedAirline?.id,
        airportId: selectedAirport?.id,
        arrival: dateRange.startDate?.toISOString(),
        departure: dateRange.endDate?.toISOString(),
        search: debouncedSearch,
      },
    },
  });

  const isGroupsRef = useRef(isGroups);
  useEffect(() => {
    isGroupsRef.current = isGroups;
  }, [isGroups]);

  // Подписки для отслеживания создания и обновления заявок
  const { data: subscriptionData } = useSubscription(
    REQUEST_CREATED_SUBSCRIPTION,
    {
      onData: () => {
        if (isGroupsRef.current) groupsRefetch();
        else refetch();
      },
    },
  );
  const { data: subscriptionUpdateData } = useSubscription(
    REQUEST_UPDATED_SUBSCRIPTION,
    {
      onData: () => {
        if (isGroupsRef.current) groupsRefetch();
        else refetch();
      },
    },
  );

  // console.log(subscriptionData);
  // console.log(subscriptionUpdateData);

  // Локальное состояние для хранения новых заявок и всех заявок
  const [newRequests, setNewRequests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // Обработка данных подписки на создание заявок с проверкой статуса
  // useEffect(() => {
  //   if (subscriptionData) {
  //     const newRequest = subscriptionData.requestCreated;
  //     const statusMatchesFilter = statusFilter
  //       .split(" / ")
  //       .includes(newRequest.status);

  //     if (statusMatchesFilter) {
  //       setRequests((prevRequests) => {
  //         const exists = prevRequests.some(
  //           (request) => request.id === newRequest.id
  //         );
  //         if (!exists && currentPageRelay === 0) {
  //           return [newRequest, ...prevRequests];
  //         } else if (!exists) {
  //           setNewRequests((prevNewRequests) => [
  //             newRequest,
  //             ...prevNewRequests,
  //           ]);
  //         }
  //         return prevRequests;
  //       });
  //     }
  //   }
  //   refetch();
  // }, [subscriptionData, currentPageRelay, refetch, statusFilter]);

  // Обновление списка заявок на основе данных запроса и новых заявок
  useEffect(() => {
    if (isGroups) return;
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
    // refetch();
  }, [isGroups, data, currentPageRelay, newRequests, refetch]);

  useEffect(() => {
    if (isGroups && groupsData?.requestsByGroup) {
      setGroups(groupsData.requestsByGroup.groups || []);
      setTotalPages(groupsData.requestsByGroup.totalPages || 1);
    }
  }, [isGroups, groupsData]);

  // Обновление данных при получении новой информации по подписке на обновление заявок
  // useEffect(() => {
  //   if (subscriptionUpdateData) refetch();
  // }, [subscriptionUpdateData, refetch]);

  // console.log(subscriptionUpdateData);

  // Обновление состояния фильтрации по статусу
  const handleStatusChange = (value) => {
    setStatusFilter(value);
    localStorage.setItem("statusFilter", value);

    // Сбрасываем текущую страницу на первую
    setPageInfo((prev) => ({ ...prev, skip: 0 }));
    navigate("?page=1");
  };

  const handleViewChange = (v) => {
    setViewMode(v);
    localStorage.setItem("requestViewMode", v);
    setPageInfo((prev) => ({ ...prev, skip: 0 }));
    setSelectedGroupKey(null);
    navigate("?page=1");
  };

  const activeFilterCount =
    (selectedAirline ? 1 : 0) +
    (selectedAirport ? 1 : 0) +
    ((dateRange.startDate || dateRange.endDate) ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedAirline(null);
    setSelectedAirport(null);
    setDateRange({ startDate: null, endDate: null });
    handleStatusChange("all");
    setPageInfo((prev) => ({ ...prev, skip: 0 }));
    navigate("?page=1");
  };

  // Управление состоянием боковых панелей для создания и просмотра заявок
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [existRequestData, setExistRequestData] = useState(null); // Для хранения данных match
  const [showChooseHotel, setShowChooseHotel] = useState(false);
  const [chooseObject, setChooseObject] = useState([]);
  const [chooseRequestID, setChooseRequestID] = useState();
  const [chooseCityRequest, setChooseCityRequest] = useState();
  const [chooseDefaultTimesUsed, setChooseDefaultTimesUsed] = useState(false);
  const [openExistRequestInEditMode, setOpenExistRequestInEditMode] = useState(false);

  // Функции для переключения видимости боковых панелей
  const toggleCreateSidebar = () => setShowCreateSidebar(!showCreateSidebar);
  const toggleRequestSidebar = () => setShowRequestSidebar(!showRequestSidebar);
  const toggleChooseHotel = () => setShowChooseHotel(!showChooseHotel);

  // Состояние фильтра и строки поиска для фильтрации заявок
  const [filterData, setFilterData] = useState({
    filterSelect: "",
    filterDate: "",
  });

  const [isSearching, setIsSearching] = useState(false); // Флаг, указывающий, идёт ли поиск
  const [allFilteredData, setAllFilteredData] = useState([]); // Хранилище всех данных для поиска

  const handleChange = (e) =>
    setFilterData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // const handleSearch = async (e) => {
  //   const query = e.target.value;
  //   setSearchQuery(query);

  //   if (query.trim() == "") {
  //     // Если строка поиска пуста, возвращаемся к стандартному режиму
  //     setIsSearching(false);
  //     refetch({
  //       pagination: { skip: currentPageRelay, take: 50 }, // Загрузить большое количество данных для поиска
  //     }); // Запускаем повторный запрос с пагинацией
  //     return;
  //   }

  //   setIsSearching(true); // Активируем режим поиска

  //   try {
  //     const { data } = await refetch({
  //       pagination: {
  //         skip: 0,
  //         take: 10000000,
  //         status: statusFilter.split(" / "),
  //       }, // Загрузить большое количество данных для поиска
  //       // filter: { searchQuery: query, status: statusFilter.split(" / ") } // Передаем статус и строку поиска
  //     });

  //     if (data && data.requests?.requests) {
  //       setAllFilteredData(data.requests.requests); // Сохраняем все данные для локального поиска
  //     }
  //   } catch (err) {
  //     console.error("Ошибка при поиске:", err);
  //   }
  // };
  // --- Поиск: просто рефетчим с новым searchQuery ---

  // const handleSearch = (e) => {
  //   const q = e.target.value;
  //   setSearchQuery(q);
  //   refetch({
  //     pagination: {
  //       skip: 0,
  //       take: pageInfo.take,
  //       status: statusFilter.split(" / "),
  //       airlineId: selectedAirline?.id,
  //       airportId: selectedAirport?.id,
  //       arrival: dateRange.startDate?.toISOString(),
  //       departure: dateRange.endDate?.toISOString(),
  //       search: q,                     // <-- сюда
  //     },
  //   }).catch((err) => console.error("Ошибка при поиске:", err));
  //   navigate("?page=1");
  //   setPageInfo((prev) => ({ ...prev, skip: 0 }));
  // };
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    // никакого refetch — ждем debounce
  };

  useEffect(() => {
    // сбрасываем на первую страницу
    setPageInfo((prev) => ({ ...prev, skip: 0 }));
    navigate("?page=1");

    (isGroups ? groupsRefetch : refetch)({
      pagination: {
        skip: 0,
        take: isGroups ? GROUPS_PER_PAGE : pageInfo.take,
        status: statusFilter.split(" / "),
        airlineId: selectedAirline?.id,
        airportId: selectedAirport?.id,
        arrival: dateRange.startDate?.toISOString(),
        departure: dateRange.endDate?.toISOString(),
        search: debouncedSearch,
      },
    }).catch(console.error);
  }, [
    debouncedSearch,
    statusFilter,
    selectedAirline,
    selectedAirport,
    dateRange,
    viewMode,
  ]);

  // useEffect(() => {
  //   if (!isSearching) {
  //     refetch({
  //       pagination: {
  //         skip: pageInfo.skip,
  //         take: pageInfo.take,
  //         status: statusFilter.split(" / "),
  //         airlineId: selectedAirline?.id,
  //         airportId: selectedAirport?.id,
  //         arrival: dateRange.startDate?.toISOString(),
  //         departure: dateRange.endDate?.toISOString(),
  //         search: searchQuery,
  //       },
  //     });
  //   }
  // }, [isSearching, refetch, pageInfo, statusFilter]);

  const handleOpenExistRequest = (matchData) => {
    setExistRequestData(matchData); // Сохраняем данные match
    setShowRequestSidebar(true); // Открываем ExistRequest
  };

  const [showDelete, setShowDelete] = useState(false);

  const [requestId, setRequestId] = useState();

  const setChooseRequestId = (id) => {
    setRequestId(id);
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

  const openDeleteComponent = () => {
    setShowDelete(true);
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
  };

  // Запрос для получения имени авиакомпании пользователя
  const [airlineName, setAirlineName] = useState();
  const { data: airlineData } = useQuery(GET_AIRLINE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { airlineId: user.airlineId },
  });

  useEffect(() => {
    if (airlineData) setAirlineName(airlineData.airline.name);
  }, [airlineData]);

  // Маппинг статусов: ключ – внутреннее значение, значение – отображаемое название
  //   const statusMapping = {
  //     opened: "В обработке",
  //     canceled: "Отменен",
  //     done: "Размещен",
  //     created: "Создан",
  //     extended: "Продлен",
  //     reduced: "Сокращен",
  //     transferred: "Перенесен",
  //     earlyStart: "Ранний заезд",
  //     archiving: "Готов к архиву",
  //     archived: "Архив",
  //   };

  // Мемоизированная функция для фильтрации заявок на основе выбранных параметров
  const filteredRequests = useMemo(() => {
    const dataSource = isSearching ? allFilteredData : requests; // Используем данные из поиска или стандартные

    return dataSource.filter((request) => {
      // console.log(request);
      const matchesSelect =
        !filterData.filterSelect ||
        request.airline?.name.includes(filterData.filterSelect);
      const matchesDate =
        !filterData.filterDate ||
        convertToDate(Number(request.createdAt)) === filterData.filterDate;
      // Поиск выполняется на бэке, фронтовый поиск временно отключен.
      // const matchesSearch = searchQuery.toLowerCase();

      // Если выбрана авиакомпания, фильтруем по ней. Если "Все авиакомпании", не фильтруем.
      const matchesAirline = selectedAirline
        ? request.airline.id === selectedAirline.id
        : true;

      // Если выбран аэропорт, фильтруем по аэропорту. Если "Все аэропорты", не фильтруем.
      const matchesAirport = selectedAirport?.name
        ? request.airport.id === selectedAirport.id
        : true;

      // Получаем читаемое название статуса
      const statusDisplay = statusMapping[request.status] || request.status;

      // const searchFields = [
      //   request.requestNumber,
      //   request?.person?.name,
      //   request?.person?.number,
      //   request?.person?.position,
      //   request?.person?.gender,
      //   request.airline.name,
      //   request.airport.name,
      //   request.airport.code,
      //   request.arrival,
      //   request.departure,
      //   request.status,
      //   statusDisplay,
      // ];

      return (
        // matchesAirline &&
        // matchesAirport &&
        matchesSelect && matchesDate
        // && searchFields?.some((field) =>
        //   String(field)?.toLowerCase().includes(matchesSearch)
        // )
      );
    });
  }, [
    isSearching,
    allFilteredData,
    requests,
    filterData,
    searchQuery,
    selectedAirline,
    selectedAirport,
  ]);

  const filterList = ["Азимут", "S7 airlines", "Северный ветер"];

  // Текущая страница из URL (0-based)
  const urlPage = useMemo(() => {
    const p = Number(new URLSearchParams(search).get("page") || "1");
    return Math.max(0, p - 1);
  }, [search]);

  // Синхронизируем внутренний стейт пагинации со значением из URL
  useEffect(() => {
    setPageInfo((prev) =>
      prev.skip === urlPage ? prev : { ...prev, skip: urlPage },
    );
  }, [urlPage]);

  // Если открыли /relay без ?page — проставим ?page=1
  useEffect(() => {
    if (pathname !== "/relay") return;
    const params = new URLSearchParams(search);
    if (params.has("page")) return;
    params.set("page", "1");
    navigate(`?${params.toString()}`, { replace: true });
  }, [pathname, search, navigate]);

  // Обработчик для изменения текущей страницы при клике на элементы пагинации
  const handlePageClick = (event) => {
    const selectedPage = event.selected;
    setPageInfo((prev) => ({ ...prev, skip: selectedPage }));
    navigate(`?page=${selectedPage + 1}`);
  };

  // Конвертация времени создания из милисекунд в дату
  function convertToDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString(); // возвращает дату в удобном для чтения формате
  }

  // Корректировка текущей страницы
  const validCurrentPage = urlPage < totalPages ? urlPage : 0;
  // const validCurrentPage = currentPageRelay < totalPages ? currentPageRelay : 0;

  // Детальный экран группы: клиентская пагинация заявок группы по 50
  const DETAIL_PAGE_SIZE = 50;
  const detailGroup = isGroups
    ? groups.find((g) => g.key === selectedGroupKey)
    : null;
  const detailRequests = detailGroup?.requests || [];
  const detailPageCount = Math.ceil(detailRequests.length / DETAIL_PAGE_SIZE);

  return (
    <div className={classes.section}>
      {/* <Header>Эстафета</Header> */}
      <Header>Эскадрилья</Header>
      <div className={classes.section_searchAndFilter}>
        <FilterPopoverButton
          activeCount={activeFilterCount}
          onReset={handleResetFilters}
        >
          <Filter
            vertical
            user={user}
            isEstafeta={true}
            isVisibleAirFiler={true}
            toggleSidebar={toggleCreateSidebar}
            handleChange={handleChange}
            selectedAirline={selectedAirline}
            setSelectedAirline={setSelectedAirline}
            selectedAirport={selectedAirport}
            setSelectedAirport={setSelectedAirport}
            filterData={filterData}
            buttonTitle={"Создать заявку"}
            filterList={filterList}
            needDate={true}
            filterLocalData={localStorage.getItem("statusFilter")}
            handleStatusChange={handleStatusChange}
            initialRange={dateRange}
            onRangeChange={setDateRange}
          />
        </FilterPopoverButton>
        {canUseGroups ? (
          <div className={classes.viewToggle}>
            <button
              type="button"
              className={viewMode === "list" ? classes.viewToggleActive : ""}
              onClick={() => handleViewChange("list")}
            >
              Список
            </button>
            <button
              type="button"
              className={viewMode === "groups" ? classes.viewToggleActive : ""}
              onClick={() => handleViewChange("groups")}
            >
              Группы
            </button>
          </div>
        ) : null}
        <MUITextField
          className={classes.mainSearch}
          label={"Поиск"}
          value={searchQuery}
          onChange={handleSearch}
        />
        {canCreateRequest ? (
          <Button onClick={toggleCreateSidebar}>Создать заявку</Button>
        ) : null}
      </div>
      {(isGroups ? groupsLoading : loading) && <MUILoader />}
      {(isGroups ? groupsError : error) && <p>Error: {(isGroups ? groupsError : error).message}</p>}

      {/* Отображение таблицы заявок и компонентов пагинации */}
      {!(isGroups ? groupsLoading : loading) && !(isGroups ? groupsError : error) && (
        <>
          {isGroups ? (
            <GroupedRequests
              groups={groups}
              user={user}
              toggleRequestSidebar={toggleRequestSidebar}
              setChooseObject={setChooseObject}
              setChooseRequestID={setChooseRequestID}
              chooseRequestID={chooseRequestID}
              selectedGroupKey={selectedGroupKey}
              setSelectedGroupKey={setSelectedGroupKey}
              detailPage={detailPage}
              detailPageSize={DETAIL_PAGE_SIZE}
            />
          ) : (
            <InfoTableData
              user={user}
              toggleRequestSidebar={toggleRequestSidebar}
              requests={filteredRequests}
              chooseRequestID={chooseRequestID}
              setChooseObject={setChooseObject}
              setChooseRequestID={setChooseRequestID}
              pageInfo={pageInfo.skip}
              scrollToId={requestIdToOpen}
            />
          )}

          {detailGroup
            ? detailPageCount > 1 && (
                <div className={classes.pagination}>
                  <ReactPaginate
                    previousLabel={"←"}
                    nextLabel={"→"}
                    breakLabel={"..."}
                    pageCount={detailPageCount}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={5}
                    onPageChange={(e) => setDetailPage(e.selected)}
                    forcePage={Math.min(detailPage, detailPageCount - 1)}
                    containerClassName={classes.pagination}
                    activeClassName={classes.activePaginationNumber}
                    pageLinkClassName={classes.paginationNumber}
                  />
                </div>
              )
            : totalPages > 0 && (
                <div className={classes.pagination}>
                  <ReactPaginate
                    previousLabel={"←"}
                    nextLabel={"→"}
                    breakLabel={"..."}
                    pageCount={totalPages}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={5}
                    onPageChange={handlePageClick}
                    forcePage={validCurrentPage}
                    containerClassName={classes.pagination}
                    activeClassName={classes.activePaginationNumber}
                    pageLinkClassName={classes.paginationNumber}
                  />
                </div>
              )}
        </>
      )}
      {/* Боковые панели для создания и выбора заявок */}
      <CreateRequestSidebar
        show={showCreateSidebar}
        onClose={toggleCreateSidebar}
        onMatchFound={handleOpenExistRequest}
        user={user}
        onImported={() => (isGroups ? groupsRefetch() : refetch())}
      />
      <ExistRequest
        setChooseCityRequest={setChooseCityRequest}
        setChooseDefaultTimesUsed={setChooseDefaultTimesUsed}
        openInEditMode={openExistRequestInEditMode}
        show={showRequestSidebar}
        onClose={() => {
          setOpenExistRequestInEditMode(false);
          toggleRequestSidebar();
          if (deepLink.id || deepLink.chatId) {
            const params = new URLSearchParams(search);
            params.delete("id");
            params.delete("chatId");
            navigate(`?${params.toString()}`, { replace: true });
          }
        }}
        setChooseRequestID={setChooseRequestID}
        setShowChooseHotel={setShowChooseHotel}
        chooseRequestID={chooseRequestID ? chooseRequestID : existRequestData}
        openChatId={deepLink.chatId}
        // handleCancelRequest={handleCancelRequest}
        user={user}
        accessMenu={accessMenu}
        dispatcherCanChat={dispatcherCanChat}
        dispatcherCanUpdate={dispatcherCanUpdate}
        openDeleteComponent={openDeleteComponent}
        setRequestId={setChooseRequestId}
      />
      <ChooseHotel
        chooseCityRequest={chooseCityRequest}
        show={showChooseHotel}
        onClose={toggleChooseHotel}
        chooseObject={chooseObject}
        chooseRequestID={chooseRequestID}
        id={"relay"}
        defaultTimesUsed={chooseDefaultTimesUsed}
        onBackToRequest={() => {
          setShowChooseHotel(false);
          setOpenExistRequestInEditMode(true);
          setShowRequestSidebar(true);
        }}
      />

      {showDelete && (
        <DeleteComponent
          remove={() => {
            handleCancelRequest(requestId);
            closeDeleteComponent();
            setShowRequestSidebar(false);
          }}
          index={requestId}
          close={closeDeleteComponent}
          title={`Вы действительно хотите отменить заявку? `}
          isCancel={true}
        />
      )}
    </div>
  );
}

export default Estafeta;
