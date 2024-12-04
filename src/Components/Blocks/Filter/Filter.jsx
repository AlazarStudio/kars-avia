import React, { useEffect, useMemo, useState } from "react";
import classes from './Filter.module.css';
import Button from "../../Standart/Button/Button";
import DropDownList from "../DropDownList/DropDownList";
import { roles } from "../../../roles";
import { useQuery } from "@apollo/client";
import { GET_AIRLINES_RELAY, GET_AIRPORTS_RELAY } from "../../../../graphQL_requests";

function Filter({ toggleSidebar, isVisibleAirFiler, selectedAirline, setSelectedAirline, selectedAirport, setSelectedAirport, handleChange, handleStatusChange, filterData, buttonTitle, filterList, needDate, filterLocalData, user, ...props }) {
    const [airlines, setAirlines] = useState([]);
    const [airports, setAirports] = useState([]);

    // Запросы для получения авиакомпаний и аэропортов
    const { data: airlinesData, loading: airlinesLoading, error: airlinesError } = useQuery(GET_AIRLINES_RELAY);
    const { data: airportsData, loading: airportsLoading, error: airportsError } = useQuery(GET_AIRPORTS_RELAY);
    // console.log(airlinesData);
    // console.log(airportsData);



    useEffect(() => {
        if (airlinesData) {
            setAirlines(airlinesData.airlines || []);
        }
    }, [airlinesData]);

    useEffect(() => {
        if (airportsData) {
            setAirports(airportsData.airports || []);
        }
    }, [airportsData]);

    // Опции для выбора состояния
    let filterListShow

    if (user && user?.role === roles.superAdmin || user?.role === roles.dispatcerAdmin || user?.role === roles.airlineAdmin) {
        filterListShow = [
            { label: "Все заявки", value: "all" },
            { label: "Создан / В обработке", value: "created / opened" },
            { label: "Размещен", value: "done" },
            { label: "Готов к архиву", value: "archiving" },
            { label: "Архивные", value: "archived" },
            { label: "Отменен", value: "canceled" },
        ]
    }

    if (user && user?.role === roles.hotelAdmin) {
        filterListShow = [
            { label: "Все заявки", value: "all" },
            { label: "Создан / В обработке", value: "created / opened" },
            { label: "Размещен", value: "done" },
            { label: "Готов к архиву", value: "archiving" },
            { label: "Отменен", value: "canceled" },
        ]
    }

    const statusOptions = useMemo(() => filterListShow, []);

    // Опции для фильтрации по роли
    // const filterOptions = useMemo(() => [
    //     { label: "Показать все", value: "" },
    //     { label: "Администратор", value: "DISPATCHERADMIN" }
    // ], []);

    let filter = filterLocalData || "created / opened"

    return (
        <div className={classes.filter}>

            {isVisibleAirFiler && (
                <>
                    <DropDownList
                        width={'200px'}
                        placeholder="Выберите авиакомпанию"
                        options={['Все авиакомпании', ...airlines.map(airline => airline.name)]} // Добавляем 'Все авиакомпании'
                        initialValue={selectedAirline?.name || 'Все авиакомпании'} // Устанавливаем "Все авиакомпании" по умолчанию
                        onSelect={(value) => {
                            if (value === 'Все авиакомпании') {
                                setSelectedAirline(null); // Если выбрали "Все авиакомпании", сбрасываем выбранную авиакомпанию
                                handleChange({ target: { name: "airline", value: "" } }); // Убираем фильтрацию по авиакомпании
                            } else {
                                const selectedOption = airlines.find(airline => airline.name === value);
                                setSelectedAirline(selectedOption);
                                handleChange({ target: { name: "airline", value: selectedOption?.id || "" } });
                            }
                        }}
                    />
                    <DropDownList
                        width={'200px'}
                        placeholder="Выберите аэропорт"
                        options={['Все аэропорты', ...airports.map(airport => airport.name)]}  // Добавляем 'Все аэропорты'
                        initialValue={selectedAirport?.name || 'Все аэропорты'}  // Устанавливаем "Все аэропорты" по умолчанию, если ничего не выбрано
                        onSelect={(value) => {
                            if (value === 'Все аэропорты') {
                                setSelectedAirport(null);  // Если выбрали "Все аэропорты", сбрасываем выбранный аэропорт
                                handleChange({ target: { name: "airport", value: "" } });  // Убираем фильтрацию по аэропорту
                            } else {
                                const selectedOption = airports.find(airport => airport.name === value);
                                setSelectedAirport(selectedOption);
                                handleChange({ target: { name: "airport", value: selectedOption?.id || "" } });
                            }
                        }}
                    />
                </>
            )}

            {handleStatusChange && (
                <>
                    {/* <div className={classes.filter_title}>Статус:</div> */}
                    <DropDownList
                        width={'200px'}
                        placeholder="Выберите состояние"
                        searchable={false}
                        options={statusOptions.map(option => option.label)}
                        initialValue={statusOptions.find(option => option.value === filter)?.label}
                        onSelect={(value) => {
                            const selectedOption = statusOptions.find(option => option.label === value);
                            handleStatusChange(selectedOption?.value || "");
                        }}
                    />
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
            {
                user?.role == roles.airlineAdmin
                    ? null
                    : <Button onClick={toggleSidebar} minwidth={'200px'}>{buttonTitle}</Button>
            }
        </div>
    );
}

export default Filter;
