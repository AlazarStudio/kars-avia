import React, { useEffect, useMemo, useState } from "react";
import classes from "./Filter.module.css";
import Button from "../../Standart/Button/Button";
import DropDownList from "../DropDownList/DropDownList";
import { roles } from "../../../roles";
import { useQuery } from "@apollo/client";
import {
  GET_AIRLINES_RELAY,
  GET_AIRPORTS_RELAY,
} from "../../../../graphQL_requests";
import { Autocomplete, TextField } from "@mui/material";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import DateRangeModalSelector from "../DateRangeModalSelector/DateRangeModalSelector";

function Filter({
  toggleSidebar,
  isVisibleAirFiler,
  selectedAirline,
  setSelectedAirline,
  selectedAirport,
  setSelectedAirport,
  handleChange,
  handleStatusChange,
  filterData,
  buttonTitle,
  filterList,
  needDate,
  filterLocalData,
  user,
  initialRange,
  onRangeChange,
  ...props
}) {
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);

  // Запросы для получения авиакомпаний и аэропортов
  const {
    data: airlinesData,
    loading: airlinesLoading,
    error: airlinesError,
  } = useQuery(GET_AIRLINES_RELAY);
  const {
    data: airportsData,
    loading: airportsLoading,
    error: airportsError,
  } = useQuery(GET_AIRPORTS_RELAY);
  // console.log(airlinesData);
  // console.log(airportsData);

  useEffect(() => {
    if (airlinesData) {
      setAirlines(airlinesData.airlines.airlines || []);
    }
  }, [airlinesData]);

  useEffect(() => {
    if (airportsData) {
      setAirports(airportsData.airports || []);
    }
  }, [airportsData]);

  // Опции для выбора состояния
  let filterListShow;

  if (
    (user && user?.role === roles.superAdmin) ||
    user?.role === roles.dispatcerAdmin ||
    user?.role === roles.airlineAdmin
  ) {
    filterListShow = [
      { label: "Все заявки", value: "all" },
      { label: "Создан / В обработке", value: "created / opened" },
      { label: "Размещен", value: "done" },
      { label: "Готов к архиву", value: "archiving" },
      { label: "Архивные", value: "archived" },
      { label: "Отменен", value: "canceled" },
    ];
  }

  if (user && user?.role === roles.hotelAdmin) {
    filterListShow = [
      { label: "Все заявки", value: "all" },
      { label: "Создан / В обработке", value: "created / opened" },
      { label: "Размещен", value: "done" },
      { label: "Готов к архиву", value: "archiving" },
      { label: "Отменен", value: "canceled" },
    ];
  }

  const statusOptions = useMemo(() => filterListShow, []);

  // Опции для фильтрации по роли
  // const filterOptions = useMemo(() => [
  //     { label: "Показать все", value: "" },
  //     { label: "Администратор", value: "DISPATCHERADMIN" }
  // ], []);

  let filter = filterLocalData || "all";

  const [dropdownWidth, setDropdownWidth] = useState("200px"); // Начальное значение ширины

  // Функция для расчета ширины в зависимости от ширины экрана
  const calculateWidth = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 480) {
      return "130px"; // Для маленьких экранов
    } else if (screenWidth <= 1550) {
      return "130px"; // Для планшетов
    } else {
      return "150px"; // Для больших экранов
    }
  };

  useEffect(() => {
    // Устанавливаем начальную ширину при загрузке компонента
    setDropdownWidth(calculateWidth());

    // Обновляем ширину при изменении размера экрана
    const handleResize = () => {
      setDropdownWidth(calculateWidth());
    };

    window.addEventListener("resize", handleResize);

    // Убираем слушатель при размонтировании компонента
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className={classes.filter}>
      {isVisibleAirFiler && (
        <>
          {user?.role === roles.airlineAdmin ? null : (
            <MUIAutocomplete
              dropdownWidth={dropdownWidth}
              label={"Авиакомпания"}
              options={[
                "Все авиакомпании",
                ...airlines.map((airline) => airline.name),
              ]}
              value={selectedAirline ? selectedAirline.name : ""}
              onChange={(event, newValue) => {
                if (newValue === "Все авиакомпании" || !newValue) {
                  setSelectedAirline(null);
                  handleChange({ target: { name: "airline", value: "" } });
                } else {
                  const selectedOption = airlines.find(
                    (airline) => airline.name === newValue
                  );
                  setSelectedAirline(selectedOption);
                  handleChange({
                    target: {
                      name: "airline",
                      value: selectedOption?.id || "",
                    },
                  });
                }
              }}
            />
            // <Autocomplete
            //   options={[
            //     "Все авиакомпании",
            //     ...airlines.map((airline) => airline.name),
            //   ]}
            //   slotProps={{
            //     popper: {
            //       modifiers: [
            //         {
            //           name: "preventOverflow",
            //           options: {
            //             boundary: "window",
            //           },
            //         },
            //       ],
            //     },
            //     listbox: {
            //       sx: {
            //         fontSize: "14px", // Уменьшаем размер шрифта списка
            //         padding: "0",
            //       },
            //     },
            //   }}
            //   value={selectedAirline ? selectedAirline.name : ""}
            //   onChange={(event, newValue) => {
            //     if (newValue === "Все авиакомпании" || !newValue) {
            //       setSelectedAirline(null);
            //       handleChange({ target: { name: "airline", value: "" } });
            //     } else {
            //       const selectedOption = airlines.find(
            //         (airline) => airline.name === newValue
            //       );
            //       setSelectedAirline(selectedOption);
            //       handleChange({
            //         target: {
            //           name: "airline",
            //           value: selectedOption?.id || "",
            //         },
            //       });
            //     }
            //   }}
            //   renderInput={(params) => (
            //     <TextField
            //       {...params}
            //       label="Авиакомпания"
            //       variant="outlined"
            //       sx={{
            //         "& label": {
            //           top: "50%",
            //           padding: "0 12px",
            //           transform: "translateY(-50%)",
            //           transition: "all 0.1s ease-out", // Плавная анимация при фокусе
            //           fontSize: "14px",
            //         },
            //         "& .MuiInputBase-root": {
            //           minHeight: "40px",
            //           display: "flex",
            //           alignItems: "center",
            //         },
            //         "& .MuiOutlinedInput-root": {
            //           padding: "0 8px",
            //         },
            //         "& .MuiInputLabel-shrink": {
            //           padding: "0",
            //           top: "0px",
            //           transform: "translate(14px, -9px) scale(0.75)", // Обычное поведение при фокусе
            //         },
            //       }}
            //     />
            //   )}
            //   sx={{
            //     width: dropdownWidth,
            //     bgcolor: "white",
            //     // Стили для самого Autocomplete
            //     "& .MuiOutlinedInput-root": {
            //       // уменьшаем высоту
            //       minHeight: "40px",
            //       // настраиваем внутренние отступы
            //       padding: "0 8px",
            //       // уменьшаем размер шрифта
            //       fontSize: "14px",
            //     },
            //     // уменьшаем иконку (стрелку)
            //     "& .MuiSvgIcon-root": {
            //       fontSize: "18px",
            //     },
            //     // стили для списка опций
            //     "& .MuiAutocomplete-listbox": {
            //       fontSize: "10px",
            //     },
            //   }}
            // />
            // <DropDownList
            //   width={dropdownWidth}
            //   placeholder="Выберите авиакомпанию"
            //   searchable={true}
            //   options={[
            //     "Все авиакомпании",
            //     ...airlines.map((airline) => airline.name),
            //   ]} // Добавляем 'Все авиакомпании'
            //   initialValue={selectedAirline?.name || "Все авиакомпании"} // Устанавливаем "Все авиакомпании" по умолчанию
            //   onSelect={(value) => {
            //     if (value === "Все авиакомпании") {
            //       setSelectedAirline(null); // Если выбрали "Все авиакомпании", сбрасываем выбранную авиакомпанию
            //       handleChange({ target: { name: "airline", value: "" } }); // Убираем фильтрацию по авиакомпании
            //     } else {
            //       const selectedOption = airlines.find(
            //         (airline) => airline.name === value
            //       );
            //       setSelectedAirline(selectedOption);
            //       handleChange({
            //         target: {
            //           name: "airline",
            //           value: selectedOption?.id || "",
            //         },
            //       });
            //     }
            //   }}
            // />
          )}

          <MUIAutocomplete
            dropdownWidth={dropdownWidth}
            label={"Аэропорт"}
            options={[
              "Все аэропорты",
              ...airports.map((airport) => airport.name),
            ]}
            value={selectedAirport ? selectedAirport.name : ""}
            onChange={(event, newValue) => {
              if (newValue === "Все аэропорты" || !newValue) {
                setSelectedAirport(null);
                handleChange({ target: { name: "airport", value: "" } });
              } else {
                const selectedOption = airports.find(
                  (airport) => airport.name === newValue
                );
                setSelectedAirport(selectedOption);
                handleChange({
                  target: { name: "airport", value: selectedOption?.id || "" },
                });
              }
            }}
          />

          <DateRangeModalSelector
            width={dropdownWidth}
            initialRange={initialRange}
            onChange={(start, end) =>
              onRangeChange({ startDate: start, endDate: end })
            }
          />

          {/* <DropDownList
            width={dropdownWidth}
            placeholder="Выберите аэропорт"
            searchable={true}
            options={[
              "Все аэропорты",
              ...airports.map((airport) => airport.name),
            ]} // Добавляем 'Все аэропорты'
            initialValue={selectedAirport?.name || "Все аэропорты"} // Устанавливаем "Все аэропорты" по умолчанию, если ничего не выбрано
            onSelect={(value) => {
              if (value === "Все аэропорты") {
                setSelectedAirport(null); // Если выбрали "Все аэропорты", сбрасываем выбранный аэропорт
                handleChange({ target: { name: "airport", value: "" } }); // Убираем фильтрацию по аэропорту
              } else {
                const selectedOption = airports.find(
                  (airport) => airport.name === value
                );
                setSelectedAirport(selectedOption);
                handleChange({
                  target: { name: "airport", value: selectedOption?.id || "" },
                });
              }
            }}
          /> */}
        </>
      )}

      {handleStatusChange && (
        <>
          {/* <div className={classes.filter_title}>Статус:</div> */}
          <MUIAutocomplete
            dropdownWidth={dropdownWidth}
            label={"Статус"}
            options={statusOptions?.map((option) => option.label)}
            value={
              statusOptions?.find((option) => option.value === filter)
                ?.label === "Все заявки"
                ? ""
                : statusOptions?.find((option) => option.value === filter)
                    ?.label || ""
            }
            onChange={(event, newValue) => {
              const selectedOption = statusOptions.find(
                (option) => option.label === newValue
              );
              handleStatusChange(selectedOption?.value || "all");
            }}
          />
          {/* <DropDownList
            width={dropdownWidth}
            placeholder="Выберите состояние"
            searchable={false}
            options={statusOptions.map((option) => option.label)}
            initialValue={
              statusOptions.find((option) => option.value === filter)?.label
            }
            onSelect={(value) => {
              const selectedOption = statusOptions.find(
                (option) => option.label === value
              );
              handleStatusChange(selectedOption?.value || "");
            }}
          /> */}
        </>
      )}

      {filterList && (
        <>
          {/* <div className={classes.filter_title}>Фильтр:</div>
                    <DropDownList
                        placeholder="Выберите фильтр"
                        options={filterOptions.map(option => option.label)}
                        initialValue={filterOptions.find(option => option.value === filterData.filterAirport)?.label || ""}
                        onSelect={(value) => {
                            const selectedOption = filterOptions.find(option => option.label === value);
                            handleChange({ target: { name: "filterSelect", value: selectedOption?.value || "" } });
                        }}
                    /> */}
        </>
      )}

      {needDate && (
        <>
          {/* <input
                        type="date"
                        name="filterDate"
                        value={filterData.filterDate || ""}
                        onChange={handleChange}
                        className={classes.filter_date}
                    /> */}
        </>
      )}
      {user?.role == roles.hotelAdmin ? null : (
        <Button onClick={toggleSidebar} minwidth={dropdownWidth}>
          {buttonTitle}
        </Button>
      )}
    </div>
  );
}

export default Filter;
