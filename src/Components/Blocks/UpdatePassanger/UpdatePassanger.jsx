import React, { useState, useRef, useEffect } from "react";
import classes from './UpdatePassanger.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function UpdatePassanger({ show, onClose, onAddPassenger, placement, idPassangerForUpdate, updatePassenger, ...props }) {
    const [formData, setFormData] = useState({
        fio: '',
        sex: '',
        phone: '',
        arrival_date: '',
        arrival_time: '',
        departure_date: '',
        departure_time: ''
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            fio: placement.fio || '',
            sex: placement.sex || '',
            phone: placement.phone || '',
            arrival_date: placement.arrival_date || '',
            arrival_time: placement.arrival_time || '',
            departure_date: placement.departure_date || '',
            departure_time: placement.departure_time || ''
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

    const handleSubmit = () => {
        updatePassenger(formData, idPassangerForUpdate);
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

    useEffect(() => {
        if (placement) {
            setFormData({
                fio: placement.fio || '',
                sex: placement.sex || '',
                phone: placement.phone || '',
                arrival_date: placement.arrival_date || '',
                arrival_time: placement.arrival_time || '',
                departure_date: placement.departure_date || '',
                departure_time: placement.departure_time || ''
            });
        }
    }, [placement]);

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Редактировать</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>ФИО</label>
                    <input type="text" name="fio" placeholder="Иванов Иван Иванович" value={formData.fio} onChange={handleChange} />

                    <label>Пол</label>
                    <select name="sex" value={formData.sex} onChange={handleChange}>
                        <option value="" disabled>Выберите пол</option>
                        <option value="Мужской">Мужской</option>
                        <option value="Женский">Женский</option>
                    </select>

                    <label>Телефон</label>
                    <input type="text" name="phone" placeholder="89094567899" value={formData.phone} onChange={handleChange} />

                    <label>Прибытие</label>
                    <div className={classes.reis_info}>
                        <input disabled type="date" name="arrival_date" value={formData.arrival_date} onChange={handleChange} placeholder="Дата" />
                        <input disabled type="time" name="arrival_time" value={formData.arrival_time} onChange={handleChange} placeholder="Время" />
                    </div>

                    <label>Отъезд</label>
                    <div className={classes.reis_info}>
                        <input type="date" name="departure_date" value={formData.departure_date} onChange={handleChange} placeholder="Дата" />
                        <input type="time" name="departure_time" value={formData.departure_time} onChange={handleChange} placeholder="Время" />
                    </div>
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button onClick={handleSubmit}>Редактировать пассажира</Button>
            </div>
        </Sidebar>
    );
}

export default UpdatePassanger;
