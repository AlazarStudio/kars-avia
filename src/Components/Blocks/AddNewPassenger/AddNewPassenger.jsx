import React, { useState, useRef, useEffect } from "react";
import classes from './AddNewPassenger.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function AddNewPassenger({ show, onClose, onAddPassenger, request, ...props }) {
    const [formData, setFormData] = useState({
        client: '',
        sex: '',
        phone: '',
        start: '',
        startTime: '',
        end: '',
        endTime: '',
        room: '',
        place: '',
        requestId: '',
        public: false,
    });

    useEffect(() => {
        if (request.arrival && request.departure) {
            setFormData((prevFormData) => ({
                ...prevFormData,
                start: request.arrival.date,
                startTime: request.arrival.time,
                end: request.departure.date,
                endTime: request.departure.time,
                requestId: request.id,
            }));
        }
    }, [request]);

    const resetForm = () => {
        setFormData({
            client: '',
            sex: '',
            phone: '',
            room: '',
            place: '',
            requestId: formData.requestId,
            public: false,
            start: formData.start,
            startTime: formData.startTime,
            end: formData.end,
            endTime: formData.endTime
        });
    };

    const sidebarRef = useRef();

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
        onAddPassenger(formData);
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
                <div className={classes.requestTitle_name}>Добавить пассажира</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>ФИО</label>
                    <input type="text" name="client" placeholder="Иванов Иван Иванович" value={formData.client} onChange={handleChange} />

                    <label>Пол</label>
                    <select name="sex" value={formData.sex} onChange={handleChange}>
                        <option value="" disabled>Выберите пол</option>
                        <option value="Мужской">Мужской</option>
                        <option value="Женский">Женский</option>
                    </select>

                    <label>Телефон</label>
                    <input type="text" name="phone" placeholder="89094567899" value={formData.phone} onChange={handleChange} />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button onClick={handleSubmit}>Добавить пассажира</Button>
            </div>
        </Sidebar>
    );
}

export default AddNewPassenger;
