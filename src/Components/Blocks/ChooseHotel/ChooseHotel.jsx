import React, { useState, useRef, useEffect } from "react";
import classes from './ChooseHotel.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function ChooseHotel({ show, onClose }) {
    const [formData, setFormData] = useState({
        city: '',
        hotel: '',
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            city: '',
            hotel: '',
        });
    };

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены");
        if (success) {
            resetForm();
            onClose();
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prevState => ({
                ...prevState,
                meals: {
                    ...prevState.meals,
                    [name]: checked
                }
            }));
        } else if (name === 'included') {
            setFormData(prevState => ({
                ...prevState,
                meals: {
                    ...prevState.meals,
                    included: value
                }
            }));
        } else {
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    }
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
                <div className={classes.requestTitle_name}>Выбрать гостинницу</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Город</label>
                    <input type="text" name="city" placeholder="Введите город" value={formData.city} onChange={handleChange} />

                    <label>Гостинница</label>
                    <input type="text" name="hotel" placeholder="Введите название гостиницы" value={formData.hotel} onChange={handleChange} />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button link={'/placement'}>Разместить<img src="/user-check.png" alt="" /></Button>
            </div>
        </Sidebar>
    );
}

export default ChooseHotel;