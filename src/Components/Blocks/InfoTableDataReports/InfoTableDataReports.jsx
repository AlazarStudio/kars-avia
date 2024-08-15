import React from "react";
import classes from './InfoTableDataReports.module.css';
import InfoTable from "../InfoTable/InfoTable";
import Button from "../../Standart/Button/Button";

function InfoTableDataReports({ children, toggleRequestSidebar, requests, setChooseObject, openDeleteComponent, ...props }) {
    const handleObject = (item, index) => {
        setChooseObject({ ...item, index });
        toggleRequestSidebar();
    };

    return (
        <InfoTable>
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w30}`}>Авиакомпания</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Дата формирования</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Период</div>
            </div>

            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <div
                        className={classes.InfoTable_data}
                        onClick={() => handleObject(item, index)}
                        key={index}
                    >
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{index + 1}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
                            <div className={classes.InfoTable_data_elem_userInfo}>
                                <div className={classes.InfoTable_data_elem_avatar}>
                                    <img src={`/${item.airlineImg}`} alt="" />
                                </div>
                                <div className={classes.InfoTable_data_elem_title}>{item.airline}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_title}>{item.dateFormirovania}</div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_title}>{item.startDate} - {item.endDate}</div>
                        </div>
                        <div className={classes.InfoTable_data_elem_download}>
                            <a href={'/report_1.docx'}> <img src="/download.png" alt="" /> </a>
                            <img src="/deleteReport.png" alt=""  onClick={() => openDeleteComponent(index)}/>
                        </div>


                    </div>
                ))}
            </div>
        </InfoTable>
    );
}

export default InfoTableDataReports;
