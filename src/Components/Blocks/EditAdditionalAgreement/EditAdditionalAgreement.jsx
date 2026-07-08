import React, { useEffect, useRef, useState } from "react";
import classes from "./EditAdditionalAgreement.module.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import Button from "../../Standart/Button/Button.jsx";
import FixIcon from "../../../shared/icons/FixIcon.jsx";
import { useMutation } from "@apollo/client";
import {
  convertToDate,
  CREATE_AIRLINE_AA,
  getMediaUrl,
  REMOVE_ADDITIONAL_AGREEMENT_FILE,
  UPDATE_AIRLINE_CONTRACT_AA,
} from "../../../../graphQL_requests.js";
import { useDialog } from "../../../contexts/DialogContext.jsx";
import AttachIcon from "../../../shared/icons/AttachIcon.jsx";
import DocIcon from "../../../shared/icons/DocIcon.jsx";
import FileIcon from "../../../shared/icons/FileIcon.jsx";
import DeleteIcon from "../../../shared/icons/DeleteIcon.jsx";
import PickedFilesEditor from "../PickedFilesEditor/PickedFilesEditor.jsx";
import { fileNameWithoutExt } from "../../../utils/fileName.js";
import MUILoader from "../MUILoader/MUILoader.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import EditContractAdditionalMenu from "../EditContractAdditionalMenu/EditContractAdditionalMenu.jsx";
import MUISwitch from "../MUISwitch/MUISwitch.jsx";
import { getExpirationBadge } from "../../../utils/contractExpiration.js";

function EditAdditionalAgreement({
  show,
  id,
  canEdit = false,
  onClose,
  agreement,
  onSave,
  refetch,
  updId,
  token,
  agreementSidebarRef,
  onRequestDelete,
}) {
  const [local, setLocal] = useState({
    id: undefined,
    contractNumber: "",
    date: "",
    agreementEndDate: "",
    isProlongationEnabled: false,
    itemAgreement: "",
    notes: "",
    files: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [agFiles, setAgFiles] = useState([]);
  const menuRef = useRef(null);
  const { confirm } = useDialog();

  // console.log(agreement);

  const [createAirlineAA] = useMutation(CREATE_AIRLINE_AA, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [updateAirlineAA] = useMutation(UPDATE_AIRLINE_CONTRACT_AA, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [removeAdditionalAgreementFile] = useMutation(
    REMOVE_ADDITIONAL_AGREEMENT_FILE,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Apollo-Require-Preflight": "true",
        },
      },
    }
  );

  useEffect(() => {
    if (agreement) setLocal({ ...agreement, files: "" });
  }, [agreement]);

  useEffect(() => {
    setAgFiles(Array.isArray(agreement?.files) ? agreement.files : []);
  }, [agreement]);

  useEffect(() => {
    if (!show) setAnchorEl(null);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (event) => {
      const clickedInsideMenu = event.target.closest("[role=\"menu\"]");
      if (
        agreementSidebarRef?.current &&
        !agreementSidebarRef.current.contains(event.target) &&
        !clickedInsideMenu
      ) {
        onClose?.();
        setIsEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, onClose, agreementSidebarRef]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocal((p) => ({ ...p, [name]: value }));
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setLocal((p) => ({ ...p, files }));
  };
  const [fileName, setFileName] = useState([]);

  const onFilesPicked = (e) => {
    const file = Array.from(e.target.files || []);
    if (file) {
      setFileName(file.map((i) => i.name));
      setLocal((prev) => ({ ...prev, files: file }));
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
      setLocal((prev) => ({ ...prev, files: file }));
    }
  };

  // Убрать один выбранный (ещё не сохранённый) файл до сохранения
  const removeFile = (index) => {
    setFileName((prev) => prev.filter((_, i) => i !== index));
    setLocal((prev) => ({
      ...prev,
      files: Array.from(prev.files || []).filter((_, i) => i !== index),
    }));
  };

  const [isLoading, setIsLoading] = useState(false);

  const save = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    setIsLoading(true);
    // agreement?.id ?
    await updateAirlineAA({
      variables: {
        updateAdditionalAgreementId: agreement?.id,
        input: {
          contractNumber: local.contractNumber,
          date: new Date(local.date).toISOString(),
          agreementEndDate: local.agreementEndDate
            ? new Date(local.agreementEndDate).toISOString()
            : null,
          isProlongationEnabled: !!local.isProlongationEnabled,
          itemAgreement: local.itemAgreement,
          notes: local.notes,
        },
        ...(local.files && local.files.length
          ? {
              files: local.files,
              fileNames: fileName.length
                ? fileName
                : local.files.map((f) => f.name),
            }
          : {}),
      },
    });
    // : await createAirlineAA({
    //     variables: {
    //       input: {
    //         airlineContractId: updId,
    //         hotelContractId: updId,
    //         contractNumber: local.contractNumber,
    //         date: new Date(local.date).toISOString(),
    //         itemAgreement: local.itemAgreement,
    //         notes: local.notes,
    //       },
    //       files: local.files,
    //     },
    //   });
    refetch();
    setIsEditing(false);
    setIsLoading(false);
    onSave?.(local);
    setFileName([]);
  };

  // const create = async () => {
  //   await createAirlineAA({
  //     variables: {
  //       input: {
  //         airlineContractId: updId,
  //         contractNumber: local.contractNumber,
  //         date: new Date(local.date).toISOString(),
  //         itemAgreement: local.itemAgreement,
  //         notes: local.notes,
  //       },
  //       files: local.files,
  //     },
  //   });
  //   refetch();
  //   onSave?.(local);
  // };

  const handleClose = () => {
    onClose?.();
    setIsEditing(false);
  };

  const handleRemoveFile = async (fileUrl) => {
    if (!(await confirm("Удалить файл?"))) return;
    const { data } = await removeAdditionalAgreementFile({
      variables: { agreementId: agreement.id, fileUrl },
    });
    if (data?.removeAdditionalAgreementFile) {
      setAgFiles(data.removeAdditionalAgreementFile.files);
      refetch();
    }
  };

  return (
    <Sidebar show={show} sidebarRef={agreementSidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_left}>
          <div
            className={classes.requestTitle_back}
            onClick={handleClose}
          >
            <img src="/arrow.png" alt="" />
          </div>
          <div className={classes.requestTitle_name}>
            {local.contractNumber || "—"}
          </div>
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
          <div onClick={handleClose} className={classes.closeIconWrapper}>
            <CloseIcon />
          </div>
        </div>
      </div>
      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
      ) : (
        <>
          <div
            className={classes.requestMiddle}
            style={!canEdit ? { height: "calc(100% - 148px)" } : isEditing ? {height: "calc(100vh - 161px)"} : {height: "calc(100vh - 80px)"}}
          >
            <div className={classes.requestData}>
              <div className={agreement?.id && !isEditing ? classes.requestDataInfo : classes.requestDataItem}>
                {agreement?.id && !isEditing ? (
                  <>
                    <div className={classes.requestDataInfo_title}>№ ДС</div>
                    <div className={classes.requestDataInfo_desc}>{local.contractNumber || "—"}</div>
                  </>
                ) : (
                  <>
                    <label>№ ДС</label>
                    <input
                      type="text"
                      name="contractNumber"
                      value={local.contractNumber}
                      onChange={handleChange}
                      placeholder="Например: ДС №1"
                      disabled={!agreement?.id ? false : !isEditing}
                    />
                  </>
                )}
              </div>

              <div className={agreement?.id && !isEditing ? classes.requestDataInfo : classes.requestDataItem}>
                {agreement?.id && !isEditing ? (
                  <>
                    <div className={classes.requestDataInfo_title}>Дата заключения</div>
                    <div className={classes.requestDataInfo_desc}>{local.date ? convertToDate(local.date) : "—"}</div>
                  </>
                ) : (
                  <>
                    <label>Дата заключения</label>
                    <input
                      type="date"
                      name="date"
                      value={local.date ? local.date.slice(0, 10) : ""}
                      onChange={handleChange}
                      placeholder="Дата"
                      disabled={!agreement?.id ? false : !isEditing}
                    />
                  </>
                )}
              </div>

              <div className={agreement?.id && !isEditing ? classes.requestDataInfo : classes.requestDataItem}>
                {agreement?.id && !isEditing ? (
                  <>
                    <div className={classes.requestDataInfo_title}>Дата окончания срока действия</div>
                    <div className={classes.requestDataInfo_desc}>
                      {local.agreementEndDate ? convertToDate(local.agreementEndDate) : "—"}
                      {(() => {
                        const exp = getExpirationBadge({
                          endDate: agreement?.agreementEndDate,
                          isExpired: agreement?.isExpired,
                          daysUntilEnd: agreement?.daysUntilEnd,
                        });
                        return exp ? (
                          <span style={{ marginLeft: 8, fontSize: 11, color: exp.color }}>{exp.label}</span>
                        ) : null;
                      })()}
                    </div>
                  </>
                ) : (
                  <>
                    <label>Дата окончания срока действия</label>
                    <input
                      type="date"
                      name="agreementEndDate"
                      value={local.agreementEndDate ? local.agreementEndDate.slice(0, 10) : ""}
                      onChange={handleChange}
                      placeholder="Дата"
                      disabled={!agreement?.id ? false : !isEditing}
                    />
                  </>
                )}
              </div>

              <div className={agreement?.id && !isEditing ? classes.requestDataInfo : null}>
                {agreement?.id && !isEditing ? (
                  <>
                    <div className={classes.requestDataInfo_title}>Пролонгация</div>
                    <div className={classes.requestDataInfo_desc}>{local.isProlongationEnabled ? "Да" : "Нет"}</div>
                  </>
                ) : (
                  <MUISwitch
                    width={"100%"}
                    label={"Пролонгация"}
                    checked={local.isProlongationEnabled}
                    onChange={(e) =>
                      setLocal((p) => ({ ...p, isProlongationEnabled: e.target.checked }))
                    }
                  />
                )}
              </div>

              <div className={agreement?.id && !isEditing ? classes.requestDataInfo : classes.requestDataItem}>
                {agreement?.id && !isEditing ? (
                  <>
                    <div className={classes.requestDataInfo_title}>Предмет ДС</div>
                    <div className={classes.requestDataInfo_desc}>{local.itemAgreement || "—"}</div>
                  </>
                ) : (
                  <>
                    <label>Предмет ДС</label>
                    <input
                      type="text"
                      name="itemAgreement"
                      value={local.itemAgreement}
                      onChange={handleChange}
                      placeholder="Например: Уведомление"
                      disabled={!agreement?.id ? false : !isEditing}
                    />
                  </>
                )}
              </div>

              {/* <label>Комментарий</label>
              <textarea
                name="notes"
                value={local.notes}
                onChange={handleChange}
                placeholder="Введите комментарий"
                disabled={!agreement?.id ? false : !isEditing}
              /> */}
              {isEditing ? (
                <>
                  <label>Комментарий</label>
                  <textarea
                    name="notes"
                    value={local.notes}
                    onChange={handleChange}
                    placeholder="Введите комментарий"
                    disabled={!isEditing}
                  ></textarea>
                </>
              ) : local.notes ? (
                <div className={classes.notesWrapper}>
                  <div className={classes.notesHeader}>
                    <p>Комментарий</p>
                    <FixIcon />
                  </div>
                  <div className={classes.notes}>{local.notes}</div>
                </div>
              ) : null}

              <label>Файлы ДС</label>
              {/* {console.log(local.files)} */}
              {agFiles?.map((i, index) => (
                <div
                  key={index}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <a
                    href={getMediaUrl(i.url)}
                    target="_blank"
                    className={classes.downloadsButton}
                    rel="noopener noreferrer"
                    disabled={!agreement?.id ? false : !isEditing}
                    style={{ flex: 1 }}
                  >
                    <FileIcon name={i.name} width={38} height={43} style={{ flexShrink: 0 }} />
                    {fileNameWithoutExt(i.name) || `файл №${index + 1}`}
                  </a>
                  {canEdit && (
                    <div
                      onClick={() => handleRemoveFile(i.url)}
                      style={{ cursor: "pointer", display: "flex" }}
                      title="Удалить файл"
                    >
                      <DeleteIcon cursor="pointer" />
                    </div>
                  )}
                </div>
              ))}
              {/* <input type="file" onChange={handleFiles} multiple /> */}
              {(canEdit && isEditing) && (
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
                    disabled={!agreement?.id ? false : !isEditing}
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
                  onRemove={removeFile}
                />
              )}
            </div>
          </div>

          {canEdit && isEditing && (
            <div className={classes.requestButton}>
              <Button
                onClick={() => setIsEditing(false)}
                backgroundcolor="var(--hover-gray)"
                color="#000"
              >
                Отмена
              </Button>
              <Button
                type="button"
                onClick={save}
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
  );
}

export default EditAdditionalAgreement;
