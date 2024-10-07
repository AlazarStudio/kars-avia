import React, { useEffect, useState } from "react";
import classes from './Main_Page.module.css';
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Estafeta from "../../Blocks/Estafeta/Estafeta";
import { useLocation, useParams } from "react-router-dom";
import Reserve from "../../Blocks/Reserve/Reserve";
import Сompany from "../../Blocks/Сompany/Сompany";
import HotelsList from "../../Blocks/HotelsList/HotelsList";
import HotelPage from "../../Blocks/HotelPage/HotelPage";
import AirlinesList from "../../Blocks/AirlinesList/AirlinesList";
import AirlinePage from "../../Blocks/AirlinePage/AirlinePage";
import Reports from "../../Blocks/Reports/Reports";
import Login from "../Login/Login";
import { GET_REQUESTS, getCookie, REQUEST_CREATED_SUBSCRIPTION, REQUEST_UPDATED_SUBSCRIPTION } from '../../../../graphQL_requests.js';
import { useQuery, useSubscription } from "@apollo/client";

function Main_Page({ children, user, ...props }) {
    let pageNumber = useLocation().search.split("=")[1];
    let { id, hotelID, airlineID } = useParams();

    let localPage = localStorage.getItem("currentPage");

    let currentPage = localPage ? localPage - 1 : pageNumber ? pageNumber - 1 : 0

    const [pageInfo, setPageInfo] = useState({
        skip: Number(currentPage),
        take: 20
    });

    const { loading, error, data, refetch } = useQuery(GET_REQUESTS, {
        variables: { pagination: { skip: pageInfo.skip, take: pageInfo.take } },
    });
    const { data: subscriptionData } = useSubscription(REQUEST_CREATED_SUBSCRIPTION);
    const { data: subscriptionUpdateData } = useSubscription(REQUEST_UPDATED_SUBSCRIPTION);

    const [newRequests, setNewRequests] = useState([]); // Отдельно храним новые заявки
    const [requests, setRequests] = useState([]);
    const [totalPages, setTotalPages] = useState();

    useEffect(() => {
        if (pageNumber) {
            localStorage.setItem('currentPage', pageNumber);
        }
    }, [pageNumber]);

    useEffect(() => {
        if (subscriptionData) {
            const newRequest = subscriptionData.requestCreated;

            setRequests((prevRequests) => {
                const exists = prevRequests.some(request => request.id === newRequest.id);
                if (!exists) {
                    if (currentPage === 0) {
                        return [newRequest, ...prevRequests];
                    } else {
                        setNewRequests((prevNewRequests) => [newRequest, ...prevNewRequests]);
                    }
                }
                return prevRequests;
            });
        }
    }, [subscriptionData, currentPage]);

    useEffect(() => {
        if (data && data.requests.requests) {
            let sortedRequests = [...data.requests.requests];

            if (currentPage === 0 && newRequests.length > 0) {
                sortedRequests = [...newRequests, ...sortedRequests];
                setNewRequests([]); 
            }

            setRequests(sortedRequests);
            setTotalPages(data.requests.totalPages);
            refetch()
        }
    }, [data, currentPage, newRequests]);

    useEffect(() => {
        if (subscriptionUpdateData) {
            // console.log('New update subscription data received:', subscriptionUpdateData);
            refetch();
        }
    }, [subscriptionUpdateData, refetch]);

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
                    <HotelPage id={user.hotelId} user={user} />
                </>
            }

            {user.role == 'AIRLINEADMIN' &&
                <>
                    {(id == 'relay' || (!id && !hotelID && !airlineID)) && <Estafeta pageNumber={currentPage} totalPages={totalPages} setPageInfo={setPageInfo} user={user} requests={requests} loading={loading} error={error} />}

                    {(id == 'reserve') && <Reserve user={user} />}
                    {(id == 'hotels') && <HotelsList user={user} />}
                    {(id == 'airlineCompany' || id == 'airlineStaff' || id == 'airlineAbout') && <AirlinePage id={user.airlineId} user={user} />}
                    {(!id && hotelID) && <HotelPage id={hotelID} user={user} />}
                    {(!id && airlineID) && <AirlinePage id={airlineID} user={user} />}
                </>
            }

            {(user.role == 'SUPERADMIN' || user.role == 'DISPATCHERADMIN') &&
                <>

                    {(id == 'relay' || (!id && !hotelID && !airlineID)) && <Estafeta pageNumber={currentPage} totalPages={totalPages} setPageInfo={setPageInfo} user={user} requests={requests} loading={loading} error={error} />}
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