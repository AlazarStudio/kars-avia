import React, { useEffect, useRef, useState } from "react";
import classes from "./EditAdditionalAgreement.module.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import Button from "../../Standart/Button/Button.jsx";
import FixIcon from "../../../shared/icons/FixIcon.jsx";
import { useMutation } from "@apollo/client";
import {
  CREATE_AIRLINE_AA,
  server,
  UPDATE_AIRLINE_CONTRACT_AA,
} from "../../../../graphQL_requests.js";
import AttachIcon from "../../../shared/icons/AttachIcon.jsx";
import DocIcon from "../../../shared/icons/DocIcon.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";

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
}) {
  const [local, setLocal] = useState({
    id: undefined,
    contractNumber: "",
    date: "",
    itemAgreement: "",
    notes: "",
    files: [],
  });
  const [isEditing, setIsEditing] = useState(false);

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

  useEffect(() => {
    if (agreement) setLocal({ ...agreement, files: "" });
  }, [agreement]);

  const sidebarRef = useRef();
  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose?.();
        setIsEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show]);

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
          itemAgreement: local.itemAgreement,
          notes: local.notes,
        },
        ...(local.files && { files: local.files }),
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

  return (
    <Sidebar show={show} sidebarRef={agreementSidebarRef}>
      <div className={classes.requestTitle}>
        <div
          className={classes.requestTitle_close}
          onClick={() => {
            onClose(), setIsEditing(false);
          }}
        >
          <img src="/arrow.png" alt="" />
        </div>
        <div className={classes.requestTitle_name}>
          {local.contractNumber || "—"}
        </div>
      </div>
      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
      ) : (
        <>
          <div
            className={classes.requestMiddle}
            style={!canEdit ? { height: "calc(100% - 148px)" } : {}}
          >
            <div className={classes.requestData}>
              <label>№ ДС</label>
              <input
                type="text"
                name="contractNumber"
                value={local.contractNumber}
                onChange={handleChange}
                placeholder="Например: ДС №1"
                disabled={!agreement?.id ? false : !isEditing}
              />

              <label>Дата заключения</label>
              <input
                type="date"
                name="date"
                value={local.date ? local.date.slice(0, 10) : ""}
                onChange={handleChange}
                placeholder="Дата"
                disabled={!agreement?.id ? false : !isEditing}
              />

              <label>Предмет ДС</label>
              <input
                type="text"
                name="itemAgreement"
                value={local.itemAgreement}
                onChange={handleChange}
                placeholder="Например: Уведомление"
                disabled={!agreement?.id ? false : !isEditing}
              />

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
              ) : (
                <div className={classes.notesWrapper}>
                  <div className={classes.notesHeader}>
                    <p>Комментарий</p>
                    <FixIcon />
                  </div>
                  <div className={classes.notes}>{local.notes}</div>
                </div>
              )}

              <label>Файлы ДС</label>
              {/* {console.log(local.files)} */}
              {agreement?.files?.map((i, index) => (
                <a
                  key={index}
                  href={`${server}${i}`}
                  target="_blank"
                  className={classes.downloadsButton}
                  rel="noopener noreferrer"
                  disabled={!agreement?.id ? false : !isEditing}
                >
                  {/* <img src="/downloadManifest.png" alt="Скачать" /> */}
                  <DocIcon width={32} height={35} />
                  {local.contractNumber} файл №{index + 1}
                  {/* Скачать */}
                </a>
              ))}
              {/* <input type="file" onChange={handleFiles} multiple /> */}
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
            </div>
          </div>

          {canEdit && (
            <div className={classes.requestButton}>
              <Button
                type="button"
                onClick={save}
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
  );
}

export default EditAdditionalAgreement;
