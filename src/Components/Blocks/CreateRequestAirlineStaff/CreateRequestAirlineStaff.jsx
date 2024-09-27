import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestAirlineStaff.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { CREATE_AIRLINE_DEPARTMERT, decodeJWT, getCookie } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";

function CreateRequestAirlineStaff({ show, onClose, id, addTarif, setAddTarif }) {
    const [userRole, setUserRole] = useState();
    const token = getCookie('token');

    useEffect(() => {
        setUserRole(decodeJWT(token).role);
    }, [token]);

    const [formData, setFormData] = useState({
        category: ''
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            category: ''
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

    const [createAirlineDepartment] = useMutation(CREATE_AIRLINE_DEPARTMERT, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let request = await createAirlineDepartment({
                variables: {
                    "updateAirlineId": id,
                    "input": {
                        "department": [
                            {
                                "name": formData.category
                            }
                        ]
                    }
                }
            });

            if (request) {
                setAddTarif(request.data.updateAirline.department.sort((a, b) => a.name.localeCompare(b.name)));

                resetForm();
                onClose();
            }
        } catch (err) {
            alert('Произошла ошибка при сохранении данных');
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
                <div className={classes.requestTitle_name}>Добавить сотрудника</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Название</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Пример: Отдел продаж" />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestAirlineStaff;
