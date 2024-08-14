import React, { useState } from "react";
import classes from './Main_Page.module.css';
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Estafeta from "../../Blocks/Estafeta/Estafeta";
import { useParams } from "react-router-dom";
import Reserve from "../../Blocks/Reserve/Reserve";
import Сompany from "../../Blocks/Сompany/Сompany";
import HotelsList from "../../Blocks/HotelsList/HotelsList";
import HotelPage from "../../Blocks/HotelPage/HotelPage";

function Main_Page({ children, ...props }) {
    let { id, hotelID, airlineID } = useParams();

    let pageClicked = hotelID ? 'hotels' : airlineID && 'airlines';
    return (
        <div className={classes.main}>
            <MenuDispetcher id={id ? id : pageClicked} />

            {(id == 'relay' || (!id && !hotelID && !airlineID)) && <Estafeta />}
            {(id == 'reserve') && <Reserve />}
            {(id == 'company') && <Сompany />}
            {(id == 'hotels') && <HotelsList />}
            {(!id && hotelID) && <HotelPage id={hotelID}/>}
        </div>
    );
}

export default Main_Page;