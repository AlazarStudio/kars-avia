import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestCategory.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { UPDATE_HOTEL } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function EditRequestCategory({ show, id, onClose, category, onSubmit }) {
    const [formData, setFormData] = useState({
        type: ''
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (show && category) {
            setFormData({ type: category.name });
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

    const [updateHotel] = useMutation(UPDATE_HOTEL);

    const handleSubmit = async (e) => {
        e.preventDefault();

        let response_update_category = await updateHotel({
            variables: {
                updateHotelId: id,
                input: {
                    "categories": [
                        {
                            "name": formData.type, 
                            "id": category.id
                        }
                    ]
                }
            }
        });

        if (response_update_category) {
            onSubmit(formData);
            onClose();
        }
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
