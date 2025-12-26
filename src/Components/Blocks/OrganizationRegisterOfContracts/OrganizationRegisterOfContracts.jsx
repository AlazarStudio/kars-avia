import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./OrganizationRegisterOfContracts.module.css";
import Filter from "../Filter/Filter.jsx";

import {
  getCookie,
  GET_ORGANIZATION_CONTRACTS,
  SUBSCRIPTION_ORGANIZATION_CONTRACTS,
  DELETE_ORGANIZATION_CONTRACT,
  GET_ALL_COMPANIES,
  GET_CITIES,
  GET_ORGANIZATIONS,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";

import MUILoader from "../MUILoader/MUILoader.jsx";
import Notification from "../../Notification/Notification.jsx";
import { fullNotifyTime, notifyTime } from "../../../roles.js";
import MUITextField from "../MUITextField/MUITextField.jsx";
import Header from "../Header/Header.jsx";
import InfoTableAllDataTarifs from "../InfoTableAllDataTarifs/InfoTableAllDataTarifs.jsx";
import CreateRequestHotelContract from "../CreateRequestHotelContract/CreateRequestHotelContract.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useDebounce } from "../../../hooks/useDebounce.jsx";
import ReactPaginate from "react-paginate";
import EditRequestHotelContract from "../EditRequestHotelContract/EditRequestHotelContract.jsx";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import DateRangeModalSelector from "../DateRangeModalSelector/DateRangeModalSelector.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import { roles } from "../../../roles.js";

function OrganizationRegisterOfContracts({ children, id, user, ...props }) {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  const pageNumberRelay = new URLSearchParams(location.search).get("page");
  const currentPageRelay = pageNumberRelay ? parseInt(pageNumberRelay) - 1 : 0;

  const [searchTarif, setSearchTarif] = useState("");
  const debouncedSearch = useDebounce(searchTarif, 500);
  const [activeTab, setActiveTab] = useState("transfer"); // Для организаций используем "transfer"

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
  const [cities, setCities] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // Проверка прав доступа: только dispatcherAdmin и superAdmin могут редактировать
  const canEdit = user?.role === roles.dispatcerAdmin || user?.role === roles.superAdmin;

  const { loading, error, data, refetch } = useQuery(GET_ORGANIZATION_CONTRACTS, {
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
        organizationId: id,
        cityId: selectedCity?.id,
        search: debouncedSearch,
      },
    },
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
  });

  const { data: orgsData } = useQuery(GET_ORGANIZATIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: {
        all: true,
      },
    },
  });

  const [addTarif, setAddTarif] = useState([]);
  const [showAddTarifCategory, setShowAddTarifCategory] = useState(false);
  const [showEditAddTarif, setEditShowAddTarif] = useState(false);
  const [showEditAddTarifCategory, setEditShowAddTarifCategory] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const [deleteOrganizationContract] = useMutation(DELETE_ORGANIZATION_CONTRACT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  useEffect(() => {
    if (data && data.organizationContracts) {
      setAddTarif(data.organizationContracts.items);
      setTotalPages(data.organizationContracts.totalPages);
    }
  }, [data]);

  useEffect(() => {
    if (companiesData) {
      setCompanies(companiesData.getAllCompany);
    }
    if (citiesData) {
      setCities(citiesData.citys);
    }
  }, [companiesData, citiesData]);

  const { data: subscriptionData } = useSubscription(
    SUBSCRIPTION_ORGANIZATION_CONTRACTS,
    {
      onData: () => {
        refetch();
      },
    }
  );

  const handleSearchTarif = (e) => {
    setSearchTarif(e.target.value);
  };

  const deleteComponentRef = useRef();

  const toggleEditTarifs = (tarif) => {
    setSelectedTarif(tarif);
    setEditShowAddTarif(true);
  };

  const toggleEditTarifsCategory = (tarif) => {
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
        organizationId: id,
        cityId: selectedCity?.id,
        search: debouncedSearch,
      },
    }).catch(console.error);
  }, [debouncedSearch, dateRange, selectedCompany, selectedCity]);

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

  // NEW: открыть модал удаления договора
  const openDeleteContract = (contract) => {
    setShowDelete(true);
    setDeleteIndex({
      type: "deleteContract",
      data: { contract },
    });
    setEditShowAddTarif(false);
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

  // NEW: удалить договор организации
  const deleteContract = async (contract) => {
    try {
      await deleteOrganizationContract({
        variables: { deleteOrganizationContractId: contract.id },
      });
      // оптимистично выкидываем из списка + подстраховочно refetch
      setAddTarif((prev) => prev.filter((x) => x.id !== contract.id));
      await refetch();
      setShowDelete(false);
      addNotification?.("Договор удалён.", "success");
    } catch (e) {
      console.error(e);
      addNotification?.("Не удалось удалить договор.", "error");
    }
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
  };

  // Текущая страница из URL (0-based)
  const urlPage = useMemo(() => {
    const p = Number(new URLSearchParams(location.search).get("page") || "1");
    return Math.max(0, p - 1);
  }, [location.search]);

  const handlePageClick = (event) => {
    const selectedPage = event.selected;
    setPageInfo((prev) => ({ ...prev, skip: selectedPage * 50 }));
    navigate(`?page=${selectedPage + 1}`);
  };

  const validCurrentPage = urlPage < totalPages ? urlPage : 0;

  return (
    <div className={classes.tariffsWrapper}>
      <div className={classes.section_searchAndFilter}>
        <MUITextField
          className={classes.mainSearch}
          label={"Поиск по договорам"}
          value={searchTarif}
          onChange={handleSearchTarif}
        />

        <DateRangeModalSelector
          width={"170px"}
          initialRange={dateRange}
          onChange={(start, end) =>
            setDateRange({ startDate: start, endDate: end })
          }
        />

        <MUIAutocompleteColor
          dropdownWidth={"170px"}
          label={"Город"}
          options={[
            {
              id: null,
              city: "Все города",
              region: null,
            },
            ...cities,
          ]}
          getOptionLabel={(option) => option?.city ?? ""}
          renderOption={(optionProps, option) => {
            const isAll = option.id === null;

            if (isAll) {
              return (
                <li {...optionProps} key={option.id ?? "all-cities"}>
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
              const nextCity = cities.find((item) => item === newValue);
              setSelectedCity(nextCity);
            }
          }}
        />

        <MUIAutocomplete
          dropdownWidth={"170px"}
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
        {canEdit && (
          <Filter
            toggleSidebar={() => setShowAddTarifCategory(true)}
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
            activeTab={"transfer"}
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

      {canEdit && (
        <CreateRequestHotelContract
          user={user}
          id={id}
          activeFilterTab={"transfer"}
          companiesData={companiesData}
          orgsData={orgsData || []}
          citiesData={citiesData}
          show={showAddTarifCategory}
          onClose={() => setShowAddTarifCategory(false)}
          addTarif={addTarif}
          setAddTarif={setAddTarif}
          addNotification={addNotification}
        />
      )}
      <EditRequestHotelContract
        user={user}
        id={id}
        canEdit={canEdit}
        activeFilterTab={"transfer"}
        companiesData={companiesData}
        orgsData={orgsData || []}
        citiesData={citiesData}
        setAddTarif={setAddTarif}
        show={showEditAddTarif}
        onClose={() => setEditShowAddTarif(false)}
        addTarif={addTarif}
        tarif={selectedTarif}
        addNotification={addNotification}
      />

      {canEdit && showDelete && (
        <DeleteComponent
          ref={deleteComponentRef}
          remove={() => {
            return deleteContract(deleteIndex.data.contract);
          }}
          close={closeDeleteComponent}
          title={`Вы действительно хотите удалить ${deleteIndex.type === "deleteTarif" ? "тариф" : deleteIndex.type === "deleteCategory" ? "категорию" : "договор"}?`}
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

export default OrganizationRegisterOfContracts;

