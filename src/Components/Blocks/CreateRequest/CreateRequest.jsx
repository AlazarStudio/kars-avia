import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequest.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function CreateRequest({ show, onClose }) {
    const [activeTab, setActiveTab] = useState('Общая');
    const [formData, setFormData] = useState({
        fullName: '',
        airport: '',
        arrivalRoute: '',
        arrivalDate: '',
        arrivalTime: '',
        departureRoute: '',
        departureDate: '',
        departureTime: '',
        roomType: '',
        meals: {
            included: 'Включено',
            breakfast: false,
            lunch: false,
            dinner: false,
        }
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setActiveTab('Общая');
        setFormData({
            fullName: '',
            airport: '',
            arrivalRoute: '',
            arrivalDate: '',
            arrivalTime: '',
            departureRoute: '',
            departureDate: '',
            departureTime: '',
            roomType: '',
            meals: {
                included: 'Включено',
                breakfast: false,
                lunch: false,
                dinner: false,
            }
        });
    };

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены");
        if (success) {
            resetForm();
            onClose();
        }
    }

    const handleTabChange = (tab) => {
        setActiveTab(tab);
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

        if (formData.meals.included == 'Не включено') {
            formData.meals.breakfast = false;
            formData.meals.lunch = false;
            formData.meals.dinner = false;
        }
    }

    let transform = show ? 'translateX(0px)' : 'translateX(500px)';

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
        <Sidebar show={show} transform={transform} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Создать заявку</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.tabs}>
                    <div className={`${classes.tab} ${activeTab === 'Общая' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Общая')}>Общая</div>
                    <div className={`${classes.tab} ${activeTab === 'Доп. услуги' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Доп. услуги')}>Доп. услуги</div>
                </div>

                {activeTab === 'Общая' && (
                    <div className={classes.requestData}>
                        <label>
                            ФИО
                            <input type="text" name="fullName" placeholder="Иванов Иван Иванович" value={formData.fullName} onChange={handleChange} />
                        </label>
                        <label>
                            Аэропорт
                            <select name="airport" value={formData.airport} onChange={handleChange}>
                                <option value="Аэропорт">Аэропорт</option>
                                <option value="Аэропорт1">Аэропорт1</option>
                                <option value="Аэропорт2">Аэропорт2</option>
                                <option value="Аэропорт3">Аэропорт3</option>
                                <option value="Аэропорт4">Аэропорт4</option>
                            </select>
                        </label>
                        <label>
                            Прибытие
                            <input type="text" name="arrivalRoute" placeholder="Рейс" value={formData.arrivalRoute} onChange={handleChange} />
                            <div className={classes.reis_info}>
                                <input type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} placeholder="Дата" />
                                <input type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} placeholder="Время" />
                            </div>
                        </label>
                        <label>
                            Отъезд
                            <input type="text" name="departureRoute" placeholder="Рейс" value={formData.departureRoute} onChange={handleChange} />
                            <div className={classes.reis_info}>
                                <input type="date" name="departureDate" value={formData.departureDate} onChange={handleChange} placeholder="Дата" />
                                <input type="time" name="departureTime" value={formData.departureTime} onChange={handleChange} placeholder="Время" />
                            </div>
                        </label>
                        <label>
                            Номер
                            <select name="roomType" value={formData.roomType} onChange={handleChange}>
                                <option value="Одноместный">Одноместный</option>
                                <option value="Двухместный">Двухместный</option>
                            </select>
                        </label>
                    </div>
                )}
                {activeTab === 'Доп. услуги' && (
                    <div className={classes.requestData}>
                        <label>
                            Питание
                            <select name="included" value={formData.meals.included} onChange={handleChange}>
                                <option value="Включено">Включено</option>
                                <option value="Не включено">Не включено</option>
                            </select>
                        </label>
                        <div className={classes.checks} style={{ 'display': `${formData.meals.included == 'Включено' ? 'flex' : 'none'}` }}>
                            <label>
                                <input type="checkbox" name="breakfast" checked={formData.meals.breakfast} onChange={handleChange} />
                                Завтрак
                            </label>
                            <label>
                                <input type="checkbox" name="lunch" checked={formData.meals.lunch} onChange={handleChange} />
                                Обед
                            </label>
                            <label>
                                <input type="checkbox" name="dinner" checked={formData.meals.dinner} onChange={handleChange} />
                                Ужин
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className={classes.requestButon}>
                <Button onClick={() => alert('Заявка создана!')}>Создать заявку</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequest;
