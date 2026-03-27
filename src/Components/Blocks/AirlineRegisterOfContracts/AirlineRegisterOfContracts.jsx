import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./AirlineRegisterOfContracts.module.css";
import Filter from "../Filter/Filter.jsx";

import {
  getCookie,
  GET_AIRLINE_CONTRACTS,
  SUBSCRIPTION_AIRLINE_CONTRACTS,
  DELETE_AIRLINE_CONTRACT,
  DELETE_HOTEL_CONTRACT,
  GET_AIRLINES_RELAY,
  GET_ALL_COMPANIES,
  GET_HOTELS_RELAY,
  GET_CITIES,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";

import MUILoader from "../MUILoader/MUILoader.jsx";
import Notification from "../../Notification/Notification.jsx";
import { action, fullNotifyTime, notifyTime, roles } from "../../../roles.js";
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
import { isSuperAdmin, isDispatcherAdmin, hasAccessMenu } from "../../../utils/access";

function AirlineRegisterOfContracts({ children, id, user, accessMenu = {}, ...props }) {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  // console.log(user)

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
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const canCreate =
    isSuperAdmin(user) ||
    (isDispatcherAdmin(user) && hasAccessMenu(accessMenu, "contractCreate"));
  const canEdit =
    isSuperAdmin(user) ||
    (isDispatcherAdmin(user) && hasAccessMenu(accessMenu, "contractUpdate"));

  const { loading, error, data, refetch } = useQuery(GET_AIRLINE_CONTRACTS, {
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
        companyId: selectedCompany?.id,
        dateFrom: dateRange.startDate?.toISOString(),
        dateTo: dateRange.endDate?.toISOString(),
        applicationType: selectedType,
        airlineId: id,
        search: debouncedSearch,
      },
    },
  });
  // console.log(debouncedSearch);

  const { data: airlinesData } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !canCreate,
  });

  // const { data: hotelsData } = useQuery(GET_HOTELS_RELAY, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   },
  // });

  const { data: companiesData } = useQuery(GET_ALL_COMPANIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // const { data: citiesData } = useQuery(GET_CITIES, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   },
  // });

  const [addTarif, setAddTarif] = useState([]);
  // const [showAddTarif, setShowAddTarif] = useState(false);
  const [showAddTarifCategory, setShowAddTarifCategory] = useState(false);
  const [showEditAddTarif, setEditShowAddTarif] = useState(false);
  const [showEditAddTarifCategory, setEditShowAddTarifCategory] =
    useState(false);
  // const [showEditMealPrices, setShowEditMealPrices] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  // const [typeFilter, setTypeFilter] = useState("ГК Карс");

  // const [selectedContract, setSelectedContract] = useState(null);

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
  // const [deleteHotelContract] = useMutation(DELETE_HOTEL_CONTRACT, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   },
  // });

  useEffect(() => {
    if (data && data.airlineContracts) {
      setAddTarif(data.airlineContracts.items);
      setTotalPages(data.airlineContracts.totalPages);
    }
  }, [data]);

  useEffect(() => {
    if (companiesData) {
      setCompanies(companiesData.getAllCompany);
    }
  }, [companiesData]);

  const { data: subscriptionData } = useSubscription(
    SUBSCRIPTION_AIRLINE_CONTRACTS,
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

  const handleSearchTarif = (e) => {
    setSearchTarif(e.target.value);
  };

  // const deleteComponentRef = useRef();

  // const toggleTarifs = () => {
  //   setShowAddTarif(!showAddTarif);
  // };

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
        companyId: selectedCompany?.id,
        dateFrom: dateRange.startDate?.toISOString(),
        dateTo: dateRange.endDate?.toISOString(),
        applicationType: selectedType,
        airlineId: id,
        search: debouncedSearch,
      },
    }).catch(console.error);
  }, [debouncedSearch, dateRange, selectedCompany]);

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
      await deleteAirlineContract({
        variables: { deleteAirlineContractId: contract.id },
      });
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
      <div className={classes.section_searchAndFilter}>

        <DateRangeModalSelector
          width={"170px"}
          initialRange={dateRange}
          onChange={(start, end) =>
            setDateRange({ startDate: start, endDate: end })
          }
        />

        <MUIAutocomplete
          dropdownWidth={"170px"}
          hideLabelOnFocus={false}
          label={"Вид приложения"}
          options={["Все", ...action]}
          value={selectedType ? selectedType : ""}
          onChange={(event, newValue) => {
            const selectedOption = action.find(
              (airline) => airline === newValue
            );
            setSelectedType(selectedOption);
          }}
        />

        <MUIAutocomplete
          dropdownWidth={"170px"}
          hideLabelOnFocus={false}
          label={"ГК Карс"}
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
            id={id}
            user={user}
            pageInfo={pageInfo}
            activeTab={"airlines"}
            toggleRequestSidebar={toggleEditTarifs}
            toggleEditTarifsCategory={toggleEditTarifsCategory}
            requests={addTarif}
            openDeleteComponent={openDeleteComponent}
            openDeleteComponentCategory={openDeleteComponentCategory}
            openDeleteContract={openDeleteContract}
            canEdit={canEdit}
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


      {canCreate && (
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
      )}
      <EditRequestAirlineContract
        user={user}
        id={id}
        canEdit={canEdit}
        activeFilterTab={"airlines"}
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


      {showDelete && (
        <DeleteComponent
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

export default AirlineRegisterOfContracts;
