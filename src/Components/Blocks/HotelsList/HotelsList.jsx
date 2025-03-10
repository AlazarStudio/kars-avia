import React, { useState, useEffect, useMemo } from "react";
import classes from "./HotelsList.module.css";
import Filter from "../Filter/Filter";
import CreateRequestHotel from "../CreateRequestHotel/CreateRequestHotel";
import Header from "../Header/Header";
import InfoTableDataHotels from "../InfoTableDataHotels/InfoTableDataHotels";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_HOTELS,
  GET_HOTELS_SUBSCRIPTION,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
} from "../../../../graphQL_requests";
import { fullNotifyTime, notifyTime, roles } from "../../../roles";
import ReactPaginate from "react-paginate";
import { useLocation, useNavigate } from "react-router-dom";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import Notification from "../../Notification/Notification";

function HotelsList({ children, user, ...props }) {
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [companyData, setCompanyData] = useState([]);
  const [filterData, setFilterData] = useState({ filterSelect: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false); // Флаг, указывающий, идёт ли поиск
  const [allFilteredData, setAllFilteredData] = useState([]); // Хранилище всех данных для поиска

  const { data: dataSubscription } = useSubscription(GET_HOTELS_SUBSCRIPTION);
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_HOTELS_UPDATE_SUBSCRIPTION
  );

  const location = useLocation();
  const navigate = useNavigate();

  // Получение текущей страницы из URL
  const pageNumber = new URLSearchParams(location.search).get("page");
  const currentPage = pageNumber ? parseInt(pageNumber) - 1 : 0;

  const [pageInfo, setPageInfo] = useState({ skip: currentPage, take: 20 });

  const { loading, error, data, refetch } = useQuery(GET_HOTELS, {
    variables: { pagination: { skip: pageInfo.skip, take: pageInfo.take } },
  });

  // в этой версии проблема с дублированием
  useEffect(() => {
      if (data && data.hotels) {
          const sortedHotels = [...data.hotels.hotels].sort((a, b) => a.city?.localeCompare(b.city));
          setCompanyData(sortedHotels);
      }

      if (dataSubscription && dataSubscription.hotelCreated) {
          setCompanyData((prevCompanyData) => {
              const updatedData = [...prevCompanyData, dataSubscription.hotelCreated];
              return updatedData.sort((a, b) => a.information?.city?.localeCompare(b.city));
          });
      }

      refetch();
  }, [data, refetch, dataSubscription, dataSubscriptionUpd]);

  // useEffect(() => {
  //   if (data && data.hotels) {
  //     const sortedHotels = [...data.hotels.hotels].sort((a, b) =>
  //       a.information?.city.localeCompare(b.information?.city)
  //     );
  //     setCompanyData(sortedHotels);
  //   }

  //   if (dataSubscription && dataSubscription.hotelCreated) {
  //     setCompanyData((prevCompanyData) => {
  //       // Если отель уже существует, не добавляем его повторно
  //       if (
  //         prevCompanyData.some(
  //           (hotel) => hotel.id === dataSubscription.hotelCreated.id
  //         )
  //       ) {
  //         return prevCompanyData;
  //       }
  //       const updatedData = [...prevCompanyData, dataSubscription.hotelCreated];
  //       return updatedData.sort((a, b) =>
  //         a.information?.city.localeCompare(b.information?.city)
  //       );
  //     });
  //   }

  //   refetch();
  // }, [data, refetch, dataSubscription, dataSubscriptionUpd]);

  const addHotel = (newHotel) => {
    setCompanyData(
      [...companyData, newHotel].sort((a, b) =>
        a.information?.city.localeCompare(b.city)
      )
    );
  };

  const toggleCreateSidebar = () => {
    setShowCreateSidebar(!showCreateSidebar);
  };

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
  };

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

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

    if (query.trim() == "") {
      // Если строка поиска пуста, возвращаемся к стандартному режиму
      setIsSearching(false);
      refetch({
        pagination: { skip: currentPage, take: 20 }, // Загрузить большое количество данных для поиска
      }); // Запускаем повторный запрос с пагинацией
      return;
    }

    setIsSearching(true); // Активируем режим поиска

    try {
      const { data } = await refetch({
        pagination: { all: true }, // Загрузить большое количество данных для поиска
      });

      if (data && data.hotels?.hotels) {
        setAllFilteredData(data.hotels.hotels); // Сохраняем все данные для локального поиска
      }
    } catch (err) {
      console.error("Ошибка при поиске:", err);
    }
  };

  const filteredRequests = useMemo(() => {
    const dataSource = isSearching ? allFilteredData : companyData; // Используем данные из поиска или стандартные

    return dataSource.filter((request) => {
      return (
        (filterData.filterSelect === "" ||
          request.information?.city.includes(filterData.filterSelect)) &&
        (request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request?.information?.city?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          request.information?.address?.toLowerCase()
            .includes(searchQuery.toLowerCase()))
      );
    });
  }, [isSearching, allFilteredData, companyData, filterData, searchQuery]);

  // Пагинация: общее количество страниц
  const totalPages = data?.hotels?.totalPages;

  // Корректировка текущей страницы
  const validCurrentPage = currentPage < totalPages ? currentPage : 0;

  // Пагинация: учитываем текущую страницу
  // const paginatedRequests = useMemo(() => {
  //     const start = pageInfo.skip * pageInfo.take;
  //     const end = start + pageInfo.take;
  //     return filteredRequests.slice(start, end);
  // }, [filteredRequests, pageInfo]);

  const handlePageClick = (event) => {
    const selectedPage = event.selected;
    setPageInfo((prev) => ({ ...prev, skip: selectedPage }));
    navigate(`?page=${selectedPage + 1}`);
  };

  let filterList = ["Москва", "Санкт-Петербург"];

  return (
    <>
      <div className={classes.section}>
        <Header>Гостиницы</Header>

        <div className={classes.section_searchAndFilter}>
          {/* <input
                        type="text"
                        placeholder="Поиск"
                        style={{ width: '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    /> */}
          <MUITextField
            label={"Поиск"}
            className={classes.mainSearch}
            value={searchQuery}
            onChange={handleSearch}
          />
          {(user.role === roles.superAdmin ||
            user.role === roles.dispatcerAdmin) && (
            <Filter
              toggleSidebar={toggleCreateSidebar}
              handleChange={handleChange}
              filterData={filterData}
              buttonTitle={"Добавить гостиницу"}
              filterList={filterList}
              needDate={false}
            />
          )}
        </div>
        {loading && <MUILoader />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <>
            <InfoTableDataHotels
              toggleRequestSidebar={toggleRequestSidebar}
              requests={filteredRequests.map((request, index) => ({
                ...request,
                order: pageInfo.skip * pageInfo.take + index + 1, // Добавляем порядковый номер
              }))}
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
        <CreateRequestHotel
          show={showCreateSidebar}
          onClose={toggleCreateSidebar}
          addHotel={addHotel}
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

export default HotelsList;
