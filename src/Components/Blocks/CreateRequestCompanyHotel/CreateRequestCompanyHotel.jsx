import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestCompanyHotel.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, server, CREATE_HOTEL_USER } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function CreateRequestCompanyHotel({ show, onClose, addDispatcher, id }) {
    const token = getCookie('token');

    const [formData, setFormData] = useState({
        images: '',
        name: '',
        email: '',
        role: '',
        login: '',
        password: ''
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            images: '',
            name: '',
            email: '',
            role: '',
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
                images: file // Сохраняем файл напрямую
            }));
        }
    };

    const [uploadFile, { data, loading, error }] = useMutation(CREATE_HOTEL_USER, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.images) {
            alert('Пожалуйста, выберите файл для загрузки');
            return;
        }

        try {
            let response_create_user = await uploadFile({
                variables: {
                    input: {
                        name: formData.name,
                        email: formData.email,
                        role: formData.role,
                        login: formData.login,
                        password: formData.password,
                        hotelId: id
                    },
                    images: formData.images
                }
            });

            if (response_create_user) {
                addDispatcher(response_create_user.data.registerUser);
                resetForm();
                onClose();
            }
        } catch (e) {
            console.error('Ошибка при загрузке файла:', e);
        }
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
                    <input type="text" name="name" placeholder="Иванов Иван Иванович" value={formData.name} onChange={handleChange} />

                    <label>Почта</label>
                    <input type="email" name="email" placeholder="example@mail.ru" value={formData.email} onChange={handleChange} />

                    <label>Должность</label>
                    <select name="role" value={formData.role} onChange={handleChange}>
                        <option value="" disabled>Выберите должность</option>
                        {/* <option value="HOTELMODERATOR">Модератор</option> */}
                        <option value="HOTELADMIN">Администратор</option>
                        {/* <option value="HOTELUSER">Пользователь</option> */}
                    </select>

                    <label>Логин</label>
                    <input type="text" name="login" placeholder="Логин" value={formData.login} onChange={handleChange} />

                    <label>Пароль</label>
                    <input type="password" name="password" placeholder="Пароль" value={formData.password} onChange={handleChange} />

                    <label>Аватар</label>
                    <input type="file" name="images" onChange={handleFileChange} />
                </div>

            </div>

            <div className={classes.requestButton}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestCompanyHotel;