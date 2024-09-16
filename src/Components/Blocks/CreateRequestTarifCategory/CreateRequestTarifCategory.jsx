import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestTarifCategory.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function CreateRequestTarifCategory({ show, onClose, addTarif, setAddTarif }) {
    const [formData, setFormData] = useState({
        tarifName: '',
        type: '',
        price: '',
        price_airline: '',
    });

    const [tarifNames, setTarifNames] = useState([]); // Для хранения наименований тарифов
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

    const handleSubmit = (e) => {
        e.preventDefault();

        // Найдём тариф по имени и добавим новую категорию в его список категорий
        const updatedTarifs = addTarif.map(tarif => {
            if (tarif.tarifName === formData.tarifName) {
                // Новая категория
                const newCategory = {
                    type: formData.type,
                    price: formData.price,
                    price_airline: formData.price_airline
                };

                return {
                    ...tarif,
                    categories: [...tarif.categories, newCategory] // Добавляем новую категорию в массив категорий
                };
            }
            return tarif;
        });

        setAddTarif(updatedTarifs); // Обновляем список тарифов
        resetForm(); // Сброс формы
        onClose(); // Закрытие сайдбара
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
        // Собираем наименования тарифов из addTarif
        const names = addTarif.map(tarif => tarif.tarifName);
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
                        <option value="">Выберите тариф</option>
                        {tarifNames.map((name, index) => (
                            <option key={index} value={name}>{name}</option>
                        ))}
                    </select>

                    <label>Тип номера</label>
                    <input
                        type="text"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        placeholder="Введите тип номера"
                    />

                    <label>Стоимость</label>
                    <input
                        type="text"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Введите стоимость"
                    />

                    <label>Стоимость для авиакомпании</label>
                    <input
                        type="text"
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
