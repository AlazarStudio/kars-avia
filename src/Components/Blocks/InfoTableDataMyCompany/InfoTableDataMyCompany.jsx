import React from "react";
import classes from './InfoTableDataMyCompany.module.css';
import InfoTable from "../InfoTable/InfoTable.jsx";

import { server } from '../../../../graphQL_requests.js';
import { roles } from "../../../roles.js";

function InfoTableDataMyCompany({ children, user, toggleRequestSidebar, openDeleteComponent, requests, setChooseObject, id, ...props }) {
    const handleObject = (item, index) => {
        setChooseObject({ ...item, index });
        toggleRequestSidebar();
    };


    return (
        <InfoTable>
            {/* <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w35}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Должность</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Уровень доступа</div>
            </div> */}

            <div className={classes.bottom} style={user?.hotelId ? {height: 'calc(100vh - 269px)'} : {}}>
                {requests.map((item, index) => (
                    <div
                        className={classes.InfoTable_data}
                        // onClick={() => handleObject(item, index)}
                        key={index}
                    >
                        {/* <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{index + 1}</div> */}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w35}`}>
                            <div className={classes.InfoTable_data_elem_userInfo}>
                                {/* <div className={classes.InfoTable_data_elem_avatar}>
                                    <img src={`${item.images[0] ? `${server}${item.images[0]}` : '/no-avatar.png'}`} alt="" style={{ userSelect: "none" }} />
                                </div> */}
                                {/* <div className={classes.InfoTable_data_elem_title}> */}
                                    {item.name}
                                {/* </div> */}
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w25}`}>
                            <div className={classes.InfoTable_data_elem_title}>
                                <span className={classes.title}>ИНН</span>
                                {item?.information?.inn}
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_title}>
                                <span className={classes.title} >ОГРН</span>
                                {item?.information?.ogrn}
                            </div>
                        </div>
                        <div className={`${classes.buttonsWrapper} ${classes.w20}`}>
                            <img 
                                src="/edit.svg.png" 
                                alt="" 
                                style={{width:"fit-content", height:"fit-content"}}
                                onClick={() => handleObject(item, index)}
                            />
                            {/* <img src="/deleteReport.png" alt="" 
                            onClick={() => {openDeleteComponent(index, item.id)}}
                            /> */}
                        </div>
                    </div>
                ))}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataMyCompany;
