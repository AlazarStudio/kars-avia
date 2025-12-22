import React, { useEffect, useState, useMemo } from "react";
import classes from "./TransferOrders.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import Filter from "../Filter/Filter.jsx";
import ChooseHotel from "../ChooseHotel/ChooseHotel.jsx";
import Header from "../Header/Header.jsx";
import {
  GET_AIRLINE,
  GET_REQUESTS_ARCHIVED,
  getCookie,
  CANCEL_REQUEST,
  GET_TRANSFER_REQUESTS,
  TRANSFER_CREATED_SUBSCRIPTION,
  TRANSFER_UPDATED_SUBSCRIPTION,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import ReactPaginate from "react-paginate";
import MUITextField from "../MUITextField/MUITextField.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import {
  fullNotifyTime,
  menuAccess,
  notifyTime,
  statusMapping,
} from "../../../roles.js";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
import Notification from "../../Notification/Notification.jsx";
import { useDebounce } from "../../../hooks/useDebounce.jsx";
import InfoTableDataTransferOrders from "../InfoTableDataTransferOrders/InfoTableDataTransferOrders.jsx";
import Button from "../../Standart/Button/Button.jsx";
import CreateTransferRequest from "../CreateTransferRequest/CreateTransferRequest.jsx";

// Основной компонент страницы, отображающий список заявок с возможностью фильтрации, поиска и пагинации
function TransferOrders({ user, disAdmin, accessMenu }) {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  // const { search, pathname, state } = useLocation();

  // const requestIdFromState = state?.requestId || null;

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [selectedAirport, setSelectedAirport] = useState(null);

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  // useEffect(() => {
  //   if (requestIdFromState) {
  //     setChooseRequestID(requestIdFromState);
  //     setShowRequestSidebar(true);
  //   }
  // }, [requestIdFromState]);

  // Инициализация текущей страницы на основе параметров URL или по умолчанию
  // const pageNumberRelay = new URLSearchParams(location.search).get("page");
  // const currentPageRelay = pageNumberRelay ? parseInt(pageNumberRelay) - 1 : 0;

  // Состояние для фильтрации по статусу. Получаем фильтр из localStorage или устанавливаем значение по умолчанию
  const [statusFilterTransfer, setStatusFilter] = useState(() => {
    return localStorage.getItem("statusFilterTransfer") || "all";
  });

  // Состояние для хранения информации о странице (для пагинации)
  // const [pageInfo, setPageInfo] = useState({
  //   skip: currentPageRelay,
  //   take: 50,
  // });

  const query =
    statusFilterTransfer === "archived"
      ? GET_REQUESTS_ARCHIVED
      : GET_TRANSFER_REQUESTS;

  // Запрос на получение списка заявок с использованием параметров пагинации
  const { loading, error, data, refetch } = useQuery(GET_TRANSFER_REQUESTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: {
        all: true,
        // skip: pageInfo.skip,
        // take: pageInfo.take,
        // airlineId: selectedAirline?.id,
        // status: statusFilterTransfer.split(" / "),
        // airportId: selectedAirport?.id,
        // arrival: dateRange.startDate?.toISOString(),
        // departure: dateRange.endDate?.toISOString(),
        // search: debouncedSearch,
      },
    },
  });

  // Подписки для отслеживания создания и обновления заявок
  const { data: subscriptionData, error: subCreateError } = useSubscription(
    TRANSFER_CREATED_SUBSCRIPTION,
    {
      onData: ({ data }) => {
        // console.log("Новая заявка создана:", data.data?.transferCreated);
        refetch(); // Обновляем данные
      },
      onError: (error) => {
        console.error("Ошибка подписки на создание:", error);
      },
    }
  );
  const { data: subscriptionUpdateData } = useSubscription(
    TRANSFER_UPDATED_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
    }
  );

  // console.log(subscriptionData);
  // console.log(subscriptionUpdateData);

  // Локальное состояние для хранения новых заявок и всех заявок
  const [newRequests, setNewRequests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // Обновление списка заявок на основе данных запроса и новых заявок
  useEffect(() => {
    if (data && data.transfers?.transfers) {
      let sortedRequests = [...data.transfers.transfers];
      // if (currentPageRelay === 0 && newRequests.length > 0) {
      //   sortedRequests = [...newRequests, ...sortedRequests];
      //   setNewRequests([]);
      // }

      setRequests(sortedRequests);
      // setTotalPages(data.transfers.totalPages);
    }
    // if (data && data.requestArchive?.requests) {
    //   let sortedRequests = [...data.requestArchive.requests];
    //   if (currentPageRelay === 0 && newRequests.length > 0) {
    //     sortedRequests = [...newRequests, ...sortedRequests];
    //     setNewRequests([]);
    //   }

    //   setRequests(sortedRequests);
    //   setTotalPages(data.requestArchive.totalPages);
    // }
    // refetch();
  }, [data, newRequests, refetch]);
  // }, [data, currentPageRelay, newRequests, refetch]);

  // Обновление данных при получении новой информации по подписке на обновление заявок
  // useEffect(() => {
  //   if (subscriptionUpdateData) refetch();
  // }, [subscriptionUpdateData, refetch]);

  // console.log(subscriptionUpdateData);

  // Обновление состояния фильтрации по статусу
  const handleStatusChange = (value) => {
    setStatusFilter(value);
    localStorage.setItem("statusFilterTransfer", value);

    // Сбрасываем текущую страницу на первую
    // setPageInfo((prev) => ({ ...prev, skip: 0 }));
    // navigate("?page=1");
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
  const [filterData, setFilterData] = useState({
    filterSelect: "",
    filterDate: "",
  });

  const [isSearching, setIsSearching] = useState(false); // Флаг, указывающий, идёт ли поиск
  const [allFilteredData, setAllFilteredData] = useState([]); // Хранилище всех данных для поиска

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const handleChange = (e) =>
    setFilterData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    // никакого refetch — ждем debounce
  };

  // useEffect(() => {
  //   // сбрасываем на первую страницу
  //   // setPageInfo((prev) => ({ ...prev, skip: 0 }));
  //   // navigate("?page=1");

  //   refetch({
  //     pagination: {
  //       // skip: 0,
  //       // take: pageInfo.take,
  //       all: true,
  //       // airlineId: selectedAirline?.id,
  //       // status: statusFilterTransfer.split(" / "),
  //       // airportId: selectedAirport?.id,
  //       // arrival: dateRange.startDate?.toISOString(),
  //       // departure: dateRange.endDate?.toISOString(),
  //       // search: debouncedSearch,
  //     },
  //   }).catch(console.error);
  // }, [
  //   debouncedSearch,
  //   statusFilterTransfer,
  //   selectedAirline,
  //   selectedAirport,
  //   dateRange,
  // ]);

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


  // Мемоизированная функция для фильтрации и сортировки заявок
  const filteredRequests = useMemo(() => {
    const dataSource = requests; // Используем данные из поиска или стандартные

    const filtered = dataSource.filter((request) => {
      // console.log(request);
      const matchesSelect =
        !filterData.filterSelect ||
        request.airline?.name.includes(filterData.filterSelect);
      const matchesDate =
        !filterData.filterDate ||
        convertToDate(Number(request.createdAt)) === filterData.filterDate;
      const matchesSearch = searchQuery.toLowerCase().trim();

      // Если поиск пустой, не фильтруем по поиску
      const matchesSearchFilter = !matchesSearch || (() => {
        // Получаем читаемое название статуса
        const statusDisplay = statusMapping[request.status] || request.status;
        
        const searchFields = [
          request?.persons?.map(p => p.name).join(" ") || "",
          request?.persons?.map(p => p.email).join(" ") || "",
          request.airline?.name || "",
          statusDisplay || "",
        ].filter(Boolean);

        return searchFields.some((field) =>
          String(field)?.toLowerCase().includes(matchesSearch)
        );
      })();

      return (
        matchesSelect &&
        matchesDate &&
        matchesSearchFilter
      );
    });

    // Сортировка: сначала заявки до которых < 2 часов, потом на сегодня, потом остальные по scheduledPickupAt
    return filtered.sort((a, b) => {
      const aScheduledTime = a.scheduledPickupAt ? new Date(a.scheduledPickupAt) : null;
      const bScheduledTime = b.scheduledPickupAt ? new Date(b.scheduledPickupAt) : null;

      // Если нет времени начала, помещаем в конец
      if (!aScheduledTime && !bScheduledTime) return 0;
      if (!aScheduledTime) return 1;
      if (!bScheduledTime) return -1;

      const now = new Date();
      const twoHoursInMs = 2 * 60 * 60 * 1000;

      // Проверяем, до заявки меньше 2 часов
      const aTimeDiff = aScheduledTime.getTime() - now.getTime();
      const bTimeDiff = bScheduledTime.getTime() - now.getTime();
      
      const aIsLessThan2Hours = aTimeDiff > 0 && aTimeDiff < twoHoursInMs;
      const bIsLessThan2Hours = bTimeDiff > 0 && bTimeDiff < twoHoursInMs;

      // Если одна заявка до которой < 2 часов, а другая нет - та что < 2 часов вверху
      if (aIsLessThan2Hours && !bIsLessThan2Hours) return -1;
      if (!aIsLessThan2Hours && bIsLessThan2Hours) return 1;

      // Если обе до которых < 2 часов - сортируем по времени (ближайшие вверху)
      if (aIsLessThan2Hours && bIsLessThan2Hours) {
        return aScheduledTime.getTime() - bScheduledTime.getTime();
      }

      // Проверяем, является ли заявка сегодняшней
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const aDate = new Date(aScheduledTime);
      aDate.setHours(0, 0, 0, 0);
      const bDate = new Date(bScheduledTime);
      bDate.setHours(0, 0, 0, 0);

      const aIsToday = aDate.getTime() === today.getTime();
      const bIsToday = bDate.getTime() === today.getTime();

      // Если одна заявка на сегодня, а другая нет - сегодняшняя вверху
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;

      // Если обе на сегодня или обе не на сегодня - сортируем по времени (новые вверху)
      return bScheduledTime.getTime() - aScheduledTime.getTime();
    });
  }, [isSearching, allFilteredData, requests, filterData, searchQuery]);

  // console.log(requests);

  const filterList = ["Азимут", "S7 airlines", "Северный ветер"];

  // Текущая страница из URL (0-based)
  // const urlPage = useMemo(() => {
  //   const p = Number(new URLSearchParams(search).get("page") || "1");
  //   return Math.max(0, p - 1);
  // }, [search]);

  // Синхронизируем внутренний стейт пагинации со значением из URL
  // useEffect(() => {
  //   setPageInfo((prev) =>
  //     prev.skip === urlPage ? prev : { ...prev, skip: urlPage }
  //   );
  // }, [urlPage]);

  // Если открыли /relay без ?page — проставим ?page=1
  // useEffect(() => {
  //   if (pathname === "/orders" && !new URLSearchParams(search).has("page")) {
  //     navigate("?page=1", { replace: true });
  //   }
  // }, [pathname, search, navigate]);

  // Обработчик для изменения текущей страницы при клике на элементы пагинации
  // const handlePageClick = (event) => {
  //   const selectedPage = event.selected;
  //   setPageInfo((prev) => ({ ...prev, skip: selectedPage }));
  //   navigate(`?page=${selectedPage + 1}`);
  // };

  // Конвертация времени создания из милисекунд в дату
  function convertToDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString(); // возвращает дату в удобном для чтения формате
  }

  // Корректировка текущей страницы
  // const validCurrentPage = urlPage < totalPages ? urlPage : 0;
  // const validCurrentPage = currentPageRelay < totalPages ? currentPageRelay : 0;

  return (
    <div className={classes.section} style={disAdmin && { padding: "0px" }}>
      {!disAdmin && <Header>Заказы</Header>}
      <div className={classes.section_searchAndFilter}>
        <Filter
          user={user}
          isEstafeta={true}
          isVisibleAirFiler={true}
          transfer={true}
          toggleSidebar={toggleCreateSidebar}
          handleChange={handleChange}
          filterData={filterData}
          filterList={filterList}
          needDate={true}
          filterLocalData={localStorage.getItem("statusFilterTransfer")}
          handleStatusChange={handleStatusChange} // передаем обработчик изменения статуса
          initialRange={dateRange}
          onRangeChange={setDateRange}
        />
        <MUITextField
          className={classes.mainSearch}
          label={"Поиск"}
          value={searchQuery}
          onChange={handleSearch}
        />
        <Button onClick={toggleCreateSidebar}>Создать заявку</Button>
      </div>
      {loading && <MUILoader fullHeight={"70vh"} />}
      {error && <p>Error: {error.message}</p>}

      {/* Отображение таблицы заявок и компонентов пагинации */}
      {!loading && !error && (
        <>
          <InfoTableDataTransferOrders
            user={user}
            disAdmin={disAdmin}
            token={token}
            toggleRequestSidebar={toggleRequestSidebar}
            requests={filteredRequests || []}
            chooseRequestID={chooseRequestID}
            setChooseObject={setChooseObject}
            setChooseRequestID={setChooseRequestID}
            // pageInfo={pageInfo.skip}
            // scrollToId={requestIdFromState}
          />

          {/* {totalPages > 0 && (
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
          )} */}
        </>
      )}
      {/* Боковые панели для создания и выбора заявок */}
      <CreateTransferRequest
        show={showCreateSidebar}
        onClose={toggleCreateSidebar}
        onMatchFound={handleOpenExistRequest}
        user={user}
        addNotification={addNotification}
      />
      {/* <ExistRequest
        setChooseCityRequest={setChooseCityRequest}
        show={showRequestSidebar}
        onClose={toggleRequestSidebar}
        setChooseRequestID={setChooseRequestID}
        setShowChooseHotel={setShowChooseHotel}
        chooseRequestID={chooseRequestID ? chooseRequestID : existRequestData}
        user={user}
        accessMenu={accessMenu}
        openDeleteComponent={openDeleteComponent}
        setRequestId={setChooseRequestId}
      /> */}
      {/* <ChooseHotel
        chooseCityRequest={chooseCityRequest}
        show={showChooseHotel}
        onClose={toggleChooseHotel}
        chooseObject={chooseObject}
        chooseRequestID={chooseRequestID}
        id={"main"}
      /> */}

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

      {notifications.map((n, index) => (
        <Notification
          key={n.id}
          text={n.text}
          status={n.status}
          index={index}
          time={notifyTime}
          onClose={() => {
            setNotifications((prev) =>
              prev.filter((notif) => notif.id !== n.id)
            );
          }}
        />
      ))}
    </div>
  );
}

export default TransferOrders;
