import React, { useCallback, useEffect, useRef, useState } from "react";
import classes from "./EditRequestHotelContract.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  convertToDate,
  DELETE_AIRLINE_CONTRACT_AA,
  GET_ALL_DISPATCHERS,
  GET_HOTEL_CONTRACT,
  GET_ORGANIZATION_CONTRACT,
  getCookie,
  getMediaUrl,
  normalize,
  UPDATE_HOTEL_CONTRACT,
  UPDATE_ORGANIZATION_CONTRACT,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import { action } from "../../../roles.js";
import FixIcon from "../../../shared/icons/FixIcon.jsx";
import EditAdditionalAgreement from "../EditAdditionalAgreement/EditAdditionalAgreement.jsx";
import CreateAdditionalAgreement from "../CreateAdditionalAgreement/CreateAdditionalAgreement.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import AttachIcon from "../../../shared/icons/AttachIcon.jsx";
import DocIcon from "../../../shared/icons/DocIcon.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";

function EditRequestHotelContract({
  show,
  id,
  activeFilterTab,
  companiesData,
  hotelsData,
  orgsData,
  citiesData,
  onClose,
  tarif, // тут приходит airlineContractId
  addNotification,
  canEdit = false, // Флаг для разрешения редактирования
}) {
  const token = getCookie("token");

  const query =
    activeFilterTab === "hotels"
      ? GET_HOTEL_CONTRACT
      : GET_ORGANIZATION_CONTRACT;

  // Тянем справочник аэропортов, если он тебе нужен далее (оставляю как в исходнике)
  // const citiesData = useQuery(GET_CITIES, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   },
  //   skip: !show,
  // });

  // const { data: airlinesData } = useQuery(GET_HOTELS_RELAY, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   },
  //   skip: !show,
  // });

  // const { data: companiesData } = useQuery(GET_ALL_COMPANIES, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   },
  // });

  const { data: dispatchersData } = useQuery(GET_ALL_DISPATCHERS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const typeId =
    activeFilterTab === "hotels" ? "hotelContractId" : "organizationContractId";

  const { data, loading, error, refetch } = useQuery(query, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { [typeId]: tarif },
    skip: !tarif || !show,
    // fetchPolicy: "cache-and-network",
  });

  const [updateHotelContract] = useMutation(UPDATE_HOTEL_CONTRACT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [updateOrganizationContract] = useMutation(
    UPDATE_ORGANIZATION_CONTRACT,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Apollo-Require-Preflight": "true",
        },
      },
    }
  );

  const [deleteAirlineContractAA] = useMutation(DELETE_AIRLINE_CONTRACT_AA, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  // Управление режимом редактирования (как в исходнике)
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("Общая");
  const [hotels, setHotels] = useState([]); // Список авиакомпаний
  const [cities, setCities] = useState([]); // Список аэропортов
  const [companies, setCompanies] = useState([]); // Список авиакомпаний
  const [dispatchers, setDispatchers] = useState([]); // Список авиакомпаний
  const [selectedAirline, setSelectedAirline] = useState(null); // Выбранная авиакомпания

  // Локальная форма
  const [formData, setFormData] = useState({
    contractNumber: "",
    date: "",
    companyId: "",
    hotelId: "",
    cityId: "",
    applicationType: "",
    normativeAct: "",
    signatureMark: "",
    legalEntity: "",
    executor: "",
    completionMark: "",
    notes: "",
    files: [],
    // массив доп. соглашений
    additionalAgreements: [], // [{id, contractNumber, date, itemAgreement, notes, files}]
  });

  const [files, setFiles] = useState([]);

  // Гидрация из запроса
  useEffect(() => {
    if (!data) return;
    if (data.hotelContract) {
      const c = data.hotelContract;
      setFormData({
        contractNumber: c.contractNumber || "",
        date: c.date || "",
        companyId: c.companyId || "",
        signatureMark: c.signatureMark || "",
        normativeAct: c.normativeAct || "",
        legalEntity: c.legalEntity || "",
        executor: c.executor || "",
        completionMark: c.completionMark || "",
        hotelId: c.hotelId || "",
        cityId: c.cityId || "",
        applicationType: c.applicationType || "",
        notes: c.notes || "",
        files: [],
        additionalAgreements: Array.isArray(c.additionalAgreements)
          ? c.additionalAgreements.map((a) => ({
            id: a.id,
            contractNumber: a.contractNumber || "",
            date: a.date || "",
            itemAgreement: a.itemAgreement || "",
            notes: a.notes || "",
            files: Array.isArray(a.files) ? a.files : [],
          }))
          : [],
      });
      setFiles(Array.isArray(c.files) ? c.files : []);
    }
    if (data.organizationContract) {
      const c = data.organizationContract;
      setFormData({
        contractNumber: c.contractNumber || "",
        date: c.date || "",
        companyId: c.companyId || "",
        cityId: c.cityId || "",
        hotelId: c.organizationId || "",
        applicationType: c.applicationType || "",
        notes: c.notes || "",
        files: [],
        additionalAgreements: Array.isArray(c.additionalAgreements)
          ? c.additionalAgreements.map((a) => ({
            id: a.id,
            contractNumber: a.contractNumber || "",
            date: a.date || "",
            itemAgreement: a.itemAgreement || "",
            notes: a.notes || "",
            files: Array.isArray(a.files) ? a.files : [],
          }))
          : [],
      });
      setFiles(Array.isArray(c.files) ? c.files : []);
    }
  }, [data]);

  // refs для закрытия по клику вне сайдбара
  const sidebarRef = useRef();
  const agreementSidebarRef = useRef(); // New ref for the EditAdditionalAgreement sidebar

  const closeButton = useCallback(() => {
    if (isEditing) {
      const ok = confirm("Вы уверены, все несохраненные данные будут удалены?");
      if (!ok) return;
    }
    onClose?.();
    setIsEditing(false);
    setActiveTab("Общая");
  }, [isEditing, onClose]);

  useEffect(() => {
    if (citiesData) {
      setCities(citiesData.citys || []);
    }
  }, [citiesData]);

  useEffect(() => {
    if (show) {
      if (activeFilterTab === "transfer") {
        // Для организаций используем orgsData
        // orgsData может быть массивом или объектом с organizations.organizations
        const orgs = Array.isArray(orgsData)
          ? orgsData
          : orgsData?.organizations?.organizations || [];
        setHotels(orgs);
      } else {
        // Для гостиниц используем hotelsData
        setHotels(hotelsData?.hotels?.hotels || []);
      }
      //   refetch();
    }
  }, [show, hotelsData, orgsData, activeFilterTab]);

  useEffect(() => {
    if (show) {
      setCompanies(companiesData?.getAllCompany);
    }
  }, [show, companiesData]);

  useEffect(() => {
    if (show) {
      setDispatchers(dispatchersData?.dispatcherUsers?.users);
    }
  }, [show, dispatchersData]);

  // Общий onChange
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const [fileName, setFileName] = useState([]);

  const onFilesPicked = (e) => {
    const file = Array.from(e.target.files || []);
    // console.log(file);
    if (file) {
      setFileName(file.map((i) => i.name));
      setFormData((prev) => ({ ...prev, files: file }));
    }
  };

  const dropRef = useRef(null);
  const onDragOver = (e) => {
    e.preventDefault();
    dropRef.current?.classList.add(classes.dragover);
  };
  const onDragLeave = () => {
    dropRef.current?.classList.remove(classes.dragover);
  };
  const onDrop = (e) => {
    e.preventDefault();
    dropRef.current?.classList.remove(classes.dragover);
    const file = Array.from(e.dataTransfer.files || []);
    if (file) {
      setFileName(file.map((i) => i.name));
      setFormData((prev) => ({ ...prev, files: file }));
    }
  };

  // Файлы договора
  const handleRootFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData((p) => ({ ...p, files }));
  };

  // Работа с ДС
  const handleAgreementChange = (index, field, value) => {
    setFormData((p) => {
      const next = [...p.additionalAgreements];
      next[index] = { ...next[index], [field]: value };
      return { ...p, additionalAgreements: next };
    });
  };
  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  const handleAgreementFilesChange = (e, index) => {
    const files = Array.from(e.target.files || []);
    setFormData((p) => {
      const next = [...p.additionalAgreements];
      next[index] = { ...next[index], files };
      return { ...p, additionalAgreements: next };
    });
  };

  const [showAgreementEditor, setShowAgreementEditor] = useState(false);
  const [showCreateAgreementEditor, setShowCreateAgreementEditor] =
    useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null); // { index, data }

  const openAgreement = (ag, index) => {
    setSelectedAgreement({ index, data: ag });
    setShowAgreementEditor(true);
  };

  const closeAgreement = () => {
    setShowAgreementEditor(false);
    setSelectedAgreement(null);
  };

  const openCreateAgreement = () => {
    setShowCreateAgreementEditor(true);
  };

  const closeCreateAgreement = () => {
    setShowCreateAgreementEditor(false);
  };

  const saveAgreement = (savedAg) => {
    // если index null — это новое ДС, иначе обновление
    // setFormData((prev) => {
    //   const list = [...prev.additionalAgreements];
    //   if (selectedAgreement?.index == null) {
    //     list.unshift(savedAg);
    //   } else {
    //     list[selectedAgreement.index] = savedAg;
    //   }
    //   return { ...prev, additionalAgreements: list };
    // });
    setShowAgreementEditor(false);
    setShowCreateAgreementEditor(false);
    setSelectedAgreement(null);
  };
  const [isLoading, setIsLoading] = useState(false);

  const deleteAgreement = useCallback(async (ag, index) => {
    // console.log(ag);

    // Предупреждение перед удалением
    if (!confirm("Удалить дополнительное соглашение?")) return;

    try {
      setIsLoading(true);
      // Отправляем мутацию удаления соглашения
      await deleteAirlineContractAA({
        variables: {
          deleteAdditionalAgreementId: ag?.id,
        },
      });

      // Удаляем соглашение из списка только после успешного удаления на сервере
      setFormData((prev) => {
        const list = [...prev.additionalAgreements];
        list.splice(index, 1); // Удаляем элемент по индексу
        return { ...prev, additionalAgreements: list };
      });
      setIsLoading(false);

      // Уведомление об успешном удалении
      // addNotification("Дополнительное соглашение успешно удалено", "success");
    } catch (err) {
      // console.error("Ошибка при удалении:", err);
      // alert("Произошла ошибка при удалении соглашения.");
    }
    refetch();
  }, []);

  // Сабмит (оставляю локально; сюда можно подставить твои UPDATE_* мутации)
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!isEditing && canEdit) {
      setIsEditing(true);
      return;
    }
    try {
      setIsLoading(true);
      // тут подставь свои мутации обновления договора/ДС,
      // используя данные из formData (files и files у ДС отправляй так же, как при создании).
      // пример полезной структуры:
      const hotelPayload = {
        contractNumber: formData.contractNumber,
        date: formData.date ? new Date(formData.date).toISOString() : null,
        notes: formData.notes,
        applicationType: formData.applicationType,
        cityId: formData.cityId,
        companyId: formData.companyId,
        hotelId: formData.hotelId,
        signatureMark: formData.signatureMark,
        completionMark: formData.completionMark,
        // executor: formData.executor,
        legalEntity: formData.legalEntity,
        normativeAct: formData.normativeAct,
        files: formData.files,
      };

      const transferPayload = {
        contractNumber: formData.contractNumber,
        date: formData.date ? new Date(formData.date).toISOString() : null,
        notes: formData.notes,
        applicationType: formData.applicationType,
        cityId: formData.cityId,
        companyId: formData.companyId,
        organizationId: formData.hotelId,
        files: formData.files,
      };

      if (activeFilterTab === "hotels") {
        await updateHotelContract({
          variables: {
            updateHotelContractId: tarif,
            input: hotelPayload,
            files: formData.files,
          },
        });
      }

      if (activeFilterTab === "transfer") {
        await updateOrganizationContract({
          variables: {
            updateOrganizationContractId: tarif,
            input: transferPayload,
            files: formData.files,
          },
        });
      }

      addNotification?.("Изменения сохранены.", "success");
      onClose();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Произошла ошибка при сохранении договора.");
    } finally {
      setIsLoading(false);
      setFileName([]);
    }
  };
  // console.log(formData);

  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (event) => {
      const clickedOutsideMain =
        sidebarRef.current && !sidebarRef.current.contains(event.target);
      const clickedOutsideAgreement = !agreementSidebarRef.current?.contains(
        event.target
      );

      if (clickedOutsideMain && clickedOutsideAgreement) {
        closeButton();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]); // ← важно

  return (
    <>
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>
            {formData?.contractNumber}
            {/* {canEdit ? "Изменить договор" : formData?.contractNumber} */}
          </div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>

        <div className={classes.tabs}>
          <div
            className={`${classes.tab} ${activeTab === "Общая" ? classes.activeTab : ""
              }`}
            onClick={() => handleTabChange("Общая")}
          >
            Общая
          </div>
          <div
            className={`${classes.tab} ${activeTab === "ДС" ? classes.activeTab : ""
              }`}
            onClick={() => handleTabChange("ДС")}
          >
            ДС
          </div>
          <div
            className={`${classes.tab} ${activeTab === "Файлы" ? classes.activeTab : ""
              }`}
            onClick={() => handleTabChange("Файлы")}
          >
            Файлы
          </div>
        </div>

        {loading || isLoading ? (
          <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
        ) : (
          <>
            {activeTab === "Общая" ? (
              <div
                className={classes.requestMiddle}
                style={!canEdit ? { height: "calc(100% - 148px)" } : {}}
              >
                <div className={classes.requestData}>
                  {/* Договор: основные поля */}
                  <div className={isEditing ? classes.requestDataItem : classes.requestDataInfo}>
                    {isEditing ? (
                      <>
                        <label>№ Договора</label>
                        <input
                          type="text"
                          name="contractNumber"
                          value={formData.contractNumber}
                          onChange={handleChange}
                          placeholder="Например: Договор №1"
                        />
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>№ Договора</div>
                        <div className={classes.requestDataInfo_desc}>{formData.contractNumber || "—"}</div>
                      </>
                    )}
                  </div>

                  <div className={isEditing ? classes.requestDataItem : classes.requestDataInfo}>
                    {isEditing ? (
                      <>
                        <label>Дата заключения</label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date ? formData.date.slice(0, 10) : ""}
                          onChange={handleChange}
                          placeholder="Дата"
                        />
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>Дата заключения</div>
                        <div className={classes.requestDataInfo_desc}>{formData.date ? convertToDate(formData.date) : "—"}</div>
                      </>
                    )}
                  </div>

                  <div className={isEditing ? classes.requestDataItem : classes.requestDataInfo}>
                    {isEditing ? (
                      <>
                        <label>ГК КАРС</label>
                        <MUIAutocomplete
                          dropdownWidth={"59%"}
                          label={"Введите компанию"}
                          options={companies?.map((item) => item.name) || []}
                          value={
                            companies?.find((item) => item.id === formData.companyId)
                              ?.name || null
                          }
                          onChange={(event, newValue) => {
                            const selectedCompany = companies?.find(
                              (item) => item.name === newValue
                            );
                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              companyId: selectedCompany?.id || "",
                            }));
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>ГК КАРС</div>
                        <div className={classes.requestDataInfo_desc}>
                          {companies?.find((item) => item.id === formData.companyId)?.name || "—"}
                        </div>
                      </>
                    )}
                  </div>

                  <div className={isEditing ? classes.requestDataItem : classes.requestDataInfo}>
                    {isEditing ? (
                      <>
                        <label>
                          {activeFilterTab === "hotels"
                            ? "Гостиница"
                            : "Организация"}
                        </label>
                        <MUIAutocompleteColor
                          dropdownWidth={"59%"}
                          label={
                            activeFilterTab === "hotels"
                              ? "Выберите гостиницу"
                              : "Выберите организацию"
                          }
                          options={hotels}
                          getOptionLabel={(option) => {
                            if (!option) return "";
                            if (activeFilterTab === "transfer") {
                              return `${option.name}${option?.information?.city ? `, город: ${option.information.city}` : ""}`.trim();
                            } else {
                              return `${option.name}, город: ${option?.information?.city || ""}`.trim();
                            }
                          }}
                          renderOption={(optionProps, option) => {
                            const cityPart = option?.information?.city
                              ? `, город: ${option.information.city}`
                              : "";
                            const labelText = `${option.name}${cityPart}`.trim();
                            const words = labelText.split(", ");

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
                            hotels?.find(
                              (item) => item.id === formData.hotelId
                            ) || null
                          }
                          onChange={(event, newValue) => {
                            if (!newValue) return;

                            const selectedItem = hotels?.find(
                              (item) => item.id === newValue.id
                            );
                            setSelectedAirline(selectedItem);

                            const itemCity = selectedItem?.information?.city;
                            const matchedCity =
                              cities.find(
                                (c) =>
                                  normalize(c.city) === normalize(itemCity) ||
                                  normalize(c.name) === normalize(itemCity)
                              ) || null;

                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              hotelId: selectedItem?.id || "",
                              cityId: matchedCity?.id || "",
                            }));
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>
                          {activeFilterTab === "hotels" ? "Гостиница" : "Организация"}
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {hotels?.find((item) => item.id === formData.hotelId)?.name || "—"}
                        </div>
                      </>
                    )}
                  </div>

                  <div className={isEditing ? classes.requestDataItem : classes.requestDataInfo}>
                    {isEditing ? (
                      <>
                        <label>Город</label>
                        <MUIAutocompleteColor
                          dropdownWidth="59%"
                          label={"Выберите город"}
                          options={cities}
                          getOptionLabel={(option) => {
                            if (!option) return "";
                            const cityPart =
                              option.city && option.city !== option.region
                                ? `, регион: ${option.region}`
                                : "";
                            return `${option.city}${cityPart}`.trim();
                          }}
                          renderOption={(optionProps, option) => {
                            const cityPart =
                              option.city && option.city !== option.name
                                ? `, регион: ${option.region}`
                                : "";
                            const labelText = `${option.city}${cityPart}`.trim();
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
                            cities.find((o) => o.id === formData.cityId) || null
                          }
                          onChange={(e, newValue) => {
                            setFormData((prev) => ({
                              ...prev,
                              cityId: newValue?.id,
                            }));
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>Город</div>
                        <div className={classes.requestDataInfo_desc}>
                          {cities?.find((o) => o.id === formData.cityId)?.city || "—"}
                        </div>
                      </>
                    )}
                  </div>

                  {activeFilterTab === "hotels" && (
                    <>
                      <div className={isEditing ? classes.requestDataItem : classes.requestDataInfo}>
                        {isEditing ? (
                          <>
                            <label>Наименования организации</label>
                            <input
                              type="text"
                              name="legalEntity"
                              value={formData.legalEntity}
                              onChange={handleChange}
                              placeholder='Например: ООО "Буфет"'
                            />
                          </>
                        ) : (
                          <>
                            <div className={classes.requestDataInfo_title}>Наименования организации</div>
                            <div className={classes.requestDataInfo_desc}>{formData.legalEntity || "—"}</div>
                          </>
                        )}
                      </div>
                      <div className={isEditing ? classes.requestDataItem : classes.requestDataInfo}>
                        {isEditing ? (
                          <>
                            <label>Отметка о подписании</label>
                            <input
                              type="text"
                              name="signatureMark"
                              value={formData.signatureMark}
                              onChange={handleChange}
                              placeholder="Например: Подписан"
                            />
                          </>
                        ) : (
                          <>
                            <div className={classes.requestDataInfo_title}>Отметка о подписании</div>
                            <div className={classes.requestDataInfo_desc}>{formData.signatureMark || "—"}</div>
                          </>
                        )}
                      </div>

                      <div className={isEditing ? classes.requestDataItem : classes.requestDataInfo}>
                        {isEditing ? (
                          <>
                            <label>Нормативный Акт, Форма договора</label>
                            <input
                              type="text"
                              name="normativeAct"
                              value={formData.normativeAct}
                              onChange={handleChange}
                              placeholder="Например: Наша форма договора"
                            />
                          </>
                        ) : (
                          <>
                            <div className={classes.requestDataInfo_title}>Нормативный Акт, Форма договора</div>
                            <div className={classes.requestDataInfo_desc}>{formData.normativeAct || "—"}</div>
                          </>
                        )}
                      </div>

                      <div className={isEditing ? null : classes.requestDataInfo}>
                        {isEditing ? (
                          <label className={classes.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={formData.completionMark === "Исполнено"}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  completionMark: e.target.checked
                                    ? "Исполнено"
                                    : "Не исполнено",
                                }))
                              }
                            />
                            <span style={{ marginLeft: 8 }}>
                              Отметка о исполнении: {formData.completionMark}
                            </span>
                          </label>
                        ) : (
                          <>
                            <div className={classes.requestDataInfo_title}>Отметка о исполнении</div>
                            <div className={classes.requestDataInfo_desc}>{formData.completionMark || "—"}</div>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  <div className={isEditing ? classes.requestDataItem : classes.requestDataInfo}>
                    {isEditing ? (
                      <>
                        <label>Вид услуги</label>
                        <input
                          type="text"
                          name="applicationType"
                          value={formData.applicationType}
                          onChange={handleChange}
                          placeholder="Например: Проживание"
                        />
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>Вид услуги</div>
                        <div className={classes.requestDataInfo_desc}>{formData.applicationType || "—"}</div>
                      </>
                    )}
                  </div>

                  {isEditing ? (
                    <>
                      <label>Комментарий</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Введите комментарий"
                        disabled={!isEditing}
                      ></textarea>
                    </>
                  ) : formData.notes ? (
                    <div className={classes.notesWrapper}>
                      <div className={classes.notesHeader}>
                        <p>Комментарий</p>
                        <FixIcon />
                      </div>
                      <div className={classes.notes}>{formData.notes}</div>
                    </div>
                  ) : null}

                  {/* <label>Файлы договора</label> */}
                  {/* <input
                    type="file"
                    onChange={handleRootFilesChange}
                    multiple
                    disabled={!isEditing}
                  /> */}
                  {canEdit && (
                    <div
                      ref={dropRef}
                      className={classes.fileDrop}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                    >
                      <input
                        id="filesHotel"
                        type="file"
                        className={classes.fileInputHidden}
                        onChange={onFilesPicked}
                        multiple
                        disabled={!isEditing}
                      />

                      <label htmlFor="filesHotel" className={classes.fileInner}>
                        <AttachIcon width={19} height={19} />

                        <span className={classes.fileText}>
                          {fileName.length
                            ? `Выбрано файлов: ${fileName.length}` // список названий через запятую
                            : "Прикрепить файлы"}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "ДС" ? (
              <div
                className={classes.requestMiddle}
                style={!canEdit ? { height: "calc(100% - 148px)" } : {}}
              >
                <div className={classes.requestData}>
                  {canEdit && (
                    <Button type="button" onClick={openCreateAgreement}>
                      + Добавить ДС
                    </Button>
                  )}
                  {formData.additionalAgreements.map((ag, index) => (
                    <div
                      key={ag.id || index}
                      className={classes.requestData}
                      style={{
                        padding: "12px",
                        border: "1px solid #E5E7EB",
                        borderRadius: 10,
                        display: "grid",
                        gridTemplateColumns: "1fr auto auto",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        onClick={() => openAgreement(ag, index)}
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div>{ag.contractNumber || "—"}</div>
                        <div style={{ color: "var(--main-gray)" }}>
                          {ag.date ? convertToDate(ag.date) : "—"}
                        </div>
                      </div>

                      {canEdit && (
                        <>
                          <img
                            src="/edit.svg.png"
                            alt="edit"
                            onClick={() => openAgreement(ag, index)}
                            style={{ justifySelf: "end", cursor: "pointer" }}
                          />
                          <img
                            src="/deleteReport.png"
                            alt="delete"
                            onClick={() => deleteAgreement(ag, index)}
                            style={{ cursor: "pointer" }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={classes.requestMiddle}
                style={!canEdit ? { height: "calc(100% - 148px)" } : {}}
              >
                <div className={classes.requestData}>
                  {files?.map((i, index) => (
                    <a
                      key={index}
                      href={getMediaUrl(i)}
                      target="_blank"
                      className={classes.downloadsButton}
                      rel="noopener noreferrer"
                    >
                      <DocIcon width={32} height={35} />
                      {formData.contractNumber} файл №{index + 1}
                      {/* Скачать */}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "Общая" && canEdit && (
              <div className={classes.requestButton}>
                {isEditing && (
                  <Button
                    onClick={() => setIsEditing(false)}
                    backgroundcolor="var(--hover-gray)"
                    color="#000"
                  >
                    Отмена
                  </Button>
                )}
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  backgroundcolor={!isEditing ? "#3CBC6726" : "#0057C3"}
                  color={!isEditing ? "#3B6C54" : "#fff"}
                >
                  {isEditing ? (
                    <>
                      Сохранить <img src="/saveDispatcher.png" alt="" />
                    </>
                  ) : (
                    <>
                      Изменить <img src="/editDispetcher.png" alt="" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </Sidebar>
      <EditAdditionalAgreement
        id={id}
        canEdit={canEdit}
        updId={tarif}
        show={showAgreementEditor}
        onClose={closeAgreement}
        agreement={selectedAgreement?.data || null}
        onSave={saveAgreement}
        refetch={refetch}
        token={token}
        agreementSidebarRef={agreementSidebarRef} // Pass the ref here
      />

      <CreateAdditionalAgreement
        canEdit={canEdit}
        updId={tarif}
        activeFilterTab={activeFilterTab}
        show={showCreateAgreementEditor}
        onClose={closeCreateAgreement}
        agreement={null}
        onSave={saveAgreement}
        refetch={refetch}
        token={token}
        agreementSidebarRef={agreementSidebarRef} // Pass the ref here
      />
    </>
  );
}

export default EditRequestHotelContract;
