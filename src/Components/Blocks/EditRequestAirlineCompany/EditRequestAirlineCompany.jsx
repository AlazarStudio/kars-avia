import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestAirlineCompany.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { getCookie, UPDATE_AIRLINE_USER } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";

function EditRequestAirlineCompany({ show, onClose, user, department, onSubmit, addTarif, id }) {
    const token = getCookie('token');

    const [uploadFile, { data, loading, error }] = useMutation(UPDATE_AIRLINE_USER, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const [formData, setFormData] = useState({
        images: null,
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || '',
        login: user?.login || '',
        password: '',
        department: department || ''
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (show && user && department) {
            setFormData({
                images: null,
                name: user?.name || '',
                email: user?.email || '',
                role: user?.role || '',
                login: user?.login || '',
                password: '',
                department: department || ''
            });
        }
    }, [show, department, user]);

    const closeButton = () => {
        let success = confirm("Вы уверены, что хотите закрыть? Все несохраненные данные будут потеряны.");
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
                images: file
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let response_update_user = await uploadFile({
                variables: {
                    input: {
                        id: user.id,
                        name: formData.name,
                        email: formData.email,
                        role: formData.role,
                        login: formData.login,
                        password: formData.password,
                        airlineId: id,
                        airlineDepartmentId: formData.department
                    },
                    images: formData.images
                }
            });

            if (response_update_user) {
                const updatedUser = response_update_user.data.updateUser;

                const updatedTarif = addTarif.map(department => {
                    if (department.name === formData.department) {
                        return {
                            ...department,
                            users: department.users.map(user =>
                                user.id === updatedUser.id
                                    ? { ...user, ...updatedUser }
                                    : user
                            ).sort((a, b) => a.name.localeCompare(b.name))
                        };
                    }
                    return department;
                }).sort((a, b) => a.name.localeCompare(b.name));

                onSubmit(updatedTarif);
                onClose();
            }
        } catch (err) {
            alert('Произошла ошибка при обновлении пользователя');
        }
    };


    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Редактировать</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="Close" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>ФИО</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Введите ФИО" />

                    <label>Почта</label>
                    <input type="text" name="email" value={formData.email} onChange={handleChange} placeholder="Введите email" />

                    <label>Должность</label>
                    <select name="role" value={formData.role} onChange={handleChange}>
                        <option value="" disabled>Выберите должность</option>
                        <option value="Модератор">Модератор</option>
                        <option value="Администратор">Администратор</option>
                    </select>

                    <label>Отдел</label>
                    <select name="department" value={formData.department} onChange={handleChange}>
                        {addTarif.map((department, index) => (
                            <option key={index} value={department.name}>{department.name}</option>
                        ))}
                    </select>

                    <label>Логин</label>
                    <input type="text" name="login" value={formData.login} onChange={handleChange} placeholder="Введите логин" />

                    <label>Пароль</label>
                    <input type="text" name="password" value={formData.password} onChange={handleChange} placeholder="Введите пароль" />

                    <label>Аватар</label>
                    <input type="file" name="images" onChange={handleFileChange} />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Сохранить изменения</Button>
            </div>
        </Sidebar>
    );
}

export default EditRequestAirlineCompany;
