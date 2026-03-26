import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./RegisterOfContracts.module.css";
import Filter from "../Filter/Filter.jsx";

import {
  getCookie,
  GET_AIRLINE_CONTRACTS,
  GET_HOTEL_CONTRACTS,
  SUBSCRIPTION_HOTEL_CONTRACTS,
  SUBSCRIPTION_AIRLINE_CONTRACTS,
  DELETE_AIRLINE_CONTRACT,
  DELETE_HOTEL_CONTRACT,
  GET_AIRLINES_RELAY,
  GET_ALL_COMPANIES,
  GET_HOTELS_RELAY,
  GET_CITIES,
  GET_ORGANIZATIONS,
  GET_ORGANIZATION_CONTRACTS,
  SUBSCRIPTION_ORGANIZATION_CONTRACTS,
  DELETE_ORGANIZATION_CONTRACT,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";

import MUILoader from "../MUILoader/MUILoader.jsx";
import Notification from "../../Notification/Notification.jsx";
import { action, fullNotifyTime, notifyTime } from "../../../roles.js";
import MUITextField from "../MUITextField/MUITextField.jsx";
import Header from "../Header/Header.jsx";
import InfoTableAllDataTarifs from "../InfoTableAllDataTarifs/InfoTableAllDataTarifs.jsx";
import CreateRequestContract from "../CreateRequestContract/CreateRequestContract.jsx";
import CreateRequestHotelContract from "../CreateRequestHotelContract/CreateRequestHotelContract.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useDebounce } from "../../../hooks/useDebounce.jsx";
import ReactPaginate from "react-paginate";
import EditRequestAirlineContract from "../EditRequestAirlineContract/EditRequestAirlineContract.jsx";
import EditRequestHotelContract from "../EditRequestHotelContract/EditRequestHotelContract.jsx";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import DateRangeModalSelector from "../DateRangeModalSelector/DateRangeModalSelector.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import { isSuperAdmin, hasAccessMenu } from "../../../utils/access";

function RegisterOfContracts({ children, id, user, accessMenu = {}, ...props }) {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  const pageNumberRelay = new URLSearchParams(location.search).get("page");
  const currentPageRelay = pageNumberRelay ? parseInt(pageNumberRelay) - 1 : 0;
  const [searchTarif, setSearchTarif] = useState("");
  const debouncedSearch = useDebounce(searchTarif, 500);
  const [activeTab, setActiveTab] = useState("airlines"); // "contracts" | "registers"

  const [pageInfo, setPageInfo] = useState({
    skip: currentPageRelay,
    take: 50,
  });
  const [totalPages, setTotalPages] = useState(1);

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [airlines, setAirlines] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const canCreate = isSuperAdmin(user) || hasAccessMenu(accessMenu, "contractCreate");
  const canEdit = isSuperAdmin(user) || hasAccessMenu(accessMenu, "contractUpdate");

  const query =
    activeTab === "airlines"
      ? GET_AIRLINE_CONTRACTS
      : activeTab === "hotels"
        ? GET_HOTEL_CONTRACTS
        : GET_ORGANIZATION_CONTRACTS;

  const { loading, error, data, refetch } = useQuery(query, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: {
        skip: pageInfo.skip,
        take: pageInfo.take,
      },
      filter: {
        search: debouncedSearch,
        companyId: selectedCompany?.id,
        dateFrom: dateRange.startDate?.toISOString(),
        dateTo: dateRange.endDate?.toISOString(),
        ...(activeTab === "airlines" && {
          applicationType: selectedType,
          airlineId: selectedAirline?.id,
        }),
        ...(activeTab === "hotels" && {
          hotelId: selectedHotel?.id,
          cityId: selectedCity?.id,
        }),
        ...(activeTab === "transfer" && {
          organizationId: selectedOrganization?.id,
          cityId: selectedCity?.id,
        }),
      },
    },
  });
  // console.log(selectedOrganization);

  const { data: airlinesData } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: activeTab !== "airlines" ? true : false,
  });

  const { data: hotelsData } = useQuery(GET_HOTELS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: activeTab !== "hotels" ? true : false,
  });

  const { data: orgsData } = useQuery(GET_ORGANIZATIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: { all: true },
    },
    skip: activeTab !== "transfer" ? true : false,
  });

  const { data: companiesData } = useQuery(GET_ALL_COMPANIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: citiesData } = useQuery(GET_CITIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: activeTab === "airlines" ? true : false,
  });

  const [addTarif, setAddTarif] = useState([]);
  const [showAddTarif, setShowAddTarif] = useState(false);
  const [showAddTarifCategory, setShowAddTarifCategory] = useState(false);
  const [showEditAddTarif, setEditShowAddTarif] = useState(false);
  const [showEditAddTarifCategory, setEditShowAddTarifCategory] =
    useState(false);
  const [showEditMealPrices, setShowEditMealPrices] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [typeFilter, setTypeFilter] = useState("ГК Карс");

  const [selectedContract, setSelectedContract] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const [deleteAirlineContract] = useMutation(DELETE_AIRLINE_CONTRACT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [deleteHotelContract] = useMutation(DELETE_HOTEL_CONTRACT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [deleteOrganizationContract] = useMutation(
    DELETE_ORGANIZATION_CONTRACT,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  useEffect(() => {
    if (data && data.airlineContracts) {
      setAddTarif(data.airlineContracts.items);
      setTotalPages(data.airlineContracts.totalPages);
    }
    if (data && data.hotelContracts) {
      setAddTarif(data.hotelContracts.items);
      setTotalPages(data.hotelContracts.totalPages);
    }
    if (data && data.organizationContracts) {
      setAddTarif(data.organizationContracts.items);
      setTotalPages(data.organizationContracts.totalPages);
    }
  }, [data]);

  useEffect(() => {
    if (airlinesData) {
      setAirlines(airlinesData.airlines.airlines || []);
    }
    if (hotelsData) {
      setHotels(hotelsData.hotels.hotels);
    }
    if (companiesData) {
      setCompanies(companiesData.getAllCompany);
    }
    if (citiesData) {
      setCities(citiesData.citys);
    }
    if (orgsData) {
      setOrgs(orgsData.organizations?.organizations || []);
    }
  }, [airlinesData, companiesData, hotelsData, citiesData, orgsData]);

  const { data: subscriptionData } = useSubscription(
    SUBSCRIPTION_AIRLINE_CONTRACTS,
    {
      onData: () => {
        refetch();
      },
    }
  );
  const { data: subscriptionUpdateData } = useSubscription(
    SUBSCRIPTION_HOTEL_CONTRACTS,
    {
      onData: () => {
        refetch();
      },
    }
  );
  const { data: subscriptionOrgData } = useSubscription(
    SUBSCRIPTION_ORGANIZATION_CONTRACTS,
    {
      onData: () => {
        refetch();
      },
    }
  );

  // console.log(data);

  const handleSearchTarif = (e) => {
    setSearchTarif(e.target.value);
  };

  const deleteComponentRef = useRef();

  const toggleTarifs = () => {
    setShowAddTarif(!showAddTarif);
  };

  const toggleTarifsCategory = () => {
    setShowAddTarifCategory(!showAddTarifCategory);
  };

  const toggleEditTarifs = (tarif) => {
    setSelectedTarif(tarif);
    setEditShowAddTarif(true);
  };

  const toggleEditTarifsCategory = (tarif) => {
    // setSelectedTarif({
    //   data: {
    //     category,
    //     tarif,
    //   },
    // });
    setSelectedTarif(tarif);
    setEditShowAddTarifCategory(true);
  };

  useEffect(() => {
    // сбрасываем на первую страницу
    setPageInfo((prev) => ({ ...prev, skip: 0 }));
    navigate("?page=1");

    refetch({
      pagination: {
        skip: 0,
        take: pageInfo.take,
      },
      filter: {
        search: debouncedSearch,
        companyId: selectedCompany?.id,
        dateFrom: dateRange.startDate?.toISOString(),
        dateTo: dateRange.endDate?.toISOString(),
        ...(activeTab === "airlines" && {
          applicationType: selectedType,
          airlineId: selectedAirline?.id,
        }),
        ...(activeTab === "hotels" && {
          hotelId: selectedHotel?.id,
          cityId: selectedCity?.id,
        }),
        ...(activeTab === "transfer" && {
          organizationId: selectedOrganization?.id,
          cityId: selectedCity?.id,
        }),
      },
    }).catch(console.error);
  }, [
    debouncedSearch,
    dateRange,
    selectedAirline,
    selectedHotel,
    selectedOrganization,
    selectedCompany,
    selectedCity,
  ]);

  const openDeleteComponent = (index, tarifID) => {
    setShowDelete(true);
    setDeleteIndex({
      type: "deleteTarif",
      data: {
        index,
        tarifID,
      },
    });
    setEditShowAddTarif(false);
  };

  // NEW: открыть модал удаления договора (из таблицы — закрывает сайдбар)
  const openDeleteContract = (contract) => {
    setShowDelete(true);
    setDeleteIndex({
      type: "deleteContract",
      data: { contract },
    });
    setEditShowAddTarif(false);
  };

  // Открыть модал удаления без закрытия сайдбара (из меню договора)
  const openDeleteContractFromMenu = (contract) => {
    setShowDelete(true);
    setDeleteIndex({
      type: "deleteContract",
      data: { contract },
    });
  };

  // NEW: удалить договор (авиа/гостиница)
  const deleteContract = async (contract) => {
    try {
      if (activeTab === "airlines") {
        await deleteAirlineContract({
          variables: { deleteAirlineContractId: contract.id },
        });
      } else if (activeTab === "hotels") {
        await deleteHotelContract({
          variables: { deleteHotelContractId: contract.id },
        });
      } else {
        await deleteOrganizationContract({
          variables: { deleteOrganizationContractId: contract.id },
        });
      }
      // оптимистично выкидываем из списка + подстраховочно refetch
      setAddTarif((prev) => prev.filter((x) => x.id !== contract.id));
      await refetch();
      setShowDelete(false);
      setEditShowAddTarif(false);
      addNotification?.("Договор удалён.", "success");
    } catch (e) {
      console.error(e);
      addNotification?.("Не удалось удалить договор.", "error");
    }
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
    // setEditShowAddTarif(true);
  };

  const openDeleteComponentCategory = (category, tarif) => {
    setShowDelete(true);
    setDeleteIndex({
      type: "deleteCategory",
      data: {
        category,
        tarif,
      },
    });
  };

  // Текущая страница из URL (0-based)
  const urlPage = useMemo(() => {
    const p = Number(new URLSearchParams(location.search).get("page") || "1");
    return Math.max(0, p - 1);
  }, [location.search]);

  // Синхронизируем внутренний стейт пагинации со значением из URL
  // useEffect(() => {
  //   setPageInfo((prev) =>
  //     prev.skip === urlPage ? prev : { ...prev, skip: urlPage }
  //   );
  // }, [urlPage]);

  const handlePageClick = (event) => {
    const selectedPage = event.selected;
    setPageInfo((prev) => ({ ...prev, skip: selectedPage * 50 }));
    navigate(`?page=${selectedPage + 1}`);
  };

  const validCurrentPage = urlPage < totalPages ? urlPage : 0;

  return (
    <div className={classes.tariffsWrapper}>
      <Header>Реестр договоров</Header>
      <div
        className={classes.segmented}
        role="tablist"
        aria-label="Просмотр разделов"
      >
        {[
          { key: "airlines", label: "Авиакомпании" },
          { key: "hotels", label: "Гостиницы" },
          { key: "transfer", label: "Трансфер" },
        ].map((t, i) => (
          <button
            key={t.key}
            type="button"
            id={`tab-${t.key}`}
            className={`${classes.segment} ${activeTab === t.key ? classes.segmentActive : ""
              }`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={classes.section_searchAndFilter}>

        <DateRangeModalSelector
          width={"170px"}
          initialRange={dateRange}
          onChange={(start, end) =>
            setDateRange({ startDate: start, endDate: end })
          }
        />

        {activeTab === "airlines" && (
          <>
            <MUIAutocomplete
              dropdownWidth={"170px"}
              label={"Авиакомпания"}
              hideLabelOnFocus={false}
              options={[
                "Все авиакомпании",
                ...airlines.map((airline) => airline.name),
              ]}
              value={selectedAirline ? selectedAirline.name : ""}
              onChange={(event, newValue) => {
                if (newValue === "Все авиакомпании" || !newValue) {
                  setSelectedAirline(null);
                } else {
                  const selectedOption = airlines.find(
                    (airline) => airline.name === newValue
                  );
                  setSelectedAirline(selectedOption);
                }
              }}
            />
            <MUIAutocomplete
              dropdownWidth={"170px"}
              label={"Вид приложения"}
              hideLabelOnFocus={false}
              options={["Все", ...action]}
              value={selectedType ? selectedType : ""}
              onChange={(event, newValue) => {
                const selectedOption = action.find(
                  (airline) => airline === newValue
                );
                setSelectedType(selectedOption);
              }}
            />
          </>
        )}

        {activeTab === "hotels" && (
          <>
            <MUIAutocompleteColor
              dropdownWidth={"170px"}
              label={"Гостиница"}
              hideLabelOnFocus={false}
              options={[
                {
                  id: null,
                  name: "Все гостиницы",
                  images: "",
                  information: "",
                },
                ...hotels,
              ]}
              // getOptionLabel={(option) =>
              //   option
              //     ? `${option.name}, город: ${option?.information?.city}`.trim()
              //     : ""
              // }
              getOptionLabel={(option) => option?.name ?? ""}
              renderOption={(optionProps, option) => {
                const isAll = option.id === null;

                if (isAll) {
                  return (
                    <li {...optionProps} key={"all-hotels"}>
                      <span style={{ color: "black" }}>{option.name}</span>
                    </li>
                  );
                }
                const cityPart = `, город: ${option?.information?.city}`;
                const labelText = `${option.name}${cityPart}`.trim();
                const words = labelText.split(" ");

                return (
                  <li {...optionProps} key={option.id}>
                    {words.map((word, index) => (
                      <span
                        key={index}
                        style={{
                          color: index === 0 ? "black" : "gray",
                          marginRight: "4px",
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </li>
                );
              }}
              value={selectedHotel ? selectedHotel : ""}
              onChange={(event, newValue) => {
                if (newValue === "Все гостиницы" || !newValue) {
                  setSelectedHotel(null);
                } else {
                  const nextHotel = hotels.find((item) => item === newValue);
                  setSelectedHotel(nextHotel || null);
                }
              }}
            />

            <MUIAutocompleteColor
              dropdownWidth={"170px"}
              label={"Город"}
              hideLabelOnFocus={false}
              options={[
                {
                  id: null,
                  city: "Все города",
                  region: null,
                },
                ...cities,
              ]}
              // getOptionLabel={(option) => {
              //   if (!option) return "";
              //   const cityPart =
              //     option.city && option.city !== option.region
              //       ? `, регион: ${option.region}`
              //       : "";
              //   return `${option.city}${cityPart}`.trim();
              // }}
              getOptionLabel={(option) => option?.city ?? ""}
              renderOption={(optionProps, option) => {
                const isAll = option.id === null;

                if (isAll) {
                  return (
                    <li {...optionProps} key={option.id ?? "all-hotels"}>
                      <span style={{ color: "black" }}>{option.city}</span>
                    </li>
                  );
                }

                const cityPart =
                  option.city && option.city !== option.name
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
              value={selectedCity ? selectedCity : ""}
              onChange={(e, newValue) => {
                if (newValue === "Все города" || !newValue) {
                  setSelectedCity(null);
                } else {
                  const nextHotel = cities.find((item) => item === newValue);
                  setSelectedCity(nextHotel);
                }
              }}
            />
          </>
        )}

        {activeTab === "transfer" && (
          <>
            <MUIAutocomplete
              dropdownWidth={"170px"}
              label={"Организация"}
              hideLabelOnFocus={false}
              options={["Все организации", ...orgs.map((org) => org.name)]}
              value={selectedOrganization ? selectedOrganization.name : ""}
              onChange={(event, newValue) => {
                if (newValue === "Все организации" || !newValue) {
                  setSelectedOrganization(null);
                } else {
                  const selectedOption = orgs.find(
                    (org) => org.name === newValue
                  );
                  setSelectedOrganization(selectedOption);
                }
              }}
            />

            <MUIAutocompleteColor
              dropdownWidth={"170px"}
              label={"Город"}
              hideLabelOnFocus={false}
              options={[
                {
                  id: null,
                  city: "Все города",
                  region: null,
                },
                ...cities,
              ]}
              // getOptionLabel={(option) => {
              //   if (!option) return "";
              //   const cityPart =
              //     option.city && option.city !== option.region
              //       ? `, регион: ${option.region}`
              //       : "";
              //   return `${option.city}${cityPart}`.trim();
              // }}
              getOptionLabel={(option) => option?.city ?? ""}
              renderOption={(optionProps, option) => {
                const isAll = option.id === null;

                if (isAll) {
                  return (
                    <li {...optionProps} key={option.id ?? "all-hotels"}>
                      <span style={{ color: "black" }}>{option.city}</span>
                    </li>
                  );
                }

                const cityPart =
                  option.city && option.city !== option.name
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
              value={selectedCity ? selectedCity : ""}
              onChange={(e, newValue) => {
                if (newValue === "Все города" || !newValue) {
                  setSelectedCity(null);
                } else {
                  const nextHotel = cities.find((item) => item === newValue);
                  setSelectedCity(nextHotel);
                }
              }}
            />
          </>
        )}

        <MUIAutocomplete
          dropdownWidth={"170px"}
          label={"ГК Карс"}
          hideLabelOnFocus={false}
          options={["Все компании", ...companies?.map((item) => item.name)]}
          value={selectedCompany ? selectedCompany?.name : ""}
          onChange={(event, newValue) => {
            if (newValue === "Все компании" || !newValue) {
              setSelectedCompany(null);
            } else {
              const selectedCompany = companies.find(
                (item) => item.name === newValue
              );
              setSelectedCompany(selectedCompany);
            }
          }}
        />

        <MUITextField
          className={classes.mainSearch}
          label={"Поиск по договорам"}
          value={searchTarif}
          onChange={handleSearchTarif}
        />

        {canCreate && (
          <Filter
            toggleSidebar={toggleTarifsCategory}
            handleChange={""}
            buttonTitle={"Создать договор"}
          />
        )}
      </div>

      {loading && <MUILoader fullHeight={"70vh"} />}
      {error && <p>Error: {error.message}</p>}

      {!loading && !error && data && (
        <>
          <InfoTableAllDataTarifs
            pageInfo={pageInfo}
            activeTab={activeTab}
            canEdit={canEdit}
            toggleRequestSidebar={toggleEditTarifs}
            toggleEditTarifsCategory={toggleEditTarifsCategory}
            requests={addTarif}
            openDeleteComponent={openDeleteComponent}
            openDeleteComponentCategory={openDeleteComponentCategory}
            openDeleteContract={openDeleteContract}
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

      {/* <CreateRequestTarif id={id} show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} /> */}
      {activeTab === "airlines" ? (
        <>
          <CreateRequestContract
            user={user}
            id={id}
            airlinesData={airlinesData}
            companiesData={companiesData}
            show={showAddTarifCategory}
            onClose={toggleTarifsCategory}
            addTarif={addTarif}
            setAddTarif={setAddTarif}
            addNotification={addNotification}
          />
          <EditRequestAirlineContract
            user={user}
            id={id}
            canEdit={canEdit}
            activeFilterTab={activeTab}
            setAddTarif={setAddTarif}
            show={showEditAddTarif}
            onClose={() => setEditShowAddTarif(false)}
            addTarif={addTarif}
            tarif={selectedTarif}
            addNotification={addNotification}
            onRequestDelete={
              canEdit
                ? () => {
                    const contract = addTarif.find((x) => x.id === selectedTarif);
                    if (contract) openDeleteContractFromMenu(contract);
                  }
                : undefined
            }
          />
        </>
      ) : null}

      {activeTab === "hotels" || activeTab === "transfer" ? (
        <>
          <CreateRequestHotelContract
            user={user}
            id={id}
            activeFilterTab={activeTab}
            companiesData={companiesData}
            hotelsData={hotelsData}
            orgsData={orgsData}
            citiesData={citiesData}
            show={showAddTarifCategory}
            onClose={toggleTarifsCategory}
            addTarif={addTarif}
            setAddTarif={setAddTarif}
            addNotification={addNotification}
          />

          <EditRequestHotelContract
            user={user}
            id={id}
            canEdit={canEdit}
            activeFilterTab={activeTab}
            companiesData={companiesData}
            hotelsData={hotelsData}
            orgsData={orgsData}
            citiesData={citiesData}
            setAddTarif={setAddTarif}
            show={showEditAddTarif}
            onClose={() => setEditShowAddTarif(false)}
            addTarif={addTarif}
            tarif={selectedTarif}
            addNotification={addNotification}
            onRequestDelete={
              canEdit
                ? () => {
                    const contract = addTarif.find((x) => x.id === selectedTarif);
                    if (contract) openDeleteContractFromMenu(contract);
                  }
                : undefined
            }
          />
        </>
      ) : null}

      {showDelete && (
        <DeleteComponent
          ref={deleteComponentRef}
          remove={() => {
            return deleteContract(deleteIndex.data.contract);
          }}
          close={closeDeleteComponent}
          title={`Вы действительно хотите удалить ${deleteIndex.type === "deleteTarif"
            ? "тариф"
            : deleteIndex.type === "deleteCategory"
              ? "категорию"
              : "договор"
            }?`}
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

export default RegisterOfContracts;
