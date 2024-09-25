import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestAirlineCompany.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function EditRequestAirlineCompany({ show, onClose, nomer, category, onSubmit }) {
    const [formData, setFormData] = useState({
        avatar: nomer?.avatar || '',
        fio: nomer?.fio || '',
        post: nomer?.post || '',
        login: nomer?.login || '',
        password: nomer?.password || '',
        category: category || ''
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (show && nomer && category) {
            setFormData({
                avatar: nomer?.avatar || '',
                fio: nomer?.fio || '',
                post: nomer?.post || '',
                login: nomer?.login || '',
                password: nomer?.password || '',
                category: category || ''
            });
        }
    }, [show, category, nomer]);

    const closeButton = () => {
        let success = confirm("Вы уверены, что хотите закрыть? Все несохраненные данные будут потеряны.");
        if (success) {
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
        onSubmit(formData);
        onClose();
    };

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Редактировать</div>
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
                    <input type="text" name="password" value={formData.password} onChange={handleChange} placeholder="Введите пароль" />

                    <label>Отдел</label>
                    <select name="category" value={formData.category} onChange={handleChange}>
                        {/* {uniqueCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))} */}
                    </select>

                    <label>Аватар</label>
                    <input type="file" name="avatar" onChange={handleFileChange} />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Сохранить изменения</Button>
            </div>
        </Sidebar>
    );
}

export default EditRequestAirlineCompany;
