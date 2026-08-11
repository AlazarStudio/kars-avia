import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useMutation, useQuery } from "@apollo/client";
import classes from "./ReportCreateSidebar.module.css";
import Sidebar from "../../Sidebar/Sidebar";
import MUILoader from "../../MUILoader/MUILoader";
import MUIAutocomplete from "../../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../../MUIAutocompleteColor/MUIAutocompleteColor";
import CloseIcon from "../../../../shared/icons/CloseIcon";
import { useDialog } from "../../../../contexts/DialogContext";
import { useToast } from "../../../../contexts/ToastContext";
import {
  CREATE_AIRLINE_REPORT_DRAFT,
  CREATE_HOTEL_REPORT,
  CREATE_HOTEL_REPORT_DRAFT,
  CREATE_REPORT,
  decodeJWT,
  GET_AIRLINES_RELAY,
  GET_HOTELS_RELAY,
  getCookie,
} from "../../../../../graphQL_requests";

const categories = [
  { id: "squadron", name: "Эскадрилья" },
  { id: "engineers", name: "Инженеры" },
  { id: "all", name: "Все" },
];

// Белая галка внутри квадрата-флажка ("Включить в отчёт" и блок проверки).
function CheckMark() {
  return (
    <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 4.5L4 7.5L10 1"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Иконка календаря слева от полей даты.
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3.2" width="12" height="10.8" rx="2" stroke="#8B90A5" strokeWidth="1.3" />
      <path d="M2 6.4H14" stroke="#8B90A5" strokeWidth="1.3" />
      <path d="M5 1.5V3.6" stroke="#8B90A5" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 1.5V3.6" stroke="#8B90A5" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default function ReportCreateSidebar({
  show,
  onClose,
  isAirline,
  positions,
  airports,
  onDraftCreated,
}) {
  const token = getCookie("token");
  const user = decodeJWT(token);
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  const getDefaultAirOrHotel = useCallback(() => {
    if (user?.airlineId) return "airline";
    if (user?.hotelId) return "hotel";
    return isAirline ? "airline" : "hotel";
  }, [user?.airlineId, user?.hotelId, isAirline]);

  const [isEdited, setIsEdited] = useState(false);
  const [airOrHotel, setAirOrHotel] = useState(getDefaultAirOrHotel);
  const [category, setCategory] = useState(categories[0]);
  const [airlines, setAirlines] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // Включено по умолчанию — как «Проживание» и «Питание». Отчёт по умолчанию
  // проходит через редактор строк, быстрый выпуск остаётся снятием галки.
  const [withReview, setWithReview] = useState(true);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    airlineId: user.airlineId || "",
    hotelId: user.hotelId || "",
    personId: "",
    airportId: "",
    position: "",
    meal: true,
    living: true,
  });

  const sidebarRef = useRef();

  const { data } = useQuery(GET_AIRLINES_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: hotelsData } = useQuery(GET_HOTELS_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  useEffect(() => {
    setAirlines(data?.airlines?.airlines || []);
    setHotels(hotelsData?.hotels?.hotels || []);
  }, [data, hotelsData]);

  // Сброс формы
  const resetForm = useCallback(() => {
    setFormData({
      startDate: "",
      endDate: "",
      airlineId: user.airlineId || "",
      hotelId: user.hotelId || "",
      personId: "",
      airportId: "",
      position: "",
      meal: true,
      living: true,
    });
    setSelectedAirline(null);
    setSelectedHotel(null);
    setAirOrHotel(getDefaultAirOrHotel());
    setCategory(categories[0]);
    setWithReview(true);
    setIsEdited(false);
  }, [user.airlineId, user.hotelId, getDefaultAirOrHotel]);

  // При открытии сайдбара — полный сброс с правильным начальным типом
  useEffect(() => {
    if (show) resetForm();
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  // Автоподстановка авиакомпании/гостиницы привязанной к пользователю
  useEffect(() => {
    if (airOrHotel === "airline" && user.airlineId && airlines.length) {
      const matched = airlines.find((a) => a.id === user.airlineId);
      if (matched) {
        setSelectedAirline(matched);
        setFormData((prev) => ({ ...prev, airlineId: matched.id, personId: "" }));
      }
    }
    if (airOrHotel === "hotel" && user.hotelId && hotels.length) {
      const matched = hotels.find((h) => h.id === user.hotelId);
      if (matched) {
        setSelectedHotel(matched);
        setFormData((prev) => ({ ...prev, hotelId: matched.id }));
      }
    }
  }, [airOrHotel, user.airlineId, user.hotelId, airlines, hotels]);

  const specialPositions =
    category.id === "squadron"
      ? positions.filter((p) => p.category === "squadron")
      : category.id === "engineers"
      ? positions.filter((p) => p.category === "engineers")
      : positions;

  const reportDocument =
    airOrHotel === "airline"
      ? withReview
        ? CREATE_AIRLINE_REPORT_DRAFT
        : CREATE_REPORT
      : withReview
      ? CREATE_HOTEL_REPORT_DRAFT
      : CREATE_HOTEL_REPORT;

  const [createReport] = useMutation(reportDocument, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Закрытие с проверкой изменений
  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;
    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }
    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      resetForm();
      onClose();
    }
  }, [isEdited, resetForm, onClose, isDialogOpen, confirm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, isDialogOpen]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setIsEdited(true);
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const isFormValid = () => {
    if (airOrHotel === "airline") {
      return (
        formData.startDate &&
        formData.endDate &&
        formData.airlineId &&
        formData.airportId &&
        (formData.living || formData.meal)
      );
    }
    return (
      formData.startDate &&
      formData.endDate &&
      formData.hotelId &&
      (formData.living || formData.meal)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isFormValid()) {
      showAlert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }
    if (formData.endDate < formData.startDate) {
      showAlert("Конечная дата не может быть раньше начальной.");
      setFormData((prev) => ({ ...prev, endDate: "" }));
      setIsLoading(false);
      return;
    }

    const selectedPosition = positions.find((p) => p.name === formData.position);

    const input = {
      filter: {
        startDate: `${formData.startDate}T00:10:00`,
        endDate: `${formData.endDate}T23:50:00`,
        ...(airOrHotel === "airline" && {
          airportId: formData.airportId,
          positionId: selectedPosition?.id || "",
          position: category.id,
          personId: formData.personId,
        }),
        airlineId: formData.airlineId,
        hotelId: formData.hotelId,
      },
      format: "xlsx",
    };

    const createFilterInput = {
      living: formData.living,
      meal: formData.meal,
    };

    try {
      const res = await createReport({ variables: { input, createFilterInput } });

      if (withReview) {
        const id =
          res?.data?.createAirlineReportDraft?.id || res?.data?.createHotelReportDraft?.id;
        if (!id) {
          notifyError("Черновик создан, но не удалось его открыть");
          return;
        }
        resetForm();
        onClose();
        onDraftCreated(id);
      } else {
        resetForm();
        onClose();
        success(
          `Отчет ${formData.personId !== "" ? "по сотруднику" : ""} создан успешно.`.replace(
            /\s{2,}/g,
            " ",
          ),
        );
      }
    } catch (error) {
      // Без этой ветки любая ошибка, кроме отсутствия цен, гасила лоадер молча:
      // пользователь не понимал, создался отчёт или нет.
      if (error.message.startsWith("Airline has no prices")) {
        showAlert("У авиакомпании нет цен по выбранному аэропорту.");
      } else {
        notifyError(
          error?.graphQLErrors?.[0]?.message || "Не удалось создать отчёт",
        );
      }
      console.error("Catch: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hotelAutocomplete = (
    <MUIAutocompleteColor
      dropdownWidth="100%"
      label={"Выберите гостиницу"}
      options={hotels}
      getOptionLabel={(option) =>
        option ? `${option.name}, город: ${option?.information?.city}`.trim() : ""
      }
      renderOption={(optionProps, option) => {
        const words = `${option.name}, город: ${option?.information?.city}`
          .trim()
          .split(", ");
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
      value={selectedHotel || ""}
      onChange={(event, newValue) => {
        const matched = hotels.find((h) => h === newValue);
        setSelectedHotel(matched || null);
        setFormData((prev) => ({ ...prev, hotelId: matched?.id || "" }));
        setIsEdited(true);
      }}
    />
  );

  const airlineAutocomplete = (
    <MUIAutocomplete
      dropdownWidth={"100%"}
      label={"Выберите авиакомпанию"}
      options={airlines?.map((a) => a.name)}
      value={selectedAirline?.name || ""}
      onChange={(event, newValue) => {
        const matched = airlines.find((a) => a.name === newValue);
        setSelectedAirline(matched || null);
        setFormData((prev) => ({ ...prev, airlineId: matched?.id || "", personId: "" }));
        setIsEdited(true);
      }}
    />
  );

  const selectAirOrHotel = (next) => {
    if (airOrHotel === next) return;
    setAirOrHotel(next);
    setSelectedAirline(null);
    setSelectedHotel(null);
    setFormData((prev) => ({
      ...prev,
      airlineId: "",
      hotelId: "",
      personId: "",
      airportId: "",
    }));
    setIsEdited(true);
  };

  const noneChecked = !formData.living && !formData.meal;

  return (
    <>
      {show && <div className={classes.overlay} />}
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.header}>
          <div className={classes.headerTitle}>Создать отчёт</div>
          <button
            type="button"
            className={classes.closeBtn}
            onClick={closeButton}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        {isLoading ? (
          <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
        ) : (
          <>
            <div className={classes.body}>
              {/* Тип отчёта — только для диспетчеров без привязки */}
              {!user.airlineId && !user.hotelId && (
                <div className={classes.field}>
                  <label className={classes.label}>Тип отчёта</label>
                  <div className={classes.segmented}>
                    <button
                      type="button"
                      className={`${classes.segmentedBtn} ${
                        airOrHotel === "airline" ? classes.segmentedBtnActive : ""
                      }`}
                      onClick={() => selectAirOrHotel("airline")}
                    >
                      Авиакомпания
                    </button>
                    <button
                      type="button"
                      className={`${classes.segmentedBtn} ${
                        airOrHotel === "hotel" ? classes.segmentedBtnActive : ""
                      }`}
                      onClick={() => selectAirOrHotel("hotel")}
                    >
                      Гостиница
                    </button>
                  </div>
                  <div className={classes.typeCaption}>
                    Видно только сотрудникам без привязки к компании
                  </div>
                </div>
              )}

              {/* Авиакомпания */}
              {airOrHotel === "airline" && (
                <>
                  {!user.airlineId && (
                    <div className={classes.field}>
                      <label className={`${classes.label} ${classes.labelRequired}`}>
                        Авиакомпания
                      </label>
                      <div className={classes.selectWrap}>{airlineAutocomplete}</div>
                    </div>
                  )}

                  <div className={classes.field}>
                    <label className={classes.label}>Гостиница</label>
                    <div className={classes.selectWrap}>{hotelAutocomplete}</div>
                  </div>

                  {(selectedAirline || user.airlineId) && (
                    <>
                      <div className={classes.field}>
                        <label className={`${classes.label} ${classes.labelRequired}`}>
                          Аэропорт
                        </label>
                        <div className={classes.selectWrap}>
                          <MUIAutocompleteColor
                            dropdownWidth="100%"
                            label={"Выберите аэропорт"}
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
                              const words = `${option.code} ${option.name}${cityPart}`
                                .trim()
                                .split(" ");
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
                            value={airports.find((o) => o.id === formData.airportId) || null}
                            onChange={(e, newValue) => {
                              setFormData((prev) => ({ ...prev, airportId: newValue?.id || "" }));
                              setIsEdited(true);
                            }}
                          />
                        </div>
                      </div>

                      <div className={classes.field}>
                        <label className={classes.label}>Категория</label>
                        <div className={classes.segmented}>
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              className={`${classes.segmentedBtn} ${
                                category.id === cat.id ? classes.segmentedBtnActive : ""
                              }`}
                              onClick={() => {
                                setCategory(cat);
                                setIsEdited(true);
                              }}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={classes.row}>
                        <div className={`${classes.field} ${classes.rowItem}`}>
                          <label className={classes.label}>Должность</label>
                          <div className={classes.selectWrap}>
                            <MUIAutocomplete
                              dropdownWidth={"100%"}
                              label={"Все"}
                              labelOnFocus={"Выберите должность"}
                              options={specialPositions?.map((p) => p.name)}
                              value={formData.position}
                              onChange={(event, newValue) => {
                                setFormData((prev) => ({ ...prev, position: newValue || "" }));
                                setIsEdited(true);
                              }}
                            />
                          </div>
                        </div>

                        <div className={`${classes.field} ${classes.rowItem}`}>
                          <label className={classes.label}>Сотрудник</label>
                          <div className={classes.selectWrap}>
                            <MUIAutocompleteColor
                              dropdownWidth="100%"
                              listboxHeight={"300px"}
                              label={"Все"}
                              labelOnFocus={"Введите сотрудника"}
                              options={(selectedAirline?.staff || []).filter((person) =>
                                formData.position
                                  ? person?.position?.name === formData.position
                                  : true
                              )}
                              getOptionLabel={(option) =>
                                option
                                  ? `${option.name || ""} ${option?.position?.name} ${option.gender}`.trim()
                                  : ""
                              }
                              renderOption={(optionProps, option) => {
                                const words = `${option.name || ""} ${option?.position?.name} ${option.gender}`
                                  .trim()
                                  .split(". ");
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
                                selectedAirline?.staff?.find((p) => p.id === formData.personId) ||
                                null
                              }
                              onChange={(event, newValue) => {
                                setFormData((prev) => ({ ...prev, personId: newValue?.id || "" }));
                                setIsEdited(true);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Гостиница */}
              {airOrHotel === "hotel" && (
                <>
                  {!user.hotelId && (
                    <div className={classes.field}>
                      <label className={`${classes.label} ${classes.labelRequired}`}>
                        Гостиница
                      </label>
                      <div className={classes.selectWrap}>{hotelAutocomplete}</div>
                    </div>
                  )}

                  <div className={classes.field}>
                    <label className={classes.label}>Авиакомпания</label>
                    <div className={classes.selectWrap}>{airlineAutocomplete}</div>
                  </div>
                </>
              )}

              <div className={classes.field}>
                <label className={`${classes.label} ${classes.labelRequired}`}>
                  Включить в отчёт
                </label>
                <div className={classes.flagsRow}>
                  <label
                    className={`${classes.flagCard} ${
                      formData.living ? classes.flagCardActive : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="living"
                      checked={formData.living}
                      onChange={handleChange}
                      className={classes.srOnly}
                    />
                    <span
                      className={`${classes.flagCheckbox} ${
                        formData.living ? classes.flagCheckboxActive : ""
                      }`}
                    >
                      {formData.living && <CheckMark />}
                    </span>
                    <span className={classes.flagLabel}>Проживание</span>
                  </label>

                  <label
                    className={`${classes.flagCard} ${
                      formData.meal ? classes.flagCardActive : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="meal"
                      checked={formData.meal}
                      onChange={handleChange}
                      className={classes.srOnly}
                    />
                    <span
                      className={`${classes.flagCheckbox} ${
                        formData.meal ? classes.flagCheckboxActive : ""
                      }`}
                    >
                      {formData.meal && <CheckMark />}
                    </span>
                    <span className={classes.flagLabel}>Питание</span>
                  </label>
                </div>
                {noneChecked && (
                  <div className={classes.fieldError}>Выберите хотя бы одно</div>
                )}
              </div>

              <div className={classes.row}>
                <div className={`${classes.field} ${classes.rowItem}`}>
                  <label
                    className={`${classes.label} ${classes.labelRequired}`}
                    htmlFor="reportsV2StartDate"
                  >
                    Начальная дата
                  </label>
                  <div className={classes.dateField}>
                    <span className={classes.fieldIcon}>
                      <CalendarIcon />
                    </span>
                    <input
                      id="reportsV2StartDate"
                      type="date"
                      className={classes.dateInput}
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={`${classes.field} ${classes.rowItem}`}>
                  <label
                    className={`${classes.label} ${classes.labelRequired}`}
                    htmlFor="reportsV2EndDate"
                  >
                    Конечная дата
                  </label>
                  <div className={classes.dateField}>
                    <span className={classes.fieldIcon}>
                      <CalendarIcon />
                    </span>
                    <input
                      id="reportsV2EndDate"
                      type="date"
                      className={classes.dateInput}
                      name="endDate"
                      min={formData.startDate}
                      value={formData.endDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`${classes.reviewBlock} ${withReview ? classes.reviewBlockActive : ""}`}
                onClick={() => {
                  setWithReview((prev) => !prev);
                  setIsEdited(true);
                }}
              >
                <span
                  className={`${classes.flagCheckbox} ${
                    withReview ? classes.flagCheckboxActive : ""
                  }`}
                >
                  {withReview && <CheckMark />}
                </span>
                <div className={classes.reviewContent}>
                  <label className={classes.reviewTitle}>
                    <input
                      type="checkbox"
                      checked={withReview}
                      onChange={(e) => {
                        e.stopPropagation();
                        setWithReview(e.target.checked);
                        setIsEdited(true);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={classes.srOnly}
                    />
                    Проверить строки перед выгрузкой
                  </label>
                  <div className={classes.reviewHint}>
                    {withReview
                      ? "Сначала откроется редактор строк — можно исправить сутки, цену и питание, и только потом выгрузить Excel."
                      : "Excel сформируется сразу, без промежуточной проверки. Так выпускается большинство отчётов."}
                  </div>
                </div>
              </div>
            </div>

            <div className={classes.footer}>
              <button type="button" className={classes.cancelBtn} onClick={closeButton}>
                Отмена
              </button>
              <button type="button" className={classes.mainBtn} onClick={handleSubmit}>
                {withReview ? "К проверке" : "Добавить"}
              </button>
            </div>
          </>
        )}
      </Sidebar>
    </>
  );
}

ReportCreateSidebar.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isAirline: PropTypes.bool,
  positions: PropTypes.array.isRequired,
  airports: PropTypes.array.isRequired,
  onDraftCreated: PropTypes.func.isRequired,
};
