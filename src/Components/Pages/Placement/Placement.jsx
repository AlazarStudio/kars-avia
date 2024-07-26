import React from "react";
import classes from './Placement.module.css';
import { Link, useLocation, useParams } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header"
import HotelTable from "../../Blocks/HotelTable/HotelTable";

function Placement({ children, ...props }) {
    let { id, idHotel } = useParams();
    const location = useLocation();
    const { dataObject } = location.state || [];

    const allRooms = [
        { room: '№121', places: 1 },
        { room: '№122', places: 1 },
        { room: '№221', places: 2 },
        { room: '№222', places: 2 },
    ];

    const data = [
        { public: true, room: '№121', place: 1, start: '2024-07-01', startTime: '14:00', end: '2024-07-10', endTime: '10:00', client: 'Джатдоев А. С-А.' },
        { public: true, room: '№121', place: 1, start: '2024-07-10', startTime: '14:00', end: '2024-07-26', endTime: '10:00', client: 'Джатдоев А. С-А.' },
        { public: true, room: '№121', place: 1, start: '2024-07-26', startTime: '14:00', end: '2024-07-29', endTime: '10:00', client: 'Джатдоев А. С-А.' },
        { public: true, room: '№122', place: 1, start: '2024-07-03', startTime: '14:00', end: '2024-07-10', endTime: '10:00', client: 'Гочияев Р. Р.' },
        { public: true, room: '№221', place: 1, start: '2024-07-12', startTime: '14:00', end: '2024-07-29', endTime: '10:00', client: 'Уртенов А. З.' },
        { public: true, room: '№221', place: 2, start: '2024-07-10', startTime: '14:00', end: '2024-07-19', endTime: '10:00', client: 'Джатдоев А. С-А.' },
        { public: true, room: '№222', place: 1, start: '2024-07-12', startTime: '14:00', end: '2024-07-18', endTime: '10:00', client: 'Гочияев Р. Р.' },
        { public: true, room: '№222', place: 2, start: '2024-06-12', startTime: '14:00', end: '2024-07-24', endTime: '10:00', client: 'Гочияев Р. Р.' },
    ];

    return (
        <div className={classes.main}>
            <MenuDispetcher id={id} />

            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>
                        <div className={classes.titleHeader}>
                            <Link to={`/${id}`} className={classes.backButton}><img src="/arrow.png" alt="" /></Link>
                            Заявка №123MV077
                        </div>
                    </Header>
                </div>

                <HotelTable allRooms={allRooms} data={data} idHotel={idHotel} dataObject={dataObject} id={id}/>
            </div>

        </div>
    );
}

export default Placement;