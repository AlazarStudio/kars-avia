import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestHotel.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { CREATE_HOTEL, getCookie } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";

function CreateRequestHotel({ show, onClose, addHotel }) {
    const token = getCookie('token');

    const [formData, setFormData] = useState({
        name: '',
        city: '',
        address: '',
        quote: '',
        images: ''
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            name: '',
            city: '',
            address: '',
            quote: '',
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

    const [uploadFile, { data, loading, error }] = useMutation(CREATE_HOTEL, {
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
            let response_create_hotel = await uploadFile({
                variables: {
                    input: {
                        name: formData.name,
                        city: formData.city,
                        address: formData.address,
                        quote: formData.quote
                    },
                    images: formData.images
                }
            });

            if (response_create_hotel) {
                addHotel(response_create_hotel.data.createHotel);
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
                <div className={classes.requestTitle_name}>Добавить гостиницу</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Название</label>
                    <input type="text" name="name" placeholder="Гостиница Славянка" onChange={handleChange} />

                    <label>Город</label>
                    <input type="text" name="city" placeholder="Москва" onChange={handleChange} />

                    <label>Адрес</label>
                    <input type="text" name="address" placeholder="ул. Лесная  147" onChange={handleChange} />

                    <label>Квота</label>
                    <input type="text" name="quote" placeholder="24" onChange={handleChange} />

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

export default CreateRequestHotel;