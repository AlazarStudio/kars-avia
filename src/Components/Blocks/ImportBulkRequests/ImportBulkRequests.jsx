import React, { useCallback, useEffect, useRef, useState } from "react";
import classes from "./ImportBulkRequests.module.css";
import Sidebar from "../Sidebar/Sidebar";
import Button from "../../Standart/Button/Button";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import MUILoader from "../MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import FileDropzone from "../FileDropzone/FileDropzone.jsx";
import { useMutation, useQuery } from "@apollo/client";
import {
  IMPORT_BULK_REQUESTS,
  GET_AIRLINES_RELAY,
  GET_AIRPORTS_RELAY,
  decodeJWT,
  getCookie,
} from "../../../../graphQL_requests";
import { parseBulkXlsx } from "../../../utils/parseBulkXlsx";
import { useToast } from "../../../contexts/ToastContext.jsx";
import { useDialog } from "../../../contexts/DialogContext.jsx";

function ImportBulkRequests({ show, onClose, user, onImported, embedded = false, registerClose }) {
  const token = getCookie("token");
  const { success } = useToast();
  const { showAlert, confirm, isDialogOpen } = useDialog();
  const sidebarRef = useRef();

  const ctx = { context: { headers: { Authorization: `Bearer ${token}` } } };

  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [airportId, setAirportId] = useState("");
  const [reserve, setReserve] = useState(false);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [serverErrors, setServerErrors] = useState([]);
  const [fileError, setFileError] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  const { data: airlinesData } = useQuery(GET_AIRLINES_RELAY, { ...ctx, skip: !show });
  const { data: airportsData } = useQuery(GET_AIRPORTS_RELAY, { ...ctx, skip: !show });

  useEffect(() => {
    if (airlinesData?.airlines?.airlines) setAirlines(airlinesData.airlines.airlines);
  }, [airlinesData]);
  useEffect(() => {
    if (airportsData?.airports) setAirports(airportsData.airports);
  }, [airportsData]);

  const [importBulk] = useMutation(IMPORT_BULK_REQUESTS, ctx);

  // АК фиксируется для пользователя-авиакомпании (на Этапе 1 не используется — гейт только суперадмин)
  const airlineId = user?.airlineId || selectedAirline?.id || "";

  const reset = useCallback(() => {
    setFile(null);
    setParsed(null);
    setServerErrors([]);
    setFileError(null);
    setSelectedAirline(null);
    setAirportId("");
    setReserve(false);
    setIsEdited(false);
  }, []);

  // Закрытие с подтверждением, если есть несохранённые изменения
  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;
    if (!isEdited) {
      reset();
      onClose();
      return;
    }
    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      reset();
      onClose();
    }
  }, [isEdited, isDialogOpen, confirm, onClose, reset]);

  // Клик вне боковой панели закрывает её (с подтверждением)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest?.(".MuiSnackbar-root")) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };
    if (show && !embedded) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, embedded, closeButton, isDialogOpen]);

  // В embedded-режиме враппер закрывает активный режим через этот колбэк
  useEffect(() => {
    if (embedded) registerClose?.(closeButton);
  }, [embedded, registerClose, closeButton]);

  const handleFile = async (f) => {
    setServerErrors([]);
    setFileError(null);
    setIsEdited(true);
    setParsing(true);
    try {
      setParsed(await parseBulkXlsx(f));
      setFile(f);
    } catch (err) {
      console.error(err);
      setFile(null);
      setParsed(null);
      setFileError("Не удалось прочитать файл. Проверьте формат XLSX.");
    } finally {
      setParsing(false);
    }
  };

  const handleFileClear = () => {
    setFile(null);
    setParsed(null);
    setFileError(null);
    setServerErrors([]);
  };

  const canSubmit =
    !!file && !!parsed && !parsed.headerError && !!airlineId && !!airportId && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setServerErrors([]);
    try {
      const input = {
        airportId,
        airlineId,
        senderId: decodeJWT(token).userId,
        reserve,
        defaultTimesUsed: false,
      };
      const { data } = await importBulk({ variables: { file, input } });
      const res = data?.importBulkRequests;
      if (res?.errors?.length) {
        setServerErrors(res.errors);
        return;
      }
      success(`Создано ${res?.createdCount ?? 0} заявок`);
      reset();
      onImported?.();
      onClose();
    } catch (err) {
      console.error(err);
      showAlert("Ошибка при импорте заявок");
    } finally {
      setIsLoading(false);
    }
  };

  const inner = (
    <>
      {!embedded && (
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>Импорт заявок из XLSX</div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>
      )}

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <span className={classes.hint}>* — обязательные поля</span>
            <div className={classes.field}>
              <label className={classes.required}>Файл XLSX</label>
              <FileDropzone
                accept=".xlsx"
                hint="Таблица заявок в формате XLSX"
                fileName={file?.name}
                parsing={parsing}
                error={fileError || parsed?.headerError}
                onFile={handleFile}
                onClear={handleFileClear}
                meta={
                  parsed && !parsed.headerError ? (
                    <>
                      <span>строк: {parsed.rows.length}</span>
                      <span className={classes.chip}>
                        заявок: {parsed.totalRequests}
                      </span>
                      {parsed.rowIssues.length > 0 && (
                        <span className={classes.chipWarn}>
                          с замечаниями: {parsed.rowIssues.length}
                        </span>
                      )}
                    </>
                  ) : null
                }
              />
            </div>

            {user?.airlineId ? null : (
              <div className={classes.field}>
                <label className={classes.required}>Авиакомпания</label>
                <MUIAutocomplete
                  dropdownWidth={"100%"}
                  label={"Введите авиакомпанию"}
                  options={airlines?.map((a) => a.name)}
                  value={selectedAirline ? selectedAirline?.name : ""}
                  onChange={(e, newValue) => {
                    setSelectedAirline(airlines.find((a) => a.name === newValue) || null);
                    setIsEdited(true);
                  }}
                />
              </div>
            )}

            <div className={classes.field}>
              <label className={classes.required}>Аэропорт</label>
              <MUIAutocompleteColor
                dropdownWidth="100%"
                label={"Введите аэропорт"}
                options={airports}
                getOptionLabel={(option) => {
                  if (!option) return "";
                  const cityPart =
                    option.city && option.city !== option.name
                      ? `, город: ${option.city}`
                      : "";
                  return `${option.code} ${option.name}${cityPart}`.trim();
                }}
                renderOption={(optionProps, option) => {
                  const cityPart =
                    option.city && option.city !== option.name
                      ? `, город: ${option.city}`
                      : "";
                  const labelText = `${option.code} ${option.name}${cityPart}`.trim();
                  const words = labelText.split(" ");
                  return (
                    <li {...optionProps} key={option.id}>
                      {words.map((word, index) => (
                        <span
                          key={index}
                          style={{ color: index === 0 ? "black" : "gray", marginRight: 4 }}
                        >
                          {word}
                        </span>
                      ))}
                    </li>
                  );
                }}
                value={airports.find((o) => o.id === airportId) || null}
                onChange={(e, newValue) => {
                  setAirportId(newValue?.id || "");
                  setIsEdited(true);
                }}
              />
            </div>

            <div className={classes.field}>
              <label>Тип заявки</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Тип заявки"}
                options={["Квота", "Резерв"]}
                value={reserve ? "Резерв" : "Квота"}
                onChange={(e, newValue) => {
                  setReserve(newValue === "Резерв");
                  setIsEdited(true);
                }}
              />
            </div>

            {parsed && !parsed.headerError && (
              <>
                <div className={classes.summary}>
                  Будет создано {parsed.totalRequests} заявок
                  {parsed.rowIssues.length
                    ? ` · ${parsed.rowIssues.length} строк с замечаниями`
                    : ""}
                </div>
                <table className={classes.preview}>
                  <thead>
                    <tr>
                      <th>ЧЭ</th>
                      <th>Заезд</th>
                      <th>Рейс</th>
                      <th>Выезд</th>
                      <th>1/2м</th>
                      <th>Связка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((r) => (
                      <tr key={r.rowNumber} className={r.issues.length ? classes.rowError : ""}>
                        <td>{r.count}</td>
                        <td>{r.arrivalDate} {r.arrivalTime}</td>
                        <td>{r.arrivalFlight}</td>
                        <td>{r.departureDate} {r.departureTime}</td>
                        <td>{r.single}/{r.double}</td>
                        <td>{r.link}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {serverErrors.length > 0 && (
              <div className={classes.errorBox}>
                <div>Заявки не созданы. Ошибки по строкам:</div>
                <ul>
                  {serverErrors.map((er, i) => (
                    <li key={i}>Строка {er.row}: {er.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className={classes.requestButton}>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              Импортировать
              {parsed && !parsed.headerError ? ` ${parsed.totalRequests} заявок` : ""}
            </Button>
          </div>
        </>
      )}
    </>
  );

  return embedded ? inner : (
    <Sidebar show={show} sidebarRef={sidebarRef}>{inner}</Sidebar>
  );
}

export default ImportBulkRequests;
