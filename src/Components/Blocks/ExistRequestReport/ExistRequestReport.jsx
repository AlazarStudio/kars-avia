import React, { useState, useRef, useEffect } from "react";
import classes from './ExistRequestReport.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function ExistRequestReport({ show, onClose, chooseObject, updateDispatcher, openDeleteComponent, filterList }) {
    const [formData, setFormData] = useState({
        airline: '',
        airlineImg: '',
        dateFormirovania: '',
        startDate: '',
        endDate: ''
    });

    const [index, setIndex] = useState(null);

    useEffect(() => {
        if (chooseObject) {
            setFormData({
                airline: chooseObject.airline || '',
                airlineImg: chooseObject.airlineImg || '',
                dateFormirovania: chooseObject.dateFormirovania || '',
                startDate: chooseObject.startDate || '',
                endDate: chooseObject.endDate || ''
            });
            setIndex(chooseObject.index);
        }
    }, [chooseObject]);

    const sidebarRef = useRef();

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены");
        if (success) {
            onClose();
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prevState => ({
                ...prevState,
                airlineImg: file.name
            }));
        }
    };

    const handleUpdate = () => {
        updateDispatcher(formData, index);
        onClose();
    };

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
                <div className={classes.requestTitle_name}>Диспетчер</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="Close" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <div className={classes.requestDataInfo_img}>
                        <div className={classes.requestDataInfo_img_imgBlock}>
                            <img src={`/${formData.airlineImg}`} alt="" />
                        </div>
                    </div>

                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Авиакомпания</div>
                        <input
                            type="text"
                            name="airline"
                            placeholder="Авиакомпания"
                            value={formData.airline}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Начальная дата</div>
                        <input
                            type="date"
                            name="startDate"
                            placeholder="Начальная дата"
                            value={formData.startDate}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Конечная дата</div>
                        <input
                            type="date"
                            name="endDate"
                            placeholder="Конечная дата"
                            value={formData.endDate}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Картинка</div>
                        <input
                            type="file"
                            name="airlineImg"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button onClick={() => openDeleteComponent(index)} backgroundcolor={'#FF9C9C'}>Удалить <img src="/delete.png" alt="" /></Button>
                <Button onClick={handleUpdate} backgroundcolor={'#3CBC6726'} color={'#3B6C54'}>Изменить <img src="/editDispetcher.png" alt="" /></Button>
            </div>

        </Sidebar>
    );
}

export default ExistRequestReport;
