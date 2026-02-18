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
import {
  isAirlineAdmin,
  isDispatcherAdmin,
  isSuperAdmin,
} from "../../../utils/access";

import HotelAdminMenu from "../../RoleContent/HotelAdminContent/HotelAdminMenu/HotelAdminMenu";
import AirlineAdminMenu from "../../RoleContent/AirlineAdminContent/AirlineAdminMenu/AirlineAdminMenu";
import DisAdminMenu from "../../RoleContent/DispatcherAdminContent/DisAdminMenu/DisAdminMenu";
import SuperAdminMenu from "../../RoleContent/SuperAdminContent/SuperAdminMenu/SuperAdminMenu";

import classes from "./MenuDispetcher.module.css";
import RepresentativeAdminMenu from "../../RoleContent/RepresentativeAdminContent/RepresentativeAdminMenu/RepresentativeAdminMenu";
import TransferAdminMenu from "../../RoleContent/TransferAdminContent/TransferAdminMenu/TransferAdminMenu";

function MenuDispetcher({ children, id, hotelID, accessMenu, ...props }) {
  const token = getCookie("token");

  const [user, setUser] = useState("");

  useEffect(() => {
    if (token) {
      setUser(decodeJWT(token));
    }
  }, [token]);

  // Получаем состояние из localStorage или по умолчанию true
  const storedMenuState = JSON.parse(localStorage.getItem("menuOpen"));
  const [menuOpen, setMenuOpen] = useState(
    storedMenuState !== null ? storedMenuState : true
  );

  useEffect(() => {
    // Сохраняем состояние в localStorage при его изменении
    localStorage.setItem("menuOpen", JSON.stringify(menuOpen));
  }, [menuOpen]);

  const handleMenuToggle = () => {
    // Переключаем состояние меню
    setMenuOpen((prevState) => !prevState);
  };

  // const navigate = useNavigate();

  const [reserves, setReserves] = useState([]);
  const [requests, setRequests] = useState([]);

  const [newReserves, setNewReserves] = useState([]);
  const [newRequests, setNewRequests] = useState([]);

  // const handleClick = () => {
  //   let result = confirm("Вы уверены что хотите выйти?");
  //   if (result) {
  //     document.cookie = "token=; Max-Age=0; Path=/;";
  //     navigate("/");
  //     window.location.reload();
  //   }
  // };

  const [hotelCity, setHotelCity] = useState();

  const {
    loading: hotelLoading,
    error: hotelError,
    data: hotelData,
  } = useQuery(GET_HOTEL_CITY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
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
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
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
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: { skip: 0, take: 999999999, status: "created" },
    },
  });

  const {
    loading: loadingRequest,
    error: errorRequest,
    data: dataRequest,
    refetch: refetchRequest,
  } = useQuery(GET_REQUESTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: { skip: 0, take: 999999999, status: "created" },
    },
  });

  const { data: subscriptionData } = useSubscription(
    REQUEST_RESERVE_CREATED_SUBSCRIPTION
  );
  const { data: subscriptionDataRequest } = useSubscription(
    REQUEST_CREATED_SUBSCRIPTION
  );

  useEffect(() => {
    if (subscriptionData) {
      // const newReserve = subscriptionData.reserveCreated;

      // setReserves((prevRequests) => {
      //   const exists = prevRequests.some(
      //     (request) => request.id === newReserve.id
      //   );
      //   if (!exists) {
      //     setNewReserves((prevNewRequests) => [newReserve, ...prevNewRequests]);
      //   }
      //   return prevRequests;
      // });

      refetch();
    }

    if (subscriptionDataRequest) {
      // const newRequest = subscriptionDataRequest.requestCreated;

      // setRequests((prevRequests) => {
      //   const exists = prevRequests.some(
      //     (request) => request.id === newRequest.id
      //   );
      //   if (!exists) {
      //     setNewRequests((prevNewRequests) => [newRequest, ...prevNewRequests]);
      //   }
      //   return prevRequests;
      // });

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

      // refetch();
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
            // request.status === "created" &&
            (user.hotelId ? request.airport?.city === hotelCity : true) &&
            (user.airlineId ? request.airline?.name === airlineName : true)
        ).length
      );
    }
  }, [data, dataRequest, hotelCity, airlineName, newReserves, newRequests]);

  // Пока значение menuOpen не загружено из localStorage, ничего не рендерим
  if (menuOpen === null || !user) {
    return null; // или можно вернуть спиннер загрузки
  }

  return (
    <>
      <div className={menuOpen ? `${classes.menu}` : `${classes.w_closed}`}>
        <div className={classes.menuHeader}>
          {/* Стрелка для открытия/закрытия меню */}
          <button className={menuOpen ? `${classes.menuToggle}` : `${classes.menuToggleClose}`} onClick={handleMenuToggle}>
            {/* <span> */}
            {menuOpen ? (
              // <img src="/left-arrow.png" alt="" />
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.8 28H18.2C25.2 28 28 25.2 28 18.2V9.8C28 2.8 25.2 0 18.2 0H9.8C2.8 0 0 2.8 0 9.8V18.2C0 25.2 2.8 28 9.8 28Z" fill="#2B314A" />
                <path d="M15.764 18.942L10.836 14L15.764 9.05798" fill="#2B314A" />
                <path d="M15.764 18.942L10.836 14L15.764 9.05798" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              // <img src="/right-arrow.png" alt="" />
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.8 28H18.2C25.2 28 28 25.2 28 18.2V9.8C28 2.8 25.2 0 18.2 0H9.8C2.8 0 0 2.8 0 9.8V18.2C0 25.2 2.8 28 9.8 28Z" fill="#2B314A" />
                <path d="M12.236 9.05798L17.164 14L12.236 18.942" fill="#2B314A" />
                <path d="M12.236 9.05798L17.164 14L12.236 18.942" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}

            {/* </span> */}
            {/* Стрелка */}
          </button>
        </div>
        <Link
          to={"/"}
          className={
            menuOpen ? `${classes.menu_logo}` : `${classes.side_menu_logo}`
          }
        >
          {/* // <img src="/KARSAVIA_withoutLogo.png" alt="" /> */}


          {menuOpen ? (
            // <img src="/KARSAVIA_withoutLogo.png" alt="" />
            <div className={classes.logoWrapper}>
              <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30.2001 0H6.79992C3.04443 0 0 3.04443 0 6.79992V30.2001C0 33.9556 3.04443 37 6.79992 37H30.2001C33.9556 37 37 33.9556 37 30.2001V6.79992C37 3.04443 33.9556 0 30.2001 0Z" fill="#0057C3" />
                <path fillRule="evenodd" clipRule="evenodd" d="M15.033 13.5151H15.5441H16.4012C16.3941 13.9317 16.4167 14.3496 16.4689 14.7633C16.5438 15.3606 16.6793 15.9395 16.8671 16.4929C17.0012 16.8883 17.1636 17.2723 17.3514 17.6394C17.7933 18.5092 18.3751 19.2942 19.0669 19.9677C20.2007 21.0705 21.6324 21.871 23.2279 22.2367C23.5428 22.3087 23.8661 22.3638 24.1909 22.4019C24.4803 22.1548 24.7938 21.936 25.127 21.7468C24.942 21.3204 24.6709 20.9349 24.3349 20.6158C20.9293 20.1174 18.3143 17.1848 18.3143 13.6422C18.3143 12.9631 18.4104 12.2896 18.6038 11.6387H16.6327C16.3927 11.6387 16.1512 11.6387 15.9112 11.6387H5.47412L6.40177 13.5166H15.0344L15.033 13.5151Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M14.7223 14.7648H7.01733L7.87156 16.4944H14.5952H15.7177C15.5878 15.9367 15.5116 15.3578 15.4932 14.7648H14.7209H14.7223Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M13.2666 26.6126V28.1545H13.9429H17.8074L16.6708 26.3317L14.9581 26.4178C14.7421 23.7591 19.6641 26.1509 20.7513 24.6698C20.8657 24.7051 20.9814 24.739 21.0972 24.7715C21.5152 24.8844 21.9444 24.9663 22.3835 25.0171C22.5388 24.5809 22.7435 24.1615 22.9977 23.7676C23.1135 23.5883 23.2377 23.4146 23.3705 23.248C22.4626 23.1534 21.5956 22.9204 20.7908 22.5717C20.4957 22.8046 20.1724 23.0037 19.8279 23.1633C17.8483 24.0838 17.782 23.4654 16.082 23.4654C14.5176 23.4654 13.2496 24.7333 13.2496 26.2978C13.2496 26.4037 13.2553 26.5096 13.2666 26.6126Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M14.6998 17.6411H8.43925L9.29065 19.3636H15.153C15.2547 19.6347 15.3691 19.9002 15.4961 20.1571C14.8594 20.3463 14.2579 20.616 13.7016 20.9549C10.937 22.6422 11.4876 23.6757 10.2324 25.7484C10.0503 26.0506 9.71706 26.2525 9.33866 26.2525C8.76259 26.2525 8.29523 25.7852 8.29523 25.2091C8.29523 23.8042 11.8138 24.8956 10.9892 20.8462C8.98144 20.7784 7.81376 21.1526 7.69233 23.1349C5.37392 26.2949 7.99449 27.7915 9.34713 27.7915C10.1322 27.7915 11.2236 27.1943 11.6797 26.5236C12.7047 25.0156 11.811 22.1579 16.5735 22.035C16.685 22.0322 16.7965 22.0336 16.9067 22.0379C17.6536 22.0181 18.3596 21.8317 18.9865 21.514C18.3567 21.0368 17.792 20.4762 17.3105 19.8493C17.1891 19.6912 17.0733 19.5288 16.9617 19.3622C16.6045 18.8257 16.3052 18.2496 16.0722 17.6396H14.7012L14.6998 17.6411ZM8.31641 23.4682C8.61574 23.2917 8.96591 23.19 9.33866 23.19C9.37255 23.19 9.40502 23.1914 9.43891 23.1928C9.76083 22.789 9.98815 22.3527 10.0602 21.8656C8.86283 22.0407 8.74141 22.1706 8.74141 23.1999L8.31641 23.4667V23.4682Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M27.1645 13.415V13.5308C26.964 13.4461 26.7564 13.3741 26.5446 13.3148C26.5065 13.3049 26.467 13.295 26.4288 13.2837C25.2174 12.9392 24.2601 11.9932 23.8986 10.7902C24.3956 10.5431 24.9604 10.4033 25.5478 10.4033C26.1338 10.4033 26.6773 10.536 27.1659 10.7747V13.4136L27.1645 13.415ZM23.6021 13.343C24.2516 14.032 25.0833 14.546 26.0208 14.8086C26.0589 14.8185 26.0985 14.8284 26.1366 14.8397C27.0713 15.1051 27.8535 15.7292 28.3293 16.5523C28.6202 17.0564 28.7953 17.6339 28.8207 18.2509C28.8221 18.3017 28.8235 18.3512 28.8235 18.402C28.8235 19.2633 28.5298 20.0554 28.0371 20.6837C27.8013 20.1217 27.4694 19.6106 27.0642 19.1673C26.4966 18.5474 25.7836 18.0631 24.9802 17.7694C24.6922 17.7257 24.4168 17.648 24.1542 17.5421C23.3861 17.2301 22.7465 16.6695 22.3356 15.9579C22.0448 15.4538 21.8697 14.8764 21.8443 14.2593C21.8429 14.2099 21.8414 14.1591 21.8414 14.1083C21.8414 13.2583 22.1281 12.4746 22.6095 11.8506C22.8538 12.404 23.1913 12.9095 23.6007 13.343H23.6021ZM25.3487 25.7243C25.8387 23.4102 27.1391 23.5626 28.4451 22.5037C28.8828 22.1493 29.2626 21.7257 29.5676 21.2499C30.0957 20.4281 30.4006 19.4511 30.4006 18.4006C30.4006 17.816 30.306 17.2541 30.131 16.7288C29.9149 16.0822 29.5775 15.4906 29.1454 14.9823C29.0861 14.9131 29.0254 14.8453 28.9633 14.7789C28.8828 14.6942 28.8009 14.6123 28.7162 14.5333V13.2004V12.1908V9.88373V8.84595H25.9926H25.1002C24.6441 8.88407 24.2036 8.98008 23.7885 9.12692C23.1941 9.3373 22.6491 9.64934 22.1747 10.0447C21.0098 11.0133 20.2671 12.4732 20.2671 14.1083C20.2671 14.6928 20.3617 15.2548 20.5368 15.78C20.7528 16.4267 21.0903 17.0183 21.5223 17.5266C21.5647 17.576 21.6071 17.624 21.6508 17.672C22.2184 18.2919 22.9315 18.7762 23.7349 19.0698C24.0229 19.1136 24.2982 19.1913 24.5608 19.2972C25.6099 19.7222 26.4246 20.6343 26.7381 21.7356C26.6392 21.7836 26.5362 21.8274 26.4331 21.8669C25.6579 22.2933 25.0014 22.9075 24.5255 23.6488C24.0144 24.4451 23.7123 25.3855 23.6925 26.3978C23.6925 26.4317 23.6911 26.4642 23.6911 26.4981C23.6911 27.0064 23.7631 27.4963 23.8972 27.9609H25.569H27.5189V26.4642L25.3487 25.7257V25.7243Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M19.3464 27.9666L23.2857 27.9864C22.8706 27.1307 22.8664 26.4657 21.7411 26.4657H20.4096C19.2815 26.4657 19.3379 26.9119 19.3464 27.9666Z" fill="white" />
              </svg>

              <svg width="146" height="20" viewBox="0 0 146 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M123.663 19.0068L131.889 0.372803H137.08L145.332 19.0068H139.848L133.406 2.95495H135.482L129.04 19.0068H123.663ZM128.162 15.3865L129.519 11.5H138.624L139.981 15.3865H128.162Z" fill="white" />
                <path d="M116.879 19.0068V0.372803H122.149V19.0068H116.879Z" fill="white" />
                <path d="M102.611 19.0068L94.6515 0.372803H100.348L107.056 16.5045H103.702L110.57 0.372803H115.788L107.802 19.0068H102.611Z" fill="white" />
                <path d="M74.7644 19.0068L82.99 0.372803H88.1809L96.4331 19.0068H90.9494L84.5073 2.95495H86.5837L80.1416 19.0068H74.7644ZM79.2632 15.3865L80.6208 11.5H89.7249L91.0825 15.3865H79.2632Z" fill="white" />
                <path d="M66.3136 19.3794C64.7874 19.3794 63.3144 19.193 61.8947 18.8204C60.4927 18.4299 59.348 17.933 58.4607 17.3296L60.191 13.4431C61.0251 13.9755 61.9834 14.4192 63.066 14.7741C64.1662 15.1113 65.2577 15.2799 66.3402 15.2799C67.0678 15.2799 67.6535 15.2178 68.0971 15.0936C68.5408 14.9516 68.8602 14.7741 69.0555 14.5612C69.2684 14.3304 69.3749 14.0642 69.3749 13.7626C69.3749 13.3366 69.1797 12.9994 68.7893 12.751C68.3988 12.5025 67.8931 12.2985 67.2719 12.1387C66.6508 11.979 65.9587 11.8193 65.1956 11.6596C64.4502 11.4999 63.696 11.2958 62.9329 11.0473C62.1875 10.7989 61.5042 10.4794 60.8831 10.089C60.262 9.68082 59.7562 9.15729 59.3658 8.51841C58.9753 7.86178 58.7801 7.03656 58.7801 6.04275C58.7801 4.92471 59.0818 3.91314 59.6852 3.00806C60.3063 2.10298 61.2292 1.37537 62.4537 0.825221C63.6782 0.275074 65.2044 0 67.0323 0C68.2569 0 69.4548 0.141974 70.626 0.425921C71.8151 0.692121 72.871 1.09142 73.7938 1.62382L72.17 5.53697C71.2827 5.0578 70.4042 4.70287 69.5346 4.47217C68.665 4.22371 67.8221 4.09948 67.0057 4.09948C66.2781 4.09948 65.6925 4.17935 65.2488 4.33907C64.8051 4.48104 64.4857 4.67625 64.2905 4.9247C64.0953 5.17316 63.9977 5.45711 63.9977 5.77655C63.9977 6.18472 64.184 6.51303 64.5567 6.76149C64.9471 6.99219 65.4529 7.18741 66.074 7.34713C66.7129 7.4891 67.405 7.63995 68.1504 7.79967C68.9135 7.95939 69.6677 8.16347 70.4131 8.41193C71.1762 8.64264 71.8683 8.96208 72.4894 9.37025C73.1106 9.76068 73.6075 10.2842 73.9802 10.9408C74.3706 11.5797 74.5658 12.3872 74.5658 13.3633C74.5658 14.4458 74.2552 15.4485 73.6341 16.3713C73.0307 17.2764 72.1168 18.004 70.8922 18.5542C69.6855 19.1043 68.1593 19.3794 66.3136 19.3794Z" fill="white" />
                <path d="M40.0601 19.0068V0.372803H48.5785C50.2821 0.372803 51.7462 0.647876 52.9708 1.19802C54.213 1.74817 55.1714 2.54677 55.8457 3.59383C56.5201 4.62313 56.8573 5.84765 56.8573 7.26739C56.8573 8.66938 56.5201 9.88503 55.8457 10.9143C55.1714 11.9259 54.213 12.7067 52.9708 13.2569C51.7462 13.7893 50.2821 14.0555 48.5785 14.0555H42.9883L45.3308 11.846V19.0068H40.0601ZM51.5865 19.0068L46.9546 12.2187H52.5715L57.23 19.0068H51.5865ZM45.3308 12.4051L42.9883 9.98263H48.259C49.3593 9.98263 50.1757 9.74305 50.7081 9.26389C51.2582 8.78473 51.5333 8.11923 51.5333 7.26739C51.5333 6.3978 51.2582 5.72343 50.7081 5.24427C50.1757 4.76511 49.3593 4.52553 48.259 4.52553H42.9883L45.3308 2.1031V12.4051Z" fill="white" />
                <path d="M16.8971 19.0068L25.1227 0.372803H30.3136L38.5658 19.0068H33.0821L26.64 2.95495H28.7164L22.2743 19.0068H16.8971ZM21.3959 15.3865L22.7535 11.5H31.8575L33.2152 15.3865H21.3959Z" fill="white" />
                <path d="M4.71174 14.8807L4.41892 8.97107L12.4316 0.372803H18.2347L10.2487 9.02431L7.32051 12.0856L4.71174 14.8807ZM0 19.0068V0.372803H5.21752V19.0068H0ZM12.5114 19.0068L6.44205 11.3136L9.87603 7.64007L18.634 19.0068H12.5114Z" fill="white" />
              </svg>
            </div>
          ) : (
            // <img src="/miniLogo.png" alt="" />
            <div className={classes.logoWrapper}>
              <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30.2001 0H6.79992C3.04443 0 0 3.04443 0 6.79992V30.2001C0 33.9556 3.04443 37 6.79992 37H30.2001C33.9556 37 37 33.9556 37 30.2001V6.79992C37 3.04443 33.9556 0 30.2001 0Z" fill="#0057C3" />
                <path fillRule="evenodd" clipRule="evenodd" d="M15.033 13.5151H15.5441H16.4012C16.3941 13.9317 16.4167 14.3496 16.4689 14.7633C16.5438 15.3606 16.6793 15.9395 16.8671 16.4929C17.0012 16.8883 17.1636 17.2723 17.3514 17.6394C17.7933 18.5092 18.3751 19.2942 19.0669 19.9677C20.2007 21.0705 21.6324 21.871 23.2279 22.2367C23.5428 22.3087 23.8661 22.3638 24.1909 22.4019C24.4803 22.1548 24.7938 21.936 25.127 21.7468C24.942 21.3204 24.6709 20.9349 24.3349 20.6158C20.9293 20.1174 18.3143 17.1848 18.3143 13.6422C18.3143 12.9631 18.4104 12.2896 18.6038 11.6387H16.6327C16.3927 11.6387 16.1512 11.6387 15.9112 11.6387H5.47412L6.40177 13.5166H15.0344L15.033 13.5151Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M14.7223 14.7648H7.01733L7.87156 16.4944H14.5952H15.7177C15.5878 15.9367 15.5116 15.3578 15.4932 14.7648H14.7209H14.7223Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M13.2666 26.6126V28.1545H13.9429H17.8074L16.6708 26.3317L14.9581 26.4178C14.7421 23.7591 19.6641 26.1509 20.7513 24.6698C20.8657 24.7051 20.9814 24.739 21.0972 24.7715C21.5152 24.8844 21.9444 24.9663 22.3835 25.0171C22.5388 24.5809 22.7435 24.1615 22.9977 23.7676C23.1135 23.5883 23.2377 23.4146 23.3705 23.248C22.4626 23.1534 21.5956 22.9204 20.7908 22.5717C20.4957 22.8046 20.1724 23.0037 19.8279 23.1633C17.8483 24.0838 17.782 23.4654 16.082 23.4654C14.5176 23.4654 13.2496 24.7333 13.2496 26.2978C13.2496 26.4037 13.2553 26.5096 13.2666 26.6126Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M14.6998 17.6411H8.43925L9.29065 19.3636H15.153C15.2547 19.6347 15.3691 19.9002 15.4961 20.1571C14.8594 20.3463 14.2579 20.616 13.7016 20.9549C10.937 22.6422 11.4876 23.6757 10.2324 25.7484C10.0503 26.0506 9.71706 26.2525 9.33866 26.2525C8.76259 26.2525 8.29523 25.7852 8.29523 25.2091C8.29523 23.8042 11.8138 24.8956 10.9892 20.8462C8.98144 20.7784 7.81376 21.1526 7.69233 23.1349C5.37392 26.2949 7.99449 27.7915 9.34713 27.7915C10.1322 27.7915 11.2236 27.1943 11.6797 26.5236C12.7047 25.0156 11.811 22.1579 16.5735 22.035C16.685 22.0322 16.7965 22.0336 16.9067 22.0379C17.6536 22.0181 18.3596 21.8317 18.9865 21.514C18.3567 21.0368 17.792 20.4762 17.3105 19.8493C17.1891 19.6912 17.0733 19.5288 16.9617 19.3622C16.6045 18.8257 16.3052 18.2496 16.0722 17.6396H14.7012L14.6998 17.6411ZM8.31641 23.4682C8.61574 23.2917 8.96591 23.19 9.33866 23.19C9.37255 23.19 9.40502 23.1914 9.43891 23.1928C9.76083 22.789 9.98815 22.3527 10.0602 21.8656C8.86283 22.0407 8.74141 22.1706 8.74141 23.1999L8.31641 23.4667V23.4682Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M27.1645 13.415V13.5308C26.964 13.4461 26.7564 13.3741 26.5446 13.3148C26.5065 13.3049 26.467 13.295 26.4288 13.2837C25.2174 12.9392 24.2601 11.9932 23.8986 10.7902C24.3956 10.5431 24.9604 10.4033 25.5478 10.4033C26.1338 10.4033 26.6773 10.536 27.1659 10.7747V13.4136L27.1645 13.415ZM23.6021 13.343C24.2516 14.032 25.0833 14.546 26.0208 14.8086C26.0589 14.8185 26.0985 14.8284 26.1366 14.8397C27.0713 15.1051 27.8535 15.7292 28.3293 16.5523C28.6202 17.0564 28.7953 17.6339 28.8207 18.2509C28.8221 18.3017 28.8235 18.3512 28.8235 18.402C28.8235 19.2633 28.5298 20.0554 28.0371 20.6837C27.8013 20.1217 27.4694 19.6106 27.0642 19.1673C26.4966 18.5474 25.7836 18.0631 24.9802 17.7694C24.6922 17.7257 24.4168 17.648 24.1542 17.5421C23.3861 17.2301 22.7465 16.6695 22.3356 15.9579C22.0448 15.4538 21.8697 14.8764 21.8443 14.2593C21.8429 14.2099 21.8414 14.1591 21.8414 14.1083C21.8414 13.2583 22.1281 12.4746 22.6095 11.8506C22.8538 12.404 23.1913 12.9095 23.6007 13.343H23.6021ZM25.3487 25.7243C25.8387 23.4102 27.1391 23.5626 28.4451 22.5037C28.8828 22.1493 29.2626 21.7257 29.5676 21.2499C30.0957 20.4281 30.4006 19.4511 30.4006 18.4006C30.4006 17.816 30.306 17.2541 30.131 16.7288C29.9149 16.0822 29.5775 15.4906 29.1454 14.9823C29.0861 14.9131 29.0254 14.8453 28.9633 14.7789C28.8828 14.6942 28.8009 14.6123 28.7162 14.5333V13.2004V12.1908V9.88373V8.84595H25.9926H25.1002C24.6441 8.88407 24.2036 8.98008 23.7885 9.12692C23.1941 9.3373 22.6491 9.64934 22.1747 10.0447C21.0098 11.0133 20.2671 12.4732 20.2671 14.1083C20.2671 14.6928 20.3617 15.2548 20.5368 15.78C20.7528 16.4267 21.0903 17.0183 21.5223 17.5266C21.5647 17.576 21.6071 17.624 21.6508 17.672C22.2184 18.2919 22.9315 18.7762 23.7349 19.0698C24.0229 19.1136 24.2982 19.1913 24.5608 19.2972C25.6099 19.7222 26.4246 20.6343 26.7381 21.7356C26.6392 21.7836 26.5362 21.8274 26.4331 21.8669C25.6579 22.2933 25.0014 22.9075 24.5255 23.6488C24.0144 24.4451 23.7123 25.3855 23.6925 26.3978C23.6925 26.4317 23.6911 26.4642 23.6911 26.4981C23.6911 27.0064 23.7631 27.4963 23.8972 27.9609H25.569H27.5189V26.4642L25.3487 25.7257V25.7243Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M19.3464 27.9666L23.2857 27.9864C22.8706 27.1307 22.8664 26.4657 21.7411 26.4657H20.4096C19.2815 26.4657 19.3379 26.9119 19.3464 27.9666Z" fill="white" />
              </svg>
            </div>
          )}

        </Link>
        <div className={classes.menu_items}>
          {user.role == roles.hotelAdmin && (
            <HotelAdminMenu
              id={id}
              allCreatedReserves={allCreatedReserves}
              menuOpen={menuOpen}
            />
          )}

          {isAirlineAdmin(user) && (
            <AirlineAdminMenu
              id={id}
              allCreatedRequests={allCreatedRequests}
              allCreatedReserves={allCreatedReserves}
              menuOpen={menuOpen}
              user={user}
              accessMenu={accessMenu}
            />
          )}

          {isSuperAdmin(user) && (
            <SuperAdminMenu
              id={id}
              allCreatedReserves={allCreatedReserves}
              allCreatedRequests={allCreatedRequests}
              menuOpen={menuOpen}
            />
          )}
          {isDispatcherAdmin(user) && (
            <DisAdminMenu
              id={id}
              allCreatedReserves={allCreatedReserves}
              allCreatedRequests={allCreatedRequests}
              menuOpen={menuOpen}
              accessMenu={accessMenu}
              user={user}
            />
            // <TransferAdminMenu
            //   id={id}
            //   allCreatedReserves={allCreatedReserves}
            //   allCreatedRequests={allCreatedRequests}
            //   menuOpen={menuOpen}
            // />
            // <RepresentativeAdminMenu
            //   id={id}
            //   allCreatedReserves={allCreatedReserves}
            //   allCreatedRequests={allCreatedRequests}
            //   menuOpen={menuOpen}
            // />
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
