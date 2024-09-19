import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestCategoryNomer.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { UPDATE_HOTEL } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function CreateRequestCategoryNomer({ show, onClose, id, addTarif, setAddTarif, uniqueCategories }) {
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

    const [updateHotel] = useMutation(UPDATE_HOTEL);

    const handleSubmit = async (e) => {
        e.preventDefault();

        let response_update_category = await updateHotel({
            variables: {
                updateHotelId: id,
                input: {
                    "categories": [
                        {
                            "name": formData.category
                        }
                    ]
                }
            }
        });

        if (response_update_category.data.updateHotel) {

            setAddTarif(prevTarifs => {
                const categoryExists = prevTarifs.some(tarif => tarif.name === formData.category);

                if (categoryExists) {
                    alert("Такая категория уже существует!");
                    return prevTarifs;
                }

                const updatedTarifs = [
                    ...prevTarifs,
                    {
                        name: formData.category,
                        rooms: []
                    }
                ];

                return updatedTarifs.sort((a, b) => a.name.localeCompare(b.name));
            });

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
                <div className={classes.requestTitle_name}>Добавить категорию</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Количество мест</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Пример: 1" />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Добавить</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestCategoryNomer;
