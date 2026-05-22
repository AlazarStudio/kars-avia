import React, { useState, useEffect, useMemo } from "react";
import classes from "./HotelsList.module.css";
import Filter from "../Filter/Filter";
import CreateRequestHotel from "../CreateRequestHotel/CreateRequestHotel";
import Header from "../Header/Header";
import InfoTableDataHotels from "../InfoTableDataHotels/InfoTableDataHotels";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_HOTELS,
  GET_HOTELS_SUBSCRIPTION,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  GET_CITIES,
  getCookie,
} from "../../../../graphQL_requests";
import { roles } from "../../../roles";
import ReactPaginate from "react-paginate";
import { useLocation, useNavigate } from "react-router-dom";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";

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
  const urlStars = urlParams.get("stars") || "";
  const urlUsStars = urlParams.get("usStars") || "";
  const urlSearch = urlParams.get("search") || "";

  const [filterData, setFilterData] = useState({
    filterStars: urlStars,
    filterUsStars: urlUsStars,
  });
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [isSearching, setIsSearching] = useState(Boolean(urlSearch));
  const [allFilteredData, setAllFilteredData] = useState([]);

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
      ...(filterData.filterStars && { stars: filterData.filterStars }),
      ...(filterData.filterUsStars && { usStars: filterData.filterUsStars }),
    }),
    [selectedCity?.id, filterData.filterStars, filterData.filterUsStars],
  );

  const { data: citiesData } = useQuery(GET_CITIES, {
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
  // по пункту меню «Гостиницы»).
  useEffect(() => {
    if (!urlSearch && searchQuery) {
      setSearchQuery("");
      setIsSearching(false);
      setAllFilteredData([]);
    }
  }, [urlSearch, searchQuery]);

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
    skip: isSearching,
  });

  // в этой версии проблема с дублированием
  useEffect(() => {
    if (data && data.hotels) {
      // Скрываем external отели (TravelLine и т.п.) — они отображаются в TravelLine Integration
      const onlyLocal = data.hotels.hotels.filter(
        (h) => !h.externalSource || h.externalSource === "",
      );
      setCompanyData(onlyLocal);
    }

    if (dataSubscription && dataSubscription.hotelCreated) {
      // setCompanyData((prevCompanyData) => {
      //   const updatedData = [...prevCompanyData, dataSubscription.hotelCreated];
      //   return updatedData.sort((a, b) =>
      //     a.information?.city?.localeCompare(b.information?.city)
      //   );
      // });
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

  const runSearch = async (query) => {
    if (query.trim() === "") {
      setIsSearching(false);
      refetch({
        pagination: { skip: currentPage, take: 20 },
        filter: Object.keys(hotelFilter).length > 0 ? hotelFilter : undefined,
      });
      return;
    }

    setIsSearching(true);

    try {
      const { data } = await refetch({
        pagination: { all: true },
        filter: Object.keys(hotelFilter).length > 0 ? hotelFilter : undefined,
      });

      if (data && data.hotels?.hotels) {
        setAllFilteredData(data.hotels.hotels);
      }
    } catch (err) {
      console.error("Ошибка при поиске:", err);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    updateUrlParams({ search: query.trim() ? query : "" });
    await runSearch(query);
  };

  // Восстановление поиска при возвращении на страницу с непустым ?search=.
  useEffect(() => {
    if (urlSearch && isSearching && allFilteredData.length === 0) {
      runSearch(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  const filteredRequests = useMemo(() => {
    const dataSource = isSearching ? allFilteredData : companyData;

    if (!searchQuery.trim()) return dataSource;

    return dataSource.filter(
      (request) =>
        request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request?.information?.city
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        request.information?.address
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  }, [isSearching, allFilteredData, companyData, searchQuery]);

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

  const starsOptions = ["1", "2", "3", "4", "5"];
  const usStarsOptions = ["1", "2", "3", "4", "5"];

  return (
    <>
      <div className={classes.section}>
        <Header>Гостиницы</Header>

        <div className={classes.section_searchAndFilter}>
          <div className={classes.filter}>
            <MUIAutocompleteColor
              dropdownWidth="170px"
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
                        style={{
                          color: index === 0 ? "black" : "gray",
                          marginRight: 4,
                        }}
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
            <MUIAutocomplete
              dropdownWidth="170px"
              hideLabelOnFocus={false}
              label="Оценка"
              options={starsOptions}
              value={filterData.filterStars || ""}
              onChange={(_, newValue) =>
                handleFilterChange("filterStars", newValue || "")
              }
            />
            <MUIAutocomplete
              dropdownWidth="170px"
              hideLabelOnFocus={false}
              label="Звёздность"
              options={usStarsOptions}
              value={filterData.filterUsStars || ""}
              onChange={(_, newValue) =>
                handleFilterChange("filterUsStars", newValue || "")
              }
            />
          </div>
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
