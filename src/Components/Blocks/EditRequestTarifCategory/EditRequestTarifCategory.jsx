import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestTarifCategory.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function EditRequestTarifCategory({ show, onClose, tarif, onSubmit, addTarif }) {
    const [formData, setFormData] = useState({
        tarifName: '',
        categories: {
            type: '',
            price: '',
            price_airline: '',
        },
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (show && tarif) {
            setFormData({
                tarifName: tarif.data.tarif,
                categories: {
                    type: tarif.data.category.type || '',
                    price: tarif.data.category.price || '',
                    price_airline: tarif.data.category.price_airline || '',
                },
            });
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
        
        // Если изменяем одно из полей categories
        if (name === 'type' || name === 'price' || name === 'price_airline') {
            setFormData(prevState => ({
                ...prevState,
                categories: {
                    ...prevState.categories,
                    [name]: value,
                },
            }));
        } else {
            // Если изменяем другие поля, например tarifName
            setFormData(prevState => ({
                ...prevState,
                [name]: value,
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const [tarifNames, setTarifNames] = useState([]);

    useEffect(() => {
        const names = addTarif.map(tarif => tarif.tarifName);
        setTarifNames(names);
    }, [addTarif]);

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Редактировать</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Выберите тариф</label>
                    <select name="tarifName" value={formData.tarifName} onChange={handleChange}>
                        <option value="">Выберите тариф</option>
                        {tarifNames.map((name, index) => (
                            <option key={index} value={name}>{name}</option>
                        ))}
                    </select>

                    <label>Тип номера</label>
                    <input
                        type="text"
                        name="type"
                        value={formData.categories.type}
                        onChange={handleChange}
                        placeholder="Введите тип номера"
                    />

                    <label>Стоимость</label>
                    <input
                        type="text"
                        name="price"
                        value={formData.categories.price}
                        onChange={handleChange}
                        placeholder="Введите стоимость"
                    />

                    <label>Стоимость для авиакомпании</label>
                    <input
                        type="text"
                        name="price_airline"
                        value={formData.categories.price_airline}
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
