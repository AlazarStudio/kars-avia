import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestTarif.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

function EditRequestTarif({ show, onClose, tarif, onSubmit }) {
    const [formData, setFormData] = useState({
        tarifName: '',
        tarif_сategory_one_place: '',
        tarif_сategory_two_place: '',
        tarif_сategory_three_place: '',
        tarif_airline_one_place: '',
        tarif_airline_two_place: '',
        tarif_airline_three_place: ''
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (show && tarif) {
            setFormData(tarif);
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
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Редактировать тариф</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Название</label>
                    <input type="text" name="tarifName" value={formData.tarifName} onChange={handleChange} />
                    
                    <label className={classes.titleLabel}>Стоимость в категории (в рублях)</label>

                    <label>Одноместный</label>
                    <input type="text" name="tarif_сategory_one_place" value={formData.tarif_сategory_one_place} onChange={handleChange} />

                    <label>Двухместный</label>
                    <input type="text" name="tarif_сategory_two_place" value={formData.tarif_сategory_two_place} onChange={handleChange} />

                    <label>Трехместный</label>
                    <input type="text" name="tarif_сategory_three_place" value={formData.tarif_сategory_three_place} onChange={handleChange} />
                    
                    <label className={classes.titleLabel}>Стоимость для авиакомпаний (в рублях)</label>

                    <label>Одноместный</label>
                    <input type="text" name="tarif_airline_one_place" value={formData.tarif_airline_one_place} onChange={handleChange} />

                    <label>Двухместный</label>
                    <input type="text" name="tarif_airline_two_place" value={formData.tarif_airline_two_place} onChange={handleChange} />

                    <label>Трехместный</label>
                    <input type="text" name="tarif_airline_three_place" value={formData.tarif_airline_three_place} onChange={handleChange} />
                </div>

            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Изменить</Button>
            </div>
        </Sidebar>
    );
}

export default EditRequestTarif;
