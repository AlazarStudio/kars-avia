import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestReport.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function CreateRequestReport({ show, onClose, addDispatcher }) {
    const [formData, setFormData] = useState({
        airline: '',
        airlineImg: '',
        dateFormirovania: '',
        startDate: '',
        endDate: ''
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            airline: '',
            airlineImg: '',
            dateFormirovania: '',
            startDate: '',
            endDate: ''
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

    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Месяцы в JavaScript начинаются с 0
        const day = String(today.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prevState => ({
                ...prevState,
                airlineImg: file.name
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        addDispatcher({
            ...formData,
            dateFormirovania: getCurrentDate()
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
                <div className={classes.requestTitle_name}>Добавить диспетчера</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Авиакомпания</label>
                    <input type="text" name="airline" placeholder="Авиакомпания" value={formData.airline} onChange={handleChange} />

                    <label>Начальная дата</label>
                    <input type="date" name="startDate" placeholder="Начальная дата" value={formData.startDate} onChange={handleChange} />

                    <label>Конечная дата</label>
                    <input type="date" name="endDate" placeholder="Конечная дата" value={formData.endDate} onChange={handleChange} />

                    <label>Картинка</label>
                    <input type="file" name="airlineImg" onChange={handleFileChange} />
                </div>

            </div>

            <div className={classes.requestButton}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestReport;