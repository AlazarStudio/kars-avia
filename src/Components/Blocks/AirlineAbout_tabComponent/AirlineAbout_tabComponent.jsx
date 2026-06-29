import React, { useEffect, useRef, useState } from "react";
import classes from "./AirlineAbout_tabComponent.module.css";
import Button from "../../Standart/Button/Button.jsx";
import {
  decodeJWT,
  GET_AIRLINE,
  GET_AIRLINE_LOGS,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_CITIES,
  getCookie,
  getMediaUrl,
  UPDATE_AIRLINE,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import { roles } from "../../../roles.js";
import Logs from "../LogsHistory/Logs.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import AvatarUpload from "../AvatarUpload/AvatarUpload.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";
import { InputMask } from "@react-input/mask";
import HomeIcon from "../../../shared/icons/HomeIcon.jsx";
import RequisitesIcon from "../../../shared/icons/RequisitesIcon.jsx";
import ContactsIcon from "../../../shared/icons/ContactsIcon.jsx";
import PinIcon from "../../../shared/icons/PinIcon.jsx";
import ScheduleIcon from "../../../shared/icons/ScheduleIcon.jsx";
import AirlineReadinessIndicator from "../AirlineReadinessIndicator/AirlineReadinessIndicator";

function AirlineAbout_tabComponent({ id, accessMenu }) {
  const token = getCookie("token");
  const user = decodeJWT(token);
  const { showAlert } = useDialog();
  const { success, error: notifyError } = useToast();

  const [displayInfo, setDisplayInfo] = useState("generalInfo");
  const [showLogsSidebar, setShowLogsSidebar] = useState(false);

  const toggleLogsSidebar = () => setShowLogsSidebar(!showLogsSidebar);

  const { loading, error, data, refetch } = useQuery(GET_AIRLINE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { airlineId: id },
  });

  const { data: dataSubscriptionUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION,
    { context: { headers: { Authorization: `Bearer ${token}` } } }
  );

  let infoCities = useQuery(GET_CITIES, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (infoCities.data) {
      setCities(infoCities.data?.citys);
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
    if (!data?.airline) return;
    if (!isEditing) {
      setAirline(data.airline);
    }
  }, [data, isEditing]);

  useEffect(() => {
    if (dataSubscriptionUpd && !isEditing) {
      refetch();
    }
  }, [dataSubscriptionUpd, isEditing, refetch]);

  const [isLoading, setIsLoading] = useState(false);

  const handleEditClick = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !emailRegex.test(airline.information?.email) &&
      airline.information?.email
    ) {
      showAlert("Введите корректный email.");
      return;
    }
    if (isEditing) {
      setIsLoading(true);
      try {
        await updateAirline({
          variables: {
            updateAirlineId: airline.id,
            input: {
              name: airline.name,
              nameFull: airline.nameFull,
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
        success("Редактирование авиакомпании прошло успешно.");
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
    if (!file) { setNewImage(null); return; }
    const maxSizeInBytes = 8 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      showAlert("Размер файла не должен превышать 8 МБ!");
      return;
    }
    setNewImage(file);
    const imageUrl = URL.createObjectURL(file);
    setAirline((prevState) => ({
      ...prevState,
      images: [imageUrl],
    }));
  };

  const INFO_FIELDS = new Set([
    "country", "city", "address", "bank", "bik", "email", "index", "inn", "number", "ogrn", "rs",
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAirline((prev) =>
      INFO_FIELDS.has(name)
        ? { ...prev, information: { ...prev.information, [name]: value } }
        : { ...prev, [name]: value }
    );
  };

  const canEdit =
    user?.role === roles.superAdmin ||
    user?.role === roles.airlineAdmin ||
    user?.role === roles.dispatcerAdmin;

  const avatarSrc = newImage
    ? URL.createObjectURL(newImage)
    : getMediaUrl(airline?.images?.[0]) ?? "/no-avatar.png";

  const locationLine = [airline?.information?.city, airline?.information?.address]
    .filter(Boolean)
    .join(", ");

  const TABS = [
    { key: "generalInfo", label: "Общая информация", icon: <HomeIcon /> },
    { key: "requisites", label: "Реквизиты", icon: <RequisitesIcon /> },
    { key: "contacts", label: "Контакты и адрес", icon: <ContactsIcon /> },
  ];

  return (
    <>
      {error && <p>Error: {error.message}</p>}
      {(loading || isLoading) && <MUILoader fullHeight={"70vh"} />}

      {!loading && !isLoading && !error && airline && (
        <div
          className={classes.card}
          style={user?.airlineId ? { height: "calc(100vh - 130px)" } : {}}
        >
          <div className={classes.header}>
            <div className={classes.headerLeft}>
              <div className={classes.avatar}>
                <img src={avatarSrc} alt={airline.name} />
              </div>
              <div className={classes.headerInfo}>
                <div
                  className={classes.headerName}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {airline.name}
                  {user?.role === roles.airlineAdmin && (
                    <AirlineReadinessIndicator airline={airline} />
                  )}
                </div>
                {locationLine && (
                  <div className={classes.headerLocation}>
                    <PinIcon />
                    {locationLine}
                  </div>
                )}
              </div>
            </div>
            {canEdit && (
              <div className={classes.headerActions}>
                <button
                  type="button"
                  className={classes.historyBtn}
                  onClick={toggleLogsSidebar}
                >
                  <ScheduleIcon /> История
                </button>
                {(!user?.airlineId || accessMenu?.airlineUpdate) && (
                  <Button onClick={handleEditClick}>
                    <img
                      src={isEditing ? "/save.png" : "/editIcon.png"}
                      alt=""
                      style={{ width: 16, height: 16 }}
                    />
                    {isEditing ? "Сохранить" : "Редактировать"}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className={classes.tabs}>
            {TABS.map(({ key, label, icon }) => (
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
              <div className={`${classes.formSection} ${classes.formSectionHalf}`}>
                <div className={classes.sectionTitle}>Основные данные</div>
                <div className={classes.fieldRow}>
                  <span className={classes.fieldLabel}>Название</span>
                  <input
                    type="text"
                    name="name"
                    value={airline.name || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={classes.fieldInput}
                  />
                </div>
                {isEditing && (
                  <div className={classes.fileRow}>
                    <span className={classes.fileLabel}>Изображение</span>
                    <AvatarUpload
                      value={newImage}
                      onChange={handleFileChange}
                      onError={showAlert}
                      label="Загрузить изображение"
                      variant="image"
                    />
                  </div>
                )}
              </div>
            )}

            {displayInfo === "requisites" && (
              <div className={`${classes.formSection} ${classes.formSectionHalf}`}>
                <div className={classes.sectionTitle}>Юридические данные</div>
                {[
                  { name: "nameFull", label: "Наименование", value: airline.nameFull },
                  { name: "inn", label: "ИНН", value: airline.information?.inn },
                  { name: "ogrn", label: "ОГРН", value: airline.information?.ogrn },
                  { name: "rs", label: "Р/С", value: airline.information?.rs },
                  { name: "bank", label: "В банке", value: airline.information?.bank },
                  { name: "bik", label: "БИК", value: airline.information?.bik },
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
                      value={airline.information?.country || ""}
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
                          (option) => option.city === airline.information?.city
                        ) || null
                      }
                      onChange={(e, newValue) => {
                        setAirline((prev) => ({
                          ...prev,
                          information: {
                            ...prev.information,
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
                      value={airline.information?.address || ""}
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
                      value={airline.information?.index || ""}
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
                      value={airline.information?.email || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`${classes.fieldInput} ${classes.fieldInputWide}`}
                    />
                  </div>
                  <div className={classes.fieldRow}>
                    <span className={classes.fieldLabel}>Телефон</span>
                    <InputMask
                      className={`${classes.fieldInput} ${classes.fieldInputWide}`}
                      type="text"
                      mask="+7 (___) ___-__-__"
                      replacement={{ _: /\d/ }}
                      name="number"
                      value={airline.information?.number || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="+7 (___) ___-__-__"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
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
        </div>
      )}
    </>
  );
}

export default AirlineAbout_tabComponent;
