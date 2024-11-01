import React, { useState } from "react";
import classes from './Filter.module.css';
import Button from "../../Standart/Button/Button";

function Filter({ children, toggleSidebar, handleChange, handleStatusChange, filterData, buttonTitle, filterList, needDate, pageNumberRelay, ...props }) {
    return (
        <div className={classes.filter}>
            {handleStatusChange &&
                <>
                    <div className={classes.filter_title}>Состояние:</div>
                    <select className={classes.filter_select} onChange={handleStatusChange} defaultValue="created / opened">
                        <option value="all">Все заявки</option>
                        <option value="created / opened">Создан / В обработке</option>
                        <option value="cancelled">Отменен</option>
                        <option value="done">Размещен</option>
                    </select>
                </>
            }

            {filterList &&
                <>
                    {/* <div className={classes.filter_title}>Фильтр:</div>
                    <select className={classes.filter_select} name="filterSelect" value={filterData.filterAirport} onChange={handleChange}>
                        <option value="">Показать все</option>
                        <option value="DISPATCHERADMIN">Администратор</option>
                    </select> */}
                </>
            }

            {needDate &&
                <>
                    {/* <input type="date" name="filterDate" value={filterData.filterDate} onChange={handleChange} /> */}
                </>
            }
            <Button onClick={toggleSidebar}>{buttonTitle}</Button>
        </div>
    );
}

export default Filter;