import React, { useEffect, useRef, useState } from "react";
import classes from "./AirlineAbout_tabComponent.module.css";
import { requestsAirlanes } from "../../../requests.js";
import Button from "../../Standart/Button/Button.jsx";
import {
  decodeJWT,
  GET_AIRLINE,
  GET_AIRLINE_LOGS,
  GET_CITIES,
  getCookie,
  server,
  UPDATE_AIRLINE,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import { fullNotifyTime, notifyTime, roles } from "../../../roles.js";
import Logs from "../LogsHistory/Logs.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import Notification from "../../Notification/Notification.jsx";

function AirlineAbout_tabComponent({ id, ...props }) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const [displayInfo, setDisplayInfo] = useState("generalInfo");
  const [showLogsSidebar, setShowLogsSidebar] = useState(false);
  const [menuOpen, setMenuOpen] = useState(() => {
    return JSON.parse(localStorage.getItem("menuOpen")) ?? true;
  });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const updateState = () => {
      setMenuOpen(JSON.parse(localStorage.getItem("menuOpen")));
    };

    // Отслеживание изменений localStorage в других вкладках
    window.addEventListener("storage", updateState);

    // Перехват изменений в текущей вкладке
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);
      if (key === "menuOpen") {
        updateState(); // Обновляем состояние
      }
    };

    return () => {
      window.removeEventListener("storage", updateState);
      localStorage.setItem = originalSetItem; // Возвращаем исходный метод
    };
  }, []);
  // console.log(menuOpen);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleLogsSidebar = () => setShowLogsSidebar(!showLogsSidebar);

  const { loading, error, data } = useQuery(GET_AIRLINE, {
    variables: { airlineId: id },
  });

  let infoCities = useQuery(GET_CITIES);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (infoCities.data) {
      setCities(
        infoCities.data?.citys.map(
          // (item) => `${item.city}, регион: ${item.region}`
          (item) => item.city
        ) || []
      );
    }
  }, [infoCities]);

  const [airline, setAirline] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newImage, setNewImage] = useState(null);

  const [updateAirline] = useMutation(UPDATE_AIRLINE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  useEffect(() => {
    if (data) {
      setAirline(data.airline);
    }
  }, [data]);

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

  const handleEditClick = async () => {
    if (isEditing) {
      setIsLoading(true);
      try {
        let response = await updateAirline({
          variables: {
            updateAirlineId: airline.id,
            input: {
              name: airline.name,
              information: {
                country: airline.information?.country,
                city: airline.information?.city,
                address: airline.information?.address,
                bank: airline.information?.bank,
                bik: airline.information?.bik,
                email: airline.information?.email,
                index: airline.information?.index,
                inn: airline.information?.inn,
                number: airline.information?.number,
                ogrn: airline.information?.ogrn,
                rs: airline.information?.rs,
              },
            },
            images: newImage ? [newImage] : null,
          },
        });
        // console.log(response);
        addNotification(
          "Редактирование авиакомпании прошло успешно.",
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
        //   "Редактирование авиакомпании прошло успешно.",
        //   "success"
        // );
      }
    }
    setIsEditing(!isEditing);
  };

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const maxSizeInBytes = 8 * 1024 * 1024; // 8 MB
    if (file.size > maxSizeInBytes) {
      alert("Размер файла не должен превышать 8 МБ!");
      setAirline((prevState) => ({
        ...prevState,
        images: [`${data.airline.images[0]}`],
      }));

      if (fileInputRef.current) {
        fileInputRef.current.value = null; // Сброс значения в DOM-элементе
      }
      return;
    }

    if (file) {
      setNewImage(file); // Сохраняем объект файла
      const imageUrl = URL.createObjectURL(file); // Создаем URL для отображения
      setAirline((prevState) => ({
        ...prevState,
        images: [imageUrl], // Обновляем URL изображения для отображения
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setAirline((prev) => {
      // Проверяем, обновляется ли поле в `information`
      if (Object.keys(prev.information || {}).includes(name)) {
        return {
          ...prev,
          information: {
            ...prev.information,
            [name]: value, // Обновляем только нужное поле в `information`
          },
        };
      }

      // Обновление верхнеуровневых полей
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  // console.log(user);

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

      {!loading && !isLoading && !error && airline && (
        <div
          className={classes.airlineAbout}
          style={user?.airlineId ? { height: "calc(100vh - 130px)" } : {}}
        >
          <div className={classes.column}>
            <div className={classes.airlineAbout_top}>
              <div className={classes.airlineAbout_top_complete}>
                <div className={classes.airlineAbout_top_img}>
                  <img
                    src={
                      newImage
                        ? URL.createObjectURL(newImage)
                        : `${server}${airline.images[0]}`
                    }
                    alt={airline.name}
                  />
                </div>
                <div className={classes.airlineAbout_top_title}>
                  <div className={classes.airlineAbout_top_title_name}>
                    {airline.name}
                  </div>
                  <div className={classes.airlineAbout_top_title_desc}>
                    <img src="/map.png" alt="" />
                    {airline.information?.city}, {airline.information?.address}
                  </div>
                </div>
              </div>
              <div className={classes.airlineAbout_top_button}>
                {(user?.role == roles.superAdmin ||
                  user?.role == roles.airlineAdmin ||
                  user?.role == roles.dispatcerAdmin) && (
                  <>
                    <div className={classes.airlineAbout_info__filters}>
                      {/* <Button onClick={toggleLogsSidebar}>История</Button> */}
                      <button onClick={toggleLogsSidebar}>История</button>
                    </div>
                    <Button onClick={handleEditClick}>
                      {isEditing ? "Сохранить" : "Редактировать"}
                    </Button>
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
                Контакты и адрес
              </button>
            </div>
          </div>
          <div className={classes.airlineAbout_info}>
            {displayInfo == "generalInfo" ? (
              <div
                className={`${classes.column} ${
                  menuOpen && windowWidth <= 1575 ? classes.w70 : classes.w50
                }`}
              >
                {
                  // user?.hotelId &&
                  user?.role !== roles.airlineAdmin &&
                  user?.role !== roles.dispatcerAdmin &&
                  user?.role !== roles.superAdmin ? (
                    <>
                      {renderField({ label: "Название", value: airline?.name })}
                    </>
                  ) : (
                    <>
                      <div className={classes.airlineAbout_info_item}>
                        <label>Название</label>
                        <input
                          type="text"
                          name="name"
                          value={airline.name || ""}
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
                    menuOpen && windowWidth <= 1580
                      ? {
                          flexDirection: "column",
                          height: "100%",
                          overflow: "scroll",
                        }
                      : !menuOpen && windowWidth < 1305
                      ? { flexDirection: "column" }
                      : {}
                  }
                >
                  <div
                    className={`${classes.column} ${
                      menuOpen && windowWidth <= 1600
                        ? classes.w60
                        : classes.w50
                    }`}
                  >
                    <div className={classes.airlineAbout_info_label}>Адрес</div>
                    {user?.role !== roles.airlineAdmin &&
                    user?.role !== roles.dispatcerAdmin &&
                    user?.role !== roles.superAdmin ? (
                      <>
                        {renderField({
                          label: "Страна",
                          value: airline.information?.country,
                        })}
                        {renderField({
                          label: "Город",
                          value: airline.information?.city,
                        })}
                        {renderField({
                          label: "Улица",
                          value: airline.information?.address,
                        })}
                        {renderField({
                          label: "Индекс",
                          value: airline.information?.index,
                        })}
                      </>
                    ) : (
                      <>
                        <div className={classes.airlineAbout_info_item}>
                          <label>Страна</label>
                          <input
                            type="text"
                            name="country"
                            value={airline.information?.country || ""}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={classes.airlineAbout_info_input}
                          />
                        </div>
                        <div className={classes.airlineAbout_info_item}>
                          <label>Город</label>
                          <MUIAutocomplete
                            dropdownWidth={"400px"}
                            isDisabled={!isEditing}
                            options={cities}
                            value={airline.information?.city || ""}
                            onChange={(event, newValue) => {
                              setAirline((prev) => ({
                                ...prev,
                                information: {
                                  ...prev.information,
                                  city: newValue || "", // Обновляем поле `city`
                                },
                              }));
                            }}
                          />
                          {/* <input
                        type="text"
                        name="city"
                        value={airline.information?.city || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      /> */}
                        </div>
                        <div className={classes.airlineAbout_info_item}>
                          <label>Улица</label>
                          <input
                            type="text"
                            name="address"
                            value={airline.information?.address || ""}
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
                            value={airline.information?.index || ""}
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
                      menuOpen && windowWidth <= 1600
                        ? classes.w60
                        : classes.w50
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
                        value={airline.information?.email || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                      <label>Телефон</label>
                      <input
                        type="tel"
                        name="number"
                        value={airline.information?.number || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={classes.airlineAbout_info_block}>
                  <div
                    className={`${classes.column} ${
                      menuOpen && windowWidth <= 1575
                        ? classes.w70
                        : !menuOpen && windowWidth <= 1280
                        ? classes.w60
                        : classes.w50
                    }`}
                  >
                    <div className={classes.airlineAbout_info_item}>
                      <label>ИНН</label>
                      <input
                        type="text"
                        name="inn"
                        value={airline.information?.inn || ""}
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
                        value={airline.information?.ogrn || ""}
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
                        value={airline.information?.rs || ""}
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
                        value={airline.information?.bank || ""}
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
                        value={airline.information?.bik || ""}
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
          <Logs
            type={"airline"}
            queryLog={GET_AIRLINE_LOGS}
            queryID={"airlineId"}
            id={id}
            show={showLogsSidebar}
            onClose={toggleLogsSidebar}
            name={airline?.name}
          />
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

export default AirlineAbout_tabComponent;
