import React from "react";
import classes from './InfoTableDataCompany.module.css';
import InfoTable from "../InfoTable/InfoTable";

function InfoTableDataCompany({ children, toggleRequestSidebar, requests, setChooseObject, ...props }) {
    const handleObject = () => {
        toggleRequestSidebar()
    }
    return (
        <InfoTable >
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w30}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Уровень доступа</div>
            </div>

            <div className={classes.bottom}>
                {requests.map((item, index) => (
                    <div className={classes.InfoTable_data} onClick={handleObject} key={index}>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{index + 1}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
                            <div className={classes.InfoTable_data_elem_userInfo}>
                                <div className={classes.InfoTable_data_elem_avatar}><img src={`/${item.avatar}`} alt="" /></div>
                                <div className={classes.InfoTable_data_elem_title}>{item.fio}</div>
                            </div>
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                            <div className={classes.InfoTable_data_elem_title}>{item.post}</div>
                        </div>
                    </div>
                ))}

            </div>
        </InfoTable>
    );
}

export default InfoTableDataCompany;