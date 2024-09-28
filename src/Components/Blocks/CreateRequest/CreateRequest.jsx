import React, { useState, useRef, useEffect } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import classes from './CreateRequest.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { CREATE_REQUEST_MUTATION, decodeJWT, GET_AIRLINES_RELAY, GET_AIRPORTS_RELAY, getCookie } from "../../../../graphQL_requests";

function CreateRequest({ show, onClose }) {
    const token = getCookie('token');

    const [userID, setUserID] = useState();

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
        fullName: '',
        position: '',
        gender: '',
        airportId: '',
        arrivalRoute: '',
        arrivalDate: '',
        arrivalTime: '',
        departureRoute: '',
        departureDate: '',
        departureTime: '',
        roomCategory: '',
        phoneNumber: '',
        senderId: '',
        airlineId: '',
        mealPlan: {
            included: true,
            breakfast: false,
            lunch: false,
            dinner: false,
        },
        city: ''
    });

    useEffect(() => {
        if (token && data) {
            setUserID(decodeJWT(token).userId);
            setFormData({
                ...formData,
                senderId: decodeJWT(token).userId,
            });
            // Устанавливаем данные авиакомпаний из запроса
            setAirlines(data.airlines);
        }
    }, [token, userID, data]);

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
            fullName: '',
            position: '',
            gender: '',
            airportId: '',
            arrivalRoute: '',
            arrivalDate: '',
            arrivalTime: '',
            departureRoute: '',
            departureDate: '',
            departureTime: '',
            roomCategory: '',
            phoneNumber: '',
            senderId: '',
            airlineId: '',
            mealPlan: {
                included: true,
                breakfast: false,
                lunch: false,
                dinner: false,
            },
            city: ''
        });
    };

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены");
        if (success) {
            resetForm();
            onClose();
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

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
        const selectedAirline = airlines.find(airline => airline.id === selectedId);
        setSelectedAirline(selectedAirline);
        setFormData({
            ...formData,
            airlineId: selectedId,
            fullName: '', // Сбрасываем имя сотрудника при смене авиакомпании
            position: '',
            gender: '',
            phoneNumber: ''
        });
    };

    const handleStaffChange = (e) => {
        const selectedStaffName = e.target.value;
        const selectedStaff = selectedAirline.staff.find(staff => staff.name === selectedStaffName);

        if (selectedStaff) {
            setFormData(prevFormData => ({
                ...prevFormData,
                fullName: selectedStaff.name,
                position: selectedStaff.position,
                gender: selectedStaff.gender,
                phoneNumber: selectedStaff.number
            }));
        }
    };

    const handleSubmit = async () => {
        const input = {
            fullName: formData.fullName,
            position: formData.position,
            gender: formData.gender,
            phoneNumber: formData.phoneNumber,
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
            roomCategory: formData.roomCategory,
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

    const uniqueCities = [...new Set(airports.map(airport => airport.city.trim()))].sort((a, b) => a.localeCompare(b));
    const filteredAirports = formData.city ? airports.filter(airport => airport.city.trim() === formData.city.trim()) : [];
    
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
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleStaffChange}
                                    disabled={!selectedAirline}
                                >
                                    <option value="" disabled>Выберите сотрудника</option>
                                    {selectedAirline.staff.map(personal => (
                                        <option key={personal.name} value={personal.name}>
                                            {personal.name} ({personal.position})
                                        </option>
                                    ))}
                                </select>

                                {false && <>
                                    <label>Должность</label>
                                    <input type="text" name="position" value={formData.position} readOnly />

                                    <label>Пол</label>
                                    <input type="text" name="gender" value={formData.gender} readOnly />

                                    <label>Номер телефона</label>
                                    <input type="text" name="phoneNumber" value={formData.phoneNumber} readOnly />
                                </>
                                }
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

                        <label>Номер</label>
                        <select name="roomCategory" value={formData.roomCategory} onChange={handleChange}>
                            <option value="" disabled>Выберите номер</option>
                            <option value="Одноместный">Одноместный</option>
                            <option value="Двухместный">Двухместный</option>
                        </select>

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
