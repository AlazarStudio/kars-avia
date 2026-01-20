import React, { useCallback, useEffect, useRef, useState } from "react";
import classes from "./EditRequestAirlineContract.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  convertToDate,
  CREATE_AIRLINE_AA,
  DELETE_AIRLINE_CONTRACT_AA,
  GET_AIRLINE_CONTRACT,
  GET_AIRLINES_RELAY,
  GET_AIRPORTS_RELAY,
  GET_ALL_COMPANIES,
  getCookie,
  server,
  UPDATE_AIRLINE_CONTRACT,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import { action } from "../../../roles.js";
import FixIcon from "../../../shared/icons/FixIcon.jsx";
import EditAdditionalAgreement from "../EditAdditionalAgreement/EditAdditionalAgreement.jsx";
import CreateAdditionalAgreement from "../CreateAdditionalAgreement/CreateAdditionalAgreement.jsx";
import AttachIcon from "../../../shared/icons/AttachIcon.jsx";
import DocIcon from "../../../shared/icons/DocIcon.jsx";

/**
 * Компонент редактирования договора авиакомпании.
 * - тянет данные по GET_AIRLINE_CONTRACT
 * - показывает поля договора и массив дополнительных соглашений
 * - файлы для договора и каждого ДС редактируются отдельно
 *
 * ВАЖНО: стили и className НЕ менял, только разметку внутри текущих контейнеров.
 */
function EditRequestAirlineContract({
  show,
  onClose,
  activeFilterTab,
  id,
  tarif, // тут приходит airlineContractId
  addNotification,
  canEdit = false, // Флаг для разрешения редактирования
}) {
  const token = getCookie("token");

  // Тянем справочник аэропортов, если он тебе нужен далее (оставляю как в исходнике)
  const infoAirports = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });

  const { data: airlinesData } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });

  const { data: companiesData } = useQuery(GET_ALL_COMPANIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data, loading, error, refetch } = useQuery(GET_AIRLINE_CONTRACT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { airlineContractId: tarif },
    skip: !tarif || !show,
  });

  const [updateAirlineContract] = useMutation(UPDATE_AIRLINE_CONTRACT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

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
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [airlines, setAirlines] = useState([]); // Список авиакомпаний
  const [airports, setAirports] = useState([]); // Список аэропортов
  const [companies, setCompanies] = useState([]); // Список авиакомпаний
  const [selectedAirline, setSelectedAirline] = useState(null); // Выбранная авиакомпания

  // Локальная форма
  const [formData, setFormData] = useState({
    // контракт
    contractNumber: "",
    date: "",
    companyId: "",
    airlineId: "",
    region: "",
    applicationType: "",
    notes: "",
    files: [],

    // массив доп. соглашений
    additionalAgreements: [], // [{id, contractNumber, date, itemAgreement, notes, files}]
  });
  const [files, setFiles] = useState([]);

  // Гидрация из запроса
  useEffect(() => {
    if (!data?.airlineContract) return;
    const c = data.airlineContract;
    setFormData({
      contractNumber: c.contractNumber || "",
      date: c.date || "",
      companyId: c.companyId || "",
      airlineId: c.airlineId || "",
      region: c.region || "",
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
  }, [data]);

  // refs для закрытия по клику вне сайдбара
  const sidebarRef = useRef();
  const agreementSidebarRef = useRef(); // New ref for the EditAdditionalAgreement sidebar

  // const closeButton = () => {
  //   const success = confirm(
  //     "Вы уверены, все несохраненные данные будут удалены?"
  //   );
  //   if (success || isEdited) {
  //     onClose?.();
  //     setIsEditing(false);
  //     setIsEdited(false);
  //     setActiveTab("Общая");
  //   }
  // };

  const closeButton = useCallback(() => {
    if (isEditing) {
      const ok = confirm("Вы уверены, все несохраненные данные будут удалены?");
      if (!ok) return;
    }
    onClose?.();
    setIsEditing(false);
    setIsEdited(false);
    setActiveTab("Общая");
  }, [isEditing, onClose]);
  // console.log(isEdited);

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

  // Общий onChange
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setIsEdited(true);
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

  const addNewAgreement = () => {
    setFormData((p) => ({
      ...p,
      additionalAgreements: [
        ...p.additionalAgreements,
        {
          id: undefined,
          contractNumber: "",
          date: "",
          itemAgreement: "",
          notes: "",
          files: [],
        },
      ],
    }));
    setIsEditing(true);
  };

  // Сабмит (оставляю локально; сюда можно подставить твои UPDATE_* мутации)
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    try {
      setIsLoading(true);
      // тут подставь свои мутации обновления договора/ДС,
      // используя данные из formData (files и files у ДС отправляй так же, как при создании).
      // пример полезной структуры:
      const payload = {
        contractNumber: formData.contractNumber,
        date: formData.date ? new Date(formData.date).toISOString() : null,
        notes: formData.notes,
        applicationType: formData.applicationType,
        region: formData.region,
        files: formData.files,
        companyId: formData.companyId,
        airlineId: formData.airlineId,
        // additionalAgreements: formData.additionalAgreements.map(a => ({
        //   ...a,
        //   date: a.date ? new Date(a.date).toISOString() : null
        // })),
      };
      await updateAirlineContract({
        variables: {
          updateAirlineContractId: tarif,
          input: payload,
          files: formData.files,
        },
      });

      addNotification?.("Изменения сохранены.", "success");
      onClose();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Произошла ошибка при сохранении договора.");
    } finally {
      setIsLoading(false);
      setFileName([]);
      setIsEdited(false);
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
            {canEdit ? "Изменить договор" : formData?.contractNumber}
          </div>
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
          <div
            className={`${classes.tab} ${
              activeTab === "Файлы" ? classes.activeTab : ""
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
                  <div className={classes.requestDataItem}>
                    <label>№ Договора</label>
                    <input
                      type="text"
                      name="contractNumber"
                      value={formData.contractNumber}
                      onChange={handleChange}
                      placeholder="Например: Договор №1"
                      disabled={!isEditing}
                    />
                  </div>

                  <div className={classes.requestDataItem}>
                    <label>Дата заключения</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date ? formData.date.slice(0, 10) : ""}
                      onChange={handleChange}
                      placeholder="Дата"
                      disabled={!isEditing}
                    />
                  </div>

                  <div className={classes.requestDataItem}>
                    <label>ГК КАРС</label>
                    <MUIAutocomplete
                      dropdownWidth={"59%"}
                      label={"Введите компанию"}
                      options={companies?.map((item) => item.name)}
                      value={
                        companies.find((item) => item.id === formData.companyId)
                          ?.name || null
                      }
                      onChange={(event, newValue) => {
                        const selectedCompany = companies.find(
                          (item) => item.name === newValue
                        );
                        // setSelectedCompany(selectedCompany);
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          companyId: selectedCompany?.id || "",
                        }));
                        setIsEdited(true);
                      }}
                      isDisabled={!isEditing}
                    />
                  </div>

                  <div className={classes.requestDataItem}>
                    <label>Авиакомпания</label>
                    <MUIAutocomplete
                      dropdownWidth={"59%"}
                      label={"Выберите авиакомпанию"}
                      isDisabled={!isEditing}
                      options={airlines?.map((airline) => airline.name)}
                      value={
                        airlines?.find(
                          (airline) => airline.id === formData.airlineId
                        )?.name || null
                      }
                      onChange={(event, newValue) => {
                        const selectedAirline = airlines.find(
                          (airline) => airline.name === newValue
                        );
                        setSelectedAirline(selectedAirline);
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          airlineId: selectedAirline?.id || "",
                        }));
                        setIsEdited(true);
                      }}
                    />
                  </div>

                  <div className={classes.requestDataItem}>
                    <label>Регион</label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      placeholder="Введите регион"
                      disabled={!isEditing}
                    />
                  </div>

                  <div className={classes.requestDataItem}>
                    <label>Вид приложения</label>
                    <MUIAutocomplete
                      dropdownWidth={"59%"}
                      label={"Выберите вид приложения"}
                      isDisabled={!isEditing}
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
                        setIsEdited(true);
                      }}
                    />
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
                        id="files"
                        type="file"
                        className={classes.fileInputHidden}
                        onChange={onFilesPicked}
                        multiple
                        disabled={!isEditing}
                      />

                      <label htmlFor="files" className={classes.fileInner}>
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
                      href={`${server}${i}`}
                      target="_blank"
                      className={classes.downloadsButton}
                      rel="noopener noreferrer"
                    >
                      {/* <img src="/downloadManifest.png" alt="Скачать" /> */}
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

export default EditRequestAirlineContract;
