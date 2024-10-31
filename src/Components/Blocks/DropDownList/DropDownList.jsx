import React, { useState, useRef, useEffect } from "react";
import classes from './DropDownList.module.css';

function DropDownList({ options, initialValue = "", searchable = true, onSelect }) {
    const [searchTerm, setSearchTerm] = useState(initialValue);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        setSearchTerm(initialValue);
    }, [initialValue]);

    const handleSelect = (option) => {
        setSearchTerm(option);
        setIsOpen(false);
        onSelect(option);
    };

    const handleOutsideClick = (e) => {
        if (searchRef.current && !searchRef.current.contains(e.target)) {
            const exactMatch = options.some(option => option === searchTerm);
            if (!exactMatch) {
                setSearchTerm("");
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

    const filteredOptions = options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className={classes.dropdown} ref={searchRef}>
            <input
                type="text"
                className={classes.search}
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleFocus}
                placeholder="Поиск..."
                disabled={!searchable}
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
                                {option}
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

export default DropDownList;
