import React, { useState, useRef, useEffect } from "react";
import classes from './InfoTableDataReserve_passengers.module.css';
import InfoTable from "../InfoTable/InfoTable";
import Button from "../../Standart/Button/Button";
import { GET_AIRLINES_RELAY } from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";

function InfoTableDataReserve_passengers({ placement, setPlacement, toggleUpdateSidebar, setIdPassangerForUpdate, openDeletecomponent, toggleChooseHotel, user, request, airline }) {
    const [editingId, setEditingId] = useState(null);
    const [editedData, setEditedData] = useState({});
    const [isAddingNewPassenger, setIsAddingNewPassenger] = useState(false);
    const [isAddingNewPerson, setIsAddingNewPerson] = useState(false);
    const [newPassengerData, setNewPassengerData] = useState({
        passenger: '',
        gender: '',
        phone: '',
        type: 'Пассажир',
        order: ''
    });
    const [newPersonData, setNewPersonData] = useState({
        passenger: '',
        gender: '',
        phone: '',
        type: 'Сотрудник',
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

    const handleAddNewPassenger = () => {
        if (currentHotelIndex === null) return;

        setPlacement((prevPlacement) => {
            const updatedPlacement = [...prevPlacement];
            const hotel = updatedPlacement[currentHotelIndex];

            const newPassenger = { ...newPassengerData, id: Date.now(), order: hotel.hotel?.passengers?.length + hotel.hotel?.person?.length + 1 };
            hotel.hotel.passengers.push(newPassenger);

            return updatedPlacement;
        });

        setIsAddingNewPassenger(false);
        setNewPassengerData({
            passenger: '',
            gender: '',
            phone: '',
            type: 'Пассажир',
            order: ''
        });
        setCurrentHotelIndex(null);
    };

    const handleAddNewPerson = () => {
        if (currentHotelIndex === null) return;

        setPlacement((prevPlacement) => {
            const updatedPlacement = [...prevPlacement];
            const hotel = updatedPlacement[currentHotelIndex];

            const newPerson = { ...newPersonData, id: Date.now(), order: hotel.hotel?.passengers?.length + hotel.hotel?.person?.length + 1 };
            hotel.hotel.person.push(newPerson);

            return updatedPlacement;
        });

        setIsAddingNewPerson(false);
        setNewPersonData({
            passenger: '',
            gender: '',
            phone: '',
            type: 'Сотрудник',
            order: ''
        });
        setCurrentHotelIndex(null);
    };

    const startAddingNewPassenger = (hotelIndex) => {
        setIsAddingNewPassenger(true);
        setIsAddingNewPerson(false);
        setCurrentHotelIndex(hotelIndex);

        setTimeout(() => {
            newGuestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const startAddingNewPerson = (hotelIndex) => {
        setIsAddingNewPerson(true);
        setIsAddingNewPassenger(false);
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

    const getTotalGuests = () => {
        return placement.reduce((total, item) => {
            return total + getAllGuests(item.hotel).length;
        }, 0);
    };

    const [selectedAirline, setSelectedAirline] = useState(null);
    const { loading, error, data } = useQuery(GET_AIRLINES_RELAY);

    useEffect(() => {
        if (data) {
            if (airline) {
                const selectedAirline = data.airlines.find(airline => airline.id === airline.id);
                setSelectedAirline(selectedAirline.staff);
            }
        }
    }, [data, airline]);

    // Получаем имена сотрудников, которые уже добавлены в текущем отеле
    const addedStaffNames = placement
        .flatMap(item => item.hotel.person.map(person => person.passenger));

    const handleChangePerson = (hotelIndex, personId, selectedName) => {
        const selectedStaff = selectedAirline.find((staff) => staff.name === selectedName);

        setPlacement((prevPlacement) => {
            return prevPlacement.map((item, index) => {
                const updatedHotel = { ...item.hotel };

                // Если это текущий отель, обновляем данные сотрудника
                if (index === hotelIndex) {
                    updatedHotel.person = updatedHotel.person.map((person) => {
                        if (person.id === personId) {
                            return {
                                ...person,
                                passenger: selectedName,
                                gender: selectedStaff?.gender || '',
                                phone: selectedStaff?.number || '',
                            };
                        }
                        return person;
                    });
                } else {
                    // Удаляем сотрудника из всех остальных отелей, если он уже был там добавлен
                    updatedHotel.person = updatedHotel.person.filter(
                        (person) => person.passenger !== selectedName
                    );
                }

                return { ...item, hotel: updatedHotel };
            });
        });

        setEditingId(null); // Закрываем режим редактирования
    };

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
                                <div className={classes.blockInfoShow}>
                                    <b>{item.hotel.name}</b>
                                    {getAllGuests(item.hotel).length} гостей из {item.hotel.passengersCount}
                                </div>

                                <div className={classes.blockInfoShow}>
                                    <Button onClick={() => startAddingNewPassenger(hotelIndex)}><img src="/plus.png" alt="" /> Пассажир</Button>
                                    <Button onClick={() => startAddingNewPerson(hotelIndex)}><img src="/plus.png" alt="" /> Сотрудник</Button>
                                </div>
                            </div>
                        </div>
                        {getAllGuests(item.hotel).sort((a, b) => a.order - b.order).map((guest, index) => (
                            <div className={classes.InfoTable_data} key={guest.id}>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>{index + 1}</div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w35}`}>
                                    {
                                        editingId === guest.id ? (
                                            guest.type === 'Сотрудник' ? (
                                                <select
                                                    value={editedData.passenger || ''}
                                                    onChange={(e) => handleChangePerson(hotelIndex, guest.id, e.target.value)}
                                                >
                                                    <option value="">Выберите сотрудника</option>
                                                    {selectedAirline.map((staff) => (
                                                        <option key={staff.id} value={staff.name}>
                                                            {staff.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={editedData.passenger || ''}
                                                    onChange={(e) => handleChange('passenger', e.target.value)}
                                                />
                                            )
                                        ) : (
                                            guest.passenger
                                        )
                                    }
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
                                            <img src="/deletePassenger.png" alt="" onClick={() => openDeletecomponent(guest)} />
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(isAddingNewPassenger && currentHotelIndex === hotelIndex) && (
                            <div className={classes.InfoTable_data} ref={newGuestRef}>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}></div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w35}`}>
                                    <input
                                        type="text"
                                        placeholder="ФИО пассажира"
                                        value={newPassengerData.passenger}
                                        onChange={(e) => setNewPassengerData({ ...newPassengerData, passenger: e.target.value })}
                                    />
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    <select
                                        value={newPassengerData.gender}
                                        onChange={(e) => setNewPassengerData({ ...newPassengerData, gender: e.target.value })}
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
                                        value={newPassengerData.phone}
                                        onChange={(e) => setNewPassengerData({ ...newPassengerData, phone: e.target.value })}
                                    />
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    <Button onClick={handleAddNewPassenger}>Добавить пассажира</Button>
                                </div>
                            </div>
                        )}
                        {(isAddingNewPerson && currentHotelIndex === hotelIndex) && (
                            <div className={classes.InfoTable_data} ref={newGuestRef}>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}></div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w35}`}>
                                    <select
                                        value={newPersonData.passenger}
                                        onChange={(e) => {
                                            const selectedName = e.target.value;
                                            const selectedStaff = selectedAirline.find((staff) => staff.name === selectedName);

                                            setNewPersonData({
                                                ...newPersonData,
                                                passenger: selectedName,
                                                gender: selectedStaff?.gender || '',
                                                phone: selectedStaff?.number || '',
                                            });
                                        }}
                                    >
                                        <option value="">Выберите сотрудника</option>
                                        {selectedAirline.map((staff) => (
                                            <option
                                                key={staff.id}
                                                value={staff.name}
                                                disabled={addedStaffNames.includes(staff.name)}
                                            >
                                                {staff.name} {addedStaffNames.includes(staff.name) ? '(уже добавлен)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    <select
                                        value={newPersonData.gender}
                                        onChange={(e) => setNewPersonData({ ...newPersonData, gender: e.target.value })}
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
                                        value={newPersonData.phone}
                                        onChange={(e) => setNewPersonData({ ...newPersonData, phone: e.target.value })}
                                    />
                                </div>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    <Button onClick={handleAddNewPerson}>Добавить сотрудника</Button>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className={classes.counting}>
                <div className={classes.countingPeople}>
                    <img src="/peopleCount.png" alt="" />
                    {placement.length} отелей, {getTotalGuests()} из 100 гостей
                </div>
            </div>
        </InfoTable>
    );
}

export default InfoTableDataReserve_passengers;
