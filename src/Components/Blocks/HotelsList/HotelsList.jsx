import React, { useState, useEffect, useMemo } from "react";
import classes from "./HotelsList.module.css";
import Filter from "../Filter/Filter";
import CreateRequestHotel from "../CreateRequestHotel/CreateRequestHotel";
import Header from "../Header/Header";
import InfoTableDataHotels from "../InfoTableDataHotels/InfoTableDataHotels";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
import FilterPopoverButton from "../FilterPopoverButton/FilterPopoverButton";
import StarRatingFilter from "../StarRatingFilter/StarRatingFilter";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_HOTELS,
  GET_HOTELS_SUBSCRIPTION,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  GET_CITIES,
  GET_AIRPORTS_RELAY,
  getCookie,
} from "../../../../graphQL_requests";
import { roles } from "../../../roles";
import ReactPaginate from "react-paginate";
import { useLocation, useNavigate } from "react-router-dom";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import { useDebounce } from "../../../hooks/useDebounce";

function HotelsList({ children, user, ...props }) {
  const token = getCookie("token");
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [companyData, setCompanyData] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  // Все фильтры синхронизируются через URL search params,
  // чтобы при возврате назад из карточки гостиницы они восстанавливались.
  const urlParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const pageNumber = urlParams.get("page");
  const currentPage = pageNumber ? parseInt(pageNumber) - 1 : 0;
  const urlCityId = urlParams.get("city") || "";
  const urlAirportId = urlParams.get("airport") || "";
  const urlStars = urlParams.get("stars") || "";
  const urlUsStars = urlParams.get("usStars") || "";
  const urlSearch = urlParams.get("search") || "";

  const [filterData, setFilterData] = useState({
    filterStars: urlStars,
    filterUsStars: urlUsStars,
  });
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [airports, setAirports] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchQuery, 400);

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

  const { data: dataSubscription } = useSubscription(GET_HOTELS_SUBSCRIPTION);
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_HOTELS_UPDATE_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
    },
  );

  const [pageInfo, setPageInfo] = useState({ skip: currentPage, take: 20 });

  const hotelFilter = useMemo(
    () => ({
      ...(selectedCity?.id && { cityId: selectedCity.id }),
      ...(selectedAirport?.id && { airportId: selectedAirport.id }),
      ...(filterData.filterStars && { stars: filterData.filterStars }),
      ...(filterData.filterUsStars && { usStars: filterData.filterUsStars }),
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    }),
    [
      selectedCity?.id,
      selectedAirport?.id,
      filterData.filterStars,
      filterData.filterUsStars,
      debouncedSearch,
    ],
  );

  const { data: citiesData } = useQuery(GET_CITIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: airportsData } = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  useEffect(() => {
    if (citiesData?.citys) {
      setCities(citiesData.citys);
    }
  }, [citiesData]);

  useEffect(() => {
    if (airportsData?.airports) {
      setAirports(airportsData.airports);
    }
  }, [airportsData]);

  // Восстановление выбранного города из URL после загрузки справочника.
  useEffect(() => {
    if (!urlCityId) {
      if (selectedCity) setSelectedCity(null);
      return;
    }
    if (selectedCity?.id === urlCityId) return;
    if (cities.length === 0) return;
    const city = cities.find((c) => c.id === urlCityId);
    if (city) setSelectedCity(city);
  }, [cities, urlCityId, selectedCity]);

  // Восстановление выбранного аэропорта из URL.
  useEffect(() => {
    if (!urlAirportId) {
      if (selectedAirport) setSelectedAirport(null);
      return;
    }
    if (selectedAirport?.id === urlAirportId) return;
    if (airports.length === 0) return;
    const airport = airports.find((a) => a.id === urlAirportId);
    if (airport) setSelectedAirport(airport);
  }, [airports, urlAirportId, selectedAirport]);

  // Синхронизация локального состояния фильтров со значениями из URL
  // (на случай навигации браузерными кнопками вперёд/назад).
  useEffect(() => {
    setFilterData((prev) =>
      prev.filterStars === urlStars && prev.filterUsStars === urlUsStars
        ? prev
        : { filterStars: urlStars, filterUsStars: urlUsStars },
    );
  }, [urlStars, urlUsStars]);

  useEffect(() => {
    setPageInfo((prev) =>
      prev.skip === currentPage ? prev : { ...prev, skip: currentPage },
    );
  }, [currentPage]);

  // Сброс поиска, если в URL не осталось ?search= (например после клика
  // по пункту меню «Гостиницы»). Реагируем только на изменения URL,
  // иначе эффект срабатывает на каждое нажатие клавиши и стирает ввод
  // до того, как debounce успеет синхронизировать URL.
  useEffect(() => {
    if (!urlSearch && searchQuery) {
      setSearchQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  // При смене поискового запроса сбрасываем страницу на первую и
  // синхронизируем URL. Игнорируем случай, когда debouncedSearch уже
  // совпадает со значением из URL (mount / browser back-forward).
  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next === urlSearch.trim()) return;
    setPageInfo((prev) => (prev.skip === 0 ? prev : { ...prev, skip: 0 }));
    updateUrlParams({
      search: next || "",
      page: "1",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { loading, error, data, refetch } = useQuery(GET_HOTELS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: { skip: pageInfo.skip, take: pageInfo.take },
      filter: Object.keys(hotelFilter).length > 0 ? hotelFilter : undefined,
    },
  });

  useEffect(() => {
    if (data && data.hotels) {
      // Скрываем external отели (TravelLine и т.п.) — они отображаются в TravelLine Integration
      const onlyLocal = data.hotels.hotels.filter(
        (h) => !h.externalSource || h.externalSource === "",
      );
      setCompanyData(onlyLocal);
    }

    if (dataSubscription && dataSubscription.hotelCreated) {
      refetch();
    }
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
    setCompanyData([...companyData, newHotel]);
  };

  const toggleCreateSidebar = () => {
    setShowCreateSidebar(!showCreateSidebar);
  };

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
  };

  const handleFilterChange = (name, value) => {
    setFilterData((prev) => ({ ...prev, [name]: value }));
    setPageInfo((prev) => ({ ...prev, skip: 0 }));
    const urlKey = name === "filterStars" ? "stars" : "usStars";
    updateUrlParams({ [urlKey]: value, page: "1" });
  };

  const handleCityChange = (_, newValue) => {
    setSelectedCity(newValue || null);
    setPageInfo((prev) => ({ ...prev, skip: 0 }));
    updateUrlParams({ city: newValue?.id || "", page: "1" });
  };

  const handleAirportChange = (_, newValue) => {
    setSelectedAirport(newValue || null);
    setPageInfo((prev) => ({ ...prev, skip: 0 }));
    updateUrlParams({ airport: newValue?.id || "", page: "1" });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRequests = companyData;

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
    updateUrlParams({ page: String(selectedPage + 1) });
  };

  const activeFilterCount =
    (selectedCity ? 1 : 0) +
    (selectedAirport ? 1 : 0) +
    (filterData.filterStars ? 1 : 0) +
    (filterData.filterUsStars ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedCity(null);
    setSelectedAirport(null);
    setFilterData({ filterStars: "", filterUsStars: "" });
    setPageInfo((prev) => ({ ...prev, skip: 0 }));
    updateUrlParams({
      city: "",
      airport: "",
      stars: "",
      usStars: "",
      page: "1",
    });
  };

  return (
    <>
      <div className={classes.section}>
        <Header>Гостиницы</Header>

        <div className={classes.section_searchAndFilter}>
          <FilterPopoverButton
            activeCount={activeFilterCount}
            onReset={handleResetFilters}
          >
            <MUIAutocompleteColor
              dropdownWidth="100%"
              label="Город"
              hideLabelOnFocus={false}
              options={cities}
              getOptionLabel={(option) => option?.city ?? ""}
              renderOption={(optionProps, option) => {
                const cityPart =
                  option.city && option.city !== option.region
                    ? `, регион: ${option.region}`
                    : "";
                const labelText = `${option.city}${cityPart}`.trim();
                const words = labelText.split(" ");
                return (
                  <li {...optionProps} key={option.id}>
                    {words.map((word, index) => (
                      <span
                        key={index}
                        style={{ color: index === 0 ? "black" : "gray", marginRight: 4 }}
                      >
                        {word}
                      </span>
                    ))}
                  </li>
                );
              }}
              value={selectedCity}
              onChange={handleCityChange}
            />
            <MUIAutocompleteColor
              dropdownWidth="100%"
              label="Аэропорт"
              hideLabelOnFocus={false}
              options={airports}
              getOptionLabel={(option) => option?.name ?? ""}
              renderOption={(optionProps, option) => (
                <li {...optionProps} key={option.id}>
                  <span style={{ color: "black", marginRight: 4 }}>{option.name}</span>
                  {option.code && (
                    <span style={{ color: "gray", marginRight: 4 }}>{option.code}</span>
                  )}
                  {option.city && <span style={{ color: "gray" }}>{option.city}</span>}
                </li>
              )}
              value={selectedAirport}
              onChange={handleAirportChange}
            />
            <StarRatingFilter
              label="Оценка"
              value={filterData.filterStars}
              onChange={(v) => handleFilterChange("filterStars", v)}
            />
            <StarRatingFilter
              label="Звёздность"
              value={filterData.filterUsStars}
              onChange={(v) => handleFilterChange("filterUsStars", v)}
            />
          </FilterPopoverButton>
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
              handleChange={() => {}}
              filterData={filterData}
              buttonTitle={"Добавить гостиницу"}
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
                order: pageInfo.skip * pageInfo.take + index + 1,
              }))}
              pageInfo={pageInfo.skip}
              user={user}
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
        />
      </div>
    </>
  );
}

export default HotelsList;
