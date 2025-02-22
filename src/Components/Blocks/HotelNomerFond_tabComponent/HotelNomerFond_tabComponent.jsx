import React, { useEffect, useRef, useState } from "react";
import classes from "./HotelNomerFond_tabComponent.module.css";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import Filter from "../Filter/Filter";

import { requestsNomerFond, requestsTarifs } from "../../../requests";
import InfoTableDataNomerFond from "../InfoTableDataNomerFond/InfoTableDataNomerFond";
import CreateRequestNomerFond from "../CreateRequestNomerFond/CreateRequestNomerFond";
import CreateRequestCategoryNomer from "../CreateRequestCategoryNomer/CreateRequestCategoryNomer";
import EditRequestCategory from "../EditRequestCategory/EditRequestCategory";
import EditRequestNomerFond from "../EditRequestNomerFond/EditRequestNomerFond";

import {
  getCookie,
  GET_HOTEL_ROOMS,
  DELETE_HOTEL_ROOM,
  DELETE_HOTEL_CATEGORY,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  decodeJWT,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUITextField from "../MUITextField/MUITextField.jsx";
import Notification from "../../Notification/Notification.jsx";

function HotelNomerFond_tabComponent({ children, id, ...props }) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const { loading, error, data, refetch } = useQuery(GET_HOTEL_ROOMS, {
    variables: { hotelId: id },
  });
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_HOTELS_UPDATE_SUBSCRIPTION
  );

  const [addTarif, setAddTarif] = useState([]);
  const [showAddTarif, setShowAddTarif] = useState(false);
  const [showAddCategory, setshowAddCategory] = useState(false);

  const [showDelete, setShowDelete] = useState(false);

  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteNomer, setDeleteNomer] = useState(null);

  const [searchTarif, setSearchTarif] = useState("");
  const [selectQuery, setSelectQuery] = useState("");
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [showEditNomer, setShowEditNomer] = useState(false);
  const [selectedNomer, setSelectedNomer] = useState({});

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5300); // 5 секунд уведомление + 300 мс для анимации
  };

  const [deleteHotelRoom] = useMutation(DELETE_HOTEL_ROOM, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });
  const [deleteHotelCategory] = useMutation(DELETE_HOTEL_CATEGORY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });

  useEffect(() => {
    if (data) {
      const sortedTarifs = Object.values(
        data.hotel.rooms.reduce((acc, room) => {
          if (!acc[room.category]) {
            acc[room.category] = {
              name:
                room.category === "onePlace"
                  ? "Одноместный"
                  : room.category === "twoPlace"
                  ? "Двухместный"
                  : room.category === "threePlace"
                  ? "Трехместный"
                  : room.category === "fourPlace"
                  ? "Четырехместный"
                  : room.category === "fivePlace"
                  ? "Пятиместный"
                  : room.category === "sixPlace"
                  ? "Шестиместный"
                  : room.category === "sevenPlace"
                  ? "Семиместный"
                  : room.category === "eightPlace"
                  ? "Восьмиместный"
                  : "",
              origName: room.category,
              rooms: [],
            };
          }
          acc[room.category].rooms.push(room);
          return acc;
        }, {})
      );

      sortedTarifs.forEach((category) => {
        category.rooms.sort((a, b) => a.name.localeCompare(b.name));
      });

      setAddTarif(sortedTarifs);
    }

    if (dataSubscriptionUpd) refetch();
  }, [data, dataSubscriptionUpd, refetch]);

  const handleSearchTarif = (e) => {
    setSearchTarif(e.target.value);
  };

  const handleSelect = (e) => {
    setSelectQuery(e.target.value);
  };

  const deleteComponentRef = useRef();

  const toggleTarifs = () => {
    setShowAddTarif(!showAddTarif);
  };

  const toggleCategory = () => {
    setshowAddCategory(!showAddCategory);
  };

  const toggleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowEditCategory(true);
  };

  const handleEditCategory = (updatedCategory) => {
    const updatedTarifs = addTarif
      .map((tarif) =>
        tarif.name === selectedCategory.name
          ? { ...tarif, name: updatedCategory.type }
          : tarif
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    setAddTarif(updatedTarifs);
    setShowEditCategory(false);
    setSelectedCategory(null);
  };

  const deleteTarif = async (item) => {
    let response_update_category = await deleteHotelCategory({
      variables: {
        deleteCategoryId: item.item.id,
      },
    });
    if (response_update_category) {
      setAddTarif(addTarif.filter((_, i) => i !== item.index));
      setShowDelete(false);
      setShowEditCategory(false);
    }
  };

  const openDeleteNomerComponent = (nomer, category) => {
    setDeleteNomer({ nomer, category, type: "deleteRoom" });
    setShowDelete(true);
  };

  const deleteNomerFromCategory = async (roomInfo) => {
    let response_update_room = await deleteHotelRoom({
      variables: {
        deleteRoomId: roomInfo.nomer.id,
      },
    });

    if (response_update_room) {
      setAddTarif((prevTarifs) =>
        prevTarifs.map((tarif) => {
          if (tarif.name === deleteNomer.category) {
            const updatedNumbers = tarif.rooms.filter(
              (num) => num.name !== deleteNomer.nomer.name
            );
            return { ...tarif, rooms: updatedNumbers };
          }
          return tarif;
        })
      );
      setShowDelete(false);
      setDeleteNomer(null);
    }
  };

  const openDeleteComponent = (index, item) => {
    setShowDelete(true);
    setDeleteIndex({ index, item });
    setShowEditCategory(false);
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
    setShowEditCategory(false);
  };

  const toggleEditNomer = (nomer, category, reserve, active) => {
    setSelectedNomer({ nomer, category, reserve, active });
    setShowEditNomer(true);
  };

  const handleEditNomer = (updatedNomer, oldNomer, newCategory) => {
    setShowEditNomer(false);
    setSelectedNomer({});
  };

  const uniqueCategories =
    addTarif && addTarif.map((request) => `${request.origName}`);

  // Надо починить не работает
  // const filteredRequestsTarif = addTarif.filter(request => {
  //     const matchesCategory = selectQuery === '' || request.name.toLowerCase().includes(selectQuery.toLowerCase());
  //     const matchesSearch = searchTarif === '' || request.rooms.some(room => room.name.toLowerCase().includes(searchTarif.toLowerCase()));
  //     return matchesCategory && matchesSearch;
  // });

  // Рабочая версия
  const filteredRequestsTarif = addTarif
    .map((request) => {
      // Фильтруем комнаты внутри категории
      const filteredRooms = request.rooms.filter((room) =>
        room.name.toLowerCase().includes(searchTarif.toLowerCase())
      );

      // Если есть подходящие комнаты, возвращаем категорию с этими комнатами
      if (filteredRooms.length > 0) {
        return {
          ...request,
          rooms: filteredRooms, // Только подходящие комнаты
        };
      }

      // Если нет подходящих комнат, пропускаем категорию
      return null;
    })
    .filter((request) => request !== null); // Убираем пустые категории

  const [filter, setFilter] = useState("quote");

  return (
    <>
      {loading && <MUILoader fullHeight={"70vh"} />}
      {error && <p>Error: {error.message}</p>}

      {!loading && !error && addTarif && (
        <>
          <div className={classes.section_searchAndFilter}>
            {/* <input
                            type="text"
                            placeholder="Поиск по номеру"
                            style={{ 'width': '500px' }}
                            value={searchTarif}
                            onChange={handleSearchTarif}
                        /> */}
            <MUITextField
              label={"Поиск по номеру"}
              className={classes.mainSearch}
              value={searchTarif}
              onChange={handleSearchTarif}
            />
            <div className={classes.section_searchAndFilter_filter}>
              {/* <select onChange={handleSelect}>
                                <option value="">Показать все</option>
                                {uniqueCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select> */}
              <Filter
                toggleSidebar={toggleTarifs}
                handleChange={""}
                buttonTitle={"Добавить номер"}
              />
            </div>
          </div>

          <InfoTableDataNomerFond
            filter={filter}
            user={user}
            setFilter={setFilter}
            toggleRequestSidebar={toggleEditCategory}
            toggleRequestEditNumber={toggleEditNomer}
            requests={filteredRequestsTarif}
            openDeleteComponent={openDeleteComponent}
            openDeleteNomerComponent={openDeleteNomerComponent}
          />

          <CreateRequestNomerFond
            id={id}
            filter={filter}
            tarifs={requestsTarifs}
            show={showAddTarif}
            onClose={toggleTarifs}
            addTarif={addTarif}
            setAddTarif={setAddTarif}
            uniqueCategories={uniqueCategories}
            addNotification={addNotification}
          />

          <EditRequestNomerFond
            id={id}
            filter={filter}
            tarifs={requestsTarifs}
            show={showEditNomer}
            onClose={() => setShowEditNomer(false)}
            nomer={selectedNomer.nomer}
            category={selectedNomer.category}
            reserve={selectedNomer.reserve}
            active={selectedNomer.active}
            selectedNomer={selectedNomer}
            onSubmit={handleEditNomer}
            uniqueCategories={uniqueCategories}
            addTarif={addTarif}
            setAddTarif={setAddTarif}
            addNotification={addNotification}
          />
          <EditRequestCategory
            id={id}
            show={showEditCategory}
            onClose={() => setShowEditCategory(false)}
            category={selectedCategory}
            onSubmit={handleEditCategory}
          />

          {showDelete && (
            <DeleteComponent
              ref={deleteComponentRef}
              remove={
                deleteNomer
                  ? () => deleteNomerFromCategory(deleteNomer)
                  : () => deleteTarif(deleteIndex)
              }
              close={closeDeleteComponent}
              title={`Вы действительно хотите удалить ${
                deleteNomer ? "номер" : "категорию"
              }?`}
            />
          )}
          {notifications.map((n, index) => (
            <Notification
              key={n.id}
              text={n.text}
              status={n.status}
              index={index}
              onClose={() => {
                setNotifications((prev) =>
                  prev.filter((notif) => notif.id !== n.id)
                );
              }}
            />
          ))}
        </>
      )}
    </>
  );
}

export default HotelNomerFond_tabComponent;
