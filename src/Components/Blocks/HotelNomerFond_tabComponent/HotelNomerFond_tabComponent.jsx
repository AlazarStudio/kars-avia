import React, { useEffect, useRef, useState } from "react";
import classes from "./HotelNomerFond_tabComponent.module.css";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import Filter from "../Filter/Filter";
import Button from "../../Standart/Button/Button";

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
  DELETE_MANY_ROOMS,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  decodeJWT,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUITextField from "../MUITextField/MUITextField.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import { useToast } from "../../../contexts/ToastContext";
import { useDialog } from "../../../contexts/DialogContext";
import {
  CATEGORY_LABELS,
  categoryLabel,
} from "../../../utils/roomCategories.js";
import { plural } from "../../../utils/plural.js";
import FilterPopoverButton from "../FilterPopoverButton/FilterPopoverButton.jsx";

const getCategoryLabel = categoryLabel;

function HotelNomerFond_tabComponent({ children, id, ...props }) {
  const token = getCookie("token");
  const user = decodeJWT(token);
  const { success, error: notifyError } = useToast();
  const { confirm: confirmDialog } = useDialog();

  const { loading, error, data, refetch } = useQuery(GET_HOTEL_ROOMS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { hotelId: id },
  });
  // hotelUpdated приходит по ВСЕМ гостиницам сразу — перезапрашиваем только
  // свою, иначе список дёргается на любое чужое изменение.
  useSubscription(GET_HOTELS_UPDATE_SUBSCRIPTION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    onData: ({ data: subscriptionData }) => {
      const updatedId = subscriptionData?.data?.hotelUpdated?.id;
      if (String(updatedId) === String(id)) refetch();
    },
  });

  // console.log(data);

  const [type, setType] = useState(null);

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
  const [nomerEditMode, setNomerEditMode] = useState(false);

  // Выделение для удаления пачкой: режима нет, отметки стоят всегда, панель
  // действий появляется, как только выбран хотя бы один номер.
  const [selectedRoomIds, setSelectedRoomIds] = useState(() => new Set());
  const [deletingMany, setDeletingMany] = useState(false);

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
  const [deleteManyRooms] = useMutation(DELETE_MANY_ROOMS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  useEffect(() => {
    if (data) {
      const sortedTarifs = Object.values(
        data.hotel.rooms.reduce((acc, room) => {
          if (!acc[room.category]) {
            acc[room.category] = {
              name: getCategoryLabel(room.category),
              origName: room.category,
              rooms: [],
            };
          }
          acc[room.category].rooms.push(room);
          return acc;
        }, {})
      );

      // вариант 1 — короче
      // sortedTarifs.forEach((category) => {
      //   category.rooms.sort((a, b) =>
      //     a.name.localeCompare(b.name, undefined, {
      //       numeric: true,
      //       sensitivity: "base",
      //     })
      //   );
      // });
      // или вариант 2 — Collator (быстрее на больших массивах)
      const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: "base",
      });
      sortedTarifs.forEach((category) => {
        category.rooms.sort((a, b) => collator.compare(a.name, b.name));
      });

      setAddTarif(sortedTarifs);
    }
    // refetch отсюда убран: он висел на изменении data и запускал лишний круг
    // запросов после каждого обновления списка. Перезапрашивает подписка.
  }, [data]);
  // console.log(data?.hotel?.rooms);

  useEffect(() => {
    if (data && data.hotel.type) setType(data.hotel.type);
  }, [data]);

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
    try {
      const response = await deleteHotelCategory({
        variables: {
          deleteCategoryId: item.item.id,
        },
      });
      if (response?.data) {
        setAddTarif((prev) => prev.filter((_, i) => i !== item.index));
        setShowDelete(false);
        setShowEditCategory(false);
        refetch();
        success("Категория удалена.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Не удалось удалить категорию.");
    }
  };

  const openDeleteNomerComponent = (nomer, category) => {
    setDeleteNomer({ nomer, category, type: "deleteRoom" });
    setShowDelete(true);
  };

  const deleteNomerFromCategory = async (roomInfo) => {
    try {
      const response = await deleteHotelRoom({
        variables: {
          deleteRoomId: roomInfo.nomer.id,
        },
      });

      if (response?.data) {
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
        refetch();
        success("Номер удалён.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Не удалось удалить номер.");
    }
  };

  const clearSelection = () => setSelectedRoomIds(new Set());

  const toggleRoomSelection = (roomId) => {
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  const toggleCategorySelection = (rooms, select) => {
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);
      rooms.forEach((room) => {
        if (select) next.add(room.id);
        else next.delete(room.id);
      });
      return next;
    });
  };

  const deleteSelectedRooms = async () => {
    const ids = [...selectedRoomIds];
    if (!ids.length) return;

    const isConfirmed = await confirmDialog(
      `Удалить ${ids.length} ${plural(ids.length, ["номер", "номера", "номеров"])}? Действие необратимо.`
    );
    if (!isConfirmed) return;

    setDeletingMany(true);
    try {
      // Мутация всё-или-ничего: частичного удаления не бывает, поэтому список
      // очищаем только после успеха.
      await deleteManyRooms({ variables: { ids } });
      setSelectedRoomIds(new Set());
      await refetch();
      success(
        `Удалено ${ids.length} ${plural(ids.length, ["номер", "номера", "номеров"])}.`
      );
    } catch (err) {
      console.error(err);
      notifyError("Не удалось удалить выбранные номера.");
    } finally {
      setDeletingMany(false);
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

  const toggleViewNomer = (nomer, category) => {
    setSelectedNomer({ nomer, category });
    setNomerEditMode(false);
    setShowEditNomer(true);
  };

  const toggleEditNomer = (nomer, category, reserve, active) => {
    setSelectedNomer({ nomer, category, reserve, active });
    setNomerEditMode(true);
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

  const [filter, setFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);

  const categoryOptions = Object.values(CATEGORY_LABELS);

  const activeFilterCount = (categoryFilter ? 1 : 0) + (filter ? 1 : 0);

  const handleResetFilters = () => {
    setCategoryFilter(null);
    setFilter(null);
  };

  const categoryFilteredRequests = categoryFilter
    ? filteredRequestsTarif.filter((item) => item.name === categoryFilter)
    : filteredRequestsTarif;

  // console.log(filteredRequestsTarif);

  return (
    <>
      {loading && <MUILoader fullHeight={"70vh"} />}
      {error && <p>Error: {error.message}</p>}

      {!loading && !error && addTarif && (
        <>
          <div className={classes.section_searchAndFilter}>
            <FilterPopoverButton
                activeCount={activeFilterCount}
                onReset={handleResetFilters}
                width={320}
              >
              <MUIAutocomplete
                dropdownWidth={"100%"}
                hideLabelOnFocus={false}
                label="Категория"
                options={categoryOptions}
                value={categoryFilter}
                onChange={(e, newValue) => {
                  setCategoryFilter(newValue);
                }}
              />
              {type !== "apartment" && (
                <MUIAutocomplete
                  dropdownWidth={"100%"}
                  hideLabelOnFocus={false}
                  label="Квота / Резерв"
                  options={["Квота", "Резерв"]}
                  value={
                    filter === "quote"
                      ? "Квота"
                      : filter === "reserve"
                        ? "Резерв"
                        : null
                  }
                  onChange={(e, newValue) => {
                    setFilter(
                      newValue === "Резерв"
                        ? "reserve"
                        : newValue === "Квота"
                          ? "quote"
                          : null
                    );
                  }}
                />
              )}
            </FilterPopoverButton>
            <MUITextField
              label={"Поиск по номеру"}
              className={classes.mainSearch}
              value={searchTarif}
              onChange={handleSearchTarif}
            />
            <Filter
              toggleSidebar={toggleTarifs}
              handleChange={""}
              buttonTitle={"Добавить номер"}
            />
          </div>

          {/* Панель и список — один блок: вкладка раскладывает детей колонкой
              с gap: 40px, и отдельным ребёнком панель разносила фильтры и
              список на 140px. Своя строка, а не довесок к фильтрам: в один ряд
              поиск, фильтры, «Добавить номер» и панель не помещаются —
              «Добавить номер» уезжал за край экрана. */}
          <div
            className={`${classes.listBlock} ${selectedRoomIds.size > 0 ? classes.listBlockWithBar : ""}`}
          >
            {selectedRoomIds.size > 0 && (
              <div className={classes.selectionBar}>
                <span className={classes.selectionBar_count}>
                  Выбрано {selectedRoomIds.size}{" "}
                  {plural(selectedRoomIds.size, ["номер", "номера", "номеров"])}
                </span>
                <div className={classes.selectionBar_actions}>
                  <button
                    type="button"
                    className={classes.selectionBar_clear}
                    onClick={clearSelection}
                    disabled={deletingMany}
                  >
                    Снять выделение
                  </button>
                  <Button
                    onClick={deleteSelectedRooms}
                    disabled={deletingMany}
                    padding="0 20px"
                    height="36px"
                    backgroundcolor="#C03B28"
                  >
                    {deletingMany ? "Удаление…" : "Удалить"}
                  </Button>
                </div>
              </div>
            )}

            <InfoTableDataNomerFond
              type={type}
              filter={filter}
              user={user}
              toggleRequestSidebar={toggleEditCategory}
              toggleRequestEditNumber={toggleEditNomer}
              onViewNomer={toggleViewNomer}
              requests={categoryFilteredRequests}
              openDeleteComponent={openDeleteComponent}
              openDeleteNomerComponent={openDeleteNomerComponent}
              selectedIds={selectedRoomIds}
              onToggleRoom={toggleRoomSelection}
              onToggleCategory={toggleCategorySelection}
            />
          </div>

          <CreateRequestNomerFond
            type={type}
            id={id}
            filter={filter}
            tarifs={requestsTarifs}
            show={showAddTarif}
            onClose={toggleTarifs}
            addTarif={addTarif}
            setAddTarif={setAddTarif}
            uniqueCategories={uniqueCategories}
          />

          <EditRequestNomerFond
            type={type}
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
            openDeleteNomerComponent={openDeleteNomerComponent}
            initialEditMode={nomerEditMode}
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
              title={`Вы действительно хотите удалить ${deleteNomer ? "номер" : "категорию"
                }?`}
            />
          )}
        </>
      )}
    </>
  );
}

export default HotelNomerFond_tabComponent;
