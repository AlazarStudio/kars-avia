import React, { useState, useRef, useEffect } from "react";
import classes from './BronInfo.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function BronInfo({ show, onClose }) {
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
                <div className={classes.requestTitle_name}>Джатдоев А. С-А.</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>

                <div className={classes.requestData}>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>ФИО</div>
                        <div className={classes.requestDataInfo_desc}>Джатдоев Алим Сеит-Алиевич </div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Дата прибытия</div>
                        <div className={classes.requestDataInfo_desc}>23.07.2024</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Время прибытия</div>
                        <div className={classes.requestDataInfo_desc}>14:00</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Дата отъезда</div>
                        <div className={classes.requestDataInfo_desc}>27.07.2024</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Время отъезда</div>
                        <div className={classes.requestDataInfo_desc}>10:00</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Комната</div>
                        <div className={classes.requestDataInfo_desc}>№121</div>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Место</div>
                        <div className={classes.requestDataInfo_desc}>1</div>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}

export default BronInfo;