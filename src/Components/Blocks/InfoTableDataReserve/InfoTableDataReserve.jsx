import React, { useEffect, useRef } from "react";
import classes from './InfoTableDataReserve.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";
import { convertToDate, server } from "../../../../graphQL_requests";

function InfoTableDataReserve({ children, requests, user, paginationHeight, pageInfo, ...props }) {
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
        <InfoTable >
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w11}`}>Дата</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Авиакомпания</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Аэропорт</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Количество человек</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Прибытие</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Отъезд</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Статус</div>
            </div>

            <div className={classes.bottom} style={{ height: `calc(100vh - ${paginationHeight})` }} ref={listContainerRef} >
                {requests.map((item, index) => (
                    <Link to={`/reserve/reservePlacement/${item.id}`} className={classes.InfoTable_data} key={index} style={{ opacity: (item.status == 'done' && !item?.chat?.some(chat => 
                        chat.unreadMessagesCount > 0 && (
                            (user.hotelId && chat.hotelId === user.hotelId) ||
                            (user.airlineId && chat.airlineId === user.airlineId) ||
                            (!user.hotelId && !user.airlineId)
                        )
                        )) && '0.5' }} >
                        {/* {item.status == 'created' && <div className={classes.newRequest}></div>} */}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{item.reserveNumber.slice(0, 4)}</div>
                        {item?.chat?.some(chat => 
                            chat.unreadMessagesCount > 0 && (
                                (user.hotelId && chat.hotelId === user.hotelId) ||
                                (user.airlineId && chat.airlineId === user.airlineId) ||
                                (!user.hotelId && !user.airlineId)
                            )
                            ) && <div className={classes.newRequest}></div>}


                        <div className={`${classes.InfoTable_data_elem} ${classes.w11}`}>{convertToDate(item.createdAt)}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_img}>
                                <img src={`${server}${item.airline?.images[0]}`} alt="" />
                            </div>
                            {item.airline?.name}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>{item.airport?.city} ({item.airport?.code})</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_title}>{item.passengerCount ? item.passengerCount : 0}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.p0} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_moreInfo}>
                                    <span><img src="/calendar.png" alt="" /> {convertToDate(item.arrival)}</span>
                                    <span><img src="/time.png" alt="" /> {convertToDate(item.arrival, true)}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.p0} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_information}>
                                <div className={classes.InfoTable_data_elem_moreInfo}>
                                    <span><img src="/calendar.png" alt="" /> {convertToDate(item.departure)}</span>
                                    <span><img src="/time.png" alt="" /> {convertToDate(item.departure, true)}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
                            <div className={classes.InfoTable_data_elem_position}>
                                <div className={item.status}></div>
                                {item.status == 'created' && 'Создан'}
                                {item.status == 'opened' && 'В обработке'}
                                {item.status == 'cancelled' && 'Отменен'}
                                {item.status == 'done' && 'Размещен'}
                            </div>
                        </div>
                    </Link>
                ))}

            </div>
        </InfoTable>
    );
}

export default InfoTableDataReserve;