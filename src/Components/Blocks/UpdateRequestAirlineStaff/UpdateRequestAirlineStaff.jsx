import React, { useState, useRef, useEffect } from "react";
import classes from './UpdateRequestAirlineStaff.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { decodeJWT, getCookie, UPDATE_AIRLINE_STAFF } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";

function UpdateRequestAirlineStaff({ show, onClose, id, selectedStaff, setAddTarif, setShowDelete, setDeleteIndex }) {
    const [userRole, setUserRole] = useState();
    const token = getCookie('token');

    useEffect(() => {
        setUserRole(decodeJWT(token).role);
    }, [token]);

    const [formData, setFormData] = useState({
        id: selectedStaff?.id || '',
        name: selectedStaff?.name || '',
        number: selectedStaff?.number || '',
        position: selectedStaff?.position || '',
        gender: selectedStaff?.gender || '',
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            id: selectedStaff?.id || '',
            name: selectedStaff?.name || '',
            number: selectedStaff?.number || '',
            position: selectedStaff?.position || '',
            gender: selectedStaff?.gender || '',
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

    const [updateAirlineStaff] = useMutation(UPDATE_AIRLINE_STAFF, {
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
            let request = await updateAirlineStaff({
                variables: {
                    updateAirlineId: id,
                    input: {
                        staff: [
                            {
                                "id": formData.id,
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

    let positions = ['КВС']

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Изменить сотрудника</div>
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

            <div className={classes.requestButon}>
                <Button type="submit" style={{ "background-color": '#ff5151' }} onClick={() => {
                    setDeleteIndex(selectedStaff)
                    setShowDelete(true);
                    onClose()
                }}>Удалить</Button>
                <Button type="submit" onClick={handleSubmit}>Изменить</Button>
            </div>
        </Sidebar>
    );
}

export default UpdateRequestAirlineStaff;
