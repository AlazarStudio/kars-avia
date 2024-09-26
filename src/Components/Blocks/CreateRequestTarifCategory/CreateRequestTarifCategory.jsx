import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestTarifCategory.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, UPDATE_HOTEL_TARIF } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";
function CreateRequestTarifCategory({ show, id, onClose, addTarif, setAddTarif }) {
    const token = getCookie('token');

    const [formData, setFormData] = useState({
        tarifName: '',
        type: '',
        price: '',
        price_airline: '',
    });

    const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const [tarifNames, setTarifNames] = useState([]);
    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            tarifName: '',
            type: '',
            price: '',
            price_airline: '',
        });
    };

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены?");
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

    const add_prices = async (categoryID) => {
        let response_update_prices = await updateHotelTarif({
            variables: {
                updateHotelId: id,
                input: {
                    "prices": [
                        {
                            "amount": Number(formData.price),
                            "amountair": Number(formData.price_airline),
                            "categoryId": categoryID,
                            "tariffId": formData.tarifName
                        }
                    ]
                }
            }
        });

        return response_update_prices
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let response_update_tarif = await updateHotelTarif({
                variables: {
                    updateHotelId: id,
                    input: {
                        "categories": [
                            {
                                "name": formData.type,
                                "tariffId": formData.tarifName
                            }
                        ]
                    }
                }
            });

            if (response_update_tarif && response_update_tarif.data && response_update_tarif.data.updateHotel) {
                response_update_tarif.data.updateHotel.tariffs.map((tarif) => {
                    if (tarif.id == formData.tarifName) {
                        tarif.category.map(async (category) => {
                            if (category.name == formData.type) {
                                let info = await add_prices(category.id);

                                if (info && info.data && info.data.updateHotel) {
                                    setAddTarif(info.data.updateHotel.tariffs);
                                    resetForm();
                                    onClose();
                                } else {
                                    console.error("Ошибка при обновлении данных тарифов");
                                }
                            }
                        });
                    }
                });
            } else {
                console.error("Ответ не содержит данных по отелям.");
            }
        } catch (error) {
            console.error("Произошла ошибка при выполнении запроса:", error);
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

    useEffect(() => {
        const names = addTarif.map(tarif => ({
            id: tarif.id,
            name: tarif.name
        })
        );
        setTarifNames(names);
    }, [addTarif]);

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Добавить категорию</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Выберите тариф</label>
                    <select name="tarifName" value={formData.tarifName} onChange={handleChange}>
                        <option value="" disabled>Выберите тариф</option>
                        {tarifNames.map((name, index) => (
                            <option key={index} value={name.id}>{name.name}</option>
                        ))}
                    </select>

                    <label>Название номера</label>
                    <input
                        type="text"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        placeholder="Введите название номера"
                    />

                    <label>Стоимость</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Введите стоимость"
                    />

                    <label>Стоимость для авиакомпании</label>
                    <input
                        type="number"
                        name="price_airline"
                        value={formData.price_airline}
                        onChange={handleChange}
                        placeholder="Введите стоимость для авиакомпании"
                    />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Добавить категорию</Button>
            </div>
        </Sidebar>
    );
}

export default CreateRequestTarifCategory;
