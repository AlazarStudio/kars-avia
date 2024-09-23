import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestTarifCategory.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, UPDATE_HOTEL_TARIF } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function EditRequestTarifCategory({ show, onClose, tarif, onSubmit, addTarif, id, setAddTarif }) {
    const token = getCookie('token');

    const [formData, setFormData] = useState({});

    const sidebarRef = useRef();

    const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    useEffect(() => {
        if (show && tarif) {
            setFormData(tarif.data);
        }
    }, [show, tarif]);


    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены");
        if (success) {
            onClose();
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
    
        if (name === 'tarifName') {
            const selectedTarif = addTarif.find(tarif => tarif.name === value);
            setFormData(prevState => ({
                ...prevState,
                tarif: selectedTarif
            }));
        } else if (name === 'type') {
            setFormData(prevState => ({
                ...prevState,
                category: {
                    ...prevState.category,
                    name: value,
                },
            }));
        } else if (name === 'price' || name === 'price_airline') {
            setFormData(prevState => ({
                ...prevState,
                category: {
                    ...prevState.category,
                    prices: [
                        {
                            ...prevState.category?.prices?.[0],
                            [name === 'price' ? 'amount' : 'amountair']: value,
                        }
                    ],
                },
            }));
        } else {
            setFormData(prevState => ({
                ...prevState,
                [name]: value,
            }));
        }
    };
    

    const handleSubmit = async (e) => {
        e.preventDefault();

        let response_update_category = await updateHotelTarif({
            variables: {
                updateHotelId: id,
                input: {
                    "categories": [
                        {
                            "name": formData.category.name,
                            "id": formData.category.id
                        }
                    ]
                }
            }
        });
        
        let response_update_prices = await updateHotelTarif({
            variables: {
                updateHotelId: id,
                input: {
                    "prices": [
                        {
                            "id": formData.category.prices[0].id,
                            "amount": Number(formData.category.prices[0].amount),
                            "amountair": Number(formData.category.prices[0].amountair),
                            "categoryId": formData.category.id,
                            "tariffId": formData.tarif.id
                        }
                    ]
                }
            }
        });

        if (response_update_category && response_update_prices) {
            setAddTarif(response_update_prices.data.updateHotel.tariffs)
            onClose();
        }
    };

    const [tarifNames, setTarifNames] = useState([]);

    useEffect(() => {
        const names = addTarif.map(tarif => tarif.name);
        setTarifNames(names);
    }, [addTarif]);

    useEffect(() => {
        if (show) {
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
                <div className={classes.requestTitle_name}>Редактировать</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="close" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    {/* <label>Выберите тариф</label>
                    <select name="tarifName" value={formData?.tarif?.name} onChange={handleChange}>
                        <option value="">Выберите тариф</option>
                        {tarifNames.map((name, index) => (
                            <option key={index} value={name}>{name}</option>
                        ))}
                    </select> */}

                    <label>Тип номера</label>
                    <input
                        type="text"
                        name="type"
                        value={formData?.category?.name || ''}
                        onChange={handleChange}
                        placeholder="Введите тип номера"
                    />

                    <label>Стоимость</label>
                    <input
                        type="text"
                        name="price"
                        value={formData?.category?.prices?.[0]?.amount || ''}
                        onChange={handleChange}
                        placeholder="Введите стоимость"
                    />

                    <label>Стоимость для авиакомпании</label>
                    <input
                        type="text"
                        name="price_airline"
                        value={formData?.category?.prices?.[0]?.amountair || ''}
                        onChange={handleChange}
                        placeholder="Введите стоимость для авиакомпании"
                    />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Изменить</Button>
            </div>
        </Sidebar>
    );
}

export default EditRequestTarifCategory;
