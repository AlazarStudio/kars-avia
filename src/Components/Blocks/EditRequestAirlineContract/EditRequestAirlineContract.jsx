import React, { useCallback, useEffect, useRef, useState } from "react";
import classes from "./EditRequestAirlineContract.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  ARCHIVE_ADDITIONAL_AGREEMENT,
  convertToDate,
  CREATE_AIRLINE_AA,
  DELETE_AIRLINE_CONTRACT_AA,
  GET_AIRLINE_CONTRACT,
  GET_AIRLINES_RELAY,
  GET_AIRPORTS_RELAY,
  GET_ALL_COMPANIES,
  getCookie,
  getMediaUrl,
  REMOVE_AIRLINE_CONTRACT_FILE,
  RESTORE_ADDITIONAL_AGREEMENT,
  UPDATE_AIRLINE_CONTRACT,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUISwitch from "../MUISwitch/MUISwitch.jsx";
import { action } from "../../../roles.js";
import FixIcon from "../../../shared/icons/FixIcon.jsx";
import EditAdditionalAgreement from "../EditAdditionalAgreement/EditAdditionalAgreement.jsx";
import CreateAdditionalAgreement from "../CreateAdditionalAgreement/CreateAdditionalAgreement.jsx";
import AttachIcon from "../../../shared/icons/AttachIcon.jsx";
import DocIcon from "../../../shared/icons/DocIcon.jsx";
import FileIcon from "../../../shared/icons/FileIcon.jsx";
import { fileNameWithoutExt } from "../../../utils/fileName.js";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import EditContractAdditionalMenu from "../EditContractAdditionalMenu/EditContractAdditionalMenu.jsx";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon.jsx";
import DeleteIcon from "../../../shared/icons/DeleteIcon.jsx";
import PickedFilesEditor from "../PickedFilesEditor/PickedFilesEditor.jsx";
import { useDialog } from "../../../contexts/DialogContext.jsx";
import { useToast } from "../../../contexts/ToastContext.jsx";
import ArchiveIcon from "../../../shared/icons/ArchiveIcon.jsx";
import RestoreIcon from "../../../shared/icons/RestoreIcon.jsx";
import ArchiveContractModal from "../ArchiveContractModal/ArchiveContractModal.jsx";
import { getExpirationBadge } from "../../../utils/contractExpiration.js";

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
  canEdit = false, // Флаг для разрешения редактирования
  onRequestDelete, // колбэк: закрыть сайдбар и открыть модал удаления договора
  initialEditMode = false,
}) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

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

  const [archiveAdditionalAgreement] = useMutation(ARCHIVE_ADDITIONAL_AGREEMENT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [restoreAdditionalAgreement] = useMutation(RESTORE_ADDITIONAL_AGREEMENT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [removeAirlineContractFile] = useMutation(REMOVE_AIRLINE_CONTRACT_FILE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [archiveAgreementTarget, setArchiveAgreementTarget] = useState(null);

  const handleArchiveAgreement = (ag) => {
    if (!ag?.id) return;
    setArchiveAgreementTarget(ag);
  };

  const confirmArchiveAgreement = async () => {
    const ag = archiveAgreementTarget;
    if (!ag?.id) return;
    try {
      await archiveAdditionalAgreement({ variables: { id: ag.id } });
      await refetch();
      success("Дополнительное соглашение перенесено в архив.");
    } catch (err) {
      notifyError("Произошла ошибка при переносе ДС в архив.");
    } finally {
      setArchiveAgreementTarget(null);
    }
  };

  const handleRestoreAgreement = async (ag) => {
    if (!ag?.id) return;
    try {
      await restoreAdditionalAgreement({ variables: { id: ag.id } });
      await refetch();
      success("Дополнительное соглашение восстановлено из архива.");
    } catch (err) {
      notifyError("Произошла ошибка при восстановлении ДС.");
    }
  };

  const handleRemoveContractFile = async (file) => {
    const ok = await confirm("Удалить файл?");
    if (!ok) return;
    try {
      const { data } = await removeAirlineContractFile({
        variables: { contractId: tarif, fileUrl: file.url },
      });
      setFiles(data?.removeAirlineContractFile?.files || []);
      await refetch();
      success("Файл удалён.");
    } catch (err) {
      notifyError("Произошла ошибка при удалении файла.");
    }
  };

  const renderAgreementRow = (ag, index, { archived }) => {
    const exp = getExpirationBadge({
      endDate: ag.agreementEndDate,
      isExpired: ag.isExpired,
      daysUntilEnd: ag.daysUntilEnd,
    });
    return (
      <div
        key={ag.id || index}
        className={classes.requestData}
        style={{
          padding: "12px",
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          onClick={() => openAgreement(ag, index)}
          style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}
        >
          <div>{ag.contractNumber || "—"}</div>
          <div style={{ color: "var(--main-gray)" }}>
            {ag.agreementEndDate ? convertToDate(ag.agreementEndDate) : "—"}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {exp && <span style={{ fontSize: 11, color: exp.color }}>{exp.label}</span>}
            {ag.isProlongationEnabled && (
              <span style={{ fontSize: 11, color: "#0057C3", background: "rgba(0,87,195,0.1)", borderRadius: 6, padding: "1px 6px", whiteSpace: "nowrap" }}>
                ⟳ Пролонгация
              </span>
            )}
          </div>
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
            {archived ? (
              <span title="Восстановить из архива" style={{ display: "flex" }}>
                <RestoreIcon cursor="pointer" onClick={() => handleRestoreAgreement(ag)} />
              </span>
            ) : (
              <>
                <EditPencilIcon cursor="pointer" onClick={() => openAgreement(ag, index)} />
                <span title="Перенести ДС в архив" style={{ display: "flex" }}>
                  <ArchiveIcon cursor="pointer" onClick={() => handleArchiveAgreement(ag)} />
                </span>
                <DeleteIcon cursor="pointer" onClick={() => deleteAgreement(ag, index)} />
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Управление режимом редактирования (как в исходнике)
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (show) setIsEditing(initialEditMode);
  }, [show]);
  const [activeTab, setActiveTab] = useState("Общая");
  const [anchorEl, setAnchorEl] = useState(null);
  const menuRef = useRef(null);
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
    contractEndDate: "",
    isProlongationEnabled: false,
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
      contractEndDate: c.contractEndDate || "",
      isProlongationEnabled: !!c.isProlongationEnabled,
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
            agreementEndDate: a.agreementEndDate || "",
            isProlongationEnabled: !!a.isProlongationEnabled,
            isExpired: !!a.isExpired,
            daysUntilEnd: a.daysUntilEnd,
            isArchived: !!a.isArchived,
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

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    if (isEditing) {
      const ok = await confirm(
        "Вы уверены, все несохраненные данные будут удалены?",
      );
      if (!ok) return;
    }
    onClose?.();
    setIsEditing(false);
    setIsEdited(false);
    setActiveTab("Общая");
  }, [isEditing, onClose, isDialogOpen, confirm]);
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

  // Убрать один выбранный (ещё не сохранённый) файл до сохранения
  const removeRootFile = (index) => {
    setFileName((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      files: Array.from(prev.files || []).filter((_, i) => i !== index),
    }));
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

  const deleteAgreement = useCallback(
    async (ag, index) => {
      // console.log(ag);

      // Предупреждение перед удалением
      const isConfirmed = await confirm("Удалить дополнительное соглашение?");
      if (!isConfirmed) return;

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
        success("Дополнительное соглашение успешно удалено.");
      } catch (err) {
        notifyError("Произошла ошибка при удалении соглашения.");
      }
      refetch();
    },
    [confirm, refetch, success, notifyError],
  );

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
        contractEndDate: formData.contractEndDate
          ? new Date(formData.contractEndDate).toISOString()
          : null,
        isProlongationEnabled: !!formData.isProlongationEnabled,
        notes: formData.notes,
        applicationType: formData.applicationType,
        region: formData.region,
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
          fileNames: fileName.length
            ? fileName
            : (formData.files || []).map((f) => f.name),
        },
      });

      success("Изменения сохранены.");
      onClose();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      showAlert("Произошла ошибка при сохранении договора.");
    } finally {
      setIsLoading(false);
      setFileName([]);
      setIsEdited(false);
    }
  };
  // console.log(formData);

  useEffect(() => {
    if (!show) setAnchorEl(null);
  }, [show]);

  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;
      if (event.target.closest("[data-archive-modal]")) return;

      const clickedOutsideMain =
        sidebarRef.current && !sidebarRef.current.contains(event.target);
      const clickedOutsideAgreement = !agreementSidebarRef.current?.contains(
        event.target,
      );
      const clickedInsideMenu = event.target.closest('[role="menu"]');

      if (clickedOutsideMain && clickedOutsideAgreement && !clickedInsideMenu) {
        closeButton();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, isDialogOpen]); // ← важно

  return (
    <>
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>
            {formData?.contractNumber}
            {/* {canEdit ? "Изменить договор" : formData?.contractNumber} */}
          </div>
          <div className={classes.requestTitle_close}>
            {canEdit && (
              <EditContractAdditionalMenu
                anchorEl={anchorEl}
                onOpen={(e) => setAnchorEl(e?.currentTarget ?? e)}
                onClose={() => setAnchorEl(null)}
                menuRef={menuRef}
                canEdit={canEdit}
                onEdit={() => setIsEditing(true)}
                onDelete={() => onRequestDelete?.()}
              />
            )}
            <div onClick={closeButton} className={classes.closeIconWrapper}>
              <CloseIcon />
            </div>
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
          <div
            className={`${classes.tab} ${
              activeTab === "Архив ДС" ? classes.activeTab : ""
            }`}
            onClick={() => handleTabChange("Архив ДС")}
          >
            Архив ДС
          </div>
        </div>

        {loading || isLoading ? (
          <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
        ) : (
          <>
            {activeTab === "Общая" ? (
              <div
                className={classes.requestMiddle}
                style={
                  !canEdit
                    ? { height: "calc(100% - 148px)" }
                    : isEditing
                      ? { height: "calc(100vh - 198px)" }
                      : { height: "calc(100vh - 117px)" }
                }
              >
                <div className={classes.requestData}>
                  {/* Договор: основные поля */}
                  <div
                    className={
                      isEditing
                        ? classes.requestDataItem
                        : classes.requestDataInfo
                    }
                  >
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
                        <div className={classes.requestDataInfo_title}>
                          № Договора
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.contractNumber || "—"}
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    className={
                      isEditing
                        ? classes.requestDataItem
                        : classes.requestDataInfo
                    }
                  >
                    {isEditing ? (
                      <>
                        <label>Дата заключения</label>
                        <input
                          type="date"
                          name="date"
                          value={
                            formData.date ? formData.date.slice(0, 10) : ""
                          }
                          onChange={handleChange}
                          placeholder="Дата"
                        />
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>
                          Дата заключения
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.date ? convertToDate(formData.date) : "—"}
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    className={
                      isEditing
                        ? classes.requestDataItem
                        : classes.requestDataInfo
                    }
                  >
                    {isEditing ? (
                      <>
                        <label>Дата окончания срока действия</label>
                        <input
                          type="date"
                          name="contractEndDate"
                          value={
                            formData.contractEndDate
                              ? formData.contractEndDate.slice(0, 10)
                              : ""
                          }
                          onChange={handleChange}
                          placeholder="Дата"
                        />
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>
                          Дата окончания
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.contractEndDate
                            ? convertToDate(formData.contractEndDate)
                            : "—"}
                          {(() => {
                            const c = data?.airlineContract;
                            if (!c?.contractEndDate) return null;
                            if (c.isExpired)
                              return (
                                <span
                                  style={{ color: "var(--red)", marginLeft: 6 }}
                                >
                                  · Истёк
                                </span>
                              );
                            if (c.isExpiringSoon)
                              return (
                                <span
                                  style={{ color: "#E8A33D", marginLeft: 6 }}
                                >
                                  · Истекает
                                  {typeof c.daysUntilEnd === "number"
                                    ? ` (${c.daysUntilEnd} дн.)`
                                    : ""}
                                </span>
                              );
                            return null;
                          })()}
                        </div>
                      </>
                    )}
                  </div>

                  <div className={classes.requestDataInfo}>
                    {isEditing ? (
                      <>
                        {/* <label>Пролонгация</label> */}
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <MUISwitch
                            width={"100%"}
                            label={"Пролонгация"}
                            checked={formData.isProlongationEnabled}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                isProlongationEnabled: e.target.checked,
                              }));
                              setIsEdited(true);
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>
                          Пролонгация
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.isProlongationEnabled
                            ? "Включена"
                            : "Отключена"}
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    className={
                      isEditing
                        ? classes.requestDataItem
                        : classes.requestDataInfo
                    }
                  >
                    {isEditing ? (
                      <>
                        <label>ГК КАРС</label>
                        <MUIAutocomplete
                          dropdownWidth={"59%"}
                          label={"Введите компанию"}
                          options={companies?.map((item) => item.name)}
                          value={
                            companies.find(
                              (item) => item.id === formData.companyId,
                            )?.name || null
                          }
                          onChange={(event, newValue) => {
                            const selectedCompany = companies.find(
                              (item) => item.name === newValue,
                            );
                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              companyId: selectedCompany?.id || "",
                            }));
                            setIsEdited(true);
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>
                          ГК КАРС
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {companies?.find(
                            (item) => item.id === formData.companyId,
                          )?.name || "—"}
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    className={
                      isEditing
                        ? classes.requestDataItem
                        : classes.requestDataInfo
                    }
                  >
                    {isEditing ? (
                      <>
                        <label>Авиакомпания</label>
                        <MUIAutocomplete
                          dropdownWidth={"59%"}
                          label={"Выберите авиакомпанию"}
                          options={airlines?.map((airline) => airline.name)}
                          value={
                            airlines?.find(
                              (airline) => airline.id === formData.airlineId,
                            )?.name || null
                          }
                          onChange={(event, newValue) => {
                            const selectedAirline = airlines.find(
                              (airline) => airline.name === newValue,
                            );
                            setSelectedAirline(selectedAirline);
                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              airlineId: selectedAirline?.id || "",
                            }));
                            setIsEdited(true);
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>
                          Авиакомпания
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {airlines?.find(
                            (airline) => airline.id === formData.airlineId,
                          )?.name || "—"}
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    className={
                      isEditing
                        ? classes.requestDataItem
                        : classes.requestDataInfo
                    }
                  >
                    {isEditing ? (
                      <>
                        <label>Регион</label>
                        <input
                          type="text"
                          name="region"
                          value={formData.region}
                          onChange={handleChange}
                          placeholder="Введите регион"
                        />
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>
                          Регион
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.region || "—"}
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    className={
                      isEditing
                        ? classes.requestDataItem
                        : classes.requestDataInfo
                    }
                  >
                    {isEditing ? (
                      <>
                        <label>Предмет договора</label>
                        <MUIAutocomplete
                          dropdownWidth={"59%"}
                          label={"Выберите предмет договора"}
                          options={action}
                          value={
                            action.find(
                              (option) => option === formData.applicationType,
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
                      </>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>
                          Предмет договора
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.applicationType || "—"}
                        </div>
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
                  {canEdit && isEditing && (
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

                  {canEdit && isEditing && (
                    <PickedFilesEditor
                      names={fileName}
                      onChange={setFileName}
                      onRemove={removeRootFile}
                    />
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
                  {formData.additionalAgreements.map((ag, index) =>
                    ag.isArchived ? null : renderAgreementRow(ag, index, { archived: false })
                  )}
                </div>
              </div>
            ) : activeTab === "Архив ДС" ? (
              <div
                className={classes.requestMiddle}
                style={!canEdit ? { height: "calc(100% - 148px)" } : {}}
              >
                <div className={classes.requestData}>
                  {formData.additionalAgreements.filter((ag) => ag.isArchived).length === 0 ? (
                    <div style={{ color: "var(--main-gray)" }}>Нет архивных ДС</div>
                  ) : (
                    formData.additionalAgreements.map((ag, index) =>
                      ag.isArchived ? renderAgreementRow(ag, index, { archived: true }) : null
                    )
                  )}
                </div>
              </div>
            ) : (
              <div
                className={classes.requestMiddle}
                style={!canEdit ? { height: "calc(100% - 148px)" } : {}}
              >
                <div className={classes.requestData}>
                  {files?.map((i, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <a
                        href={getMediaUrl(i.url)}
                        target="_blank"
                        className={classes.downloadsButton}
                        rel="noopener noreferrer"
                        style={{ flex: 1 }}
                      >
                        <FileIcon name={i.name} width={38} height={43} style={{ flexShrink: 0 }} />
                        {fileNameWithoutExt(i.name) || `файл №${index + 1}`}
                      </a>
                      {canEdit && (
                        <span
                          title="Удалить файл"
                          onClick={() => handleRemoveContractFile(i)}
                          style={{ display: "flex", cursor: "pointer", padding: "0 4px" }}
                        >
                          <DeleteIcon cursor="pointer" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Общая" && canEdit && isEditing && (
              <div className={classes.requestButton}>
                <Button
                  onClick={() => setIsEditing(false)}
                  backgroundcolor="var(--hover-gray)"
                  color="#000"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  backgroundcolor="#0057C3"
                  color="#fff"
                >
                  Сохранить <img src="/saveDispatcher.png" alt="" />
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
        agreementSidebarRef={agreementSidebarRef}
        onRequestDelete={
          canEdit && selectedAgreement != null
            ? () => {
                const ag = selectedAgreement.data;
                const idx = selectedAgreement.index;
                closeAgreement();
                if (ag != null && idx != null) deleteAgreement(ag, idx);
              }
            : undefined
        }
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

      {archiveAgreementTarget && (
        <ArchiveContractModal
          title="Перенести ДС в архив?"
          entityLabel="ДС"
          number={archiveAgreementTarget.contractNumber}
          onCancel={() => setArchiveAgreementTarget(null)}
          onConfirm={confirmArchiveAgreement}
        />
      )}
    </>
  );
}

export default EditRequestAirlineContract;
