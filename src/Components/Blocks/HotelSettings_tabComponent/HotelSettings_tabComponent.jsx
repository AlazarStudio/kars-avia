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
import AvatarUpload from "../AvatarUpload/AvatarUpload.jsx";
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

  const handleFileChange = (file) => {
    if (!file) {
      setNewImage(null);
      setHotel((prevState) => ({
        ...prevState,
        images: data?.hotel?.images ?? null,
      }));
      return;
    }
    const maxSizeInBytes = 8 * 1024 * 1024; // 8 MB
    if (file.size > maxSizeInBytes) {
      showAlert("Размер файла не должен превышать 8 МБ!");
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
                {!user?.hotelId && (
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
                )}
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
                {!user?.hotelId && (
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
                )}
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
                    <div className={`${classes.fileRow} ${classes.avatarFileRow}`}>
                      <span className={classes.fileLabel}>Аватарка</span>
                      <AvatarUpload
                        value={newImage}
                        onChange={handleFileChange}
                        onError={showAlert}
                        label="Загрузить изображение"
                        variant="image"
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
                  {!user?.hotelId && (
                    <MUISwitch
                      label="Видимость гостиницы"
                      checked={hotel.show}
                      onChange={(e) =>
                        setHotel((prev) => ({ ...prev, show: e.target.checked }))
                      }
                      width={"350px"}
                      disabled={!isEditing}
                    />
                  )}
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
                      name="email"
                      value={hotel.information?.email || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`${classes.fieldInput} ${classes.fieldInputWide}`}
                    />
                  </div>
                  <div className={classes.fieldRow}>
                    <span className={classes.fieldLabel}>Телефон</span>
                    <input
                      type="tel"
                      name="number"
                      value={hotel.information?.number || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
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