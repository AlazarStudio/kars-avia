import React, { useEffect, useRef } from "react";
import classes from './InfoTableDataSupport.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";
import { getMediaUrl } from "../../../../graphQL_requests";

function InfoTableDataSupport({ children, toggleRequestSidebar, user, requests, pageInfo, onSelectId, ...props }) {
    const statusLabelMap = {
        OPEN: "Открыт",
        IN_PROGRESS: "В работе",
        RESOLVED: "Решён",
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
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Статус</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Исполнитель</div>
            </div>

            <div className={classes.bottom} ref={listContainerRef}>
                {requests.map((item, index) => {
                    // const otherParticipant = item.participants.find(
                    //     (participant) => participant.id !== user.id
                    // );
                    const otherParticipant = item.participants[0]
                    const statusLabel =
                        statusLabelMap[item.supportStatus || "OPEN"] || "Открыт";
                    const assigneeName = item.assignedTo?.name || "Не назначен";
                return (
                    <div
                        className={classes.InfoTable_data}
                        onClick={() => handleObject(item, index)}
                        key={index}
                    >
                        {/* {console.log(item)} */}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{item.order}</div>
                        {item?.unreadMessagesCount > 0 && <div className={classes.newRequest}></div>}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
                            <div className={classes.InfoTable_data_elem_userInfo}>
                                <div className={classes.InfoTable_data_elem_avatar}>
                                    {/* <img src={`${server}${otherParticipant?.images[0]}`} alt="" /> */}
                                    <img src={getMediaUrl(otherParticipant?.images[0]) ?? '/no-avatar.png'} alt="" style={{ userSelect: "none" }} />
                                </div>
                                <div className={classes.InfoTable_data_elem_title}>{otherParticipant?.name}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>{statusLabel}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>{assigneeName}</div>
                    </div>
                )})}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataSupport;
