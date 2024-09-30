import React from "react";
import classes from './Placement.module.css';
import { Link, useLocation, useParams } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header"
import HotelTable from "../../Blocks/HotelTable/HotelTable";
import { useQuery } from "@apollo/client";
import { GET_HOTEL_ROOMS } from "../../../../graphQL_requests";

function Placement({ children, ...props }) {
    let { id, idHotel } = useParams();

    const location = useLocation();
    const { dataObject } = location.state || [];

    const { loading, error, data } = useQuery(GET_HOTEL_ROOMS, {
        variables: { hotelId: idHotel },
    });

    const allRooms = [];

    data && data.hotel.categories.map((category, index) => {
        return category.rooms.map((item) => (
            allRooms.push({
                room: item.name,
                places: item.places
            })
        ));
    });

    allRooms.sort((a, b) => a.room.localeCompare(b.room));
    
    const dataInfo = [];

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

                <HotelTable allRooms={allRooms} data={dataInfo} idHotel={idHotel} dataObject={dataObject} id={id}/>
            </div>

        </div>
    );
}

export default Placement;