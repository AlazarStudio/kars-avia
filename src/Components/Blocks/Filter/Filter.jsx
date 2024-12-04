import React, { useMemo } from "react";
import classes from './Filter.module.css';
import Button from "../../Standart/Button/Button";
import DropDownList from "../DropDownList/DropDownList";
import { roles } from "../../../roles";

function Filter({ toggleSidebar, handleChange, handleStatusChange, filterData, buttonTitle, filterList, needDate, filterLocalData, user, ...props }) {
    // Опции для выбора состояния
    let filterListShow

    if (user && user?.role === roles.superAdmin || user?.role === roles.dispatcerAdmin || user?.role === roles.airlineAdmin) {
        filterListShow = [
            { label: "Все заявки", value: "all" },
            { label: "Создан / В обработке", value: "created / opened" },
            { label: "Размещен", value: "done" },
            { label: "Готов к архиву", value: "archiving" },
            { label: "Архивные", value: "archived" },
            { label: "Отменен", value: "cancelled" },
        ]
    }

    if (user && user?.role === roles.hotelAdmin) {
        filterListShow = [
            { label: "Все заявки", value: "all" },
            { label: "Создан / В обработке", value: "created / opened" },
            { label: "Размещен", value: "done" },
            { label: "Готов к архиву", value: "archiving" },
            { label: "Отменен", value: "cancelled" },
        ]
    }

    const statusOptions = useMemo(() => filterListShow, []);

    // Опции для фильтрации по роли
    const filterOptions = useMemo(() => [
        { label: "Показать все", value: "" },
        { label: "Администратор", value: "DISPATCHERADMIN" }
    ], []);

    let filter = filterLocalData || "created / opened"

    return (
        <div className={classes.filter}>
            {handleStatusChange && (
                <>
                    <div className={classes.filter_title}>Статус:</div>
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
