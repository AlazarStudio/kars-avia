import React from "react";
import classes from './Filter.module.css';
import Button from "../../Standart/Button/Button";
import Input from "../../Standart/Input/Input";

function Filter({ children, ...props }) {
    return (
        <div className={classes.filter}>
            <div className={classes.filter_title}>Фильтр:</div>
            <select className={classes.filter_select}>
                <option value="Авиакомпания 1">Авиакомпания 1</option>
                <option value="Авиакомпания 2">Авиакомпания 2</option>
            </select>
            <Input width={'170px'} type={'date'}/>
            <Button>Создать заявку</Button>
        </div >
    );
}

export default Filter;