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
  const [filterData, setFilterData] = useState({
    filterStars: "",
    filterUsStars: "",
  });
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false); // Флаг, указывающий, идёт ли поиск
  const [allFilteredData, setAllFilteredData] = useState([]); // Хранилище всех данных для поиска

  const { data: dataSubscription } = useSubscription(GET_HOTELS_SUBSCRIPTION);
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_HOTELS_UPDATE_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
    }
  );

  const location = useLocation();
  const navigate = useNavigate();

  // Получение текущей страницы из URL
  const pageNumber = new URLSearchParams(location.search).get("page");
  const currentPage = pageNumber ? parseInt(pageNumber) - 1 : 0;

  const [pageInfo, setPageInfo] = useState({ skip: currentPage, take: 20 });

  const hotelFilter = useMemo(
    () => ({
      ...(selectedCity?.id && { cityId: selectedCity.id }),
      ...(filterData.filterStars && { stars: filterData.filterStars }),
      ...(filterData.filterUsStars && { usStars: filterData.filterUsStars }),
    }),
    [selectedCity?.id, filterData.filterStars, filterData.filterUsStars]
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
      const sortedHotels = [...data.hotels.hotels].sort((a, b) =>
        a.information?.city?.localeCompare(b.information?.city)
      );
      setCompanyData(sortedHotels);
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
    setCompanyData(
      [...companyData, newHotel].sort((a, b) =>
        a.information?.city?.localeCompare(b.information?.city)
      )
    );
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
    navigate("?page=1");
  };

  const handleCityChange = (_, newValue) => {
    setSelectedCity(newValue || null);
    setPageInfo((prev) => ({ ...prev, skip: 0 }));
    navigate("?page=1");
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() == "") {
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
          .includes(searchQuery.toLowerCase())
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
    navigate(`?page=${selectedPage + 1}`);
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
                handleChange={() => { }}
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
        />
      </div>
    </>
  );
}

export default HotelsList;
