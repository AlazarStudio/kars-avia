import React, { useEffect, useRef } from "react";
import classes from './InfoTableRepresentativeData.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";
import { convertToDate, server } from "../../../../graphQL_requests";

function InfoTableRepresentativeData({ children, requests, user, paginationHeight, pageInfo, ...props }) {
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
                <div className={`${classes.InfoTable_title_elem} ${classes.w7}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Дата</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w18}`}>Авиакомпания</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`} style={{justifyContent:"center"}}>Аэропорт</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`} style={{justifyContent:"center"}}>Рейс</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w18}`} style={{justifyContent:"center"}}>Услуга</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Статус</div>
            </div>

            <div className={classes.bottom} style={{ height: `calc(100vh - ${paginationHeight})` }} ref={listContainerRef} >
                {requests.map((item, index) => (
                    <Link to={`/representativeRequests/representativeRequestsPlacement/${item.id}`} className={classes.InfoTable_data} key={index} style={{ opacity: (item.status == 'done' && !item?.chat?.some(chat => 
                        chat.unreadMessagesCount > 0 && (
                            (user.hotelId && chat.hotelId === user.hotelId) ||
                            (user.airlineId && chat.airlineId === user.airlineId) ||
                            (!user.hotelId && !user.airlineId)
                        )
                        )) && '0.5' }} >
                        {/* {item.status == 'created' && <div className={classes.newRequest}></div>} */}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w7}`}>{index+1}</div>
                        {/* <div className={`${classes.InfoTable_data_elem} ${classes.w7}`}>{item.reserveNumber.slice(0, 4)}</div> */}
                        {item?.chat?.some(chat => 
                            chat.unreadMessagesCount > 0 && (
                                (user.hotelId && chat.hotelId === user.hotelId) ||
                                (user.airlineId && chat.airlineId === user.airlineId) ||
                                (!user.hotelId && !user.airlineId)
                            )
                            ) && <div className={classes.newRequest}></div>}


                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>{convertToDate(item.createdAt)}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w18}`}>
                            <div className={classes.InfoTable_data_elem_img}>
                                <img src={`${server}${item.airline?.images[0]}`} alt="" />
                            </div>
                            {item.airline?.name}
                        </div>
                        <div 
                        className={`${classes.InfoTable_data_elem} ${classes.w15}`} 
                        style={{justifyContent:"center"}}
                        >
                            {item.airport?.code}
                        </div>
                        <div 
                        className={`${classes.InfoTable_data_elem} ${classes.w15}`} 
                        style={{justifyContent:"center"}}
                        >
                            {item.flightNumber}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.p0} ${classes.w18}`} style={{justifyContent:"center", textAlign:'center'}}>
                                    {/* <span><img src="/calendar.png" alt="" /> {convertToDate(item.departure)}</span>
                                    <span><img src="/time.png" alt="" /> {convertToDate(item.departure, true)}</span> */}
                                    {item.waterService?.plan?.enabled && <>Вода<br /></>}
                                    {item.mealService?.plan?.enabled && <>Питание <br /></>}
                                    {(item.livingService?.plan?.enabled && !item.livingService?.withTransfer) && <>Проживание <br /></>}
                                    {item.livingService?.withTransfer && <>Трансфер+Проживание <br /></>}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
                            <div className={classes.InfoTable_data_elem_position}>
                                <div className={item.status?.toLowerCase()}></div>
                                {item.status?.toLowerCase() == 'created' && 'Создан'}
                                {item.status?.toLowerCase() == 'opened' && 'В обработке'}
                                {item.status?.toLowerCase() == 'cancelled' && 'Отменен'}
                                {item.status?.toLowerCase() == 'done' && 'Размещен'}
                            </div>
                        </div>
                    </Link>
                ))}

            </div>
        </InfoTable>
    );
}

export default InfoTableRepresentativeData;