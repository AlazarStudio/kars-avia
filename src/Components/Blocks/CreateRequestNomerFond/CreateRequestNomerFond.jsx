import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestNomerFond.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { UPDATE_HOTEL } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function CreateRequestNomerFond({ show, onClose, addTarif, id, setAddTarif, uniqueCategories, tarifs }) {
    const [formData, setFormData] = useState({
        nomerName: '',
        places: 1,
        category: ''
    });

    const [updateHotel] = useMutation(UPDATE_HOTEL);


    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            nomerName: '',
            places: 1,
            category: uniqueCategories[0] || ''
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

        let nameInfo = formData.category.split(' - ');

        const existingCategoryForRooms = addTarif.find(tarif =>
            tarif.name.toLowerCase() === nameInfo[0].toLowerCase() &&
            tarif.tariffs.name.toLowerCase() === nameInfo[1].toLowerCase()
        );

        const nomerName = formData.nomerName.startsWith("№") ? formData.nomerName : `№ ${formData.nomerName}`;

        let response_update_room = await updateHotel({
            variables: {
                updateHotelId: id,
                input: {
                    "rooms": [
                        {
                            "name": nomerName,
                            "places": Number(formData.places),
                            "categoryId": existingCategoryForRooms.id
                        }
                    ]
                }
            }
        });

        if (response_update_room) {
            const sortedTarifs = response_update_room.data.updateHotel.categories.map(tarif => ({
                ...tarif,
                rooms: [...tarif.rooms].sort((a, b) => a.name.localeCompare(b.name))
            })).sort((a, b) => a.name.localeCompare(b.name));

            setAddTarif(sortedTarifs);
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
                <div className={classes.requestTitle_name}>Добавить номер</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Название номера</label>
                    <input type="text" name="nomerName" value={formData.nomerName} onChange={handleChange} placeholder="Пример: № 151" />

                    <label>Количество мест в номере</label>
                    <input type="number" name="places" value={formData.places} onChange={handleChange} placeholder="1" />

                    <label>Категория</label>
                    <select name="category" value={formData.category} onChange={handleChange}>
                        {uniqueCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestNomerFond;
