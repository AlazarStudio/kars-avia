import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  decodeJWT,
  GET_AIRLINE,
  GET_HOTEL_CITY,
  GET_REQUESTS,
  GET_RESERVE_REQUESTS,
  getCookie,
  REQUEST_CREATED_SUBSCRIPTION,
  REQUEST_RESERVE_CREATED_SUBSCRIPTION,
} from "../../../../graphQL_requests";
import { useQuery, useSubscription } from "@apollo/client";
import { roles } from "../../../roles";

import HotelAdminMenu from "../../RoleContent/HotelAdminContent/HotelAdminMenu/HotelAdminMenu";
import AirlineAdminMenu from "../../RoleContent/AirlineAdminContent/AirlineAdminMenu/AirlineAdminMenu";
import DisAdminMenu from "../../RoleContent/DispatcherAdminContent/DisAdminMenu/DisAdminMenu";
import SuperAdminMenu from "../../RoleContent/SuperAdminContent/SuperAdminMenu/SuperAdminMenu";

import classes from "./MenuDispetcher.module.css";

function MenuDispetcher({ children, id, hotelID, ...props }) {
  const token = getCookie("token");

  const [user, setUser] = useState("");

  useEffect(() => {
    if (token) {
      setUser(decodeJWT(token));
    }
  }, [token]);

  const navigate = useNavigate();

  const [reserves, setReserves] = useState([]);
  const [requests, setRequests] = useState([]);

  const [newReserves, setNewReserves] = useState([]);
  const [newRequests, setNewRequests] = useState([]);

  const handleClick = () => {
    let result = confirm("Вы уверены что хотите выйти?");
    if (result) {
      document.cookie = "token=; Max-Age=0; Path=/;";
      navigate("/");
      window.location.reload();
    }
  };

  const [hotelCity, setHotelCity] = useState();

  const {
    loading: hotelLoading,
    error: hotelError,
    data: hotelData,
  } = useQuery(GET_HOTEL_CITY, {
    variables: { hotelId: user.hotelId },
  });

  useEffect(() => {
    if (hotelData) {
      setHotelCity(hotelData.hotel.city);
    }
  }, [hotelData]);

  const [airlineName, setAirlineName] = useState();

  const {
    loading: airlineLoading,
    error: airlineError,
    data: airlineData,
  } = useQuery(GET_AIRLINE, {
    variables: { airlineId: user.airlineId },
  });

  useEffect(() => {
    if (airlineData) {
      setAirlineName(airlineData.airline.name);
    }
  }, [airlineData]);

  const [allCreatedReserves, setAllCreatedReserves] = useState(0);
  const [allCreatedRequests, setAllCreatedRequests] = useState(0);

  const { loading, error, data, refetch } = useQuery(GET_RESERVE_REQUESTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`
      },
    },
    variables: { pagination: { skip: 0, take: 999999999 } },
  });

  const {
    loading: loadingRequest,
    error: errorRequest,
    data: dataRequest,
    refetch: refetchRequest,
  } = useQuery(GET_REQUESTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`
      },
    },
    variables: { pagination: { skip: 0, take: 999999999 } },
  });

  const { data: subscriptionData } = useSubscription(
    REQUEST_RESERVE_CREATED_SUBSCRIPTION
  );
  const { data: subscriptionDataRequest } = useSubscription(
    REQUEST_CREATED_SUBSCRIPTION
  );

  useEffect(() => {
    if (subscriptionData) {
      const newReserve = subscriptionData.reserveCreated;

      setReserves((prevRequests) => {
        const exists = prevRequests.some(
          (request) => request.id === newReserve.id
        );
        if (!exists) {
          setNewReserves((prevNewRequests) => [newReserve, ...prevNewRequests]);
        }
        return prevRequests;
      });

      refetch();
    }

    if (subscriptionDataRequest) {
      const newRequest = subscriptionDataRequest.requestCreated;

      setRequests((prevRequests) => {
        const exists = prevRequests.some(
          (request) => request.id === newRequest.id
        );
        if (!exists) {
          setNewRequests((prevNewRequests) => [newRequest, ...prevNewRequests]);
        }
        return prevRequests;
      });

      refetchRequest();
    }
  }, [
    subscriptionData,
    subscriptionDataRequest,
    hotelCity,
    airlineName,
    data,
    dataRequest,
  ]);

  useEffect(() => {
    if (data && data.reserves.reserves) {
      let sortedRequests = [...data.reserves.reserves];

      if (newReserves.length > 0) {
        sortedRequests = [...newReserves, ...sortedRequests];
        setNewReserves([]);
      }

      setReserves(sortedRequests);

      setAllCreatedReserves(
        sortedRequests.filter(
          (request) =>
            request.status === "created" &&
            (user.hotelId ? request.airport?.city === hotelCity : true) &&
            (user.airlineId ? request.airline?.name === airlineName : true)
        ).length
      );

      refetch();
    }

    if (dataRequest && dataRequest.requests.requests) {
      let sortedRequests = [...dataRequest.requests.requests];

      if (newRequests.length > 0) {
        sortedRequests = [...newRequests, ...sortedRequests];
        setNewRequests([]);
      }

      // Удаляем дубли
      const uniqueRequests = sortedRequests.filter(
        (request, index, self) =>
          index === self.findIndex((r) => r.id === request.id)
      );

      setRequests(uniqueRequests);

      setAllCreatedRequests(
        uniqueRequests.filter(
          (request) =>
            request.status === "created" &&
            (user.hotelId ? request.airport?.city === hotelCity : true) &&
            (user.airlineId ? request.airline?.name === airlineName : true)
        ).length
      );
    }
  }, [data, dataRequest, hotelCity, airlineName, newReserves, newRequests]);

  return (
    <>
      <div className={classes.menu}>
        <Link to={"/"} className={classes.menu_logo}>
          <img src="/kars-avia-mainLogo.png" alt="" />
        </Link>
        <div className={classes.menu_items}>
          {user.role == roles.hotelAdmin && (
            <HotelAdminMenu id={id} allCreatedReserves={allCreatedReserves} />
          )}

          {user.role == roles.airlineAdmin && (
            <AirlineAdminMenu
              id={id}
              allCreatedRequests={allCreatedRequests}
              allCreatedReserves={allCreatedReserves}
            />
          )}

          {user.role == roles.superAdmin && (
            <SuperAdminMenu
              id={id}
              allCreatedReserves={allCreatedReserves}
              allCreatedRequests={allCreatedRequests}
            />
          )}
          {user.role == roles.dispatcerAdmin && (
            <DisAdminMenu
              id={id}
              allCreatedReserves={allCreatedReserves}
              allCreatedRequests={allCreatedRequests}
            />
          )}
        </div>

        {/* <a
          className={`${classes.menu_items__elem}`}
          style={{ position: "absolute", bottom: "25px" }}
          onClick={handleClick}
        >
          Выход из учетной записи
        </a> */}
      </div>
    </>
  );
}

export default MenuDispetcher;
