import React from "react";
import classes from './InfoTableDataHotels.module.css';
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";
import { server } from "../../../../graphQL_requests";

function InfoTableDataHotels({ children, toggleRequestSidebar, requests, ...props }) {
    const handleObject = (item, index) => {
        toggleRequestSidebar();
    };

    return (
        <InfoTable>
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w30}`}>Название</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Город</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w30}`}>Адрес</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Квота</div>
            </div>

            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <Link to={`/hotels/${item.id}`}
                        className={classes.InfoTable_data}
                        onClick={() => handleObject(item, index)}
                        key={index}
                    >
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{index + 1}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
                            <div className={classes.InfoTable_data_elem_userInfo}>
                                <div className={classes.InfoTable_data_elem_avatar}>
                                    <img src={`${server}${item.images}`} alt="" />
                                </div>
                                <div className={classes.InfoTable_data_elem_title}>{item.name}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_title}>{item.city}</div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
                            <div className={classes.InfoTable_data_elem_title}>{item.address}</div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_title}>{item.quote}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataHotels;
