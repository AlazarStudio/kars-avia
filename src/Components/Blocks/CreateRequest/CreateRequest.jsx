import React, { useState, useRef, useEffect } from "react";
import { gql, useMutation } from "@apollo/client";
import classes from './CreateRequest.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { getCookie } from "../../../../graphQL_requests";

const CREATE_REQUEST_MUTATION = gql`
    mutation CreateRequest($input: CreateRequestInput!) {
        createRequest(input: $input) {
            id
            fullName
            position
            gender
            phoneNumber
            airportId
            arrival {
                flight
                date
                time
            }
            departure {
                flight
                date
                time
            }
            roomCategory
            mealPlan {
                included
                breakfast
                lunch
                dinner
            }
            senderId
            receiverId
            createdAt
            updatedAt
            hotelId
            roomNumber
            airlineId
            status
        }
    }
`;

function CreateRequest({ show, onClose }) {
    const [activeTab, setActiveTab] = useState('Общая');
    const [formData, setFormData] = useState({
        fullName: '',
        position: '',
        gender: '',
        airportId: '66e2d407991c84395fe0e686',
        arrivalRoute: '',
        arrivalDate: '',
        arrivalTime: '',
        departureRoute: '',
        departureDate: '',
        departureTime: '',
        roomCategory: '',
        phoneNumber: '',
        senderId: '66e19c40966092356462c369',
        airlineId: '668fd12958c2631307ad65fb',
        mealPlan: {
            included: true,
            breakfast: false,
            lunch: false,
            dinner: false,
        }
    });

    const token = getCookie('token');

    const [createRequest, { loading, error, data }] = useMutation(CREATE_REQUEST_MUTATION, {
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
            airportId: '66e2d407991c84395fe0e686',
            arrivalRoute: '',
            arrivalDate: '',
            arrivalTime: '',
            departureRoute: '',
            departureDate: '',
            departureTime: '',
            roomCategory: '',
            phoneNumber: '',
            senderId: '66e19c40966092356462c369',
            airlineId: '668fd12958c2631307ad65fb',
            mealPlan: {
                included: true,
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

    const handleSubmit = async () => {
        const input = {
            fullName: formData.fullName,
            position: formData.position,
            gender: formData.gender,
            phoneNumber: formData.phoneNumber,
            airportId: formData.airportId, // Убедитесь, что это правильное поле
            arrival: {
                flight: formData.arrivalRoute, // Поле должно называться "flight", а не "arrivalRoute"
                date: formData.arrivalDate,
                time: formData.arrivalTime,
            },
            departure: {
                flight: formData.departureRoute, // Поле должно называться "flight", а не "departureRoute"
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
            // alert('Заявка успешно создана!');
        } catch (e) {
            console.error(e);
        }
        resetForm();
        onClose();
    };

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
                        <label>ФИО</label>
                        <input type="text" name="fullName" placeholder="Иванов Иван Иванович" value={formData.fullName} onChange={handleChange} />

                        <label>Должность</label>
                        <input type="text" name="position" placeholder="Капитан" value={formData.position} onChange={handleChange} />

                        <label>Пол</label>
                        <input type="text" name="gender" placeholder="Пол" value={formData.gender} onChange={handleChange} />

                        <label>Номер телефона</label>
                        <input type="text" name="phoneNumber" placeholder="89094567432" value={formData.phoneNumber} onChange={handleChange} />

                        {/* <label>Аэропорт</label>
                        <select name="airport" value={formData.airport} onChange={handleChange}>
                            <option value="" disabled>Выберите аэропорт</option>
                            <option value="Аэропорт1">Аэропорт1</option>
                            <option value="Аэропорт2">Аэропорт2</option>
                            <option value="Аэропорт3">Аэропорт3</option>
                        </select> */}

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

                        <div className={classes.checks} style={{ 'display': `${formData.mealPlan.included == true ? 'flex' : 'none'}` }}>
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