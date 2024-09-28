import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestAirlineCompany.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { decodeJWT, getCookie, CREATE_AIRLINE_USER } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";

function CreateRequestAirlineCompany({ show, onClose, id, addTarif, setAddTarif }) {
    const [userRole, setUserRole] = useState();
    const token = getCookie('token');

    useEffect(() => {
        setUserRole(decodeJWT(token).role);
    }, [token]);

    const [formData, setFormData] = useState({
        images: '',
        name: '',
        email: '',
        role: '',
        login: '',
        password: '',
        department: '',
    });

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            images: '',
            name: '',
            email: '',
            role: '',
            login: '',
            password: '',
            department: '',
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prevState => ({
                ...prevState,
                images: file
            }));
        }
    };

    const [createAirlineUser] = useMutation(CREATE_AIRLINE_USER, {
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
            let request = await createAirlineUser({
                variables: {
                    input: {
                        name: formData.name,
                        role: formData.role,
                        airlineId: id,
                        email: formData.email,
                        hotelId: null,
                        login: formData.login,
                        password: formData.password,
                        airlineDepartmentId: formData.department
                    },
                    images: formData.images
                }
            });
            if (request) {
                const newUser = {
                    id: request.data.registerUser.id, // Если возвращается ID созданного пользователя
                    name: request.data.registerUser.name,
                    role: request.data.registerUser.role,
                    images: request.data.registerUser.images,
                    email: request.data.registerUser.email,
                    login: request.data.registerUser.login,
                    password: request.data.registerUser.password
                };
                
                const updatedTarifs = addTarif.map(department => {
                    if (department.id === formData.department) {
                        const updatedUsers = [...department.users, newUser].sort((a, b) => a.name.localeCompare(b.name));
                        return {
                            ...department,
                            users: updatedUsers
                        };
                    }
                    return department;
                });
    
                setAddTarif(updatedTarifs);
                resetForm();
                onClose();
            }
        } catch (err) {
            alert('Произошла ошибка при сохранении данных');
        }
    };

    // console.log(formData)

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
                <div className={classes.requestTitle_name}>Добавить аккаунт</div>
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
                        {/* <option value="Модератор">Модератор</option> */}
                        <option value="AIRLINEADMIN">Администратор</option>
                    </select>

                    <label>Логин</label>
                    <input type="text" name="login" value={formData.login} onChange={handleChange} placeholder="Введите логин" />

                    <label>Пароль</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Введите пароль" />

                    <label>Отдел</label>
                    <select name="department" value={formData.department} onChange={handleChange}>
                        <option value="" disabled>Выберите отдел</option>
                        {addTarif.map((category, index) => (
                            <option key={index} value={category.id}>{category.name}</option>
                        ))}
                    </select>

                    <label>Аватар</label>
                    <input type="file" name="images" onChange={handleFileChange} />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestAirlineCompany;
