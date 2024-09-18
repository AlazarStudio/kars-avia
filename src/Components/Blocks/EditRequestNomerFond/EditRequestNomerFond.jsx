import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestNomerFond.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function EditRequestNomerFond({ show, onClose, nomer, category, onSubmit, uniqueCategories, tarifs }) {
    const [formData, setFormData] = useState({
        nomerName: (nomer && nomer.name) || '',
        category: uniqueCategories[0] || '',
        tarif: tarifs[0] || ''
    });
    
    const [tarifNames, setTarifNames] = useState([]);

    useEffect(() => {
        const names = tarifs.map(tarif => tarif.tarifName);
        setTarifNames(names);
    }, [tarifs]);

    const sidebarRef = useRef();

    useEffect(() => {
        if (show) {
            setFormData({
                nomerName: (nomer && nomer.name) || '',
                category: category || uniqueCategories[0] || '',
                tarif: tarifs[0] || ''
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

    const handleSubmit = (e) => {
        e.preventDefault();

        const nomerName = formData.nomerName.startsWith("№") ? formData.nomerName : `№ ${formData.nomerName}`;

        onSubmit(nomerName, nomer, formData.category);
        onClose();
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

                    <label>Категория</label>
                    <select name="category" value={formData.category} onChange={handleChange}>
                        {uniqueCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
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
                <Button type="submit" onClick={handleSubmit}>Сохранить изменения</Button>
            </div>
        </Sidebar>
    );
}

export default EditRequestNomerFond;
