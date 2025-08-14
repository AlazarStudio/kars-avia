import React, { useEffect, useRef, useState } from "react";
import classes from "./RegisterOfContracts.module.css";
import Filter from "../Filter/Filter.jsx";

import {
  getCookie,
  GET_AIRLINE_TARIFS,
  DELETE_AIRLINE_CATEGORY,
  DELETE_AIRLINE_TARIFF,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_ALL_TARIFFS,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";

import MUILoader from "../MUILoader/MUILoader.jsx";
import Notification from "../../Notification/Notification.jsx";
import { fullNotifyTime, notifyTime } from "../../../roles.js";
import InfoTableAirlineDataTarifs from "../InfoTableAirlineDataTarifs/InfoTableAirlineDataTarifs.jsx";
import CreateRequestAirlineTarifCategory from "../CreateRequestAirlineTarifCategory/CreateRequestAirlineTarifCategory.jsx";
import EditRequestAirlineTarifCategory from "../EditRequestAirlineTarifCategory/EditRequestAirlineTarifCategory.jsx";
import MUITextField from "../MUITextField/MUITextField.jsx";
import Header from "../Header/Header.jsx";
import InfoTableAllDataTarifs from "../InfoTableAllDataTarifs/InfoTableAllDataTarifs.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";

function RegisterOfContracts({ children, id, user, ...props }) {
  const token = getCookie("token");

  const { loading, error, data, refetch } = useQuery(GET_ALL_TARIFFS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    // variables: { airlineId: "67af473ff18c7be5412e57fb" },
  });

  const [addTarif, setAddTarif] = useState([]);
  // const [mealPrices, setMealPrices] = useState({
  //   breakfast: 0,
  //   lunch: 0,
  //   dinner: 0,
  // });
  const [showAddTarif, setShowAddTarif] = useState(false);
  const [showAddTarifCategory, setShowAddTarifCategory] = useState(false);
  const [showEditAddTarif, setEditShowAddTarif] = useState(false);
  const [showEditAddTarifCategory, setEditShowAddTarifCategory] =
    useState(false);
  const [showEditMealPrices, setShowEditMealPrices] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [searchTarif, setSearchTarif] = useState("");
  const [activeTab, setActiveTab] = useState("contracts"); // "contracts" | "registers"
  const [typeFilter, setTypeFilter] = useState("Моя компания");

  const [selectedContract, setSelectedContract] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const [deleteHotelCategory] = useMutation(DELETE_AIRLINE_CATEGORY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });
  const [deleteHotelTarif] = useMutation(DELETE_AIRLINE_TARIFF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });

  useEffect(() => {
    if (data) {
      setAddTarif(data.getAllPriceCategory);
    }
  }, [data]);

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

  const handleEditTarif = (updatedTarif) => {
    setAddTarif(updatedTarif);
    setEditShowAddTarif(false);
    setSelectedTarif(null);
  };

  const handleEditTarifCategory = (updatedCategory) => {
    const { tarif: currentTarif, category: currentCategory } =
      selectedTarif.data;
    const newTarifName = updatedCategory.tarifName;

    let updatedTarifs = addTarif.map((tarif) => {
      if (tarif.tarifName === currentTarif && currentTarif === newTarifName) {
        const updatedCategories = tarif.categories.map((category) => {
          if (
            category.type === currentCategory.type &&
            category.price === currentCategory.price &&
            category.price_airline === currentCategory.price_airline
          ) {
            return { ...updatedCategory.categories };
          }
          return { ...category };
        });
        return {
          ...tarif,
          categories: [...updatedCategories],
        };
      }

      if (tarif.tarifName === currentTarif) {
        const updatedCategories = tarif.categories.filter(
          (category) =>
            !(
              category.type === currentCategory.type &&
              category.price === currentCategory.price &&
              category.price_airline === currentCategory.price_airline
            )
        );
        return {
          ...tarif,
          categories: [...updatedCategories],
        };
      }
      return { ...tarif };
    });

    if (currentTarif !== newTarifName) {
      let newTarifFound = false;
      updatedTarifs = updatedTarifs.map((tarif) => {
        if (tarif.tarifName === newTarifName) {
          newTarifFound = true;
          return {
            ...tarif,
            categories: [
              ...tarif.categories,
              { ...updatedCategory.categories },
            ],
          };
        }
        return { ...tarif };
      });

      if (!newTarifFound) {
        const newTarif = {
          tarifName: newTarifName,
          categories: [{ ...updatedCategory.categories }],
        };
        updatedTarifs = [...updatedTarifs, newTarif];
      }
    }

    setAddTarif(updatedTarifs);
    setEditShowAddTarifCategory(false);
    setSelectedTarif(null);
  };

  const deleteTarif = async (index, tarifID) => {
    let response_update_tarif = await deleteHotelTarif({
      variables: {
        deleteTariffId: tarifID,
      },
    });

    if (response_update_tarif) {
      setAddTarif(addTarif.filter((_, i) => i !== index));
      setShowDelete(false);
      setEditShowAddTarif(false);
    }
  };

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

  const deleteTarifCategory = async (category, tarif) => {
    let response_update_category = await deleteHotelCategory({
      variables: {
        deleteCategoryId: category.id,
      },
    });

    if (response_update_category) {
      const updatedTarifs = addTarif.map((t) => {
        if (t.id == tarif.id) {
          const updatedCategories = t.category.filter(
            (cat) => cat.id !== category.id
          );
          return {
            name: tarif.name,
            category: updatedCategories,
          };
        }
        return t;
      });

      setAddTarif(updatedTarifs);
      setShowDelete(false);
      setEditShowAddTarif(false);
    }
  };

  const handleEditMealPrices = (updatedPrices) => {
    setMealPrices(updatedPrices);
    setShowEditMealPrices(false);
  };

  const toggleEditMealPrices = () => {
    setShowEditMealPrices(!showEditMealPrices);
  };

  const filteredRequestsTarif = addTarif?.filter((request) => {
    return (
      request.name.toLowerCase().includes(searchTarif.toLowerCase()) ||
      String(request?.mealPrice?.breakfast)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request?.mealPrice?.dinner)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request?.mealPrice?.lunch)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      request.airports.some((i) =>
        i.airport.name.toLowerCase().includes(searchTarif.toLowerCase())
      ) ||
      request.airports.some((i) =>
        i.airport.code.toLowerCase().includes(searchTarif.toLowerCase())
      ) ||
      request.airports.some((i) =>
        i.airport.city.toLowerCase().includes(searchTarif.toLowerCase())
      ) ||
      String(request.prices.priceApartment)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request.prices.priceStudio)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request.prices.priceLuxe)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request.prices.priceOneCategory)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request.prices.priceTwoCategory)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request.prices.priceThreeCategory)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request.prices.priceFourCategory)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request.prices.priceFiveCategory)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request.prices.priceSixCategory)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request.prices.priceSevenCategory)
        .toLowerCase()
        .includes(searchTarif.toLowerCase()) ||
      String(request.prices.priceEightCategory)
        .toLowerCase()
        .includes(searchTarif.toLowerCase())
    );
  });

  const filteredRequestsMealTarif = [
    { name: "Завтрак", price: 0 },
    { name: "Обед", price: 0 },
    { name: "Ужин", price: 0 },
  ];

  const onOpenContract = (contract) => setSelectedContract(contract);
  const onBackFromDetails = () => setSelectedContract(null);

  return (
    <div className={classes.tariffsWrapper}>
      <Header>Реестр договоров</Header>
      <div className={classes.section_searchAndFilter}>
        <div className={classes.segmented} role="tablist" aria-label="Просмотр">
          <button
            type="button"
            className={`${classes.segment} ${
              activeTab === "contracts" ? classes.segmentActive : ""
            }`}
            role="tab"
            aria-selected={activeTab === "contracts"}
            onClick={() => setActiveTab("contracts")}
          >
            Договоры
          </button>
          <button
            type="button"
            className={`${classes.segment} ${
              activeTab === "registers" ? classes.segmentActive : ""
            }`}
            role="tab"
            aria-selected={activeTab === "registers"}
            onClick={() => setActiveTab("registers")}
          >
            Реестры
          </button>
        </div>
        <MUITextField
          className={classes.mainSearch}
          label={"Поиск по договорам"}
          value={searchTarif}
          onChange={handleSearchTarif}
        />
        <MUIAutocomplete
          dropdownWidth={"170px"}
          // label={"Выберите пол"}
          options={["Все", "Авиакомпании", "Гостиницы", "Моя компания"]}
          value={typeFilter}
          onChange={(event, newValue) => setTypeFilter(newValue)}
        />

        <div className={classes.section_searchAndFilter_filter}>
          {/* <Filter
                        toggleSidebar={toggleTarifs}
                        handleChange={''}
                        buttonTitle={'Добавить тариф'}
                    /> */}
          <Filter
            toggleSidebar={toggleTarifsCategory}
            handleChange={""}
            buttonTitle={"Создать реестр"}
          />
        </div>
      </div>

      {loading && <MUILoader fullHeight={"70vh"} />}
      {error && <p>Error: {error.message}</p>}

      {!loading && !error && data && (
        <InfoTableAllDataTarifs
          toggleRequestSidebar={toggleEditTarifs}
          toggleEditTarifsCategory={toggleEditTarifsCategory}
          toggleEditMealPrices={toggleEditMealPrices}
          requests={filteredRequestsTarif}
          mealPrices={filteredRequestsMealTarif}
          openDeleteComponent={openDeleteComponent}
          openDeleteComponentCategory={openDeleteComponentCategory}
          user={user}
          selectedContract={selectedContract}
          onOpenContract={onOpenContract}
          onBack={onBackFromDetails}
        />
      )}

      {/* <CreateRequestTarif id={id} show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} /> */}
      <CreateRequestAirlineTarifCategory
        user={user}
        id={id}
        show={showAddTarifCategory}
        onClose={toggleTarifsCategory}
        addTarif={addTarif}
        setAddTarif={setAddTarif}
        addNotification={addNotification}
      />

      <EditRequestAirlineTarifCategory
        user={user}
        id={id}
        setAddTarif={setAddTarif}
        show={showEditAddTarifCategory}
        onClose={() => setEditShowAddTarifCategory(false)}
        addTarif={addTarif}
        tarif={selectedTarif}
        onSubmit={handleEditTarifCategory}
        addNotification={addNotification}
      />

      {/* {showDelete && (
                <DeleteComponent
                    ref={deleteComponentRef}
                    remove={() => deleteIndex.type == "deleteTarif" ? deleteTarif(deleteIndex.data.index, deleteIndex.data.tarifID) : deleteTarifCategory(deleteIndex.data.category, deleteIndex.data.tarif)}
                    close={closeDeleteComponent}
                    title={`Вы действительно хотите удалить ${deleteIndex.type == "deleteTarif" ? 'тариф' : 'категорию'}?`}
                />
            )} */}
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
