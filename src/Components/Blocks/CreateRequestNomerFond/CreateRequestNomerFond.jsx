import React, { useState, useRef, useEffect } from "react";
import classes from './CreateRequestNomerFond.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function CreateRequestNomerFond({ show, onClose, addTarif, setAddTarif, uniqueCategories, tarifs }) {
    const [formData, setFormData] = useState({
        nomerName: '',
        category: '1',
        tarif: ''
    });
    
    const [tarifNames, setTarifNames] = useState([]);

    useEffect(() => {
        const names = tarifs.map(tarif => tarif.tarifName);
        setTarifNames(names);
    }, [tarifs]);

    const sidebarRef = useRef();

    const resetForm = () => {
        setFormData({
            nomerName: '',
            category: uniqueCategories[0] || '1',
            tarif: ''
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

    const handleSubmit = (e) => {
        e.preventDefault();

        const nomerName = formData.nomerName.startsWith("№") ? formData.nomerName : `№ ${formData.nomerName}`;

        setAddTarif(prevTarifs => {
            const existingCategory = prevTarifs.find(tarif => tarif.type === formData.category);

            if (existingCategory) {
                const updatedNumbers = [...existingCategory.numbers, nomerName].sort((a, b) => {
                    const numA = parseInt(a.replace(/^\D+/g, ''));
                    const numB = parseInt(b.replace(/^\D+/g, ''));
                    return numA - numB;
                });

                return prevTarifs.map(tarif =>
                    tarif.type === formData.category
                        ? { ...tarif, numbers: updatedNumbers }
                        : tarif
                );
            } else {
                return [
                    ...prevTarifs,
                    {
                        type: formData.category,
                        numbers: [nomerName]
                    }
                ];
            }
        });
        resetForm();
        onClose();
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

                    <label>Категория</label>
                    <select name="category" value={formData.category} onChange={handleChange}>
                        {uniqueCategories.map(category => (
                            <option key={category} value={category}>{category} - местный</option>
                        ))}
                    </select>

                    <label>Тариф</label>
                    <select name="tarif" value={formData.tarif} onChange={handleChange}>
                        {tarifNames.map(category => (
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
