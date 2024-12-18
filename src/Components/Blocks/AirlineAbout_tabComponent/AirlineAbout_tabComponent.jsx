import React, { useEffect, useState } from "react";
import classes from "./AirlineAbout_tabComponent.module.css";
import { requestsAirlanes } from "../../../requests.js";
import Button from "../../Standart/Button/Button.jsx";
import {
  decodeJWT,
  GET_AIRLINE,
  getCookie,
  server,
  UPDATE_AIRLINE,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import { roles } from "../../../roles.js";

function AirlineAbout_tabComponent({ id, ...props }) {
  const [userRole, setUserRole] = useState();
  const token = getCookie("token");

  const [displayInfo, setDisplayInfo] = useState("generalInfo");

  useEffect(() => {
    setUserRole(decodeJWT(token).role);
  }, [token]);

  const { loading, error, data } = useQuery(GET_AIRLINE, {
    variables: { airlineId: id },
  });

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

  const handleEditClick = async () => {
    if (isEditing) {
      try {
        await updateAirline({
          variables: {
            updateAirlineId: airline.id,
            input: {
              name: airline.name,
              country: airline.country,
              city: airline.city,
              address: airline.address,
              bank: airline.bank,
              bik: airline.bik,
              email: airline.email,
              index: airline.index,
              inn: airline.inn,
              number: airline.number,
              ogrn: airline.ogrn,
              rs: airline.rs,
            },
            images: newImage ? [newImage] : null,
          },
        });
        // alert('Данные успешно сохранены');
      } catch (err) {
        console.error("Произошла ошибка при сохранении данных", err);
      }
    }
    setIsEditing(!isEditing);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
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
    setAirline({
      ...airline,
      [name]: value,
    });
  };

  return (
    <>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}

      {!loading && !error && airline && (
        <div className={classes.airlineAbout}>
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
                    {airline.city}, {airline.address}
                  </div>
                </div>
              </div>
              <div className={classes.airlineAbout_top_button}>
                {(userRole == roles.superAdmin ||
                  userRole == roles.hotelAdmin ||
                  userRole == roles.dispatcerAdmin) && (
                  <Button onClick={handleEditClick}>
                    {isEditing ? "Сохранить" : "Редактировать"}
                  </Button>
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
              <div className={`${classes.column} ${classes.w50}`}>
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
                    disabled={!isEditing}
                    className={classes.airlineAbout_info_input}
                  />
                </div>
              </div>
            ) : displayInfo == "contacts" ? (
              <>
                <div className={classes.airlineAbout_info_block}>
                  <div className={`${classes.column} ${classes.w50}`}>
                    <div className={classes.airlineAbout_info_label}>Адрес</div>
                    <div className={classes.airlineAbout_info_item}>
                      <label>Страна</label>
                      <input
                        type="text"
                        name="country"
                        value={airline.country}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                      <label>Город</label>
                      <input
                        type="text"
                        name="city"
                        value={airline.city}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      />
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                      <label>Улица</label>
                      <input
                        type="text"
                        name="address"
                        value={airline.address}
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
                        value={airline.index}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={classes.airlineAbout_info_input}
                      />
                    </div>
                  </div>

                  <div className={`${classes.column} ${classes.w50}`}>
                    <div className={classes.airlineAbout_info_label}>
                      Контакты
                    </div>
                    <div className={classes.airlineAbout_info_item}>
                      <label>Почта</label>
                      <input
                        type="email"
                        name="email"
                        value={airline.email}
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
                        value={airline.number}
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
                  <div className={`${classes.column} ${classes.w50}`}>
                    <div className={classes.airlineAbout_info_item}>
                      <label>ИНН</label>
                      <input
                        type="text"
                        name="inn"
                        value={airline.inn}
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
                        value={airline.ogrn}
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
                        value={airline.rs}
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
                        value={airline.bank}
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
                        value={airline.bik}
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
        </div>
      )}
    </>
  );
}

export default AirlineAbout_tabComponent;
