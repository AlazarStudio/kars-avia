import React, { useEffect, useRef, useState } from "react";
import classes from "./OrganizationAbout_tabComponent.module.css";
import Button from "../../Standart/Button/Button.jsx";
import {
  decodeJWT,
  GET_CITIES,
  GET_ORGANIZATION,
  getCookie,
  ORGANIZATION_CREATED_SUBSCRIPTION,
  getMediaUrl,
  UPDATE_ORGANIZATION,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import { fullNotifyTime, notifyTime, roles } from "../../../roles.js";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import Notification from "../../Notification/Notification.jsx";
import { InputMask } from "@react-input/mask";
import HomeIcon from "../../../shared/icons/HomeIcon.jsx";
import RequisitesIcon from "../../../shared/icons/RequisitesIcon.jsx";
import ContactsIcon from "../../../shared/icons/ContactsIcon.jsx";
import PinIcon from "../../../shared/icons/PinIcon.jsx";
import { hasAccessMenu } from "../../../utils/access";

function OrganizationAbout_tabComponent({ id, accessMenu }) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const [displayInfo, setDisplayInfo] = useState("generalInfo");

  const { loading, error, data, refetch } = useQuery(GET_ORGANIZATION, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { organizationId: id },
  });

  const { data: dataSubscriptionUpd } = useSubscription(
    ORGANIZATION_CREATED_SUBSCRIPTION,
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

  useEffect(() => {
    if (!data?.organization) return;
    if (!isEditing) {
      setOrganization(data.organization);
    }
  }, [data, isEditing]);

  useEffect(() => {
    if (dataSubscriptionUpd && !isEditing) {
      refetch();
    }
  }, [dataSubscriptionUpd, isEditing, refetch]);

  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text, status }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

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
        await updateAirline({
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
        addNotification("Редактирование организации прошло успешно.", "success");
      } catch (err) {
        console.error("Произошла ошибка при сохранении данных", err);
        alert("Произошла ошибка при сохранении данных");
      } finally {
        setIsLoading(false);
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
      setOrganization((prevState) => ({
        ...prevState,
        images: [`${data.organization.images[0]}`],
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      return;
    }
    if (file) {
      setNewImage(file);
      const imageUrl = URL.createObjectURL(file);
      setOrganization((prevState) => ({
        ...prevState,
        images: [imageUrl],
      }));
    }
  };

  const INFO_FIELDS = new Set([
    "country", "city", "address", "bank", "bik", "email", "index", "inn", "number", "ogrn", "rs",
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrganization((prev) =>
      INFO_FIELDS.has(name)
        ? { ...prev, information: { ...prev.information, [name]: value } }
        : { ...prev, [name]: value }
    );
  };

  const canEdit =
    user?.role === roles.superAdmin ||
    user?.role === roles.airlineAdmin ||
    user?.role === roles.dispatcerAdmin;

  const canEditButton =
    (!user?.airlineId || accessMenu?.airlineUpdate) &&
    (user?.role !== roles.dispatcerAdmin ||
      !accessMenu ||
      hasAccessMenu(accessMenu, "organizationUpdate"));

  const avatarSrc = newImage
    ? URL.createObjectURL(newImage)
    : getMediaUrl(organization?.images?.[0]) ?? "/no-avatar.png";

  const locationLine = [
    organization?.information?.city,
    organization?.information?.address,
  ]
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

      {!loading && !isLoading && !error && organization && (
        <div className={classes.card}>
          <div className={classes.header}>
            <div className={classes.headerLeft}>
              <div className={classes.avatar}>
                <img src={avatarSrc} alt={organization.name} />
              </div>
              <div className={classes.headerInfo}>
                <div className={classes.headerName}>{organization.name}</div>
                {locationLine && (
                  <div className={classes.headerLocation}>
                    <PinIcon />
                    {locationLine}
                  </div>
                )}
              </div>
            </div>
            {canEdit && canEditButton && (
              <div className={classes.headerActions}>
                <Button onClick={handleEditClick}>
                  <img
                    src={isEditing ? "/save.png" : "/editIcon.png"}
                    alt=""
                    style={{ width: 16, height: 16 }}
                  />
                  {isEditing ? "Сохранить" : "Редактировать"}
                </Button>
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
                    value={organization.name || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={classes.fieldInput}
                  />
                </div>
                {isEditing && (
                  <div className={classes.fileRow}>
                    <span className={classes.fileLabel}>Изображение</span>
                    <input
                      type="file"
                      name="images"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className={classes.fileInput}
                    />
                  </div>
                )}
              </div>
            )}

            {displayInfo === "requisites" && (
              <div className={`${classes.formSection} ${classes.formSectionHalf}`}>
                <div className={classes.sectionTitle}>Юридические данные</div>
                {[
                  { name: "inn", label: "ИНН", value: organization.information?.inn },
                  { name: "ogrn", label: "ОГРН", value: organization.information?.ogrn },
                  { name: "rs", label: "Р/С", value: organization.information?.rs },
                  { name: "bank", label: "В банке", value: organization.information?.bank },
                  { name: "bik", label: "БИК", value: organization.information?.bik },
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
                      value={organization.information?.country || ""}
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
                          (option) =>
                            option.city === organization.information?.city
                        ) || null
                      }
                      onChange={(e, newValue) => {
                        setOrganization((prev) => ({
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
                      value={organization.information?.address || ""}
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
                      value={organization.information?.index || ""}
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
                      value={organization.information?.email || ""}
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
                      value={organization.information?.number || ""}
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
