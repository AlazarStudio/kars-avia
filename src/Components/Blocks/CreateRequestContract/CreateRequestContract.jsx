import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestContract.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  CREATE_AIRLINE_AA,
  CREATE_AIRLINE_CONTRACT,
  GET_AIRLINES_RELAY,
  GET_AIRPORTS_RELAY,
  GET_ALL_COMPANIES,
  getCookie,
  UPDATE_AIRLINE_TARIF,
  UPDATE_PRICE_TARIFFS,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import { action } from "../../../roles.js";
import AttachIcon from "../../../shared/icons/AttachIcon.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
function CreateRequestContract({
  show,
  id,
  onClose,
  airlinesData,
  companiesData,
  selectedContract,
  user,
  addNotification,
}) {
  const token = getCookie("token");
  const infoAirports = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });

  // const { data } = useQuery(GET_AIRLINES_RELAY, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   },
  //   skip: !show,
  // });

  // console.log(show);
  const [activeTab, setActiveTab] = useState("Общая");

  const [formData, setFormData] = useState({
    contractNumber: "",
    date: "",
    companyId: "",
    airlineId: null,
    region: "",
    notes: "",
    files: [],
    applicationType: "",
    aaContracts: [],
    // contractNumberAA: "",
    // dateAA: "",
    // itemAgreement: "",
    // notesAA: "",
    // filesAA: [],
  });

  const [airports, setAirports] = useState([]); // Список аэропортов
  const [companies, setCompanies] = useState([]); // Список авиакомпаний
  const [airlines, setAirlines] = useState([]); // Список авиакомпаний
  const [selectedCompany, setSelectedCompany] = useState(null); // Выбранная авиакомпания
  const [selectedAirline, setSelectedAirline] = useState(null); // Выбранная авиакомпания

  const [createAirlineContract] = useMutation(CREATE_AIRLINE_CONTRACT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [createAirlineAA] = useMutation(CREATE_AIRLINE_AA, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  useEffect(() => {
    if (infoAirports.data) {
      setAirports(infoAirports.data.airports || []);
    }
  }, [infoAirports.data]);

  useEffect(() => {
    if (show) {
      setAirlines(airlinesData?.airlines?.airlines);
      //   refetch();
    }
  }, [show, airlinesData]);

  useEffect(() => {
    if (show) {
      setCompanies(companiesData?.getAllCompany);
    }
  }, [show, companiesData]);

  const airportOptions = airports.map((airport) => ({
    label: `${airport.code} ${airport.name}, город: ${airport.city}`,
    id: airport.id,
    city: airport.city,
    // можно добавить и другие свойства, если понадобится
  }));

  // console.log(airportOptions);

  const [tarifNames, setTarifNames] = useState([]);
  const sidebarRef = useRef();

  const resetForm = () => {
    setActiveTab("Общая");
    setFormData({
      contractNumber: "",
      date: "",
      companyId: "",
      airlineId: null,
      region: "",
      notes: "",
      files: [],
      applicationType: "",
      aaContracts: [],
    });
    setSelectedAirline(null);
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
  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  const fileInputRef = useRef(null);
  const fileInputRefAA = useRef(null);

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

  const [fileNameAA, setFileNameAA] = useState("");

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

  // console.log(selectedContract?.id);
  // console.log(formData);

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

      let response_update_tariff = await createAirlineContract({
        variables: {
          input: {
            contractNumber: formData.contractNumber,
            date: isoDate,
            companyId: formData.companyId,
            airlineId: formData.airlineId,
            region: formData.region,
            notes: formData.notes,
            applicationType: formData.applicationType,
          },
          files: formData.files,
        },
      });
      // console.log(response_update_tariff);

      // теперь отправим дополнительное соглашение
      for (const agreement of aaContracts) {
        await createAirlineAA({
          variables: {
            input: {
              ...agreement,
              airlineContractId:
                response_update_tariff.data.createAirlineContract.id,
              // hotelContractId:
              //   response_update_tariff.data.createAirlineContract.id,
            },
            files: agreement.files,
          },
        });
      }

      resetForm();
      onClose();
      setIsLoading(false);
      addNotification("Добавление договора прошло успешно.", "success");
      setFileName([]);
    } catch (error) {
      setIsLoading(false);
      alert("Произошла ошибка при добавлении договора.");
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

                <label>Авиакомпания</label>
                <MUIAutocomplete
                  dropdownWidth={"100%"}
                  label={"Выберите авиакомпанию"}
                  options={airlines?.map((airline) => airline.name)}
                  value={selectedAirline ? selectedAirline?.name : ""}
                  onChange={(event, newValue) => {
                    const selectedAirline = airlines.find(
                      (airline) => airline.name === newValue
                    );
                    setSelectedAirline(selectedAirline);
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      airlineId: selectedAirline?.id || "",
                    }));
                  }}
                />

                {/* <label>Стоимость студии</label>
              <input
                type="number"
                name="priceStudio"
                value={formData.priceStudio}
                onChange={handleChange}
                placeholder="Введите стоимость"
              /> */}

                <label>Регион</label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="Введите регион"
                />
                {/* <MultiSelectAutocomplete
                isMultiple={true}
                dropdownWidth={"100%"}
                label={"Выберите аэропорты"}
                options={airportOptions}
                value={airportOptions.filter((option) =>
                  formData.airportIds?.includes(option.id)
                )}
                onChange={(event, newValue) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    airportIds: newValue.map((option) => option.id),
                    // city: newValue.length > 0 ? newValue[0].city : "",
                  }));
                  // setIsEdited(true);
                }}
              /> */}

                <label>Вид приложения</label>
                <MUIAutocomplete
                  dropdownWidth={"100%"}
                  label={"Выберите вид приложения"}
                  options={action}
                  value={
                    action.find(
                      (option) => option === formData.applicationType
                    ) || null
                  }
                  onChange={(event, newValue) => {
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      applicationType: newValue ? newValue : "",
                    }));
                  }}
                />

                <label>Комментарий</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Введите комментарий"
                ></textarea>

                {/* ВМЕСТО твоего <input type="file" ... /> */}
                {/* <label>Прикрепить файл</label> */}
                {/* <label className={classes.fileLabel}>Прикрепить файл</label> */}
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
                    <AttachIcon width={19} height={19} />

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

export default CreateRequestContract;
