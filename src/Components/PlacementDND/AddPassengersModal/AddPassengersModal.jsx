import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import { useMutation, useQuery } from "@apollo/client";
import { ADD_PASSENGER_TO_HOTEL, ADD_PERSON_TO_HOTEL, GET_AIRLINE_USERS, GET_RESERVE_REQUEST_HOTELS } from "../../../../graphQL_requests";

const AddPassengersModal = ({ isOpen, onClose, isPerson, airlineId, reserveId, token, hotelId, openReserveId }) => {
    const [requestsHotelReserveOne, setRequestsHotelReserveOne] = useState([]);

    const { loading, error, data } = useQuery(GET_AIRLINE_USERS, {
        variables: { airlineId },
    });

    const { loading: loadingHotelReserveOne, error: errorHotelReserveOne, data: dataHotelReserveOne, refetch: refetchHotelReserveOne } = useQuery(GET_RESERVE_REQUEST_HOTELS, {
        variables: { reservationHotelsId: openReserveId },
    });


    useEffect(() => {
        if (openReserveId && dataHotelReserveOne) {
            setRequestsHotelReserveOne(dataHotelReserveOne.reservationHotels);
        }
    }, [dataHotelReserveOne, openReserveId]);

    const bronedPersons = requestsHotelReserveOne
        .flatMap(item => [
            ...(item.passengers || []).map(passenger => passenger.id),
            ...(item.person || []).map(person => person.id)
        ]);

    const [staff, setStaff] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState("");

    useEffect(() => {
        if (data) {
            setStaff(data?.airline?.staff || []);
        }
    }, [data]);

    const [fullName, setFullName] = useState("");
    const [gender, setGender] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const [errors, setErrors] = useState({
        fullName: false,
        gender: false,
        phoneNumber: false,
    });

    const validateFields = () => {
        const newErrors = {
            fullName: isPerson ? false : fullName.trim() === "",
            gender: gender.trim() === "",
            phoneNumber: phoneNumber.trim() === "",
        };
        setErrors(newErrors);
        return !Object.values(newErrors).includes(true);
    };

    const handleStaffChange = (staffId) => {
        setSelectedStaffId(staffId);
        const selectedStaff = staff.find((s) => s.id === staffId);
        if (selectedStaff) {
            setFullName(selectedStaff.name);
            setGender(selectedStaff.gender);
            setPhoneNumber(selectedStaff.number);
        }
    };

    const handleInputChange = (field, value) => {
        if (field === "fullName") setFullName(value);
        if (field === "gender") setGender(value);
        if (field === "phoneNumber") setPhoneNumber(value);

        setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: value.trim() === "" ? true : false,
        }));
    };

    const [createRequestPerson] = useMutation(ADD_PERSON_TO_HOTEL, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const [createRequestPassenger] = useMutation(ADD_PASSENGER_TO_HOTEL, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const handleSavePerson = async () => {
        if (!validateFields()) return;

        try {
            let reserverAddHotelPassenger = await createRequestPerson({
                variables: {
                    input: {
                        hotelId: hotelId,
                        personId: selectedStaffId,
                        reservationId: reserveId
                    }
                }
            });

            if (reserverAddHotelPassenger.data) {
                setFullName("");
                setGender("");
                setPhoneNumber("");
                setSelectedStaffId("");

                onClose();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSavePassenger = async () => {
        if (!validateFields()) return;

        const passengerData = {
            fullName,
            gender,
            phoneNumber,
        };

        try {
            let reserverAddHotelPassenger = await createRequestPassenger({
                variables: {
                    hotelId: hotelId,
                    input: {
                        name: passengerData.fullName,
                        number: passengerData.phoneNumber,
                        gender: passengerData.gender
                    },
                    reservationId: reserveId
                }
            });

            if (reserverAddHotelPassenger.data) {
                setFullName("");
                setGender("");
                setPhoneNumber("");
                setSelectedStaffId("");

                onClose();
            }
        } catch (e) {
            console.error(e);
        }

    };

    const handleClose = () => {
        setFullName("");
        setGender("");
        setPhoneNumber("");
        setSelectedStaffId("");

        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} disableScrollLock={true}>
            <DialogTitle>Добавить {isPerson ? "сотрудника" : "пассажира"}</DialogTitle>
            <DialogContent>
                {isPerson ? (
                    <FormControl fullWidth margin="dense" variant="outlined">
                        <InputLabel id="staff-select-label">Выберите сотрудника</InputLabel>
                        <Select
                            labelId="staff-select-label"
                            value={selectedStaffId}
                            onChange={(e) => handleStaffChange(e.target.value)}
                            label="Выберите сотрудника"
                        >
                            {staff.map((s) => {
                                const isAlreadyAdded = bronedPersons.includes(s.id);
                                return (
                                    <MenuItem key={s.id} value={s.id} disabled={isAlreadyAdded}>
                                        {s.name} - {s.position} {isAlreadyAdded && "(уже добавлен)"}
                                    </MenuItem>
                                )
                            })}
                        </Select>
                    </FormControl>
                ) : (
                    <TextField
                        label="ФИО"
                        type="text"
                        value={fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        fullWidth
                        margin="dense"
                        error={errors.fullName}
                        helperText={errors.fullName ? "Поле обязательно" : ""}
                    />
                )}

                <FormControl fullWidth margin="dense" variant="outlined">
                    <InputLabel id="gender-select-label">Пол</InputLabel>
                    <Select
                        labelId="gender-select-label"
                        value={gender}
                        onChange={(e) => handleInputChange("gender", e.target.value)}
                        label="Пол"
                        disabled={isPerson}
                        error={errors.gender}
                    >
                        <MenuItem value="Мужской">Мужской</MenuItem>
                        <MenuItem value="Женский">Женский</MenuItem>
                    </Select>
                    {errors.gender && <p style={{ color: "red", margin: "5px 0 0" }}>Поле обязательно</p>}
                </FormControl>

                <TextField
                    label="Номер телефона"
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    fullWidth
                    margin="dense"
                    error={errors.phoneNumber}
                    helperText={errors.phoneNumber ? "Поле обязательно" : ""}
                    disabled={isPerson}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Отмена</Button>
                {isPerson ?
                    <Button onClick={handleSavePerson} color="primary">
                        Сохранить
                    </Button>
                    :
                    <Button onClick={handleSavePassenger} color="primary">
                        Сохранить
                    </Button>
                }
            </DialogActions>
        </Dialog>
    );
};

export default AddPassengersModal;
