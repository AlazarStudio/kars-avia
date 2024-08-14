import React, { useState, useRef, useEffect } from "react";
import classes from './ExistRequestCompanyHotel.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function ExistRequestCompanyHotel({ show, onClose, chooseObject, updateDispatcher, openDeleteComponent, filterList }) {
    const [formData, setFormData] = useState({
        avatar: '',
        fio: '',
        post: '',
        login: '',
        password: ''
    });

    const [index, setIndex] = useState(null);

    useEffect(() => {
        if (chooseObject) {
            setFormData({
                avatar: chooseObject.avatar || '',
                fio: chooseObject.fio || '',
                post: chooseObject.post || '',
                login: chooseObject.login || '',
                password: chooseObject.password || ''
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
                avatar: file.name
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
                <div className={classes.requestTitle_name}>Пользователь</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="Close" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <div className={classes.requestDataInfo_img}>
                        <div className={classes.requestDataInfo_img_imgBlock}>
                            <img src={`/${formData.avatar}`} alt="" />
                        </div>
                    </div>

                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>ФИО</div>
                        <input
                            type="text"
                            name="fio"
                            placeholder="Иванов Иван Иванович"
                            value={formData.fio}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Должность</div>
                        <select name="post" value={formData.post} onChange={handleChange}>
                            {filterList.map((item, index) => <option key={index} value={item}>{item}</option>)}
                        </select>
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Логин</div>
                        <input
                            type="text"
                            name="login"
                            placeholder="Логин"
                            value={formData.login}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Пароль</div>
                        <input
                            type="text"
                            name="password"
                            placeholder="Пароль"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>Аватар</div>
                        <input
                            type="file"
                            name="avatar"
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

export default ExistRequestCompanyHotel;
