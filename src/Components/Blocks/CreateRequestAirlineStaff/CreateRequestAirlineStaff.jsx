import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestAirlineStaff.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { CREATE_AIRLINE_STAFF, decodeJWT, getCookie } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";

function CreateRequestAirlineStaff({ show, onClose, id, addTarif, setAddTarif }) {
    const [userRole, setUserRole] = useState();
    const token = getCookie('token');

    useEffect(() => {
        setUserRole(decodeJWT(token).role);
    }, [token]);

    const [formData, setFormData] = useState({
        name: '',
        number: '',
        position: '',
        gender: '',
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            name: '',
            number: '',
            position: '',
            gender: '',
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

    const [createAirlineStaff] = useMutation(CREATE_AIRLINE_STAFF, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Проверка на заполненность полей
        const requiredFields = ['name', 'number', 'position', 'gender'];
        const emptyFields = requiredFields.filter((field) => !formData[field]?.trim());

        if (emptyFields.length > 0) {
            alert('Пожалуйста, заполните все обязательные поля.');
            return;
        }

        try {
            let request = await createAirlineStaff({
                variables: {
                    updateAirlineId: id,
                    input: {
                        staff: [
                            {
                                "name": formData.name,
                                "number": formData.number,
                                "position": formData.position,
                                "gender": formData.gender,
                            }
                        ]
                    }
                }
            });

            if (request) {
                setAddTarif(request.data.updateAirline.staff.sort((a, b) => a.name.localeCompare(b.name)));

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

    let positions = [
        'КЭ (Капитан Эскадрильи)',
        'КВС (Командир воздушного судна)',
        'ВП (Второй пилот)',
        'СПБ ( Старший бортпроводник)',
        'ИБП ( Инструктор-бортпроводник)',
        'БП (бортпроводник)',
        'КЭ ( Капитан Эскадрильи)',
        'Инженер',
    ]

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Добавить сотрудника</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>ФИО</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Пример: Иванов Иван Иванович" />

                    <label>Номер телефона</label>
                    <input type="text" name="number" value={formData.number} onChange={handleChange} placeholder="Пример: 89283521345" />

                    <label>Должность</label>
                    <select name="position" value={formData.position} onChange={handleChange}>
                        <option value="" disabled>Выберите должность</option>
                        {positions.map((pos, index) => (
                            <option key={index} value={pos}>{pos}</option>
                        ))}
                    </select>

                    <label>Пол</label>
                    <select name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="" disabled>Выберите пол</option>
                        <option value="Мужской">Мужской</option>
                        <option value="Женский">Женский</option>
                    </select>
                </div>
            </div>

            <div className={classes.requestButton}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestAirlineStaff;
