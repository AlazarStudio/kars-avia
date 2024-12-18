import React, { useState, useRef, useEffect } from "react";
import classes from './DropDownListObj.module.css';

function DropDownListObj({ options, initialValue = "", searchable = true, onSelect, placeholder, width }) {
    const [searchTerm, setSearchTerm] = useState(initialValue);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        setSearchTerm(initialValue);
    }, [initialValue]);

    const handleSelect = (option) => {
        setSearchTerm(option.name); // Отображаем название при выборе
        setIsOpen(false);
        onSelect(option); // Передаем объект с id и name
    };

    const handleOutsideClick = (e) => {
        if (searchRef.current && !searchRef.current.contains(e.target)) {
            const exactMatch = options.some(option => option.name === searchTerm);
            if (!exactMatch) {
                setSearchTerm(""); // Если нет точного совпадения, очищаем строку
            }
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [searchTerm, options]);

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
    };

    const handleFocus = () => {
        setIsOpen(true);
    };

    // Фильтрация по строке поиска
    const filteredOptions = searchable
        ? options.filter(option => option.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        : options;

    return (
        <div className={classes.dropdown} ref={searchRef} style={{ width: width ? width : '100%' }}>
            <input
                type="text"
                className={classes.search}
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleFocus}
                placeholder={placeholder}
                onClick={() => setSearchTerm('')}
            />
            {isOpen && (
                <ul className={classes.dropdownList}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <li
                                key={index}
                                className={classes.dropdownItem}
                                onClick={() => handleSelect(option)}
                            >
                                {option.name} {/* Отображаем название */}
                            </li>
                        ))
                    ) : (
                        <li className={classes.dropdownItem}>
                            Ничего не найдено
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}

export default DropDownListObj;
