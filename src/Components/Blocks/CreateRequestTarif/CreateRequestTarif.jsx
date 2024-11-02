import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestTarif.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, UPDATE_HOTEL_TARIF } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function CreateRequestTarif({ show, onClose, id, addTarif, setAddTarif }) {
    const token = getCookie('token');

    const [formData, setFormData] = useState({
        name: '',
    });

    const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            name: '',
        });
    };

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены");
        if (success) {
            resetForm();
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        let response_update_tarif = await updateHotelTarif({
            variables: {
                updateHotelId: id,
                input: {
                    "tariffs": [
                        {
                            "name": formData.name
                        }
                    ]
                }
            }
        });

        if (response_update_tarif) {
            setAddTarif(response_update_tarif.data.updateHotel.tariffs);
            resetForm();
            onClose();
        }
    };

    useEffect(() => {
        if (show) {
            resetForm();
            const handleClickOutside = (event) => {
                if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                    closeButton();
                }
            };
            document.addEventListener('mousedown', handleClickOutside);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [show]);

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Добавить тариф</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Название</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} />
                </div>

            </div>

            <div className={classes.requestButton}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestTarif;
