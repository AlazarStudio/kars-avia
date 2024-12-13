import React, { useState, useRef, useEffect } from "react";
import classes from './InfoTableDataReserve_passengers.module.css';
import InfoTable from "../InfoTable/InfoTable";
import Button from "../../Standart/Button/Button";
import { ADD_PASSENGER_TO_HOTEL, ADD_PERSON_TO_HOTEL, GET_AIRLINES_RELAY, GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION, getCookie, UPDATE_RESERVE } from "../../../../graphQL_requests";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import Message from "../Message/Message";
import { useNavigate } from "react-router-dom";

function InfoTableDataReserve_passengers({ placement, setPlacement, toggleUpdateSidebar, setIdPassangerForUpdate, openDeletecomponent, toggleChooseHotel, user, request, airline }) {
    const token = getCookie('token');

    const [editingId, setEditingId] = useState(null);
    const [editedData, setEditedData] = useState({});
    const [isAddingNewPassenger, setIsAddingNewPassenger] = useState(false);
    const [isAddingNewPerson, setIsAddingNewPerson] = useState(false);
    const [currentHotelID, setCurrentHotelID] = useState(null);
    const [newPassengerData, setNewPassengerData] = useState({
        name: '',
        gender: '',
        number: '',
        type: 'Пассажир',
        order: ''
    });
    const [newPersonData, setNewPersonData] = useState({
        name: '',
        gender: '',
        number: '',
        type: 'Сотрудник',
        order: '',
        id: ''
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
            const updatedPlacement = prevPlacement.map((item, index) =>
                index === hotelIndex
                    ? {
                        ...item,
                        hotel: {
                            ...item.hotel,
                            passengers: item.hotel.passengers.map((name) =>
                                name.id === editingId ? { ...name, ...editedData } : name
                            ),
                        },
                    }
                    : item
            );

            const hotel = updatedPlacement[hotelIndex];

            if (editedData.type === 'Пассажир') {
                hotel.hotel.passengers = hotel.hotel.passengers.map((name) =>
                    name.id === editingId ? { ...name, ...editedData } : name
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

    const [createRequestPassenger] = useMutation(ADD_PASSENGER_TO_HOTEL, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const [updateReserve] = useMutation(UPDATE_RESERVE, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const navigate = useNavigate();

    const [showButton, setShowButton] = useState(true);

    const handleUpdateReserve = async () => {
        try {
            let reserverUpdateReserve = await updateReserve({
                variables: {
                    updateReserveId: request.id,
                    input: {
                        status: "done",
                    }
                }
            });

            setShowButton(false)
        } catch (e) {
            console.error(e);
        }

        navigate('/reserve');
    };

    const handleAddNewPassenger = async () => {
        try {
            if (currentHotelIndex === null) return;

            let reserverAddHotelPassenger = await createRequestPassenger({
                variables: {
                    hotelId: currentHotelID,
                    input: {
                        name: newPassengerData.name,
                        number: newPassengerData.number,
                        gender: newPassengerData.gender
                    },
                    reservationId: request.id
                }
            });

            if (reserverAddHotelPassenger.data) {
                setIsAddingNewPassenger(false);
                setNewPassengerData({
                    name: '',
                    gender: '',
                    number: '',
                    type: 'Пассажир',
                    order: ''
                });

                setCurrentHotelIndex(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const [createRequest] = useMutation(ADD_PERSON_TO_HOTEL, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const handleAddNewPerson = async () => {
        try {
            if (currentHotelIndex === null) return;

            let reserverAddHotel = await createRequest({
                variables: {
                    input: {
                        hotelId: currentHotelID,
                        personId: newPersonData.id,
                        reservationId: request.id
                    }
                }
            });

            if (reserverAddHotel.data) {
                setIsAddingNewPerson(false);
                setNewPersonData({
                    name: '',
                    gender: '',
                    number: '',
                    type: 'Сотрудник',
                    order: '',
                    id: ''
                });
                setCurrentHotelIndex(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const startAddingNewPassenger = (hotelIndex, hotelID) => {
        setIsAddingNewPassenger(true);
        setIsAddingNewPerson(false);
        setCurrentHotelIndex(hotelIndex);
        setCurrentHotelID(hotelID)

        setTimeout(() => {
            newGuestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const startAddingNewPerson = (hotelIndex, hotelID) => {
        setIsAddingNewPerson(true);
        setIsAddingNewPassenger(false);
        setCurrentHotelIndex(hotelIndex);
        setCurrentHotelID(hotelID)

        setTimeout(() => {
            newGuestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const getAllGuests = (hotel) => {
        return [
            ...hotel.passengers.map((name) => ({
                ...name,
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
        if (data && airline) {
            const selectedAirlineData = data.airlines.find(item => item.id === airline.id);
            if (selectedAirlineData) {
                setSelectedAirline(selectedAirlineData.staff);
            }
        }
    }, [data, airline]);

    // Получаем имена сотрудников, которые уже добавлены в текущем отеле
    const addedStaffNames = placement
        .flatMap(item => item.hotel.person.map(person => person.name));

    const handleChangePerson = (field, value, selectedName) => {
        const selectedStaff = selectedAirline.find((staff) => staff.name === selectedName);

        setEditedData((prev) => ({
            ...prev,
            name: selectedStaff.name,
            gender: selectedStaff.gender,
            number: selectedStaff.number,
        }));
    };

    // Получаем список отелей для отображения
    const filteredPlacement = user.hotelId
        ? placement.filter(item => item.hotel.id === user.hotelId)
        : placement;

    return (
        // Сделать отдельную компоненту для чата
        <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
            <InfoTable>
                <div className={classes.InfoTable_title}>
                    <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>№</div>
                    <div className={`${classes.InfoTable_title_elem} ${classes.w35}`}>ФИО</div>
                    <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Пол</div>
                    <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Номер телефона</div>
                    <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Тип</div>
                    <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Действия</div>
                </div>

                <div className={classes.bottom} style={{ height: user.role == 'HOTELADMIN' && 'calc(100vh)' }}>
                    {filteredPlacement.map((item, hotelIndex) => (
                        <React.Fragment key={hotelIndex}>
                            <div className={`${classes.InfoTable_data} ${classes.stickyHeader}`}>
                                <div className={`${classes.InfoTable_data_elem} ${classes.w100}`}>
                                    <div className={classes.blockInfoShow}>
                                        <b>{item.hotel.name}</b>
                                        {getAllGuests(item.hotel).length} гостей из {item.hotel.passengersCount}
                                    </div>

                                    <div className={classes.blockInfoShow}>
                                        {request.reserveForPerson == false && getAllGuests(item.hotel).length < item.hotel.passengersCount && <Button onClick={() => startAddingNewPassenger(hotelIndex, item.hotel.id)}><img src="/plus.png" alt="" /> Пассажир</Button>}
                                        {request.reserveForPerson == true && getAllGuests(item.hotel).length < item.hotel.passengersCount && <Button onClick={() => startAddingNewPerson(hotelIndex, item.hotel.id)}><img src="/plus.png" alt="" /> Сотрудник</Button>}
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
                                                        value={editedData.name || ''}
                                                        onChange={(e) => handleChangePerson(hotelIndex, guest.id, e.target.value)}
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
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={editedData.name || ''}
                                                        onChange={(e) => handleChange('name', e.target.value)}
                                                    />
                                                )
                                            ) : (
                                                guest.name
                                            )
                                        }
                                    </div>
                                    <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                        {editingId === guest.id ? (
                                            <select
                                                value={editedData.gender || ''}
                                                onChange={(e) => handleChange('gender', e.target.value)}
                                                disabled
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
                                                value={editedData.number || ''}
                                                onChange={(e) => handleChange('number', e.target.value)}
                                                disabled
                                            />
                                        ) : (
                                            guest.number || '-'
                                        )}
                                    </div>
                                    <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                        {guest.type}
                                    </div>
                                    <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>
                                        {editingId === guest.id ? (
                                            <Button onClick={() => handleSave(hotelIndex)}>Сохранить</Button>
                                        ) : (
                                            <>
                                                {/* {request.reserveForPerson == false && <img src="/editPassenger.png" alt="" onClick={() => handleEdit(guest.id, guest)} />} */}
                                                <img src="/deletePassenger.png" alt="" onClick={() => openDeletecomponent(guest, item)} />
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
                                            value={newPassengerData.name}
                                            onChange={(e) => setNewPassengerData({ ...newPassengerData, name: e.target.value })}
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
                                            value={newPassengerData.number}
                                            onChange={(e) => setNewPassengerData({ ...newPassengerData, number: e.target.value })}
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
                                            value={newPersonData.name}
                                            onChange={(e) => {
                                                const selectedName = e.target.value;
                                                const selectedStaff = selectedAirline.find((staff) => staff.name === selectedName);

                                                setNewPersonData({
                                                    ...newPersonData,
                                                    name: selectedName,
                                                    gender: selectedStaff?.gender || '',
                                                    number: selectedStaff?.number || '',
                                                    id: selectedStaff?.id || ''
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
                                            value={newPersonData.number}
                                            onChange={(e) => setNewPersonData({ ...newPersonData, number: e.target.value })}
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

                {user.role != "HOTELADMIN" && <div className={classes.counting}>
                    <div className={classes.countingPeople}>
                        <img src="/peopleCount.png" alt="" />
                        {placement.length} отелей, {getTotalGuests()} из {request.passengerCount} гостей

                        {
                            (getTotalGuests() == request.passengerCount && request.status != 'done' && showButton) &&
                            <Button onClick={handleUpdateReserve}>Все гости размещены</Button>
                        }

                        {!showButton && <div>Все гости успешно размещены</div>}
                        {getTotalGuests() == request.passengerCount && request.status == 'done' && <div>Все гости успешно размещены</div>}
                    </div>
                </div>}
            </InfoTable>

            {user.role != "HOTELADMIN" && <div style={{ width: '500px', backgroundColor: '#fff', borderRadius: '8px', padding: '20px' }}>
                <Message activeTab={"Комментарий"} chooseRequestID={''} chooseReserveID={request.id} token={token} user={user} chatPadding={'0'} chatHeight={'calc(100vh - 290px)'} />
            </div>}
        </div>
    );
}

export default InfoTableDataReserve_passengers;
