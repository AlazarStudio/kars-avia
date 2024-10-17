import React, { useState, useRef, useEffect } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import classes from './CreateRequest.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { CREATE_REQUEST_MUTATION, decodeJWT, GET_AIRLINES_RELAY, GET_AIRPORTS_RELAY, GET_USER_BRONS, getCookie } from "../../../../graphQL_requests";
import { useNavigate } from "react-router-dom";

function CreateRequest({ show, onClose, user }) {
    const token = getCookie('token');

    const [userID, setUserID] = useState();

    const [isEdited, setIsEdited] = useState(false);

    const [airlines, setAirlines] = useState([]);
    const [selectedAirline, setSelectedAirline] = useState(null);

    const { loading, error, data } = useQuery(GET_AIRLINES_RELAY);

    let infoAirports = useQuery(GET_AIRPORTS_RELAY);

    const [airports, setAirports] = useState([]);

    useEffect(() => {
        if (infoAirports.data) {
            setAirports(infoAirports.data?.airports || []);
        }
    }, [infoAirports]);

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

    useEffect(() => {
        if (token && data) {
            setUserID(decodeJWT(token).userId);
            setFormData(prevFormData => ({
                ...prevFormData,
                senderId: decodeJWT(token).userId,
                airlineId: user?.airlineId || prevFormData.airlineId, // Если есть user.airlineId, задаем его
            }));

            setAirlines(data.airlines);

            if (user?.airlineId) {
                const selectedAirline = data.airlines.find(airline => airline.id === user.airlineId);
                setSelectedAirline(selectedAirline);
            }
        }
    }, [token, userID, data, user]);


    const [warningMessage, setWarningMessage] = useState('');

    const [hotelBronsInfo, setHotelBronsInfo] = useState([]);

    const { loading: bronLoading, error: bronError, data: bronData } = useQuery(GET_USER_BRONS, {
        variables: { airlineStaffId: formData.personId },
        skip: !formData.personId, // Пропускаем запрос, если personId нет
    });

    useEffect(() => {
        if (formData.personId && bronData) {
            setHotelBronsInfo(bronData.airlineStaff.hotelChess);
        }
    }, [bronData, formData.personId]);

    const [createRequest] = useMutation(CREATE_REQUEST_MUTATION, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setActiveTab('Общая');
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
                breakfast: false,
                lunch: false,
                dinner: false,
            },
            city: ''
        });
        setIsEdited(false)
        setWarningMessage('')
    };

    const closeButton = () => {
        if (!isEdited) {
            resetForm();
            onClose();
        } else {
            let success = confirm("Вы уверены, все несохраненные данные будут удалены");
            if (success) {
                resetForm();
                onClose();
            }
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setIsEdited(true)

        if (type === 'checkbox') {
            setFormData(prevState => ({
                ...prevState,
                mealPlan: {
                    ...prevState.mealPlan,
                    [name]: checked
                }
            }));
        } else if (name === 'included') {
            setFormData(prevState => ({
                ...prevState,
                mealPlan: {
                    ...prevState.mealPlan,
                    included: value === 'true'
                }
            }));
        } else if (name === 'airlineId') {
            setFormData(prevState => ({
                ...prevState,
                [name]: value,
                personId: ''
            }));
        } else if (name === 'city') {
            setFormData(prevState => ({
                ...prevState,
                [name]: value,
                airportId: ''
            }));
        } else {
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }

        if (formData.mealPlan.included === false) {
            formData.mealPlan.breakfast = false;
            formData.mealPlan.lunch = false;
            formData.mealPlan.dinner = false;
        }
    };

    const handleAirlineChange = (e) => {
        const selectedId = e.target.value;

        setIsEdited(true)

        const selectedAirline = airlines.find(airline => airline.id === selectedId);
        setSelectedAirline(selectedAirline);
        setFormData({
            ...formData,
            airlineId: selectedId,
            personId: '', // Сбрасываем имя сотрудника при смене авиакомпании
        });
    };

    const handleStaffChange = (e) => {
        const selectedStaffId = e.target.value;

        setIsEdited(true)

        setFormData(prevFormData => ({
            ...prevFormData,
            personId: selectedStaffId
        }));
    };

    const handleSubmit = async () => {
        const input = {
            personId: formData.personId,
            airportId: formData.airportId,
            arrival: {
                flight: formData.arrivalRoute,
                date: formData.arrivalDate,
                time: formData.arrivalTime,
            },
            departure: {
                flight: formData.departureRoute,
                date: formData.departureDate,
                time: formData.departureTime,
            },
            mealPlan: {
                included: formData.mealPlan.included,
                breakfast: formData.mealPlan.breakfast,
                lunch: formData.mealPlan.lunch,
                dinner: formData.mealPlan.dinner,
            },
            senderId: formData.senderId,
            airlineId: formData.airlineId,
        };

        try {
            await createRequest({ variables: { input } });
        } catch (e) {
            console.error(e);
        }
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
    }, [show, onClose, isEdited]);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const uniqueCities = [...new Set(airports.map(airport => airport.city.trim()))].sort((a, b) => a.localeCompare(b));
    const filteredAirports = formData.city ? airports.filter(airport => airport.city.trim() === formData.city.trim()) : [];

    function isOverlap(start1, end1, start2, end2) {
        return (start1 < end2) && (start2 < end1);
    }

    function checkBookingOverlap(arrivalDate, arrivalTime, departureDate, departureTime, bronList) {
        const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}`);
        const departureDateTime = new Date(`${departureDate}T${departureTime}`);

        for (let bron of bronList) {
            const bronStartDateTime = new Date(`${bron.start}T${bron.startTime}`);
            const bronEndDateTime = new Date(`${bron.end}T${bron.endTime}`);

            if (isOverlap(arrivalDateTime, departureDateTime, bronStartDateTime, bronEndDateTime)) {
                return `В это время пользователь уже забронирован в отеле "${bron.hotel.name}" с ${convertToDate(bron.start)} ${bron.startTime} по ${convertToDate(bron.end)} ${bron.endTime}`;
            }
        }

        return null; // Нет пересечений
    }

    function checkUserBrons() {
        const overlapMessage = checkBookingOverlap(
            formData.arrivalDate,
            formData.arrivalTime,
            formData.departureDate,
            formData.departureTime,
            hotelBronsInfo
        );

        if (overlapMessage) {
            setWarningMessage(overlapMessage);
        } else {
            setWarningMessage('');
        }
    }

    function convertToDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString(); // возвращает дату в удобном для чтения формате
    }

    useEffect(() => {
        if (formData.arrivalDate && formData.arrivalTime && formData.departureDate && formData.departureTime) {
            checkUserBrons();
        }
    }, [formData.arrivalDate, formData.arrivalTime, formData.departureDate, formData.departureTime, hotelBronsInfo]);

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
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
                        {warningMessage && (
                            <div className={classes.warningMessage}>
                                <strong>Внимание:</strong> {warningMessage}
                            </div>
                        )}

                        <label>Авиакомпания</label>
                        <select name="airlineId" value={formData.airlineId} onChange={handleAirlineChange}>
                            <option value="" disabled>Выберите авиакомпанию</option>
                            {airlines.map(airline => (
                                <option key={airline.id} value={airline.id}>
                                    {airline.name}
                                </option>
                            ))}
                        </select>

                        {selectedAirline && (
                            <>
                                <label>Сотрудник авиакомпании</label>
                                <select
                                    name="personId"
                                    value={formData.personId}
                                    onChange={handleStaffChange}
                                    disabled={!selectedAirline}
                                >
                                    <option value="" disabled>Выберите сотрудника</option>
                                    {selectedAirline.staff.map(personal => (
                                        <option key={personal.id} value={personal.id}>
                                            {personal.name} ({personal.position})
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}

                        <label>Город</label>
                        <select name="city" value={formData.city} onChange={handleChange}>
                            <option value="" disabled>Выберите город</option>
                            {uniqueCities.map(city => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>

                        {formData.city && (
                            <>
                                <label>Аэропорт</label>
                                <select name="airportId" value={formData.airportId} onChange={handleChange} disabled={!formData.city}>
                                    <option value="" disabled>Выберите аэропорт</option>
                                    {filteredAirports.map(airport => (
                                        <option key={airport.id} value={airport.id}>
                                            {airport.name}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}

                        <label>Прибытие</label>
                        <input type="text" name="arrivalRoute" placeholder="Рейс" value={formData.arrivalRoute} onChange={handleChange} />
                        <div className={classes.reis_info}>
                            <input type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} placeholder="Дата" />
                            <input type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} placeholder="Время" />
                        </div>

                        <label>Отъезд</label>
                        <input type="text" name="departureRoute" placeholder="Рейс" value={formData.departureRoute} onChange={handleChange} />
                        <div className={classes.reis_info}>
                            <input type="date" name="departureDate" value={formData.departureDate} onChange={handleChange} placeholder="Дата" />
                            <input type="time" name="departureTime" value={formData.departureTime} onChange={handleChange} placeholder="Время" />
                        </div>

                    </div>
                )}

                {activeTab === 'Доп. услуги' && (
                    <div className={classes.requestData}>
                        <label>Питание</label>
                        <select name="included" value={formData.mealPlan.included} onChange={handleChange}>
                            <option value={true}>Включено</option>
                            <option value={false}>Не включено</option>
                        </select>

                        <div className={classes.checks} style={{ 'display': `${formData.mealPlan.included === true ? 'flex' : 'none'}` }}>
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

            <div className={classes.requestButon}>
                <Button onClick={handleSubmit}>Создать заявку</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequest;
