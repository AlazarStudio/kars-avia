import React, { useEffect, useRef, useState } from "react";
import classes from "./HotelSettings_tabComponent.module.css";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import Button from "../../Standart/Button/Button.jsx";
import {
  getMediaUrl,
  getCookie,
  GET_HOTEL,
  UPDATE_HOTEL,
  decodeJWT,
  DELETE_HOTEL,
  GET_HOTEL_LOGS,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  GET_CITIES,
  GET_AIRPORTS_RELAY,
  REORDER_GALLERY,
} from "../../../../graphQL_requests.js";
import { roles } from "../../../roles.js";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
import { useNavigate } from "react-router-dom";
import Logs from "../LogsHistory/Logs.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";
import TextEditor from "../TextEditor/TextEditor.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import StarRatingFilter from "../StarRatingFilter/StarRatingFilter.jsx";
import MUISwitch from "../MUISwitch/MUISwitch.jsx";
import RequisitesIcon from "../../../shared/icons/RequisitesIcon.jsx";
import SettingsIcon from "../../../shared/icons/SettingsIcon.jsx";
import HomeIcon from "../../../shared/icons/HomeIcon.jsx";
import ScheduleIcon from "../../../shared/icons/ScheduleIcon.jsx";
import DeleteIcon from "../../../shared/icons/DeleteIcon.jsx";
import PinIcon from "../../../shared/icons/PinIcon.jsx";
import ContactsIcon from "../../../shared/icons/ContactsIcon.jsx";

function HotelSettings_tabComponent({ id }) {
  // const [userRole, setUserRole] = useState();
  const token = getCookie("token");
  const user = decodeJWT(token);
  const { showAlert } = useDialog();
  const { success, error: notifyError } = useToast();

  const navigate = useNavigate();

  const [displayInfo, setDisplayInfo] = useState("generalInfo");
  const [showLogsSidebar, setShowLogsSidebar] = useState(false);

  const toggleLogsSidebar = () => setShowLogsSidebar(!showLogsSidebar);

  // useEffect(() => {
  //   setUserRole(decodeJWT(token).role);
  // }, [token]);

  const { loading, error, data, refetch } = useQuery(GET_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { hotelId: id },
  });
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_HOTELS_UPDATE_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  let infoCities = useQuery(GET_CITIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  let infoAirports = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  const [cities, setCities] = useState([]);
  const [airports, setAirports] = useState([]);

  useEffect(() => {
    if (infoCities.data) {
      const mappedCities =
        infoCities.data?.citys.map((item) => ({
          label: `${item.city}, ${item.region}`,
          value: item.city,
        })) || [];
      setCities(infoCities.data?.citys);
    }
  }, [infoCities]);

  useEffect(() => {
    if (infoAirports.data) {
      const mappedAirports =
        infoAirports.data?.airports.map((item) => ({
          label: `${item.code} ${item.name}, город: ${item.city}`,
          id: item.id,
        })) || [];
      setAirports(infoAirports.data?.airports);
    }
  }, [infoAirports]);

  // console.log(airports);

  const [hotel, setHotel] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [gallery, setGallery] = useState(hotel?.gallery || []);

  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [showDeleteGallery, setShowDeleteGallery] = useState(false);

  const [reorderGallery] = useMutation(REORDER_GALLERY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [updateHotel] = useMutation(UPDATE_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [deleteHotel] = useMutation(DELETE_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [showDelete, setShowDelete] = useState(false);

  // 1. начальная загрузка / обновление, но только когда не редактируем
  useEffect(() => {
    if (!data?.hotel) return;

    // если сейчас не редактируем — можно синхронизировать с сервером
    if (!isEditing) {
      setHotel(data.hotel);
    }
  }, [data, isEditing]);

  // 2. подписка: если пришло обновление — рефетчим,
  //   но НЕ во время редактирования, чтобы не сбивать форму
  useEffect(() => {
    if (dataSubscriptionUpd && !isEditing) {
      refetch();
    }
  }, [dataSubscriptionUpd, isEditing, refetch]);


  // console.log(dataSubscriptionUpd)

  const [isLoading, setIsLoading] = useState(false);

  const handleEditClick = async () => {
    if (isEditing) {
      setIsLoading(true);
      try {
        await updateHotel({
          variables: {
            updateHotelId: hotel.id,
            input: {
              name: hotel.name,
              nameFull: hotel.nameFull,
              access: hotel.access,
              show: hotel.show,
              discount: hotel.discount,
              meal: hotel.meal,
              capacity: parseInt(hotel.capacity),
              stars: hotel.stars,
              usStars: hotel.usStars,
              airportId: hotel.airport?.id,
              airportDistance: hotel.airportDistance,
              information: {
                country: hotel.information?.country,
                city: hotel.information?.city,
                address: hotel.information?.address,
                bank: hotel.information?.bank,
                bik: hotel.information?.bik,
                email: hotel.information?.email,
                index: hotel.information?.index,
                inn: hotel.information?.inn,
                number: hotel.information?.number,
                link: hotel.information?.link,
                description: hotel.information?.description,
                ogrn: hotel.information?.ogrn,
                rs: hotel.information?.rs,
              },
              location: {
                country: hotel.location?.country || null,
                cityId: hotel.location?.cityId || null,
                address: hotel.location?.address || null,
              },
              breakfastIncluded: !!hotel.breakfastIncluded,
              breakfast: {
                start: hotel.breakfast.start,
                end: hotel.breakfast.end,
              },
              lunch: {
                start: hotel.lunch.start,
                end: hotel.lunch.end,
              },
              dinner: {
                start: hotel.dinner.start,
                end: hotel.dinner.end,
              },
            },
            images: newImage ? [newImage] : null,
            gallery: gallery.length > 0 ? gallery : null,
          },
        });

        success("Редактирование гостиницы прошло успешно.");
        refetch();
      } catch (err) {
        console.error("Произошла ошибка при сохранении данных", err);
        notifyError("Произошла ошибка при сохранении данных");
      } finally {
        setIsLoading(false);
      }
    }
    setIsEditing(!isEditing);
  };

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSizeInBytes = 8 * 1024 * 1024; // 8 MB
    if (file.size > maxSizeInBytes) {
      showAlert("Размер файла не должен превышать 8 МБ!");
      setHotel((prevState) => ({
        ...prevState,
        images: [`${data.hotel.images[0]}`],
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = null; // Сброс значения в DOM-элементе
      }
      return;
    }

    setNewImage(file); // Сохраняем объект файла
    const imageUrl = URL.createObjectURL(file); // Создаем URL для отображения
    setHotel((prevState) => ({
      ...prevState,
      images: [imageUrl], // Обновляем URL изображения для отображения
    }));
  };

  const fileInputRefGallery = useRef(null);

  const handleGalleryFileChange = (e) => {
    const files = e.target.files;
    const maxSizeInBytes = 8 * 1024 * 1024; // 8 MB

    const fileArray = Array.from(files).map((file) => file);
    setGallery(fileArray);
  };
  const toggleDeleteGalleryImage = (path) => {
    setImagesToDelete((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  // подтверждённое удаление: шлём массив на удаление
  const confirmDeleteGalleryImages = async () => {
    if (!imagesToDelete.length) return;
    const keepArray = (hotel?.gallery || []).filter(
      (p) => !imagesToDelete.includes(p)
    );
    try {
      await reorderGallery({
        variables: {
          reorderHotelGalleryImagesId: id,
          imagesArray: keepArray, // что остаётся
          imagesToDeleteArray: imagesToDelete, // что удалить
        },
      });
      // локально обновим стейт, чтобы не ждать refetch
      setHotel((prev) => ({ ...prev, gallery: keepArray }));
      setImagesToDelete([]);
      setShowDeleteGallery(false);
      success("Изображения удалены.");
    } catch (err) {
      console.error("Ошибка при удалении изображений галереи", err);
      notifyError("Не удалось удалить изображения.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setHotel((prevHotel) => {
      // Проверяем, обновляется ли поле в `information`
      if (Object.keys(prevHotel.information || {}).includes(name)) {
        return {
          ...prevHotel,
          information: {
            ...prevHotel.information,
            [name]: value, // Обновляем только нужное поле в `information`
          },
        };
      }
      // Проверяем, начинается ли name с "breakfast", "lunch" или "dinner"
      if (name.startsWith("breakfast")) {
        return {
          ...prevHotel,
          breakfast: {
            ...prevHotel.breakfast,
            [name.replace("breakfast", "").toLowerCase()]: value,
          },
        };
      } else if (name.startsWith("lunch")) {
        return {
          ...prevHotel,
          lunch: {
            ...prevHotel.lunch,
            [name.replace("lunch", "").toLowerCase()]: value,
          },
        };
      } else if (name.startsWith("dinner")) {
        return {
          ...prevHotel,
          dinner: {
            ...prevHotel.dinner,
            [name.replace("dinner", "").toLowerCase()]: value,
          },
        };
      } else {
        // Для остальных полей
        return {
          ...prevHotel,
          [name]: value,
        };
      }
    });
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setHotel((prevHotel) => ({
      ...prevHotel,
      location: {
        ...(prevHotel.location || {}),
        [name]: value,
      },
    }));
  };

  const openDeleteComponent = () => {
    setShowDelete(true);
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
  };

  const handleDeleteHotel = async () => {
    try {
      await deleteHotel({
        variables: {
          deleteHotelId: id,
        },
      });
      setShowDelete(false);
      navigate("/hotels");
    } catch (err) {
      console.error("Ошибка при удалении гостиницы", err);
    }
  };

  // const renderField = ({ label, value, isStars }) => {
  //   if (isStars) {
  //     return (
  //       <div className={classes.hotelAbout_info_item}>
  //         <label style={{ flexBasis: "50%" }}>{label}</label>
  //         <div className={classes.starsWrapper} style={{ width: "400px" }}>
  //           {Array.from({ length: 5 }, (_, index) => (
  //             <img
  //               key={index}
  //               src={index < value ? "/star.png" : "/op_star.png"}
  //               className={classes.star}
  //             />
  //           ))}
  //         </div>
  //       </div>
  //     );
  //   }
  //   return (
  //     <div className={classes.hotelAbout_info_item}>
  //       <label style={{ flexBasis: "50%" }}>{label}</label>
  //       <div
  //         className={classes.hotelAbout_info_value}
  //         style={{ width: "400px" }}
  //       >
  //         {value || " "}
  //       </div>
  //     </div>
  //   );
  // };

  // const rooms = hotel?.type !== "apartment" ? hotel?.roomKind : hotel?.rooms;

  const canEdit =
    user?.role === roles.superAdmin ||
    user?.role === roles.hotelAdmin ||
    user?.role === roles.dispatcerAdmin;

  const avatarSrc = newImage
    ? URL.createObjectURL(newImage)
    : getMediaUrl(hotel?.images?.[0]) ?? "/no-avatar.png";

  const locationLine = [hotel?.information?.city, hotel?.information?.address]
    .filter(Boolean)
    .join(", ");

  const SETTINGS_TABS = [
    { key: "generalInfo", label: "Общая информация", icon: <HomeIcon /> },
    { key: "settings", label: "Настройки", icon: <SettingsIcon width={18} height={18} strokeWidth={1.7} /> },
    ...(hotel?.meal
      ? [{ key: "schedule", label: "Расписание", icon: <ScheduleIcon /> }]
      : []),
    { key: "requisites", label: "Реквизиты", icon: <RequisitesIcon /> },
    { key: "contacts", label: "Контакты и адрес", icon: <ContactsIcon /> },
  ];

  return (
    <>
      {(loading || isLoading) && <MUILoader fullHeight={"70vh"} />}
      {error && <p>Error: {error.message}</p>}

      {!loading && !isLoading && !error && hotel && (
        <div
          className={classes.card}
          style={
            user?.hotelId || user?.airlineId
              ? { height: "calc(100vh - 130px)" }
              : {}
          }
        >
          {canEdit && (
            <div className={classes.header}>
              <div className={classes.headerLeft}>
                <div className={classes.avatar}>
                  <img src={avatarSrc} alt={hotel.name} />
                </div>
                <div className={classes.headerInfo}>
                  <div className={classes.headerName}>{hotel.name}</div>
                  {locationLine && (
                    <div className={classes.headerLocation}>
                      <PinIcon />
                      {locationLine}
                    </div>
                  )}
                </div>
              </div>
              <div className={classes.headerActions}>
                <button
                  type="button"
                  className={classes.historyBtn}
                  onClick={toggleLogsSidebar}
                >
                  <ScheduleIcon /> История
                </button>
                <Button onClick={handleEditClick}>
                  <img
                    src={isEditing ? "/save.png" : "/editIcon.png"}
                    alt=""
                    style={{ width: 16, height: 16 }}
                  />
                  {isEditing ? "Сохранить" : "Редактировать"}
                </Button>
              </div>
            </div>
          )}

          <div className={classes.tabs}>
            {SETTINGS_TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                className={`${classes.tab} ${displayInfo === key ? classes.tabActive : ""}`}
                onClick={() => setDisplayInfo(key)}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          <div className={classes.content}>
            {displayInfo === "generalInfo" && (
              <div className={classes.formSection}>
                <div className={classes.sectionTitle}>Основные данные</div>

                <div className={classes.fieldRow}>
                  <span className={classes.fieldLabel}>Название</span>
                  <input
                    type="text"
                    name="name"
                    value={hotel.name || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={classes.fieldInput}
                  />
                </div>
                <div className={classes.fieldRow}>
                  <span className={classes.fieldLabel}>Мощность</span>
                  <input
                    type="number"
                    name="capacity"
                    value={hotel.capacity || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={classes.fieldInput}
                  />
                </div>
                <div className={classes.fieldRow}>
                  <span className={classes.fieldLabel}>Рейтинг</span>
                  <StarRatingFilter
                    value={hotel.stars || ""}
                    onChange={(val) =>
                      handleChange({ target: { name: "stars", value: val } })
                    }
                    disabled={user?.hotelId ? true : !isEditing}
                    width="420px"
                  />
                </div>
                <div className={classes.fieldRow}>
                  <span className={classes.fieldLabel}>Звёздность</span>
                  <StarRatingFilter
                    value={hotel.usStars || ""}
                    onChange={(val) =>
                      handleChange({ target: { name: "usStars", value: val } })
                    }
                    disabled={user?.hotelId ? true : !isEditing}
                    width="420px"
                  />
                </div>
                <div className={classes.fieldRow}>
                  <span className={classes.fieldLabel}>Скидка</span>
                  <input
                    type="text"
                    name="discount"
                    value={hotel.discount || ""}
                    onChange={handleChange}
                    disabled={user?.hotelId ? true : !isEditing}
                    className={classes.fieldInput}
                  />
                </div>
                <div className={classes.fieldRow}>
                  <span className={classes.fieldLabel}>Аэропорт</span>
                  <MUIAutocompleteColor
                    dropdownWidth="420px"
                    listboxHeight={"300px"}
                    isDisabled={!isEditing}
                    options={airports}
                    getOptionLabel={(option) => {
                      if (!option) return "";
                      const cityPart =
                        option.city && option.city !== option.name
                          ? `, город: ${option.city}`
                          : "";
                      return `${option.code} ${option.name}${cityPart}`.trim();
                    }}
                    renderOption={(optionProps, option) => {
                      const cityPart =
                        option.city && option.city !== option.name
                          ? `, город: ${option.city}`
                          : "";
                      const labelText =
                        `${option.code} ${option.name}${cityPart}`.trim();
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
                    value={
                      airports.find(
                        (option) => option.id === hotel.airport?.id
                      ) || null
                    }
                    onChange={(e, newValue) => {
                      setHotel((prev) => ({
                        ...prev,
                        airport: { id: newValue ? newValue.id : "" },
                      }));
                    }}
                  />
                </div>
                <div className={classes.fieldRow}>
                  <span className={classes.fieldLabel}>До аэропорта (мин)</span>
                  <input
                    type="number"
                    name="airportDistance"
                    step={0.1}
                    value={hotel.airportDistance || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={classes.fieldInput}
                  />
                </div>

                <div className={classes.descriptionRow}>
                  <span className={classes.fieldLabel}>Описание</span>
                  <TextEditor
                    hotel={hotel}
                    isEditing={isEditing}
                    onChange={(newDescription) =>
                      setHotel((prevHotel) => ({
                        ...prevHotel,
                        information: {
                          ...prevHotel.information,
                          description: newDescription,
                        },
                      }))
                    }
                  />
                </div>

                {isEditing && (
                  <>
                    <div className={classes.fileRow}>
                      <span className={classes.fileLabel}>Аватарка</span>
                      <input
                        type="file"
                        name="images"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className={classes.fileInput}
                      />
                    </div>
                    <div className={classes.fileRow}>
                      <span className={classes.fileLabel}>Галерея</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleGalleryFileChange}
                        ref={fileInputRefGallery}
                        className={classes.fileInput}
                      />
                    </div>
                  </>
                )}

                {hotel?.gallery?.length > 0 && isEditing && (
                  <div className={classes.galleryList}>
                    {hotel.gallery.map((img, idx) => {
                      const marked = imagesToDelete.includes(img);
                      return (
                        <div
                          key={`${img}-${idx}`}
                          className={`${classes.galleryItem} ${marked ? classes.toDelete : ""}`}
                          onClick={() => toggleDeleteGalleryImage(img)}
                          title={marked ? "Снять пометку удаления" : "Пометить к удалению"}
                        >
                          <img src={getMediaUrl(img)} alt={`Фото ${idx + 1}`} />
                          <button
                            type="button"
                            className={classes.deleteImageBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDeleteGalleryImage(img);
                            }}
                            aria-label={marked ? "Отменить удаление" : "Удалить"}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {isEditing && imagesToDelete.length > 0 && (
                  <div className={classes.galleryDeleteBar}>
                    <span>К удалению: {imagesToDelete.length}</span>
                    <Button onClick={() => setShowDeleteGallery(true)}>
                      <img src="/delete.png" alt="" />
                      Удалить выбранные
                    </Button>
                    <Button
                      onClick={() => setImagesToDelete([])}
                      backgroundcolor="#f2f3f7"
                      color="#545873"
                    >
                      Отмена
                    </Button>
                  </div>
                )}

                {(user.role === roles.superAdmin || user.role === roles.dispatcerAdmin) && (
                  <div
                    className={classes.deleteBtn}
                    onClick={isEditing ? openDeleteComponent : null}
                    style={!isEditing ? { opacity: 0.4, cursor: "default" } : {}}
                  >
                    Удалить гостиницу
                    <DeleteIcon />
                  </div>
                )}
              </div>
            )}

            {displayInfo === "settings" && (
              <div className={classes.formSection}>
                <div className={classes.sectionTitle}>Параметры</div>
                <div className={classes.switchGroup}>
                  <MUISwitch
                    label="Видимость гостиницы"
                    checked={hotel.show}
                    onChange={(e) =>
                      setHotel((prev) => ({ ...prev, show: e.target.checked }))
                    }
                    width={"350px"}
                    disabled={!isEditing}
                  />
                  <MUISwitch
                    label="Наличие питания"
                    checked={hotel.meal}
                    onChange={(e) =>
                      setHotel((prev) => ({ ...prev, meal: e.target.checked }))
                    }
                    width={"350px"}
                    disabled={!isEditing}
                  />
                  <MUISwitch
                    label="Завтрак включён в стоимость"
                    checked={!!hotel.breakfastIncluded}
                    onChange={(e) =>
                      setHotel((prev) => ({ ...prev, breakfastIncluded: e.target.checked }))
                    }
                    width={"350px"}
                    disabled={!isEditing}
                  />
                  <MUISwitch
                    label="Самостоятельное размещение"
                    checked={hotel.access}
                    onChange={(e) =>
                      setHotel((prev) => ({ ...prev, access: e.target.checked }))
                    }
                    width={"350px"}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            )}

            {displayInfo === "schedule" && (
              <div className={classes.formSection}>
                <div className={classes.sectionTitle}>Расписание питания</div>
                {[
                  { key: "breakfast", label: "Завтрак" },
                  { key: "lunch", label: "Обед" },
                  { key: "dinner", label: "Ужин" },
                ].map(({ key, label }) => (
                  <div className={classes.mealRow} key={key}>
                    <span className={classes.mealLabel}>{label}</span>
                    <div className={classes.mealTimeGroup}>
                      <span>с</span>
                      <input
                        type="time"
                        name={`${key}Start`}
                        value={hotel[key]?.start || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                      <span>до</span>
                      <input
                        type="time"
                        name={`${key}End`}
                        value={hotel[key]?.end || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {displayInfo === "requisites" && !user?.airlineId && (
              <div className={`${classes.formSection} ${classes.formSectionHalf}`}>
                <div className={classes.sectionTitle}>Юридические данные</div>
                {[
                  { name: "nameFull", label: "Наименование", value: hotel.nameFull, isRoot: true },
                  { name: "inn", label: "ИНН", value: hotel.information?.inn },
                  { name: "ogrn", label: "ОГРН", value: hotel.information?.ogrn },
                  { name: "rs", label: "Р/С", value: hotel.information?.rs },
                  { name: "bank", label: "В банке", value: hotel.information?.bank },
                  { name: "bik", label: "БИК", value: hotel.information?.bik },
                ].map(({ name, label, value }) => (
                  <div className={classes.fieldRow} key={name}>
                    <span className={classes.fieldLabel}>{label}</span>
                    <input
                      type="text"
                      name={name}
                      value={value || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`${classes.fieldInput} ${classes.fieldInputWide}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {displayInfo === "contacts" && (
              <div className={classes.twoColumns}>
                <div className={classes.formSection}>
                  <div className={classes.sectionTitle}>Адрес</div>
                  <div className={classes.fieldRow}>
                    <span className={classes.fieldLabel}>Страна</span>
                    <input
                      type="text"
                      name="country"
                      value={hotel.information?.country || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`${classes.fieldInput} ${classes.fieldInputWide}`}
                    />
                  </div>
                  <div className={classes.fieldRow}>
                    <span className={classes.fieldLabel}>Город</span>
                    <MUIAutocompleteColor
                      dropdownWidth="100%"
                      listboxHeight={"300px"}
                      isDisabled={!isEditing}
                      options={cities}
                      getOptionLabel={(option) =>
                        option ? `${option.city} ${option.region}`.trim() : ""
                      }
                      renderOption={(optionProps, option) => {
                        const labelText = `${option.city} ${option.region}`.trim();
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
                      value={
                        cities.find(
                          (option) => option.city === hotel.information?.city
                        ) || null
                      }
                      onChange={(e, newValue) => {
                        setHotel((prevHotel) => ({
                          ...prevHotel,
                          information: {
                            ...prevHotel.information,
                            city: newValue ? newValue.city : "",
                          },
                        }));
                      }}
                    />
                  </div>
                  <div className={classes.fieldRow}>
                    <span className={classes.fieldLabel}>Улица</span>
                    <input
                      type="text"
                      name="address"
                      value={hotel.information?.address || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`${classes.fieldInput} ${classes.fieldInputWide}`}
                    />
                  </div>
                  <div className={classes.fieldRow}>
                    <span className={classes.fieldLabel}>Индекс</span>
                    <input
                      type="text"
                      name="index"
                      value={hotel.information?.index || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`${classes.fieldInput} ${classes.fieldInputWide}`}
                    />
                  </div>
                </div>

                <div className={classes.formSection}>
                  <div className={classes.sectionTitle}>Контакты</div>
                  <div className={classes.fieldRow}>
                    <span className={classes.fieldLabel}>Почта</span>
                    <input
                      type="email"
                      value="booking@kars-avia.ru"
                      disabled
                      className={`${classes.fieldInput} ${classes.fieldInputWide}`}
                    />
                  </div>
                  <div className={classes.fieldRow}>
                    <span className={classes.fieldLabel}>Почта</span>
                    <input
                      type="email"
                      value="booking@aniaero.ru"
                      disabled
                      className={`${classes.fieldInput} ${classes.fieldInputWide}`}
                    />
                  </div>
                  <div className={classes.fieldRow}>
                    <span className={classes.fieldLabel}>Телефон</span>
                    <input
                      type="tel"
                      value="8 (800) 550-04-88"
                      disabled
                      className={`${classes.fieldInput} ${classes.fieldInputWide}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Logs
            type={"hotel"}
            queryLog={GET_HOTEL_LOGS}
            queryID={"hotelId"}
            id={id}
            show={showLogsSidebar}
            onClose={toggleLogsSidebar}
            name={hotel?.name}
          />
          {showDelete && (
            <DeleteComponent
              remove={handleDeleteHotel}
              close={closeDeleteComponent}
              title={`Вы действительно хотите удалить гостиницу "${hotel?.name}"?`}
            />
          )}
          {showDeleteGallery && (
            <DeleteComponent
              remove={confirmDeleteGalleryImages}
              close={() => setShowDeleteGallery(false)}
              title={`Удалить ${imagesToDelete.length} изображен${imagesToDelete.length === 1 ? "ие" : imagesToDelete.length < 5 ? "ия" : "ий"} из галереи?`}
            />
          )}
        </div>
      )}
    </>
  );
}

export default HotelSettings_tabComponent;

// import React, { useEffect, useRef, useState } from "react";
// import classes from "./HotelAbout_tabComponent.module.css";
// import { useQuery, useMutation, useSubscription } from "@apollo/client";
// import Button from "../../Standart/Button/Button.jsx";
// import HotelAboutRoomBlock from "../HotelAboutRoomBlock/HotelAboutRoomBlock.jsx";
// import {
//   server,
//   getCookie,
//   GET_HOTEL,
//   UPDATE_HOTEL,
//   decodeJWT,
//   DELETE_HOTEL,
//   GET_HOTEL_LOGS,
//   GET_HOTELS_UPDATE_SUBSCRIPTION,
//   GET_CITIES,
// } from "../../../../graphQL_requests.js";
// import { fullNotifyTime, notifyTime, roles } from "../../../roles.js";
// import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
// import { useNavigate } from "react-router-dom";
// import Logs from "../LogsHistory/Logs.jsx";
// import MUILoader from "../MUILoader/MUILoader.jsx";
// import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
// import Notification from "../../Notification/Notification.jsx";

// function HotelAbout_tabComponent({ id }) {
//   const [userRole, setUserRole] = useState();
//   const token = getCookie("token");
//   const user = decodeJWT(token);

//   const navigate = useNavigate();

//   const [displayInfo, setDisplayInfo] = useState("generalInfo");
//   const [showLogsSidebar, setShowLogsSidebar] = useState(false);
//   const [menuOpen, setMenuOpen] = useState(() => {
//     return JSON.parse(localStorage.getItem("menuOpen")) ?? true;
//   });
//   const [width, setWindowWidth] = useState(window.innerWidth);

//   useEffect(() => {
//     const updateState = () => {
//       setMenuOpen(JSON.parse(localStorage.getItem("menuOpen")));
//     };

//     // Отслеживание изменений localStorage в других вкладках
//     window.addEventListener("storage", updateState);

//     // Перехват изменений в текущей вкладке
//     const originalSetItem = localStorage.setItem;
//     localStorage.setItem = function (key, value) {
//       originalSetItem.apply(this, arguments);
//       if (key === "menuOpen") {
//         updateState(); // Обновляем состояние
//       }
//     };

//     return () => {
//       window.removeEventListener("storage", updateState);
//       localStorage.setItem = originalSetItem; // Возвращаем исходный метод
//     };
//   }, []);
//   // console.log(menuOpen);

//   useEffect(() => {
//     const handleResize = () => setWindowWidth(window.innerWidth);
//     window.addEventListener("resize", handleResize);

//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   const toggleLogsSidebar = () => setShowLogsSidebar(!showLogsSidebar);

//   useEffect(() => {
//     setUserRole(decodeJWT(token).role);
//   }, [token]);

//   const { loading, error, data, refetch } = useQuery(GET_HOTEL, {
//     variables: { hotelId: id },
//   });
//   const { data: dataSubscriptionUpd } = useSubscription(
//     GET_HOTELS_UPDATE_SUBSCRIPTION
//   );

//   let infoCities = useQuery(GET_CITIES);
//   const [cities, setCities] = useState([]);

//   useEffect(() => {
//     if (infoCities.data) {
//       const mappedCities =
//         infoCities.data?.citys.map((item) => ({
//           label: `${item.city}, ${item.region}`,
//           value: item.city,
//         })) || [];
//       setCities(mappedCities);
//     }
//   }, [infoCities]);

//   const [hotel, setHotel] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [newImage, setNewImage] = useState(null);

//   const [updateHotel] = useMutation(UPDATE_HOTEL, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Apollo-Require-Preflight": "true",
//       },
//     },
//   });

//   const [deleteHotel] = useMutation(DELETE_HOTEL, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   const [showDelete, setShowDelete] = useState(false);

//   useEffect(() => {
//     if (data) {
//       setHotel(data.hotel);
//     }
//     if (dataSubscriptionUpd) refetch();
//   }, [data, dataSubscriptionUpd, refetch]);

//   const [isLoading, setIsLoading] = useState(false);
//   const [notifications, setNotifications] = useState([]);

//   const addNotification = (text, status) => {
//     const id = Date.now(); // Уникальный ID
//     setNotifications((prev) => [...prev, { id, text, status }]);

//     setTimeout(() => {
//       setNotifications((prev) => prev.filter((n) => n.id !== id));
//     }, fullNotifyTime);
//   };

//   const handleEditClick = async () => {
//     if (isEditing) {
//       setIsLoading(true);
//       try {
//         await updateHotel({
//           variables: {
//             updateHotelId: hotel.id,
//             input: {
//               name: hotel.name,
//               capacity: parseInt(hotel.capacity),
//               stars: hotel.stars,
//               usStars: hotel.usStars,
//               airportDistance: hotel.airportDistance,
//               information: {
//                 country: hotel.information?.country,
//                 city: hotel.information?.city,
//                 address: hotel.information?.address,
//                 bank: hotel.information?.bank,
//                 bik: hotel.information?.bik,
//                 email: hotel.information?.email,
//                 index: hotel.information?.index,
//                 inn: hotel.information?.inn,
//                 number: hotel.information?.number,
//                 link: hotel.information?.link,
//                 description: hotel.information?.description,
//                 ogrn: hotel.information?.ogrn,
//                 rs: hotel.information?.rs,
//               },
//               breakfast: {
//                 start: hotel.breakfast.start,
//                 end: hotel.breakfast.end,
//               },
//               lunch: {
//                 start: hotel.lunch.start,
//                 end: hotel.lunch.end,
//               },
//               dinner: {
//                 start: hotel.dinner.start,
//                 end: hotel.dinner.end,
//               },
//             },
//             images: newImage ? [newImage] : null,
//           },
//         });
//         addNotification("Редактирование гостиницы прошло успешно.", "success");
//         // alert('Данные успешно сохранены');
//       } catch (err) {
//         console.error("Произошла ошибка при сохранении данных", err);
//       } finally {
//         setIsLoading(false);
//         // addNotification("Редактирование гостиницы прошло успешно.", "success");
//       }
//     }
//     setIsEditing(!isEditing);
//   };

//   const fileInputRef = useRef(null);

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     const maxSizeInBytes = 8 * 1024 * 1024; // 8 MB
//     if (file.size > maxSizeInBytes) {
//       alert("Размер файла не должен превышать 8 МБ!");
//       setHotel((prevState) => ({
//         ...prevState,
//         images: [`${data.hotel.images[0]}`],
//       }));
//       if (fileInputRef.current) {
//         fileInputRef.current.value = null; // Сброс значения в DOM-элементе
//       }
//       return;
//     }

//     if (file) {
//       setNewImage(file); // Сохраняем объект файла
//       const imageUrl = URL.createObjectURL(file); // Создаем URL для отображения
//       setHotel((prevState) => ({
//         ...prevState,
//         images: [imageUrl], // Обновляем URL изображения для отображения
//       }));
//     }
//   };

//   // console.log(hotel);

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setHotel((prevHotel) => {
//       // Проверяем, обновляется ли поле в `information`
//       if (Object.keys(prevHotel.information || {}).includes(name)) {
//         return {
//           ...prevHotel,
//           information: {
//             ...prevHotel.information,
//             [name]: value, // Обновляем только нужное поле в `information`
//           },
//         };
//       }
//       // Проверяем, начинается ли name с "breakfast", "lunch" или "dinner"
//       if (name.startsWith("breakfast")) {
//         return {
//           ...prevHotel,
//           breakfast: {
//             ...prevHotel.breakfast,
//             [name.replace("breakfast", "").toLowerCase()]: value,
//           },
//         };
//       } else if (name.startsWith("lunch")) {
//         return {
//           ...prevHotel,
//           lunch: {
//             ...prevHotel.lunch,
//             [name.replace("lunch", "").toLowerCase()]: value,
//           },
//         };
//       } else if (name.startsWith("dinner")) {
//         return {
//           ...prevHotel,
//           dinner: {
//             ...prevHotel.dinner,
//             [name.replace("dinner", "").toLowerCase()]: value,
//           },
//         };
//       } else {
//         // Для остальных полей
//         return {
//           ...prevHotel,
//           [name]: value,
//         };
//       }
//     });
//   };

//   const openDeleteComponent = () => {
//     setShowDelete(true);
//   };

//   const closeDeleteComponent = () => {
//     setShowDelete(false);
//   };

//   const handleDeleteHotel = async () => {
//     try {
//       await deleteHotel({
//         variables: {
//           deleteHotelId: id,
//         },
//       });
//       setShowDelete(false);
//       // Handle post-deletion logic (e.g., redirect or notification)
//       navigate("/hotels");
//     } catch (err) {
//       console.error("Ошибка при удалении гостиницы", err);
//     }
//   };

//   const renderField = ({ label, value, isStars }) => {
//     if (isStars) {
//       return (
//         <div className={classes.hotelAbout_info_item}>
//           <label style={{ flexBasis: "50%" }}>{label}</label>
//           <div className={classes.starsWrapper} style={{ width: "400px" }}>
//             {Array.from({ length: 5 }, (_, index) => (
//               <img
//                 key={index}
//                 src={index < value ? "/star.png" : "/op_star.png"}
//                 className={classes.star}
//               />
//             ))}
//           </div>
//         </div>
//       );
//     }
//     return (
//       <div className={classes.hotelAbout_info_item}>
//         <label style={{ flexBasis: "50%" }}>{label}</label>
//         <div
//           className={classes.hotelAbout_info_value}
//           style={{ width: "400px" }}
//         >
//           {value || " "}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <>
//       {(loading || isLoading) && <MUILoader fullHeight={"70vh"} />}
//       {error && <p>Error: {error.message}</p>}

//       {!loading && !isLoading && !error && hotel && (
//         // <div className={classes.hotelAbout} style={user?.role === roles.airlineAdmin ? {height:'calc(100vh - 130px)'} : {}}>
//         <div
//           className={classes.hotelAbout}
//           style={
//             user?.hotelId || user?.airlineId
//               ? { height: "calc(100vh - 130px)" }
//               : {}
//           }
//         >
//           <div className={classes.column}>
//             <div className={classes.hotelAbout_top}>
//               <div className={classes.hotelAbout_top_complete}>
//                 <div className={classes.hotelAbout_top_img}>
//                   <img
//                     src={
//                       newImage
//                         ? URL.createObjectURL(newImage)
//                         : hotel.images.length !== 0
//                         ? `${server}${hotel.images[0]}`
//                         : "/no-avatar.png"
//                     }
//                     alt={hotel.name}
//                   />
//                 </div>
//                 <div className={classes.hotelAbout_top_title}>
//                   <div className={classes.hotelAbout_top_title_name}>
//                     {hotel.name}
//                   </div>
//                   <div className={classes.hotelAbout_top_title_desc}>
//                     {hotel.information?.city && hotel.information?.city && (
//                       <>
//                         <img src="/map.png" alt="" />
//                         {hotel.information?.city}, {hotel.information?.address}
//                       </>
//                     )}
//                     {hotel.information?.link && (
//                       <>
//                         <img src="/web.png" alt="" />
//                         <a
//                           href={`${
//                             /^(https?:\/\/)/.test(hotel.link)
//                               ? hotel.link
//                               : "https://" + hotel.link
//                           }`}
//                           target="_blank"
//                         >
//                           {hotel.link}
//                         </a>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//               <div className={classes.hotelAbout_top_button}>
//                 {(user?.role == roles.superAdmin ||
//                   user?.role == roles.hotelAdmin ||
//                   user?.role == roles.dispatcerAdmin) && (
//                   <>
//                     {/* <Button onClick={toggleLogsSidebar}>История</Button> */}
//                     <div className={classes.hotelAbout_info__filters}>
//                       <button onClick={toggleLogsSidebar}>История</button>
//                     </div>
//                     <Button onClick={handleEditClick}>
//                       {isEditing ? "Сохранить" : "Редактировать"}
//                     </Button>
//                   </>
//                 )}
//               </div>
//             </div>
//             <div className={classes.hotelAbout_info__filters}>
//               <button
//                 className={
//                   displayInfo == "generalInfo" ? classes.activeButton : null
//                 }
//                 onClick={() => {
//                   setDisplayInfo("generalInfo");
//                 }}
//               >
//                 Общая информация
//               </button>

//               <button
//                 className={displayInfo == "rooms" ? classes.activeButton : null}
//                 onClick={() => {
//                   setDisplayInfo("rooms");
//                 }}
//               >
//                 Номера
//               </button>

//               <button
//                 className={
//                   displayInfo == "schedule" ? classes.activeButton : null
//                 }
//                 onClick={() => {
//                   setDisplayInfo("schedule");
//                 }}
//               >
//                 Расписание
//               </button>

//               {user?.airlineId ? null : (
//                 <button
//                   className={
//                     displayInfo == "requisites" ? classes.activeButton : null
//                   }
//                   onClick={() => {
//                     setDisplayInfo("requisites");
//                   }}
//                 >
//                   Реквизиты
//                 </button>
//               )}

//               <button
//                 className={
//                   displayInfo == "contacts" ? classes.activeButton : null
//                 }
//                 onClick={() => {
//                   setDisplayInfo("contacts");
//                 }}
//               >
//                 Контакты и адрес
//               </button>
//             </div>
//           </div>

//           <div
//             className={
//               user?.hotelId || user?.airlineId
//                 ? classes.hotelAbout_info__hotel
//                 : classes.hotelAbout_info
//             }
//           >
//             {displayInfo == "generalInfo" ? (
//               <div className={classes.hotelAbout_info_block}>
//                 {/* <div className={classes.hotelAbout_info_label}>
//                   Информация об отеле
//                 </div> */}
//                 {user?.airlineId &&
//                 user?.role !== roles.hotelAdmin &&
//                 user?.role !== roles.dispatcerAdmin &&
//                 user?.role !== roles.superAdmin ? (
//                   <>
//                     {renderField({ label: "Название", value: hotel?.name })}
//                     {renderField({ label: "Мощность", value: hotel?.capacity })}
//                     {renderField({
//                       label: "Рейтинг",
//                       value: hotel?.stars,
//                       isStars: true,
//                     })}
//                     {renderField({
//                       label: "Звездность",
//                       value: hotel?.usStars,
//                       isStars: true,
//                     })}
//                     {renderField({
//                       label: "Удалённость от аэропорта",
//                       value: hotel?.airportDistance,
//                     })}
//                     {renderField({
//                       label: "Описание",
//                       value: hotel.information?.description
//                         ? hotel.information.description
//                         : "Нет описания",
//                     })}
//                   </>
//                 ) : (
//                   <>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Название</label>
//                       <input
//                         type="tel"
//                         name="name"
//                         value={hotel.name || ""}
//                         onChange={handleChange}
//                         disabled={!isEditing}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Мощность</label>
//                       <input
//                         type="number"
//                         name="capacity"
//                         value={hotel.capacity || ""}
//                         onChange={handleChange}
//                         disabled={!isEditing}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Рейтинг</label>
//                       <input
//                         type="text"
//                         name="stars"
//                         value={hotel.stars || ""}
//                         onChange={handleChange}
//                         disabled={user?.hotelId ? true : !isEditing}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Звездность</label>
//                       <input
//                         type="text"
//                         name="usStars"
//                         value={hotel.usStars || ""}
//                         onChange={handleChange}
//                         disabled={user?.hotelId ? true : !isEditing}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label
//                         className={classes.airportDistance}
//                         style={
//                           menuOpen && width <= 1707
//                             ? { width: "18%" }
//                             : !menuOpen && width <= 1690
//                             ? { width: "20%" }
//                             : {}
//                         }
//                       >
//                         Удалённость от аэропорта (мин)
//                       </label>
//                       <input
//                         type="number"
//                         name="airportDistance"
//                         step={0.1}
//                         value={hotel.airportDistance || ""}
//                         onChange={handleChange}
//                         disabled={!isEditing}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     <div className={classes.hotelAbout_info_item_info}>
//                       <label>Описание</label>
//                       <textarea
//                         type="text"
//                         name="description"
//                         value={hotel.information?.description || ""}
//                         onChange={handleChange}
//                         disabled={!isEditing}
//                         style={!isEditing ? { resize: "none" } : null}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     {user?.airlineId ? null : (
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Изображение</label>
//                         <input
//                           type="file"
//                           name="images"
//                           onChange={handleFileChange}
//                           ref={fileInputRef}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     )}

//                     {user.role === roles.superAdmin ||
//                     user.role === roles.dispatcerAdmin ? (
//                       <div className={classes.hotelAbout_info_item}>
//                         <div
//                           className={classes.deleteHotel}
//                           onClick={openDeleteComponent}
//                         >
//                           Удалить гостиницу
//                           <img src="/delete.png" alt="" />
//                         </div>
//                       </div>
//                     ) : null}

//                     {showDelete && (
//                       <DeleteComponent
//                         remove={handleDeleteHotel}
//                         close={closeDeleteComponent}
//                         title={`Вы действительно хотите удалить гостиницу "${hotel?.name}"?`}
//                       />
//                     )}
//                   </>
//                 )}
//               </div>
//             ) : displayInfo == "schedule" ? (
//               <div className={classes.hotelAbout_info_block_meal}>
//                 <div className={classes.hotelAbout_info_label}>
//                   Расписание питания
//                 </div>
//                 {user?.airlineId &&
//                 user?.role !== roles.hotelAdmin &&
//                 user?.role !== roles.dispatcerAdmin &&
//                 user?.role !== roles.superAdmin ? (
//                   <>
//                     {renderField({
//                       label: "Завтрак",
//                       value: `с ${hotel?.breakfast?.start} до ${hotel?.breakfast?.end}`,
//                     })}
//                     {renderField({
//                       label: "Обед",
//                       value: `с ${hotel?.lunch?.start} до ${hotel?.lunch?.end}`,
//                     })}
//                     {renderField({
//                       label: "Ужин",
//                       value: `с ${hotel?.dinner?.start} до ${hotel?.dinner?.end}`,
//                     })}
//                   </>
//                 ) : (
//                   <>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Завтрак</label>
//                       <div className={classes.mealTime}>
//                         <label>с</label>
//                         <input
//                           type="time"
//                           name="breakfastStart"
//                           value={hotel.breakfast.start || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />

//                         <label>до</label>
//                         <input
//                           type="time"
//                           name="breakfastEnd"
//                           value={hotel.breakfast.end || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Обед</label>
//                       <div className={classes.mealTime}>
//                         <label>с</label>
//                         <input
//                           type="time"
//                           name="lunchStart"
//                           value={hotel.lunch.start || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />

//                         <label>до</label>
//                         <input
//                           type="time"
//                           name="lunchEnd"
//                           value={hotel.lunch.end || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Ужин</label>
//                       <div className={classes.mealTime}>
//                         <label>с</label>
//                         <input
//                           type="time"
//                           name="dinnerStart"
//                           value={hotel.dinner.start || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />

//                         <label>до</label>
//                         <input
//                           type="time"
//                           name="dinnerEnd"
//                           value={hotel.dinner.end || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>
//             ) : displayInfo == "requisites" && !user?.airlineId ? (
//               <div className={classes.hotelAbout_info_block}>
//                 {/* <div className={classes.hotelAbout_info_label}>Реквизиты</div> */}
//                 <div className={classes.hotelAbout_info_item}>
//                   <label>ИНН</label>
//                   <input
//                     type="text"
//                     name="inn"
//                     value={hotel.information?.inn || ""}
//                     onChange={handleChange}
//                     disabled={!isEditing}
//                     className={classes.hotelAbout_info_input}
//                   />
//                 </div>
//                 <div className={classes.hotelAbout_info_item}>
//                   <label>ОГРН</label>
//                   <input
//                     type="text"
//                     name="ogrn"
//                     value={hotel.information?.ogrn || ""}
//                     onChange={handleChange}
//                     disabled={!isEditing}
//                     className={classes.hotelAbout_info_input}
//                   />
//                 </div>
//                 <div className={classes.hotelAbout_info_item}>
//                   <label>Р/С</label>
//                   <input
//                     type="text"
//                     name="rs"
//                     value={hotel.information?.rs || ""}
//                     onChange={handleChange}
//                     disabled={!isEditing}
//                     className={classes.hotelAbout_info_input}
//                   />
//                 </div>
//                 <div className={classes.hotelAbout_info_item}>
//                   <label>В БАНКЕ</label>
//                   <input
//                     type="text"
//                     name="bank"
//                     value={hotel.information?.bank || ""}
//                     onChange={handleChange}
//                     disabled={!isEditing}
//                     className={classes.hotelAbout_info_input}
//                   />
//                 </div>
//                 <div className={classes.hotelAbout_info_item}>
//                   <label>БИК</label>
//                   <input
//                     type="text"
//                     name="bik"
//                     value={hotel.information?.bik || ""}
//                     onChange={handleChange}
//                     disabled={!isEditing}
//                     className={classes.hotelAbout_info_input}
//                   />
//                 </div>
//               </div>
//             ) : displayInfo === "rooms" ? (
//               <div
//                 className={
//                   user?.role === roles.airlineAdmin
//                     ? classes.hotelAbout_rooms_block__hotel
//                     : classes.hotelAbout_rooms_block
//                 }
//               >
//                 <div
//                   className={`${classes.rooms_wrapper} ${
//                     menuOpen && width <= 1578 ? classes.fb30 : ""
//                   }`}
//                 >
//                   {hotel.rooms?.map((room) => (
//                     <HotelAboutRoomBlock key={room.id} {...room} />
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div
//                 className={
//                   user?.airlineId
//                     ? classes.hotelAbout_info__contacts___airline
//                     : classes.hotelAbout_info__contacts
//                 }
//                 style={
//                   menuOpen && width <= 1650
//                     ? { flexDirection: "column" }
//                     : {}
//                 }
//               >
//                 <div
//                   className={classes.hotelAbout_info_block}
//                   style={menuOpen ? { width: "70%" } : {}}
//                 >
//                   <div className={classes.hotelAbout_info_label}>Адрес</div>
//                   {user?.airlineId &&
//                   user?.role !== roles.hotelAdmin &&
//                   user?.role !== roles.dispatcerAdmin &&
//                   user?.role !== roles.superAdmin ? (
//                     <>
//                       {renderField({
//                         label: "Страна",
//                         value: hotel.information?.country,
//                       })}
//                       {renderField({
//                         label: "Город",
//                         value: hotel.information?.city,
//                       })}
//                       {renderField({
//                         label: "Улица",
//                         value: hotel.information?.address,
//                       })}
//                       {renderField({
//                         label: "Индекс",
//                         value: hotel.information?.index,
//                       })}
//                       {/* {renderField({
//                         label: "Расстояние до аэропорта",
//                         value: hotel?.airportDistance,
//                       })} */}
//                     </>
//                   ) : (
//                     <>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Страна</label>
//                         <input
//                           type="text"
//                           name="country"
//                           value={hotel.information?.country || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Город</label>
//                         <MUIAutocomplete
//                           dropdownWidth={"400px"}
//                           isDisabled={!isEditing}
//                           options={cities}
//                           getOptionLabel={(option) => option.label}
//                           value={
//                             cities.find(
//                               (option) =>
//                                 option.value === hotel.information?.city
//                             ) || ""
//                           }
//                           onChange={(event, newValue) => {
//                             setHotel((prevHotel) => ({
//                               ...prevHotel,
//                               information: {
//                                 ...prevHotel.information,
//                                 city: newValue ? newValue.value : "", // Обновляем поле `city`
//                               },
//                             }));
//                           }}
//                         />

//                         {/* <input
//                       type="text"
//                       name="city"
//                       value={hotel.information?.city || ""}
//                       onChange={handleChange}
//                       disabled={!isEditing}
//                       className={classes.hotelAbout_info_input}
//                     /> */}
//                       </div>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Улица</label>
//                         <input
//                           type="text"
//                           name="address"
//                           value={hotel.information?.address || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Индекс</label>
//                         <input
//                           type="text"
//                           name="index"
//                           value={hotel.information?.index || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     </>
//                   )}
//                 </div>
//                 <div
//                   className={classes.hotelAbout_info_block}
//                   style={menuOpen ? { width: "70%" } : {}}
//                 >
//                   <div className={classes.hotelAbout_info_label}>Контакты</div>
//                   {user?.airlineId ? (
//                     <>
//                       {renderField({
//                         label: "Почта",
//                         value: "KarsAvia",
//                       })}
//                       {renderField({
//                         label: "Телефон",
//                         value: "8-818-888-88-88",
//                       })}
//                       {renderField({
//                         label: "Ссылка",
//                         value: "KarsAvia",
//                       })}
//                     </>
//                   ) : (
//                     <>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Почта</label>
//                         <input
//                           type="email"
//                           name="email"
//                           // value={hotel.email || ""}
//                           value={"KarsAvia"}
//                           // onChange={handleChange}
//                           disabled={true}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Телефон</label>
//                         <input
//                           type="tel"
//                           name="number"
//                           // value={hotel.number || ""}
//                           value={"8-818-888-88-88"}
//                           // onChange={handleChange}
//                           disabled={true}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Ссылка</label>
//                         <input
//                           type="tel"
//                           name="link"
//                           // value={hotel.link || ""}
//                           value={"KarsAvia"}
//                           // onChange={handleChange}
//                           disabled={true}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     </>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//           <Logs
//             type={"hotel"}
//             queryLog={GET_HOTEL_LOGS}
//             queryID={"hotelId"}
//             id={id}
//             show={showLogsSidebar}
//             onClose={toggleLogsSidebar}
//             name={hotel?.name}
//           />
//           {notifications.map((n, index) => (
//             <Notification
//               key={n.id}
//               text={n.text}
//               status={n.status}
//               index={index}
//               time={notifyTime}
//               onClose={() => {
//                 setNotifications((prev) =>
//                   prev.filter((notif) => notif.id !== n.id)
//                 );
//               }}
//             />
//           ))}
//         </div>
//       )}
//     </>
//   );
// }

// export default HotelAbout_tabComponent;
