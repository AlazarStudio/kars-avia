import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestCompanyHotel.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function CreateRequestCompanyHotel({ show, onClose, addDispatcher }) {
    const [formData, setFormData] = useState({
        avatar: '',
        fio: '',
        post: 'Модератор',
        login: '',
        password: ''
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            avatar: '',
            fio: '',
            post: 'Модератор',
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
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prevState => ({
                ...prevState,
                avatar: file.name
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        addDispatcher({
            ...formData,
            id: Date.now().toString()  // Generate a unique id for the new dispatcher
        });
        resetForm();
        onClose();
    };

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
                <div className={classes.requestTitle_name}>Добавить учетку</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>ФИО</label>
                    <input type="text" name="fio" placeholder="Иванов Иван Иванович" value={formData.arrivalRoute} onChange={handleChange} />

                    <label>Должность</label>
                    <select name="post" value={formData.airport} onChange={handleChange}>
                        <option value="" disabled>Выберите должность</option>
                        <option value="Модератор">Модератор</option>
                        <option value="Администратор">Администратор</option>
                    </select>

                    <label>Логин</label>
                    <input type="text" name="login" placeholder="Логин" value={formData.arrivalRoute} onChange={handleChange} />

                    <label>Пароль</label>
                    <input type="text" name="password" placeholder="Пароль" value={formData.arrivalRoute} onChange={handleChange} />

                    <label>Аватар</label>
                    <input type="file" name="avatar" placeholder="Пароль" value={formData.arrivalRoute} onChange={handleFileChange} />
                </div>

            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestCompanyHotel;