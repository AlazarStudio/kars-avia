import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestCategory.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function EditRequestCategory({ show, onClose, category, onSubmit }) {
    const [formData, setFormData] = useState({
        type: ''
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (show && category) {
            setFormData({ type: category.type });
        }
    }, [show, category]);

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены");
        if (success) {
            onClose();
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Изменить категорию</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Название категории</label>
                    <input type="text" name="type" value={formData.type} onChange={handleChange} placeholder="Пример: 1" />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Изменить</Button>
            </div>
        </Sidebar>
    );
}

export default EditRequestCategory;
