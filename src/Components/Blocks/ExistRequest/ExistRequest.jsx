import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import classes from './ExistRequest.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery } from "@apollo/client";
import { GET_LOGS, GET_REQUEST, getCookie, SAVE_HANDLE_EXTEND_MUTATION, SAVE_MEALS_MUTATION } from "../../../../graphQL_requests";
import Message from "../Message/Message";

function ExistRequest({ show, onClose, setShowChooseHotel, chooseRequestID, user, setChooseRequestID }) {
    const token = getCookie('token');

    // Запросы данных о заявке и логе
    const { data } = useQuery(GET_REQUEST, {
        context: { headers: { Authorization: `Bearer ${token}`, 'Apollo-Require-Preflight': 'true' } },
        variables: { requestId: chooseRequestID },
    });
    const { data: dataLogs } = useQuery(GET_LOGS, {
        context: { headers: { Authorization: `Bearer ${token}`, 'Apollo-Require-Preflight': 'true' } },
        variables: { requestId: chooseRequestID },
    });

    const [activeTab, setActiveTab] = useState('Общая');
    const [formData, setFormData] = useState(null);
    const [logsData, setLogsData] = useState(null);
    const [formDataExtend, setFormDataExtend] = useState({ departureDate: '', departureTime: '' });
    const sidebarRef = useRef();

    // Обновление состояния при изменении данных запроса
    useEffect(() => {
        if (data && data.request) setFormData(data.request);
        if (dataLogs && dataLogs.request) setLogsData(dataLogs.request);
    }, [data, dataLogs]);

    // Функция закрытия формы
    const closeButton = useCallback(() => {
        resetForm();
        onClose();
        setChooseRequestID('');
    }, [onClose, setChooseRequestID]);

    const resetForm = useCallback(() => setActiveTab('Общая'), []);

    // Обработчик для изменения вкладок
    const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

    // Обработчик изменений в форме
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            meals: name === 'included' ? { ...prevState.meals, included: value } : prevState.meals,
            [name]: type === 'checkbox' ? checked : value,
        }));

        if (formData?.meals.included === 'Не включено') {
            setFormData(prevState => ({
                ...prevState,
                meals: { breakfast: false, lunch: false, dinner: false },
            }));
        }
    }, [formData]);

    // Обработчик для продления бронирования
    const handleExtendChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormDataExtend(prevState => ({ ...prevState, [name]: value }));
    }, []);

    const [handleExtend] = useMutation(SAVE_HANDLE_EXTEND_MUTATION, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const handleExtendChangeRequest = async () => {
        try {
            await handleExtend({
                variables: {
                    input: {
                        requestId: chooseRequestID,
                        newEnd: formDataExtend.departureDate,
                        newEndTime: formDataExtend.departureTime
                    }
                }
            });
            alert('Изменения сохранены');
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
            alert('Ошибка при сохранении');
        }
    };

    // Клик вне боковой панели закрывает её
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                closeButton();
            }
        };

        if (show) document.addEventListener('mousedown', handleClickOutside);
        else document.removeEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [show, closeButton]);

    // Вспомогательные функции для преобразования данных
    const getJsonParce = (data) => JSON.parse(data);
    const convertToDate_Date = (timestamp) => new Date(timestamp).toLocaleDateString();
    const convertToDate = (timestamp) => new Date(Number(timestamp)).toLocaleDateString();
    const convertToTime = (timestamp) => new Date(Number(timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (dateString) => dateString.split('-').reverse().join('.');

    // Расчёт количества приёмов пищи
    const calculateMeals = useCallback((formData) => {
        const mealsPerDay = {
            breakfast: { start: 7, end: 10 },
            lunch: { start: 12, end: 15 },
            dinner: { start: 18, end: 21 },
        };

        let breakfasts = 0, lunches = 0, dinners = 0;
        const startDateTime = new Date(`${formData.arrival.date}T${formData.arrival.time}`);
        const endDateTime = new Date(`${formData.departure.date}T${formData.departure.time}`);
        const arrivalHours = startDateTime.getHours();

        if (arrivalHours <= mealsPerDay.breakfast.end) breakfasts++;
        if (arrivalHours <= mealsPerDay.lunch.end) lunches++;
        if (arrivalHours <= mealsPerDay.dinner.end) dinners++;

        const departureHours = endDateTime.getHours();
        if (departureHours >= mealsPerDay.breakfast.start) breakfasts++;
        if (departureHours >= mealsPerDay.lunch.start) lunches++;
        if (departureHours >= mealsPerDay.dinner.start) dinners++;

        const fullDaysCount = Math.floor((endDateTime - startDateTime) / (1000 * 60 * 60 * 24));
        if (fullDaysCount >= 1) {
            breakfasts += fullDaysCount;
            lunches += fullDaysCount;
            dinners += fullDaysCount;
        }

        return { breakfasts, lunches, dinners };
    }, []);

    // Функция для генерации HTML-описания для логов
    function getLogDescription(log, logsData) {
        switch (log.action) {
            case 'create_request':
                return `
                Пользователь <span>${log.user.name}</span> 
                создал заявку <br /><span>№${getJsonParce(log.newData).requestNumber} </span>
                для <span>${logsData.person.position} ${logsData.person.name}</span>
                в аэропорт <span>${logsData.airport.name}</span>
            `;
            case 'updateHotelChess':
                return `
                Пользователь <span>${log.user.name}</span> 
                создал бронь в отель <span>${logsData.hotel.name}</span>
                для <span>${logsData.person.position} ${logsData.person.name}</span> 
                в номер <span>${getJsonParce(log.newData).room}</span> 
                место <span>${getJsonParce(log.newData).place}</span>
                c <span>${formatDate(getJsonParce(log.newData).start)}</span> 
                по <span>${formatDate(getJsonParce(log.newData).end)}</span>
            `;
            case 'open_request':
                return `
                Пользователь <span>${log.user.name}</span> 
                первый открыл заявку <br /> <span>№${getJsonParce(log.description).requestNumber}</span>
            `;
            default:
                return 'Неизвестное действие';
        }
    }
    // Инициализируем mealData с пустым массивом
    const [mealData, setMealData] = useState([]);

    // Обновляем mealData, когда formData меняется и данные mealPlan доступны
    useEffect(() => {
        if (formData?.mealPlan?.dailyMeals) {
            setMealData(formData.mealPlan.dailyMeals);
        }
    }, [formData]);

    // Изменение в питании
    const handleMealChange = (index, mealType, value) => {
        setMealData(prevMeals => {
            const updatedMeals = [...prevMeals];
            updatedMeals[index] = {
                ...updatedMeals[index],
                [mealType]: Number(value)
            };
            return updatedMeals;
        });
    };

    // Сохранение изменений в питании
    const [saveMeals] = useMutation(SAVE_MEALS_MUTATION, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const cleanedMealData = mealData.map(({ __typename, ...rest }) => rest);

    const handleSaveMeals = async () => {
        console.log(cleanedMealData, chooseRequestID)
        try {
            await saveMeals({
                variables: {
                    input: {
                        requestId: chooseRequestID,
                        dailyMeals: cleanedMealData
                    }
                }
            });
            alert('Изменения сохранены');
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
            alert('Ошибка при сохранении');
        }
    };

    return (
        <>
            {formData &&
                <Sidebar show={show} sidebarRef={sidebarRef}>
                    <div className={classes.requestTitle}>
                        <div className={classes.requestTitle_name}>{formData.requestNumber}</div>
                        <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
                    </div>
                    <div className={classes.tabs}>
                        <div className={`${classes.tab} ${activeTab === 'Общая' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Общая')}>Общая</div>
                        {formData.status !== 'created' && formData.status !== 'opened' &&
                            <div className={`${classes.tab} ${activeTab === 'Питание' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Питание')}>Питание</div>}
                        <div className={`${classes.tab} ${activeTab === 'Комментарии' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Комментарии')}>Комментарии</div>
                        <div className={`${classes.tab} ${activeTab === 'История' ? classes.activeTab : ''}`} onClick={() => handleTabChange('История')}>История</div>
                    </div>

                    <div className={classes.requestMiddle} style={{ height: (activeTab === 'Комментарии' || formData.status !== 'created') && 'calc(100vh - 79px - 67px)' }}>
                        {/* Вкладка "Общая" */}
                        {activeTab === 'Общая' && (
                            <div className={classes.requestData}>
                                {/* Информация о сотруднике */}
                                <div className={classes.requestDataTitle}>Информация о сотруднике</div>
                                <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>ФИО</div><div className={classes.requestDataInfo_desc}>{formData.person.name}</div></div>
                                <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Должность</div><div className={classes.requestDataInfo_desc}>{formData.person.position}</div></div>
                                <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Пол</div><div className={classes.requestDataInfo_desc}>{formData.person.gender}</div></div>
                                <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Номер телефона</div><div className={classes.requestDataInfo_desc}>{formData.person.number}</div></div>

                                {/* Информация о питании */}
                                <div className={classes.requestDataTitle}>Питание</div>
                                <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Питание</div><div className={classes.requestDataInfo_desc}>{formData.mealPlan.included ? 'Включено' : 'Не включено'}</div></div>

                                {formData.mealPlan.included && formData.status !== 'created' && formData.status !== 'opened' &&
                                    <>
                                        <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Завтрак</div><div className={classes.requestDataInfo_desc}>{formData.mealPlan.breakfast}</div></div>
                                        <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Обед</div><div className={classes.requestDataInfo_desc}>{formData.mealPlan.lunch}</div></div>
                                        <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Ужин</div><div className={classes.requestDataInfo_desc}>{formData.mealPlan.dinner}</div></div>
                                    </>
                                }

                                {/* Информация о заявке */}
                                {formData.status !== 'created' && formData.status !== 'opened' &&
                                    <>
                                        <div className={classes.requestDataTitle}>Информация о заявке</div>
                                        <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Номер заявки</div><div className={classes.requestDataInfo_desc}>{formData.requestNumber}</div></div>
                                        <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Гостиница</div><div className={classes.requestDataInfo_desc}>{formData.hotel?.name}</div></div>
                                        <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Номер комнаты</div><div className={classes.requestDataInfo_desc}>{formData.hotelChess?.room}</div></div>
                                        <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Заезд</div><div className={classes.requestDataInfo_desc}>{convertToDate_Date(formData.arrival.date)} - {formData.arrival.time}</div></div>
                                        <div className={classes.requestDataInfo}><div className={classes.requestDataInfo_title}>Выезд</div><div className={classes.requestDataInfo_desc}>{convertToDate_Date(formData.departure.date)} - {formData.departure.time}</div></div>
                                    </>
                                }

                                {/* Продление */}
                                {formData.status !== 'created' && formData.status !== 'opened' &&
                                    <>
                                        <div className={classes.requestDataTitle}>Продление</div>
                                        <div className={classes.reis_info}>
                                            <input type="date" name="departureDate" value={formDataExtend.departureDate} onChange={handleExtendChange} placeholder="Дата" />
                                            <input type="time" name="departureTime" value={formDataExtend.departureTime} onChange={handleExtendChange} placeholder="Время" />
                                        </div>
                                        <Button onClick={handleExtendChangeRequest}>Продлить</Button>
                                    </>
                                }
                            </div>
                        )}

                        {/* Вкладка "Питание" */}
                        {activeTab === 'Питание' && formData.status !== 'created' && formData.status !== 'opened' && (
                            <div className={classes.requestData}>
                                <div className={classes.requestDataTitle}>Питание сотрудника</div>

                                {mealData.map((dailyMeal, index) => (
                                    <div key={index} className={classes.mealInfo}>
                                        <div className={classes.mealInfoDate}>{convertToDate_Date(dailyMeal.date)}</div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Завтрак</div>
                                            <input
                                                type="number"
                                                min={0}
                                                name="breakfastCount"
                                                placeholder="Количество"
                                                value={dailyMeal.breakfast}
                                                onChange={(e) => handleMealChange(index, 'breakfast', e.target.value)}
                                            />
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Обед</div>
                                            <input
                                                type="number"
                                                min={0}
                                                name="lunchCount"
                                                placeholder="Количество"
                                                value={dailyMeal.lunch}
                                                onChange={(e) => handleMealChange(index, 'lunch', e.target.value)}
                                            />
                                        </div>
                                        <div className={classes.requestDataInfo}>
                                            <div className={classes.requestDataInfo_title}>Ужин</div>
                                            <input
                                                type="number"
                                                min={0}
                                                name="dinnerCount"
                                                placeholder="Количество"
                                                value={dailyMeal.dinner}
                                                onChange={(e) => handleMealChange(index, 'dinner', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button onClick={handleSaveMeals}>Сохранить</Button>
                            </div>
                        )}

                        {/* Вкладка "Комментарии" */}
                        {activeTab === 'Комментарии' && (
                            <Message activeTab={activeTab} chooseRequestID={chooseRequestID} chooseReserveID={''} formData={formData} token={token} user={user} me />
                        )}

                        {/* Вкладка "История" */}
                        {activeTab === 'История' && logsData && (
                            <div className={classes.requestData}>
                                <div className={classes.logs}>
                                    {[...logsData.logs].reverse().map((log, index) => (
                                        <>
                                            <div className={classes.historyDate} key={index}>
                                                {convertToDate(log.createdAt)} {convertToTime(log.createdAt)}
                                            </div>
                                            <div
                                                className={classes.historyLog}
                                                dangerouslySetInnerHTML={{
                                                    __html: getLogDescription(log, logsData)
                                                }}
                                            />
                                        </>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Кнопка для размещения заявки */}
                    {(formData.status !== 'done' && activeTab === 'Общая' && (user.role === 'SUPERADMIN' || user.role === 'DISPATCHERADMIN')) && (
                        <div className={classes.requestButton}>
                            <Button onClick={() => {
                                onClose();
                                setShowChooseHotel(true);
                            }}>Разместить<img src="/user-check.png" alt="" /></Button>
                        </div>
                    )}
                </Sidebar>
            }
        </>
    );
}

export default ExistRequest;
