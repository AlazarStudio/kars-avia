
import React, { useEffect, useRef, useState } from "react";
import classes from './Message.module.css';
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import Smiles from "../Smiles/Smiles";
import { 
    convertToDate, 
    GET_MESSAGES_HOTEL, 
    GET_PASSENGER_REQUEST_CHATS,
    MARK_ALL_MESSAGES_AS_READ, 
    MARK_MESSAGE_AS_READ, 
    REQUEST_MESSAGES_SUBSCRIPTION, 
    UPDATE_MESSAGE_BRON,
    SEND_FAP_MESSAGE,
    getMediaUrl,
    convertToDateNew,
} from "../../../../graphQL_requests";
import { roles } from "../../../roles";
import MUILoader from "../MUILoader/MUILoader";
import SmileIcon from "../../../shared/icons/SmileIcon";

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
    chooseRequestID = "",
    chooseReserveID = "",
    passengerRequestId = "",
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

    const userID = user?.userId ? user?.userId : user?.id;
    const isExternal = user?.subjectType === "EXTERNAL_USER";

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

    const scrollToUnread = () => {
        if (!messages?.id) return;
        if (isExternal) {
            scrollToBottom();
            return;
        }
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

    const isFapMode = !!passengerRequestId;

    const { loading, error, data, refetch } = useQuery(
        isFapMode ? GET_PASSENGER_REQUEST_CHATS : GET_MESSAGES_HOTEL,
        {
            context: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
            variables: isFapMode
                ? { passengerRequestId }
                : { requestId: chooseRequestID, reserveId: chooseReserveID },
            fetchPolicy: "network-only",
            skip: isFapMode
                ? false
                : (chooseRequestID == "" && chooseReserveID == ""),
        }
    );


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

    const { data: subscriptionData } = useSubscription(REQUEST_MESSAGES_SUBSCRIPTION, {
        variables: { chatId: messages?.id },
        skip: !messages?.id,
        onData: () => {
            refetch();
        },
    });


    useEffect(() => {
        if (!data?.chats) return;

        if (isFapMode) {
            const fapChat = data.chats[0];
            if (fapChat) {
                setMessages(fapChat);
                setNewMessagesCount(fapChat.unreadMessagesCount || 0);
            }
            setIsHaveTwoChats(false);
            return;
        }

        if ((data && data.chats) || (filteredPlacement && filteredPlacement.length !== 0)) {
            let selectedChats = [];
            if (user?.airlineId) {
                selectedChats = data?.chats.filter(chat => chat.separator === 'airline');
            } else if (user?.hotelId) {
                selectedChats = data?.chats.filter(chat => chat.separator === 'hotel');
            } else if (user?.role === roles.superAdmin || user?.role === roles.dispatcerAdmin) {
                selectedChats = data?.chats.filter(chat => chat.separator === separator);
            }

            if (selectedChats?.length > 0) {
                const defaultChat = selectedChats[0];
                setMessages(defaultChat);
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
        user?.role,
        filteredPlacement,
        chooseRequestID,
        setIsHaveTwoChats,
        setHotelChats,
        setTitle,
        isFapMode,
    ]);

// console.log(messages);

    // Если объект "messages" изменился, устанавливаем счётчик непрочитанных из него (на случай refetch)
    useEffect(() => {
        if (messages?.unreadMessagesCount != null) {
            setNewMessagesCount(messages.unreadMessagesCount);
        }
    }, [messages, separator]);

    useEffect(() => {
        if (isInitialLoad && messages?.messages?.length) {
            const firstUnreadIndex = messages.messages.findIndex(
                msg => !isOwnMessage(msg) && !msg.readBy?.some(rb => rb.user.id === userID)
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

    useEffect(() => {
        setIsInitialLoad(true);
        if (isFapMode || chooseRequestID !== "" || chooseReserveID !== "") {
            refetch();
        }
    }, [separator, show, chooseRequestID, chooseReserveID, passengerRequestId]);
    

    useEffect(() => {
        setIsInitialLoad(true);
        if (isFapMode || chooseRequestID !== "" || chooseReserveID !== "") {
            refetch();
        }
      
        return () => {
          Object.values(observers.current).forEach((observer) => {
            observer.disconnect();
          });
          observers.current = {};
          messageRefs.current = {};
        };
    }, [separator, chooseRequestID, chooseReserveID, passengerRequestId]);

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

            if (
                !isOwnMessage(newMessage) &&
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
            if (!alreadyRead && !isExternal) {
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

    const [createRequest] = useMutation(
        isFapMode ? SEND_FAP_MESSAGE : UPDATE_MESSAGE_BRON,
        {
            context: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }
    );

    const handleSubmitMessage = async () => {
        if (messageText.text.trim()) {
            try {
                const vars = {
                    chatId: messageText.chatId,
                    text: messageText.text
                };
                if (messageText.senderId) {
                    vars.senderId = messageText.senderId;
                }
                let request = await createRequest({
                    variables: vars
                });
                if (request) {
                    if (!isExternal) {
                        markAllMessagesAsReadMutation({
                            variables: { chatId: messages.id, userId: userID }
                        })
                        .then(() => {
                            refetch();
                            scrollToBottom();
                        })
                    }
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

    const isOwnMessage = (msg) => {
        if (msg.sender?.id && msg.sender.id === userID) return true;
        if (msg.senderExternalUserId && msg.senderExternalUserId === userID) return true;
        if (isExternal && !msg.sender) return true;
        return false;
    };
    const getSenderId = (msg) => msg.sender?.id || msg.senderExternalUserId || (isExternal && !msg.sender ? userID : null);
    const getDisplayName = (msg) => msg.sender?.name || msg.senderName || "Пользователь";

    const getMessageItems = () => {
        if (!messages?.messages?.length) return [];
        const items = [];
        let lastDate = null;
        messages.messages.forEach((message, index) => {
            const msgDate = new Date(message.createdAt).toDateString();
            if (msgDate !== lastDate) {
                lastDate = msgDate;
                items.push({
                    type: 'date',
                    date: new Date(message.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    }),
                });
            }
            const prevMessage = messages.messages[index - 1];
            const isFirstInSenderGroup =
                !isOwnMessage(message) &&
                (!prevMessage || getSenderId(prevMessage) !== getSenderId(message));
            items.push({ type: 'message', message, isFirstInSenderGroup });
        });
        return items;
    };

    const getInitials = (name) => {
        if (!name || !name.trim()) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const messageItems = getMessageItems();

    return (
        <>
            {loading && <MUILoader loadSize={'50px'} fullHeight={'58vh'}/>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && messages?.messages && data && (
                <div className={classes.requestData} style={{ padding: chatPadding }}>
                    <div
                        className={classes.requestData_messages}
                        style={{ height: height ? `calc(100vh - ${height}px)` : chatHeight }}
                    >
                        {messageItems.map((item, idx) => {
                            if (item.type === 'date') {
                                return (
                                    <div key={`date-${idx}-${item.date}`} className={classes.requestData_date}>
                                        <span className={classes.requestData_date_info}>{item.date}</span>
                                    </div>
                                );
                            }
                            const { message, isFirstInSenderGroup } = item;
                            if (!messageRefs.current[message.id]) {
                                messageRefs.current[message.id] = React.createRef();
                            }
                            const isOwn = isOwnMessage(message);
                            const roleText = message.sender?.position?.name || message.sender?.role || '';

                            return (
                                <div
                                    className={`
                                        ${classes.requestData_message_full}
                                        ${isOwn ? classes.myMes : ''}
                                    `}
                                    key={message.id}
                                    ref={messageRefs.current[message.id]}
                                >
                                    <div className={classes.requestData_message}>
                                        {!isOwn && (
                                            <div className={classes.requestData_message_content}>
                                                {isFirstInSenderGroup ? (
                                                    <div
                                                        className={classes.requestData_message_firstGroup}
                                                        style={
                                                            message?.separator
                                                                ? { backgroundColor: '#3CBC6726', color: '#3B6C54' }
                                                                : {}
                                                        }
                                                    >
                                                        <div className={classes.requestData_message_firstRow}>
                                                            <div className={classes.requestData_message_avatar}>
                                                                {message.sender?.images?.[0] ? (
                                                                    <img
                                                                        src={getMediaUrl(message.sender.images[0])}
                                                                        alt={getDisplayName(message)}
                                                                        className={classes.requestData_message_avatarImg}
                                                                    />
                                                                ) : (
                                                                    <img
                                                                        src="/no-avatar.png"
                                                                        alt={getDisplayName(message)}
                                                                        className={classes.requestData_message_avatarImg}
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className={classes.requestData_message_text__name}>
                                                                <span className={classes.requestData_message_name}>
                                                                    {getDisplayName(message)}
                                                                </span>
                                                                {roleText && (
                                                                    <span className={classes.requestData_message_post}>
                                                                        {roleText}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className={`${classes.requestData_message__message} ${classes.bubbleIncoming} ${classes.bubbleIncomingFirstRow} ${!message?.separator ? classes.bubbleIncomingFirst : ''} ${message?.separator ? classes.bubbleSeparator : ''}`}
                                                            style={
                                                                message?.separator
                                                                    ? { backgroundColor: 'transparent', color: '#3B6C54' }
                                                                    : {}
                                                            }
                                                        >
                                                            <span className={classes.requestData_message_body}>{message.text}</span>
                                                        </div>
                                                        <span className={classes.requestData_message_timeBlock}>
                                                            {convertToDateNew(message.createdAt, true)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className={classes.requestData_message_continued}>
                                                        <div
                                                            className={`${classes.requestData_message__message} ${classes.bubbleIncoming}`}
                                                            style={
                                                                message?.separator
                                                                    ? { backgroundColor: '#3CBC6726', color: '#3B6C54' }
                                                                    : {}
                                                            }
                                                        >
                                                            <span className={classes.requestData_message_body}>{message.text}</span>
                                                            <span className={classes.requestData_message_time}>
                                                                {convertToDateNew(message.createdAt, true)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {isOwn && (
                                            <div
                                                className={`${classes.requestData_message__message} ${classes.bubbleOutgoing} ${classes.myMesBorderRadius}`}
                                                style={
                                                    message?.separator
                                                        ? { backgroundColor: '#3CBC6726', color: '#3B6C54' }
                                                        : {}
                                                }
                                            >
                                                <span className={classes.requestData_message_body}>{message.text}</span>
                                                <span className={classes.requestData_message_time}>
                                                    {convertToDateNew(message.createdAt, true)}
                                                </span>
                                            </div>
                                        )}
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
                                {/* 😀 */}
                                <SmileIcon />
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
                            placeholder="Сообщение..."
                            style={{ borderRadius: '20px' }}
                        />
                        <div 
                            className={classes.sendBlock_message} 
                            onClick={handleSubmitMessage}
                        >
                            {/* <img src="/message.png" alt="Отправить" /> */}
                            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.4" d="M14.2649 6.34496L27.1049 12.765C32.8649 15.645 32.8649 20.355 27.1049 23.235L14.2649 29.655C5.62491 33.975 2.09991 30.435 6.41991 21.81L7.72491 19.215C8.09991 18.45 8.09991 17.565 7.72491 16.8L6.41991 14.19C2.09991 5.56496 5.63991 2.02496 14.2649 6.34496Z" fill="#0057C3" />
                                <path d="M22.2599 19.125H14.1599C13.5449 19.125 13.0349 18.615 13.0349 18C13.0349 17.385 13.5449 16.875 14.1599 16.875H22.2599C22.8749 16.875 23.3849 17.385 23.3849 18C23.3849 18.615 22.8749 19.125 22.2599 19.125Z" fill="#0057C3" />
                            </svg>
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
// import SmileIcon from "../../../shared/icons/SmileIcon";

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
//     chooseRequestID = "",
//     chooseReserveID = "",
//     formData,
//     token,
//     user,
//     chatPadding,
//     chatHeight,
//     height,
//     ...props
// }) {
//     const messagesEndRef = useRef(null);
    
//     // Для хранения рефов на каждое сообщение
//     const messageRefs = useRef({});
//     // Для хранения IntersectionObserver на каждое сообщение
//     const observers = useRef({});

//     const [isInitialLoad, setIsInitialLoad] = useState(true);
//     const [showScrollButton, setShowScrollButton] = useState(false);
//     const [newMessagesCount, setNewMessagesCount] = useState(0);
//     const [isUserMessage, setIsUserMessage] = useState(false);

//     const userID = user?.userId ? user?.userId : user?.id;

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
//         skip: (chooseRequestID == "" && chooseReserveID == "") ? true: false
//     });


//     // Состояние для выбранного чата
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


//     // При загрузке/обновлении данных выбираем нужный чат и устанавливаем счётчик unreadMessagesCount
//     useEffect(() => {
//         if ((data && data.chats) || (filteredPlacement && filteredPlacement.length !== 0)) {
//             let selectedChats = [];
//             if (user?.airlineId) {
//                 selectedChats = data?.chats.filter(chat => chat.separator === 'airline');
//             } else if (user?.hotelId) {
//                 selectedChats = data?.chats.filter(chat => chat.separator === 'hotel');
//             } else if (user?.role === roles.superAdmin || user?.role === roles.dispatcerAdmin) {
//                 selectedChats = data?.chats.filter(chat => chat.separator === separator);
//             }

//             if (selectedChats?.length > 0) {
//                 const defaultChat = selectedChats[0];
//                 setMessages(defaultChat);
//                 // Устанавливаем локальный счётчик непрочитанных из сервера
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
//                     ? hotelChats?.find(chat => chat.hotelId === hotelChatId)
//                     : hotelChats[0];
//                 setMessages(chatToSelect);
//                 setTitle?.(chatToSelect?.hotel?.name);
//                 setNewMessagesCount(chatToSelect?.unreadMessagesCount || 0);
//             }
//         }
//     }, [
//         data,
//         separator,
//         hotelChatId,
//         user?.role,
//         filteredPlacement,
//         chooseRequestID,
//         setIsHaveTwoChats,
//         setHotelChats,
//         setTitle,
//     ]);

// // console.log(messages);

//     // Если объект "messages" изменился, устанавливаем счётчик непрочитанных из него (на случай refetch)
//     useEffect(() => {
//         if (messages?.unreadMessagesCount != null) {
//             setNewMessagesCount(messages.unreadMessagesCount);
//         }
//     }, [messages, separator]);

//     // При первой инициализации ИЛИ при изменении separator — скроллим к первому непрочитанному (если есть) или вниз
//     useEffect(() => {
//         if (isInitialLoad && messages?.messages?.length) {
//             const firstUnreadIndex = messages.messages.findIndex(
//                 msg => msg.sender.id !== userID && !msg.readBy?.some(rb => rb.user.id === userID)
//             );
//             if (firstUnreadIndex !== -1) {
//                 const firstUnreadId = messages.messages[firstUnreadIndex].id;
//                 scrollToFirstUnread(firstUnreadId);
//             } else {
//                 scrollToBottom();
//             }
//             setIsInitialLoad(false);
//         }
//     }, [isInitialLoad, messages?.messages, separator, userID]);

//     // Сбрасываем флаг isInitialLoad при смене separator, чтобы скролл произошёл вновь
//     useEffect(() => {
//         setIsInitialLoad(true);
//         if (chooseRequestID !== "" || chooseReserveID !== "") {
//             refetch();
//         }
//     }, [separator, show, chooseRequestID, chooseReserveID]);
    

//     useEffect(() => {
//         setIsInitialLoad(true);
//         if (chooseRequestID !== "" || chooseReserveID !== "") {
//             refetch();
//         }
      
//         return () => {
//           // Очищаем все IntersectionObserver, чтобы при новом монтировании всё пересоздать
//           Object.values(observers.current).forEach((observer) => {
//             observer.disconnect();
//           });
//           observers.current = {};
//           messageRefs.current = {};
//         };
//     }, [separator, chooseRequestID, chooseReserveID]);

//     // console.log(messages.messages.length);

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

//             // Если это чужое сообщение и оно не прочитано пользователем, увеличиваем локально счётчик
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
//             // setIsUserMessage(false);
//         }
//     }, [subscriptionData, userID, setMessageCount, separator]);

//     // Следим за "дном" чата, чтобы показать/скрыть кнопку прокрутки
//     useEffect(() => {
//         const observer = new IntersectionObserver(
//         ([entry]) => {
//             if (entry.isIntersecting) {
//             setShowScrollButton(false);
//             } else if (newMessagesCount > 0) {
//             setShowScrollButton(true);
//             }
//         },
//         { threshold: 1.0 }
//         );
//         const endElement = messagesEndRef.current;
//         if (endElement) {
//         observer.observe(endElement);
//         }
//         return () => {
//         if (endElement) {
//             observer.unobserve(endElement);
//         }
//         };
//     }, [newMessagesCount, separator]);
    
//     // Обновляем флаг отображения кнопки при изменении количества непрочитанных сообщений и separator
//     useEffect(() => {
//         setShowScrollButton(newMessagesCount > 0 && !isUserAtBottom());
//     }, [newMessagesCount, separator]);
  
    

//     // Подписываемся на IntersectionObserver для каждого непрочитанного сообщения
//     useEffect(() => {
//         if (!messages?.messages?.length) return;

//         messages.messages.forEach(msg => {
//             if (!messageRefs.current[msg.id]) {
//                 messageRefs.current[msg.id] = React.createRef();
//             }
//             const alreadyRead = msg.readBy?.some(rb => rb.user.id === userID);
//             // const isOwn = msg.sender.id === userID;
//             if (
//                 // !isOwn &&
//                  !alreadyRead) {
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
//     }, [messages, markMessageAsReadMutation, userID, refetch, separator]);

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
//                     })
//                     setMessageText({
//                         text: '',
//                         chatId: '',
//                         senderId: ''
//                     });
//                     setShowEmojiPicker(false);
//                     // setIsUserMessage(true);
//                     // Даем время на перерисовку компонента
//                     setTimeout(() => {
//                         scrollToBottom();
//                     }, 50);
//                     setShowScrollButton(false);
//                     setNewMessagesCount(0);
//                 }
//             } catch (err) {
//                 alert('Произошла ошибка при сохранении данных', err);
//                 console.error(err);
//             } finally {
//                     scrollToBottom();
//             }
//         }
//     };

//     const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//     const handleEmojiPickerShow = () => {
//         setShowEmojiPicker(!showEmojiPicker);
//     };

//     return (
//         <>
//             {loading && <MUILoader loadSize={'50px'} fullHeight={'58vh'}/>}
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
//                                 <div
//                                     className={`
//                                         ${classes.requestData_message_full}
//                                         ${message.sender.id === userID && classes.myMes}
//                                     `}
//                                     key={message.id}
//                                     ref={messageRefs.current[message.id]}
//                                 >
//                                     <div className={classes.requestData_message}>
//                                         <div className={classes.requestData_message_text}>
//                                             <div className={classes.requestData_message_text__name}>
//                                                 <div className={classes.requestData_message_name}>
//                                                     {message.sender.name}
//                                                 </div>
//                                                 <div className={classes.requestData_message_post}>
//                                                     {message.sender?.position}
//                                                 </div>
//                                             </div>
//                                             <div
//                                                 className={`
//                                                     ${classes.requestData_message__message}
//                                                     ${message.sender.id === userID ? classes.myMesBorderRadius : ''}
//                                                 `}
//                                                 style={
//                                                     message?.separator
//                                                         ? { backgroundColor: '#3CBC6726', color: '#3B6C54' }
//                                                         : {}
//                                                 }
//                                             >
//                                                 {message.text}
//                                             </div>
//                                             <div
//                                                 className={classes.requestData_message_time}
//                                                 style={message.sender.id === userID ? { textAlign: 'right' } : {}}
//                                             >
//                                                 {new Date(message.createdAt).toLocaleDateString("ru-RU", {
//                                                     day: "numeric",
//                                                     month: "long",
//                                                     year: "numeric",
//                                                 })}{" "}
//                                                 {convertToDate(message.createdAt, true)}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                         <div ref={messagesEndRef} />
//                     </div>

//                     {showScrollButton && newMessagesCount > 0 && (
//                         <div className={classes.scrollButton} onClick={scrollToUnread}>
//                             <span className={classes.scrollArrow}>↓</span>
//                             {/* {newMessagesCount > 0 && ( */}
//                                 <span className={classes.newMessagesCount}>{newMessagesCount}</span>
//                             {/* )} */}
//                         </div>
//                     )}

//                     <div className={classes.sendBlock}>
//                         <div className={classes.smiles}>
//                             <div className={classes.smilesBlock} onClick={handleEmojiPickerShow}>
//                                 {/* 😀 */}
//                                 <SmileIcon />
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
//                             placeholder="Сообщение..."
//                             style={{ borderRadius: '20px' }}
//                         />
//                         <div 
//                             // className={classes.sendBlock_message} 
//                             onClick={handleSubmitMessage}
//                         >
//                             {/* <img src="/message.png" alt="Отправить" /> */}
//                             <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                 <path opacity="0.4" d="M14.2649 6.34496L27.1049 12.765C32.8649 15.645 32.8649 20.355 27.1049 23.235L14.2649 29.655C5.62491 33.975 2.09991 30.435 6.41991 21.81L7.72491 19.215C8.09991 18.45 8.09991 17.565 7.72491 16.8L6.41991 14.19C2.09991 5.56496 5.63991 2.02496 14.2649 6.34496Z" fill="#0057C3" />
//                                 <path d="M22.2599 19.125H14.1599C13.5449 19.125 13.0349 18.615 13.0349 18C13.0349 17.385 13.5449 16.875 14.1599 16.875H22.2599C22.8749 16.875 23.3849 17.385 23.3849 18C23.3849 18.615 22.8749 19.125 22.2599 19.125Z" fill="#0057C3" />
//                             </svg>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// }

// export default Message;