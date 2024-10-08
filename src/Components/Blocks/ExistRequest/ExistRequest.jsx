import React, { useState, useRef, useEffect } from "react";
import classes from './ExistRequest.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import { GET_MESSAGES_HOTEL, GET_REQUEST, getCookie, REQUEST_MESSAGES_SUBSCRIPTION, UPDATE_MESSAGE_BRON } from "../../../../graphQL_requests";
import Smiles from "../Smiles/Smiles";

function ExistRequest({ show, onClose, setShowChooseHotel, chooseRequestID, user, setChooseRequestID }) {
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
        return date.toLocaleDateString();
    }

    const { loading: messageLoading, error: messageError, data: messageData, refetch: messageRefetch } = useQuery(GET_MESSAGES_HOTEL, {
        variables: { requestId: chooseRequestID },
    });

    const [messages, setMessages] = useState();

    useEffect(() => {
        if (messageData) {
            setMessages(messageData.chats[0]);
        }
        messageRefetch();
    }, [messageData, messageRefetch]);

    const { data: subscriptionData } = useSubscription(REQUEST_MESSAGES_SUBSCRIPTION, {
        variables: { chatId: messages?.id },
    });

    useEffect(() => {
        if (subscriptionData) {
            setMessages(prevMessages => ({
                ...prevMessages,
                messages: [...prevMessages.messages, subscriptionData.messageSent] // Обращаемся к правильным данным из подписки
            }));
        }
    }, [subscriptionData]);

    useEffect(() => {
        scrollToBottom();
    }, [messageData, messages, subscriptionData]);

    function convertToDateStamp(timestamp) {
        const date = new Date(Number(timestamp));

        // Извлекаем компоненты даты и времени
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы идут с 0, поэтому добавляем 1
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        // Формируем строку в формате DD.MM.YYYY HH:MM
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    const [messageText, setMessageText] = useState({
        text: '',
        chatId: '',
        senderId: ''
    });

    const handleTextareaChange = (e) => {
        setMessageText({
            senderId: user.userId,
            chatId: messages.id,
            text: e.target.value
        });
    };

    const handleSmileChange = (emoji) => {
        setMessageText(prevState => ({
            senderId: user.userId,
            chatId: messages.id,
            text: prevState.text + emoji
        }));
    };

    const token = getCookie('token');

    const [createRequest] = useMutation(UPDATE_MESSAGE_BRON, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const handleSubmitMessage = async () => {
        if (messageText.text) {
            try {
                let request = await createRequest({
                    variables: {
                        chatId: messageText.chatId,
                        senderId: messageText.senderId,
                        text: messageText.text
                    }
                });

                if (request) {
                    setMessageText({
                        text: '',
                        chatId: '',
                        senderId: ''
                    });

                    setShowEmojiPicker(false)
                }
            } catch (err) {
                alert('Произошла ошибка при сохранении данных');
            }
        }
    };

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleEmojiPickerShow = async () => {
        setShowEmojiPicker(!showEmojiPicker)
    };
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
                                {formData.mealPlan.included && <>
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
                                </>
                                }

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


                        {activeTab === 'Комментарии' && (
                            <div className={classes.requestData}>
                                <div className={classes.requestData_messages} style={{ height: formData.status == 'done' && 'calc(100vh - 240px)' }}>
                                    {messages.messages.map((message, index) => (
                                        <div className={`${classes.requestData_message_full} ${message.sender.id == user.userId && classes.myMes}`} key={index}>
                                            <div className={classes.requestData_message}>
                                                <div className={classes.requestData_message_text}>
                                                    <div className={classes.requestData_message_text__name}>
                                                        <div className={classes.requestData_message_name}>{message.sender.name}</div>
                                                        <div className={classes.requestData_message_post}>{message.sender.role}</div>
                                                    </div>
                                                    {message.text}
                                                </div>
                                                <div className={classes.requestData_message_time}>{convertToDateStamp(message.createdAt)}</div>
                                            </div>
                                        </div>
                                    ))}

                                    <div ref={messagesEndRef} />
                                </div>

                                <div className={classes.sendBlock}>
                                    <div className={classes.smiles}>
                                        <div className={classes.smilesBlock} onClick={handleEmojiPickerShow}>😀</div>
                                        {showEmojiPicker && <Smiles handleSmileChange={handleSmileChange} />}
                                    </div>
                                    <textarea
                                        value={messageText.text}
                                        onChange={handleTextareaChange}
                                        placeholder="Введите сообщение"
                                    />
                                    <div className={classes.sendBlock_message} onClick={handleSubmitMessage}><img src="/message.png" alt="Отправить" /></div>
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

                    </div>
                    {formData.status !== 'done' &&
                        <div className={classes.requestButon}>
                            <Button onClick={() => {
                                onClose();
                                setShowChooseHotel(true)
                            }}>Разместить<img src="/user-check.png" alt="" /></Button>
                        </div>
                    }
                </Sidebar>
            }
        </>
    );
}

export default ExistRequest;