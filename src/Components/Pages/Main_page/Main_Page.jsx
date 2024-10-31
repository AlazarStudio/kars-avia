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
import Login from "../Login/Login";
import { getCookie } from '../../../../graphQL_requests.js';

function Main_Page({ children, user, ...props }) {
    let { id, hotelID, airlineID } = useParams();

    const token = getCookie('token');

    if (!token) {
        return <Login />;
    }

    let pageClicked = hotelID ? 'hotels' : airlineID && 'airlines';

    return (
        <div className={classes.main}>
            <MenuDispetcher id={id ? id : pageClicked} user={user} />

            {user.role == 'HOTELADMIN' &&
                <>

                    {(id == 'reserveRequests') && <Reserve user={user} idHotel={user.hotelId} />}
                    {(id != 'reserveRequests') && <HotelPage id={user.hotelId} user={user} />}
                </>
            }

            {user.role == 'AIRLINEADMIN' &&
                <>
                    {(id == 'relay' || (!id && !hotelID && !airlineID)) && <Estafeta user={user} />}
                    {(id == 'reserve') && <Reserve user={user} />}
                    {(id == 'hotels') && <HotelsList user={user} />}
                    {(id == 'airlineCompany' || id == 'airlineStaff' || id == 'airlineAbout') && <AirlinePage id={user.airlineId} user={user} />}
                    {(!id && hotelID) && <HotelPage id={hotelID} user={user} />}
                    {(!id && airlineID) && <AirlinePage id={airlineID} user={user} />}
                </>
            }

            {(user.role == 'SUPERADMIN' || user.role == 'DISPATCHERADMIN') &&
                <>

                    {(id == 'relay' || (!id && !hotelID && !airlineID)) && <Estafeta user={user} />}
                    {(id == 'reserve') && <Reserve user={user} />}
                    {(id == 'company') && <Сompany user={user} />}
                    {(id == 'hotels') && <HotelsList user={user} />}
                    {(id == 'airlines') && <AirlinesList user={user} />}
                    {(id == 'reports') && <Reports user={user} />}
                    {(!id && hotelID) && <HotelPage id={hotelID} user={user} />}
                    {(!id && airlineID) && <AirlinePage id={airlineID} user={user} />}
                </>
            }
        </div>
    );
}

export default Main_Page;