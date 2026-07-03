import React, { useEffect, useRef, useState } from "react";
import classes from "./AirlineTarifs_tabComponent.module.css";
import Filter from "../Filter/Filter.jsx";

import {
  getCookie,
  DELETE_AIRLINE_CATEGORY,
  DELETE_AIRLINE_TARIFF,
  DELETE_AIRLINE_PRICE,
  GET_ALL_TARIFFS,
  PRICE_CATEGORY_CHANGE_SUBSCRIPTION,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_AIRLINE_TARIFS,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";

import MUILoader from "../MUILoader/MUILoader.jsx";
import InfoTableAirlineDataTarifs from "../InfoTableAirlineDataTarifs/InfoTableAirlineDataTarifs.jsx";
import { useToast } from "../../../contexts/ToastContext";
import CreateRequestAirlineTarifCategory from "../CreateRequestAirlineTarifCategory/CreateRequestAirlineTarifCategory.jsx";
import EditRequestAirlineTarifCategory from "../EditRequestAirlineTarifCategory/EditRequestAirlineTarifCategory.jsx";
import MUITextField from "../MUITextField/MUITextField.jsx";
import CreateRequestAllTarifCategory from "../CreateRequestAirlineTarifCategory copy/CreateRequestAllTarifCategory.jsx";
import EditRequestAllTarifCategory from "../EditRequestAllTarifCategory/EditRequestAllTarifCategory.jsx";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";

function AirlineTarifs_tabComponent({ children, id, user, ...props }) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const { loading, error, data, refetch } = useQuery(GET_AIRLINE_TARIFS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { airlineId: id },
  });

  // const { loading, error, data, refetch } = useQuery(GET_ALL_TARIFFS, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   },
  //   variables: { filter: { airlineId: id } },
  // });

  // const {
  //   loading: mealPriceLoading,
  //   error: mealPriceError,
  //   data: mealPriceData,
  // } = useQuery(GET_AIRLINE_MEAL_PRICE, {
  //   variables: { airlineId: id },
  // });

  const { data: dataSubscriptionAirUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION,
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

  const { data: dataSubscriptionUpd } = useSubscription(
    PRICE_CATEGORY_CHANGE_SUBSCRIPTION,
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

  // console.log(data);

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
  const [deleteConfirmContract, setDeleteConfirmContract] = useState(null);

  const [selectedContract, setSelectedContract] = useState(null);

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

  const [deleteAirlinePrice] = useMutation(DELETE_AIRLINE_PRICE, {
    context: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  useEffect(() => {
    if (data) {
      setAddTarif(data.airline.prices);
    }
  }, [data]);

  // useEffect(() => {
  //   if (dataSubscriptionUpd) {
  //     // console.log(dataSubscriptionUpd);

  //     // setAddTarif(dataSubscriptionUpd.priceCategoryChanged);
  //     setSelectedContract(dataSubscriptionUpd.priceCategoryChanged);
  //   }
  // }, [dataSubscriptionUpd]);

  // useEffect(() => {
  //   if (mealPriceData) {
  //     setMealPrices({
  //       breakfast: mealPriceData.airline.mealPrice?.breakfast,
  //       lunch: mealPriceData.airline.mealPrice?.lunch,
  //       dinner: mealPriceData.airline.mealPrice?.dinner,
  //     });
  //   }
  // }, [mealPriceData]);

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

  const [openInEditMode, setOpenInEditMode] = useState(false);

  const toggleEditTarifs = (tarif) => {
    setSelectedTarif(tarif);
    setOpenInEditMode(true);
    setEditShowAddTarif(true);
  };

  const toggleViewTarifs = (tarif) => {
    setSelectedTarif(tarif);
    setOpenInEditMode(false);
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

  // const handleEditTarifCategory = (updatedCategory) => {
  //   const { tarif: currentTarif, category: currentCategory } =
  //     selectedTarif.data;
  //   const newTarifName = updatedCategory.tarifName;

  //   let updatedTarifs = addTarif.map((tarif) => {
  //     if (tarif.tarifName === currentTarif && currentTarif === newTarifName) {
  //       const updatedCategories = tarif.categories.map((category) => {
  //         if (
  //           category.type === currentCategory.type &&
  //           category.price === currentCategory.price &&
  //           category.price_airline === currentCategory.price_airline
  //         ) {
  //           return { ...updatedCategory.categories };
  //         }
  //         return { ...category };
  //       });
  //       return {
  //         ...tarif,
  //         categories: [...updatedCategories],
  //       };
  //     }

  //     if (tarif.tarifName === currentTarif) {
  //       const updatedCategories = tarif.categories.filter(
  //         (category) =>
  //           !(
  //             category.type === currentCategory.type &&
  //             category.price === currentCategory.price &&
  //             category.price_airline === currentCategory.price_airline
  //           )
  //       );
  //       return {
  //         ...tarif,
  //         categories: [...updatedCategories],
  //       };
  //     }
  //     return { ...tarif };
  //   });

  //   if (currentTarif !== newTarifName) {
  //     let newTarifFound = false;
  //     updatedTarifs = updatedTarifs.map((tarif) => {
  //       if (tarif.tarifName === newTarifName) {
  //         newTarifFound = true;
  //         return {
  //           ...tarif,
  //           categories: [
  //             ...tarif.categories,
  //             { ...updatedCategory.categories },
  //           ],
  //         };
  //       }
  //       return { ...tarif };
  //     });

  //     if (!newTarifFound) {
  //       const newTarif = {
  //         tarifName: newTarifName,
  //         categories: [{ ...updatedCategory.categories }],
  //       };
  //       updatedTarifs = [...updatedTarifs, newTarif];
  //     }
  //   }

  //   setAddTarif(updatedTarifs);
  //   setEditShowAddTarifCategory(false);
  //   setSelectedTarif(null);
  // };

  const deleteTarif = async (index, tarifID) => {
    try {
      let response_update_tarif = await deleteHotelTarif({
        variables: {
          deleteTariffId: tarifID,
        },
      });

      if (response_update_tarif) {
        setAddTarif(addTarif.filter((_, i) => i !== index));
        setShowDelete(false);
        setEditShowAddTarif(false);
        success("Договор удалён.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Не удалось удалить договор.");
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

  const openDeleteContractConfirm = (item) => {
    if (item?.id) setDeleteConfirmContract(item);
  };

  const handleConfirmDeleteContract = async () => {
    if (!deleteConfirmContract?.id) return;
    try {
      const res = await deleteAirlinePrice({
        variables: { id: deleteConfirmContract.id },
      });
      if (res?.data?.deleteAirlinePrice) {
        success("Договор удалён.");
        refetch();
      } else {
        notifyError("Не удалось удалить договор.");
      }
    } catch (err) {
      console.error(err);
      notifyError(err?.message || "Не удалось удалить договор.");
    } finally {
      setDeleteConfirmContract(null);
    }
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
    try {
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
        success("Категория удалена.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Не удалось удалить категорию.");
    }
  };

  // const handleEditMealPrices = (updatedPrices) => {
  //   setMealPrices(updatedPrices);
  //   setShowEditMealPrices(false);
  // };

  // const toggleEditMealPrices = () => {
  //   setShowEditMealPrices(!showEditMealPrices);
  // };

  const filteredRequestsTarif = addTarif?.filter((request) => {
    // console.log(request);

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

  // const filteredRequestsMealTarif = [
  //   { name: "Завтрак", price: 0 },
  //   { name: "Обед", price: 0 },
  //   { name: "Ужин", price: 0 },
  // ];

  // const onOpenContract = (contract) => setSelectedContract(contract);
  // const onBackFromDetails = () => setSelectedContract(null);

  return (
    <div className={classes.tariffsWrapper}>
      <div className={classes.section_searchAndFilter}>
        <MUITextField
          className={classes.mainSearch}
          label={"Поиск по договорам"}
          value={searchTarif}
          onChange={handleSearchTarif}
        />

        <div className={classes.section_searchAndFilter_filter}>
          {/* <Filter
                        toggleSidebar={toggleTarifs}
                        handleChange={''}
                        buttonTitle={'Добавить тариф'}
                    /> */}
          <Filter
            toggleSidebar={toggleTarifs}
            handleChange={""}
            buttonTitle={"Добавить договор"}
          />
        </div>
      </div>

      {loading && <MUILoader fullHeight={"70vh"} />}
      {error && <p>Error: {error.message}</p>}

      {!loading && !error && data && (
        <InfoTableAirlineDataTarifs
          user={user}
          toggleEditTarifsCategory={toggleEditTarifs}
          onRowClick={toggleViewTarifs}
          onDeleteTarifsCategory={openDeleteContractConfirm}
          requests={filteredRequestsTarif}
          openDeleteComponent={openDeleteComponent}
          openDeleteComponentCategory={openDeleteComponentCategory}
          toggleTarifs={toggleTarifs}
        />
      )}

      {/* <CreateRequestTarif id={id} show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} /> */}
      {/* <CreateRequestAllTarifCategory
        user={user}
        id={id}
        show={showAddTarifCategory}
        onClose={toggleTarifsCategory}
        addTarif={addTarif}
        setAddTarif={setAddTarif}
        // refetchAllCategories={refetch}
      /> */}

      <CreateRequestAirlineTarifCategory
        user={user}
        id={id}
        show={showAddTarif}
        onClose={toggleTarifs}
        addTarif={addTarif}
        selectedContract={selectedContract}
        setAddTarif={setAddTarif}
        // refetchAllCategories={refetch}
      />

      {/* <EditRequestTarif
        id={id}
        existingPrices={data?.airline?.prices}
        setAddTarif={setAddTarif}
        show={showEditAddTarif}
        onClose={() => setEditShowAddTarif(false)}
        tarif={selectedTarif}
        onSubmit={handleEditTarif}
        isHotel={false}
        addNotification={addNotification}
      /> */}
      {/* <EditRequestMealTarif
        id={id}
        show={showEditMealPrices}
        mealPrices={mealPrices}
        onClose={toggleEditMealPrices}
        onSubmit={handleEditMealPrices}
        isHotel={false}
        addNotification={addNotification}
      /> */}
      <EditRequestAirlineTarifCategory
        user={user}
        id={id}
        setAddTarif={setAddTarif}
        show={showEditAddTarif}
        onClose={() => setEditShowAddTarif(false)}
        addTarif={addTarif}
        selectedContract={selectedContract}
        tarif={selectedTarif}
        initialEditMode={openInEditMode}
        onDelete={() => {
          setEditShowAddTarif(false);
          openDeleteContractConfirm(selectedTarif);
        }}
      />

      {/* <EditRequestAllTarifCategory
        user={user}
        id={id}
        setAddTarif={setAddTarif}
        show={showEditAddTarifCategory}
        onClose={() => setEditShowAddTarifCategory(false)}
        addTarif={addTarif}
        tarif={selectedTarif}
        // onSubmit={handleEditTarifCategory}
        addNotification={addNotification}
        // refetchAllCategories={refetch}
      /> */}

      {deleteConfirmContract && (
        <DeleteComponent
          title="Вы действительно хотите удалить договор?"
          remove={handleConfirmDeleteContract}
          close={() => setDeleteConfirmContract(null)}
        />
      )}
    </div>
  );
}

export default AirlineTarifs_tabComponent;
