import React from "react";
import classes from './InfoTableDataCompany.module.css';
import InfoTable from "../InfoTable/InfoTable.jsx";

import { server } from '../../../../graphQL_requests.js';
import { roles } from "../../../roles.js";

function InfoTableDataCompany({ children, user, toggleRequestSidebar, requests, setChooseObject, id, ...props }) {
    const handleObject = (item, index) => {
        setChooseObject({ ...item, index });
        toggleRequestSidebar();
    };


    return (
        <InfoTable>
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w35}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Должность</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Уровень доступа</div>
            </div>

            <div className={classes.bottom} style={user?.hotelId ? {height: 'calc(100vh - 269px)'} : {}}>
                {requests.map((item, index) => (
                    <div
                        className={classes.InfoTable_data}
                        onClick={() => handleObject(item, index)}
                        key={index}
                    >
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{index + 1}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w35}`}>
                            <div className={classes.InfoTable_data_elem_userInfo}>
                                <div className={classes.InfoTable_data_elem_avatar}>
                                    <img src={`${item.images[0] ? `${server}${item.images[0]}` : '/no-avatar.png'}`} alt="" style={{ userSelect: "none" }} />
                                </div>
                                <div className={classes.InfoTable_data_elem_title}>
                                    {item.name}
                                </div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_title}>
                                {item?.position?.name}
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_title}>
                                {(item.role === roles.hotelAdmin || item.role === roles.dispatcerAdmin) ? "Администратор" : "Модератор"}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataCompany;
