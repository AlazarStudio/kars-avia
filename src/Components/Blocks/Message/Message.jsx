
import React, { useEffect, useRef, useState } from "react";
import classes from './Message.module.css';
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import Smiles from "../Smiles/Smiles";
import { 
    convertToDate, 
    GET_MESSAGES_HOTEL, 
    MARK_ALL_MESSAGES_AS_READ, 
    MARK_MESSAGE_AS_READ, 
    REQUEST_MESSAGES_SUBSCRIPTION, 
    UPDATE_MESSAGE_BRON,
} from "../../../../graphQL_requests";
import { roles } from "../../../roles";
import MUILoader from "../MUILoader/MUILoader";

function Message({
    children,
    filteredPlacement,
    activeTab,
    show,
    setIsHaveTwoChats,
    setHotelChats,
    setTitle,
    setMessageCount,
    separator,
    hotelChatId,
    chooseRequestID,
    chooseReserveID,
    formData,
    token,
    user,
    chatPadding,
    chatHeight,
    height,
    ...props
}) {
    const messagesEndRef = useRef(null);
    
    // Для хранения рефов на каждое сообщение
    const messageRefs = useRef({});
    // Для хранения IntersectionObserver на каждое сообщение
    const observers = useRef({});

    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [isUserMessage, setIsUserMessage] = useState(false);

    const userID = user.userId ? user.userId : user.id;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setNewMessagesCount(0);
        setMessageCount?.(0);
        setShowScrollButton(false);
    };

    // Мутация для отметки всех сообщений как прочитанных
    const [markAllMessagesAsReadMutation] = useMutation(MARK_ALL_MESSAGES_AS_READ, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });

    // При клике помечаем все сообщения как прочитанные и обновляем данные
    const scrollToUnread = () => {
        if (!messages?.id) return;
        markAllMessagesAsReadMutation({
            variables: { chatId: messages.id, userId: userID }
        })
        .then(() => {
            refetch();
            scrollToBottom();
        })
        .catch(err => console.error("Ошибка при отметке всех сообщений как прочитанных:", err));
    };

    const isUserAtBottom = () => {
        if (!messagesEndRef.current) return false;
        const { scrollHeight, scrollTop, clientHeight } = messagesEndRef.current.parentElement;
        return scrollHeight - scrollTop <= clientHeight + 10;
    };

    const { loading, error, data, refetch } = useQuery(GET_MESSAGES_HOTEL, {
        context: {
            headers : {
                Authorization: `Bearer ${token}`,
            },
        },
        variables: {
            requestId: chooseRequestID,
            reserveId: chooseReserveID
        },
        fetchPolicy: "network-only",
        skip: (chooseRequestID == "" && chooseReserveID == "") ? true: false
    });


    // Состояние для выбранного чата
    const [messages, setMessages] = useState({ messages: [] });
    const [selectedHotelChat, setSelectedHotelChat] = useState(null);

    // Мутация для отметки отдельного сообщения как прочитанного
    const [markMessageAsReadMutation] = useMutation(MARK_MESSAGE_AS_READ, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });

    // Функция прокрутки к первому непрочитанному сообщению
    const scrollToFirstUnread = (firstUnreadId) => {
        if (messageRefs.current[firstUnreadId]?.current) {
            messageRefs.current[firstUnreadId].current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    // Подписка на новые сообщения
    const { data: subscriptionData } = useSubscription(REQUEST_MESSAGES_SUBSCRIPTION, {
        variables: { chatId: messages?.id },
        onData: () => {
            refetch();
        },
    });


    // При загрузке/обновлении данных выбираем нужный чат и устанавливаем счётчик unreadMessagesCount
    useEffect(() => {
        if ((data && data.chats) || (filteredPlacement && filteredPlacement.length !== 0)) {
            let selectedChats = [];
            if (user?.airlineId) {
                selectedChats = data?.chats.filter(chat => chat.separator === 'airline');
            } else if (user?.hotelId) {
                selectedChats = data?.chats.filter(chat => chat.separator === 'hotel');
            } else if (user.role === roles.superAdmin || user.role === roles.dispatcerAdmin) {
                selectedChats = data?.chats.filter(chat => chat.separator === separator);
            }

            if (selectedChats?.length > 0) {
                const defaultChat = selectedChats[0];
                setMessages(defaultChat);
                // Устанавливаем локальный счётчик непрочитанных из сервера
                setNewMessagesCount(defaultChat.unreadMessagesCount || 0);
            }

            if (data?.chats.length === 1) {
                setIsHaveTwoChats(false);
            } else {
                setIsHaveTwoChats(true);
            }

            let hotelChats = data?.chats.filter(chat => chat.separator === "hotel");

            if (chooseRequestID === "" && separator !== 'airline') {
                setHotelChats?.(hotelChats);
                const chatToSelect = hotelChatId
                    ? hotelChats?.find(chat => chat.hotelId === hotelChatId)
                    : hotelChats[0];
                setMessages(chatToSelect);
                setTitle?.(chatToSelect?.hotel?.name);
                setNewMessagesCount(chatToSelect?.unreadMessagesCount || 0);
            }
        }
    }, [
        data,
        separator,
        hotelChatId,
        user.role,
        filteredPlacement,
        chooseRequestID,
        setIsHaveTwoChats,
        setHotelChats,
        setTitle,
    ]);


    // Если объект "messages" изменился, устанавливаем счётчик непрочитанных из него (на случай refetch)
    useEffect(() => {
        if (messages?.unreadMessagesCount != null) {
            setNewMessagesCount(messages.unreadMessagesCount);
        }
    }, [messages, separator]);

    // При первой инициализации ИЛИ при изменении separator — скроллим к первому непрочитанному (если есть) или вниз
    useEffect(() => {
        if (isInitialLoad && messages?.messages?.length) {
            const firstUnreadIndex = messages.messages.findIndex(
                msg => msg.sender.id !== userID && !msg.readBy?.some(rb => rb.user.id === userID)
            );
            if (firstUnreadIndex !== -1) {
                const firstUnreadId = messages.messages[firstUnreadIndex].id;
                scrollToFirstUnread(firstUnreadId);
            } else {
                scrollToBottom();
            }
            setIsInitialLoad(false);
        }
    }, [isInitialLoad, messages?.messages, separator, userID]);

    // Сбрасываем флаг isInitialLoad при смене separator, чтобы скролл произошёл вновь
    useEffect(() => {
        setIsInitialLoad(true);
        if (chooseRequestID !== "" || chooseReserveID !== "") {
            refetch();
        }
    }, [separator, show, chooseRequestID, chooseReserveID]);
    

    useEffect(() => {
        setIsInitialLoad(true);
        if (chooseRequestID !== "" || chooseReserveID !== "") {
            refetch();
        }
      
        return () => {
          // Очищаем все IntersectionObserver, чтобы при новом монтировании всё пересоздать
          Object.values(observers.current).forEach((observer) => {
            observer.disconnect();
          });
          observers.current = {};
          messageRefs.current = {};
        };
    }, [separator, chooseRequestID, chooseReserveID]);

    // console.log(messages.messages.length);

    // При получении нового сообщения
    useEffect(() => {
        if (subscriptionData) {
            const newMessage = subscriptionData.messageSent;
            if (newMessage.chatId !== messages?.id) return;
            setMessages(prevMessages => {
                const messageExists = prevMessages.messages.some(
                    message => message.id === newMessage.id
                );
                if (!messageExists) {
                    return {
                        ...prevMessages,
                        messages: [...prevMessages.messages, newMessage],
                    };
                }
                return prevMessages;
            });

            // Если это чужое сообщение и оно не прочитано пользователем, увеличиваем локально счётчик
            if (
                newMessage.sender.id !== userID &&
                !newMessage.readBy?.some(rb => rb.user.id === userID)
            ) {
                setNewMessagesCount(prevCount => prevCount + 1);
                setTimeout(() => {
                    if (!isUserAtBottom()) {
                        setShowScrollButton(true);
                        setMessageCount?.(prev => prev + 1);
                    }
                }, 500);
                setMessageCount?.(prev => prev + 1);
            }
            // setIsUserMessage(false);
        }
    }, [subscriptionData, userID, setMessageCount, separator]);

    // Следим за "дном" чата, чтобы показать/скрыть кнопку прокрутки
    useEffect(() => {
        const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
            setShowScrollButton(false);
            } else if (newMessagesCount > 0) {
            setShowScrollButton(true);
            }
        },
        { threshold: 1.0 }
        );
        const endElement = messagesEndRef.current;
        if (endElement) {
        observer.observe(endElement);
        }
        return () => {
        if (endElement) {
            observer.unobserve(endElement);
        }
        };
    }, [newMessagesCount, separator]);
    
    // Обновляем флаг отображения кнопки при изменении количества непрочитанных сообщений и separator
    useEffect(() => {
        setShowScrollButton(newMessagesCount > 0 && !isUserAtBottom());
    }, [newMessagesCount, separator]);
  
    

    // Подписываемся на IntersectionObserver для каждого непрочитанного сообщения
    useEffect(() => {
        if (!messages?.messages?.length) return;

        messages.messages.forEach(msg => {
            if (!messageRefs.current[msg.id]) {
                messageRefs.current[msg.id] = React.createRef();
            }
            const alreadyRead = msg.readBy?.some(rb => rb.user.id === userID);
            const isOwn = msg.sender.id === userID;
            if (!isOwn && !alreadyRead) {
                if (!observers.current[msg.id]) {
                    const obs = new IntersectionObserver(([entry]) => {
                        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
                            markMessageAsReadMutation({
                                variables: { messageId: msg.id, userId: userID }
                            })
                            .then(() => {
                                refetch();
                            })
                            .catch(err => console.error("Ошибка при отметке сообщения как прочитанного:", err));

                            if (messageRefs.current[msg.id]?.current) {
                                obs.unobserve(messageRefs.current[msg.id].current);
                            }
                        }
                    }, { threshold: 0.7 });
                    if (messageRefs.current[msg.id]?.current) {
                        obs.observe(messageRefs.current[msg.id].current);
                    }
                    observers.current[msg.id] = obs;
                }
            }
        });
    }, [messages, markMessageAsReadMutation, userID, refetch, separator]);

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
            },
        },
    });

    const handleSubmitMessage = async () => {
        if (messageText.text.trim()) {
            try {
                let request = await createRequest({
                    variables: {
                        chatId: messageText.chatId,
                        senderId: messageText.senderId,
                        text: messageText.text
                    }
                });
                if (request) {
                    markAllMessagesAsReadMutation({
                        variables: { chatId: messages.id, userId: userID }
                    })
                    .then(() => {
                        refetch();
                        scrollToBottom();
                    })
                    setMessageText({
                        text: '',
                        chatId: '',
                        senderId: ''
                    });
                    setShowEmojiPicker(false);
                    // setIsUserMessage(true);
                    // Даем время на перерисовку компонента
                    setTimeout(() => {
                        scrollToBottom();
                    }, 50);
                    setShowScrollButton(false);
                    setNewMessagesCount(0);
                }
            } catch (err) {
                alert('Произошла ошибка при сохранении данных', err);
                console.error(err);
            } finally {
                    scrollToBottom();
            }
        }
    };

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const handleEmojiPickerShow = () => {
        setShowEmojiPicker(!showEmojiPicker);
    };

    return (
        <>
            {loading && <MUILoader loadSize={'50px'} fullHeight={'78vh'}/>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && messages?.messages && data && (
                <div className={classes.requestData} style={{ padding: chatPadding }}>
                    <div
                        className={classes.requestData_messages}
                        style={{ height: height ? `calc(100vh - ${height}px)` : chatHeight }}
                    >
                        {messages.messages.map((message) => {
                            if (!messageRefs.current[message.id]) {
                                messageRefs.current[message.id] = React.createRef();
                            }
                            return (
                                <div
                                    className={`
                                        ${classes.requestData_message_full}
                                        ${message.sender.id === userID && classes.myMes}
                                    `}
                                    key={message.id}
                                    ref={messageRefs.current[message.id]}
                                >
                                    <div className={classes.requestData_message}>
                                        <div className={classes.requestData_message_text}>
                                            <div className={classes.requestData_message_text__name}>
                                                <div className={classes.requestData_message_name}>
                                                    {message.sender.name}
                                                </div>
                                                <div className={classes.requestData_message_post}>
                                                    {message.sender?.position}
                                                </div>
                                            </div>
                                            <div
                                                className={`
                                                    ${classes.requestData_message__message}
                                                    ${message.sender.id === userID ? classes.myMesBorderRadius : ''}
                                                `}
                                                style={
                                                    message?.separator
                                                        ? { backgroundColor: '#3CBC6726', color: '#3B6C54' }
                                                        : {}
                                                }
                                            >
                                                {message.text}
                                            </div>
                                            <div
                                                className={classes.requestData_message_time}
                                                style={message.sender.id === userID ? { textAlign: 'right' } : {}}
                                            >
                                                {new Date(message.createdAt).toLocaleDateString("ru-RU", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}{" "}
                                                {convertToDate(message.createdAt, true)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {showScrollButton && newMessagesCount > 0 && (
                        <div className={classes.scrollButton} onClick={scrollToUnread}>
                            <span className={classes.scrollArrow}>↓</span>
                            {/* {newMessagesCount > 0 && ( */}
                                <span className={classes.newMessagesCount}>{newMessagesCount}</span>
                            {/* )} */}
                        </div>
                    )}

                    <div className={classes.sendBlock}>
                        <div className={classes.smiles}>
                            <div className={classes.smilesBlock} onClick={handleEmojiPickerShow}>
                                😀
                            </div>
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
                            style={{ borderRadius: '20px' }}
                        />
                        <div className={classes.sendBlock_message} onClick={handleSubmitMessage}>
                            <img src="/message.png" alt="Отправить" />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Message;

// import React, { useEffect, useRef, useState } from "react";
// import classes from './Message.module.css';
// import { useMutation, useQuery, useSubscription } from "@apollo/client";
// import Smiles from "../Smiles/Smiles";
// import { 
//     convertToDate, 
//     GET_MESSAGES_HOTEL, 
//     MARK_ALL_MESSAGES_AS_READ, 
//     MARK_MESSAGE_AS_READ, 
//     REQUEST_MESSAGES_SUBSCRIPTION, 
//     UPDATE_MESSAGE_BRON,
// } from "../../../../graphQL_requests";
// import { roles } from "../../../roles";
// import MUILoader from "../MUILoader/MUILoader";

// function Message({
//     children,
//     filteredPlacement,
//     activeTab,
//     show,
//     setIsHaveTwoChats,
//     setHotelChats,
//     setTitle,
//     setMessageCount,
//     separator,
//     hotelChatId,
//     chooseRequestID,
//     chooseReserveID,
//     formData,
//     token,
//     user,
//     chatPadding,
//     chatHeight,
//     height,
//     ...props
// }) {
//     const messagesEndRef = useRef(null);
    
//     // Рефы для каждого сообщения
//     const messageRefs = useRef({});
//     // Храним наблюдатели для сообщений
//     const observers = useRef({});

//     const [isInitialLoad, setIsInitialLoad] = useState(true);
//     const [showScrollButton, setShowScrollButton] = useState(false);
//     const [newMessagesCount, setNewMessagesCount] = useState(0);
//     const [isUserMessage, setIsUserMessage] = useState(false);

//     // Сохраняем id первого непрочитанного сообщения – он не будет сбрасываться до перезагрузки
//     const [firstUnreadMessageId, setFirstUnreadMessageId] = useState(null);

//     const userID = user.userId ? user.userId : user.id;

//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//         setNewMessagesCount(0);
//         setMessageCount?.(0);
//         setShowScrollButton(false);
//     };

//     // Мутация для отметки всех сообщений как прочитанных
//     const [markAllMessagesAsReadMutation] = useMutation(MARK_ALL_MESSAGES_AS_READ, {
//         context: {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         },
//     });

//     // При клике помечаем все сообщения как прочитанные и обновляем данные
//     const scrollToUnread = () => {
//         if (!messages?.id) return;
//         markAllMessagesAsReadMutation({
//             variables: { chatId: messages.id, userId: userID }
//         })
//         .then(() => {
//             refetch();
//             scrollToBottom();
//         })
//         .catch(err => console.error("Ошибка при отметке всех сообщений как прочитанных:", err));
//     };

//     const isUserAtBottom = () => {
//         if (!messagesEndRef.current) return false;
//         const { scrollHeight, scrollTop, clientHeight } = messagesEndRef.current.parentElement;
//         return scrollHeight - scrollTop <= clientHeight + 10;
//     };

//     const { loading, error, data, refetch } = useQuery(GET_MESSAGES_HOTEL, {
//         context: {
//             headers : {
//                 Authorization: `Bearer ${token}`,
//             },
//         },
//         variables: {
//             requestId: chooseRequestID,
//             reserveId: chooseReserveID
//         },
//         fetchPolicy: "network-only",
//     });

//     // Состояние выбранного чата
//     const [messages, setMessages] = useState({ messages: [] });
//     const [selectedHotelChat, setSelectedHotelChat] = useState(null);

//     // Мутация для отметки отдельного сообщения как прочитанного
//     const [markMessageAsReadMutation] = useMutation(MARK_MESSAGE_AS_READ, {
//         context: {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         },
//     });

//     // Функция прокрутки к первому непрочитанному сообщению
//     const scrollToFirstUnread = (firstUnreadId) => {
//         if (messageRefs.current[firstUnreadId]?.current) {
//             messageRefs.current[firstUnreadId].current.scrollIntoView({
//                 behavior: 'smooth',
//                 block: 'center'
//             });
//         }
//     };

//     // Подписка на новые сообщения
//     const { data: subscriptionData } = useSubscription(REQUEST_MESSAGES_SUBSCRIPTION, {
//         variables: { chatId: messages?.id },
//         onData: () => {
//             refetch();
//         },
//     });

//     // При загрузке/обновлении данных выбираем нужный чат и устанавливаем счётчик непрочитанных
//     useEffect(() => {
//         if ((data && data.chats) || (filteredPlacement && filteredPlacement.length !== 0)) {
//             let selectedChats = [];
//             if (user?.airlineId) {
//                 selectedChats = data?.chats.filter(chat => chat.separator === 'airline');
//             } else if (user?.hotelId) {
//                 selectedChats = data?.chats.filter(chat => chat.separator === 'hotel');
//             } else if (user.role === roles.superAdmin || user.role === roles.dispatcerAdmin) {
//                 selectedChats = data?.chats.filter(chat => chat.separator === separator);
//             }

//             if (selectedChats?.length > 0) {
//                 const defaultChat = selectedChats[0];
//                 setMessages(defaultChat);
//                 setNewMessagesCount(defaultChat.unreadMessagesCount || 0);
//             }

//             if (data?.chats.length === 1) {
//                 setIsHaveTwoChats(false);
//             } else {
//                 setIsHaveTwoChats(true);
//             }

//             let hotelChats = data?.chats.filter(chat => chat.separator === "hotel");

//             if (chooseRequestID === "" && separator !== 'airline') {
//                 setHotelChats?.(hotelChats);
//                 const chatToSelect = hotelChatId
//                     ? hotelChats.find(chat => chat.hotelId === hotelChatId)
//                     : (hotelChats ? hotelChats[0] : null);
//                 setMessages(chatToSelect);
//                 setTitle?.(chatToSelect?.hotel?.name);
//                 setNewMessagesCount(chatToSelect?.unreadMessagesCount || 0);
//             }
//         }
//     }, [
//         data,
//         separator,
//         hotelChatId,
//         user.role,
//         filteredPlacement,
//         chooseRequestID,
//         setIsHaveTwoChats,
//         setHotelChats,
//         setTitle,
//     ]);

//     // При изменении объекта "messages" устанавливаем счётчик непрочитанных
//     useEffect(() => {
//         if (messages?.unreadMessagesCount != null) {
//             setNewMessagesCount(messages.unreadMessagesCount);
//         }
//     }, [messages, separator]);

//     // Если есть непрочитанные сообщения, вычисляем и сохраняем id первого непрочитанного (однократно)
//     useEffect(() => {
//         if (messages?.messages?.length && newMessagesCount > 0 && !firstUnreadMessageId) {
//             const firstUnread = messages.messages.find(msg =>
//                 msg.sender.id !== userID &&
//                 !msg.readBy?.some(rb => rb.user.id === userID)
//             );
//             if (firstUnread) {
//                 setFirstUnreadMessageId(firstUnread.id);
//             }
//         }
//     }, [messages, newMessagesCount, userID, firstUnreadMessageId]);

//     // При первой инициализации или при изменении separator — скроллим к первому непрочитанному (если он есть) или вниз
//     useEffect(() => {
//         if (isInitialLoad && messages?.messages?.length) {
//             if (firstUnreadMessageId) {
//                 scrollToFirstUnread(firstUnreadMessageId);
//             } else {
//                 scrollToBottom();
//             }
//             setIsInitialLoad(false);
//         }
//     }, [isInitialLoad, messages?.messages, separator, userID, firstUnreadMessageId]);

//     // Сбрасываем флаг isInitialLoad при смене separator, чтобы скролл произошёл вновь
//     useEffect(() => {
//         setIsInitialLoad(true);
//         refetch();
//     }, [separator, show]);
    
//     useEffect(() => {
//         setIsInitialLoad(true);
//         refetch();
      
//         return () => {
//           // Очищаем все IntersectionObserver при размонтировании или смене separator
//           Object.values(observers.current).forEach((observer) => {
//             observer.disconnect();
//           });
//           observers.current = {};
//           messageRefs.current = {};
//         };
//     }, [separator]);

//     // При получении нового сообщения
//     useEffect(() => {
//         if (subscriptionData) {
//             const newMessage = subscriptionData.messageSent;
//             if (newMessage.chatId !== messages?.id) return;
//             setMessages(prevMessages => {
//                 const messageExists = prevMessages.messages.some(
//                     message => message.id === newMessage.id
//                 );
//                 if (!messageExists) {
//                     return {
//                         ...prevMessages,
//                         messages: [...prevMessages.messages, newMessage],
//                     };
//                 }
//                 return prevMessages;
//             });

//             if (
//                 newMessage.sender.id !== userID &&
//                 !newMessage.readBy?.some(rb => rb.user.id === userID)
//             ) {
//                 setNewMessagesCount(prevCount => prevCount + 1);
//                 setTimeout(() => {
//                     if (!isUserAtBottom()) {
//                         setShowScrollButton(true);
//                         setMessageCount?.(prev => prev + 1);
//                     }
//                 }, 500);
//                 setMessageCount?.(prev => prev + 1);
//             }
//         }
//     }, [subscriptionData, userID, setMessageCount, separator]);

//     // Следим за "дном" чата, чтобы показать/скрыть кнопку прокрутки
//     useEffect(() => {
//         const observer = new IntersectionObserver(
//         ([entry]) => {
//             if (entry.isIntersecting) {
//                 setShowScrollButton(false);
//             } else if (newMessagesCount > 0) {
//                 setShowScrollButton(true);
//             }
//         },
//         { threshold: 1.0 }
//         );
//         const endElement = messagesEndRef.current;
//         if (endElement) {
//             observer.observe(endElement);
//         }
//         return () => {
//             if (endElement) {
//                 observer.unobserve(endElement);
//             }
//         };
//     }, [newMessagesCount, separator]);
    
//     useEffect(() => {
//         setShowScrollButton(newMessagesCount > 0 && !isUserAtBottom());
//     }, [newMessagesCount, separator]);
  
//     // Для всех непрочитанных сообщений, кроме первого, создаём observer для автоматической отметки как прочитанных.
//     // Если сообщение является первым непрочитанным (firstUnreadMessageId), observer не создаётся – плашка остаётся.
//     useEffect(() => {
//         if (!messages?.messages?.length) return;

//         messages.messages.forEach(msg => {
//             if (!messageRefs.current[msg.id]) {
//                 messageRefs.current[msg.id] = React.createRef();
//             }
//             const alreadyRead = msg.readBy?.some(rb => rb.user.id === userID);
//             const isOwn = msg.sender.id === userID;
//             if (!isOwn && !alreadyRead && (firstUnreadMessageId ? msg.id !== firstUnreadMessageId : true)) {
//                 if (!observers.current[msg.id]) {
//                     const obs = new IntersectionObserver(([entry]) => {
//                         if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
//                             markMessageAsReadMutation({
//                                 variables: { messageId: msg.id, userId: userID }
//                             })
//                             .then(() => {
//                                 refetch();
//                             })
//                             .catch(err => console.error("Ошибка при отметке сообщения как прочитанного:", err));

//                             if (messageRefs.current[msg.id]?.current) {
//                                 obs.unobserve(messageRefs.current[msg.id].current);
//                             }
//                         }
//                     }, { threshold: 0.7 });
//                     if (messageRefs.current[msg.id]?.current) {
//                         obs.observe(messageRefs.current[msg.id].current);
//                     }
//                     observers.current[msg.id] = obs;
//                 }
//             }
//         });
//     }, [messages, markMessageAsReadMutation, userID, refetch, separator, firstUnreadMessageId]);

//     const [messageText, setMessageText] = useState({
//         text: '',
//         chatId: '',
//         senderId: ''
//     });

//     const handleTextareaChange = (e) => {
//         setMessageText({
//             senderId: userID,
//             chatId: messages.id,
//             text: e.target.value
//         });
//     };

//     const handleSmileChange = (emoji) => {
//         setMessageText(prevState => ({
//             senderId: userID,
//             chatId: messages.id,
//             text: prevState.text + emoji
//         }));
//     };

//     const [createRequest] = useMutation(UPDATE_MESSAGE_BRON, {
//         context: {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         },
//     });

//     const handleSubmitMessage = async () => {
//         if (messageText.text.trim()) {
//             try {
//                 let request = await createRequest({
//                     variables: {
//                         chatId: messageText.chatId,
//                         senderId: messageText.senderId,
//                         text: messageText.text
//                     }
//                 });
//                 if (request) {
//                     markAllMessagesAsReadMutation({
//                         variables: { chatId: messages.id, userId: userID }
//                     })
//                     .then(() => {
//                         refetch();
//                         scrollToBottom();
//                     });
//                     setMessageText({
//                         text: '',
//                         chatId: '',
//                         senderId: ''
//                     });
//                     setShowEmojiPicker(false);
//                     setTimeout(() => {
//                         scrollToBottom();
//                     }, 50);
//                     setShowScrollButton(false);
//                     setNewMessagesCount(0);
//                     // Здесь не сбрасываем firstUnreadMessageId – плашка останется до перезайта
//                 }
//             } catch (err) {
//                 alert('Произошла ошибка при сохранении данных', err);
//                 console.error(err);
//             }
//         }
//     };

//     const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//     const handleEmojiPickerShow = () => {
//         setShowEmojiPicker(!showEmojiPicker);
//     };

//     return (
//         <>
//             {loading && <MUILoader loadSize={'50px'} fullHeight={'78vh'}/>}
//             {error && <p>Error: {error.message}</p>}

//             {!loading && !error && messages?.messages && data && (
//                 <div className={classes.requestData} style={{ padding: chatPadding }}>
//                     <div
//                         className={classes.requestData_messages}
//                         style={{ height: height ? `calc(100vh - ${height}px)` : chatHeight }}
//                     >
//                         {messages.messages.map((message) => {
//                             if (!messageRefs.current[message.id]) {
//                                 messageRefs.current[message.id] = React.createRef();
//                             }
//                             return (
//                                 <React.Fragment key={message.id}>
//                                     {message.id === firstUnreadMessageId && (
//                                         <div className={classes.unreadBanner}>
//                                             <img src="/left-arrow.png" alt="" /> 
//                                             Непрочитанные сообщения
//                                             <img src="/left-arrow.png" alt="" />
//                                         </div>
//                                     )}
//                                     <div
//                                         className={`
//                                             ${classes.requestData_message_full}
//                                             ${message.sender.id === userID && classes.myMes}
//                                         `}
//                                         ref={messageRefs.current[message.id]}
//                                     >
//                                         <div className={classes.requestData_message}>
//                                             <div className={classes.requestData_message_text}>
//                                                 <div className={classes.requestData_message_text__name}>
//                                                     <div className={classes.requestData_message_name}>
//                                                         {message.sender.name}
//                                                     </div>
//                                                     <div className={classes.requestData_message_post}>
//                                                         {message.sender?.position}
//                                                     </div>
//                                                 </div>
//                                                 <div
//                                                     className={`
//                                                         ${classes.requestData_message__message}
//                                                         ${message.sender.id === userID ? classes.myMesBorderRadius : ''}
//                                                     `}
//                                                     style={
//                                                         message?.separator
//                                                             ? { backgroundColor: '#3CBC6726', color: '#3B6C54' }
//                                                             : {}
//                                                     }
//                                                 >
//                                                     {message.text}
//                                                 </div>
//                                                 <div
//                                                     className={classes.requestData_message_time}
//                                                     style={message.sender.id === userID ? { textAlign: 'right' } : {}}
//                                                 >
//                                                     {new Date(message.createdAt).toLocaleDateString("ru-RU", {
//                                                         day: "numeric",
//                                                         month: "long",
//                                                         year: "numeric",
//                                                     })}{" "}
//                                                     {convertToDate(message.createdAt, true)}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </React.Fragment>
//                             );
//                         })}
//                         <div ref={messagesEndRef} />
//                     </div>

//                     {showScrollButton && newMessagesCount > 0 && (
//                         <div className={classes.scrollButton} onClick={scrollToUnread}>
//                             <span className={classes.scrollArrow}>↓</span>
//                             <span className={classes.newMessagesCount}>{newMessagesCount}</span>
//                         </div>
//                     )}

//                     <div className={classes.sendBlock}>
//                         <div className={classes.smiles}>
//                             <div className={classes.smilesBlock} onClick={handleEmojiPickerShow}>
//                                 😀
//                             </div>
//                             {showEmojiPicker && <Smiles handleSmileChange={handleSmileChange} />}
//                         </div>
//                         <input
//                             type="text"
//                             value={messageText.text}
//                             onChange={handleTextareaChange}
//                             onKeyDown={(e) => {
//                                 if (e.key === 'Enter') {
//                                     e.preventDefault();
//                                     handleSubmitMessage();
//                                 }
//                             }}
//                             placeholder="Введите сообщение"
//                             style={{ borderRadius: '20px' }}
//                         />
//                         <div className={classes.sendBlock_message} onClick={handleSubmitMessage}>
//                             <img src="/message.png" alt="Отправить" />
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// }

// export default Message;

// no unread version
// import React, { useEffect, useRef, useState } from "react";
// import classes from './Message.module.css';
// import { useMutation, useQuery, useSubscription } from "@apollo/client";
// import Smiles from "../Smiles/Smiles";
// import { convertToDate, GET_MESSAGES_HOTEL, getCookie, REQUEST_MESSAGES_SUBSCRIPTION, UPDATE_MESSAGE_BRON } from "../../../../graphQL_requests";
// import { roles } from "../../../roles";
// import MUILoader from "../MUILoader/MUILoader";

// function Message({ children, filteredPlacement, activeTab, setIsHaveTwoChats, setHotelChats, setTitle, setMessageCount, separator, hotelChatId, chooseRequestID, chooseReserveID, formData, token, user, chatPadding, chatHeight, height, ...props }) {
//     const messagesEndRef = useRef(null);
//     const [isInitialLoad, setIsInitialLoad] = useState(true);
//     const [showScrollButton, setShowScrollButton] = useState(false);
//     const [newMessagesCount, setNewMessagesCount] = useState(0);
//     const [isUserMessage, setIsUserMessage] = useState(false);

//     const userID = user.userId ? user.userId : user.id

//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//         setNewMessagesCount(0);
//         setMessageCount ? setMessageCount(0) : null
//         setShowScrollButton(false);
//     };

//     const isUserAtBottom = () => {
//         if (!messagesEndRef.current) return false;
        
//         const { scrollHeight, scrollTop, clientHeight } = messagesEndRef.current.parentElement;
//         return scrollHeight - scrollTop <= clientHeight + 10; // 10px запас для погрешности
//     };    

//     const { loading, error, data, refetch } = useQuery(GET_MESSAGES_HOTEL, {
//         context: {
//             headers : {
//                 Authorization: `Bearer ${token}`,
//             },
//         },
//         variables: {
//             requestId: chooseRequestID,
//             reserveId: chooseReserveID
//         },
//     });

//     // console.log(activeTab);

//     const [messages, setMessages] = useState({ messages: [] });

//     const [selectedHotelChat, setSelectedHotelChat] = useState(null);

//     useEffect(() => {
//         if (data && data.chats || (filteredPlacement && filteredPlacement.length !== 0)) {
//             let selectedChats = [];
    
//             if (user?.airlineId) {
//                 // Фильтруем чаты по separator 'airline'
//                 selectedChats = data?.chats.filter(chat => chat.separator === 'airline');
//             } else if (user?.hotelId) {
//                 // Фильтруем чаты по separator 'hotel'
//                 selectedChats = data?.chats.filter(chat => chat.separator === 'hotel');
//             } else if (user.role === roles.superAdmin || user.role === roles.dispatcerAdmin) {
//                 // Фильтруем чаты по separator, переданному через пропсы
//                 selectedChats = data?.chats.filter(chat => chat.separator === separator);
//             }
//             // console.log(selectedChats);
            
    
//             // Устанавливаем первый чат из отфильтрованных как текущий
//             if (selectedChats?.length > 0) {
//                 setMessages(selectedChats[0]);
//             }

//             // console.log(selectedChats);
            
//             if (data?.chats.length === 1) {
//                 setIsHaveTwoChats(false);
//             } else {
//                 setIsHaveTwoChats(true);
//             }
//             // console.log(data?.chats);

//             let hotelChats = data?.chats.filter(chat => chat.separator === "hotel");

//             // if (hotelChats.length > 1 && separator !== 'airline') {
//             if (chooseRequestID === "" && separator !== 'airline') {
//                 setHotelChats ? 
//                 setHotelChats(hotelChats) : null;
//                 const chatToSelect = hotelChatId ? hotelChats.find(chat => chat.hotelId === hotelChatId) : hotelChats[0];
//                 setMessages(chatToSelect);
//                 setTitle ? 
//                 setTitle(chatToSelect?.hotel?.name) : null;
//                 // console.log(chatToSelect?.hotel.name);
//                 // console.log('Все чаты с отелями', hotelChats);
//                 // console.log(hotelChats[0]);
//                 // console.log(hotelChatId);
                
                
//                 // setMessages(chatToSelect);
//                 // setSelectedHotelChat(chatToSelect);
//             }
            
    
//             if (isInitialLoad) {
//                 setTimeout(() => {
//                     scrollToBottom();
//                 }, 0);
//                 setIsInitialLoad(false);
//             }
//         }
//         refetch();
//     }, [data, separator, hotelChatId, user.role, isInitialLoad, refetch, filteredPlacement]);

//     useEffect(() => {
//         if (separator) {
//             setTimeout(() => {
//                 scrollToBottom();
//             }, 100); // Даем время на рендер
//             setIsInitialLoad(false);
//         }
    
//     }, [separator]);

//     // useEffect(() => {
//     //     if (isInitialLoad) {
//     //         setTimeout(() => {
//     //             scrollToBottom();
//     //         }, 100); // Даем время на рендер
//     //         setIsInitialLoad(false);
//     //     }
    
//     //     if (activeTab === "Комментарии") {
//     //         setTimeout(() => {
//     //             scrollToBottom();
//     //         }, 100);
//     //     }
//     // }, [isInitialLoad, activeTab, messages]);
    
    
    

//     const { data: subscriptionData } = useSubscription(REQUEST_MESSAGES_SUBSCRIPTION, {
//         variables: { chatId: messages?.id },
//         onData: () => {
//             refetch()
//         }
//     });

    
//     useEffect(() => {
//         if (subscriptionData) {
//             const newMessage = subscriptionData.messageSent;

//             setMessages(prevMessages => {
//                 const messageExists = prevMessages.messages.some(
//                     message => message.id === newMessage.id
//                 );

//                 if (!messageExists) {
//                     return {
//                         ...prevMessages,
//                         messages: [...prevMessages.messages, newMessage]
//                     };
//                 }
//                 return prevMessages;
//             });

//             // Проверяем, что сообщение отправлено не текущим пользователем
//             if (newMessage.sender.id !== userID) {
//                 setNewMessagesCount(prevCount => prevCount + 1);
//                 // setShowScrollButton(true); //old
//                 setTimeout(() => {
//                     if (!isUserAtBottom()) { 
//                         setShowScrollButton(true);
//                         setMessageCount ? setMessageCount(prev => prev + 1) : null;
//                     }
//                 }, 500); // Задержка в 500 мс (можно изменить)
//                 setMessageCount ? setMessageCount(prev => prev + 1) : null
//             }
//             setIsUserMessage(false);
//         }
//     }, [subscriptionData, userID]);

//     // console.log(subscriptionData);
    

//     useEffect(() => {
//         const observer = new IntersectionObserver(
//             ([entry]) => {
//                 if (entry.isIntersecting) {
//                     setShowScrollButton(false);
//                     setNewMessagesCount(0);
//                 } else if (newMessagesCount > 0) {
//                     setShowScrollButton(true);
//                 }
//             },
//             { threshold: 1.0 }
//         );

//         if (messagesEndRef.current) {
//             observer.observe(messagesEndRef.current);
//         }

//         return () => {
//             if (messagesEndRef.current) {
//                 observer.unobserve(messagesEndRef.current);
//             }
//         };
//     }, [newMessagesCount]);

//     const [messageText, setMessageText] = useState({
//         text: '',
//         chatId: '',
//         senderId: ''
//     });

//     const handleTextareaChange = (e) => {
//         setMessageText({
//             senderId: userID,
//             chatId: messages.id,
//             text: e.target.value
//         });
//     };

//     const handleSmileChange = (emoji) => {
//         setMessageText(prevState => ({
//             senderId: userID,
//             chatId: messages.id,
//             text: prevState.text + emoji
//         }));
//     };

//     const [createRequest] = useMutation(UPDATE_MESSAGE_BRON, {
//         context: {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 // 'Apollo-Require-Preflight': 'true',
//             },
//         },
//     });

//     // console.log(messageText);
    

//     const handleSubmitMessage = async () => {
//         if (messageText.text) {
//             try {
//                 let request = await createRequest({
//                     variables: {
//                         chatId: messageText.chatId,
//                         senderId: messageText.senderId,
//                         text: messageText.text
//                     }
//                 });

//                 if (request) {
//                     setMessageText({
//                         text: '',
//                         chatId: '',
//                         senderId: ''
//                     });

//                     setShowEmojiPicker(false);
//                     setIsUserMessage(true);
//                     scrollToBottom();
//                     setShowScrollButton(false); // Скрываем кнопку при отправке
//                     setNewMessagesCount(0); // Сбрасываем счетчик при отправке
//                 }
//             } catch (err) {
//                 alert('Произошла ошибка при сохранении данных', err);
//                 console.error(err);
//             }
//         }
//     };

//     const [showEmojiPicker, setShowEmojiPicker] = useState(false);

//     const handleEmojiPickerShow = () => {
//         setShowEmojiPicker(!showEmojiPicker);
//     };

//     // console.log(data);
    

//     return (
//         <>
//             {loading && <MUILoader loadSize={'50px'}/>}
//             {error && <p>Error: {error.message}</p>}

//             {!loading && !error && messages?.messages && data &&
//                 <div className={classes.requestData} style={{ padding: chatPadding }}>
//                     <div className={classes.requestData_messages} style={{ height: height ? `calc(100vh - ${height}px)` : chatHeight }}>
//                     {/* <div className={classes.requestData_messages} style={{ height: height ? `calc(100vh - ${height}px)` : formData?.status === 'done' ? 'calc(100vh - 244px)' : chatHeight }}> */}
//                         {messages?.messages.map((message, index) => (
//                             <div className={`${classes.requestData_message_full} ${message.sender.id === userID && classes.myMes}`} key={index}>
//                                 <div className={classes.requestData_message}>
//                                     <div className={classes.requestData_message_text}>
//                                         <div className={classes.requestData_message_text__name}>
//                                             <div className={classes.requestData_message_name}>{message.sender.name}</div>
//                                             {/* <div className={classes.requestData_message_post}>{message.sender.role}</div> */}
//                                             <div className={classes.requestData_message_post}>{message.sender?.position}</div>
//                                         </div>
//                                         <div className={`${classes.requestData_message__message} ${message.sender.id === userID ? classes.myMesBorderRadius : ''}`} style={message?.separator ? {backgroundColor:'#3CBC6726', color:'#3B6C54'} : {}}>
//                                             {message.text}
//                                             {/* <div className={classes.requestData_message_time}>{convertToDate(message.createdAt)} {convertToDate(message.createdAt, true)}</div> */}

//                                         </div>
//                                         <div className={classes.requestData_message_time} style={message.sender.id === userID ? {textAlign:'right'} : {}}>
//                                             {new Date(message.createdAt).toLocaleDateString("ru-RU", 
//                                                 {day: "numeric",
//                                                 month: "long",
//                                                 year: "numeric",
//                                                 })} 
//                                                 {convertToDate(message.createdAt, true)}
//                                                 {/* <p>{new Date(message.createdAt).toLocaleDateString("ru-RU", {year: "numeric",})} год</p>  */}
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                         <div ref={messagesEndRef} />
//                     </div>

//                     {showScrollButton && (
//                         <div className={classes.scrollButton} onClick={scrollToBottom}>
//                             <span className={classes.scrollArrow}>↓</span>
//                             {newMessagesCount > 0 && <span className={classes.newMessagesCount}>{newMessagesCount}</span>}
//                         </div>
//                     )}

//                     <div className={classes.sendBlock}>
//                         <div className={classes.smiles}>
//                             <div className={classes.smilesBlock} onClick={handleEmojiPickerShow}>😀</div>
//                             {showEmojiPicker && <Smiles handleSmileChange={handleSmileChange} />}
//                         </div>
//                         <input
//                             type="text"
//                             value={messageText.text}
//                             onChange={handleTextareaChange}
//                             onKeyDown={(e) => {
//                                 if (e.key === 'Enter') {
//                                     e.preventDefault();
//                                     handleSubmitMessage();
//                                 }
//                             }}
//                             placeholder="Введите сообщение"
//                             style={{borderRadius:'20px'}}
//                         />
//                         <div className={classes.sendBlock_message} onClick={handleSubmitMessage}>
//                             <img src="/message.png" alt="Отправить" />
//                         </div>
//                     </div>
//                 </div>
//             }
//         </>
//     )
// }

// export default Message;
