import React, { useEffect, useRef, useState } from "react";
import classes from "./SupportMessage.module.css";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import Smiles from "../Smiles/Smiles";
import {
  convertToDate,
  CLAIM_SUPPORT_TICKET,
  GET_USER_SUPPORT_CHAT,
  MARK_ALL_MESSAGES_AS_READ,
  MARK_MESSAGE_AS_READ,
  MESSAGE_SENT_SUBSCRIPTION,
  REQUEST_MESSAGES_SUBSCRIPTION,
  RESOLVE_SUPPORT_TICKET,
  UPDATE_MESSAGE_BRON,
  server,
} from "../../../../graphQL_requests";
import { roles } from "../../../roles";
import MUILoader from "../MUILoader/MUILoader";
import SmileIcon from "../../../shared/icons/SmileIcon";

function SupportMessage({
  children,
  formData,
  token,
  user,
  selectedId,
  chatPadding,
  chatHeight,
  supportRefetch,
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
  const [messages, setMessages] = useState({ messages: [] });

  // console.log(user?.id);

  const userID = selectedId ? selectedId : user?.id;

  const { loading, error, data, refetch } = useQuery(GET_USER_SUPPORT_CHAT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      userId: userID,
    },
    fetchPolicy: "network-only",
    skip: userID ? false : true,
  });

  const chatState = data?.userSupportChat ?? messages;
  const chatMessages = chatState?.messages || [];

  const isSupportAgent = user?.support === true;
  const supportStatus = chatState?.supportStatus || "OPEN";
  const assignedToId = chatState?.assignedTo?.id;
  const isAssignedToMe = assignedToId && assignedToId === user?.id;
  const canClaim =
    isSupportAgent && supportStatus === "OPEN" && !isAssignedToMe;
  const canResolve =
    isSupportAgent && supportStatus === "IN_PROGRESS" && isAssignedToMe;
  const canSendMessage = !isSupportAgent || isAssignedToMe;

  const statusLabelMap = {
    OPEN: "Открыт",
    IN_PROGRESS: "В работе",
    RESOLVED: "Решён",
  };
  const statusLabel = statusLabelMap[supportStatus] || "Открыт";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMessagesCount(0);
    setShowScrollButton(false);
  };

  // Мутация для отметки всех сообщений как прочитанных
  const [markAllMessagesAsReadMutation] = useMutation(
    MARK_ALL_MESSAGES_AS_READ,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  // При клике помечаем все сообщения как прочитанные и обновляем данные
  const scrollToUnread = () => {
    if (!chatState?.id) return;
    markAllMessagesAsReadMutation({
      variables: { chatId: chatState?.id, userId: user.id },
    })
      .then(() => {
        refetch();
        scrollToBottom();
      })
      .catch((err) =>
        console.error("Ошибка при отметке всех сообщений как прочитанных:", err)
      );
  };

  const isUserAtBottom = () => {
    if (!messagesEndRef.current) return false;
    const { scrollHeight, scrollTop, clientHeight } =
      messagesEndRef.current.parentElement;
    return scrollHeight - scrollTop <= clientHeight + 10;
  };

  // console.log(data?.userSupportChat?.id);

  // Мутация для отметки отдельного сообщения как прочитанного
  const [markMessageAsReadMutation] = useMutation(MARK_MESSAGE_AS_READ, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [claimSupportTicket] = useMutation(CLAIM_SUPPORT_TICKET, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [resolveSupportTicket] = useMutation(RESOLVE_SUPPORT_TICKET, {
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
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const { data: subscriptionData } = useSubscription(
    MESSAGE_SENT_SUBSCRIPTION,
    // REQUEST_MESSAGES_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      // variables: { chatId: data?.userSupportChat?.id },
      onData: () => {
        refetch();
      },
    }
  );
  // console.log(subscriptionData);

  useEffect(() => {
    if (data && data.userSupportChat) {
      setMessages(data.userSupportChat);
      // if (isInitialLoad) {
      //   setTimeout(() => {
      //     scrollToBottom();
      //   }, 0);
      //   setIsInitialLoad(false);
      // }
    }
  }, [data]);

  useEffect(() => {
    if (chatState?.unreadMessagesCount != null) {
      setNewMessagesCount(chatState.unreadMessagesCount);
    }
  }, [chatState?.unreadMessagesCount]);

  // console.log(messages);


  useEffect(() => {
    if (isInitialLoad && chatMessages.length) {
      const firstUnreadIndex = chatMessages.findIndex(
        (msg) =>
          msg.sender.id !== user.id &&
          !msg.readBy?.some((rb) => rb.user.id === user.id)
      );
      if (firstUnreadIndex !== -1) {
        const firstUnreadId = chatMessages[firstUnreadIndex].id;
        scrollToFirstUnread(firstUnreadId);
      } else {
        scrollToBottom();
      }
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, chatMessages, user?.id]);

  useEffect(() => {
    setIsInitialLoad(true);
    if (user?.id !== "") {
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
  }, [user?.id]);

  // useEffect(() => {
  //     setTimeout(() => {
  //         scrollToBottom();
  //     }, 0);
  // }, [data])

  useEffect(() => {
    if (subscriptionData) {
      const newMessage = subscriptionData.messageSent;
      if (!newMessage?.sender || !Array.isArray(newMessage?.readBy)) {
        refetch();
        return;
      }
      if (newMessage.chatId && chatState?.id && newMessage.chatId !== chatState?.id) return;
      setMessages((prevMessages) => {
        const messageExists = prevMessages.messages.some(
          (message) => message.id === newMessage.id
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
        newMessage.sender?.id !== user.id &&
        !newMessage.readBy?.some((rb) => rb?.user?.id === user.id)
      ) {
        setNewMessagesCount((prevCount) => prevCount + 1);
        setTimeout(() => {
          if (!isUserAtBottom()) {
            setShowScrollButton(true);
          }
        }, 500);
      }
      // setIsUserMessage(false);
    }
  }, [subscriptionData, user?.id]);

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
  }, [newMessagesCount]);

  useEffect(() => {
    setShowScrollButton(newMessagesCount > 0 && !isUserAtBottom());
  }, [newMessagesCount]);

  // Подписываемся на IntersectionObserver для каждого непрочитанного сообщения
  useEffect(() => {
    if (!chatMessages.length) return;

    chatMessages.forEach((msg) => {
      if (!messageRefs.current[msg.id]) {
        messageRefs.current[msg.id] = React.createRef();
      }
      const alreadyRead = msg.readBy?.some((rb) => rb.user.id === user.id);
      // const isOwn = msg.sender.id === user.id;
      if (
        // !isOwn &&
        !alreadyRead
      ) {
        if (!observers.current[msg.id]) {
          const obs = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
                markMessageAsReadMutation({
                  variables: { messageId: msg.id, userId: user.id },
                })
                  .then(() => {
                    refetch();
                  })
                  .catch((err) =>
                    console.error(
                      "Ошибка при отметке сообщения как прочитанного:",
                      err
                    )
                  );

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
  }, [chatMessages, markMessageAsReadMutation, user?.id, refetch]);

  const [messageText, setMessageText] = useState({
    text: "",
    chatId: "",
    senderId: "",
  });

  const handleTextareaChange = (e) => {
    setMessageText({
      senderId: user.id,
      chatId: chatState?.id,
      text: e.target.value,
    });
  };

  // console.log(messages);
  useEffect(() => {
    if (newMessagesCount <= 0) {
      supportRefetch ? supportRefetch() : null
    }
  }, [newMessagesCount])

  const handleSmileChange = (emoji) => {
    setMessageText((prevState) => ({
      senderId: user.id,
      chatId: chatState?.id,
      text: prevState.text + emoji,
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
    if (!canSendMessage) {
      alert("Возьмите тикет в работу, чтобы отвечать пользователю.");
      return;
    }
    if (messageText.text.trim()) {
      try {
        let request = await createRequest({
          variables: {
            chatId: messageText.chatId,
            senderId: messageText.senderId,
            text: messageText.text,
          },
        });
        if (request) {
          // markAllMessagesAsReadMutation({
          //   variables: { chatId: data?.userSupportChat?.id, userId: user.id },
          // }).then(() => {
          //   refetch();
          //   scrollToBottom();
          // });
          if (chatState?.id) {
            await markAllMessagesAsReadMutation({
              variables: { chatId: chatState.id, userId: user.id },
            });
          }
          await refetch();
          // После refetch данные обновлены, но возможно, DOM еще не обновился.
          // Поэтому используем setTimeout для прокрутки после обновления DOM.
          setTimeout(() => {
            scrollToBottom();
          }, 0);
          setMessageText({
            text: "",
            chatId: "",
            senderId: "",
          });
          setShowEmojiPicker(false);
          // setIsUserMessage(true);
          // Даем время на перерисовку компонента
          // setTimeout(() => {
          //   scrollToBottom();
          // }, 50);
          setShowScrollButton(false);
          setNewMessagesCount(0);
        }
      } catch (err) {
        alert("Произошла ошибка при сохранении данных", err);
        console.error(err);
      } finally {
        scrollToBottom();
      }
    }
  };

  const handleClaimTicket = async () => {
    if (!chatState?.id) return;
    try {
      await claimSupportTicket({
        variables: { chatId: chatState.id },
      });
      await refetch();
      supportRefetch?.();
    } catch (err) {
      console.error("Ошибка при взятии тикета в работу:", err);
    }
  };

  const handleResolveTicket = async () => {
    if (!chatState?.id) return;
    try {
      await resolveSupportTicket({
        variables: { chatId: chatState.id },
      });
      await refetch();
      supportRefetch?.();
    } catch (err) {
      console.error("Ошибка при закрытии тикета:", err);
    }
  };


  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiPickerShow = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Группировка сообщений по дате и определение "первого в серии" по отправителю
  const getMessageItems = () => {
    if (!chatMessages?.length) return [];
    const items = [];
    let lastDate = null;
    chatMessages.forEach((message, index) => {
      const msgDate = new Date(message.createdAt).toDateString();
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        items.push({
          type: "date",
          date: new Date(message.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        });
      }
      const prevMessage = chatMessages[index - 1];
      const isFirstInSenderGroup =
        message.sender?.id !== user?.id &&
        (!prevMessage || prevMessage.sender?.id !== message.sender?.id);
      items.push({ type: "message", message, isFirstInSenderGroup });
    });
    return items;
  };

  const messageItems = getMessageItems();

  return (
    <>
      {loading && <MUILoader loadSize={"50px"} fullHeight={"78vh"} />}
      {error && <p>Error: {error.message}</p>}

      {!loading && !error && chatState && (
        <div className={classes.requestData}>
          <div className={classes.ticketHeader}>
            <div className={classes.ticketMeta}>
              <span className={classes.ticketBadge}>{statusLabel}</span>
              <span>
                Исполнитель:{" "}
                {chatState?.assignedTo?.name
                  ? chatState.assignedTo.name
                  : "Не назначен"}
              </span>
              {chatState?.resolvedBy?.name && (
                <span>Закрыл: {chatState.resolvedBy.name}</span>
              )}
            </div>
            {isSupportAgent && (canClaim || canResolve) && (
              <div className={classes.ticketActions}>
                {canClaim && (
                  <button
                    type="button"
                    className={classes.ticketButton}
                    onClick={handleClaimTicket}
                  >
                    Взять в работу
                  </button>
                )}
                {canResolve && (
                  <button
                    type="button"
                    className={classes.ticketButtonSecondary}
                    onClick={handleResolveTicket}
                  >
                    Закрыть
                  </button>
                )}
              </div>
            )}
          </div>
          <div className={classes.requestData_messages}>
            {messageItems.map((item, idx) => {
              if (item.type === "date") {
                return (
                  <div
                    key={`date-${idx}-${item.date}`}
                    className={classes.requestData_date}
                  >
                    <span className={classes.requestData_date_info}>
                      {item.date}
                    </span>
                  </div>
                );
              }
              const { message, isFirstInSenderGroup } = item;
              if (!messageRefs.current[message.id]) {
                messageRefs.current[message.id] = React.createRef();
              }
              const isOwn = message.sender?.id === user?.id;
              const roleText =
                message.sender?.position?.name ||
                (message.sender?.role === roles.superAdmin
                  ? "Техническая поддержка"
                  : message.sender?.role || "");

              return (
                <div
                  className={`${classes.requestData_message_full} ${isOwn ? classes.myMes : ""}`}
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
                                ? {
                                    backgroundColor: "#3CBC6726",
                                    color: "#3B6C54",
                                  }
                                : {}
                            }
                          >
                            <div
                              className={
                                classes.requestData_message_firstRow
                              }
                            >
                              <div
                                className={classes.requestData_message_avatar}
                              >
                                {message.sender?.images?.[0] ? (
                                  <img
                                    src={`${server}${message.sender.images[0]}`}
                                    alt={message.sender?.name}
                                    className={
                                      classes.requestData_message_avatarImg
                                    }
                                  />
                                ) : (
                                  <img
                                    src="/no-avatar.png"
                                    alt={message.sender?.name}
                                    className={
                                      classes.requestData_message_avatarImg
                                    }
                                  />
                                )}
                              </div>
                              <div
                                className={
                                  classes.requestData_message_text__name
                                }
                              >
                                <span
                                  className={classes.requestData_message_name}
                                >
                                  {message.sender?.name}
                                </span>
                                {roleText && (
                                  <span
                                    className={
                                      classes.requestData_message_post
                                    }
                                  >
                                    {roleText}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div
                              className={`${classes.requestData_message__message} ${classes.bubbleIncoming} ${classes.bubbleIncomingFirstRow} ${!message?.separator ? classes.bubbleIncomingFirst : ""} ${message?.separator ? classes.bubbleSeparator : ""}`}
                              style={
                                message?.separator
                                  ? {
                                      backgroundColor: "#3CBC6726",
                                      color: "#3B6C54",
                                    }
                                  : {}
                              }
                            >
                              <span
                                className={classes.requestData_message_body}
                              >
                                {message.text}
                              </span>
                            </div>
                            <span
                              className={
                                classes.requestData_message_timeBlock
                              }
                            >
                              {convertToDate(message.createdAt, true)}
                            </span>
                          </div>
                        ) : (
                          <div
                            className={
                              classes.requestData_message_continued
                            }
                          >
                            <div
                              className={`${classes.requestData_message__message} ${classes.bubbleIncoming}`}
                              style={
                                message?.separator
                                  ? {
                                      backgroundColor: "#3CBC6726",
                                      color: "#3B6C54",
                                    }
                                  : {}
                              }
                            >
                              <span
                                className={classes.requestData_message_body}
                              >
                                {message.text}
                              </span>
                              <span
                                className={classes.requestData_message_time}
                              >
                                {convertToDate(message.createdAt, true)}
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
                            ? {
                                backgroundColor: "#3CBC6726",
                                color: "#3B6C54",
                              }
                            : {}
                        }
                      >
                        <span
                          className={classes.requestData_message_body}
                        >
                          {message.text}
                        </span>
                        <span
                          className={classes.requestData_message_time}
                        >
                          {convertToDate(message.createdAt, true)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* {showScrollButton && (
            <div className={classes.scrollButton} onClick={scrollToBottom}>
              <span className={classes.scrollArrow}>↓</span>
              {newMessagesCount > 0 && (
                <span className={classes.newMessagesCount}>
                  {newMessagesCount}
                </span>
              )}
            </div>
          )} */}
          {showScrollButton && newMessagesCount > 0 && (
            <div className={classes.scrollButton} onClick={scrollToUnread}>
              <span className={classes.scrollArrow}>↓</span>
              {/* {newMessagesCount > 0 && ( */}
              <span className={classes.newMessagesCount}>
                {newMessagesCount}
              </span>
              {/* )} */}
            </div>
          )}

          <div className={classes.sendBlock}>
            <div className={classes.smiles}>
              <div
                className={classes.smilesBlock}
                onClick={handleEmojiPickerShow}
              >
                {/* 😀 */}
                <SmileIcon />
              </div>
              {showEmojiPicker && (
                <Smiles handleSmileChange={handleSmileChange} />
              )}
            </div>
            <input
              type="text"
              value={messageText.text}
              onChange={handleTextareaChange}
              disabled={!canSendMessage}
              placeholder="Сообщение..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmitMessage();
                }
              }}
              style={{ borderRadius: "20px" }}
            />
            <div
              // className={classes.sendBlock_message}
              onClick={handleSubmitMessage}
              style={{ opacity: canSendMessage ? 0.8 : 0.4, cursor: canSendMessage ? "pointer" : "not-allowed", display: "flex", alignItems: 'center' }}
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

export default SupportMessage;


// import React, { useEffect, useRef, useState } from "react";
// import classes from "./SupportMessage.module.css";
// import { useMutation, useQuery, useSubscription } from "@apollo/client";
// import Smiles from "../Smiles/Smiles";
// import {
//   convertToDate,
//   CLAIM_SUPPORT_TICKET,
//   GET_USER_SUPPORT_CHAT,
//   MARK_ALL_MESSAGES_AS_READ,
//   MARK_MESSAGE_AS_READ,
//   MESSAGE_SENT_SUBSCRIPTION,
//   REQUEST_MESSAGES_SUBSCRIPTION,
//   RESOLVE_SUPPORT_TICKET,
//   UPDATE_MESSAGE_BRON,
// } from "../../../../graphQL_requests";
// import { roles } from "../../../roles";
// import MUILoader from "../MUILoader/MUILoader";
// import SmileIcon from "../../../shared/icons/SmileIcon";

// function SupportMessage({
//   children,
//   formData,
//   token,
//   user,
//   selectedId,
//   chatPadding,
//   chatHeight,
//   supportRefetch,
//   height,
//   ...props
// }) {
//   const messagesEndRef = useRef(null);

//   // Для хранения рефов на каждое сообщение
//   const messageRefs = useRef({});
//   // Для хранения IntersectionObserver на каждое сообщение
//   const observers = useRef({});

//   const [isInitialLoad, setIsInitialLoad] = useState(true);
//   const [showScrollButton, setShowScrollButton] = useState(false);
//   const [newMessagesCount, setNewMessagesCount] = useState(0);
//   const [isUserMessage, setIsUserMessage] = useState(false);
//   const [messages, setMessages] = useState({ messages: [] });

//   // console.log(user?.id);

//   const userID = selectedId ? selectedId : user?.id;

//   const { loading, error, data, refetch } = useQuery(GET_USER_SUPPORT_CHAT, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//     variables: {
//       userId: userID,
//     },
//     fetchPolicy: "network-only",
//     skip: userID ? false : true,
//   });

//   const chatState = data?.userSupportChat ?? messages;
//   const chatMessages = chatState?.messages || [];

//   const isSupportAgent = user?.support === true;
//   const supportStatus = chatState?.supportStatus || "OPEN";
//   const assignedToId = chatState?.assignedTo?.id;
//   const isAssignedToMe = assignedToId && assignedToId === user?.id;
//   const canClaim =
//     isSupportAgent && supportStatus === "OPEN" && !isAssignedToMe;
//   const canResolve =
//     isSupportAgent && supportStatus === "IN_PROGRESS" && isAssignedToMe;
//   const canSendMessage = !isSupportAgent || isAssignedToMe;

//   const statusLabelMap = {
//     OPEN: "Открыт",
//     IN_PROGRESS: "В работе",
//     RESOLVED: "Решён",
//   };
//   const statusLabel = statusLabelMap[supportStatus] || "Открыт";

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     setNewMessagesCount(0);
//     setShowScrollButton(false);
//   };

//   // Мутация для отметки всех сообщений как прочитанных
//   const [markAllMessagesAsReadMutation] = useMutation(
//     MARK_ALL_MESSAGES_AS_READ,
//     {
//       context: {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       },
//     }
//   );

//   // При клике помечаем все сообщения как прочитанные и обновляем данные
//   const scrollToUnread = () => {
//     if (!chatState?.id) return;
//     markAllMessagesAsReadMutation({
//       variables: { chatId: chatState?.id, userId: user.id },
//     })
//       .then(() => {
//         refetch();
//         scrollToBottom();
//       })
//       .catch((err) =>
//         console.error("Ошибка при отметке всех сообщений как прочитанных:", err)
//       );
//   };

//   const isUserAtBottom = () => {
//     if (!messagesEndRef.current) return false;
//     const { scrollHeight, scrollTop, clientHeight } =
//       messagesEndRef.current.parentElement;
//     return scrollHeight - scrollTop <= clientHeight + 10;
//   };

//   // console.log(data?.userSupportChat?.id);

//   // Мутация для отметки отдельного сообщения как прочитанного
//   const [markMessageAsReadMutation] = useMutation(MARK_MESSAGE_AS_READ, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   const [claimSupportTicket] = useMutation(CLAIM_SUPPORT_TICKET, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   const [resolveSupportTicket] = useMutation(RESOLVE_SUPPORT_TICKET, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   // Функция прокрутки к первому непрочитанному сообщению
//   const scrollToFirstUnread = (firstUnreadId) => {
//     if (messageRefs.current[firstUnreadId]?.current) {
//       messageRefs.current[firstUnreadId].current.scrollIntoView({
//         behavior: "smooth",
//         block: "center",
//       });
//     }
//   };

//   const { data: subscriptionData } = useSubscription(
//     MESSAGE_SENT_SUBSCRIPTION,
//     // REQUEST_MESSAGES_SUBSCRIPTION,
//     {
//       context: {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       },
//       // variables: { chatId: data?.userSupportChat?.id },
//       onData: () => {
//         refetch();
//       },
//     }
//   );
//   // console.log(subscriptionData);

//   useEffect(() => {
//     if (data && data.userSupportChat) {
//       setMessages(data.userSupportChat);
//       // if (isInitialLoad) {
//       //   setTimeout(() => {
//       //     scrollToBottom();
//       //   }, 0);
//       //   setIsInitialLoad(false);
//       // }
//     }
//   }, [data]);

//   useEffect(() => {
//     if (chatState?.unreadMessagesCount != null) {
//       setNewMessagesCount(chatState.unreadMessagesCount);
//     }
//   }, [chatState?.unreadMessagesCount]);

//   // console.log(messages);


//   useEffect(() => {
//     if (isInitialLoad && chatMessages.length) {
//       const firstUnreadIndex = chatMessages.findIndex(
//         (msg) =>
//           msg.sender.id !== user.id &&
//           !msg.readBy?.some((rb) => rb.user.id === user.id)
//       );
//       if (firstUnreadIndex !== -1) {
//         const firstUnreadId = chatMessages[firstUnreadIndex].id;
//         scrollToFirstUnread(firstUnreadId);
//       } else {
//         scrollToBottom();
//       }
//       setIsInitialLoad(false);
//     }
//   }, [isInitialLoad, chatMessages, user?.id]);

//   useEffect(() => {
//     setIsInitialLoad(true);
//     if (user?.id !== "") {
//       refetch();
//     }

//     return () => {
//       // Очищаем все IntersectionObserver, чтобы при новом монтировании всё пересоздать
//       Object.values(observers.current).forEach((observer) => {
//         observer.disconnect();
//       });
//       observers.current = {};
//       messageRefs.current = {};
//     };
//   }, [user?.id]);

//   // useEffect(() => {
//   //     setTimeout(() => {
//   //         scrollToBottom();
//   //     }, 0);
//   // }, [data])

//   useEffect(() => {
//     if (subscriptionData) {
//       const newMessage = subscriptionData.messageSent;
//       if (!newMessage?.sender || !Array.isArray(newMessage?.readBy)) {
//         refetch();
//         return;
//       }
//       if (newMessage.chatId && chatState?.id && newMessage.chatId !== chatState?.id) return;
//       setMessages((prevMessages) => {
//         const messageExists = prevMessages.messages.some(
//           (message) => message.id === newMessage.id
//         );
//         if (!messageExists) {
//           return {
//             ...prevMessages,
//             messages: [...prevMessages.messages, newMessage],
//           };
//         }
//         return prevMessages;
//       });

//       // Если это чужое сообщение и оно не прочитано пользователем, увеличиваем локально счётчик
//       if (
//         newMessage.sender?.id !== user.id &&
//         !newMessage.readBy?.some((rb) => rb?.user?.id === user.id)
//       ) {
//         setNewMessagesCount((prevCount) => prevCount + 1);
//         setTimeout(() => {
//           if (!isUserAtBottom()) {
//             setShowScrollButton(true);
//           }
//         }, 500);
//       }
//       // setIsUserMessage(false);
//     }
//   }, [subscriptionData, user?.id]);

//   // Следим за "дном" чата, чтобы показать/скрыть кнопку прокрутки
//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setShowScrollButton(false);
//         } else if (newMessagesCount > 0) {
//           setShowScrollButton(true);
//         }
//       },
//       { threshold: 1.0 }
//     );
//     const endElement = messagesEndRef.current;
//     if (endElement) {
//       observer.observe(endElement);
//     }
//     return () => {
//       if (endElement) {
//         observer.unobserve(endElement);
//       }
//     };
//   }, [newMessagesCount]);

//   useEffect(() => {
//     setShowScrollButton(newMessagesCount > 0 && !isUserAtBottom());
//   }, [newMessagesCount]);

//   // Подписываемся на IntersectionObserver для каждого непрочитанного сообщения
//   useEffect(() => {
//     if (!chatMessages.length) return;

//     chatMessages.forEach((msg) => {
//       if (!messageRefs.current[msg.id]) {
//         messageRefs.current[msg.id] = React.createRef();
//       }
//       const alreadyRead = msg.readBy?.some((rb) => rb.user.id === user.id);
//       // const isOwn = msg.sender.id === user.id;
//       if (
//         // !isOwn &&
//         !alreadyRead
//       ) {
//         if (!observers.current[msg.id]) {
//           const obs = new IntersectionObserver(
//             ([entry]) => {
//               if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
//                 markMessageAsReadMutation({
//                   variables: { messageId: msg.id, userId: user.id },
//                 })
//                   .then(() => {
//                     refetch();
//                   })
//                   .catch((err) =>
//                     console.error(
//                       "Ошибка при отметке сообщения как прочитанного:",
//                       err
//                     )
//                   );

//                 if (messageRefs.current[msg.id]?.current) {
//                   obs.unobserve(messageRefs.current[msg.id].current);
//                 }
//               }
//             },
//             { threshold: 0.7 }
//           );
//           if (messageRefs.current[msg.id]?.current) {
//             obs.observe(messageRefs.current[msg.id].current);
//           }
//           observers.current[msg.id] = obs;
//         }
//       }
//     });
//   }, [chatMessages, markMessageAsReadMutation, user?.id, refetch]);

//   const [messageText, setMessageText] = useState({
//     text: "",
//     chatId: "",
//     senderId: "",
//   });

//   const handleTextareaChange = (e) => {
//     setMessageText({
//       senderId: user.id,
//       chatId: chatState?.id,
//       text: e.target.value,
//     });
//   };

//   // console.log(messages);
//   useEffect(() => {
//     if (newMessagesCount <= 0) {
//       supportRefetch ? supportRefetch() : null
//     }
//   }, [newMessagesCount])

//   const handleSmileChange = (emoji) => {
//     setMessageText((prevState) => ({
//       senderId: user.id,
//       chatId: chatState?.id,
//       text: prevState.text + emoji,
//     }));
//   };

//   const [createRequest] = useMutation(UPDATE_MESSAGE_BRON, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   const handleSubmitMessage = async () => {
//     if (!canSendMessage) {
//       alert("Возьмите тикет в работу, чтобы отвечать пользователю.");
//       return;
//     }
//     if (messageText.text.trim()) {
//       try {
//         let request = await createRequest({
//           variables: {
//             chatId: messageText.chatId,
//             senderId: messageText.senderId,
//             text: messageText.text,
//           },
//         });
//         if (request) {
//           // markAllMessagesAsReadMutation({
//           //   variables: { chatId: data?.userSupportChat?.id, userId: user.id },
//           // }).then(() => {
//           //   refetch();
//           //   scrollToBottom();
//           // });
//           if (chatState?.id) {
//             await markAllMessagesAsReadMutation({
//               variables: { chatId: chatState.id, userId: user.id },
//             });
//           }
//           await refetch();
//           // После refetch данные обновлены, но возможно, DOM еще не обновился.
//           // Поэтому используем setTimeout для прокрутки после обновления DOM.
//           setTimeout(() => {
//             scrollToBottom();
//           }, 0);
//           setMessageText({
//             text: "",
//             chatId: "",
//             senderId: "",
//           });
//           setShowEmojiPicker(false);
//           // setIsUserMessage(true);
//           // Даем время на перерисовку компонента
//           // setTimeout(() => {
//           //   scrollToBottom();
//           // }, 50);
//           setShowScrollButton(false);
//           setNewMessagesCount(0);
//         }
//       } catch (err) {
//         alert("Произошла ошибка при сохранении данных", err);
//         console.error(err);
//       } finally {
//         scrollToBottom();
//       }
//     }
//   };

//   const handleClaimTicket = async () => {
//     if (!chatState?.id) return;
//     try {
//       await claimSupportTicket({
//         variables: { chatId: chatState.id },
//       });
//       await refetch();
//       supportRefetch?.();
//     } catch (err) {
//       console.error("Ошибка при взятии тикета в работу:", err);
//     }
//   };

//   const handleResolveTicket = async () => {
//     if (!chatState?.id) return;
//     try {
//       await resolveSupportTicket({
//         variables: { chatId: chatState.id },
//       });
//       await refetch();
//       supportRefetch?.();
//     } catch (err) {
//       console.error("Ошибка при закрытии тикета:", err);
//     }
//   };


//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);

//   const handleEmojiPickerShow = () => {
//     setShowEmojiPicker(!showEmojiPicker);
//   };

//   return (
//     <>
//       {loading && <MUILoader loadSize={"50px"} fullHeight={"78vh"} />}
//       {error && <p>Error: {error.message}</p>}

//       {!loading && !error && chatState && (
//         <div className={classes.requestData}>
//           <div className={classes.ticketHeader}>
//             <div className={classes.ticketMeta}>
//               <span className={classes.ticketBadge}>{statusLabel}</span>
//               <span>
//                 Исполнитель:{" "}
//                 {chatState?.assignedTo?.name
//                   ? chatState.assignedTo.name
//                   : "Не назначен"}
//               </span>
//               {chatState?.resolvedBy?.name && (
//                 <span>Закрыл: {chatState.resolvedBy.name}</span>
//               )}
//             </div>
//             {isSupportAgent && (canClaim || canResolve) && (
//               <div className={classes.ticketActions}>
//                 {canClaim && (
//                   <button
//                     type="button"
//                     className={classes.ticketButton}
//                     onClick={handleClaimTicket}
//                   >
//                     Взять в работу
//                   </button>
//                 )}
//                 {canResolve && (
//                   <button
//                     type="button"
//                     className={classes.ticketButtonSecondary}
//                     onClick={handleResolveTicket}
//                   >
//                     Закрыть
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//           <div className={classes.requestData_messages}>
//             {chatMessages.map((message, index) => {
//               if (!messageRefs.current[message.id]) {
//                 messageRefs.current[message.id] = React.createRef();
//               }
//               return (
//                 <div
//                   className={`${classes.requestData_message_full} ${message.sender.id === user.id && classes.myMes
//                     }`}
//                   key={message.id}
//                   ref={messageRefs.current[message.id]}
//                 >
//                   <div className={classes.requestData_message}>
//                     <div className={classes.requestData_message_text}>
//                       <div className={classes.requestData_message_text__name}>
//                         <div className={classes.requestData_message_name}>
//                           {message.sender.name}
//                         </div>
//                         {/* {console.log(message.sender)} */}
//                         <div className={classes.requestData_message_post}>
//                           {
//                             message.sender.role === roles.superAdmin
//                               ? "Техническая поддержка"
//                               : ""
//                             //   "message.sender.role"
//                           }
//                         </div>
//                       </div>
//                       <div
//                         className={`
//                             ${classes.requestData_message__message}
//                             ${message.sender.id === user.id
//                             ? classes.myMesBorderRadius
//                             : ""
//                           }
//                         `}
//                         style={
//                           message?.separator
//                             ? { backgroundColor: "#3CBC6726", color: "#3B6C54" }
//                             : {}
//                         }
//                       >
//                         {message.text}
//                       </div>
//                       <div
//                         className={classes.requestData_message_time}
//                         style={
//                           message.sender.id === user.id
//                             ? { textAlign: "right" }
//                             : {}
//                         }
//                       >
//                         {new Date(message.createdAt).toLocaleDateString(
//                           "ru-RU",
//                           {
//                             day: "numeric",
//                             month: "long",
//                             year: "numeric",
//                           }
//                         )}{" "}
//                         {convertToDate(message.createdAt, true)}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//             <div ref={messagesEndRef} />
//           </div>

//           {/* {showScrollButton && (
//             <div className={classes.scrollButton} onClick={scrollToBottom}>
//               <span className={classes.scrollArrow}>↓</span>
//               {newMessagesCount > 0 && (
//                 <span className={classes.newMessagesCount}>
//                   {newMessagesCount}
//                 </span>
//               )}
//             </div>
//           )} */}
//           {showScrollButton && newMessagesCount > 0 && (
//             <div className={classes.scrollButton} onClick={scrollToUnread}>
//               <span className={classes.scrollArrow}>↓</span>
//               {/* {newMessagesCount > 0 && ( */}
//               <span className={classes.newMessagesCount}>
//                 {newMessagesCount}
//               </span>
//               {/* )} */}
//             </div>
//           )}

//           <div className={classes.sendBlock}>
//             <div className={classes.smiles}>
//               <div
//                 className={classes.smilesBlock}
//                 onClick={handleEmojiPickerShow}
//               >
//                 {/* 😀 */}
//                 <SmileIcon />
//               </div>
//               {showEmojiPicker && (
//                 <Smiles handleSmileChange={handleSmileChange} />
//               )}
//             </div>
//             <input
//               type="text"
//               value={messageText.text}
//               onChange={handleTextareaChange}
//               disabled={!canSendMessage}
//               placeholder="Сообщение..."
//               onKeyDown={(e) => {
//                 if (e.key === "Enter") {
//                   e.preventDefault();
//                   handleSubmitMessage();
//                 }
//               }}
//               style={{ borderRadius: "20px" }}
//             />
//             <div
//               // className={classes.sendBlock_message}
//               onClick={handleSubmitMessage}
//               style={{ opacity: canSendMessage ? 0.8 : 0.4, cursor: canSendMessage ? "pointer" : "not-allowed", display: "flex", alignItems: 'center' }}
//             >
//               {/* <img src="/message.png" alt="Отправить" /> */}
//               <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path opacity="0.4" d="M14.2649 6.34496L27.1049 12.765C32.8649 15.645 32.8649 20.355 27.1049 23.235L14.2649 29.655C5.62491 33.975 2.09991 30.435 6.41991 21.81L7.72491 19.215C8.09991 18.45 8.09991 17.565 7.72491 16.8L6.41991 14.19C2.09991 5.56496 5.63991 2.02496 14.2649 6.34496Z" fill="#0057C3" />
//                 <path d="M22.2599 19.125H14.1599C13.5449 19.125 13.0349 18.615 13.0349 18C13.0349 17.385 13.5449 16.875 14.1599 16.875H22.2599C22.8749 16.875 23.3849 17.385 23.3849 18C23.3849 18.615 22.8749 19.125 22.2599 19.125Z" fill="#0057C3" />
//               </svg>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// export default SupportMessage;