import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestNomerFond.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, UPDATE_HOTEL } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function EditRequestNomerFond({ show, id, onClose, nomer, places, category, onSubmit, uniqueCategories, tarifs, addTarif, setAddTarif, selectedNomer }) {
    const token = getCookie('token');

    const [formData, setFormData] = useState({
        nomerName: (nomer && nomer.name) || '',
        category: uniqueCategories[0] || '',
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (show) {
            setFormData({
                nomerName: (nomer && nomer.name) || '',
                category: category || uniqueCategories[0] || ''
            });
        }
    }, [show, nomer, category]);

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

        const nomerName = formData.nomerName.startsWith("№") ? formData.nomerName : `№ ${formData.nomerName}`;

        let response_update_room = await updateHotel({
            variables: {
                updateHotelId: id,
                input: {
                    rooms: [
                        {
                            id: nomer.id,
                            name: nomerName,
                            category: formData.category.origName
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
                    <input type="text" name="nomerName" value={formData.nomerName.replace(/№\s*/g, '')} onChange={handleChange} placeholder="Пример: № 151" />

                    <label>Категория</label>
                    <select name="category" value={formData.category} onChange={handleChange}>
                        {uniqueCategories.map(category => (
                            <option key={category} value={category}>{category == 'onePlace' ? 'Одноместный' : category == 'twoPlace' ? 'Двухместный' : ''}</option>
                        ))}
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
