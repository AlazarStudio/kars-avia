import React, { useEffect, useRef } from "react";
import classes from './InfoTableDataAirlines.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";
import { server } from "../../../../graphQL_requests";

function InfoTableDataAirlines({ children, toggleRequestSidebar, requests, pageInfo, ...props }) {
    const handleObject = (item, index) => {
        toggleRequestSidebar();
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
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`} style={{justifyContent:'center'}}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`} style={{paddingLeft:"90px"}}>Название</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w30}`}>Наименование</div>
            </div>

            <div className={classes.bottom} ref={listContainerRef}>
                {requests.map((item, index) => (
                    <Link to={`/airlines/${item.id}`}
                        className={classes.InfoTable_data}
                        onClick={() => handleObject(item, index)}
                        key={index}
                    >
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`} style={{justifyContent:'center'}}>{item.order}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_userInfo}>
                                <div className={classes.InfoTable_data_elem_avatar}>
                                    <img src={`${server}${item.images[0]}`} alt="" />
                                </div>
                                <div className={classes.InfoTable_data_elem_title}>{item.name}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>{item?.nameFull}</div>
                    </Link>
                ))}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataAirlines;
