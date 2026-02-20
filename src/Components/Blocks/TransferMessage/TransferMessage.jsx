import React, { useEffect, useRef, useState } from "react";
import classes from "./TransferMessage.module.css";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import Smiles from "../Smiles/Smiles";
import {
  convertToDate,
  GET_TRANSFER_CHATS,
  GET_TRANSFER_MESSAGES,
  MARK_TRANSFER_MESSAGE_AS_READ,
  MARK_ALL_TRANSFER_MESSAGES_AS_READ,
  SEND_TRANSFER_MESSAGE,
  TRANSFER_MESSAGE_SENT_SUBSCRIPTION,
} from "../../../../graphQL_requests";
import { roles } from "../../../roles";
import MUILoader from "../MUILoader/MUILoader";
import SmileIcon from "../../../shared/icons/SmileIcon";

// Типы чатов
const CHAT_TYPES = {
  DISPATCHER_DRIVER: "DISPATCHER_DRIVER",
  DISPATCHER_PERSONAL: "DISPATCHER_PERSONAL",
  DRIVER_PERSONAL: "DRIVER_PERSONAL",
};

// Типы актеров
const ACTOR_TYPES = {
  USER: "USER",
  DRIVER: "DRIVER",
  PERSONAL: "PERSONAL",
};

function TransferMessage({
  transferId,
  token,
  user,
  chatHeight,
  height,
  chatPadding,
  ...props
}) {
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const observers = useRef({});

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [selectedChatType, setSelectedChatType] = useState(CHAT_TYPES.DISPATCHER_DRIVER);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [availableChats, setAvailableChats] = useState([]);

  // Определяем тип текущего пользователя
  const getUserActorType = () => {
    if (user?.role === roles.superAdmin || user?.role === roles.dispatcerAdmin) {
      return ACTOR_TYPES.USER;
    }
    // TODO: добавить проверку для DRIVER и PERSONAL
    return ACTOR_TYPES.USER;
  };

  const userActorType = getUserActorType();
  const userID = user?.userId ? user?.userId : user?.id;

  // Получаем список чатов для трансфера
  const { loading: chatsLoading, data: chatsData, refetch: refetchChats } = useQuery(
    GET_TRANSFER_CHATS,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: { transferId },
      skip: !transferId,
      fetchPolicy: "network-only",
    }
  );

  // Получаем сообщения выбранного чата
  const { loading: messagesLoading, data: messagesData, refetch: refetchMessages } = useQuery(
    GET_TRANSFER_MESSAGES,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: { chatId: selectedChat?.id },
      skip: !selectedChat?.id,
      fetchPolicy: "network-only",
    }
  );


  // Подписка на новые сообщения
  const { data: subscriptionData } = useSubscription(TRANSFER_MESSAGE_SENT_SUBSCRIPTION, {
    variables: { transferId },
    skip: !transferId,
    onData: () => {
      refetchMessages();
      refetchChats();
    },
  });

  // Мутации
  const [markMessageAsReadMutation] = useMutation(MARK_TRANSFER_MESSAGE_AS_READ, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [markAllMessagesAsReadMutation] = useMutation(MARK_ALL_TRANSFER_MESSAGES_AS_READ, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [sendMessageMutation] = useMutation(SEND_TRANSFER_MESSAGE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Обработка данных чатов
  useEffect(() => {
    if (chatsData?.transferChats) {
      let chats = chatsData.transferChats;

      // Для диспетчера показываем только чаты с сотрудниками и водителем
      if (user?.role === roles.dispatcerAdmin || user?.role === roles.superAdmin) {
        chats = chats.filter(
          (chat) =>
            chat.type === CHAT_TYPES.DISPATCHER_DRIVER ||
            chat.type === CHAT_TYPES.DISPATCHER_PERSONAL
        );
      }

      setAvailableChats(chats);

      // Проверяем, доступен ли текущий выбранный чат после фильтрации
      if (selectedChat && !chats.find((chat) => chat.id === selectedChat.id)) {
        // Если выбранный чат был отфильтрован, сбрасываем выбор
        setSelectedChat(null);
      }

      // Автоматически выбираем первый доступный чат
      if (chats.length > 0 && !selectedChat) {
        const defaultChat = chats.find((chat) => chat.type === selectedChatType) || chats[0];
        setSelectedChat(defaultChat);
        setSelectedChatType(defaultChat.type);
      }
    }
  }, [chatsData, selectedChatType, selectedChat, user]);

  // Обработка сообщений
  useEffect(() => {
    if (messagesData?.transferMessages) {
      setMessages(messagesData.transferMessages);
      // Обновляем счетчик непрочитанных
      const unreadCount = messagesData.transferMessages.filter(
        (msg) =>
          msg.authorType !== userActorType &&
          !msg.readBy?.some((rb) => {
            if (userActorType === ACTOR_TYPES.USER) return rb.user?.id === userID;
            if (userActorType === ACTOR_TYPES.DRIVER) return rb.driver?.id === userID;
            if (userActorType === ACTOR_TYPES.PERSONAL) return rb.personal?.id === userID;
            return false;
          })
      ).length;
      setNewMessagesCount(unreadCount);
    }
  }, [messagesData, userActorType, userID]);

  // Скролл к первому непрочитанному сообщению при загрузке
  useEffect(() => {
    if (isInitialLoad && messages.length > 0) {
      const firstUnreadIndex = messages.findIndex(
        (msg) =>
          msg.authorType !== userActorType &&
          !msg.readBy?.some((rb) => {
            if (userActorType === ACTOR_TYPES.USER) return rb.user?.id === userID;
            if (userActorType === ACTOR_TYPES.DRIVER) return rb.driver?.id === userID;
            if (userActorType === ACTOR_TYPES.PERSONAL) return rb.personal?.id === userID;
            return false;
          })
      );
      if (firstUnreadIndex !== -1) {
        const firstUnreadId = messages[firstUnreadIndex].id;
        scrollToFirstUnread(firstUnreadId);
      } else {
        scrollToBottom();
      }
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, messages, userActorType, userID]);

  // Сброс при смене чата
  useEffect(() => {
    setIsInitialLoad(true);
    if (selectedChat?.id) {
      refetchMessages();
    }
  }, [selectedChat, selectedChatType]);

  // Очистка observers при размонтировании
  useEffect(() => {
    return () => {
      Object.values(observers.current).forEach((observer) => {
        observer.disconnect();
      });
      observers.current = {};
      messageRefs.current = {};
    };
  }, []);

  // Обработка новых сообщений из подписки
  useEffect(() => {
    if (subscriptionData?.transferMessageSent) {
      const newMessage = subscriptionData.transferMessageSent;
      if (newMessage.chatId !== selectedChat?.id) return;

      setMessages((prevMessages) => {
        const messageExists = prevMessages.some((msg) => msg.id === newMessage.id);
        if (!messageExists) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });

      // Увеличиваем счетчик, если это чужое сообщение
      if (
        newMessage.authorType !== userActorType &&
        !newMessage.readBy?.some((rb) => {
          if (userActorType === ACTOR_TYPES.USER) return rb.user?.id === userID;
          if (userActorType === ACTOR_TYPES.DRIVER) return rb.driver?.id === userID;
          if (userActorType === ACTOR_TYPES.PERSONAL) return rb.personal?.id === userID;
          return false;
        })
      ) {
        setNewMessagesCount((prev) => prev + 1);
        setTimeout(() => {
          if (!isUserAtBottom()) {
            setShowScrollButton(true);
          }
        }, 500);
      }
    }
  }, [subscriptionData, selectedChat, userActorType, userID]);

  // IntersectionObserver для автоматической отметки прочитанными
  useEffect(() => {
    if (!messages.length) return;

    messages.forEach((msg) => {
      if (!messageRefs.current[msg.id]) {
        messageRefs.current[msg.id] = React.createRef();
      }

      const alreadyRead = msg.readBy?.some((rb) => {
        if (userActorType === ACTOR_TYPES.USER) return rb.user?.id === userID;
        if (userActorType === ACTOR_TYPES.DRIVER) return rb.driver?.id === userID;
        if (userActorType === ACTOR_TYPES.PERSONAL) return rb.personal?.id === userID;
        return false;
      });

      if (!alreadyRead && msg.authorType !== userActorType) {
        if (!observers.current[msg.id]) {
          const obs = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
                const input = {
                  messageId: msg.id,
                  readerType: userActorType,
                };
                if (userActorType === ACTOR_TYPES.USER) input.userId = userID;
                if (userActorType === ACTOR_TYPES.DRIVER) input.driverId = userID;
                if (userActorType === ACTOR_TYPES.PERSONAL) input.personalId = userID;

                markMessageAsReadMutation({ variables: { input } })
                  .then(() => {
                    refetchMessages();
                  })
                  .catch((err) => console.error("Ошибка при отметке сообщения:", err));

                if (messageRefs.current[msg.id]?.current) {
                  obs.unobserve(messageRefs.current[msg.id].current);
                }
              }
            },
            { threshold: 0.7 }
          );
          if (messageRefs.current[msg.id]?.current) {
            obs.observe(messageRefs.current[msg.id].current);
          }
          observers.current[msg.id] = obs;
        }
      }
    });
  }, [messages, markMessageAsReadMutation, userActorType, userID, refetchMessages]);

  // Функции
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMessagesCount(0);
    setShowScrollButton(false);
  };

  const scrollToFirstUnread = (firstUnreadId) => {
    if (messageRefs.current[firstUnreadId]?.current) {
      messageRefs.current[firstUnreadId].current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const scrollToUnread = () => {
    if (!selectedChat?.id) return;
    const input = {
      chatId: selectedChat.id,
      readerType: userActorType,
    };
    if (userActorType === ACTOR_TYPES.USER) input.userId = userID;
    if (userActorType === ACTOR_TYPES.DRIVER) input.driverId = userID;
    if (userActorType === ACTOR_TYPES.PERSONAL) input.personalId = userID;

    markAllMessagesAsReadMutation({ variables: input })
      .then(() => {
        refetchMessages();
        scrollToBottom();
      })
      .catch((err) => console.error("Ошибка при отметке всех сообщений:", err));
  };

  const isUserAtBottom = () => {
    if (!messagesEndRef.current) return false;
    const { scrollHeight, scrollTop, clientHeight } = messagesEndRef.current.parentElement;
    return scrollHeight - scrollTop <= clientHeight + 10;
  };

  // Состояние для ввода сообщения
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiPickerShow = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleTextareaChange = (e) => {
    setMessageText(e.target.value);
  };

  const handleSmileChange = (emoji) => {
    setMessageText((prev) => prev + emoji);
  };

  const handleSubmitMessage = async () => {
    if (!messageText.trim() || !selectedChat?.id) return;

    try {
      const input = {
        chatId: selectedChat.id,
        text: messageText.trim(),
        authorType: userActorType,
      };
      if (userActorType === ACTOR_TYPES.USER) input.senderUserId = userID;
      if (userActorType === ACTOR_TYPES.DRIVER) input.senderDriverId = userID;
      if (userActorType === ACTOR_TYPES.PERSONAL) input.senderPersonalId = userID;

      await sendMessageMutation({ variables: { input } });

      // Отмечаем все как прочитанные после отправки
      const markReadInput = {
        chatId: selectedChat.id,
        readerType: userActorType,
      };
      if (userActorType === ACTOR_TYPES.USER) markReadInput.userId = userID;
      if (userActorType === ACTOR_TYPES.DRIVER) markReadInput.driverId = userID;
      if (userActorType === ACTOR_TYPES.PERSONAL) markReadInput.personalId = userID;

      await markAllMessagesAsReadMutation({ variables: markReadInput });

      setMessageText("");
      setShowEmojiPicker(false);
      setTimeout(() => {
        scrollToBottom();
      }, 50);
      setShowScrollButton(false);
      setNewMessagesCount(0);
      refetchMessages();
    } catch (err) {
      alert("Произошла ошибка при отправке сообщения");
      console.error(err);
    }
  };

  // Получаем имя отправителя
  const getSenderName = (message) => {
    if (message.senderUser) return message.senderUser.name;
    if (message.senderDriver) return message.senderDriver.name;
    if (message.senderPersonal) return message.senderPersonal.name;
    return "Неизвестно";
  };

  // Проверяем, является ли сообщение нашим
  const isMyMessage = (message) => {
    if (userActorType === ACTOR_TYPES.USER) return message.senderUser?.id === userID;
    if (userActorType === ACTOR_TYPES.DRIVER) return message.senderDriver?.id === userID;
    if (userActorType === ACTOR_TYPES.PERSONAL) return message.senderPersonal?.id === userID;
    return false;
  };

  // Названия типов чатов
  const getChatTypeLabel = (type) => {
    switch (type) {
      case CHAT_TYPES.DISPATCHER_DRIVER:
        return "Водитель";
      // return "Диспетчер ↔ Водитель";
      case CHAT_TYPES.DISPATCHER_PERSONAL:
        return "Сотрудники";
      // return "Диспетчер ↔ Пассажир";
      case CHAT_TYPES.DRIVER_PERSONAL:
        return "Водитель ↔ Пассажир";
      default:
        return type;
    }
  };

  if (chatsLoading || messagesLoading) {
    return <MUILoader loadSize={"50px"} fullHeight={"58vh"} />;
  }

  if (!transferId) {
    return <div className={classes.emptyState}>Выберите трансфер для просмотра чата</div>;
  }

  return (
    <>
      <div className={classes.requestData} style={{ padding: chatPadding, height: height ? `calc(100vh - ${height}px)` : chatHeight }}>
        {/* Выбор типа чата */}
        {availableChats.length > 0 && (
          <div className={classes.chatTypeSelector}>
            {availableChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setSelectedChat(chat);
                  setSelectedChatType(chat.type);
                }}
                className={`${classes.chatTypeButton} ${selectedChat?.id === chat.id ? classes.active : ""
                  }`}
              >
                {getChatTypeLabel(chat.type)}
              </button>
            ))}
          </div>
        )}

        <div
          className={classes.requestData_messages}
        // style={{ height: height ? `calc(100vh - ${height}px)` : chatHeight }}
        >
          {messages.map((message) => {
            if (!messageRefs.current[message.id]) {
              messageRefs.current[message.id] = React.createRef();
            }
            const isMy = isMyMessage(message);
            return (
              <div
                className={`${classes.requestData_message_full} ${isMy ? classes.myMes : ""}`}
                key={message.id}
                ref={messageRefs.current[message.id]}
              >
                <div className={classes.requestData_message}>
                  <div className={classes.requestData_message_text}>
                    <div className={classes.requestData_message_text__name}>
                      <div className={classes.requestData_message_name}>
                        {getSenderName(message)}
                      </div>
                      <div className={classes.requestData_message_post}>
                        {message.authorType === ACTOR_TYPES.USER
                          ? "Диспетчер"
                          : message.authorType === ACTOR_TYPES.DRIVER
                            ? "Водитель"
                            : "Пассажир"}
                      </div>
                    </div>
                    <div
                      className={`${classes.requestData_message__message} ${isMy ? classes.myMesBorderRadius : ""
                        }`}
                    >
                      {message.text}
                    </div>
                    <div
                      className={classes.requestData_message_time}
                      style={isMy ? { textAlign: "right" } : {}}
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
            <span className={classes.newMessagesCount}>{newMessagesCount}</span>
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
            // className={classes.sendBlock_message} 
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
    </>
  );
}

export default TransferMessage;

