import React from "react";
import classes from './Main_Page.module.css';
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Estafeta from "../../Blocks/Estafeta/Estafeta";
import { useParams } from "react-router-dom";
import Reserve from "../../Blocks/Reserve/Reserve";
import Сompany from "../../Blocks/Сompany/Сompany";
import HotelsList from "../../Blocks/HotelsList/HotelsList";
import HotelPage from "../../Blocks/HotelPage/HotelPage";
import AirlinesList from "../../Blocks/AirlinesList/AirlinesList";
import AirlinePage from "../../Blocks/AirlinePage/AirlinePage";
import Reports from "../../Blocks/Reports/Reports";

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
            {(id == 'airlines') && <AirlinesList />}
            {(id == 'reports') && <Reports />}
            {(!id && hotelID) && <HotelPage id={hotelID} />}
            {(!id && airlineID) && <AirlinePage id={airlineID} />}
        </div>
    );
}

export default Main_Page;