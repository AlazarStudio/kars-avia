import React, { useState } from "react";
import classes from './Filter.module.css';
import Button from "../../Standart/Button/Button";

function Filter({ children, toggleSidebar, handleChange, filterData, ...props }) {
    return (
        <div className={classes.filter}>
            <div className={classes.filter_title}>Фильтр:</div>
            <select className={classes.filter_select} name="filterAirport" value={filterData.filterAirport} onChange={handleChange}>
                <option value="" disabled>Выберите авиакомпанию</option>
                <option value="Азимут">Азимут</option>
                <option value="S7 airlines">S7 airlines</option>
                <option value="Северный ветер">Северный ветер</option>
            </select>
            <input type="date" name="filterDate" value={filterData.filterDate} onChange={handleChange} />
            <Button onClick={toggleSidebar}>Создать заявку</Button>
        </div>
    );
}

export default Filter;