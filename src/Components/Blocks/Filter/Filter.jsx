import React, { useEffect, useMemo, useState } from "react";
import classes from "./Filter.module.css";
import Button from "../../Standart/Button/Button";
import DropDownList from "../DropDownList/DropDownList";
import { roles } from "../../../roles";
import { useQuery } from "@apollo/client";
import {
  GET_AIRLINES_RELAY,
  GET_AIRPORTS_RELAY,
  getCookie,
} from "../../../../graphQL_requests";
import { Autocomplete, TextField } from "@mui/material";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import DateRangeModalSelector from "../DateRangeModalSelector/DateRangeModalSelector";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
import { useWindowSize } from "../../../hooks/useWindowSize";

function Filter({
  toggleSidebar,
  isVisibleAirFiler,
  transfer,
  representativeRequests,
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
  isEstafeta,
  initialRange,
  onRangeChange,
  ...props
}) {
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const token = getCookie("token");

  // Запросы для получения авиакомпаний и аэропортов
  const {
    data: airlinesData,
    loading: airlinesLoading,
    error: airlinesError,
  } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !isVisibleAirFiler,
  });
  const {
    data: airportsData,
    loading: airportsLoading,
    error: airportsError,
  } = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !isVisibleAirFiler,
  });
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
      { label: "Создан", value: "created" },
      { label: "В обработке", value: "opened" },
      // { label: "Создан / В обработке", value: "created / opened" },
      { label: "Размещен", value: "done" },
      { label: "Готов к архиву", value: "archiving" },
      { label: "Архивные", value: "archived" },
      { label: "Отменен", value: "canceled" },
    ];
  }

  if (user && user?.role === roles.hotelAdmin) {
    filterListShow = [
      { label: "Все заявки", value: "all" },
      { label: "Создан", value: "created" },
      { label: "В обработке", value: "opened" },
      // { label: "Создан / В обработке", value: "created / opened" },
      { label: "Размещен", value: "done" },
      { label: "Готов к архиву", value: "archiving" },
      { label: "Отменен", value: "canceled" },
    ];
  }

  if (
    ((user && user?.role === roles.superAdmin) ||
      user?.role === roles.dispatcerAdmin ||
      user?.role === roles.airlineAdmin) &&
    transfer
  ) {
    filterListShow = [
      { label: "Все заявки", value: null },
      { label: "Ожидание обработки", value: "PENDING" },
      { label: "Назначен водитель", value: "ASSIGNED" },
      { label: "Принят водителем", value: "ACCEPTED" },
      { label: "Водитель приехал", value: "ARRIVED" },
      { label: "В пути к клиенту", value: "IN_PROGRESS_TO_CLIENT" },
      { label: "Завершена", value: "COMPLETED" },
      { label: "Отменена", value: "CANCELLED" },
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
  const { width } = useWindowSize();
  // Функция для расчета ширины в зависимости от ширины экрана
  const calculateWidth = () => {
    // const screenWidth = window.innerWidth;
    if (width <= 480) {
      return "170px"; // Для маленьких экранов
    } else if (width <= 1630) {
      return "170px"; // Для планшетов
    } else {
      return "170px"; // Для больших экранов
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
          {user?.role === roles.airlineAdmin
            ? null
            : !transfer && (
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
              )}

          {!transfer && (
            <MUIAutocompleteColor
              dropdownWidth={dropdownWidth}
              label={"Аэропорт"}
              options={[
                { id: null, name: "Все аэропорты", code: "" },
                ...airports,
              ]}
              getOptionLabel={(option) =>
                option ? `${option.code} ${option.name}`.trim() : ""
              }
              renderOption={(optionProps, option) => {
                const isAll =
                  option.name === "Все аэропорты" || option.code === "";

                if (isAll) {
                  return (
                    <li {...optionProps} key={option.id ?? "all-airports"}>
                      <span style={{ color: "black" }}>{option.name}</span>
                    </li>
                  );
                }

                // Формируем строку для отображения
                const labelText = `${option.code} ${option.name}`.trim();
                // Разбиваем строку по пробелам
                const words = labelText.split(" ");

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
              value={selectedAirport ? selectedAirport : ""}
              onChange={(event, newValue) => {
                if (newValue === "Все аэропорты" || !newValue) {
                  setSelectedAirport(null);
                  handleChange({ target: { name: "airport", value: "" } });
                } else {
                  const selectedOption = airports.find(
                    (airport) => airport === newValue
                  );
                  setSelectedAirport(selectedOption || null);
                  handleChange({
                    target: {
                      name: "airport",
                      value: selectedOption?.id || "",
                    },
                  });
                }
              }}
            />
          )}

          {!representativeRequests && (
            <DateRangeModalSelector
              width={transfer ? "200px" : dropdownWidth}
              initialRange={initialRange}
              onChange={(start, end) =>
                onRangeChange({ startDate: start, endDate: end })
              }
            />
          )}

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
            dropdownWidth={ transfer ? "200px" : dropdownWidth}
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
      {user?.role == roles.hotelAdmin || isEstafeta || !buttonTitle ? null : (
        <Button onClick={toggleSidebar} minwidth={dropdownWidth}>
          {/* { isEstafeta  && <img src="/plus.png" style={{width:'10px', objectFit:'contain'}} alt="" /> } */}
          {buttonTitle}
        </Button>
      )}
    </div>
  );
}

export default Filter;
