import React, { useEffect, useRef } from "react";
import classes from './InfoTableDataSupport.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";
import { server } from "../../../../graphQL_requests";

function InfoTableDataSupport({ children, toggleRequestSidebar, requests, pageInfo, onSelectId, ...props }) {
    const handleObject = (item, index) => {
        toggleRequestSidebar();
        onSelectId(item.participants[0].id); // Передаем ID в родительский компонент
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
            </div>

            <div className={classes.bottom} ref={listContainerRef}>
                {requests.map((item, index) => (
                    <div
                        className={classes.InfoTable_data}
                        onClick={() => handleObject(item, index)}
                        key={index}
                    >
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{item.order}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
                            <div className={classes.InfoTable_data_elem_userInfo}>
                                <div className={classes.InfoTable_data_elem_avatar}>
                                    <img src={`${server}${item.participants[0].images[0]}`} alt="" />
                                </div>
                                <div className={classes.InfoTable_data_elem_title}>{item.participants[0].name}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataSupport;
