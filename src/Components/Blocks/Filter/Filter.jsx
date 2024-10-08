import React, { useState } from "react";
import classes from './Filter.module.css';
import Button from "../../Standart/Button/Button";

function Filter({ children, toggleSidebar, handleChange, filterData, buttonTitle, filterList, needDate,  pageNumberRelay,...props }) {
    return (
        <div className={classes.filter}>

            {filterList &&
                <>
                    {/*<div className={classes.filter_title}>Фильтр:</div>
                     <select className={classes.filter_select} name="filterSelect" value={filterData.filterAirport} onChange={handleChange}>
                        <option value="">Показать все</option>
                        <option value="DISPATCHERADMIN">Администратор</option>
                    </select> */}
                </>
            }

            {needDate &&
                <input type="date" name="filterDate" value={filterData.filterDate} onChange={handleChange} />
            }
            <Button onClick={toggleSidebar}>{buttonTitle}</Button>
        </div>
    );
}

export default Filter;