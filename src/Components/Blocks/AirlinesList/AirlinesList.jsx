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
import { useDebounce } from "../../../hooks/useDebounce";

function AirlinesList({ children, representative, ...props }) {
  const token = getCookie("token");
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [companyData, setCompanyData] = useState([]);
  const [filterData, setFilterData] = useState({ filterSelect: "" });
  const [airports, setAirports] = useState([]);
  const [cities, setCities] = useState([]);

  const { data: dataSubscription } = useSubscription(
    GET_AIRLINES_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );

  const location = useLocation();
  const navigate = useNavigate();

  const urlParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const pageNumber = urlParams.get("page");
  const currentPage = pageNumber ? parseInt(pageNumber) - 1 : 0;
  const urlSearch = urlParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [pageInfo, setPageInfo] = useState({ skip: currentPage, take: 20 });

  const updateUrlParams = (updates) => {
    const params = new URLSearchParams(location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value == null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const qs = params.toString();
    navigate(qs ? `?${qs}` : "", { replace: false });
  };

  useEffect(() => {
    setPageInfo((prev) =>
      prev.skip === currentPage ? prev : { ...prev, skip: currentPage },
    );
  }, [currentPage]);

  // Сброс поиска при уходе ?search= из URL (клик по пункту меню).
  // Реагируем только на изменения URL, иначе эффект срабатывает на
  // каждое нажатие клавиши и стирает ввод до debounce.
  useEffect(() => {
    if (!urlSearch && searchQuery) {
      setSearchQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  // Сброс страницы + sync URL при смене запроса (только если он реально
  // отличается от значения в URL).
  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next === urlSearch.trim()) return;
    setPageInfo((prev) => (prev.skip === 0 ? prev : { ...prev, skip: 0 }));
    updateUrlParams({ search: next || "", page: "1" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const airlineFilter = useMemo(
    () => ({
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    }),
    [debouncedSearch],
  );

  const { loading, error, data, refetch } = useQuery(GET_AIRLINES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: { skip: pageInfo.skip, take: pageInfo.take },
      filter: Object.keys(airlineFilter).length > 0 ? airlineFilter : undefined,
    },
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
      setCompanyData([...data.airlines.airlines].sort((a, b) => a.name.localeCompare(b.name)));
    }

    if (dataSubscription && dataSubscription.hotelCreated) {
      setCompanyData((prevCompanyData) =>
        [...prevCompanyData, dataSubscription.airlineCreated].sort((a, b) => a.name.localeCompare(b.name)),
      );
    }

    refetch();
  }, [data, refetch, dataSubscription, dataSubscriptionUpd]);

  const addAirline = (airline) => {
    setCompanyData(
      [...companyData, airline].sort((a, b) => a.name.localeCompare(b.name)),
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

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRequests = companyData;

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
    updateUrlParams({ page: String(selectedPage + 1) });
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
