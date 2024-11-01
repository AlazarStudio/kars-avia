import React, { useState, useRef, useEffect } from "react";
import classes from './ExistRequest.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import { GET_LOGS, GET_MESSAGES_HOTEL, GET_REQUEST, getCookie, REQUEST_MESSAGES_SUBSCRIPTION, UPDATE_MESSAGE_BRON } from "../../../../graphQL_requests";
import Smiles from "../Smiles/Smiles";
import Message from "../Message/Message";

function ExistRequest({ show, onClose, setShowChooseHotel, chooseRequestID, user, setChooseRequestID }) {
    const token = getCookie('token');

    const { loading, error, data } = useQuery(GET_REQUEST, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
        variables: { requestId: chooseRequestID },
    });


    const { loading: loadingLogs, error: errorLogs, data: dataLogs } = useQuery(GET_LOGS, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
        variables: { requestId: chooseRequestID },
    });



    const [activeTab, setActiveTab] = useState('Общая');
    const [formData, setFormData] = useState();
    const [logsData, setLogsData] = useState();

    const [formDataExtend, setFormDataExtend] = useState({
        departureDate: '',
        departureTime: ''
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (data && data.request) {
            setFormData(data?.request);
        }
        if (dataLogs && dataLogs.request) {
            setLogsData(dataLogs?.request);
        }
    }, [data, dataLogs]);

    const resetForm = () => {
        setActiveTab('Общая');
    };

    const closeButton = () => {
        // let success = confirm("Вы уверены, все несохраненные данные будут удалены");
        // if (success) {
        resetForm();
        onClose();
        setChooseRequestID('')
        // }
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

    function getJsonParce(data) {
        return JSON.parse(data);
    }

    function convertToDate(timestamp) {
        const date = new Date(Number(timestamp));
        return date.toLocaleDateString();
    }

    function convertToTime(timestamp) {
        const date = new Date(Number(timestamp));
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    function formatDate(dateString) {
        const [year, month, day] = dateString.split('-'); // Разбиваем строку на год, месяц и день
        return `${day}.${month}.${year}`; // Переставляем части
    }

    function calculateMeals(formData) {
        const mealsPerDay = {
            breakfast: { start: 7, end: 10 }, // Завтрак с 7 до 10 утра
            lunch: { start: 12, end: 15 },    // Обед с 12 до 15 дня
            dinner: { start: 18, end: 21 }    // Ужин с 18 до 21 вечера
        };

        let breakfasts = 0;
        let lunches = 0;
        let dinners = 0;

        let startDateTime = new Date(`${formData.arrival.date}T${formData.arrival.time}`);
        let endDateTime = new Date(`${formData.departure.date}T${formData.departure.time}`);

        // Считаем количество приёмов пищи в день заезда
        const arrivalHours = startDateTime.getHours();
        if (arrivalHours <= mealsPerDay.breakfast.end) breakfasts++;
        if (arrivalHours <= mealsPerDay.lunch.end) lunches++;
        if (arrivalHours <= mealsPerDay.dinner.end) dinners++;

        // Считаем количество приёмов пищи в день отъезда
        const departureHours = endDateTime.getHours();
        if (departureHours >= mealsPerDay.breakfast.start) breakfasts++;
        if (departureHours >= mealsPerDay.lunch.start) lunches++;
        if (departureHours >= mealsPerDay.dinner.start) dinners++;

        // Определяем количество полных дней между датами
        let currentDateTime = new Date(startDateTime);
        currentDateTime.setHours(0, 0, 0, 0); // Устанавливаем время на начало дня следующего дня после заезда
        currentDateTime.setDate(currentDateTime.getDate() + 1); // Переход на следующий день после дня заезда

        const fullDaysCount = (endDateTime - currentDateTime) / (1000 * 60 * 60 * 24);

        // Считаем полные дни между датами
        if (fullDaysCount >= 1) {
            breakfasts += Math.floor(fullDaysCount);
            lunches += Math.floor(fullDaysCount);
            dinners += Math.floor(fullDaysCount);
        }

        return { breakfasts, lunches, dinners };
    }

    return (
        <>
            {formData &&
                <Sidebar show={show} sidebarRef={sidebarRef}>
                    <div className={classes.requestTitle}>
                        <div className={classes.requestTitle_name}>{formData.requestNumber}</div>
                        <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
                    </div>

                    <div className={classes.requestMiddle} style={{ height: formData.status == 'done' && 'calc(100vh - 90px)' }}>
                        <div className={classes.tabs}>
                            <div className={`${classes.tab} ${activeTab === 'Общая' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Общая')}>Общая</div>

                            {formData.status !== 'created' && formData.status !== 'opened' &&
                                <div className={`${classes.tab} ${activeTab === 'Доп. услуги' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Доп. услуги')}>Доп. услуги</div>
                            }
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

                                <div className={classes.requestDataTitle}>
                                    Питание
                                </div>
                                <div className={classes.requestDataInfo}>
                                    <div className={classes.requestDataInfo_title}>Питание</div>
                                    <div className={classes.requestDataInfo_desc}>{formData.mealPlan.included ? 'Включено' : 'Не включено'}</div>
                                </div>

                                {formData.mealPlan.included && formData.status !== 'created' && formData.status !== 'opened' &&
                                    <>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Завтрак</div>
                                            <div className={classes.requestDataInfo_desc}>{calculateMeals(formData).breakfasts}</div>
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Обед</div>
                                            <div className={classes.requestDataInfo_desc}>{calculateMeals(formData).lunches}</div>
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Ужин</div>
                                            <div className={classes.requestDataInfo_desc}>{calculateMeals(formData).dinners}</div>
                                        </div>
                                    </>
                                }

                                {formData.status !== 'created' && formData.status !== 'opened' &&
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
                                            <div className={classes.requestDataInfo_desc}>{formData.hotel?.name}</div>
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Номер комнаты</div>
                                            <div className={classes.requestDataInfo_desc}>{formData.hotelChess?.room}</div>
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
                                {formData.status !== 'created' && formData.status !== 'opened' &&
                                    <>
                                        <div className={classes.requestDataTitle}>
                                            Добавить питание
                                        </div>

                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Завтрак</div>
                                            <input type="number" name="departureDate" placeholder="Количество" />
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Обед</div>
                                            <input type="number" name="departureDate" placeholder="Количество" />
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Ужин</div>
                                            <input type="number" name="departureDate" placeholder="Количество" />
                                        </div>



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


                        {activeTab === 'Комментарии' && (
                            <Message activeTab={activeTab} chooseRequestID={chooseRequestID} chooseReserveID={''} formData={formData} token={token} user={user} />
                        )}

                        {activeTab === 'История' && (
                            <div className={classes.requestData}>
                                <div className={classes.logs}>
                                    {[...logsData.logs].reverse().map((log, index) => (
                                        <>
                                            <div className={classes.historyDate}>
                                                {convertToDate(log.createdAt)} {convertToTime(log.createdAt)}
                                            </div>
                                            <div className={classes.historyLog}
                                                dangerouslySetInnerHTML={{
                                                    __html:
                                                        log.action === 'create_request'
                                                            ?
                                                            `
                                                                Пользователь <span>${log.user.name}</span> 
                                                                создал заявку <br /><span>№${getJsonParce(log.newData).requestNumber} </span>
                                                                для <span>${logsData.person.position} ${logsData.person.name}</span>
                                                                в аэропорт <span>${logsData.airport.name}</span>
                                                            `
                                                            :
                                                            log.action === 'updateHotelChess'
                                                                ?
                                                                `
                                                                Пользователь <span>${log.user.name}</span> 
                                                                создал бронь в отель <span>${logsData.hotel.name}</span>
                                                                для <span>${logsData.person.position} ${logsData.person.name}</span> 
                                                                в номер <span>${getJsonParce(log.newData).room}</span> 
                                                                место <span>${getJsonParce(log.newData).place}</span>
                                                                c <span>${formatDate(getJsonParce(log.newData).start)}</span> 
                                                                по <span>${formatDate(getJsonParce(log.newData).end)}</span>
                                                                `
                                                                :
                                                                log.action === 'open_request'
                                                                    ?
                                                                    `
                                                                        Пользователь <span>${log.user.name}</span> 
                                                                        первый открыл заявку <br /> <span>№${getJsonParce(log.description).requestNumber}</span>
                                                                    `
                                                                    :
                                                                    'неизвестный action'
                                                }}></div >
                                        </>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                    {(formData.status !== 'done' && (user.role == 'SUPERADMIN' || user.role == 'DISPATCHERADMIN')) &&
                        <div className={classes.requestButon}>
                            <Button onClick={() => {
                                onClose();
                                setShowChooseHotel(true)
                            }}>Разместить<img src="/user-check.png" alt="" /></Button>
                        </div>
                    }
                </Sidebar >
            }
        </>
    );
}

export default ExistRequest;