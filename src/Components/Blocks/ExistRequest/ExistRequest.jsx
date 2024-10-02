import React, { useState, useRef, useEffect } from "react";
import classes from './ExistRequest.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useQuery } from "@apollo/client";
import { GET_REQUEST } from "../../../../graphQL_requests";

function ExistRequest({ show, onClose, setShowChooseHotel, chooseRequestID }) {
    const { loading, error, data } = useQuery(GET_REQUEST, {
        variables: { requestId: chooseRequestID },
    });

    const [activeTab, setActiveTab] = useState('Общая');
    const [formData, setFormData] = useState();

    const [formDataExtend, setFormDataExtend] = useState({
        departureDate: '',
        departureTime: ''
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (data && data.request) {
            setFormData(data?.request);
        }
    }, [data]);

    // console.log(formData)

    const resetForm = () => {
        setActiveTab('Общая');
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

    const handleChangeExtend = (e) => {
        const { name, value, type, checked } = e.target;
        setFormDataExtend(prevState => ({
            ...prevState,
            [name]: value
        }));
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

    function convertToDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString(); // возвращает дату в удобном для чтения формате
    }
    return (
        <>
            {formData &&
                <Sidebar show={show} sidebarRef={sidebarRef}>
                    <div className={classes.requestTitle}>
                        <div className={classes.requestTitle_name}>{formData.requestNumber}</div>
                        <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
                    </div>

                    <div className={classes.requestMiddle}>
                        <div className={classes.tabs}>
                            <div className={`${classes.tab} ${activeTab === 'Общая' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Общая')}>Общая</div>
                            <div className={`${classes.tab} ${activeTab === 'Доп. услуги' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Доп. услуги')}>Доп. услуги</div>
                            {/* 
                                <div className={`${classes.tab} ${activeTab === 'Комментарии' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Комментарии')}>Комментарии</div>
                                <div className={`${classes.tab} ${activeTab === 'История' ? classes.activeTab : ''}`} onClick={() => handleTabChange('История')}>История</div> 
                            */}
                        </div>

                        {activeTab === 'Общая' && (
                            <div className={classes.requestData}>
                                <div className={classes.requestDataTitle}>
                                    Информация о сотруднике
                                </div>
                                <div className={classes.requestDataInfo}>
                                    <div className={classes.requestDataInfo_title}>ФИО</div>
                                    <div className={classes.requestDataInfo_desc}>{formData.person.name}</div>
                                </div>
                                <div className={classes.requestDataInfo}>
                                    <div className={classes.requestDataInfo_title}>Должность</div>
                                    <div className={classes.requestDataInfo_desc}>{formData.person.position}</div>
                                </div>
                                <div className={classes.requestDataInfo}>
                                    <div className={classes.requestDataInfo_title}>Пол</div>
                                    <div className={classes.requestDataInfo_desc}>{formData.person.gender}</div>
                                </div>
                                <div className={classes.requestDataInfo}>
                                    <div className={classes.requestDataInfo_title}>Номер телефона</div>
                                    <div className={classes.requestDataInfo_desc}>{formData.person.number}</div>
                                </div>

                                {formData.status !== 'created' &&
                                    <>
                                        <div className={classes.requestDataTitle}>
                                            Информация о заявке
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Номер заявки</div>
                                            <div className={classes.requestDataInfo_desc}>{formData.requestNumber}</div>
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Гостиница</div>
                                            <div className={classes.requestDataInfo_desc}>{formData.hotel.name}</div>
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Номер комнаты</div>
                                            <div className={classes.requestDataInfo_desc}>{formData.hotelChess.room}</div>
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Заезд</div>
                                            <div className={classes.requestDataInfo_desc}>{convertToDate(formData.arrival.date)} - {formData.arrival.time}</div>
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Выезд</div>
                                            <div className={classes.requestDataInfo_desc}>{convertToDate(formData.departure.date)} - {formData.departure.time}</div>
                                        </div>
                                    </>
                                }
                            </div>
                        )}
                        {activeTab === 'Доп. услуги' && (
                            <div className={classes.requestData}>
                                <div className={classes.requestDataTitle}>
                                    Питание
                                </div>
                                <div className={classes.requestDataInfo}>
                                    <div className={classes.requestDataInfo_title}>Питание</div>
                                    <div className={classes.requestDataInfo_desc}>{formData.mealPlan.included ? 'Включено' : 'Не включено'}</div>
                                </div>
                                <div className={classes.requestDataInfo}>
                                    <div className={classes.requestDataInfo_title}>Завтрак</div>
                                    <div className={classes.requestDataInfo_desc}>{formData.mealPlan.breakfast ? 'Включено' : 'Не включено'}</div>
                                </div>
                                <div className={classes.requestDataInfo}>
                                    <div className={classes.requestDataInfo_title}>Обед</div>
                                    <div className={classes.requestDataInfo_desc}>{formData.mealPlan.lunch ? 'Включено' : 'Не включено'}</div>
                                </div>
                                <div className={classes.requestDataInfo}>
                                    <div className={classes.requestDataInfo_title}>Ужин</div>
                                    <div className={classes.requestDataInfo_desc}>{formData.mealPlan.dinner ? 'Включено' : 'Не включено'}</div>
                                </div>

                                {formData.status !== 'created' &&
                                    <>
                                        <div className={classes.requestDataTitle}>
                                            Продление
                                        </div>
                                        <div className={classes.reis_info}>
                                            <input type="date" name="departureDate" value={formDataExtend.departureDate} onChange={handleChangeExtend} placeholder="Дата" />
                                            <input type="time" name="departureTime" value={formDataExtend.departureTime} onChange={handleChangeExtend} placeholder="Время" />
                                        </div>
                                        <Button>Продлить</Button>
                                    </>
                                }
                            </div>
                        )}

                        {/* 
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
                                <div className={classes.logs}>
                                    <div className={classes.historyDate}>
                                        24 апреля 2024
                                    </div>

                                    <div className={classes.historyLog}>
                                        15:24 <span>Марина</span> Изменил(а) время прибытия с <span>17.05.2024, 13:00</span> на <span>18.05.2024, 13:00</span>
                                    </div>
                                    <div className={classes.historyLog}>
                                        15:24 <span>Марина</span> Изменил(а) время прибытия с <span>18.05.2024, 13:00</span> на <span>19.05.2024, 13:00</span>
                                    </div>

                                    <div className={classes.historyDate}>
                                        Сегодня
                                    </div>
                                    <div className={classes.historyLog}>
                                        15:24 <span>Марина</span> Изменил(а) время прибытия с <span>17.05.2024, 13:00</span> на <span>18.05.2024, 13:00</span>
                                    </div>
                                </div>
                            </div>
                        )}
                         */}
                    </div>

                    <div className={classes.requestButon}>
                        <Button onClick={() => {
                            onClose();
                            setShowChooseHotel(true)
                        }}>Разместить<img src="/user-check.png" alt="" /></Button>
                    </div>
                </Sidebar>
            }
        </>
    );
}

export default ExistRequest;