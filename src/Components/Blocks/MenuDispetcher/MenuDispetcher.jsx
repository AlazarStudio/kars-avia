import React, { useEffect, useState } from "react";
import classes from './MenuDispetcher.module.css';
import { Link, useNavigate } from "react-router-dom";
import { decodeJWT, getCookie } from "../../../../graphQL_requests";
import { Tab, TabList } from "react-tabs";

function MenuDispetcher({ children, id, hotelID, ...props }) {
    const token = getCookie('token');

    const [user, setUser] = useState('');
  
    useEffect(() => {
      if (token) {
        setUser(decodeJWT(token));
      }
    }, [token]);

    const navigate = useNavigate()

    const handleClick = () => {
        let result = confirm("Вы уверены что хотите выйти?");
        if (result) {
            document.cookie = "token=; Max-Age=0; Path=/;";
            navigate('/')
            window.location.reload()
        }
    }
    return (
        <>
            <div className={classes.menu}>
                <Link to={'/'} className={classes.menu_logo}><img src="/kars-avia-mainLogo.png" alt="" /></Link>
                <div className={classes.menu_items}>

                    {user.role == 'HOTELADMIN' &&
                        <>
                            <Link to={'/hotelChess'} className={`${classes.menu_items__elem} ${(id == 'hotelChess' || id == undefined) && classes.menu_items__activeElem}`}>Шахматка</Link>
                            <Link to={'/hotelTarifs'} className={`${classes.menu_items__elem} ${(id == 'hotelTarifs') && classes.menu_items__activeElem}`}>Тарифы</Link>
                            <Link to={'/hotelRooms'} className={`${classes.menu_items__elem} ${(id == 'hotelRooms') && classes.menu_items__activeElem}`}>Номерной фонд</Link>
                            <Link to={'/hotelCompany'} className={`${classes.menu_items__elem} ${(id == 'hotelCompany') && classes.menu_items__activeElem}`}>Компания</Link>
                            <Link to={'/hotelAbout'} className={`${classes.menu_items__elem} ${(id == 'hotelAbout' ) && classes.menu_items__activeElem}`}>О гостинице</Link>
                        </>
                    }

                    {user.role == 'SUPERADMIN' &&
                        <Link to={'/relay'} className={`${classes.menu_items__elem} ${(id == 'relay' || id == undefined) && classes.menu_items__activeElem}`}>
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.5875 5.24748C16.2319 1.60309 18.835 0.0412008 20.3969 1.60309C21.9589 3.16496 20.3969 5.76811 16.7526 9.41251C18.3144 12.0156 20.3969 18.2632 18.835 19.825C16.7526 21.9077 11.5463 13.5775 11.5463 13.5775L9.98438 15.1394C10.1579 16.7013 10.0885 20.0333 8.42249 20.8663C6.75648 21.6993 5.64581 18.4367 5.29873 16.7013C3.5633 16.3542 0.300701 15.2435 1.1337 13.5775C1.96672 11.9115 5.29873 11.8421 6.86062 12.0156L8.42249 10.4538C8.42249 10.4538 0.0924504 5.24748 2.17496 3.16496C3.73685 1.60309 9.98438 3.68559 12.5875 5.24748Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Эстафета
                        </Link>
                    }
                    {user.role == 'SUPERADMIN' &&
                        <Link to={'/reserve'} className={`${classes.menu_items__elem} ${id == 'reserve' && classes.menu_items__activeElem}`}>
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.32714 3.28667C1.42238 2.46286 1.92238 1.78286 2.7319 1.60381C3.99476 1.32429 6.44286 1 11 1C15.5571 1 18.0048 1.32429 19.2681 1.60381C20.0776 1.78286 20.5776 2.46286 20.6729 3.28667C20.8176 4.53238 21 6.58381 21 9C21 13.5143 18.6176 17.7381 14.6038 19.8038C13.2629 20.4943 11.9543 21 11 21C10.0457 21 8.73714 20.4938 7.39619 19.8038C3.38238 17.7381 1 13.5143 1 9C1 6.58381 1.18238 4.53238 1.32714 3.28667Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3.92857 9.23704C4.45656 10.3876 5.04991 11.5071 5.70571 12.5899C5.95762 12.998 6.42143 13.1675 6.85381 13.0251C7.68095 12.7537 8.68619 12.1775 10.4457 11.5275C10.2886 12.4799 10.1757 13.4137 10.1071 14.0504C10.0595 14.4937 10.3724 14.8885 10.7743 14.7961C11.129 14.7147 11.9519 14.177 12.1905 14.0504C12.5071 13.8818 12.7381 13.5837 12.8857 13.2361C13.3424 12.1495 13.7445 11.0409 14.0905 9.91418C15.2919 9.42704 16.3571 9.1218 17.5405 8.56656C18.1167 8.29656 18.341 7.55037 17.9395 7.02704C17.361 6.27323 16.4238 5.36942 15.2176 5.29275C12.61 5.12656 9.80952 7.91751 7.54952 9.25894C7.54952 9.25894 6.67714 8.48561 5.70571 7.82037C5.56524 7.72418 5.39762 7.68656 5.23666 7.73227C5.06285 7.7818 4.46428 8.16561 4.18714 8.31323C3.87333 8.47989 3.77476 8.89704 3.92857 9.23704Z" stroke="var(--menu-gray)" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Резерв
                        </Link>
                    }
                    {user.role == 'SUPERADMIN' &&
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
                    {user.role == 'SUPERADMIN' &&
                        <Link to={'/airlines'} className={`${classes.menu_items__elem} ${id == 'airlines' && classes.menu_items__activeElem}`}>
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.1337 1.22253C9.32231 1.81456 8.19128 3.02877 7.89409 5.30609C7.97435 6.30237 8.06129 7.28527 8.14971 8.23044L1.6966 11.8605C1.24501 12.1144 0.965515 12.5921 0.965515 13.1101V13.9764C0.965561 14.4427 1.40382 14.7848 1.85619 14.6716L8.64141 12.9753C8.89464 15.2297 9.08865 16.7072 9.08865 16.7072L6.81128 18.8861C6.43458 19.2467 6.22159 19.7456 6.22168 20.2671V20.5853C6.22168 20.9202 6.55727 21.1511 6.87009 21.0316L11 19.4509L15.1294 21.0316C15.4424 21.1516 15.7784 20.9205 15.7783 20.5853V20.2671C15.7784 19.7456 15.5654 19.2467 15.1887 18.8861L12.9113 16.7072C12.9113 16.7072 13.1053 15.2297 13.3586 12.9753L20.1438 14.6716C20.5962 14.7848 21.0344 14.4427 21.0345 13.9764V13.1101C21.0345 12.5921 20.755 12.1144 20.3034 11.8605L13.8507 8.23044C13.9396 7.28481 14.0261 6.30237 14.1064 5.30609C13.8087 3.02877 12.6777 1.81456 11.8668 1.22253C11.3521 0.841514 10.6489 0.841514 10.1342 1.22253H10.1337Z" stroke="var(--menu-gray)" strokeLinejoin="round" />
                            </svg>
                            Авиакомпании
                        </Link>
                    }
                    {user.role == 'SUPERADMIN' &&
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