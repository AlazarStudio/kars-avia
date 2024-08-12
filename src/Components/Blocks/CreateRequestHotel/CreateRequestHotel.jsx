import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestHotel.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function CreateRequestHotel({ show, onClose, addHotel }) {
    const [formData, setFormData] = useState({
        hotelName: '',
        hotelCity: '',
        hotelAdress: '',
        hotelKvota: '',
        hotelImage: ''
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            hotelName: '',
            hotelCity: '',
            hotelAdress: '',
            hotelKvota: '',
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
                hotelImage: file.name
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        addHotel({
            ...formData,
            id: Date.now().toString()
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
                <div className={classes.requestTitle_name}>Добавить гостиницу</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Название</label>
                    <input type="text" name="hotelName" placeholder="Гостиница Славянка"  onChange={handleChange} />
                    
                    <label>Город</label>
                    <input type="text" name="hotelCity" placeholder="Москва"  onChange={handleChange} />

                    <label>Адрес</label>
                    <input type="text" name="hotelAdress" placeholder="ул. Лесная  147" onChange={handleChange} />

                    <label>Квота</label>
                    <input type="text" name="hotelKvota" placeholder="24" onChange={handleChange} />

                    <label>Картинка</label>
                    <input type="file" name="hotelImage" onChange={handleFileChange} />
                </div>

            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestHotel;