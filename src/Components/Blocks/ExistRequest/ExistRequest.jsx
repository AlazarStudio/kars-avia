import React, { useState, useRef, useEffect } from "react";
import classes from './ExistRequest.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function ExistRequest({ show, onClose }) {
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

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (activeTab === 'Комментарии') {
            scrollToBottom();
        }
    }, [activeTab]);

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Заявка №123MV077</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.tabs}>
                    <div className={`${classes.tab} ${activeTab === 'Общая' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Общая')}>Общая</div>
                    <div className={`${classes.tab} ${activeTab === 'Доп. услуги' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Доп. услуги')}>Доп. услуги</div>
                    <div className={`${classes.tab} ${activeTab === 'Комментарии' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Комментарии')}>Комментарии</div>
                    <div className={`${classes.tab} ${activeTab === 'История' ? classes.activeTab : ''}`} onClick={() => handleTabChange('История')}>История</div>
                </div>

                {activeTab === 'Общая' && (
                    <div className={classes.requestData}>
                        <div className={classes.requestDataTitle}>
                            Информация о сотруднике
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>ФИО</div>
                            <div className={classes.requestDataInfo_desc}>Иванов Иван Иванович </div>
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Должность</div>
                            <div className={classes.requestDataInfo_desc}>КВС</div>
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Пол</div>
                            <div className={classes.requestDataInfo_desc}>Мужской</div>
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Номер телефона</div>
                            <div className={classes.requestDataInfo_desc}>8 909 345-23 43</div>
                        </div>

                        <div className={classes.requestDataTitle}>
                            Информация о заявке
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Номер заявки</div>
                            <div className={classes.requestDataInfo_desc}>Заявка - №23432423</div>
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Гостиница</div>
                            <div className={classes.requestDataInfo_desc}>Славянка</div>
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Номер комнаты</div>
                            <div className={classes.requestDataInfo_desc}>№321</div>
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Категория номера</div>
                            <div className={classes.requestDataInfo_desc}>Одноместный</div>
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Заезд</div>
                            <div className={classes.requestDataInfo_desc}>12.05.2024, 16:00</div>
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Выезд</div>
                            <div className={classes.requestDataInfo_desc}>16.05.2024, 12:00</div>
                        </div>
                    </div>
                )}
                {activeTab === 'Доп. услуги' && (
                    <div className={classes.requestData}>
                        <div className={classes.requestDataTitle}>
                            Питание
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Питание</div>
                            <div className={classes.requestDataInfo_desc}>Включено</div>
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Завтрак</div>
                            <input type="number" name="breakfast" value={1} />
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Обед</div>
                            <input type="number" name="lunch" value={1} />
                        </div>
                        <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>Ужин</div>
                            <input type="number" name="dinner" value={1} />
                        </div>

                        <div className={classes.requestDataTitle}>
                            Продление
                        </div>
                        <div className={classes.reis_info}>
                            <input type="date" name="departureDate" value={formData.departureDate} onChange={handleChange} placeholder="Дата" />
                            <input type="time" name="departureTime" value={formData.departureTime} onChange={handleChange} placeholder="Время" />
                        </div>
                        <Button>Продлить</Button>
                    </div>
                )}
                {activeTab === 'Комментарии' && (
                    <div className={classes.requestData}>
                        <div className={classes.requestData_messages}>
                            <div className={classes.requestData_date}>
                                <div className={classes.requestData_date_info}>17 мая 2024</div>
                            </div>

                            <div className={classes.requestData_message_full}>
                                <div className={classes.requestData_message}>
                                    <div className={classes.requestData_message_name}>Марина </div>
                                    <div className={classes.requestData_message_post}>Диспетчер KarsAvia </div>
                                    <div className={classes.requestData_message_text}>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                                        quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                                        fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa
                                        qui officia deserunt mollit anim id est laborum.
                                    </div>
                                    <div className={classes.requestData_message_time}>17:27</div>
                                </div>
                            </div>

                            <div className={`${classes.requestData_message_full} ${classes.myMes}`}>
                                <div className={classes.requestData_message}>
                                    <div className={classes.requestData_message_name}>Алина </div>
                                    <div className={classes.requestData_message_post}>Менеджер авиакомпании “Азимут”</div>
                                    <div className={classes.requestData_message_text}>
                                    Все правки внесены.
                                    </div>
                                    <div className={classes.requestData_message_time}>17:27</div>
                                </div>
                            </div>

                            <div ref={messagesEndRef} />
                        </div>

                        <div className={classes.sendBlock}>
                            <input type="text" />
                            <Button>Отправить</Button>
                        </div>
                    </div>
                )}
                {activeTab === 'История' && (
                    <div className={classes.requestData}>
                        История
                    </div>
                )}
            </div>

            <div className={classes.requestButon}>
                <Button >Разместить<img src="/user-check.png" alt="" /></Button>
            </div>
        </Sidebar>
    );
}

export default ExistRequest;