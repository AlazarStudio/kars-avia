import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestHotelContract.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  CREATE_AIRLINE_AA,
  CREATE_AIRLINE_CONTRACT,
  CREATE_HOTEL_CONTRACT,
  CREATE_ORGANIZATION_CONTRACT,
  GET_AIRLINES_RELAY,
  GET_AIRPORTS_RELAY,
  GET_ALL_COMPANIES,
  GET_ALL_DISPATCHERS,
  GET_CITIES,
  GET_HOTELS_RELAY,
  getCookie,
  normalize,
  UPDATE_AIRLINE_TARIF,
  UPDATE_PRICE_TARIFFS,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import { action } from "../../../roles.js";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import AttachIcon from "../../../shared/icons/AttachIcon.jsx";
function CreateRequestHotelContract({
  show,
  id,
  activeFilterTab,
  onClose,
  hotelsData,
  orgsData,
  companiesData,
  citiesData,
  selectedContract,
  user,
  addNotification,
}) {
  const token = getCookie("token");

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

  // console.log(show);
  const [activeTab, setActiveTab] = useState("Общая");

  const [formData, setFormData] = useState({
    contractNumber: "",
    date: "",
    companyId: "",
    hotelId: null,
    // organizationId: null,
    normativeAct: "",
    cityId: null,
    legalEntity: "",
    executor: "",
    notes: "",
    applicationType: "",
    signatureMark: "",
    completionMark: "Не исполнено",
    files: [],
    aaContracts: [],
  });

  const [cities, setCities] = useState([]); // Список аэропортов
  const [companies, setCompanies] = useState([]); // Список авиакомпаний
  const [dispatchers, setDispatchers] = useState([]); // Список авиакомпаний
  const [airlines, setAirlines] = useState([]); // Список авиакомпаний
  const [selectedCompany, setSelectedCompany] = useState(null); // Выбранная авиакомпания
  const [selectedHotel, setSelectedHotel] = useState(null); // Выбранная авиакомпания

  const [createHotelContract] = useMutation(CREATE_HOTEL_CONTRACT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [createOrganizationContract] = useMutation(
    CREATE_ORGANIZATION_CONTRACT,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Apollo-Require-Preflight": "true",
        },
      },
    }
  );

  const [createAdditionalAgreement] = useMutation(CREATE_AIRLINE_AA, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [updateTariffCategory] = useMutation(UPDATE_PRICE_TARIFFS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // "Apollo-Require-Preflight": "true",
      },
    },
  });

  useEffect(() => {
    if (citiesData) {
      setCities(citiesData?.citys || []);
    }
  }, [citiesData]);

  useEffect(() => {
    if (show && hotelsData && activeFilterTab === "hotels") {
      setAirlines(hotelsData?.hotels?.hotels);
    }
    if (show && orgsData && activeFilterTab === "transfer") {
      setAirlines(orgsData?.organizations);
    }
  }, [show, hotelsData, orgsData]);

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

  const airportOptions = cities.map((i) => ({
    label: `${i.city}, регион: ${i.region}`,
    id: i.id,
    city: i.city,
  }));

  const [tarifNames, setTarifNames] = useState([]);
  const sidebarRef = useRef();

  const resetForm = () => {
    setActiveTab("Общая");
    setFormData({
      contractNumber: "",
      date: "",
      companyId: "",
      hotelId: null,
      normativeAct: "",
      cityId: null,
      legalEntity: "",
      executor: "",
      notes: "",
      files: [],
      completionMark: "Не исполнено",
      signatureMark: "",
      applicationType: "",
      aaContracts: [],
    });
    setSelectedHotel(null);
    setSelectedCompany(null);
  };

  const closeButton = () => {
    let success = confirm(
      "Вы уверены, все несохраненные данные будут удалены?"
    );
    if (success) {
      resetForm();
      onClose();
    }
  };

  const addNewAgreement = () => {
    setFormData((prevData) => ({
      ...prevData,
      aaContracts: [
        ...prevData.aaContracts,
        {
          contractNumberAA: "",
          dateAA: "",
          itemAgreement: "",
          notesAA: "",
          filesAA: [],
        },
      ],
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const fileInputRef = useRef(null);
  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        files: file,
      }));
      // if (fileInputRef.current) {
      //   fileInputRef.current.value = ""; // Сброс значения в DOM-элементе
      // }
      // return;
    }
  };

  // в начале компонента:
  const [fileName, setFileName] = useState([]);

  const onFilesPicked = (e) => {
    const file = Array.from(e.target.files || []);
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

  const handleAgreementChange = (index, field, value) => {
    const updatedAgreements = formData.aaContracts.map((agreement, i) =>
      i === index ? { ...agreement, [field]: value } : agreement
    );
    setFormData((prevData) => ({
      ...prevData,
      aaContracts: updatedAgreements,
    }));
  };

  // Для dragover/leave используем сам таргет, без ref
  const onDragOverAA = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add(classes.dragover);
  };

  const onDragLeaveAA = (e) => {
    e.currentTarget.classList.remove(classes.dragover);
  };

  // DnD файлы -> в нужное ДС по индексу
  const onDropAA = (e, index) => {
    e.preventDefault();
    e.currentTarget.classList.remove(classes.dragover);
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;

    setFormData((prev) => {
      const aaContracts = prev.aaContracts.map((a, i) =>
        i === index ? { ...a, filesAA: files } : a
      );
      return { ...prev, aaContracts };
    });
  };

  // Выбор файлов через input -> в нужное ДС по индексу
  const onFilesPickedAA = (e, index) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => {
      const aaContracts = prev.aaContracts.map((a, i) =>
        i === index ? { ...a, filesAA: files } : a
      );
      return { ...prev, aaContracts };
    });
    // если надо разрешить выбрать те же файлы повторно:
    // e.target.value = null;
  };
  const [isLoading, setIsLoading] = useState(false);

  // console.log(selectedHotel);
  // console.log(id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const isoDate = new Date(formData.date).toISOString();
      const aaContracts = formData.aaContracts.map((agreement) => ({
        contractNumber: agreement.contractNumberAA,
        date: new Date(agreement.dateAA).toISOString(),
        itemAgreement: agreement.itemAgreement,
        notes: agreement.notesAA,
        files: agreement.filesAA,
      }));

      const hotelPayload = {
        contractNumber: formData.contractNumber,
        date: isoDate,
        companyId: formData.companyId,
        hotelId: formData.hotelId,
        cityId: formData.cityId,
        legalEntity: formData.legalEntity,
        // executor: formData.executor,
        normativeAct: formData.normativeAct,
        completionMark: formData.completionMark,
        signatureMark: formData.signatureMark,
        notes: formData.notes,
        applicationType: formData.applicationType,
      };

      const transferPayload = {
        applicationType: formData.applicationType,
        cityId: formData.cityId,
        companyId: formData.companyId,
        contractNumber: formData.contractNumber,
        date: isoDate,
        organizationId: formData.hotelId,
        notes: formData.notes,
      };

      if (activeFilterTab === "hotels") {
        let response_update_tariff = await createHotelContract({
          variables: {
            input: hotelPayload,
            files: formData.files,
          },
        });

        for (const agreement of aaContracts) {
          await createAdditionalAgreement({
            variables: {
              input: {
                ...agreement,
                hotelContractId:
                  response_update_tariff.data.createHotelContract.id,
              },
              files: agreement.files,
            },
          });
        }
      }

      if (activeFilterTab === "transfer") {
        let response_update_tariff = await createOrganizationContract({
          variables: {
            input: transferPayload,
            files: formData.files,
          },
        });
        for (const agreement of aaContracts) {
          await createAdditionalAgreement({
            variables: {
              input: {
                ...agreement,
                organizationContractId:
                  response_update_tariff.data.createOrganizationContract.id,
              },
              files: agreement.files,
            },
          });
        }
      }

      resetForm();
      onClose();
      setIsLoading(false);
      addNotification("Добавление договора прошло успешно.", "success");
      setFileName([]);
    } catch (error) {
      setIsLoading(false);
      alert("Произошло ошибка при добавлении тарифа.");
      console.error("Произошла ошибка при выполнении запроса:", error);
    }
  };

  useEffect(() => {
    if (show) {
      resetForm();
      const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
          closeButton();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [show]);

  // useEffect(() => {
  //   const names = addTarif.map((tarif) => ({
  //     id: tarif.id,
  //     name: tarif.name,
  //   }));
  //   setTarifNames(names);
  // }, [addTarif]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Создать договор</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      <div className={classes.tabs}>
        <div
          className={`${classes.tab} ${
            activeTab === "Общая" ? classes.activeTab : ""
          }`}
          onClick={() => handleTabChange("Общая")}
        >
          Общая
        </div>
        <div
          className={`${classes.tab} ${
            activeTab === "ДС" ? classes.activeTab : ""
          }`}
          onClick={() => handleTabChange("ДС")}
        >
          ДС
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
      ) : (
        <>
          {activeTab === "Общая" ? (
            <div className={classes.requestMiddle}>
              <div className={classes.requestData}>
                <label>№ Договора</label>
                <input
                  type="text"
                  name="contractNumber"
                  value={formData.contractNumber}
                  onChange={handleChange}
                  placeholder="Например: Договор №1"
                />

                <label>Дата заключения</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  placeholder="Дата"
                />

                <label>ГК КАРС</label>
                <MUIAutocomplete
                  dropdownWidth={"100%"}
                  label={"Выберите компанию"}
                  options={companies?.map((item) => item.name)}
                  value={selectedCompany ? selectedCompany?.name : ""}
                  onChange={(event, newValue) => {
                    const selectedCompany = companies.find(
                      (item) => item.name === newValue
                    );
                    setSelectedCompany(selectedCompany);
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      companyId: selectedCompany?.id || "",
                    }));
                  }}
                />

                <label>
                  {activeFilterTab === "hotels" ? "Гостиница" : "Организация"}
                </label>
                <MUIAutocompleteColor
                  dropdownWidth="100%"
                  label={
                    activeFilterTab === "hotels"
                      ? "Выберите гостиницу"
                      : "Выберите организацию"
                  }
                  options={airlines}
                  getOptionLabel={(option) =>
                    option
                      ? `${option.name}, город: ${option?.information?.city}`.trim()
                      : ""
                  }
                  renderOption={(optionProps, option) => {
                    const cityPart = `,, город: ${
                      option?.information?.city || "не указан"
                    }`;
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
                  value={selectedHotel ? selectedHotel : ""}
                  onChange={(event, newValue) => {
                    // console.log(newValue);

                    if (!newValue) {
                      setSelectedHotel(null);
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        hotelId: null,
                        cityId: null, // сбрасываем также город
                      }));
                      return;
                    }

                    const nextHotel = airlines.find(
                      (airline) => airline.id === newValue.id
                    );
                    setSelectedHotel(nextHotel);

                    // автоматически подставляем город
                    const hotelCity = nextHotel?.information?.city;
                    const matchedCity =
                      cities.find(
                        (c) =>
                          normalize(c.city) === normalize(hotelCity) ||
                          normalize(c.name) === normalize(hotelCity) // на случай, если в объекте город лежит в name
                      ) || null;

                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      hotelId: nextHotel?.id || "",
                      // organizationId: nextHotel?.id || "",
                      cityId: matchedCity?.id || "", // <-- вот это и выбирает город
                    }));
                  }}
                />

                <label>Город</label>
                <MUIAutocompleteColor
                  dropdownWidth="100%"
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
                  value={cities.find((o) => o.id === formData.cityId) || null}
                  onChange={(e, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      cityId: newValue?.id,
                    }));
                  }}
                />

                {activeFilterTab === "hotels" && (
                  <>
                    <label>Наименования организации</label>
                    <input
                      type="text"
                      name="legalEntity"
                      value={formData.legalEntity}
                      onChange={handleChange}
                      placeholder='Например: ООО "Буфет"'
                    />
                    <label>Отметка о подписании</label>
                    <input
                      type="text"
                      name="signatureMark"
                      value={formData.signatureMark}
                      onChange={handleChange}
                      placeholder="Например: Подписан"
                    />

                    <label>Нормативный Акт, Форма договора</label>
                    <input
                      type="text"
                      name="normativeAct"
                      value={formData.normativeAct}
                      onChange={handleChange}
                      placeholder="Например: Наша форма договора"
                    />

                    {/* <label>Исполнитель</label> */}
                    {/* <MUIAutocomplete
                  dropdownWidth={"100%"}
                  label={"Выберите исполнителя"}
                  options={dispatchers.map((i) => i.name)}
                  value={
                    dispatchers.find(
                      (option) => option.name === formData.executor
                    )?.name || null
                  }
                  onChange={(event, newValue) => {
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      executor: newValue ? newValue : "",
                    }));
                  }}
                /> */}

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
                  </>
                )}

                <label>Вид услуги</label>
                <input
                  type="text"
                  name="applicationType"
                  value={formData.applicationType}
                  onChange={handleChange}
                  placeholder="Введите вид услуги"
                />

                <label>Комментарий</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Введите комментарий"
                ></textarea>

                <div
                  ref={dropRef}
                  className={classes.fileDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <input
                    id="contractFile"
                    type="file"
                    className={classes.fileInputHidden}
                    onChange={onFilesPicked}
                    ref={fileInputRef}
                    multiple
                  />

                  <label htmlFor="contractFile" className={classes.fileInner}>
                    <svg
                      width="17"
                      height="19"
                      viewBox="0 0 17 19"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M2.19569 7.58791C2.32688 7.84655 2.59771 8.04847 2.80407 8.25762C3.18064 7.996 3.84646 7.24575 4.21957 6.87094L8.49212 2.57889C9.39024 1.67391 10.629 0.722029 12.6632 1.13208C14.1798 1.43782 15.2812 2.50787 15.7527 3.77159C16.3795 5.45171 15.8468 7.20016 14.8849 8.15658L6.3039 16.7822C5.85416 17.2341 5.49771 17.7148 4.6559 17.9659C3.86735 18.201 2.98337 18.0668 2.34505 17.6998C1.26214 17.0772 0.284188 15.4216 1.21764 13.7421C1.68156 12.9073 2.61487 12.1716 3.27033 11.5131C3.52596 11.2562 3.72644 11.0319 3.97804 10.7674L6.06562 8.57137C6.31143 8.31312 6.56536 8.12945 6.81229 7.86671L9.60865 4.9274C11.1543 3.49182 13.0506 5.30328 12.1377 6.77733C11.7866 7.34445 6.90447 11.9573 6.46741 12.5696L7.09916 13.2245C7.87766 12.3478 10.8242 9.48259 11.8735 8.42821C12.3063 7.99332 13.0548 7.42815 13.2535 6.59849C13.6904 4.77375 11.9482 3.03765 10.0714 3.70697C9.27683 3.99026 7.40197 6.10844 6.73348 6.79065L1.92597 11.6179C1.43716 12.1157 0.844519 12.6272 0.464454 13.3709C-1.41026 17.039 2.77861 20.6575 6.10352 18.1896L14.1757 10.2041C15.7979 8.5967 17.7195 6.83536 16.7286 3.63356C15.7553 0.488769 11.8647 -1.28179 8.63001 1.10631C7.85123 1.68128 2.91626 6.83024 2.19569 7.58791Z"
                        fill="#545873"
                      />
                    </svg>

                    <span className={classes.fileText}>
                      {fileName.length
                        ? `Выбрано файлов: ${fileName.length}` // список названий через запятую
                        : "Прикрепить файлы"}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className={classes.requestMiddle}>
              <div className={classes.requestData}>
                <Button type="button" onClick={addNewAgreement}>
                  + Добавить ДС
                </Button>
                {formData.aaContracts.reverse().map((agreement, index) => (
                  <div
                    key={index}
                    className={classes.requestData}
                    style={{ padding: 0 }}
                  >
                    <label>№ ДС</label>
                    <input
                      type="text"
                      name={`contractNumberAA-${index}`}
                      value={agreement.contractNumberAA}
                      onChange={(e) =>
                        handleAgreementChange(
                          index,
                          "contractNumberAA",
                          e.target.value
                        )
                      }
                      placeholder="Например: ДС №1"
                    />

                    <label>Дата заключения</label>
                    <input
                      type="date"
                      name={`dateAA-${index}`}
                      value={agreement.dateAA}
                      onChange={(e) =>
                        handleAgreementChange(index, "dateAA", e.target.value)
                      }
                      placeholder="Дата"
                    />

                    <label>Предмет ДС</label>
                    <input
                      type="text"
                      name={`itemAgreement-${index}`}
                      value={agreement.itemAgreement}
                      onChange={(e) =>
                        handleAgreementChange(
                          index,
                          "itemAgreement",
                          e.target.value
                        )
                      }
                      placeholder="Например: Уведомление"
                    />

                    <label>Комментарий</label>
                    <textarea
                      name={`notesAA-${index}`}
                      value={agreement.notesAA}
                      onChange={(e) =>
                        handleAgreementChange(index, "notesAA", e.target.value)
                      }
                      placeholder="Введите комментарий"
                    ></textarea>

                    <div
                      className={classes.fileDrop}
                      onDragOver={onDragOverAA}
                      onDragLeave={onDragLeaveAA}
                      onDrop={(e) => onDropAA(e, index)}
                    >
                      <input
                        id={`contractFileAA-${index}`}
                        type="file"
                        className={classes.fileInputHidden}
                        onChange={(e) => onFilesPickedAA(e, index)}
                        multiple
                      />
                      <label
                        htmlFor={`contractFileAA-${index}`}
                        className={classes.fileInner}
                      >
                        <AttachIcon width={19} height={19} />
                        <span className={classes.fileText}>
                          {agreement.filesAA?.length
                            ? `Выбрано файлов: ${agreement.filesAA.length}`
                            : "Прикрепить файлы"}
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Создать договор
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestHotelContract;
