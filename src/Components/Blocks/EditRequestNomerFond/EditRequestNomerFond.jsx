import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestNomerFond.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { UPDATE_HOTEL } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function EditRequestNomerFond({ show, id, onClose, nomer, places, category, onSubmit, uniqueCategories, tarifs, addTarif, setAddTarif, selectedNomer }) {
    const [formData, setFormData] = useState({
        nomerName: (nomer && nomer.name) || '',
        category: uniqueCategories[0] || '',
        places: (nomer && nomer.places) || 1
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (show) {
            setFormData({
                nomerName: (nomer && nomer.name) || '',
                places: (nomer && nomer.places) || 1,
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

    const [updateHotel] = useMutation(UPDATE_HOTEL);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nomerName = formData.nomerName.startsWith("№") ? formData.nomerName : `№ ${formData.nomerName}`;

        let roomName = selectedNomer.category.name;
        let roomTariff = selectedNomer.category.tariffs.name;

        const existingCategoryForRooms = addTarif.find(tarif =>
            tarif.name.toLowerCase() === roomName.toLowerCase() &&
            tarif.tariffs.name.toLowerCase() === roomTariff.toLowerCase()
        );

        let response_update_room = await updateHotel({
            variables: {
                updateHotelId: id,
                input: {
                    "rooms": [
                        {
                            "id": nomer.id,
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
                    <input type="text" name="nomerName" value={formData.nomerName} onChange={handleChange} placeholder="Пример: № 151" />

                    <label>Количество мест в номере</label>
                    <input type="number" name="places" value={formData.places} onChange={handleChange} placeholder="1" />

                    {/* <label>Категория</label>
                    <select name="category" value={formData.category} onChange={handleChange}>
                        {uniqueCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select> */}
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Сохранить изменения</Button>
            </div>
        </Sidebar>
    );
}

export default EditRequestNomerFond;
