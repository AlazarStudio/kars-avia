import React, { useState, useRef } from "react";
import classes from './InfoTableDataReserve_passengers.module.css';
import InfoTable from "../InfoTable/InfoTable";
import Button from "../../Standart/Button/Button";

function InfoTableDataReserve_passengers({ placement, setPlacement, toggleUpdateSidebar, setIdPassangerForUpdate, openDeletecomponent, toggleChooseHotel, user, request }) {
    const [editingId, setEditingId] = useState(null);
    const [editedData, setEditedData] = useState({});
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newGuestData, setNewGuestData] = useState({
        passenger: '',
        gender: '',
        phone: '',
        type: 'Пассажир',
        order: ''
    });
    const [currentHotelIndex, setCurrentHotelIndex] = useState(null);

    const newGuestRef = useRef(null);

    const handleUpdate = (id) => {
        toggleUpdateSidebar();
        setIdPassangerForUpdate(id);
    };

    const handleEdit = (id, guest) => {
        setEditingId(id);
        setEditedData(guest);
    };

    const handleChange = (field, value) => {
        setEditedData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSave = (hotelIndex) => {
        setPlacement((prevPlacement) => {
            const updatedPlacement = [...prevPlacement];
            const hotel = updatedPlacement[hotelIndex];

            if (editedData.type === 'Пассажир') {
                hotel.hotel.passengers = hotel.hotel.passengers.map((passenger) =>
                    passenger.id === editingId ? { ...passenger, ...editedData } : passenger
                );
            } else {
                hotel.hotel.person = hotel.hotel.person.map((person) =>
                    person.id === editingId ? { ...person, ...editedData } : person
                );
            }

            return updatedPlacement;
        });

        setEditingId(null);
        setEditedData({});
    };

    const handleAddNew = () => {
        if (currentHotelIndex === null) return;

        setPlacement((prevPlacement) => {
            const updatedPlacement = [...prevPlacement];
            const hotel = updatedPlacement[currentHotelIndex];

            const newGuest = { ...newGuestData, id: Date.now(), order: hotel.hotel?.passengers?.length + hotel.hotel?.person?.length + 1 };

            if (newGuest.type === 'Пассажир') {
                hotel.hotel.passengers.push(newGuest);
            } else {
                hotel.hotel.person.push(newGuest);
            }

            return updatedPlacement;
        });

        setIsAddingNew(false);
        setNewGuestData({
            passenger: '',
            gender: '',
            phone: '',
            type: 'Пассажир',
            order: ''
        });
        setCurrentHotelIndex(null);
    };

    const startAddingNew = (hotelIndex) => {
        setIsAddingNew(true);
        setCurrentHotelIndex(hotelIndex);

        setTimeout(() => {
            newGuestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const getAllGuests = (hotel) => {
        return [
            ...hotel.passengers.map((passenger) => ({
                ...passenger,
                type: 'Пассажир',
            })),
            ...hotel.person.map((person) => ({
                ...person,
                type: 'Сотрудник',
            }))
        ];
    };

    console.log(request)
    return (
        <InfoTable>
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>№</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w35}`}>ФИО</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Пол</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Номер телефона</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Тип</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Действия</div>
            </div>

            <div className={classes.bottom}>
                {placement.map((item, hotelIndex) => (
                    <React.Fragment key={hotelIndex}>
                        <div className={`${classes.InfoTable_data} ${classes.stickyHeader}`}>
                            <div className={`${classes.InfoTable_data_elem} ${classes.w100}`}>
                                <b>{item.hotel.name}</b> {getAllGuests(item.hotel).length} гостей из 30
                                <Button onClick={() => startAddingNew(hotelIndex)}>Добавить гостя</Button>
                            </div>
                        </div>
                        {getAllGuests(item.hotel).sort((a, b) => a.order - b.order).map((guest, index) => (
                            <div className={classes.InfoTable_data} key={guest.id}>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{index + 1}</div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w35}`}>
                                    {editingId === guest.id ? (
                                        <input
                                            type="text"
                                            value={editedData.passenger || ''}
                                            onChange={(e) => handleChange('passenger', e.target.value)}
                                        />
                                    ) : (
                                        guest.passenger
                                    )}
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    {editingId === guest.id ? (
                                        <select
                                            value={editedData.gender || ''}
                                            onChange={(e) => handleChange('gender', e.target.value)}
                                        >
                                            <option value="">Выберите пол</option>
                                            <option value="Мужской">Мужской</option>
                                            <option value="Женский">Женский</option>
                                        </select>
                                    ) : (
                                        guest.gender || '-'
                                    )}
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    {editingId === guest.id ? (
                                        <input
                                            type="text"
                                            value={editedData.phone || ''}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                        />
                                    ) : (
                                        guest.phone || '-'
                                    )}
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    {guest.type}
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    {editingId === guest.id ? (
                                        <Button onClick={() => handleSave(hotelIndex)}>Сохранить</Button>
                                    ) : (
                                        <>
                                            <img src="/editPassenger.png" alt="" onClick={() => handleEdit(guest.id, guest)} />
                                            <img src="/deletePassenger.png" alt="" onClick={() => openDeletecomponent(guest.id)} />
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isAddingNew && currentHotelIndex === hotelIndex && (
                            <div className={classes.InfoTable_data} ref={newGuestRef}>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}></div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w35}`}>
                                    <input
                                        type="text"
                                        placeholder="ФИО"
                                        value={newGuestData.passenger}
                                        onChange={(e) => setNewGuestData({ ...newGuestData, passenger: e.target.value })}
                                    />
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    <select
                                        value={newGuestData.gender}
                                        onChange={(e) => setNewGuestData({ ...newGuestData, gender: e.target.value })}
                                    >
                                        <option value="">Выберите пол</option>
                                        <option value="Мужской">Мужской</option>
                                        <option value="Женский">Женский</option>
                                    </select>
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    <input
                                        type="text"
                                        placeholder="Номер телефона"
                                        value={newGuestData.phone}
                                        onChange={(e) => setNewGuestData({ ...newGuestData, phone: e.target.value })}
                                    />
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    <select
                                        value={newGuestData.type}
                                        onChange={(e) => setNewGuestData({ ...newGuestData, type: e.target.value })}
                                    >
                                        <option value="Пассажир">Пассажир</option>
                                        <option value="Сотрудник">Сотрудник</option>
                                    </select>
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    <Button onClick={handleAddNew}>Добавить</Button>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className={classes.counting}>
                <div className={classes.countingPeople}>
                    <img src="/peopleCount.png" alt="" />
                    {placement.length} отелей
                </div>
            </div>
        </InfoTable>
    );
}

export default InfoTableDataReserve_passengers;
