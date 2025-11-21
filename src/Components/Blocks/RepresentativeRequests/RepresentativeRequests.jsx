import React, { useEffect, useMemo, useState } from "react";
import classes from "./RepresentativeRequests.module.css";
import Filter from "../Filter/Filter";
import CreateRepresentativeRequest from "../CreateRepresentativeRequest/CreateRepresentativeRequest";
import { requestsReserve } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataReserve from "../InfoTableDataReserve/InfoTableDataReserve";
import {
  GET_AIRLINE,
  GET_HOTEL_CITY,
  GET_HOTEL_TARIFS,
  GET_RESERVE_REQUESTS,
  getCookie,
  REQUEST_RESERVE_CREATED_SUBSCRIPTION,
  REQUEST_RESERVE_UPDATED_SUBSCRIPTION,
} from "../../../../graphQL_requests";
import { useQuery, useSubscription } from "@apollo/client";
import { useLocation, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import { fullNotifyTime, notifyTime, statusMapping } from "../../../roles";
import Notification from "../../Notification/Notification";
import { useDebounce } from "../../../hooks/useDebounce";
import Button from "../../Standart/Button/Button";
import InfoTableRepresentativeData from "../InfoTableRepresentativeData/InfoTableRepresentativeData";

// Основной компонент страницы, отображающий список заявок с возможностью фильтрации, поиска и пагинации
function RepresentativeRequests({ children, user, idHotel, accessMenu, ...props }) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getCookie("token");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Получение текущей страницы из URL или localStorage
  let pageNumberReserve = new URLSearchParams(location.search).get("page");
  let localPage = localStorage.getItem("currentPageReserve");
  let currentPageReserve = localPage
    ? parseInt(localPage) - 1
    : pageNumberReserve
    ? parseInt(pageNumberReserve) - 1
    : 0;

  // Состояние для фильтрации по статусу
  const [statusFilter, setStatusFilter] = useState(() => {
    return localStorage.getItem("statusFilterReserve") || "all";
  });

  // console.log(user);

  // Состояние для управления параметрами пагинации
  const [pageInfo, setPageInfo] = useState({
    skip: currentPageReserve,
    take: 50,
  });

  // Запрос на получение списка заявок с учетом пагинации
  const { loading, error, data, refetch } = useQuery(GET_RESERVE_REQUESTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: {
        skip: pageInfo.skip,
        take: pageInfo.take,
        status: statusFilter.split(" / "),
        search: debouncedSearch,
      },
    },
  });

  // Обновление состояния фильтрации по статусу
  const handleStatusChange = (value) => {
    setStatusFilter(value);
    localStorage.setItem("statusFilterReserve", value);
  };

  // Подписки на создание и обновление заявок
  const { data: subscriptionData } = useSubscription(
    REQUEST_RESERVE_CREATED_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        refetch();
      },
    }
  );
  const { data: subscriptionUpdateData } = useSubscription(
    REQUEST_RESERVE_UPDATED_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onComplete: () => {
        refetch();
      },
    }
  );

  const [newRequests, setNewRequests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  // Сохранение текущей страницы в localStorage
  useEffect(() => {
    if (pageNumberReserve) {
      localStorage.setItem("currentPageReserve", pageNumberReserve);
    }
  }, [pageNumberReserve]);

  // Обновление списка заявок при добавлении новых через подписку
  // useEffect(() => {
  //   if (subscriptionData) {
  //     const newRequest = subscriptionData.reserveCreated;
  //     const statusMatchesFilter = statusFilter
  //       .split(" / ")
  //       .includes(newRequest.status);

  //     if (statusMatchesFilter) {
  //       setRequests((prevRequests) => {
  //         const exists = prevRequests.some(
  //           (request) => request.id === newRequest.id
  //         );
  //         if (!exists) {
  //           if (currentPageReserve === 0) {
  //             return [newRequest, ...prevRequests];
  //           } else {
  //             setNewRequests((prevNewRequests) => [
  //               newRequest,
  //               ...prevNewRequests,
  //             ]);
  //           }
  //         }
  //         return prevRequests;
  //       });
  //     }
  //     refetch();
  //   }
  // }, [subscriptionData, currentPageReserve, refetch]);

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
  // useEffect(() => {
  //   if (subscriptionUpdateData) {
  //     refetch();
  //   }
  // }, [subscriptionUpdateData, refetch]);

  // Обработчик смены страницы
  const handlePageClick = (event) => {
    const selectedPage = event.selected;
    setPageInfo((prev) => ({ ...prev, skip: selectedPage }));
    localStorage.setItem("currentPageReserve", selectedPage + 1);
    navigate(`?page=${selectedPage + 1}`);
  };

  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [showChooseHotel, setShowChooseHotel] = useState(false);

  const toggleCreateSidebar = () => setShowCreateSidebar(!showCreateSidebar);
  const toggleRequestSidebar = () => setShowRequestSidebar(!showRequestSidebar);
  const toggleChooseHotel = () => setShowChooseHotel(!showChooseHotel);

  const [filterData, setFilterData] = useState({
    filterSelect: "",
    filterDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilterData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // if (query.trim() == "") {
    //   // Если строка поиска пуста, возвращаемся к стандартному режиму
    //   setIsSearching(false);
    //   refetch({
    //     pagination: { skip: currentPageReserve, take: 50 }, // Загрузить большое количество данных для поиска
    //   }); // Запускаем повторный запрос с пагинацией
    //   return;
    // }

    // setIsSearching(true); // Активируем режим поиска

    // try {
    //   const { data } = await refetch({
    //     pagination: {
    //       skip: 0,
    //       take: 10000000,
    //       status: statusFilter.split(" / "),
    //     }, // Загрузить большое количество данных для поиска
    //   });

    //   if (data && data.reserves?.reserves) {
    //     setAllFilteredData(data.reserves.reserves); // Сохраняем все данные для локального поиска
    //   }
    // } catch (err) {
    //   console.error("Ошибка при поиске:", err);
    // }
  };

  // useEffect(() => {
  //   if (!isSearching) {
  //     refetch({
  //       pagination: {
  //         skip: pageInfo.skip,
  //         take: pageInfo.take,
  //         status: statusFilter.split(" / "),
  //       },
  //     });
  //   }
  // }, [isSearching, refetch, pageInfo, statusFilter]);

  const [hotelCity, setHotelCity] = useState();
  const { data: hotelData } = useQuery(GET_HOTEL_CITY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { hotelId: idHotel },
  });
  useEffect(() => {
    if (hotelData) setHotelCity(hotelData.hotel.city);
  }, [hotelData]);

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

  const filteredRequests = useMemo(() => {
    if (!requests) return [];

    return requests.filter((request) => {
      const matchesSelect =
        !filterData.filterSelect ||
        request.aviacompany.includes(filterData.filterSelect);
      const matchesDate =
        !filterData.filterDate || request.date === filterData.filterDate;
      // Получаем читаемое название статуса
      const statusDisplay = statusMapping[request.status] || request.status;
      const matchesSearchQuery = [
        // request.id.toLowerCase(),
        // request.reserveNumber.toLowerCase(),
        // request.airport?.city.toLowerCase(),
        // request.airline?.name.toLowerCase(),
        // request.airport?.name.toLowerCase(),
        // request.airport?.code.toLowerCase(),
        // request.arrival.toLowerCase(),
        // request.departure.toLowerCase(),
        // request.status?.toLowerCase(),
        statusDisplay?.toLowerCase() || "",
      ].some((field) => field.includes(searchQuery.toLowerCase()));

      const matchesCity = hotelCity
        ? request.airport?.city.toLowerCase() === hotelCity.toLowerCase()
        : true;
      const matchesAirline = airlineName
        ? request.airline?.name.toLowerCase() === airlineName.toLowerCase()
        : true;

      return (
        matchesCity &&
        matchesSelect &&
        matchesDate &&
        matchesSearchQuery &&
        matchesAirline
      );
      // return matchesSelect && matchesDate && matchesSearchQuery && matchesAirline;
    });
  }, [requests, filterData, searchQuery, hotelCity, airlineName]);

  const filterList = ["Азимут", "S7 airlines", "Северный ветер"];

  const validCurrentPage =
    currentPageReserve < totalPages ? currentPageReserve : 0;
  return (
    <>
      <div className={classes.section}>
        <Header>Заявки</Header>
        <div className={classes.section_searchAndFilter}>
          <Filter
            user={user}
            isEstafeta={true}
            toggleSidebar={toggleCreateSidebar}
            handleChange={handleChange}
            filterData={filterData}
            buttonTitle={"Создать заявку"}
            filterList={filterList}
            needDate={true}
            filterLocalData={localStorage.getItem("statusFilterReserve")}
            handleStatusChange={handleStatusChange} // передаем обработчик изменения статуса
          />
          <MUITextField
            className={classes.mainSearch}
            label={"Поиск"}
            value={searchQuery}
            onChange={handleSearch}
          />
          {!user?.airlineId || accessMenu.requestCreate ? (
            <Button onClick={toggleCreateSidebar}>Создать заявку</Button>
          ) : null}
        </div>

        {loading && <MUILoader fullHeight={"75vh"} />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && requests && (
          <>
            <InfoTableRepresentativeData
              user={user}
              paginationHeight={totalPages === 1 && "329px"}
              toggleRequestSidebar={toggleRequestSidebar}
              requests={filteredRequests}
              pageInfo={pageInfo.skip}
            />
            {totalPages > 0 && (
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

        <CreateRepresentativeRequest
          show={showCreateSidebar}
          onClose={toggleCreateSidebar}
          user={user}
          addNotification={addNotification}
        />

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
    </>
  );
}

export default RepresentativeRequests;
