import React from "react";
import classes from './InfoTableDataMyCompany.module.css';
import InfoTable from "../InfoTable/InfoTable.jsx";

import { server } from '../../../../graphQL_requests.js';
import { roles } from "../../../roles.js";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon.jsx";

function InfoTableDataMyCompany({ children, user, toggleRequestSidebar, openDeleteComponent, requests, setChooseObject, id, ...props }) {
    const handleObject = (item, index) => {
        setChooseObject({ ...item, index });
        toggleRequestSidebar();
    };


    return (
        <InfoTable>
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w35}`}>Название</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w25}`}>ИНН</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>ОГРН</div>
            </div>

            <div className={classes.bottom} style={user?.hotelId ? {height: 'calc(100vh - 269px)'} : {}}>
                {requests.map((item, index) => (
                    <div
                        className={classes.InfoTable_data}
                        onClick={() => handleObject(item, index)}
                        key={index}
                    >
                        {/* <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{index + 1}</div> */}
                        <div className={`${classes.InfoTable_data_elem} ${classes.w35}`}>
                            <div className={classes.InfoTable_data_elem_title}>
                                {item.name}
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w25}`}>
                            <div className={classes.InfoTable_data_elem_title}>
                                {/* <span className={classes.title}>ИНН</span> */}
                                {item?.information?.inn}
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_title}>
                                {/* <span className={classes.title} >ОГРН</span> */}
                                {item?.information?.ogrn}
                            </div>
                        </div>
                        <div className={`${classes.buttonsWrapper} ${classes.w20}`}>
                            <EditPencilIcon
                                cursor="pointer"
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
