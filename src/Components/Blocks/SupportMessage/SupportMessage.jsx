import React, { useEffect, useRef, useState } from "react";
import classes from './SupportMessage.module.css';
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import Smiles from "../Smiles/Smiles";
import { convertToDate, GET_USER_SUPPORT_CHAT, REQUEST_MESSAGES_SUBSCRIPTION, UPDATE_MESSAGE_BRON } from "../../../../graphQL_requests";
import { roles } from "../../../roles";

function SupportMessage({ children, formData, token, user, selectedId, chatPadding, chatHeight, height, ...props }) {
    const messagesEndRef = useRef(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [isUserMessage, setIsUserMessage] = useState(false);

    // console.log(user?.id);

    let userID = selectedId ? selectedId : user?.id
    

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setNewMessagesCount(0);
        setShowScrollButton(false);
    };

    const { loading, error, data, refetch } = useQuery(GET_USER_SUPPORT_CHAT, {
        variables: {
            userId: userID,
        },
    });
    

    const [messages, setMessages] = useState([]);
    // console.log(data?.userSupportChat?.id);
    

    useEffect(() => {
        if (data && data.userSupportChat.messages) {
            setMessages(data.userSupportChat.messages);
            if (isInitialLoad) {
                setTimeout(() => {
                    scrollToBottom();
                }, 0);
                setIsInitialLoad(false);
            }
        }
        refetch()
    }, [data, isInitialLoad, refetch]);

    // useEffect(() => {
    //     setTimeout(() => {
    //         scrollToBottom();
    //     }, 0);
    // }, [data])

    const { data: subscriptionData } = useSubscription(REQUEST_MESSAGES_SUBSCRIPTION, {
        variables: { chatId: data?.userSupportChat?.id },
    });

    useEffect(() => {
        if (subscriptionData) {
            const newMessage = subscriptionData.messageSent;
            setMessages((prevMessages) => {
                if (Array.isArray(prevMessages)) {
                    const messageExists = prevMessages.some(
                        (message) => message.id === newMessage.id
                    );
                    if (!messageExists) {
                        return [...prevMessages, newMessage];
                    }
                }
                return prevMessages;
            });
    
            if (newMessage.sender.id !== user?.id) {
                setNewMessagesCount((prevCount) => prevCount + 1);
                setShowScrollButton(true);
            }
            setIsUserMessage(false);
        }
    }, [subscriptionData, user?.id]);

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
            senderId: user.id,
            chatId: data.userSupportChat.id,
            text: e.target.value
        });
    };

    // console.log(messages);
    

    const handleSmileChange = (emoji) => {
        setMessageText(prevState => ({
            senderId: user.id,
            chatId: data.userSupportChat.id,
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

            {!loading && !error && messages && data &&
                <div className={classes.requestData}>
                    <div className={classes.requestData_messages}>
                        {messages.map((message, index) => (
                            <div className={`${classes.requestData_message_full} ${message.sender.id === user.id && classes.myMes}`} key={index}>
                                <div className={classes.requestData_message}>
                                    <div className={classes.requestData_message_text}>
                                        <div className={classes.requestData_message_text__name}>
                                            <div className={classes.requestData_message_name}>{message.sender.name}</div>
                                            {/* {console.log(message.sender)} */}
                                            <div className={classes.requestData_message_post}>{message.sender.role === roles.superAdmin ? 'SUPPORT' : message.sender.role}</div>
                                        </div>
                                        <p style={{lineBreak: 'anywhere'}}>{message.text}</p>
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

export default SupportMessage;
