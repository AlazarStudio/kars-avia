import React, { useState, useEffect, useMemo } from "react";
import classes from "./AirlinesList.module.css";
import Filter from "../Filter/Filter";
import {
  GET_AIRLINES,
  GET_AIRLINES_SUBSCRIPTION,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_AIRPORTS_RELAY,
  GET_CITIES,
  getCookie,
} from "../../../../graphQL_requests";
import { useQuery, useSubscription } from "@apollo/client";
import Header from "../Header/Header";
import InfoTableDataAirlines from "../InfoTableDataAirlines/InfoTableDataAirlines";
import CreateRequestAirline from "../CreateRequestAirline/CreateRequestAirline";
import ReactPaginate from "react-paginate";
import { useLocation, useNavigate } from "react-router-dom";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import InfoTableDataRepresentativeAirlines from "../InfoTableDataRepresentativeAirlines/InfoTableDataRepresentativeAirlines";

function AirlinesList({ children, representative, ...props }) {
  const token = getCookie("token");
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [companyData, setCompanyData] = useState([]);
  const [filterData, setFilterData] = useState({ filterSelect: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false); // Флаг, указывающий, идёт ли поиск
  const [allFilteredData, setAllFilteredData] = useState([]); // Хранилище всех данных для поиска
  const [airports, setAirports] = useState([]); // Список аэропортов
  const [cities, setCities] = useState([]); // Список аэропортов

  const { data: dataSubscription } = useSubscription(GET_AIRLINES_SUBSCRIPTION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION, {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const location = useLocation();
  const navigate = useNavigate();

  // Получение текущей страницы из URL
  const pageNumber = new URLSearchParams(location.search).get("page");
  const currentPage = pageNumber ? parseInt(pageNumber) - 1 : 0;

  const [pageInfo, setPageInfo] = useState({ skip: currentPage, take: 20 });

  const { loading, error, data, refetch } = useQuery(GET_AIRLINES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { pagination: { skip: pageInfo.skip, take: pageInfo.take } },
    skip: isSearching,
  });

  const infoAirports = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !representative,
  });

  const { data: citiesData } = useQuery(GET_CITIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !representative,
  });

  useEffect(() => {
    if (infoAirports.data && representative) {
      setAirports(infoAirports.data.airports || []);
    }
    if (citiesData) {
      setCities(citiesData.citys);
    }
  }, [infoAirports.data, citiesData, representative]);

  useEffect(() => {
    if (data && data.airlines) {
      const sortedAirlines = [...data.airlines.airlines].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setCompanyData(sortedAirlines);
    }

    if (dataSubscription && dataSubscription.hotelCreated) {
      setCompanyData((prevCompanyData) => {
        const updatedData = [
          ...prevCompanyData,
          dataSubscription.airlineCreated,
        ];
        return updatedData.sort((a, b) => a.name.localeCompare(b.name));
      });
    }

    refetch();
  }, [data, refetch, dataSubscription, dataSubscriptionUpd]);

  const addAirline = (airline) => {
    setCompanyData(
      [...companyData, airline].sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const toggleCreateSidebar = () => {
    setShowCreateSidebar(!showCreateSidebar);
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

      if (data && data.airlines?.airlines) {
        setAllFilteredData(data.airlines.airlines); // Сохраняем все данные для локального поиска
      }
    } catch (err) {
      console.error("Ошибка при поиске:", err);
    }
  };

  // Фильтрация запросов по имени авиакомпании
  const filteredRequests = useMemo(() => {
    const dataSource = isSearching ? allFilteredData : companyData; // Используем данные из поиска или стандартные
    return dataSource.filter((request) =>
      request.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [isSearching, allFilteredData, companyData, searchQuery]);

  // Пагинация: общее количество страниц
  const totalPages = data?.airlines?.totalPages;

  // Корректировка текущей страницы
  const validCurrentPage = currentPage < totalPages ? currentPage : 0;

  // Пагинация: вычисляем элементы для отображения на текущей странице
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

  return (
    <>
      <div className={classes.section}>
        <Header>Авиакомпании</Header>

        <div className={classes.section_searchAndFilter}>
          <MUITextField
            label={"Поиск"}
            className={classes.mainSearch}
            value={searchQuery}
            onChange={handleSearch}
          />
          <Filter
            toggleSidebar={toggleCreateSidebar}
            handleChange={handleChange}
            filterData={filterData}
            buttonTitle={"Добавить авиакомпанию"}
            needDate={false}
          />
        </div>

        {loading && <MUILoader />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <>
            {representative ? (
              <InfoTableDataRepresentativeAirlines
                toggleRequestSidebar={toggleRequestSidebar}
                requests={filteredRequests.map((request, index) => ({
                  ...request,
                  order: pageInfo.skip * pageInfo.take + index + 1, // Добавляем порядковый номер
                }))}
                pageInfo={pageInfo.skip}
              />
            ) : (
              <InfoTableDataAirlines
                toggleRequestSidebar={toggleRequestSidebar}
                requests={filteredRequests.map((request, index) => ({
                  ...request,
                  order: pageInfo.skip * pageInfo.take + index + 1, // Добавляем порядковый номер
                }))}
                pageInfo={pageInfo.skip}
              />
            )}

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

        <CreateRequestAirline
          show={showCreateSidebar}
          airlines={companyData}
          airports={airports}
          cities={cities}
          representative={representative}
          onClose={toggleCreateSidebar}
          addHotel={addAirline}
        />
      </div>
    </>
  );
}

export default AirlinesList;
