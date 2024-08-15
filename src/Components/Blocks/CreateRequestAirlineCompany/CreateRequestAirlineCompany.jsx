import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestAirlineCompany.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function CreateRequestAirlineCompany({ show, onClose, addTarif, setAddTarif, uniqueCategories }) {
    const [formData, setFormData] = useState({
        avatar: '',
        fio: '',
        post: '',
        login: '',
        password: '',
        category: ''
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            avatar: '',
            fio: '',
            post: '',
            login: '',
            password: '',
            category: uniqueCategories[0] || ''
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

        setAddTarif(prevTarifs => {
            const existingCategory = prevTarifs.find(tarif => tarif.type === formData.category);

            if (existingCategory) {
                const updatedNumbers = [...existingCategory.numbers, formData];

                return prevTarifs.map(tarif =>
                    tarif.type === formData.category
                        ? { ...tarif, numbers: updatedNumbers }
                        : tarif
                );
            } else {
                return [
                    ...prevTarifs,
                    {
                        type: formData.category,
                        numbers: [formData]
                    }
                ];
            }
        });
        resetForm();
        onClose();
    };

    useEffect(() => {
        if (show) {
            resetForm();
            const handleClickOutside = (event) => {
                if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                    closeButton();
                }
            };
            document.addEventListener('mousedown', handleClickOutside);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [show]);

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Добавить аккаунт</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="Close" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>ФИО</label>
                    <input type="text" name="fio" value={formData.fio} onChange={handleChange} placeholder="Введите ФИО" />

                    <label>Должность</label>
                    <select name="post" value={formData.post} onChange={handleChange}>
                        <option value="" disabled>Выберите должность</option>
                        <option value="Модератор">Модератор</option>
                        <option value="Администратор">Администратор</option>
                    </select>

                    <label>Логин</label>
                    <input type="text" name="login" value={formData.login} onChange={handleChange} placeholder="Введите логин" />

                    <label>Пароль</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Введите пароль" />

                    <label>Отдел</label>
                    <select name="category" value={formData.category} onChange={handleChange}>
                        {uniqueCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>

                    <label>Аватар</label>
                    <input type="file" name="avatar" onChange={handleFileChange} />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestAirlineCompany;
