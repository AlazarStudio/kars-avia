import React, { useMemo } from "react";
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

function Main_Page({ user }) {
    // Получаем параметры из URL
    const { id, hotelID, airlineID } = useParams();

    // Вычисляем текущую страницу на основе параметров
    const pageClicked = useMemo(() => hotelID ? 'hotels' : airlineID ? 'airlines' : '', [hotelID, airlineID]);

    return (
        <div className={classes.main}>
            {/* Меню диспетчера, которое отображается на всех страницах */}
            <MenuDispetcher id={id || pageClicked} user={user} />

            {/* Контент для роли Hotel Admin */}
            {user.role === 'HOTELADMIN' && (
                <>
                    {/* Показывает страницу резервирования заявок, если id соответствует 'reserveRequests' */}
                    {id === 'reserveRequests' ? (
                        <Reserve user={user} idHotel={user.hotelId} />
                    ) : (
                        <HotelPage id={user.hotelId} user={user} />
                    )}
                </>
            )}

            {/* Контент для роли Airline Admin */}
            {user.role === 'AIRLINEADMIN' && (
                <>
                    {(id === 'relay' || (!id && !hotelID && !airlineID)) && <Estafeta user={user} />}
                    {id === 'reserve' && <Reserve user={user} />}
                    {id === 'hotels' && <HotelsList user={user} />}
                    {(id === 'airlineCompany' || id === 'airlineStaff' || id === 'airlineAbout') && (
                        <AirlinePage id={user.airlineId} user={user} />
                    )}
                    {!id && hotelID && <HotelPage id={hotelID} user={user} />}
                    {!id && airlineID && <AirlinePage id={airlineID} user={user} />}
                </>
            )}

            {/* Контент для ролей Super Admin и Dispatcher Admin */}
            {(user.role === 'SUPERADMIN' || user.role === 'DISPATCHERADMIN') && (
                <>
                    {(id === 'relay' || (!id && !hotelID && !airlineID)) && <Estafeta user={user} />}
                    {id === 'reserve' && <Reserve user={user} />}
                    {id === 'company' && <Сompany user={user} />}
                    {id === 'hotels' && <HotelsList user={user} />}
                    {id === 'airlines' && <AirlinesList user={user} />}
                    {id === 'reports' && <Reports user={user} />}
                    {!id && hotelID && <HotelPage id={hotelID} user={user} />}
                    {!id && airlineID && <AirlinePage id={airlineID} user={user} />}
                </>
            )}
        </div>
    );
}

export default Main_Page;
