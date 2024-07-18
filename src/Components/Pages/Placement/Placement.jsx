import React from "react";
import classes from './Placement.module.css';
import { Link, useParams } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header"
import HotelTable from "../../Blocks/HotelTable/HotelTable";

function Placement({ children, ...props }) {
    let { idHotel } = useParams();

    const allRooms = [
        { room: '№121', places: 1 },
        { room: '№122', places: 1 },
        { room: '№221', places: 2 },
        { room: '№222', places: 2 },
    ];

    const data = [
        { room: '№121', place: 1, start: '2024-07-01', end: '2024-07-09', client: 'Джатдоев А. С-А.' },
        { room: '№122', place: 1, start: '2024-07-03', end: '2024-07-10', client: 'Гочияев Р. Р.' },
        { room: '№221', place: 1, start: '2024-07-12', end: '2024-07-29', client: 'Уртенов А. З.' },
        { room: '№221', place: 2, start: '2024-07-10', end: '2024-07-19', client: 'Джатдоев А. С-А.' },
        { room: '№222', place: 2, start: '2024-07-12', end: '2024-07-23', client: 'Гочияев Р. Р.' },
    ];
    
    return (
        <div className={classes.main}>
            <MenuDispetcher />

            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>
                        <div className={classes.titleHeader}>
                            <Link to={'/relay'} className={classes.backButton}><img src="/arrow.png" alt="" /></Link>
                            Заявка №123MV077
                        </div>
                    </Header>
                </div>

                <HotelTable allRooms={allRooms} data={data} />
            </div>

        </div>
    );
}

export default Placement;