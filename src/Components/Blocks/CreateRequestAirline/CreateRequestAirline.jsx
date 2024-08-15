import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestAirline.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function CreateRequestAirline({ show, onClose, addHotel }) {
    const [formData, setFormData] = useState({
        airlineName: '',
        airlineImage: ''
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            airlineName: '',
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
                airlineImage: file.name
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
                    <input type="text" name="airlineName" placeholder="Гостиница Славянка"  onChange={handleChange} />

                    <label>Картинка</label>
                    <input type="file" name="airlineImage" onChange={handleFileChange} />
                </div>

            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestAirline;