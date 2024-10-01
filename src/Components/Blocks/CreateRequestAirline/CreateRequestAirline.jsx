import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestAirline.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { CREATE_AIRLINE, getCookie } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";

function CreateRequestAirline({ show, onClose, addHotel }) {
    const token = getCookie('token');

    const [formData, setFormData] = useState({
        name: '',
        images: ''
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            name: '',
            images: ''
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

    const [uploadFile, { data, loading, error }] = useMutation(CREATE_AIRLINE, {
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
            let response_create_airline = await uploadFile({
                variables: {
                    input: {
                        name: formData.name,
                    },
                    images: formData.images
                }
            });

            if (response_create_airline) {
                addHotel(response_create_airline.data.createAirline);
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
                <div className={classes.requestTitle_name}>Добавить авиакомпанию</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Название</label>
                    <input type="text" name="name" placeholder="Авиакомпания Азимут" onChange={handleChange} />

                    <label>Картинка</label>
                    <input type="file" name="images" onChange={handleFileChange} />
                </div>

            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestAirline;