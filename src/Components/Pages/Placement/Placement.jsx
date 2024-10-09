import React, { useEffect, useState } from "react";
import classes from './Placement.module.css';
import { Link, useLocation, useParams } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header"
import HotelTable from "../../Blocks/HotelTable/HotelTable";
import { useQuery } from "@apollo/client";
import { GET_BRONS_HOTEL, GET_HOTEL_ROOMS } from "../../../../graphQL_requests";

function Placement({ children, ...props }) {
    let { id, idHotel } = useParams();

    const location = useLocation();
    const { dataObject } = location.state || [];

    const updatedDataObject = dataObject.map(item => ({
        ...item,
        hotelId: idHotel
    }));

    // console.log(updatedDataObject)

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

    const [hotelBronsInfo, setHotelBronsInfo] = useState([]);

    const { loading: bronLoading, error: bronError, data: bronData } = useQuery(GET_BRONS_HOTEL, {
        variables: { hotelId: idHotel },
    });

    useEffect(() => {
        if (bronData && bronData.hotel && bronData.hotel.hotelChesses) {
            setHotelBronsInfo(bronData.hotel.hotelChesses);
        }
    }, [bronData]);

    if (error || bronError) return <p>Error: {error ? error.message : bronError.message}</p>;

    return (
        <div className={classes.main}>
            <MenuDispetcher id={id} />

            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>
                        <div className={classes.titleHeader}>
                            <Link to={`/${id}`} className={classes.backButton}><img src="/arrow.png" alt="" /></Link>
                            Заявка {dataObject[0].requestNumber}
                        </div>
                    </Header>
                </div>

                {(hotelBronsInfo.length === 0) &&
                    <HotelTable allRooms={allRooms} data={[]} idHotel={idHotel} dataObject={updatedDataObject} id={id} />
                }

                {(hotelBronsInfo.length !== 0) &&
                    <HotelTable allRooms={allRooms} data={hotelBronsInfo} idHotel={idHotel} dataObject={updatedDataObject} id={id} />
                }
            </div>

        </div>
    );
}

export default Placement;