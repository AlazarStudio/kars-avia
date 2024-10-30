import React, { useEffect, useRef, useState } from "react";
import classes from './Message.module.css';
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import Smiles from "../Smiles/Smiles";
import { GET_MESSAGES_HOTEL, REQUEST_MESSAGES_SUBSCRIPTION, UPDATE_MESSAGE_BRON } from "../../../../graphQL_requests";

function Message({ children, activeTab, chooseRequestID, chooseReserveID, formData, token, user, chatPadding, chatHeight, ...props }) {
    const messagesEndRef = useRef(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [isUserMessage, setIsUserMessage] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setNewMessagesCount(0);
        setShowScrollButton(false);
    };

    const { loading, error, data } = useQuery(GET_MESSAGES_HOTEL, {
        variables: {
            requestId: chooseRequestID,
            reserveId: chooseReserveID
        },
    });

    const [messages, setMessages] = useState({ messages: [] });

    useEffect(() => {
        if (data && data.chats && data.chats[0]) {
            setMessages(data.chats[0]);
            if (isInitialLoad) {
                setTimeout(() => {
                    scrollToBottom();
                }, 0);
                setIsInitialLoad(false);
            }
        }
    }, [data, isInitialLoad]);

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
            if (newMessage.sender.id !== user.userId) {
                setNewMessagesCount(prevCount => prevCount + 1);
                setShowScrollButton(true);
            }
            setIsUserMessage(false);
        }
    }, [subscriptionData, user.userId]);

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

    function convertToDateStamp(timestamp) {
        const date = new Date(Number(timestamp));
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
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

                    setShowEmojiPicker(false);
                    setIsUserMessage(true);
                    scrollToBottom();
                    setShowScrollButton(false); // Скрываем кнопку при отправке
                    setNewMessagesCount(0); // Сбрасываем счетчик при отправке
                }
            } catch (err) {
                alert('Произошла ошибка при сохранении данных', err);
                console.log(err);
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
                    <div className={classes.requestData_messages} style={{ height: formData?.status === 'done' ? 'calc(100vh - 240px)' : chatHeight }}>
                        {messages?.messages.map((message, index) => (
                            <div className={`${classes.requestData_message_full} ${message.sender.id === user.userId && classes.myMes}`} key={index}>
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
                        <textarea
                            value={messageText.text}
                            onChange={handleTextareaChange}
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
