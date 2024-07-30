import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestCompany.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function CreateRequestCompany({ show, onClose }) {
    const [formData, setFormData] = useState({
        avatar: '',
        surname: '',
        name: '',
        patronymic: '',
        post: '',
        login: '',
        password: ''
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            avatar: '',
            surname: '',
            name: '',
            patronymic: '',
            post: '',
            login: '',
            password: ''
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
                <div className={classes.requestTitle_name}>Добавить диспетчера</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Фамилия</label>
                    <input type="text" name="arrivalRoute" placeholder="Фамилия" value={formData.arrivalRoute} onChange={handleChange} />

                    <label>Имя</label>
                    <input type="text" name="arrivalRoute" placeholder="Имя" value={formData.arrivalRoute} onChange={handleChange} />

                    <label>Отчество</label>
                    <input type="text" name="arrivalRoute" placeholder="Отчество" value={formData.arrivalRoute} onChange={handleChange} />

                    <label>Должность</label>
                    <select name="airport" value={formData.airport} onChange={handleChange}>
                        <option value="" disabled>Выберите должность</option>
                        <option value="Модератор">Модератор</option>
                        <option value="Администратор">Администратор</option>
                    </select>

                    <label>Логин</label>
                    <input type="text" name="arrivalRoute" placeholder="Логин" value={formData.arrivalRoute} onChange={handleChange} />
                    
                    <label>Пароль</label>
                    <input type="text" name="arrivalRoute" placeholder="Пароль" value={formData.arrivalRoute} onChange={handleChange} />
                    
                    <label>Аватар</label>
                    <input type="file" name="arrivalRoute" placeholder="Пароль" value={formData.arrivalRoute} onChange={handleChange} />
                </div>

            </div>

            <div className={classes.requestButon}>
                <Button>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestCompany;