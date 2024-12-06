import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import classes from './CreateRequest.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { CREATE_REQUEST_MUTATION, decodeJWT, GET_AIRLINES_RELAY, GET_AIRPORTS_RELAY, GET_USER_BRONS, getCookie } from "../../../../graphQL_requests";
import DropDownList from "../DropDownList/DropDownList";
import Swal from "sweetalert2";

// Компонент для создания новой заявки
function CreateRequest({ show, onClose, user }) {
    const token = getCookie('token');
    const [userID, setUserID] = useState();
    const [isEdited, setIsEdited] = useState(false);  // Флаг, указывающий, были ли изменения в форме
    const [airlines, setAirlines] = useState([]);  // Список авиакомпаний
    const [selectedAirline, setSelectedAirline] = useState(null);  // Выбранная авиакомпания
    const sidebarRef = useRef();

    // Запрос данных авиакомпаний и аэропортов
    const { data } = useQuery(GET_AIRLINES_RELAY);
    const infoAirports = useQuery(GET_AIRPORTS_RELAY);
    const [airports, setAirports] = useState([]);  // Список аэропортов

    // Состояние активной вкладки и данных формы
    const [activeTab, setActiveTab] = useState('Общая');
    const [formData, setFormData] = useState({
        personId: '',
        airportId: '',
        arrivalRoute: '',
        arrivalDate: '',
        arrivalTime: '',
        departureRoute: '',
        departureDate: '',
        departureTime: '',
        senderId: '',
        airlineId: '',
        mealPlan: {
            included: true,
            breakfast: true,
            lunch: true,
            dinner: true,
        },
        city: ''
    });

    const [warningMessage, setWarningMessage] = useState('');  // Предупреждение при пересечении бронирования
    const [hotelBronsInfo, setHotelBronsInfo] = useState([]);  // Информация о бронировании пользователя

    // Запрос данных о бронированиях пользователя
    const { data: bronData } = useQuery(GET_USER_BRONS, {
        variables: { airlineStaffId: formData.personId },
        skip: !formData.personId,
    });

    // Вычисляем уникальные города из списка аэропортов, используя memo
    const uniqueCities = useMemo(() => [...new Set(airports.map(airport => airport.city.trim()))].sort(), [airports]);

    // Обновление списка аэропортов при изменении данных
    useEffect(() => {
        if (infoAirports.data) {
            setAirports(infoAirports.data.airports || []);
        }
    }, [infoAirports.data]);

    // Обновление ID пользователя и других начальных данных при наличии токена и данных
    useEffect(() => {
        if (token && data) {
            const userId = decodeJWT(token).userId;
            setUserID(userId);
            setFormData(prevFormData => ({
                ...prevFormData,
                senderId: userId,
                airlineId: user?.airlineId || prevFormData.airlineId,
            }));
            setAirlines(data.airlines);

            if (user?.airlineId) {
                const selectedAirline = data.airlines.find(airline => airline.id === user.airlineId);
                setSelectedAirline(selectedAirline);
            }
        }
    }, [token, data, user]);

    // Обновление информации о бронировании при изменении ID сотрудника
    useEffect(() => {
        if (formData.personId && bronData) {
            setHotelBronsInfo(bronData.airlineStaff.hotelChess);
        }
    }, [bronData, formData.personId]);

    // Мутация для создания новой заявки
    const [createRequest] = useMutation(CREATE_REQUEST_MUTATION, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    // Сброс формы к начальному состоянию
    const resetForm = useCallback(() => {
        setActiveTab('Общая');
        setSelectedAirline(null);
        setFormData({
            personId: '',
            airportId: '',
            arrivalRoute: '',
            arrivalDate: '',
            arrivalTime: '',
            departureRoute: '',
            departureDate: '',
            departureTime: '',
            senderId: userID,
            airlineId: '',
            mealPlan: {
                included: true,
                breakfast: true,
                lunch: true,
                dinner: true,
            },
            city: ''
        });
        setIsEdited(false);  // Сбрасываем флаг, что форма не изменена
        setWarningMessage('');
    }, [userID]);

    // Закрытие формы с проверкой на несохраненные изменения
    const closeButton = useCallback(() => {
        if (!isEdited) {
            resetForm();
            onClose();
            return;
        }
    
        Swal.fire({
            title: 'Вы уверены?',
            text: 'Все несохраненные данные будут удалены.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Да',
            cancelButtonText: 'Нет',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                confirmButton: 'swal_confirm',
                cancelButton: 'swal_cancel',
            },
        }).then(result => {
            if (result.isConfirmed) {
                resetForm();
                onClose();
            }
        });
    }, [isEdited, resetForm, onClose]);
    

    // Обработчик изменений в полях формы
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
    
        // Обновляем флаг, что данные были изменены
        setIsEdited(true);
    
        setFormData(prevState => {
            if (type === 'checkbox') {
                return {
                    ...prevState,
                    mealPlan: {
                        ...prevState.mealPlan,
                        [name]: checked,
                    },
                };
            } else {
                return {
                    ...prevState,
                    [name]: value,
                    mealPlan: name === 'included' ? { ...prevState.mealPlan, included: value === 'true' } : prevState.mealPlan,
                };
            }
        });
    }, []);
    

    // Обработчик переключения вкладок
    const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

    const isFormValid = () => {
        return (
            formData.personId &&
            formData.airportId &&
            formData.arrivalRoute &&
            formData.arrivalDate &&
            formData.arrivalTime &&
            formData.departureRoute &&
            formData.departureDate &&
            formData.departureTime
        );
    };

    // Отправка формы на сервер
    const handleSubmit = async () => {
        if (!isFormValid()) {
            Swal.fire({
                title: 'Ошибка!',
                text: 'Пожалуйста, заполните все обязательные поля.',
                icon: 'error',
                confirmButtonText: 'Ок',
                customClass: {
                    confirmButton:'swal_confirm'
                }
            });
            return;
        }
    
        if (formData.departureDate === formData.arrivalDate && formData.departureTime <= formData.arrivalTime) {
            Swal.fire({
                title: 'Ошибка!',
                text: 'Время отъезда должно быть позже времени прибытия.',
                icon: 'error',
                confirmButtonText: 'Ок',
                customClass: {
                    confirmButton:'swal_confirm',
                    cancelButton:'swal_cancel'
                }
            });
            return;
        }
    
        const input = {
            personId: formData.personId,
            airportId: formData.airportId,
            arrival: { flight: formData.arrivalRoute, date: `${formData.arrivalDate}T${formData.arrivalTime}:00+00:00` },
            departure: { flight: formData.departureRoute, date: `${formData.departureDate}T${formData.departureTime}:00+00:00` },
            mealPlan: { included: formData.mealPlan.included },
            senderId: formData.senderId,
            airlineId: formData.airlineId,
        };
    
        try {
            await createRequest({ variables: { input } });
            resetForm();
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    // Проверка на пересечение бронирований
    const checkBookingOverlap = useCallback((arrivalDate, arrivalTime, departureDate, departureTime, bronList) => {
        const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}`);
        const departureDateTime = new Date(`${departureDate}T${departureTime}`);
        let existBronList

        return bronList.some(bron => {
            const bronStart = new Date(`${bron.start}T${bron.startTime}`);
            const bronEnd = new Date(`${bron.end}T${bron.endTime}`);
            if (arrivalDateTime < bronEnd && bronStart < departureDateTime) {
                existBronList = bron
            }
            return (arrivalDateTime < bronEnd && bronStart < departureDateTime);
        }), existBronList;
    }, []);

    const convertToDate_Date = (timestamp) => new Date(timestamp).toLocaleDateString();

    // Обновление предупреждения при изменении дат и времени
    useEffect(() => {
        if (formData.arrivalDate && formData.arrivalTime && formData.departureDate && formData.departureTime) {
            const overlap = checkBookingOverlap(
                formData.arrivalDate,
                formData.arrivalTime,
                formData.departureDate,
                formData.departureTime,
                hotelBronsInfo
            );
            setWarningMessage(overlap ? ` В это время сотрудник уже забронирован в отеле "${overlap.hotel.name}" с ${convertToDate_Date(overlap.start)} ${overlap.startTime} по ${convertToDate_Date(overlap.end)} ${overlap.endTime};` : '');
        }
    }, [formData.arrivalDate, formData.arrivalTime, formData.departureDate, formData.departureTime, hotelBronsInfo, checkBookingOverlap]);

    // Клик вне боковой панели закрывает её
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Проверяем, был ли клик внутри боковой панели или SweetAlert2
            if (
                document.querySelector('.swal2-container')?.contains(event.target) ||  // Клик в SweetAlert2
                sidebarRef.current?.contains(event.target) // Клик в боковой панели
            ) {
                return; // Если клик внутри, ничего не делаем
            }
    
            // Если клик был вне боковой панели, то закрываем её
            closeButton();
        };
    
        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    
        // Очистка эффекта при демонтировании компонента
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [show, closeButton]);
    

    const today = new Date().toISOString().split('T')[0];

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Создать заявку</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.tabs}>
                <div className={`${classes.tab} ${activeTab === 'Общая' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Общая')}>Общая</div>
                <div className={`${classes.tab} ${activeTab === 'Доп. услуги' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Доп. услуги')}>Доп. услуги</div>
            </div>

            <div className={classes.requestMiddle}>

                {/* Вкладка "Общая" */}
                {activeTab === 'Общая' && (
                    <div className={classes.requestData}>
                        {warningMessage && <div className={classes.warningMessage}>{warningMessage}</div>}

                        <label>Авиакомпания</label>
                        <DropDownList
                            placeholder="Введите авиакомпанию"
                            options={airlines.map(airline => airline.name)}
                            initialValue={selectedAirline?.name || ""}
                            onSelect={(value) => {
                                const selectedAirline = airlines.find(airline => airline.name === value);
                                setSelectedAirline(selectedAirline);
                                setFormData(prevFormData => ({
                                    ...prevFormData,
                                    airlineId: selectedAirline?.id || ""
                                }));
                                setIsEdited(true);
                            }}
                        />

                        {selectedAirline && (
                            <>
                                <label>Сотрудник авиакомпании</label>
                                <DropDownList
                                    placeholder="Введите сотрудника"
                                    options={selectedAirline.staff.map(person => person.name)}
                                    initialValue={selectedAirline.staff.find(person => person.id === formData.personId)?.name || ""}
                                    onSelect={(value) => {
                                        const selectedPerson = selectedAirline.staff.find(person => person.name === value);
                                        setFormData(prevFormData => ({
                                            ...prevFormData,
                                            personId: selectedPerson?.id || ""
                                        }));
                                        setIsEdited(true);
                                    }}
                                />
                            </>
                        )}

                        <label>Город</label>
                        <DropDownList
                            placeholder="Введите город"
                            options={uniqueCities}
                            initialValue={formData.city}
                            onSelect={(value) => {
                                setFormData(prevFormData => ({
                                    ...prevFormData,
                                    city: value,
                                    airportId: ""
                                }));
                                setIsEdited(true);
                            }}
                        />

                        {formData.city && (
                            <>
                                <label>Аэропорт</label>
                                <DropDownList
                                    placeholder="Введите аэропорт"
                                    options={airports.filter(airport => airport.city.trim() === formData.city.trim()).map(airport => airport.name)}
                                    initialValue={airports.find(airport => airport.id === formData.airportId)?.name || ""}
                                    onSelect={(value) => {
                                        const selectedAirport = airports.find(airport => airport.name === value);
                                        setFormData(prevFormData => ({
                                            ...prevFormData,
                                            airportId: selectedAirport?.id || ""
                                        }));
                                        setIsEdited(true);
                                    }}
                                />
                            </>
                        )}

                        <label>Прибытие</label>
                        <input type="text" name="arrivalRoute" placeholder="Рейс" value={formData.arrivalRoute} onChange={handleChange} />
                        <div className={classes.reis_info}>
                            <input type="date" name="arrivalDate" value={formData.arrivalDate} min={today} onChange={handleChange} placeholder="Дата" />
                            <input type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} placeholder="Время" />
                        </div>

                        <label>Отъезд</label>
                        <input type="text" name="departureRoute" placeholder="Рейс" value={formData.departureRoute} onChange={handleChange} />
                        <div className={classes.reis_info}>
                            <input type="date" name="departureDate" value={formData.departureDate} min={formData.arrivalDate} onChange={handleChange} placeholder="Дата" />
                            <input type="time" name="departureTime" value={formData.departureTime} onChange={handleChange} placeholder="Время" />
                        </div>
                    </div>
                )}

                {/* Вкладка "Доп. услуги" */}
                {activeTab === 'Доп. услуги' && (
                    <div className={classes.requestData}>
                        <label>Питание</label>
                        <select name="included" value={formData.mealPlan.included} onChange={handleChange}>
                            <option value={true}>Включено</option>
                            <option value={false}>Не включено</option>
                        </select>

                        <div className={classes.checks} style={{ display: formData.mealPlan.included ? 'flex' : 'none' }}>
                            <label>
                                <input type="checkbox" name="breakfast" checked={formData.mealPlan.breakfast} onChange={handleChange} />
                                Завтрак
                            </label>
                            <label>
                                <input type="checkbox" name="lunch" checked={formData.mealPlan.lunch} onChange={handleChange} />
                                Обед
                            </label>
                            <label>
                                <input type="checkbox" name="dinner" checked={formData.mealPlan.dinner} onChange={handleChange} />
                                Ужин
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className={classes.requestButton}>
                <Button onClick={handleSubmit}>Создать заявку</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequest;
