import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestReserve.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function CreateRequestReserve({ show, onClose }) {
    const [formData, setFormData] = useState({
        airport: '',
        arrivalRoute: '',
        arrivalDate: '',
        arrivalTime: '',
        departureRoute: '',
        departureDate: '',
        departureTime: '',
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            airport: '',
            arrivalRoute: '',
            arrivalDate: '',
            arrivalTime: '',
            departureRoute: '',
            departureDate: '',
            departureTime: '',
        });
    };

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены");
        if (success) {
            resetForm();
            onClose();
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prevState => ({
                ...prevState,
                meals: {
                    ...prevState.meals,
                    [name]: checked
                }
            }));
        } else if (name === 'included') {
            setFormData(prevState => ({
                ...prevState,
                meals: {
                    ...prevState.meals,
                    included: value
                }
            }));
        } else {
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }

        if (formData.meals.included == 'Не включено') {
            formData.meals.breakfast = false;
            formData.meals.lunch = false;
            formData.meals.dinner = false;
        }
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                closeButton();
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [show, onClose]);

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Создать заявку</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Аэропорт</label>
                    <select name="airport" value={formData.airport} onChange={handleChange}>
                        <option value="" disabled>Выберите аэропорт</option>
                        <option value="Аэропорт1">Аэропорт1</option>
                        <option value="Аэропорт2">Аэропорт2</option>
                        <option value="Аэропорт3">Аэропорт3</option>
                    </select>

                    <label>Прибытие</label>
                    <input type="text" name="arrivalRoute" placeholder="Рейс" value={formData.arrivalRoute} onChange={handleChange} />
                    <div className={classes.reis_info}>
                        <input type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} placeholder="Дата" />
                        <input type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} placeholder="Время" />
                    </div>

                    <label>Отъезд</label>
                    <input type="text" name="departureRoute" placeholder="Рейс" value={formData.departureRoute} onChange={handleChange} />
                    <div className={classes.reis_info}>
                        <input type="date" name="departureDate" value={formData.departureDate} onChange={handleChange} placeholder="Дата" />
                        <input type="time" name="departureTime" value={formData.departureTime} onChange={handleChange} placeholder="Время" />
                    </div>
                </div>

            </div>

            <div className={classes.requestButon}>
                <Button>Создать заявку</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestReserve;