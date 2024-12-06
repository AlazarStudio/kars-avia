import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestNomerFond.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, UPDATE_HOTEL } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function EditRequestNomerFond({ show, id, onClose, nomer, places, category, reserve, active, onSubmit, uniqueCategories, tarifs, addTarif, setAddTarif, selectedNomer }) {
    const token = getCookie('token');
    // console.log(category);


    const [formData, setFormData] = useState({
        nomerName: (nomer && nomer.name) || '',
        category: category?.origName || '',
        reserve: nomer?.reserve || '',
        active: nomer?.active || ''
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (show) {
            setFormData({
                nomerName: nomer?.name || '',
                category: category.origName || nomer?.category || '',
                reserve: typeof nomer?.reserve === "boolean" ? nomer?.reserve : false, // Установить false, если undefined
                active: typeof nomer?.active === "boolean" ? nomer?.active : false,   // Установить false, если undefined
            });
        }
    }, [show, nomer, category, reserve, active]);


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

    const [updateHotel] = useMutation(UPDATE_HOTEL, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nomerName = formData.nomerName;

        let response_update_room = await updateHotel({
            variables: {
                updateHotelId: id,
                input: {
                    rooms: [
                        {
                            id: nomer.id,
                            name: nomerName,
                            category: formData.category,
                            reserve: formData.reserve,
                            active: formData.active
                        }
                    ]
                }
            }
        });

        if (response_update_room) {
            const sortedTarifs = Object.values(
                response_update_room.data.updateHotel.rooms
                    .reduce((acc, room) => {
                        if (!acc[room.category]) {
                            acc[room.category] = {
                                name: room.category === 'onePlace' ? 'Одноместный' : room.category === 'twoPlace' ? 'Двухместный' : '',
                                origName: room.category,
                                rooms: []
                            };
                        }
                        acc[room.category].rooms.push(room);
                        return acc;
                    }, {})
            );

            sortedTarifs.forEach(category => {
                category.rooms.sort((a, b) => a.name.localeCompare(b.name));
            });

            setAddTarif(sortedTarifs);
            onSubmit(nomerName, nomer, formData.category);
            onClose();
        }
    };

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Редактировать номер</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Название номера</label>
                    <input type="text" name="nomerName" value={formData.nomerName} onChange={handleChange} placeholder="Пример: 151" />

                    <label>Категория</label>
                    <select name="category" value={formData.category} onChange={handleChange}>
                        <option value="onePlace">Одноместный</option>
                        <option value="twoPlace">Двухместный</option>
                        {/* {uniqueCategories.map(category => (
                            <option key={category} value={category}>{category == 'onePlace' ? 'Одноместный' : category == 'twoPlace' ? 'Двухместный' : ''}</option>
                        ))} */}
                    </select>

                    <label>Тип</label>
                    <select
                        name="reserve"
                        value={formData.reserve === true ? "true" : formData.reserve === false ? "false" : ""}
                        onChange={(e) => {
                            const value = e.target.value === "true"; // Преобразование строки в булевое значение
                            setFormData((prevState) => ({
                                ...prevState,
                                reserve: value,
                            }));
                        }}
                    >
                        <option value="" disabled>
                            Выберите тип
                        </option>
                        <option value="false">Квота</option>
                        <option value="true">Резерв</option>
                    </select>

                    <label>Состояние</label>
                    <select
                        name="active"
                        value={formData.active === true ? "true" : formData.active === false ? "false" : ""}
                        onChange={(e) => {
                            const value = e.target.value === "true";
                            setFormData((prevState) => ({
                                ...prevState,
                                active: value,
                            }));
                        }}
                    >
                        <option value="" disabled>
                            Выберите состояние
                        </option>
                        <option value="false">Не работает</option>
                        <option value="true">Работает</option>
                    </select>

                </div>
            </div>

            <div className={classes.requestButton}>
                <Button type="submit" onClick={handleSubmit}>Сохранить изменения</Button>
            </div>
        </Sidebar>
    );
}

export default EditRequestNomerFond;
