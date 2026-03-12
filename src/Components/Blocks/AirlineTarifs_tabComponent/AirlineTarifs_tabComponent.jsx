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
import Notification from "../../Notification/Notification.jsx";
import { fullNotifyTime, notifyTime } from "../../../roles.js";
import InfoTableAirlineDataTarifs from "../InfoTableAirlineDataTarifs/InfoTableAirlineDataTarifs.jsx";
import CreateRequestAirlineTarifCategory from "../CreateRequestAirlineTarifCategory/CreateRequestAirlineTarifCategory.jsx";
import EditRequestAirlineTarifCategory from "../EditRequestAirlineTarifCategory/EditRequestAirlineTarifCategory.jsx";
import MUITextField from "../MUITextField/MUITextField.jsx";
import CreateRequestAllTarifCategory from "../CreateRequestAirlineTarifCategory copy/CreateRequestAllTarifCategory.jsx";
import EditRequestAllTarifCategory from "../EditRequestAllTarifCategory/EditRequestAllTarifCategory.jsx";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";

function AirlineTarifs_tabComponent({ children, id, user, ...props }) {
  const token = getCookie("token");

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
        addNotification("Договор удалён.", "success");
        refetch();
      } else {
        addNotification("Не удалось удалить договор.", "error");
      }
    } catch (err) {
      console.error(err);
      addNotification(err?.message || "Не удалось удалить договор.", "error");
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
          onDeleteTarifsCategory={openDeleteContractConfirm}
          requests={filteredRequestsTarif}
          openDeleteComponent={openDeleteComponent}
          openDeleteComponentCategory={openDeleteComponentCategory}
          toggleTarifs={toggleTarifs}
          // toggleRequestSidebar={toggleEditTarifs}
          // toggleEditMealPrices={toggleEditMealPrices}
          // mealPrices={filteredRequestsMealTarif}
          // dataSubscriptionUpd={dataSubscriptionUpd}
          // dataSubscriptionAirUpd={dataSubscriptionAirUpd}
          // refetch={refetch}
          // selectedContract={selectedContract}
          // onOpenContract={onOpenContract}
          // onBack={onBackFromDetails}
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
        addNotification={addNotification}
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
        addNotification={addNotification}
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
        // onSubmit={handleEditTarifCategory}
        addNotification={addNotification}
        // refetchAllCategories={refetch}
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

export default AirlineTarifs_tabComponent;

// import React, { useEffect, useRef, useState } from "react";
// import classes from "./AirlineTarifs_tabComponent.module.css";
// import CreateRequestTarif from "../CreateRequestTarif/CreateRequestTarif.jsx";
// import CreateRequestTarifCategory from "../CreateRequestTarifCategory/CreateRequestTarifCategory.jsx";
// import InfoTableDataTarifs from "../InfoTableDataTarifs/InfoTableDataTarifs.jsx";
// import EditRequestTarif from "../EditRequestTarif/EditRequestTarif.jsx";
// import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
// import Filter from "../Filter/Filter.jsx";

// import { requestsTarifs } from "../../../requests.js";

// import {
//   getCookie,
//   GET_AIRLINE_TARIFS,
//   GET_AIRLINE_MEAL_PRICE,
//   DELETE_AIRLINE_CATEGORY,
//   DELETE_AIRLINE_TARIFF,
// } from "../../../../graphQL_requests.js";
// import { useMutation, useQuery } from "@apollo/client";

// import EditRequestTarifCategory from "../EditRequestTarifCategory/EditRequestTarifCategory.jsx";
// import EditRequestMealTarif from "../EditRequestMealTarif/EditRequestMealTarif.jsx";
// import MUILoader from "../MUILoader/MUILoader.jsx";
// import Notification from "../../Notification/Notification.jsx";
// import { fullNotifyTime, notifyTime } from "../../../roles.js";
// import InfoTableAirlineDataTarifs from "../InfoTableAirlineDataTarifs/InfoTableAirlineDataTarifs.jsx";
// import CreateRequestAirlineTarifCategory from "../CreateRequestAirlineTarifCategory/CreateRequestAirlineTarifCategory.jsx";

// function AirlineTarifs_tabComponent({ children, id, user, ...props }) {
//   const token = getCookie("token");

//   const { loading, error, data } = useQuery(GET_AIRLINE_TARIFS, {
//     variables: { airlineId: id },
//   });

//   const {
//     loading: mealPriceLoading,
//     error: mealPriceError,
//     data: mealPriceData,
//   } = useQuery(GET_AIRLINE_MEAL_PRICE, {
//     variables: { airlineId: id },
//   });

//   const [addTarif, setAddTarif] = useState([]);
//   const [mealPrices, setMealPrices] = useState({
//     breakfast: 0,
//     lunch: 0,
//     dinner: 0,
//   });
//   const [showAddTarif, setShowAddTarif] = useState(false);
//   const [showAddTarifCategory, setShowAddTarifCategory] = useState(false);
//   const [showEditAddTarif, setEditShowAddTarif] = useState(false);
//   const [showEditAddTarifCategory, setEditShowAddTarifCategory] =
//     useState(false);
//   const [showEditMealPrices, setShowEditMealPrices] = useState(false);
//   const [selectedTarif, setSelectedTarif] = useState(null);
//   const [showDelete, setShowDelete] = useState(false);
//   const [deleteIndex, setDeleteIndex] = useState(null);
//   const [searchTarif, setSearchTarif] = useState("");

//   const [notifications, setNotifications] = useState([]);

//   const addNotification = (text, status) => {
//     const id = Date.now(); // Уникальный ID
//     setNotifications((prev) => [...prev, { id, text, status }]);

//     setTimeout(() => {
//       setNotifications((prev) => prev.filter((n) => n.id !== id));
//     }, fullNotifyTime);
//   };

//   const [deleteHotelCategory] = useMutation(DELETE_AIRLINE_CATEGORY, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         // 'Apollo-Require-Preflight': 'true',
//       },
//     },
//   });
//   const [deleteHotelTarif] = useMutation(DELETE_AIRLINE_TARIFF, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         // 'Apollo-Require-Preflight': 'true',
//       },
//     },
//   });

//   useEffect(() => {
//     if (data) {
//       setAddTarif([
//         {
//           name: "Одноместный",
//           price: data.airline.prices?.priceOneCategory,
//           type: 1,
//         },
//         {
//           name: "Двухместный",
//           price: data.airline.prices?.priceTwoCategory,
//           type: 2,
//         },
//         {
//           name: "Трехместный",
//           price: data.airline.prices?.priceThreeCategory,
//           type: 3,
//         },
//         {
//           name: "Четырехместный",
//           price: data.airline.prices?.priceFourCategory,
//           type: 4,
//         },
//         {
//           name: "Пятиместный",
//           price: data.airline.prices?.priceFiveCategory,
//           type: 5,
//         },
//         {
//           name: "Шестиместный",
//           price: data.airline.prices?.priceSixCategory,
//           type: 6,
//         },
//         {
//           name: "Семиместный",
//           price: data.airline.prices?.priceSevenCategory,
//           type: 7,
//         },
//         {
//           name: "Восьмиместный",
//           price: data.airline.prices?.priceEightCategory,
//           type: 8,
//         },
//         {
//           name: "Апартаменты",
//           price: data.airline.prices?.priceApartment,
//           type: 228,
//         },
//         {
//           name: "Студия",
//           price: data.airline.prices?.priceStudio,
//           type: 229,
//         },
//       ]);
//     }
//   }, [data]);

//   useEffect(() => {
//     if (mealPriceData) {
//       setMealPrices({
//         breakfast: mealPriceData.airline.mealPrice?.breakfast,
//         lunch: mealPriceData.airline.mealPrice?.lunch,
//         dinner: mealPriceData.airline.mealPrice?.dinner,
//       });
//     }
//   }, [mealPriceData]);

//   const handleSearchTarif = (e) => {
//     setSearchTarif(e.target.value);
//   };

//   const deleteComponentRef = useRef();

//   const toggleTarifs = () => {
//     setShowAddTarif(!showAddTarif);
//   };

//   const toggleTarifsCategory = () => {
//     setShowAddTarifCategory(!showAddTarifCategory);
//   };

//   const toggleEditTarifs = (tarif) => {
//     setSelectedTarif(tarif);
//     setEditShowAddTarif(true);
//   };

//   const toggleEditTarifsCategory = (category, tarif) => {
//     setSelectedTarif({
//       data: {
//         category,
//         tarif,
//       },
//     });
//     setEditShowAddTarifCategory(true);
//   };

//   const handleEditTarif = (updatedTarif) => {
//     setAddTarif(updatedTarif);
//     setEditShowAddTarif(false);
//     setSelectedTarif(null);
//   };

//   const handleEditTarifCategory = (updatedCategory) => {
//     const { tarif: currentTarif, category: currentCategory } =
//       selectedTarif.data;
//     const newTarifName = updatedCategory.tarifName;

//     let updatedTarifs = addTarif.map((tarif) => {
//       if (tarif.tarifName === currentTarif && currentTarif === newTarifName) {
//         const updatedCategories = tarif.categories.map((category) => {
//           if (
//             category.type === currentCategory.type &&
//             category.price === currentCategory.price &&
//             category.price_airline === currentCategory.price_airline
//           ) {
//             return { ...updatedCategory.categories };
//           }
//           return { ...category };
//         });
//         return {
//           ...tarif,
//           categories: [...updatedCategories],
//         };
//       }

//       if (tarif.tarifName === currentTarif) {
//         const updatedCategories = tarif.categories.filter(
//           (category) =>
//             !(
//               category.type === currentCategory.type &&
//               category.price === currentCategory.price &&
//               category.price_airline === currentCategory.price_airline
//             )
//         );
//         return {
//           ...tarif,
//           categories: [...updatedCategories],
//         };
//       }
//       return { ...tarif };
//     });

//     if (currentTarif !== newTarifName) {
//       let newTarifFound = false;
//       updatedTarifs = updatedTarifs.map((tarif) => {
//         if (tarif.tarifName === newTarifName) {
//           newTarifFound = true;
//           return {
//             ...tarif,
//             categories: [
//               ...tarif.categories,
//               { ...updatedCategory.categories },
//             ],
//           };
//         }
//         return { ...tarif };
//       });

//       if (!newTarifFound) {
//         const newTarif = {
//           tarifName: newTarifName,
//           categories: [{ ...updatedCategory.categories }],
//         };
//         updatedTarifs = [...updatedTarifs, newTarif];
//       }
//     }

//     setAddTarif(updatedTarifs);
//     setEditShowAddTarifCategory(false);
//     setSelectedTarif(null);
//   };

//   const deleteTarif = async (index, tarifID) => {
//     let response_update_tarif = await deleteHotelTarif({
//       variables: {
//         deleteTariffId: tarifID,
//       },
//     });

//     if (response_update_tarif) {
//       setAddTarif(addTarif.filter((_, i) => i !== index));
//       setShowDelete(false);
//       setEditShowAddTarif(false);
//     }
//   };

//   const openDeleteComponent = (index, tarifID) => {
//     setShowDelete(true);
//     setDeleteIndex({
//       type: "deleteTarif",
//       data: {
//         index,
//         tarifID,
//       },
//     });
//     setEditShowAddTarif(false);
//   };

//   const closeDeleteComponent = () => {
//     setShowDelete(false);
//     // setEditShowAddTarif(true);
//   };

//   const openDeleteComponentCategory = (category, tarif) => {
//     setShowDelete(true);
//     setDeleteIndex({
//       type: "deleteCategory",
//       data: {
//         category,
//         tarif,
//       },
//     });
//   };

//   const deleteTarifCategory = async (category, tarif) => {
//     let response_update_category = await deleteHotelCategory({
//       variables: {
//         deleteCategoryId: category.id,
//       },
//     });

//     if (response_update_category) {
//       const updatedTarifs = addTarif.map((t) => {
//         if (t.id == tarif.id) {
//           const updatedCategories = t.category.filter(
//             (cat) => cat.id !== category.id
//           );
//           return {
//             name: tarif.name,
//             category: updatedCategories,
//           };
//         }
//         return t;
//       });

//       setAddTarif(updatedTarifs);
//       setShowDelete(false);
//       setEditShowAddTarif(false);
//     }
//   };

//   const handleEditMealPrices = (updatedPrices) => {
//     setMealPrices(updatedPrices);
//     setShowEditMealPrices(false);
//   };

//   const toggleEditMealPrices = () => {
//     setShowEditMealPrices(!showEditMealPrices);
//   };

//   const filteredRequestsTarif = addTarif.filter((request) => {
//     return (
//       request.name.toLowerCase().includes(searchTarif.toLowerCase()) ||
//       String(request.price).toLowerCase().includes(searchTarif.toLowerCase())
//     );
//   });

//   const filteredRequestsMealTarif = [
//     { name: "Завтрак", price: mealPrices.breakfast },
//     { name: "Обед", price: mealPrices.lunch },
//     { name: "Ужин", price: mealPrices.dinner },
//   ];

//   return (
//     <>
//       {/* <div className={classes.section_searchAndFilter}>
//                 <input
//                     type="text"
//                     placeholder="Поиск по тарифам"
//                     style={{ 'width': '500px' }}
//                     value={searchTarif}
//                     onChange={handleSearchTarif}
//                 />
//                 <div className={classes.section_searchAndFilter_filter}>
//                     <Filter
//                         toggleSidebar={toggleTarifs}
//                         handleChange={''}
//                         buttonTitle={'Добавить тариф'}
//                     />
//                     <Filter
//                         toggleSidebar={toggleTarifsCategory}
//                         handleChange={''}
//                         buttonTitle={'Добавить категорию'}
//                     />
//                 </div>
//             </div> */}

//       {loading && <MUILoader fullHeight={"70vh"} />}
//       {error && <p>Error: {error.message}</p>}

//       {!loading && !error && data && (
//         <InfoTableAirlineDataTarifs
//           toggleRequestSidebar={toggleEditTarifs}
//           toggleEditTarifsCategory={toggleEditTarifsCategory}
//           toggleEditMealPrices={toggleEditMealPrices}
//           requests={filteredRequestsTarif}
//           mealPrices={filteredRequestsMealTarif}
//           openDeleteComponent={openDeleteComponent}
//           openDeleteComponentCategory={openDeleteComponentCategory}
//           user={user}
//         />
//       )}

//       {/* <CreateRequestTarif id={id} show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} /> */}
//       <CreateRequestAirlineTarifCategory user={user} id={id} show={showAddTarifCategory} onClose={toggleTarifsCategory} addTarif={addTarif} setAddTarif={setAddTarif} />

//       <EditRequestTarif
//         id={id}
//         existingPrices={data?.airline?.prices}
//         setAddTarif={setAddTarif}
//         show={showEditAddTarif}
//         onClose={() => setEditShowAddTarif(false)}
//         tarif={selectedTarif}
//         onSubmit={handleEditTarif}
//         isHotel={false}
//         addNotification={addNotification}
//       />
//       <EditRequestMealTarif
//         id={id}
//         show={showEditMealPrices}
//         mealPrices={mealPrices}
//         onClose={toggleEditMealPrices}
//         onSubmit={handleEditMealPrices}
//         isHotel={false}
//         addNotification={addNotification}
//       />
//       {/* <EditRequestTarifCategory user={user} id={id} setAddTarif={setAddTarif} show={showEditAddTarifCategory} onClose={() => setEditShowAddTarifCategory(false)} addTarif={addTarif} tarif={selectedTarif} onSubmit={handleEditTarifCategory} /> */}

//       {/* {showDelete && (
//                 <DeleteComponent
//                     ref={deleteComponentRef}
//                     remove={() => deleteIndex.type == "deleteTarif" ? deleteTarif(deleteIndex.data.index, deleteIndex.data.tarifID) : deleteTarifCategory(deleteIndex.data.category, deleteIndex.data.tarif)}
//                     close={closeDeleteComponent}
//                     title={`Вы действительно хотите удалить ${deleteIndex.type == "deleteTarif" ? 'тариф' : 'категорию'}?`}
//                 />
//             )} */}
//       {notifications.map((n, index) => (
//         <Notification
//           key={n.id}
//           text={n.text}
//           status={n.status}
//           index={index}
//           time={notifyTime}
//           onClose={() => {
//             setNotifications((prev) =>
//               prev.filter((notif) => notif.id !== n.id)
//             );
//           }}
//         />
//       ))}
//     </>
//   );
// }

// export default AirlineTarifs_tabComponent;
