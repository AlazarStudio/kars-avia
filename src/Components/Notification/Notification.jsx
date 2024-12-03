import React, { useState, useEffect } from "react";
import classes from "../Notification/Notification.module.css"; // Стили для анимации и оформления

const Notification = ({ text, status, onClose, index }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, 5000); // Уведомление висит 5 секунд

        return () => clearTimeout(timer); // Очистка таймера при размонтировании
    }, []);

    useEffect(() => {
        if (!visible) {
            const exitTimer = setTimeout(() => {
                if (onClose) onClose();
            }, 300); // Время для завершения анимации

            return () => clearTimeout(exitTimer);
        }
    }, [visible, onClose]);

    // Обработчик кнопки закрытия
    const handleClose = () => {
        setVisible(false);
    };
    return (
        <div className={`${classes.notification} ${classes[status]} ${visible ? classes.visible : classes.hidden} `} style={{ bottom: `calc(${index * 52 + 20}px)` }}>
            <span>{text}</span>
            <button className={classes.closeButton} onClick={handleClose}>
                ✕
            </button>
        </div>
    );
};

export default Notification;
