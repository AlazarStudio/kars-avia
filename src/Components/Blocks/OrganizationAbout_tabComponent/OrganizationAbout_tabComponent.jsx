import React, { useEffect, useRef, useState } from "react";
import classes from "./OrganizationAbout_tabComponent.module.css";
import { requestsAirlanes } from "../../../requests.js";
import Button from "../../Standart/Button/Button.jsx";
import {
  decodeJWT,
  GET_AIRLINE,
  GET_AIRLINE_LOGS,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_CITIES,
  GET_ORGANIZATION,
  getCookie,
  ORGANIZATION_CREATED_SUBSCRIPTION,
  server,
  UPDATE_AIRLINE,
  UPDATE_ORGANIZATION,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  fullNotifyTime,
  menuAccess,
  notifyTime,
  roles,
} from "../../../roles.js";
import Logs from "../LogsHistory/Logs.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import Notification from "../../Notification/Notification.jsx";
import { InputMask } from "@react-input/mask";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import RequisitesIcon from "../../../shared/icons/RequisitesIcon.jsx";
import { useLocalStorage } from "../../../hooks/useLocalStorage.jsx";
import { useWindowSize } from "../../../hooks/useWindowSize.jsx";
import HomeIcon from "../../../shared/icons/HomeIcon.jsx";

function OrganizationAbout_tabComponent({ id, accessMenu, ...props }) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const [displayInfo, setDisplayInfo] = useState("generalInfo");
  const [showLogsSidebar, setShowLogsSidebar] = useState(false);
  const [menuOpen] = useLocalStorage("menuOpen", true);
  const { width } = useWindowSize();

  const toggleLogsSidebar = () => setShowLogsSidebar(!showLogsSidebar);

  const { loading, error, data, refetch } = useQuery(GET_ORGANIZATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { organizationId: id },
  });

  const { data: dataSubscriptionUpd } = useSubscription(
    ORGANIZATION_CREATED_SUBSCRIPTION,
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
  const [cities, setCities] = useState([]);

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

  const [organization, setOrganization] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newImage, setNewImage] = useState(null);

  const [updateAirline] = useMutation(UPDATE_ORGANIZATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  // 1. начальная загрузка / обновление, но только когда не редактируем
  useEffect(() => {
    if (!data?.organization) return;

    // если сейчас не редактируем — можно синхронизировать с сервером
    if (!isEditing) {
      setOrganization(data.organization);
    }
  }, [data, isEditing]);

  // 2. подписка: если пришло обновление — рефетчим,
  //   но НЕ во время редактирования, чтобы не сбивать форму
  useEffect(() => {
    if (dataSubscriptionUpd && !isEditing) {
      refetch();
    }
  }, [dataSubscriptionUpd, isEditing, refetch]);

  // console.log(data);

  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };
// console.log(newImage);

  const handleEditClick = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !emailRegex.test(organization.information?.email) &&
      organization.information?.email
    ) {
      alert("Введите корректный email.");
      setIsLoading(false);
      return;
    }
    if (isEditing) {
      setIsLoading(true);
      try {
        let response = await updateAirline({
          variables: {
            updateOrganizationId: organization.id,
            input: {
              name: organization.name,
              information: {
                country: organization.information?.country,
                city: organization.information?.city,
                address: organization.information?.address,
                bank: organization.information?.bank,
                bik: organization.information?.bik,
                email: organization.information?.email,
                index: organization.information?.index,
                inn: organization.information?.inn,
                number: organization.information?.number,
                ogrn: organization.information?.ogrn,
                rs: organization.information?.rs,
              },
            },
            images: newImage ? [newImage] : null,
          },
        });
        // console.log(response);
        addNotification(
          "Редактирование организации прошло успешно.",
          "success"
        );

        // alert('Данные успешно сохранены');
      } catch (err) {
        console.error("Произошла ошибка при сохранении данных", err);
        alert("Произошла ошибка при сохранении данных");
        // addNotification("Произошла ошибка при сохранении данных", "error")
      } finally {
        setIsLoading(false);
        // addNotification(
        //   "Редактирование организации прошло успешно.",
        //   "success"
        // );
      }
    }
    setIsEditing(!isEditing);
  };
// console.log(organization);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const maxSizeInBytes = 8 * 1024 * 1024; // 8 MB
    if (file.size > maxSizeInBytes) {
      alert("Размер файла не должен превышать 8 МБ!");
      setOrganization((prevState) => ({
        ...prevState,
        images: [`${data.organization.images[0]}`],
      }));

      if (fileInputRef.current) {
        fileInputRef.current.value = null; // Сброс значения в DOM-элементе
      }
      return;
    }

    if (file) {
      setNewImage(file); // Сохраняем объект файла
      const imageUrl = URL.createObjectURL(file); // Создаем URL для отображения
      setOrganization((prevState) => ({
        ...prevState,
        images: [imageUrl], // Обновляем URL изображения для отображения
      }));
    }
  };

  const INFO_FIELDS = new Set([
    "country",
    "city",
    "address",
    "bank",
    "bik",
    "email",
    "index",
    "inn",
    "number",
    "ogrn",
    "rs",
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrganization((prev) =>
      INFO_FIELDS.has(name)
        ? { ...prev, information: { ...prev.information, [name]: value } }
        : { ...prev, [name]: value }
    );
  };

  const renderField = ({ label, value }) => {
    return (
      <div className={classes.airlineAbout_info_item}>
        <label style={{ flexBasis: "50%" }}>{label}</label>
        <div
          className={classes.hotelAbout_info_value}
          style={{ width: "400px" }}
        >
          {value || " "}
        </div>
      </div>
    );
  };

  return (
    <>
      {error && <p>Error: {error.message}</p>}
      {(loading || isLoading) && <MUILoader fullHeight={"70vh"} />}

      {!loading && !isLoading && !error && organization && (
        <div
          className={classes.airlineAbout}
          // style={user?.airlineId ? { height: "calc(100vh - 130px)" } : {}}
        >
          <div className={classes.column}>
            <div className={classes.airlineAbout_top}>
              <div className={classes.airlineAbout_top_complete}>
                <div className={classes.airlineAbout_top_img}>
                  <img
                    src={
                      newImage
                        ? URL.createObjectURL(newImage)
                        : organization.images && organization.images.length > 0 ? `${server}${organization?.images?.[0]}`
                        : "/no-avatar.png"
                    }
                    alt={organization.name}
                  />
                </div>
                <div className={classes.airlineAbout_top_title}>
                  <div className={classes.airlineAbout_top_title_name}>
                    {organization.name}
                  </div>
                  <div className={classes.airlineAbout_top_title_desc}>
                    <img src="/map.png" alt="" />
                    {organization.information?.city},{" "}
                    {organization.information?.address}
                  </div>
                </div>
              </div>
              <div className={classes.airlineAbout_top_button}>
                {(user?.role == roles.superAdmin ||
                  user?.role == roles.airlineAdmin ||
                  user?.role == roles.dispatcerAdmin) && (
                  <>
                    {/* <div className={classes.airlineAbout_info__filters}>
                      <button onClick={toggleLogsSidebar}>
                        <img src="/scheduleIcon.png" alt="" />
                        История
                      </button>
                    </div> */}
                    {(!user?.airlineId || accessMenu?.airlineUpdate) && (
                      <Button onClick={handleEditClick}>
                        <img
                          src={isEditing ? "/save.png" : "/editIcon.png"}
                          alt=""
                        />
                        {isEditing ? "Сохранить" : "Редактировать"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className={classes.airlineAbout_info__filters}>
              <button
                className={
                  displayInfo == "generalInfo" ? classes.activeButton : null
                }
                onClick={() => {
                  setDisplayInfo("generalInfo");
                }}
              >
                {/* <img src="/houseIcon.png" alt="" />  */}
                <HomeIcon />
                Общая информация
              </button>
              <button
                className={
                  displayInfo == "requisites" ? classes.activeButton : null
                }
                onClick={() => {
                  setDisplayInfo("requisites");
                }}
              >
                {/* <img src="/requisitesIcon.svg" alt="" />  */}
                <RequisitesIcon />
                Реквизиты
              </button>
              <button
                className={
                  displayInfo == "contacts" ? classes.activeButton : null
                }
                onClick={() => {
                  setDisplayInfo("contacts");
                }}
              >
                <img src="/contacts_icon.png" alt="" /> Контакты и адрес
              </button>
            </div>
          </div>
          <div className={classes.airlineAbout_info}>
            {displayInfo == "generalInfo" ? (
              <div
                className={`${classes.column} ${
                  menuOpen && width <= 1600 ? classes.w70 : classes.w50
                }`}
              >
                {
                  // user?.hotelId &&
                  user?.role !== roles.airlineAdmin &&
                  user?.role !== roles.dispatcerAdmin &&
                  user?.role !== roles.superAdmin ? (
                    <>
                      {renderField({
                        label: "Название",
                        value: organization?.name,
                      })}
                    </>
                  ) : (
                    <>
                      <div className={classes.airlineAbout_info_item}>
                        <label>Название</label>
                        <input
                          type="text"
                          name="name"
                          value={organization.name || ""}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={classes.airlineAbout_info_input}
                        />
                      </div>

                      <div className={classes.airlineAbout_info_item}>
                        <label>Изображение</label>
                        <input
                          type="file"
                          name="images"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          disabled={!isEditing}
                          className={classes.airlineAbout_info_input}
                        />
                      </div>
                    </>
                  )
                }
              </div>
            ) : displayInfo == "contacts" ? (
              <>
                <div
                  className={
                    user?.role === roles.airlineAdmin
                      ? classes.airlineAbout_info_block
                      : classes.airlineAbout_info_block__airline
                  }
                  style={
                    menuOpen && width <= 1580
                      ? {
                          flexDirection: "column",
                          height: "100%",
                          overflow: "scroll",
                        }
                      : !menuOpen && width < 1305
                      ? { flexDirection: "column" }
                      : {}
                  }
                >
                  <div
                    className={`${classes.column} ${
                      menuOpen && width <= 1600 ? classes.w60 : classes.w50
                    }`}
                  >
                    <div className={classes.airlineAbout_info_label}>Адрес</div>
                    {user?.role !== roles.airlineAdmin &&
                    user?.role !== roles.dispatcerAdmin &&
                    user?.role !== roles.superAdmin ? (
                      <>
                        {renderField({
                          label: "Страна",
                          value: organization.information?.country,
                        })}
                        {renderField({
                          label: "Город",
                          value: organization.information?.city,
                        })}
                        {renderField({
                          label: "Улица",
                          value: organization.information?.address,
                        })}
                        {renderField({
                          label: "Индекс",
                          value: organization.information?.index,
                        })}
                      </>
                    ) : (
                      <>
                        <div className={classes.airlineAbout_info_item}>
                          <label>Страна</label>
                          <input
                            type="text"
                            name="country"
                            value={organization.information?.country || ""}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                          />
                        </div>
                        <div className={classes.airlineAbout_info_item}>
                          <label>Город</label>
                          <MUIAutocompleteColor
                            dropdownWidth="400px"
                            listboxHeight={"300px"}
                            isDisabled={!isEditing}
                            options={cities}
                            getOptionLabel={(option) =>
                              option
                                ? `${option.city} ${option.region}`.trim()
                                : ""
                            }
                            renderOption={(optionProps, option) => {
                              // Формируем строку для отображения
                              const labelText =
                                `${option.city} ${option.region}`.trim();
                              // Разбиваем строку по пробелам
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
                                (option) =>
                                  option.city === organization.information?.city
                              ) || null
                            }
                            onChange={(e, newValue) => {
                              setOrganization((prevAirline) => ({
                                ...prevAirline,
                                information: {
                                  ...prevAirline.information,
                                  city: newValue ? newValue.city : "", // Обновляем поле `city`
                                },
                              }));
                            }}
                          />
                        </div>
                        <div className={classes.airlineAbout_info_item}>
                          <label>Улица</label>
                          <input
                            type="text"
                            name="address"
                            value={organization.information?.address || ""}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                          />
                        </div>
                        <div className={classes.airlineAbout_info_item}>
                          <label>Индекс</label>
                          <input
                            type="text"
                            name="index"
                            value={organization.information?.index || ""}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    className={`${classes.column} ${
                      menuOpen && width <= 1600 ? classes.w60 : classes.w50
                    }`}
                  >
                    <div className={classes.airlineAbout_info_label}>
                      Контакты
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                      <label>Почта</label>
                      <input
                        type="email"
                        name="email"
                        value={organization.information?.email || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                      <label>Телефон</label>
                      <InputMask
                        className={classes.airlineAbout_info_input}
                        type="text"
                        mask="+7 (___) ___-__-__"
                        replacement={{ _: /\d/ }}
                        name="number"
                        value={organization.information?.number || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="+7 (___) ___-__-__"
                        autoComplete="new-password"
                      />
                      {/* <input
                        type="tel"
                        name="number"
                        value={organization.information?.number || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      /> */}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={classes.airlineAbout_info_block}>
                  <div
                    className={`${classes.column} ${
                      menuOpen && width <= 1575
                        ? classes.w70
                        : !menuOpen && width <= 1280
                        ? classes.w60
                        : classes.w50
                    }`}
                  >
                    <div className={classes.airlineAbout_info_item}>
                      <label>ИНН</label>
                      <input
                        type="text"
                        name="inn"
                        value={organization.information?.inn || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                      <label>ОГРН</label>
                      <input
                        type="text"
                        name="ogrn"
                        value={organization.information?.ogrn || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                      <label>Р/С</label>
                      <input
                        type="text"
                        name="rs"
                        value={organization.information?.rs || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                      <label>В БАНКЕ</label>
                      <input
                        type="text"
                        name="bank"
                        value={organization.information?.bank || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                      <label>БИК</label>
                      <input
                        type="text"
                        name="bik"
                        value={organization.information?.bik || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* <Logs
            type={"organization"}
            queryLog={GET_AIRLINE_LOGS}
            queryID={"airlineId"}
            id={id}
            show={showLogsSidebar}
            onClose={toggleLogsSidebar}
            name={organization?.name}
          /> */}
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
      )}
    </>
  );
}

export default OrganizationAbout_tabComponent;
