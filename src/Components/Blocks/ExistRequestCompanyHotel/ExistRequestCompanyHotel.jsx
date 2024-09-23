import React, { useState, useRef, useEffect } from "react";
import classes from './ExistRequestCompanyHotel.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, server, UPDATE_HOTEL_USER } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function ExistRequestCompanyHotel({ show, onClose, chooseObject, updateDispatcher, openDeleteComponent, filterList, id }) {
    const token = getCookie('token');

    const [uploadFile, { data, loading, error }] = useMutation(UPDATE_HOTEL_USER, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const [formData, setFormData] = useState({
        id: '',
        images: '',
        name: '',
        email: '',
        role: '',
        login: '',
        password: ''
    });

    const [index, setIndex] = useState(null);
    const [showIMG, setShowIMG] = useState();

    useEffect(() => {
        if (chooseObject) {
            setFormData({
                id: chooseObject.id || '',
                images: chooseObject.images || '',
                name: chooseObject.name || '',
                email: chooseObject.email || '',
                role: chooseObject.role || '',
                login: chooseObject.login || '',
                password: chooseObject.password || ''
            });
            setShowIMG(chooseObject.images)
            setIndex(chooseObject.index);
        }
    }, [chooseObject]);

    const sidebarRef = useRef();

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены");
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
                images: file
            }));
        }
    };
    
    const handleUpdate = async () => {
        let response_update_user = await uploadFile({
            variables: {
                input: {
                    id: formData.id,
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    login: formData.login,
                    password: formData.password,
                    hotelId: id
                },
                images: formData.images.lastModified ? formData.images : null
            }
        });

        if (response_update_user) {
            updateDispatcher(response_update_user.data.updateUser, index);
            onClose();
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
                <div className={classes.requestTitle_name}>Пользователь</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="Close" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <div className={classes.requestDataInfo_img}>
                        <div className={classes.requestDataInfo_img_imgBlock}>
                            <img src={`${server}${showIMG}`} alt="" />
                        </div>
                    </div>

                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>ФИО</div>
                        <input
                            type="text"
                            name="name"
                            placeholder="Иванов Иван Иванович"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Почта</div>
                        <input
                            type="text"
                            name="email"
                            placeholder="example@mail.ru"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Должность</div>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="HOTELMODERATOR">Модератор</option>
                            <option value="ADMIN">Администратор</option>
                            <option value="HOTELUSER">Пользователь</option>
                        </select>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Логин</div>
                        <input
                            type="text"
                            name="login"
                            placeholder="Логин"
                            value={formData.login}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Пароль</div>
                        <input
                            type="text"
                            name="password"
                            placeholder="Пароль"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Аватар</div>
                        <input
                            type="file"
                            name="images"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button onClick={() => openDeleteComponent(index, formData.id)} backgroundcolor={'#FF9C9C'}>Удалить <img src="/delete.png" alt="" /></Button>
                <Button onClick={handleUpdate} backgroundcolor={'#3CBC6726'} color={'#3B6C54'}>Изменить <img src="/editDispetcher.png" alt="" /></Button>
            </div>

        </Sidebar>
    );
}

export default ExistRequestCompanyHotel;
