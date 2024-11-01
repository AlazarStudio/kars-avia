import React, { useEffect, useState } from "react";
import classes from './MenuDispetcher.module.css';
import { Link, useNavigate } from "react-router-dom";
import { decodeJWT, GET_AIRLINE, GET_HOTEL_CITY, GET_REQUESTS, GET_RESERVE_REQUESTS, getCookie, REQUEST_CREATED_SUBSCRIPTION, REQUEST_RESERVE_CREATED_SUBSCRIPTION } from "../../../../graphQL_requests";
import { Tab, TabList } from "react-tabs";
import { useQuery, useSubscription } from "@apollo/client";

function MenuDispetcher({ children, id, hotelID, ...props }) {
    const token = getCookie('token');

    const [user, setUser] = useState('');

    useEffect(() => {
        if (token) {
            setUser(decodeJWT(token));
        }
    }, [token]);

    const navigate = useNavigate()

    const [reserves, setReserves] = useState([]);
    const [requests, setRequests] = useState([]);

    const [newReserves, setNewReserves] = useState([]);
    const [newRequests, setNewRequests] = useState([]);

    const handleClick = () => {
        let result = confirm("Вы уверены что хотите выйти?");
        if (result) {
            document.cookie = "token=; Max-Age=0; Path=/;";
            navigate('/')
            window.location.reload()
        }
    }

    const [hotelCity, setHotelCity] = useState();

    const { loading: hotelLoading, error: hotelError, data: hotelData } = useQuery(GET_HOTEL_CITY, {
        variables: { hotelId: user.hotelId },
    });

    useEffect(() => {
        if (hotelData) {
            setHotelCity(hotelData.hotel.city);
        }
    }, [hotelData]);

    const [airlineName, setAirlineName] = useState();

    const { loading: airlineLoading, error: airlineError, data: airlineData } = useQuery(GET_AIRLINE, {
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
        variables: { pagination: { skip: 0, take: 999999999 } },
    });

    const { loading: loadingRequest, error: errorRequest, data: dataRequest, refetch: refetchRequest } = useQuery(GET_REQUESTS, {
        variables: { pagination: { skip: 0, take: 999999999 } },
    });

    const { data: subscriptionData } = useSubscription(REQUEST_RESERVE_CREATED_SUBSCRIPTION);
    const { data: subscriptionDataRequest } = useSubscription(REQUEST_CREATED_SUBSCRIPTION);

    useEffect(() => {
        if (subscriptionData) {
            const newReserve = subscriptionData.reserveCreated;

            setReserves((prevRequests) => {
                const exists = prevRequests.some(request => request.id === newReserve.id);
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
                const exists = prevRequests.some(request => request.id === newRequest.id);
                if (!exists) {
                    setNewRequests((prevNewRequests) => [newRequest, ...prevNewRequests]);
                }
                return prevRequests;
            });

            refetchRequest();
        }
    }, [subscriptionData, subscriptionDataRequest, hotelCity, airlineName, data, dataRequest]);


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
            const uniqueRequests = sortedRequests.filter((request, index, self) =>
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
                <Link to={'/'} className={classes.menu_logo}><img src="/kars-avia-mainLogo.png" alt="" /></Link>
                <div className={classes.menu_items}>

                    {user.role == 'HOTELADMIN' &&
                        <>
                            <Link to={'/reserveRequests'} className={`${classes.menu_items__elem} ${(id == 'reserveRequests') && classes.menu_items__activeElem}`}>
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.32714 3.28667C1.42238 2.46286 1.92238 1.78286 2.7319 1.60381C3.99476 1.32429 6.44286 1 11 1C15.5571 1 18.0048 1.32429 19.2681 1.60381C20.0776 1.78286 20.5776 2.46286 20.6729 3.28667C20.8176 4.53238 21 6.58381 21 9C21 13.5143 18.6176 17.7381 14.6038 19.8038C13.2629 20.4943 11.9543 21 11 21C10.0457 21 8.73714 20.4938 7.39619 19.8038C3.38238 17.7381 1 13.5143 1 9C1 6.58381 1.18238 4.53238 1.32714 3.28667Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M3.92857 9.23704C4.45656 10.3876 5.04991 11.5071 5.70571 12.5899C5.95762 12.998 6.42143 13.1675 6.85381 13.0251C7.68095 12.7537 8.68619 12.1775 10.4457 11.5275C10.2886 12.4799 10.1757 13.4137 10.1071 14.0504C10.0595 14.4937 10.3724 14.8885 10.7743 14.7961C11.129 14.7147 11.9519 14.177 12.1905 14.0504C12.5071 13.8818 12.7381 13.5837 12.8857 13.2361C13.3424 12.1495 13.7445 11.0409 14.0905 9.91418C15.2919 9.42704 16.3571 9.1218 17.5405 8.56656C18.1167 8.29656 18.341 7.55037 17.9395 7.02704C17.361 6.27323 16.4238 5.36942 15.2176 5.29275C12.61 5.12656 9.80952 7.91751 7.54952 9.25894C7.54952 9.25894 6.67714 8.48561 5.70571 7.82037C5.56524 7.72418 5.39762 7.68656 5.23666 7.73227C5.06285 7.7818 4.46428 8.16561 4.18714 8.31323C3.87333 8.47989 3.77476 8.89704 3.92857 9.23704Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Заявки с резерва

                                {
                                    allCreatedReserves > 0 &&
                                    <div className={classes.countRequests}>
                                        {allCreatedReserves}
                                    </div>
                                }
                            </Link>
                            <Link to={'/hotelChess'} className={`${classes.menu_items__elem} ${(id == 'hotelChess' || id == undefined) && classes.menu_items__activeElem}`}>
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clip-path="url(#clip0_777_5618)">
                                        <path d="M3.78446 20.378C2.61342 20.2826 1.71738 19.3866 1.62204 18.2155C1.50196 16.736 1.375 14.3752 1.375 11C1.375 7.62483 1.50196 5.26396 1.62204 3.78446C1.71738 2.61342 2.61342 1.71738 3.78446 1.62204C5.26396 1.50196 7.62483 1.375 11 1.375C14.3752 1.375 16.736 1.50196 18.2155 1.62204C19.3866 1.71738 20.2826 2.61342 20.378 3.78446C20.498 5.26396 20.625 7.62483 20.625 11C20.625 14.3752 20.498 16.736 20.378 18.2155C20.2826 19.3866 19.3866 20.2826 18.2155 20.378C16.736 20.498 14.3752 20.625 11 20.625C7.62483 20.625 5.26396 20.498 3.78446 20.378Z" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M6.875 20.5535V1.44556" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M1.4895 7.79175H20.5103" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M1.4895 14.2083H20.5103" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_777_5618">
                                            <rect width="22" height="22" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                Шахматка
                            </Link>
                            <Link to={'/hotelTarifs'} className={`${classes.menu_items__elem} ${(id == 'hotelTarifs') && classes.menu_items__activeElem}`}>
                                <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.6923 14.0769V17.1538C18.6923 17.5619 18.5301 17.9532 18.2418 18.2418C17.9534 18.5303 17.5619 18.6923 17.1538 18.6923H2.53846C2.13046 18.6923 1.73909 18.5301 1.45055 18.2418C1.16217 17.9532 1 17.5619 1 17.1538V5.61538C1 3.0664 3.06641 1 5.61538 1H15.6154V4.84615" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M20.231 9.46143H14.8464C14.4216 9.46143 14.0771 9.80585 14.0771 10.2307V13.3076C14.0771 13.7324 14.4216 14.0768 14.8464 14.0768H20.231C20.6558 14.0768 21.0002 13.7324 21.0002 13.3076V10.2307C21.0002 9.80585 20.6558 9.46143 20.231 9.46143Z" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M18.6922 9.46158V6.38465C18.6922 5.97665 18.53 5.58528 18.2416 5.29674C17.9531 5.00836 17.5617 4.84619 17.1537 4.84619H5.61523" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                Тарифы
                            </Link>
                            <Link to={'/hotelRooms'} className={`${classes.menu_items__elem} ${(id == 'hotelRooms') && classes.menu_items__activeElem}`}>
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.81348 10.0416C3.81091 11.8857 5.80562 13.041 7.40392 12.1212C8.14775 11.6931 8.60577 10.8998 8.60458 10.0416C8.60714 8.19751 6.61243 7.04219 5.01413 7.96202C4.2703 8.39011 3.81229 9.18339 3.81348 10.0416Z" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M8.71472 6.93344C8.77985 6.27899 9.31839 5.78981 9.97523 5.76295C12.4805 5.65946 14.7951 5.80993 16.6536 6.02406C19.2676 6.32496 21.0614 8.61369 21.0614 11.2449V11.4788C21.0614 12.008 20.6324 12.437 20.1032 12.437H9.66049C9.1962 12.437 8.80144 12.1045 8.74823 11.6441C8.65303 10.8098 8.60504 9.97082 8.60449 9.1311C8.60449 8.27113 8.6572 7.50838 8.71472 6.93344Z" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M2.84511 3.3498C3.38411 3.38908 3.70082 3.83036 3.72429 4.37028C3.76499 5.30697 3.81339 7.21621 3.81339 10.9997C3.81339 11.5431 3.81242 12.048 3.8105 12.5166C4.94552 12.4783 7.07759 12.4371 11.0001 12.4371H20.0945C20.6254 12.4371 21.0552 12.8692 21.0513 13.4001C21.036 15.6385 21.0005 16.9158 20.9699 17.6288C20.9459 18.1687 20.6297 18.6104 20.0907 18.6492C19.7784 18.6715 19.4649 18.6717 19.1526 18.6497C18.6136 18.6104 18.2969 18.1687 18.2734 17.6288C18.2519 17.1391 18.2289 16.3831 18.2111 15.2318C17.0819 15.2701 14.9475 15.3117 11.0001 15.3117C7.04977 15.3117 4.91536 15.2701 3.78657 15.2318C3.77672 16.0311 3.75596 16.8304 3.72429 17.6292C3.70077 18.1692 3.38411 18.6104 2.84511 18.6497C2.70949 18.6593 2.5543 18.6656 2.37605 18.6656C2.19781 18.6656 2.04262 18.6593 1.907 18.6497C1.368 18.6104 1.05129 18.1692 1.02782 17.6292C0.987121 16.6926 0.938721 14.7833 0.938721 10.9997C0.938721 7.21671 0.987121 5.30697 1.02782 4.37028C1.05133 3.83036 1.368 3.38908 1.907 3.3498C2.04262 3.34022 2.19781 3.33398 2.37605 3.33398C2.5543 3.33398 2.70954 3.33971 2.84511 3.3498Z" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                Номерной фонд
                            </Link>
                            <Link to={'/hotelCompany'} className={`${classes.menu_items__elem} ${(id == 'hotelCompany') && classes.menu_items__activeElem}`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16.3922 12.8311C16.4334 12.7557 16.4942 12.6929 16.5682 12.6491C16.6421 12.6053 16.7264 12.5822 16.8124 12.5822C16.8983 12.5822 16.9827 12.6053 17.0566 12.6491C17.1305 12.6929 17.1913 12.7557 17.2326 12.8311L18.0376 14.3021C18.5653 15.2669 19.3585 16.0601 20.3232 16.5878L21.7938 17.3923C21.8692 17.4336 21.932 17.4944 21.9758 17.5683C22.0196 17.6422 22.0427 17.7266 22.0427 17.8125C22.0427 17.8984 22.0196 17.9828 21.9758 18.0567C21.932 18.1306 21.8692 18.1914 21.7938 18.2327L20.3228 19.0377C19.358 19.5654 18.5648 20.3586 18.0371 21.3234L17.2326 22.7939C17.1913 22.8693 17.1305 22.9322 17.0566 22.9759C16.9827 23.0197 16.8983 23.0428 16.8124 23.0428C16.7264 23.0428 16.6421 23.0197 16.5682 22.9759C16.4942 22.9322 16.4334 22.8693 16.3922 22.7939L15.5872 21.3229C15.0595 20.3581 14.2663 19.5649 13.3015 19.0373L11.831 18.2327C11.7556 18.1914 11.6927 18.1306 11.6489 18.0567C11.6051 17.9828 11.582 17.8984 11.582 17.8125C11.582 17.7266 11.6051 17.6422 11.6489 17.5683C11.6927 17.4944 11.7556 17.4336 11.831 17.3923L13.302 16.5873C14.2668 16.0596 15.06 15.2664 15.5876 14.3016L16.3922 12.8311Z" stroke="var(--menu-gray)" />
                                    <path d="M18.25 10.3854C18.2438 7.48837 18.1336 5.45 18.0286 4.15912C17.9433 3.10975 17.1402 2.30667 16.0909 2.22137C14.765 2.11356 12.6495 2 9.625 2C6.6005 2 4.48498 2.11356 3.15912 2.22137C2.10975 2.30667 1.30667 3.10975 1.22137 4.15912C1.11356 5.48498 1 7.6005 1 10.625C1 13.6495 1.11356 15.765 1.22137 17.0909C1.30667 18.1402 2.10975 18.9433 3.15912 19.0286C4.45 19.1336 6.48837 19.2442 9.38542 19.25" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M9.62503 15.9644C7.96711 15.9644 6.68917 15.9184 5.75192 15.8628C5.7385 15.8619 5.72508 15.861 5.71167 15.8599C4.98957 15.8058 4.61294 15.0309 4.8554 14.3486C5.34798 12.9619 6.45678 11.8565 7.86217 11.3447C7.26194 10.9631 6.80176 10.397 6.55076 9.73149C6.29976 9.06598 6.2715 8.33699 6.47022 7.65404C6.66895 6.97109 7.08392 6.37107 7.65281 5.94413C8.22169 5.51719 8.91375 5.28638 9.62503 5.28638C10.3363 5.28638 11.0284 5.51719 11.5972 5.94413C12.1661 6.37107 12.5811 6.97109 12.7798 7.65404C12.9786 8.33699 12.9503 9.06598 12.6993 9.73149C12.4483 10.397 11.9881 10.9631 11.3879 11.3447C12.1855 11.6348 12.8975 12.1207 13.4584 12.7578" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                Компания
                            </Link>
                            <Link to={'/hotelAbout'} className={`${classes.menu_items__elem} ${(id == 'hotelAbout') && classes.menu_items__activeElem}`}>
                                <svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.33306 6.99878V2.99959C2.33306 2.33306 2.79963 1 4.66592 1C6.53221 1 13.8863 1 17.33 1C18.2187 1.11109 19.6629 1.66653 19.6629 3.66613C19.6629 5.55136 19.6629 6.99878 19.6629 6.99878M5.33245 6.66552C5.33245 6.13964 5.33245 5.33245 5.33245 4.99919C5.33245 4.42239 5.82674 3.99939 6.33225 3.99939C7.3987 3.99939 9.33164 3.99939 9.99817 3.99939C10.5666 3.99939 10.998 4.24151 10.998 4.99919C10.998 6.06564 10.998 6.55443 10.998 6.66552M11.3312 6.66552C11.3312 6.13964 11.3312 5.33245 11.3312 4.99919C11.3312 4.42239 11.8255 3.99939 12.331 3.99939C13.3975 3.99939 15.3304 3.99939 15.997 3.99939C16.5654 3.99939 16.9968 4.24151 16.9968 4.99919C16.9968 6.06564 16.9968 6.55443 16.9968 6.66552M1 14.6639H20.9959V10.6647C20.9959 9.66491 20.3294 8.33185 18.6631 8.33185C16.7968 8.33185 7.66531 8.33185 2.99959 8.33185C2.33306 8.44293 1 8.99838 1 10.3314C1 11.6645 1 13.7752 1 14.6639Z" stroke="var(--menu-gray)" />
                                    <path d="M3.99939 14.9971C3.99939 15.9969 4.11223 17.6632 2.33306 17.6632C1 17.6632 1 15.8858 1 14.9971" stroke="var(--menu-gray)" />
                                    <path d="M17.9966 14.9971C17.9966 15.9969 17.8837 17.6632 19.6629 17.6632C21.1432 17.6632 20.9959 15.8858 20.9959 14.9971" stroke="var(--menu-gray)" />
                                </svg>
                                О гостинице
                            </Link>
                        </>
                    }

                    {user.role == 'AIRLINEADMIN' &&
                        <>
                            <Link to={'/relay'} className={`${classes.menu_items__elem} ${(id == 'relay' || id == undefined) && classes.menu_items__activeElem}`}>
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.5875 5.24748C16.2319 1.60309 18.835 0.0412008 20.3969 1.60309C21.9589 3.16496 20.3969 5.76811 16.7526 9.41251C18.3144 12.0156 20.3969 18.2632 18.835 19.825C16.7526 21.9077 11.5463 13.5775 11.5463 13.5775L9.98438 15.1394C10.1579 16.7013 10.0885 20.0333 8.42249 20.8663C6.75648 21.6993 5.64581 18.4367 5.29873 16.7013C3.5633 16.3542 0.300701 15.2435 1.1337 13.5775C1.96672 11.9115 5.29873 11.8421 6.86062 12.0156L8.42249 10.4538C8.42249 10.4538 0.0924504 5.24748 2.17496 3.16496C3.73685 1.60309 9.98438 3.68559 12.5875 5.24748Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Эстафета

                                {
                                    allCreatedRequests > 0 &&
                                    <div className={classes.countRequests}>
                                        {allCreatedRequests}
                                    </div>
                                }
                            </Link>
                            <Link to={'/reserve'} className={`${classes.menu_items__elem} ${id == 'reserve' && classes.menu_items__activeElem}`}>
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.32714 3.28667C1.42238 2.46286 1.92238 1.78286 2.7319 1.60381C3.99476 1.32429 6.44286 1 11 1C15.5571 1 18.0048 1.32429 19.2681 1.60381C20.0776 1.78286 20.5776 2.46286 20.6729 3.28667C20.8176 4.53238 21 6.58381 21 9C21 13.5143 18.6176 17.7381 14.6038 19.8038C13.2629 20.4943 11.9543 21 11 21C10.0457 21 8.73714 20.4938 7.39619 19.8038C3.38238 17.7381 1 13.5143 1 9C1 6.58381 1.18238 4.53238 1.32714 3.28667Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M3.92857 9.23704C4.45656 10.3876 5.04991 11.5071 5.70571 12.5899C5.95762 12.998 6.42143 13.1675 6.85381 13.0251C7.68095 12.7537 8.68619 12.1775 10.4457 11.5275C10.2886 12.4799 10.1757 13.4137 10.1071 14.0504C10.0595 14.4937 10.3724 14.8885 10.7743 14.7961C11.129 14.7147 11.9519 14.177 12.1905 14.0504C12.5071 13.8818 12.7381 13.5837 12.8857 13.2361C13.3424 12.1495 13.7445 11.0409 14.0905 9.91418C15.2919 9.42704 16.3571 9.1218 17.5405 8.56656C18.1167 8.29656 18.341 7.55037 17.9395 7.02704C17.361 6.27323 16.4238 5.36942 15.2176 5.29275C12.61 5.12656 9.80952 7.91751 7.54952 9.25894C7.54952 9.25894 6.67714 8.48561 5.70571 7.82037C5.56524 7.72418 5.39762 7.68656 5.23666 7.73227C5.06285 7.7818 4.46428 8.16561 4.18714 8.31323C3.87333 8.47989 3.77476 8.89704 3.92857 9.23704Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Резерв

                                {
                                    allCreatedReserves > 0 &&
                                    <div className={classes.countRequests}>
                                        {allCreatedReserves}
                                    </div>
                                }
                            </Link>
                            <Link to={'/hotels'} className={`${classes.menu_items__elem} ${id == 'hotels' && classes.menu_items__activeElem}`}>
                                <svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.33306 6.99878V2.99959C2.33306 2.33306 2.79963 1 4.66592 1C6.53221 1 13.8863 1 17.33 1C18.2187 1.11109 19.6629 1.66653 19.6629 3.66613C19.6629 5.55136 19.6629 6.99878 19.6629 6.99878M5.33245 6.66552C5.33245 6.13964 5.33245 5.33245 5.33245 4.99919C5.33245 4.42239 5.82674 3.99939 6.33225 3.99939C7.3987 3.99939 9.33164 3.99939 9.99817 3.99939C10.5666 3.99939 10.998 4.24151 10.998 4.99919C10.998 6.06564 10.998 6.55443 10.998 6.66552M11.3312 6.66552C11.3312 6.13964 11.3312 5.33245 11.3312 4.99919C11.3312 4.42239 11.8255 3.99939 12.331 3.99939C13.3975 3.99939 15.3304 3.99939 15.997 3.99939C16.5654 3.99939 16.9968 4.24151 16.9968 4.99919C16.9968 6.06564 16.9968 6.55443 16.9968 6.66552M1 14.6639H20.9959V10.6647C20.9959 9.66491 20.3294 8.33185 18.6631 8.33185C16.7968 8.33185 7.66531 8.33185 2.99959 8.33185C2.33306 8.44293 1 8.99838 1 10.3314C1 11.6645 1 13.7752 1 14.6639Z" stroke="var(--menu-gray)" />
                                    <path d="M3.99939 14.9971C3.99939 15.9969 4.11223 17.6632 2.33306 17.6632C1 17.6632 1 15.8858 1 14.9971" stroke="var(--menu-gray)" />
                                    <path d="M17.9966 14.9971C17.9966 15.9969 17.8837 17.6632 19.6629 17.6632C21.1432 17.6632 20.9959 15.8858 20.9959 14.9971" stroke="var(--menu-gray)" />
                                </svg>
                                Гостиницы
                            </Link>
                            <Link to={'/airlineCompany'} className={`${classes.menu_items__elem} ${(id == 'airlineCompany') && classes.menu_items__activeElem}`}>
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.21313 16.5501V16.4572C3.21313 14.7462 4.60019 13.3591 6.31122 13.3591H15.6891C17.4001 13.3591 18.7872 14.7462 18.7872 16.4572V16.5501" stroke="var(--menu-gray)" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10.9991 13.3591L11.0004 16.5503" stroke="var(--menu-gray)" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M15.5933 10.2205C15.3476 9.23002 14.7877 8.34354 13.9947 7.69545C13.1493 7.00444 12.091 6.62695 10.9991 6.62695C9.90723 6.62695 8.84891 7.00444 8.00347 7.69545C7.21056 8.34352 6.65066 9.23001 6.40491 10.2204" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10.999 6.62706C12.7996 6.62706 13.8125 5.61419 13.8125 3.81354C13.8125 2.01287 12.7996 1 10.999 1C9.1983 1 8.18542 2.01287 8.18542 3.81354C8.18542 5.61419 9.1983 6.62706 10.999 6.62706Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M3.21314 20.9763C4.62956 20.9763 5.42629 20.1796 5.42629 18.7632C5.42629 17.3467 4.62956 16.55 3.21314 16.55C1.79673 16.55 1 17.3467 1 18.7632C1 20.1796 1.79673 20.9763 3.21314 20.9763Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M11.0007 20.9763C12.4171 20.9763 13.2139 20.1796 13.2139 18.7632C13.2139 17.3467 12.4171 16.55 11.0007 16.55C9.58432 16.55 8.7876 17.3467 8.7876 18.7632C8.7876 20.1796 9.58432 20.9763 11.0007 20.9763Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M18.7869 20.9763C20.2032 20.9763 21 20.1796 21 18.7632C21 17.3467 20.2032 16.55 18.7869 16.55C17.3704 16.55 16.5736 17.3467 16.5736 18.7632C16.5736 20.1796 17.3704 20.9763 18.7869 20.9763Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Компания
                            </Link>
                            <Link to={'/airlineStaff'} className={`${classes.menu_items__elem} ${(id == 'airlineStaff') && classes.menu_items__activeElem}`}>
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8.35735 20.9038C7.7758 20.9645 7.19161 20.9966 6.60691 21C5.98311 21 5.83644 20.9547 5.33217 20.9038C4.6798 20.8371 4.18933 20.3038 4.13695 19.65L3.78124 15.2095C3.38886 15.1914 2.56031 15.1714 2.25365 15.1523C1.4908 15.1042 0.921287 14.4452 1.0089 13.6857C1.21161 11.9562 1.5886 10.2517 2.13412 8.59805C2.37745 7.86472 3.0103 7.3571 3.78076 7.29329C4.43266 7.23805 5.36121 7.19043 6.60691 7.19043C7.85212 7.19043 8.78116 7.23805 9.43257 7.29281C10.2021 7.35662 10.8354 7.86424 11.0787 8.59757C11.3396 9.38708 11.562 10.1888 11.7449 11" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M13.3811 13.381C13.4801 12.8852 13.6787 12.34 13.8525 11.9181C14.0444 11.4514 14.4463 11.1062 14.9477 11.0467C15.218 11.0151 15.4899 10.9996 15.762 11C16.0749 11 16.3482 11.0195 16.5763 11.0467C17.0777 11.1062 17.4796 11.4514 17.6715 11.9181C17.8453 12.34 18.0439 12.8848 18.1429 13.381" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M9.7016 4.09524C9.7016 4.91615 9.37551 5.70343 8.79504 6.2839C8.21458 6.86437 7.42731 7.19048 6.60642 7.19048C5.78552 7.19048 4.99825 6.86437 4.41779 6.2839C3.83733 5.70343 3.51123 4.91615 3.51123 4.09524C3.51123 3.27433 3.83733 2.48704 4.41779 1.90657C4.99825 1.3261 5.78552 1 6.60642 1C7.42731 1 8.21458 1.3261 8.79504 1.90657C9.37551 2.48704 9.7016 3.27433 9.7016 4.09524Z" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M10.6287 14.8809C10.6949 14.188 11.192 13.6494 11.8835 13.5661C12.6577 13.4723 13.893 13.3809 15.762 13.3809C17.6305 13.3809 18.8667 13.4723 19.6405 13.5661C20.3319 13.6494 20.829 14.188 20.8952 14.8809C20.95 15.4604 21 16.2451 21 17.1904C21 18.1356 20.95 18.9204 20.8952 19.4999C20.829 20.1928 20.3319 20.7313 19.6405 20.8147C18.8662 20.9085 17.631 20.9999 15.762 20.9999C13.8934 20.9999 12.6573 20.908 11.8835 20.8147C11.192 20.7313 10.6949 20.1928 10.6287 19.4999C10.5575 18.7321 10.5226 17.9614 10.524 17.1904C10.524 16.2451 10.574 15.4604 10.6287 14.8809Z" stroke="var(--menu-gray)" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                Сотрудники
                            </Link>
                            <Link to={'/airlineAbout'} className={`${classes.menu_items__elem} ${(id == 'airlineAbout') && classes.menu_items__activeElem}`}>
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.1337 1.22253C9.32231 1.81456 8.19128 3.02877 7.89409 5.30609C7.97435 6.30237 8.06129 7.28527 8.14971 8.23044L1.6966 11.8605C1.24501 12.1144 0.965515 12.5921 0.965515 13.1101V13.9764C0.965561 14.4427 1.40382 14.7848 1.85619 14.6716L8.64141 12.9753C8.89464 15.2297 9.08865 16.7072 9.08865 16.7072L6.81128 18.8861C6.43458 19.2467 6.22159 19.7456 6.22168 20.2671V20.5853C6.22168 20.9202 6.55727 21.1511 6.87009 21.0316L11 19.4509L15.1294 21.0316C15.4424 21.1516 15.7784 20.9205 15.7783 20.5853V20.2671C15.7784 19.7456 15.5654 19.2467 15.1887 18.8861L12.9113 16.7072C12.9113 16.7072 13.1053 15.2297 13.3586 12.9753L20.1438 14.6716C20.5962 14.7848 21.0344 14.4427 21.0345 13.9764V13.1101C21.0345 12.5921 20.755 12.1144 20.3034 11.8605L13.8507 8.23044C13.9396 7.28481 14.0261 6.30237 14.1064 5.30609C13.8087 3.02877 12.6777 1.81456 11.8668 1.22253C11.3521 0.841514 10.6489 0.841514 10.1342 1.22253H10.1337Z" stroke="var(--menu-gray)" strokeLinejoin="round" />
                                </svg>
                                О авиакомпании
                            </Link>
                        </>
                    }

                    {(user.role == 'SUPERADMIN' || user.role == 'DISPATCHERADMIN') &&
                        <Link to={'/relay'} className={`${classes.menu_items__elem} ${(id == 'relay' || id == undefined) && classes.menu_items__activeElem}`}>
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.5875 5.24748C16.2319 1.60309 18.835 0.0412008 20.3969 1.60309C21.9589 3.16496 20.3969 5.76811 16.7526 9.41251C18.3144 12.0156 20.3969 18.2632 18.835 19.825C16.7526 21.9077 11.5463 13.5775 11.5463 13.5775L9.98438 15.1394C10.1579 16.7013 10.0885 20.0333 8.42249 20.8663C6.75648 21.6993 5.64581 18.4367 5.29873 16.7013C3.5633 16.3542 0.300701 15.2435 1.1337 13.5775C1.96672 11.9115 5.29873 11.8421 6.86062 12.0156L8.42249 10.4538C8.42249 10.4538 0.0924504 5.24748 2.17496 3.16496C3.73685 1.60309 9.98438 3.68559 12.5875 5.24748Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Эстафета

                            {
                                allCreatedRequests > 0 &&
                                <div className={classes.countRequests}>
                                    {allCreatedRequests}
                                </div>
                            }
                        </Link>
                    }
                    {(user.role == 'SUPERADMIN' || user.role == 'DISPATCHERADMIN') &&
                        <Link to={'/reserve'} className={`${classes.menu_items__elem} ${id == 'reserve' && classes.menu_items__activeElem}`}>
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.32714 3.28667C1.42238 2.46286 1.92238 1.78286 2.7319 1.60381C3.99476 1.32429 6.44286 1 11 1C15.5571 1 18.0048 1.32429 19.2681 1.60381C20.0776 1.78286 20.5776 2.46286 20.6729 3.28667C20.8176 4.53238 21 6.58381 21 9C21 13.5143 18.6176 17.7381 14.6038 19.8038C13.2629 20.4943 11.9543 21 11 21C10.0457 21 8.73714 20.4938 7.39619 19.8038C3.38238 17.7381 1 13.5143 1 9C1 6.58381 1.18238 4.53238 1.32714 3.28667Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3.92857 9.23704C4.45656 10.3876 5.04991 11.5071 5.70571 12.5899C5.95762 12.998 6.42143 13.1675 6.85381 13.0251C7.68095 12.7537 8.68619 12.1775 10.4457 11.5275C10.2886 12.4799 10.1757 13.4137 10.1071 14.0504C10.0595 14.4937 10.3724 14.8885 10.7743 14.7961C11.129 14.7147 11.9519 14.177 12.1905 14.0504C12.5071 13.8818 12.7381 13.5837 12.8857 13.2361C13.3424 12.1495 13.7445 11.0409 14.0905 9.91418C15.2919 9.42704 16.3571 9.1218 17.5405 8.56656C18.1167 8.29656 18.341 7.55037 17.9395 7.02704C17.361 6.27323 16.4238 5.36942 15.2176 5.29275C12.61 5.12656 9.80952 7.91751 7.54952 9.25894C7.54952 9.25894 6.67714 8.48561 5.70571 7.82037C5.56524 7.72418 5.39762 7.68656 5.23666 7.73227C5.06285 7.7818 4.46428 8.16561 4.18714 8.31323C3.87333 8.47989 3.77476 8.89704 3.92857 9.23704Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Резерв

                            {
                                allCreatedReserves > 0 &&
                                <div className={classes.countRequests}>
                                    {allCreatedReserves}
                                </div>
                            }
                        </Link>
                    }
                    {(user.role == 'SUPERADMIN' || user.role == 'DISPATCHERADMIN') &&
                        <Link to={'/company'} className={`${classes.menu_items__elem} ${id == 'company' && classes.menu_items__activeElem}`}>
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.21313 16.5501V16.4572C3.21313 14.7462 4.60019 13.3591 6.31122 13.3591H15.6891C17.4001 13.3591 18.7872 14.7462 18.7872 16.4572V16.5501" stroke="var(--menu-gray)" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M10.9991 13.3591L11.0004 16.5503" stroke="var(--menu-gray)" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M15.5933 10.2205C15.3476 9.23002 14.7877 8.34354 13.9947 7.69545C13.1493 7.00444 12.091 6.62695 10.9991 6.62695C9.90723 6.62695 8.84891 7.00444 8.00347 7.69545C7.21056 8.34352 6.65066 9.23001 6.40491 10.2204" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M10.999 6.62706C12.7996 6.62706 13.8125 5.61419 13.8125 3.81354C13.8125 2.01287 12.7996 1 10.999 1C9.1983 1 8.18542 2.01287 8.18542 3.81354C8.18542 5.61419 9.1983 6.62706 10.999 6.62706Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3.21314 20.9763C4.62956 20.9763 5.42629 20.1796 5.42629 18.7632C5.42629 17.3467 4.62956 16.55 3.21314 16.55C1.79673 16.55 1 17.3467 1 18.7632C1 20.1796 1.79673 20.9763 3.21314 20.9763Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M11.0007 20.9763C12.4171 20.9763 13.2139 20.1796 13.2139 18.7632C13.2139 17.3467 12.4171 16.55 11.0007 16.55C9.58432 16.55 8.7876 17.3467 8.7876 18.7632C8.7876 20.1796 9.58432 20.9763 11.0007 20.9763Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M18.7869 20.9763C20.2032 20.9763 21 20.1796 21 18.7632C21 17.3467 20.2032 16.55 18.7869 16.55C17.3704 16.55 16.5736 17.3467 16.5736 18.7632C16.5736 20.1796 17.3704 20.9763 18.7869 20.9763Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Компания
                        </Link>
                    }
                    {(user.role == 'SUPERADMIN') &&
                        <Link to={'/hotels'} className={`${classes.menu_items__elem} ${id == 'hotels' && classes.menu_items__activeElem}`}>
                            <svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.33306 6.99878V2.99959C2.33306 2.33306 2.79963 1 4.66592 1C6.53221 1 13.8863 1 17.33 1C18.2187 1.11109 19.6629 1.66653 19.6629 3.66613C19.6629 5.55136 19.6629 6.99878 19.6629 6.99878M5.33245 6.66552C5.33245 6.13964 5.33245 5.33245 5.33245 4.99919C5.33245 4.42239 5.82674 3.99939 6.33225 3.99939C7.3987 3.99939 9.33164 3.99939 9.99817 3.99939C10.5666 3.99939 10.998 4.24151 10.998 4.99919C10.998 6.06564 10.998 6.55443 10.998 6.66552M11.3312 6.66552C11.3312 6.13964 11.3312 5.33245 11.3312 4.99919C11.3312 4.42239 11.8255 3.99939 12.331 3.99939C13.3975 3.99939 15.3304 3.99939 15.997 3.99939C16.5654 3.99939 16.9968 4.24151 16.9968 4.99919C16.9968 6.06564 16.9968 6.55443 16.9968 6.66552M1 14.6639H20.9959V10.6647C20.9959 9.66491 20.3294 8.33185 18.6631 8.33185C16.7968 8.33185 7.66531 8.33185 2.99959 8.33185C2.33306 8.44293 1 8.99838 1 10.3314C1 11.6645 1 13.7752 1 14.6639Z" stroke="var(--menu-gray)" />
                                <path d="M3.99939 14.9971C3.99939 15.9969 4.11223 17.6632 2.33306 17.6632C1 17.6632 1 15.8858 1 14.9971" stroke="var(--menu-gray)" />
                                <path d="M17.9966 14.9971C17.9966 15.9969 17.8837 17.6632 19.6629 17.6632C21.1432 17.6632 20.9959 15.8858 20.9959 14.9971" stroke="var(--menu-gray)" />
                            </svg>
                            Гостиницы
                        </Link>
                    }
                    {(user.role == 'SUPERADMIN' || user.role == 'DISPATCHERADMIN') &&
                        <Link to={'/airlines'} className={`${classes.menu_items__elem} ${id == 'airlines' && classes.menu_items__activeElem}`}>
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.1337 1.22253C9.32231 1.81456 8.19128 3.02877 7.89409 5.30609C7.97435 6.30237 8.06129 7.28527 8.14971 8.23044L1.6966 11.8605C1.24501 12.1144 0.965515 12.5921 0.965515 13.1101V13.9764C0.965561 14.4427 1.40382 14.7848 1.85619 14.6716L8.64141 12.9753C8.89464 15.2297 9.08865 16.7072 9.08865 16.7072L6.81128 18.8861C6.43458 19.2467 6.22159 19.7456 6.22168 20.2671V20.5853C6.22168 20.9202 6.55727 21.1511 6.87009 21.0316L11 19.4509L15.1294 21.0316C15.4424 21.1516 15.7784 20.9205 15.7783 20.5853V20.2671C15.7784 19.7456 15.5654 19.2467 15.1887 18.8861L12.9113 16.7072C12.9113 16.7072 13.1053 15.2297 13.3586 12.9753L20.1438 14.6716C20.5962 14.7848 21.0344 14.4427 21.0345 13.9764V13.1101C21.0345 12.5921 20.755 12.1144 20.3034 11.8605L13.8507 8.23044C13.9396 7.28481 14.0261 6.30237 14.1064 5.30609C13.8087 3.02877 12.6777 1.81456 11.8668 1.22253C11.3521 0.841514 10.6489 0.841514 10.1342 1.22253H10.1337Z" stroke="var(--menu-gray)" strokeLinejoin="round" />
                            </svg>
                            Авиакомпании
                        </Link>
                    }
                    {(user.role == 'SUPERADMIN' || user.role == 'DISPATCHERADMIN') &&
                        <Link to={'/reports'} className={`${classes.menu_items__elem} ${id == 'reports' && classes.menu_items__activeElem}`}>
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.8163 7.1074C17.6555 6.65823 17.1064 5.47252 15.4018 3.80144C13.5955 2.03044 12.3447 1.53177 11.9552 1.40985C11.1787 1.38604 10.4019 1.37443 9.625 1.37502C6.754 1.37502 4.78225 1.52169 3.553 1.6624C2.54421 1.7779 1.78842 2.53461 1.6775 3.54386C1.53083 4.86844 1.375 7.09181 1.375 10.5417C1.375 13.9916 1.53129 16.2149 1.6775 17.5395C1.78842 18.5488 2.54421 19.3055 3.553 19.421C4.42292 19.5204 5.66454 19.6226 7.33333 19.6744" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M17.8228 7.31417C16.8663 7.45671 15.1457 7.34717 13.8399 7.22663C13.3422 7.18219 12.8757 6.9648 12.5216 6.61221C12.1675 6.25962 11.9482 5.79411 11.9016 5.29658C11.7788 4.01233 11.6697 2.333 11.8191 1.40625" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M18.7916 15.7017C18.7916 15.7017 18.5748 14.7355 17.2736 13.4347C15.9729 12.1335 15.0067 11.9167 15.0067 11.9167" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M4.58337 5.95825L6.41671 7.79159L8.70837 4.58325" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M4.58337 11L6.41671 12.8333L8.70837 9.625" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20.0131 14.4798C20.6795 13.8138 20.9344 12.8403 20.377 12.0804C20.1308 11.7477 19.8596 11.4342 19.5658 11.1427C19.2266 10.8035 18.9104 10.5386 18.6276 10.3314C17.8681 9.77409 16.8946 10.0289 16.2282 10.6949L10.5724 16.3507C10.3235 16.6 10.153 16.9158 10.1237 17.2674C10.0838 17.7445 10.0545 18.5553 10.1315 19.7552C10.1452 19.9687 10.2362 20.1698 10.3874 20.3211C10.5386 20.4723 10.7398 20.5633 10.9533 20.577C12.1527 20.654 12.964 20.6247 13.4411 20.5843C13.7922 20.555 14.1084 20.385 14.3578 20.1352L20.0131 14.4798Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Отчеты
                        </Link>
                    }
                </div>

                <a className={`${classes.menu_items__elem}`} style={{ position: "absolute", bottom: "25px" }} onClick={handleClick}>
                    Выход из учетной записи
                </a>
            </div>
        </>
    );
}

export default MenuDispetcher;