import React, { useState, useRef, useEffect } from "react";
import classes from './DropDownList.module.css';

function DropDownList({ options, initialValue = "", searchable = true, onSelect, placeholder, width }) {
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

    const filteredOptions = searchable
        ? options?.filter(option => option?.toLowerCase().includes(searchTerm.toLowerCase()))
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
            // disabled={!searchable}
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



/*

<DropDownList
    placeholder={'Введите авиакомпанию'}
    options={airlines.map(airline => airline.name)}
    initialValue={selectedAirline?.name || ""}
    onSelect={(value) => {
        const selectedAirline = airlines.find(airline => airline.name === value);
        setSelectedAirline(selectedAirline);
        setFormData(prevFormData => ({
            ...prevFormData,
            airlineId: selectedAirline?.id || ""
        }));
    }}
/>

Параметры DropDownList
placeholder={'Введите авиакомпанию'}:

Отвечает за текст-подсказку в поле ввода, когда оно пустое.
В этом случае, если поле ввода не содержит значения, в нем будет отображаться текст "Введите авиакомпанию".
options={airlines.map(airline => airline.name)}:

Передает в DropDownList массив опций для выпадающего списка.
airlines.map(airline => airline.name) создает массив, содержащий только названия авиакомпаний из полного массива airlines.
Этот массив будет использоваться для отображения доступных вариантов авиакомпаний в выпадающем списке.
initialValue={selectedAirline?.name || ""}:

Устанавливает начальное значение поля ввода в DropDownList.
Если selectedAirline задан, selectedAirline?.name установит его имя как начальное значение.
Если selectedAirline отсутствует (например, при первой загрузке), используется пустая строка "", чтобы поле было пустым.
onSelect={(value) => { ... }}:

Обработчик события, который вызывается при выборе значения из выпадающего списка.
В данном случае value — это выбранное название авиакомпании.
Внутри onSelect происходит следующее:
const selectedAirline = airlines.find(airline => airline.name === value);

Находит объект авиакомпании в массиве airlines, название которой (airline.name) совпадает с выбранным value.
selectedAirline будет содержать полную информацию об авиакомпании, а не только название.
setSelectedAirline(selectedAirline);

Обновляет selectedAirline, сохраняя выбранный объект авиакомпании для дальнейшего использования.
Это позволит, например, отобразить информацию о сотрудниках данной авиакомпании.
setFormData(prevFormData => ({ ...prevFormData, airlineId: selectedAirline?.id || "" }));

Обновляет состояние formData, добавляя или изменяя поле airlineId на ID выбранной авиакомпании.
Используется запись ...prevFormData для сохранения предыдущих значений полей формы.
airlineId: selectedAirline?.id || "" устанавливает airlineId в ID выбранной авиакомпании, или в пустую строку, если selectedAirline отсутствует.

*/