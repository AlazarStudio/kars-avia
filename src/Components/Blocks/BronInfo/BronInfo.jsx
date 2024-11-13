import React, { useState, useRef, useEffect } from "react";
import classes from './BronInfo.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { convertToDate } from "../../../../graphQL_requests";

function BronInfo({ show, onClose, data }) {
    const [activeTab, setActiveTab] = useState('Информация о бронировании');

    const sidebarRef = useRef();

    const closeButton = () => {
        onClose();
    }

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                closeButton();
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [show, onClose]);

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Бронирование</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>ФИО</div>
                        <div className={classes.requestDataInfo_desc}>{data?.client?.name}</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Должность</div>
                        <div className={classes.requestDataInfo_desc}>{data?.client?.position}</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Пол</div>
                        <div className={classes.requestDataInfo_desc}>{data?.client?.gender}</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Номер телефона</div>
                        <div className={classes.requestDataInfo_desc}>{data?.client?.number}</div>
                    </div>
                    <hr />
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Аэропорт</div>
                        <div className={classes.requestDataInfo_desc}>{data?.request?.airport?.name} ( {data?.request?.airport?.code} )</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Город</div>
                        <div className={classes.requestDataInfo_desc}>{data?.request?.airport?.city}</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Дата прибытия</div>
                        <div className={classes.requestDataInfo_desc}>{convertToDate(data?.request?.arrival?.date)}</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Время прибытия</div>
                        <div className={classes.requestDataInfo_desc}>{convertToDate(data?.request?.arrival?.date, true)}</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Дата отъезда</div>
                        <div className={classes.requestDataInfo_desc}>{convertToDate(data?.request?.departure?.date)}</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Время отъезда</div>
                        <div className={classes.requestDataInfo_desc}>{convertToDate(data?.request?.departure?.date, true)}</div>
                    </div>

                    <hr />

                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Комната</div>
                        <div className={classes.requestDataInfo_desc}>{data?.room}</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Место</div>
                        <div className={classes.requestDataInfo_desc}>{data?.place}</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Питание</div>
                        <div className={classes.requestDataInfo_desc}>{data?.request?.mealPlan?.included ? 'Включено' : 'Не включено'}</div>
                    </div>

                    {data?.request?.mealPlan?.included &&
                        <>
                            <div className={classes.requestDataInfo}>
                                <div className={classes.requestDataInfo_title}>Завтрак</div>
                                <div className={classes.requestDataInfo_desc}>{data?.request?.mealPlan?.breakfast ? 'Включено' : 'Не включено'}</div>
                            </div>

                            <div className={classes.requestDataInfo}>
                                <div className={classes.requestDataInfo_title}>Обед</div>
                                <div className={classes.requestDataInfo_desc}>{data?.request?.mealPlan?.lunch ? 'Включено' : 'Не включено'}</div>
                            </div>

                            <div className={classes.requestDataInfo}>
                                <div className={classes.requestDataInfo_title}>Ужин</div>
                                <div className={classes.requestDataInfo_desc}>{data?.request?.mealPlan?.dinner ? 'Включено' : 'Не включено'}</div>
                            </div>
                        </>
                    }
                </div>
            </div>
        </Sidebar>
    );
}

export default BronInfo;