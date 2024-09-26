import React, { useState, useRef, useEffect } from "react";
import classes from './EditRequestAirlineOtdel.module.css';
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { CREATE_AIRLINE_DEPARTMERT, decodeJWT, getCookie } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";

function EditRequestAirlineOtdel({ show, onClose, id, category, onSubmit }) {
    const [userRole, setUserRole] = useState();
    const token = getCookie('token');

    useEffect(() => {
        setUserRole(decodeJWT(token).role);
    }, [token]);

    const [formData, setFormData] = useState({
        type: ''
    });

    const sidebarRef = useRef();

    useEffect(() => {
        if (show && category) {
            setFormData({ type: category.name });
        }
    }, [show, category]);

    const closeButton = () => {
        let success = confirm("Вы уверены, все несохраненные данные будут удалены");
        if (success) {
            onClose();
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ [name]: value });
    };

    const [createAirlineDepartment] = useMutation(CREATE_AIRLINE_DEPARTMERT, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let request = await createAirlineDepartment({
                variables: {
                    "updateAirlineId": id,
                    "input": {
                        "department": [
                            {
                                id: category.id,
                                name: formData.type
                            }
                        ]
                    }
                }
            });

            if (request) {
                const sortedDepartments = request.data.updateAirline.department.map(department => ({
                    ...department,
                    users: department.users.sort((a, b) => a.name.localeCompare(b.name))
                })).sort((a, b) => a.name.localeCompare(b.name));

                onSubmit(sortedDepartments);
            }
        } catch (err) {
            alert('Произошла ошибка при сохранении данных');
        }

    };

    return (
        <Sidebar show={show} sidebarRef={sidebarRef}>
            <div className={classes.requestTitle}>
                <div className={classes.requestTitle_name}>Изменить отдел</div>
                <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
            </div>

            <div className={classes.requestMiddle}>
                <div className={classes.requestData}>
                    <label>Название отдела</label>
                    <input type="text" name="type" value={formData.type} onChange={handleChange} placeholder="Пример: 1" />
                </div>
            </div>

            <div className={classes.requestButon}>
                <Button type="submit" onClick={handleSubmit}>Изменить</Button>
            </div>
        </Sidebar>
    );
}

export default EditRequestAirlineOtdel;
