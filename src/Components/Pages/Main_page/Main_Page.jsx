import React, { useEffect, useState } from "react";
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
import { useQuery, useSubscription, gql } from "@apollo/client";

const GET_REQUESTS = gql`
    query Request {
        requests {
            id
            fullName
            position
            gender
            phoneNumber
            arrival {
            flight
            date
            time
            }
            departure {
            flight
            date
            time
            }
            roomCategory
            mealPlan {
            included
            breakfast
            lunch
            dinner
            }
            senderId
            receiverId
            createdAt
            updatedAt
            hotelId
            roomNumber
            airlineId
            status
            airportId
        }
    }
`;

const REQUEST_CREATED_SUBSCRIPTION = gql`
    subscription RequestCreated {
        requestCreated {
            id
            fullName
            position
            gender
            phoneNumber
            arrival {
                flight
                date
                time
            }
            departure {
                flight
                date
                time
            }
            roomCategory
            mealPlan {
                included
                breakfast
                lunch
                dinner
            }
            senderId
            receiverId
            createdAt
            updatedAt
            hotelId
            roomNumber
            airlineId
            status
            airportId
        }
    }
`;

function Main_Page({ children, ...props }) {
    let { id, hotelID, airlineID } = useParams();

    let pageClicked = hotelID ? 'hotels' : airlineID && 'airlines';

    const { loading, error, data } = useQuery(GET_REQUESTS);
    const { data: subscriptionData } = useSubscription(REQUEST_CREATED_SUBSCRIPTION);
    const [requests, setRequests] = useState([]);
    useEffect(() => {
        if (data && data.requests) {
            const sortedRequests = [...data.requests].reverse();
            setRequests(sortedRequests);
        }
    }, [data]);

    useEffect(() => {
        if (subscriptionData) {
            console.log('New subscription data received:', subscriptionData);
            setRequests((prevRequests) => {
                const newRequest = subscriptionData.requestCreated;
                const isDuplicate = prevRequests.some(request => request.id === newRequest.id);
                if (isDuplicate) {
                    return prevRequests;
                }
                return [newRequest, ...prevRequests];
            });
        }
    }, [subscriptionData]);

    // if (loading) return 'Loading...';
    // if (error) return `Error! ${error.message}`;

    // if (loading) console.log('Loading...');
    // if (error) console.log(`Error! ${error.message}`);

    // console.log(requests)
    return (
        <div className={classes.main}>
            <MenuDispetcher id={id ? id : pageClicked} />

            {(id == 'relay' || (!id && !hotelID && !airlineID)) && <Estafeta requests={requests} />}
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