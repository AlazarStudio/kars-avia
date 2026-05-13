import React, { useEffect, useRef } from "react";
import classes from './InfoTableDataSupport.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { getMediaUrl, convertToDate, convertToDateNew } from "../../../../graphQL_requests";
import { roleLabels } from "../../../roles";

function InfoTableDataSupport({ children, toggleRequestSidebar, user, requests, pageInfo, onSelectId, ...props }) {
    const getStatusLabel = (item) => {
        if (item.supportStatus === "RESOLVED") return "Решён";
        if (item.supportStatus === "IN_PROGRESS") return "В работе";
        if (!item.messages?.length) return "Нет обращения";
        return "Открыт";
    };

    const getParticipantOrgName = (p) => {
        if (!p) return null;
        if (p.airlineDepartment?.name) return p.airlineDepartment.name;
        if (p.airline?.name) return p.airline.name;
        if (p.dispatcherDepartment?.name) return p.dispatcherDepartment.name;
        return null;
    };

    const handleObject = (item, index) => {
        // const otherParticipant = item.participants.find(
        //     (participant) => participant.id !== user.id
        // );
        const otherParticipant = item.participants[0];
        toggleRequestSidebar();
        onSelectId(otherParticipant.id); // Передаем ID другого участника в родительский компонент
    };

    // Ref для контейнера списка
    const listContainerRef = useRef(null);

    // Прокрутка наверх при изменении `pageInfo`
    useEffect(() => {
      if (listContainerRef.current) {
          listContainerRef.current.scrollTo({
              top: 0,
              behavior: "instant",
          });
      }
    }, [pageInfo]);

    

    return (
        <InfoTable>
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w30}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Статус</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Исполнитель</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w25}`}>Последнее сообщение</div>
            </div>

            <div className={classes.bottom} ref={listContainerRef}>
                {requests.map((item, index) => {
                    // const otherParticipant = item.participants.find(
                    //     (participant) => participant.id !== user.id
                    // );
                    const otherParticipant = item.participants[0];
                    const statusLabel = getStatusLabel(item);
                    const assigneeName = item.assignedTo?.name || "Не назначен";
                    const roleLabel = otherParticipant?.role ? roleLabels[otherParticipant.role] : null;
                    const orgName = getParticipantOrgName(otherParticipant);
                    const positionName = otherParticipant?.position?.name || null;
                    const lastMsg = item.messages?.[item.messages.length - 1];
                    const lastMsgDate = lastMsg?.createdAt ? convertToDateNew(lastMsg.createdAt) : null;
                    const lastMsgTime = lastMsg?.createdAt ? convertToDateNew(lastMsg.createdAt, true) : null;
                return (
                    <div
                        className={classes.InfoTable_data}
                        onClick={() => handleObject(item, index)}
                        key={index}
                    >
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{item.order}</div>
                        {item?.unreadMessagesCount > 0 && (
                            <div className={classes.newRequest}>{item.unreadMessagesCount}</div>
                        )}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
                            <div className={classes.InfoTable_data_elem_userInfo}>
                                <div className={classes.InfoTable_data_elem_avatar}>
                                    <img src={getMediaUrl(otherParticipant?.images[0]) ?? '/no-avatar.png'} alt="" style={{ userSelect: "none" }} />
                                </div>
                                <div className={classes.InfoTable_data_elem_information}>
                                    <div className={classes.InfoTable_data_elem_title}>{otherParticipant?.name}</div>
                                    {(roleLabel || orgName || positionName) && (
                                        <div className={classes.InfoTable_data_elem_moreInfo}>
                                            {roleLabel && <span>{roleLabel}</span>}
                                            {orgName && <span>· {orgName}</span>}
                                            {positionName && <span>· {positionName}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>{statusLabel}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>{assigneeName}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w25}`}>
                            {lastMsgDate && (
                                <div className={classes.lastMessage}>
                                    <span>{lastMsgDate}</span>
                                    <span>{lastMsgTime}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )})}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataSupport;
