import React, { useState, useEffect, useMemo } from "react";
import classes from "./SupportPage.module.css";
import Filter from "../Filter/Filter";
import {
  GET_AIRLINES,
  GET_AIRLINES_SUBSCRIPTION,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_DISPATCHER,
  GET_USER_SUPPORT_CHATS,
  getCookie,
} from "../../../../graphQL_requests";
import { useQuery, useSubscription } from "@apollo/client";
import Header from "../Header/Header";
import InfoTableDataAirlines from "../InfoTableDataAirlines/InfoTableDataAirlines";
import CreateRequestAirline from "../CreateRequestAirline/CreateRequestAirline";
import ReactPaginate from "react-paginate";
import { useLocation, useNavigate } from "react-router-dom";
import Support from "../Support/Support";
import InfoTableDataSupport from "../InfoTableDataSupport/InfoTableDataSupport";

function SupportPage({ children, user, ...props }) {
  const token = getCookie("token");

  const {
    loading: userLoading,
    error: userError,
    data: userData,
  } = useQuery(GET_DISPATCHER, {
    variables: { userId: user.userId },
    skip: !user.userId,
  });

  //   console.log(userData?.user);

  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [companyData, setCompanyData] = useState([]);
  const [filterData, setFilterData] = useState({ filterSelect: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false); // Флаг, указывающий, идёт ли поиск
  const [allFilteredData, setAllFilteredData] = useState([]); // Хранилище всех данных для поиска

  const { data: dataSubscription } = useSubscription(GET_AIRLINES_SUBSCRIPTION);
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION
  );

  const location = useLocation();
  const navigate = useNavigate();

  // Получение текущей страницы из URL
  const pageNumber = new URLSearchParams(location.search).get("page");
  const currentPage = pageNumber ? parseInt(pageNumber) - 1 : 0;

  const [pageInfo, setPageInfo] = useState({ skip: currentPage, take: 20 });

  const { loading, error, data, refetch } = useQuery(GET_USER_SUPPORT_CHATS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // useEffect(() => {
  //     if (data && data.airlines) {
  //         const sortedAirlines = [...data.airlines.airlines].sort((a, b) => a.name.localeCompare(b.name));
  //         setCompanyData(sortedAirlines);
  //     }

  //     if (dataSubscription && dataSubscription.hotelCreated) {
  //         setCompanyData((prevCompanyData) => {
  //             const updatedData = [...prevCompanyData, dataSubscription.airlineCreated];
  //             return updatedData.sort((a, b) => a.name.localeCompare(b.name));
  //         });
  //     }

  //     refetch();
  // }, [data, refetch, dataSubscription, dataSubscriptionUpd]);

  const handleSelectId = (id) => {
    setSelectedId(id);
    toggleRequestSidebar(); // Открытие боковой панели
  };

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilterData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  //   const handleSearch = async (e) => {
  //     const query = e.target.value;
  //     setSearchQuery(query);

  //     if (query.trim() == "") {
  //       // Если строка поиска пуста, возвращаемся к стандартному режиму
  //       setIsSearching(false);
  //       refetch({
  //         pagination: { skip: currentPage, take: 20 }, // Загрузить большое количество данных для поиска
  //       }); // Запускаем повторный запрос с пагинацией
  //       return;
  //     }

  //     setIsSearching(true); // Активируем режим поиска

  //     try {
  //       const { data } = await refetch({
  //         pagination: { all: true }, // Загрузить большое количество данных для поиска
  //       });

  //       if (data && data.airlines?.airlines) {
  //         setAllFilteredData(data.airlines.airlines); // Сохраняем все данные для локального поиска
  //       }
  //     } catch (err) {
  //       console.error("Ошибка при поиске:", err);
  //     }
  //   };

  // Фильтрация запросов по имени авиакомпании
  // const filteredRequests = useMemo(() => {
  //     const dataSource = isSearching ? allFilteredData : companyData; // Используем данные из поиска или стандартные
  //     return dataSource.filter(request => request.name.toLowerCase().includes(searchQuery.toLowerCase()));
  // }, [isSearching, allFilteredData, companyData, searchQuery]);

  const filteredRequests = data?.supportChats;

  //   console.log(filteredRequests?.map((item)=> item.participants[0].images[0]));

  // Пагинация: общее количество страниц
  //   const totalPages = data?.airlines?.totalPages;

  // Корректировка текущей страницы
  //   const validCurrentPage = currentPage < totalPages ? currentPage : 0;

  // Пагинация: вычисляем элементы для отображения на текущей странице
  // const paginatedRequests = useMemo(() => {
  //     const start = pageInfo.skip * pageInfo.take;
  //     const end = start + pageInfo.take;
  //     return filteredRequests.slice(start, end);
  // }, [filteredRequests, pageInfo]);

  //   const handlePageClick = (event) => {
  //     const selectedPage = event.selected;
  //     setPageInfo((prev) => ({ ...prev, skip: selectedPage }));
  //     navigate(`?page=${selectedPage + 1}`);
  //   };

  let filterList = ["Москва", "Санкт-Петербург"];

  return (
    <>
      <div className={classes.section}>
        <Header>Поддержка</Header>

        <div className={classes.section_searchAndFilter}>
          {/* <input
            type="text"
            placeholder="Поиск"
            style={{ width: "500px" }}
            value={searchQuery}
            onChange={handleSearch}
          /> */}
          {/* <Filter
                        toggleSidebar={toggleCreateSidebar}
                        handleChange={handleChange}
                        filterData={filterData}
                        buttonTitle={'Добавить авиакомпанию'}
                        needDate={false}
                    /> */}
        </div>

        {loading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <>
            <InfoTableDataSupport
              toggleRequestSidebar={toggleRequestSidebar}
              requests={filteredRequests.map((request, index) => ({
                ...request,
                order: pageInfo.skip * pageInfo.take + index + 1, // Добавляем порядковый номер
              }))}
              pageInfo={pageInfo.skip}
              onSelectId={handleSelectId}
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

        <Support
          show={showRequestSidebar}
          onClose={toggleRequestSidebar}
          user={userData?.user}
          selectedId={selectedId}
        />
      </div>
    </>
  );
}

export default SupportPage;
