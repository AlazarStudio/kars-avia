import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from './CreateRequestCompanyHotel.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, server, CREATE_HOTEL_USER } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";
import Swal from "sweetalert2";

function CreateRequestCompanyHotel({ show, onClose, addDispatcher, id }) {
    const token = getCookie('token');

    const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
    const [formData, setFormData] = useState({
        images: '',
        name: '',
        email: '',
        role: '',
        position: '',
        login: '',
        password: ''
    });

    const sidebarRef = useRef();

    const resetForm = useCallback(() => {
        setFormData({
            images: '',
            name: '',
            email: '',
            role: '',
            position: '',
            login: '',
            password: ''
        });
        setIsEdited(false); // Сброс флага изменений
    }, []);

    const closeButton = useCallback(() => {
        if (!isEdited) {
            resetForm();
            onClose();
            return;
        }

        Swal.fire({
            title: 'Вы уверены?',
            text: 'Все несохраненные данные будут удалены.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Да',
            cancelButtonText: 'Нет',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                confirmButton: 'swal_confirm',
                cancelButton: 'swal_cancel',
            },
        }).then(result => {
            if (result.isConfirmed) {
                resetForm();
                onClose();
            }
        });
    }, [isEdited, resetForm, onClose]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    }, []);

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

        // Проверяем обязательные поля
        const requiredFields = ['name', 'email', 'role', 'position', 'login', 'password'];
        const emptyFields = requiredFields.filter((field) => !formData[field]?.trim());

        if (emptyFields.length > 0) {
            // alert('Пожалуйста, заполните все обязательные поля.');
            Swal.fire({
                title: 'Ошибка!',
                text: 'Пожалуйста, заполните все обязательные поля.',
                icon: 'error',
                confirmButtonText: 'Ок',
                customClass: {
                    confirmButton:'swal_confirm'
                }
            });
            return;
        }

        if (!formData.images) {
            // alert('Пожалуйста, выберите файл для загрузки.');
            Swal.fire({
                title: 'Ошибка!',
                text: 'Пожалуйста, выберите файл для загрузки.',
                icon: 'error',
                confirmButtonText: 'Ок',
                customClass: {
                    confirmButton:'swal_confirm'
                }
            });
            return;
        }
        // if (!formData.images) {
        //     alert('Пожалуйста, выберите файл для загрузки');
        //     return;
        // }

        try {
            let response_create_user = await uploadFile({
                variables: {
                    input: {
                        name: formData.name,
                        email: formData.email,
                        role: formData.role,
                        position: formData.position,
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
            if (
                document.querySelector('.swal2-container')?.contains(event.target) ||  // Клик в SweetAlert2
                sidebarRef.current?.contains(event.target) // Клик в боковой панели
            ) {
                return; // Если клик внутри, ничего не делаем
            }

            closeButton();
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [show, closeButton]);

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

                    <label>Роль</label>
                    <select name="role" value={formData.role} onChange={handleChange}>
                        <option value="" disabled>Выберите роль</option>
                        {/* <option value="HOTELMODERATOR">Модератор</option> */}
                        <option value="HOTELADMIN">HOTELADMIN</option>
                        {/* <option value="HOTELUSER">Пользователь</option> */}
                    </select>

                    <label>Должность</label>
                    <select name="position" value={formData.position} onChange={handleChange}>
                        <option value="" disabled>Выберите должность</option>
                        <option value="Модератор">Модератор</option>
                        <option value="Администратор">Администратор</option>
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