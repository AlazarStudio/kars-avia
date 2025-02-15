import React, { useEffect, useRef, useState } from "react";
import classes from './Message.module.css';
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import Smiles from "../Smiles/Smiles";
import { convertToDate, GET_MESSAGES_HOTEL, REQUEST_MESSAGES_SUBSCRIPTION, UPDATE_MESSAGE_BRON } from "../../../../graphQL_requests";
import { roles } from "../../../roles";

function Message({ children, activeTab, setIsHaveTwoChats, setHotelChats, setTitle, setMessageCount, separator, hotelChatId, chooseRequestID, chooseReserveID, formData, token, user, chatPadding, chatHeight, height, ...props }) {
    const messagesEndRef = useRef(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [isUserMessage, setIsUserMessage] = useState(false);

    const userID = user.userId ? user.userId : user.id

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setNewMessagesCount(0);
        setMessageCount ? setMessageCount(0) : null
        setShowScrollButton(false);
    };

    const { loading, error, data, refetch } = useQuery(GET_MESSAGES_HOTEL, {
        variables: {
            requestId: chooseRequestID,
            reserveId: chooseReserveID
        },
    });

    // console.log(formData);

    const [messages, setMessages] = useState({ messages: [] });

    const [selectedHotelChat, setSelectedHotelChat] = useState(null);

    useEffect(() => {
        if (data && data.chats) {
            let selectedChats = [];
    
            if (user?.airlineId) {
                // Фильтруем чаты по separator 'airline'
                selectedChats = data.chats.filter(chat => chat.separator === 'airline');
            } else if (user?.hotelId) {
                // Фильтруем чаты по separator 'hotel'
                selectedChats = data.chats.filter(chat => chat.separator === 'hotel');
            } else if (user.role === roles.superAdmin || user.role === roles.dispatcerAdmin) {
                // Фильтруем чаты по separator, переданному через пропсы
                selectedChats = data.chats.filter(chat => chat.separator === separator);
            }
            // console.log(selectedChats);
            
    
            // Устанавливаем первый чат из отфильтрованных как текущий
            if (selectedChats.length > 0) {
                setMessages(selectedChats[0]);
            }

            // console.log(selectedChats);
            
            if (data?.chats.length === 1) {
                setIsHaveTwoChats(false);
            } else {
                setIsHaveTwoChats(true);
            }
            // console.log(data?.chats);

            let hotelChats = data.chats.filter(chat => chat.separator === "hotel");

            // if (hotelChats.length > 1 && separator !== 'airline') {
            if (chooseRequestID === "" && separator !== 'airline') {
                setHotelChats ? 
                setHotelChats(hotelChats) : null;
                const chatToSelect = hotelChatId ? hotelChats.find(chat => chat.hotelId === hotelChatId) : hotelChats[0];
                setMessages(chatToSelect);
                setTitle ? 
                setTitle(chatToSelect?.hotel?.name) : null;
                // console.log(chatToSelect?.hotel.name);
                // console.log('Все чаты с отелями', hotelChats);
                // console.log(hotelChats[0]);
                // console.log(hotelChatId);
                
                
                // setMessages(chatToSelect);
                // setSelectedHotelChat(chatToSelect);
            }
            
    
            if (isInitialLoad) {
                setTimeout(() => {
                    scrollToBottom();
                }, 0);
                setIsInitialLoad(false);
            }
        }
        refetch();
    }, [data, separator, hotelChatId, user.role, isInitialLoad, refetch]);
    

    const { data: subscriptionData } = useSubscription(REQUEST_MESSAGES_SUBSCRIPTION, {
        variables: { chatId: messages?.id },
    });

    useEffect(() => {
        if (subscriptionData) {
            const newMessage = subscriptionData.messageSent;

            setMessages(prevMessages => {
                const messageExists = prevMessages.messages.some(
                    message => message.id === newMessage.id
                );

                if (!messageExists) {
                    return {
                        ...prevMessages,
                        messages: [...prevMessages.messages, newMessage]
                    };
                }
                return prevMessages;
            });

            // Проверяем, что сообщение отправлено не текущим пользователем
            if (newMessage.sender.id !== userID) {
                setNewMessagesCount(prevCount => prevCount + 1);
                setShowScrollButton(true);
                setMessageCount ? setMessageCount(prev => prev + 1) : null
            }
            setIsUserMessage(false);
        }
    }, [subscriptionData, userID]);

    // console.log(subscriptionData);
    

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShowScrollButton(false);
                    setNewMessagesCount(0);
                } else if (newMessagesCount > 0) {
                    setShowScrollButton(true);
                }
            },
            { threshold: 1.0 }
        );

        if (messagesEndRef.current) {
            observer.observe(messagesEndRef.current);
        }

        return () => {
            if (messagesEndRef.current) {
                observer.unobserve(messagesEndRef.current);
            }
        };
    }, [newMessagesCount]);

    const [messageText, setMessageText] = useState({
        text: '',
        chatId: '',
        senderId: ''
    });

    const handleTextareaChange = (e) => {
        setMessageText({
            senderId: userID,
            chatId: messages.id,
            text: e.target.value
        });
    };

    const handleSmileChange = (emoji) => {
        setMessageText(prevState => ({
            senderId: userID,
            chatId: messages.id,
            text: prevState.text + emoji
        }));
    };

    const [createRequest] = useMutation(UPDATE_MESSAGE_BRON, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Apollo-Require-Preflight': 'true',
            },
        },
    });

    // console.log(messageText);
    

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

                    setShowEmojiPicker(false);
                    setIsUserMessage(true);
                    scrollToBottom();
                    setShowScrollButton(false); // Скрываем кнопку при отправке
                    setNewMessagesCount(0); // Сбрасываем счетчик при отправке
                }
            } catch (err) {
                alert('Произошла ошибка при сохранении данных', err);
                console.error(err);
            }
        }
    };

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleEmojiPickerShow = () => {
        setShowEmojiPicker(!showEmojiPicker);
    };

    return (
        <>
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && messages?.messages && data &&
                <div className={classes.requestData} style={{ padding: chatPadding }}>
                    <div className={classes.requestData_messages} style={{ height: height ? `calc(100vh - ${height}px)` : formData?.status === 'done' ? 'calc(100vh - 244px)' : chatHeight }}>
                        {messages?.messages.map((message, index) => (
                            <div className={`${classes.requestData_message_full} ${message.sender.id === userID && classes.myMes}`} key={index}>
                                <div className={classes.requestData_message}>
                                    <div className={classes.requestData_message_text}>
                                        <div className={classes.requestData_message_text__name}>
                                            <div className={classes.requestData_message_name}>{message.sender.name}</div>
                                            <div className={classes.requestData_message_post}>{message.sender.role}</div>
                                        </div>
                                        {message.text}
                                        <div className={classes.requestData_message_time}>{convertToDate(message.createdAt)} {convertToDate(message.createdAt, true)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {showScrollButton && (
                        <div className={classes.scrollButton} onClick={scrollToBottom}>
                            <span className={classes.scrollArrow}>↓</span>
                            {newMessagesCount > 0 && <span className={classes.newMessagesCount}>{newMessagesCount}</span>}
                        </div>
                    )}

                    <div className={classes.sendBlock}>
                        <div className={classes.smiles}>
                            <div className={classes.smilesBlock} onClick={handleEmojiPickerShow}>😀</div>
                            {showEmojiPicker && <Smiles handleSmileChange={handleSmileChange} />}
                        </div>
                        <input
                            type="text"
                            value={messageText.text}
                            onChange={handleTextareaChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSubmitMessage();
                                }
                            }}
                            placeholder="Введите сообщение"
                        />
                        <div className={classes.sendBlock_message} onClick={handleSubmitMessage}>
                            <img src="/message.png" alt="Отправить" />
                        </div>
                    </div>
                </div>
            }
        </>
    )
}

export default Message;
