import React, { useEffect, useRef, useState } from "react";
import classes from "./CreateAdditionalAgreement.module.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import Button from "../../Standart/Button/Button.jsx";
import FixIcon from "../../../shared/icons/FixIcon.jsx";
import { useMutation } from "@apollo/client";
import {
  CREATE_AIRLINE_AA,
  getMediaUrl,
  UPDATE_AIRLINE_CONTRACT_AA,
} from "../../../../graphQL_requests.js";
import AttachIcon from "../../../shared/icons/AttachIcon.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";

function CreateAdditionalAgreement({
  show,
  onClose,
  activeFilterTab,
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
  // console.log(agreement);

  const [createAirlineAA] = useMutation(CREATE_AIRLINE_AA, {
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

  useEffect(() => {
    if (!show) {
      setLocal({
        id: undefined,
        contractNumber: "",
        date: "",
        itemAgreement: "",
        notes: "",
        files: [],
      });
    }
  }, [show]);

  const sidebarRef = useRef();
  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose?.();
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
    // console.log(file?.map((i) => i.name));

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

  const typeId = activeFilterTab === "hotels" ? "hotelContractId": activeFilterTab === "airlines" ? "airlineContractId" : "organizationContractId"
  const create = async () => {
    setIsLoading(true);
    await createAirlineAA({
      variables: {
        input: {
          [typeId]: updId,
          contractNumber: local.contractNumber,
          date: new Date(local.date).toISOString(),
          itemAgreement: local.itemAgreement,
          notes: local.notes,
        },
        files: local.files,
      },
    });
    refetch();
    onSave?.(local);
    setIsLoading(false);
    setLocal({
      id: undefined,
      contractNumber: "",
      date: "",
      itemAgreement: "",
      notes: "",
      files: [],
    });
    setFileName([]);
  };

  return (
    <Sidebar show={show} sidebarRef={agreementSidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_close} onClick={onClose}>
          <img src="/arrow.png" alt="" />
        </div>
        <div className={classes.requestTitle_name}>
          {/* {local.contractNumber || "—"} */}
          Создать ДС
        </div>
      </div>
      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>№ ДС</label>
              <input
                type="text"
                name="contractNumber"
                value={local.contractNumber}
                onChange={handleChange}
                placeholder="Например: ДС №1"
              />

              <label>Дата заключения</label>
              <input
                type="date"
                name="date"
                value={local.date ? local.date.slice(0, 10) : ""}
                onChange={handleChange}
                placeholder="Дата"
              />

              <label>Предмет ДС</label>
              <input
                type="text"
                name="itemAgreement"
                value={local.itemAgreement}
                onChange={handleChange}
                placeholder="Например: Уведомление"
              />

              <label>Комментарий</label>
              <textarea
                name="notes"
                value={local.notes}
                onChange={handleChange}
                placeholder="Введите комментарий"
              />

              <label>Файлы ДС</label>
              {/* {console.log(local.files)} */}
              {agreement?.files?.map((i, index) => (
                <a
                  key={index}
                  href={getMediaUrl(i)}
                  target="_blank"
                  className={classes.downloadsButton}
                  rel="noopener noreferrer"
                >
                  <img src="/downloadManifest.png" alt="Скачать" />
                  {local.contractNumber} файл №{index + 1}
                  {/* Скачать */}
                </a>
              ))}
              {/* <input type="file" onChange={handleFiles} multiple /> */}
              <div
                ref={dropRef}
                className={classes.fileDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <input
                  id="filesCreate"
                  type="file"
                  className={classes.fileInputHidden}
                  onChange={onFilesPicked}
                  multiple
                />

                <label htmlFor="filesCreate" className={classes.fileInner}>
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

          <div className={classes.requestButton}>
            <Button type="button" onClick={create}>
              Сохранить <img src="/saveDispatcher.png" alt="" />
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateAdditionalAgreement;
