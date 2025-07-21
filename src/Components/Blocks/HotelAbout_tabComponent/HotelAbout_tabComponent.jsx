import React, { useEffect, useMemo, useState } from "react";
import classes from "./HotelAbout_tabComponent.module.css";
import { useQuery, useSubscription } from "@apollo/client";
import Button from "../../Standart/Button/Button.jsx";
import HotelAboutRoomBlock from "../HotelAboutRoomBlock/HotelAboutRoomBlock.jsx";
import {
  server,
  getCookie,
  GET_HOTEL,
  decodeJWT,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
} from "../../../../graphQL_requests.js";
import { roles } from "../../../roles.js";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import MUILoader from "../MUILoader/MUILoader.jsx";
import { useWindowSize } from "../../../hooks/useWindowSize.jsx";
import { useLocalStorage } from "../../../hooks/useLocalStorage.jsx";
import TextEditorOutput from "../TextEditorOutput/TextEditorOutput.jsx";

function HotelAbout_tabComponent({ id }) {
  // const [userRole, setUserRole] = useState();
  const token = getCookie("token");
  const user = decodeJWT(token);

  const navigate = useNavigate();

  const [displayInfo, setDisplayInfo] = useState("generalInfo2");
  const [swiper, setSwiper] = useState();
  const [activeIndex, setActiveIndex] = useState(0);

  const [menuOpen] = useLocalStorage("menuOpen", true);
  const { width } = useWindowSize();

  // useEffect(() => {
  //   setUserRole(decodeJWT(token).role);
  // }, [token]);

  const { loading, error, data, refetch } = useQuery(GET_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { hotelId: id },
    // fetchPolicy: "cache-and-network",
  });
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_HOTELS_UPDATE_SUBSCRIPTION
  );

  // let infoCities = useQuery(GET_CITIES);
  // const [cities, setCities] = useState([]);

  // useEffect(() => {
  //   if (infoCities.data) {
  //     const mappedCities =
  //       infoCities.data?.citys.map((item) => ({
  //         label: `${item.city}, ${item.region}`,
  //         value: item.city,
  //       })) || [];
  //     setCities(mappedCities);
  //   }
  // }, [infoCities]);

  const [hotel, setHotel] = useState(null);
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    if (data) {
      setHotel(data.hotel);
    }
  }, [data]);

  useEffect(() => {
    if (dataSubscriptionUpd) refetch();
  }, [dataSubscriptionUpd]);

  const rooms = useMemo(
    () => (hotel?.type !== "apartment" ? hotel?.roomKind : hotel?.rooms),
    [hotel]
  );
  return (
    <>
      {loading && <MUILoader fullHeight={"70vh"} />}
      {error && <p>Error: {error.message}</p>}

      {!loading && !error && hotel && (
        // <div className={classes.hotelAbout} style={user?.role === roles.airlineAdmin ? {height:'calc(100vh - 130px)'} : {}}>
        <div
          className={classes.hotelAbout}
          style={
            user?.hotelId || user?.airlineId
              ? { height: "calc(100vh - 130px)" }
              : {}
          }
        >
          <div className={classes.column}>
            <div className={classes.hotelAbout_info__filters}>
              <button
                className={
                  displayInfo == "generalInfo2" ? classes.activeButton : null
                }
                onClick={() => {
                  setDisplayInfo("generalInfo2");
                }}
              >
                <img src="/houseIcon.png" alt="" /> Общая информация
              </button>

              <button
                className={displayInfo == "rooms" ? classes.activeButton : null}
                onClick={() => {
                  setDisplayInfo("rooms");
                }}
              >
                <img src="/roomsIcon.png" alt="" /> Номера
              </button>
            </div>
          </div>

          <div
            className={
              user?.hotelId || user?.airlineId
                ? classes.hotelAbout_info__hotel
                : classes.hotelAbout_info
            }
          >
            {displayInfo == "generalInfo2" ? (
              <div className={classes.hotelAboutWrapper}>
                <div className={classes.hotelAboutItemWrapper}>
                  <div className={classes.hotelAboutTextWrapper}>
                    <div className={classes.hotelAboutTitle}>
                      <img
                        src={
                          hotel.images.length !== 0
                            ? `${server}${hotel.images[0]}`
                            : "/no-avatar.png"
                        }
                        alt={hotel.name}
                      />
                      <p className={classes.hotelAbout_info_item}>
                        {hotel?.name}
                      </p>
                    </div>
                    <div className={classes.hotelAboutText}>
                      <div className={classes.hotelAbout_info_item}>
                        <p>Мощность</p>{" "}
                        <span className="blueText">{hotel?.capacity}</span>
                      </div>
                      <div className={classes.hotelAbout_info_item}>
                        <p>Рейтинг</p>{" "}
                        <div>
                          {hotel?.stars} <img src="/star.png" alt="" />
                        </div>
                      </div>
                      <div className={classes.hotelAbout_info_item}>
                        <p>Звездность</p>{" "}
                        <div>
                          {hotel?.usStars} <img src="/star.png" alt="" />
                        </div>
                      </div>
                      <div className={classes.hotelAbout_info_item}>
                        <p>До аэропорта</p>{" "}
                        <span className="blueText">
                          {hotel?.airportDistance} мин
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* <div className={classes.hotelAboutImages}> */}
                  <div className={classes.sliderWrapper}>
                    {hotel?.gallery.length > 2 ? (
                      <div className={classes.sliderButtonsWrapper}>
                        <img
                          src="/prevSlider.png"
                          alt=""
                          onClick={() => swiper.slidePrev()}
                          style={{
                            opacity: activeIndex === 0 ? 0.5 : 1,
                            cursor: activeIndex === 0 ? "auto" : "pointer",
                            userSelect: "none",
                          }}
                        />
                        <img
                          src="/prevSlider.png"
                          alt=""
                          onClick={() => swiper.slideNext()}
                          style={{
                            opacity:
                              activeIndex === hotel?.gallery.length - 2
                                ? 0.5
                                : 1,
                            cursor:
                              activeIndex === hotel?.gallery.length - 2
                                ? "auto"
                                : "pointer",
                            userSelect: "none",
                          }}
                        />
                      </div>
                    ) : null}
                    <Swiper
                      className={classes.sliderBox}
                      spaceBetween={20}
                      slidesPerView={hotel?.gallery.length !== 0 ? 2 : 1}
                      direction="horizontal"
                      // pagination={{ clickable: true }}
                      onSwiper={setSwiper}
                      onSlideChange={(swiper) =>
                        setActiveIndex(swiper.realIndex)
                      }
                      modules={[Autoplay]}
                    >
                      {hotel?.gallery.length !== 0 ? (
                        hotel?.gallery?.map((img, index) => (
                          <SwiperSlide
                            key={index}
                            className={classes.swiperSlide}
                          >
                            {/* <div className={classes.hotelAboutImage}> */}
                            <img src={`${server}${img}`} alt="" />
                            {/* </div> */}
                          </SwiperSlide>
                        ))
                      ) : (
                        <SwiperSlide>
                          <div
                            style={{
                              height: "100%",
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <p className={classes.hotelText}>
                              В галерее нет изображений
                            </p>
                          </div>
                        </SwiperSlide>
                      )}
                    </Swiper>
                  </div>
                  {/* </div> */}
                </div>
                <div className={classes.hotelAboutItemWrapper}>
                  <div
                    className={`${classes.hotelAboutDescription}`}
                    // dangerouslySetInnerHTML={{
                    //   __html: hotel.information?.description,
                    // }}
                  >
                    <TextEditorOutput
                      description={hotel.information?.description}
                    />
                  </div>
                  <div className={classes.hotelAboutMoreInfo}>
                    <div className={classes.scheduleWrapper}>
                      <p
                        className={classes.hotelText}
                        style={{ fontWeight: "700" }}
                      >
                        Расписание
                      </p>
                      <div className={classes.schedule}>
                        <p className={classes.hotelText}>
                          Завтрак с <span>{hotel.breakfast?.start}</span> до{" "}
                          <span>{hotel.breakfast?.end}</span>
                        </p>
                        <p className={classes.hotelText}>
                          Обед с <span>{hotel.lunch?.start}</span> до{" "}
                          <span>{hotel.lunch?.end}</span>
                        </p>
                        <p className={classes.hotelText}>
                          Ужин с <span>{hotel.dinner?.start}</span> до{" "}
                          <span>{hotel.dinner?.end}</span>
                        </p>
                      </div>
                    </div>
                    <div
                      className={classes.contactsWrapper}
                      style={{ width: "fit-content" }}
                    >
                      <div className={classes.scheduleWrapper}>
                        <div className={classes.contactItem}>
                          <p
                            className={classes.hotelText}
                            style={{ fontWeight: "700" }}
                          >
                            Контакты
                          </p>
                          <div className={classes.hotelAbout_info_item}>
                            <div className={classes.imgWrapper}>
                              <img src="/mail.png" alt="" />{" "}
                              booking@kars-avia.ru
                            </div>
                          </div>
                          <div className={classes.hotelAbout_info_item}>
                            <div className={classes.imgWrapper}>
                              <img src="/mail.png" alt="" /> booking@aniaero.ru
                            </div>
                          </div>
                          <div className={classes.hotelAbout_info_item}>
                            <div className={classes.imgWrapper}>
                              <img src="/phone.png" alt="" /> 8 (800) 550-04-88
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={classes.scheduleWrapper}>
                        <div className={classes.contactItem}>
                          <p
                            className={classes.hotelText}
                            style={{ fontWeight: "700" }}
                          >
                            Адрес
                          </p>
                          <div
                            className={classes.hotelAbout_info_item}
                            style={{ textAlign: "center" }}
                          >
                            {hotel.information?.address},{" "}
                            {hotel.information?.city}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={
                  user?.role === roles.airlineAdmin
                    ? classes.hotelAbout_rooms_block__hotel
                    : classes.hotelAbout_rooms_block
                }
              >
                <div
                  className={`${classes.rooms_wrapper} ${
                    menuOpen && width <= 1584 ? classes.fb30 : ""
                  }`}
                >
                  {rooms.map((room) => (
                    <HotelAboutRoomBlock key={room.id} user={user} {...room} />
                  ))}
                  {/* {console.log(hotel)} */}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default HotelAbout_tabComponent;

// import React, { useEffect, useRef, useState } from "react";
// import classes from "./HotelAbout_tabComponent.module.css";
// import { useQuery, useMutation, useSubscription } from "@apollo/client";
// import Button from "../../Standart/Button/Button.jsx";
// import HotelAboutRoomBlock from "../HotelAboutRoomBlock/HotelAboutRoomBlock.jsx";
// import {
//   server,
//   getCookie,
//   GET_HOTEL,
//   UPDATE_HOTEL,
//   decodeJWT,
//   DELETE_HOTEL,
//   GET_HOTEL_LOGS,
//   GET_HOTELS_UPDATE_SUBSCRIPTION,
//   GET_CITIES,
// } from "../../../../graphQL_requests.js";
// import { fullNotifyTime, notifyTime, roles } from "../../../roles.js";
// import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
// import { useNavigate } from "react-router-dom";
// import Logs from "../LogsHistory/Logs.jsx";
// import MUILoader from "../MUILoader/MUILoader.jsx";
// import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
// import Notification from "../../Notification/Notification.jsx";

// function HotelAbout_tabComponent({ id }) {
//   const [userRole, setUserRole] = useState();
//   const token = getCookie("token");
//   const user = decodeJWT(token);

//   const navigate = useNavigate();

//   const [displayInfo, setDisplayInfo] = useState("generalInfo");
//   const [showLogsSidebar, setShowLogsSidebar] = useState(false);
//   const [menuOpen, setMenuOpen] = useState(() => {
//     return JSON.parse(localStorage.getItem("menuOpen")) ?? true;
//   });
//   const [width, setWindowWidth] = useState(window.innerWidth);

//   useEffect(() => {
//     const updateState = () => {
//       setMenuOpen(JSON.parse(localStorage.getItem("menuOpen")));
//     };

//     // Отслеживание изменений localStorage в других вкладках
//     window.addEventListener("storage", updateState);

//     // Перехват изменений в текущей вкладке
//     const originalSetItem = localStorage.setItem;
//     localStorage.setItem = function (key, value) {
//       originalSetItem.apply(this, arguments);
//       if (key === "menuOpen") {
//         updateState(); // Обновляем состояние
//       }
//     };

//     return () => {
//       window.removeEventListener("storage", updateState);
//       localStorage.setItem = originalSetItem; // Возвращаем исходный метод
//     };
//   }, []);
//   // console.log(menuOpen);

//   useEffect(() => {
//     const handleResize = () => setWindowWidth(window.innerWidth);
//     window.addEventListener("resize", handleResize);

//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   const toggleLogsSidebar = () => setShowLogsSidebar(!showLogsSidebar);

//   useEffect(() => {
//     setUserRole(decodeJWT(token).role);
//   }, [token]);

//   const { loading, error, data, refetch } = useQuery(GET_HOTEL, {
//     variables: { hotelId: id },
//   });
//   const { data: dataSubscriptionUpd } = useSubscription(
//     GET_HOTELS_UPDATE_SUBSCRIPTION
//   );

//   let infoCities = useQuery(GET_CITIES);
//   const [cities, setCities] = useState([]);

//   useEffect(() => {
//     if (infoCities.data) {
//       const mappedCities =
//         infoCities.data?.citys.map((item) => ({
//           label: `${item.city}, ${item.region}`,
//           value: item.city,
//         })) || [];
//       setCities(mappedCities);
//     }
//   }, [infoCities]);

//   const [hotel, setHotel] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [newImage, setNewImage] = useState(null);

//   const [updateHotel] = useMutation(UPDATE_HOTEL, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Apollo-Require-Preflight": "true",
//       },
//     },
//   });

//   const [deleteHotel] = useMutation(DELETE_HOTEL, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   const [showDelete, setShowDelete] = useState(false);

//   useEffect(() => {
//     if (data) {
//       setHotel(data.hotel);
//     }
//     if (dataSubscriptionUpd) refetch();
//   }, [data, dataSubscriptionUpd, refetch]);

//   const [isLoading, setIsLoading] = useState(false);
//   const [notifications, setNotifications] = useState([]);

//   const addNotification = (text, status) => {
//     const id = Date.now(); // Уникальный ID
//     setNotifications((prev) => [...prev, { id, text, status }]);

//     setTimeout(() => {
//       setNotifications((prev) => prev.filter((n) => n.id !== id));
//     }, fullNotifyTime);
//   };

//   const handleEditClick = async () => {
//     if (isEditing) {
//       setIsLoading(true);
//       try {
//         await updateHotel({
//           variables: {
//             updateHotelId: hotel.id,
//             input: {
//               name: hotel.name,
//               capacity: parseInt(hotel.capacity),
//               stars: hotel.stars,
//               usStars: hotel.usStars,
//               airportDistance: hotel.airportDistance,
//               information: {
//                 country: hotel.information?.country,
//                 city: hotel.information?.city,
//                 address: hotel.information?.address,
//                 bank: hotel.information?.bank,
//                 bik: hotel.information?.bik,
//                 email: hotel.information?.email,
//                 index: hotel.information?.index,
//                 inn: hotel.information?.inn,
//                 number: hotel.information?.number,
//                 link: hotel.information?.link,
//                 description: hotel.information?.description,
//                 ogrn: hotel.information?.ogrn,
//                 rs: hotel.information?.rs,
//               },
//               breakfast: {
//                 start: hotel.breakfast.start,
//                 end: hotel.breakfast.end,
//               },
//               lunch: {
//                 start: hotel.lunch.start,
//                 end: hotel.lunch.end,
//               },
//               dinner: {
//                 start: hotel.dinner.start,
//                 end: hotel.dinner.end,
//               },
//             },
//             images: newImage ? [newImage] : null,
//           },
//         });
//         addNotification("Редактирование гостиницы прошло успешно.", "success");
//         // alert('Данные успешно сохранены');
//       } catch (err) {
//         console.error("Произошла ошибка при сохранении данных", err);
//       } finally {
//         setIsLoading(false);
//         // addNotification("Редактирование гостиницы прошло успешно.", "success");
//       }
//     }
//     setIsEditing(!isEditing);
//   };

//   const fileInputRef = useRef(null);

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     const maxSizeInBytes = 8 * 1024 * 1024; // 8 MB
//     if (file.size > maxSizeInBytes) {
//       alert("Размер файла не должен превышать 8 МБ!");
//       setHotel((prevState) => ({
//         ...prevState,
//         images: [`${data.hotel.images[0]}`],
//       }));
//       if (fileInputRef.current) {
//         fileInputRef.current.value = null; // Сброс значения в DOM-элементе
//       }
//       return;
//     }

//     if (file) {
//       setNewImage(file); // Сохраняем объект файла
//       const imageUrl = URL.createObjectURL(file); // Создаем URL для отображения
//       setHotel((prevState) => ({
//         ...prevState,
//         images: [imageUrl], // Обновляем URL изображения для отображения
//       }));
//     }
//   };

//   // console.log(hotel);

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setHotel((prevHotel) => {
//       // Проверяем, обновляется ли поле в `information`
//       if (Object.keys(prevHotel.information || {}).includes(name)) {
//         return {
//           ...prevHotel,
//           information: {
//             ...prevHotel.information,
//             [name]: value, // Обновляем только нужное поле в `information`
//           },
//         };
//       }
//       // Проверяем, начинается ли name с "breakfast", "lunch" или "dinner"
//       if (name.startsWith("breakfast")) {
//         return {
//           ...prevHotel,
//           breakfast: {
//             ...prevHotel.breakfast,
//             [name.replace("breakfast", "").toLowerCase()]: value,
//           },
//         };
//       } else if (name.startsWith("lunch")) {
//         return {
//           ...prevHotel,
//           lunch: {
//             ...prevHotel.lunch,
//             [name.replace("lunch", "").toLowerCase()]: value,
//           },
//         };
//       } else if (name.startsWith("dinner")) {
//         return {
//           ...prevHotel,
//           dinner: {
//             ...prevHotel.dinner,
//             [name.replace("dinner", "").toLowerCase()]: value,
//           },
//         };
//       } else {
//         // Для остальных полей
//         return {
//           ...prevHotel,
//           [name]: value,
//         };
//       }
//     });
//   };

//   const openDeleteComponent = () => {
//     setShowDelete(true);
//   };

//   const closeDeleteComponent = () => {
//     setShowDelete(false);
//   };

//   const handleDeleteHotel = async () => {
//     try {
//       await deleteHotel({
//         variables: {
//           deleteHotelId: id,
//         },
//       });
//       setShowDelete(false);
//       // Handle post-deletion logic (e.g., redirect or notification)
//       navigate("/hotels");
//     } catch (err) {
//       console.error("Ошибка при удалении гостиницы", err);
//     }
//   };

//   const renderField = ({ label, value, isStars }) => {
//     if (isStars) {
//       return (
//         <div className={classes.hotelAbout_info_item}>
//           <label style={{ flexBasis: "50%" }}>{label}</label>
//           <div className={classes.starsWrapper} style={{ width: "400px" }}>
//             {Array.from({ length: 5 }, (_, index) => (
//               <img
//                 key={index}
//                 src={index < value ? "/star.png" : "/op_star.png"}
//                 className={classes.star}
//               />
//             ))}
//           </div>
//         </div>
//       );
//     }
//     return (
//       <div className={classes.hotelAbout_info_item}>
//         <label style={{ flexBasis: "50%" }}>{label}</label>
//         <div
//           className={classes.hotelAbout_info_value}
//           style={{ width: "400px" }}
//         >
//           {value || " "}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <>
//       {(loading || isLoading) && <MUILoader fullHeight={"70vh"} />}
//       {error && <p>Error: {error.message}</p>}

//       {!loading && !isLoading && !error && hotel && (
//         // <div className={classes.hotelAbout} style={user?.role === roles.airlineAdmin ? {height:'calc(100vh - 130px)'} : {}}>
//         <div
//           className={classes.hotelAbout}
//           style={
//             user?.hotelId || user?.airlineId
//               ? { height: "calc(100vh - 130px)" }
//               : {}
//           }
//         >
//           <div className={classes.column}>
//             <div className={classes.hotelAbout_top}>
//               <div className={classes.hotelAbout_top_complete}>
//                 <div className={classes.hotelAbout_top_img}>
//                   <img
//                     src={
//                       newImage
//                         ? URL.createObjectURL(newImage)
//                         : hotel.images.length !== 0
//                         ? `${server}${hotel.images[0]}`
//                         : "/no-avatar.png"
//                     }
//                     alt={hotel.name}
//                   />
//                 </div>
//                 <div className={classes.hotelAbout_top_title}>
//                   <div className={classes.hotelAbout_top_title_name}>
//                     {hotel.name}
//                   </div>
//                   <div className={classes.hotelAbout_top_title_desc}>
//                     {hotel.information?.city && hotel.information?.city && (
//                       <>
//                         <img src="/map.png" alt="" />
//                         {hotel.information?.city}, {hotel.information?.address}
//                       </>
//                     )}
//                     {hotel.information?.link && (
//                       <>
//                         <img src="/web.png" alt="" />
//                         <a
//                           href={`${
//                             /^(https?:\/\/)/.test(hotel.link)
//                               ? hotel.link
//                               : "https://" + hotel.link
//                           }`}
//                           target="_blank"
//                         >
//                           {hotel.link}
//                         </a>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//               <div className={classes.hotelAbout_top_button}>
//                 {(user?.role == roles.superAdmin ||
//                   user?.role == roles.hotelAdmin ||
//                   user?.role == roles.dispatcerAdmin) && (
//                   <>
//                     {/* <Button onClick={toggleLogsSidebar}>История</Button> */}
//                     <div className={classes.hotelAbout_info__filters}>
//                       <button onClick={toggleLogsSidebar}>История</button>
//                     </div>
//                     <Button onClick={handleEditClick}>
//                       {isEditing ? "Сохранить" : "Редактировать"}
//                     </Button>
//                   </>
//                 )}
//               </div>
//             </div>
//             <div className={classes.hotelAbout_info__filters}>
//               <button
//                 className={
//                   displayInfo == "generalInfo" ? classes.activeButton : null
//                 }
//                 onClick={() => {
//                   setDisplayInfo("generalInfo");
//                 }}
//               >
//                 Общая информация
//               </button>

//               <button
//                 className={displayInfo == "rooms" ? classes.activeButton : null}
//                 onClick={() => {
//                   setDisplayInfo("rooms");
//                 }}
//               >
//                 Номера
//               </button>

//               <button
//                 className={
//                   displayInfo == "schedule" ? classes.activeButton : null
//                 }
//                 onClick={() => {
//                   setDisplayInfo("schedule");
//                 }}
//               >
//                 Расписание
//               </button>

//               {user?.airlineId ? null : (
//                 <button
//                   className={
//                     displayInfo == "requisites" ? classes.activeButton : null
//                   }
//                   onClick={() => {
//                     setDisplayInfo("requisites");
//                   }}
//                 >
//                   Реквизиты
//                 </button>
//               )}

//               <button
//                 className={
//                   displayInfo == "contacts" ? classes.activeButton : null
//                 }
//                 onClick={() => {
//                   setDisplayInfo("contacts");
//                 }}
//               >
//                 Контакты и адрес
//               </button>
//             </div>
//           </div>

//           <div
//             className={
//               user?.hotelId || user?.airlineId
//                 ? classes.hotelAbout_info__hotel
//                 : classes.hotelAbout_info
//             }
//           >
//             {displayInfo == "generalInfo" ? (
//               <div className={classes.hotelAbout_info_block}>
//                 {/* <div className={classes.hotelAbout_info_label}>
//                   Информация об отеле
//                 </div> */}
//                 {user?.airlineId &&
//                 user?.role !== roles.hotelAdmin &&
//                 user?.role !== roles.dispatcerAdmin &&
//                 user?.role !== roles.superAdmin ? (
//                   <>
//                     {renderField({ label: "Название", value: hotel?.name })}
//                     {renderField({ label: "Мощность", value: hotel?.capacity })}
//                     {renderField({
//                       label: "Рейтинг",
//                       value: hotel?.stars,
//                       isStars: true,
//                     })}
//                     {renderField({
//                       label: "Звездность",
//                       value: hotel?.usStars,
//                       isStars: true,
//                     })}
//                     {renderField({
//                       label: "Удалённость от аэропорта",
//                       value: hotel?.airportDistance,
//                     })}
//                     {renderField({
//                       label: "Описание",
//                       value: hotel.information?.description
//                         ? hotel.information.description
//                         : "Нет описания",
//                     })}
//                   </>
//                 ) : (
//                   <>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Название</label>
//                       <input
//                         type="tel"
//                         name="name"
//                         value={hotel.name || ""}
//                         onChange={handleChange}
//                         disabled={!isEditing}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Мощность</label>
//                       <input
//                         type="number"
//                         name="capacity"
//                         value={hotel.capacity || ""}
//                         onChange={handleChange}
//                         disabled={!isEditing}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Рейтинг</label>
//                       <input
//                         type="text"
//                         name="stars"
//                         value={hotel.stars || ""}
//                         onChange={handleChange}
//                         disabled={user?.hotelId ? true : !isEditing}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Звездность</label>
//                       <input
//                         type="text"
//                         name="usStars"
//                         value={hotel.usStars || ""}
//                         onChange={handleChange}
//                         disabled={user?.hotelId ? true : !isEditing}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label
//                         className={classes.airportDistance}
//                         style={
//                           menuOpen && width <= 1707
//                             ? { width: "18%" }
//                             : !menuOpen && width <= 1690
//                             ? { width: "20%" }
//                             : {}
//                         }
//                       >
//                         Удалённость от аэропорта (мин)
//                       </label>
//                       <input
//                         type="number"
//                         name="airportDistance"
//                         step={0.1}
//                         value={hotel.airportDistance || ""}
//                         onChange={handleChange}
//                         disabled={!isEditing}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     <div className={classes.hotelAbout_info_item_info}>
//                       <label>Описание</label>
//                       <textarea
//                         type="text"
//                         name="description"
//                         value={hotel.information?.description || ""}
//                         onChange={handleChange}
//                         disabled={!isEditing}
//                         style={!isEditing ? { resize: "none" } : null}
//                         className={classes.hotelAbout_info_input}
//                       />
//                     </div>
//                     {user?.airlineId ? null : (
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Изображение</label>
//                         <input
//                           type="file"
//                           name="images"
//                           onChange={handleFileChange}
//                           ref={fileInputRef}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     )}

//                     {user.role === roles.superAdmin ||
//                     user.role === roles.dispatcerAdmin ? (
//                       <div className={classes.hotelAbout_info_item}>
//                         <div
//                           className={classes.deleteHotel}
//                           onClick={openDeleteComponent}
//                         >
//                           Удалить гостиницу
//                           <img src="/delete.png" alt="" />
//                         </div>
//                       </div>
//                     ) : null}

//                     {showDelete && (
//                       <DeleteComponent
//                         remove={handleDeleteHotel}
//                         close={closeDeleteComponent}
//                         title={`Вы действительно хотите удалить гостиницу "${hotel?.name}"?`}
//                       />
//                     )}
//                   </>
//                 )}
//               </div>
//             ) : displayInfo == "schedule" ? (
//               <div className={classes.hotelAbout_info_block_meal}>
//                 <div className={classes.hotelAbout_info_label}>
//                   Расписание питания
//                 </div>
//                 {user?.airlineId &&
//                 user?.role !== roles.hotelAdmin &&
//                 user?.role !== roles.dispatcerAdmin &&
//                 user?.role !== roles.superAdmin ? (
//                   <>
//                     {renderField({
//                       label: "Завтрак",
//                       value: `с ${hotel?.breakfast?.start} до ${hotel?.breakfast?.end}`,
//                     })}
//                     {renderField({
//                       label: "Обед",
//                       value: `с ${hotel?.lunch?.start} до ${hotel?.lunch?.end}`,
//                     })}
//                     {renderField({
//                       label: "Ужин",
//                       value: `с ${hotel?.dinner?.start} до ${hotel?.dinner?.end}`,
//                     })}
//                   </>
//                 ) : (
//                   <>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Завтрак</label>
//                       <div className={classes.mealTime}>
//                         <label>с</label>
//                         <input
//                           type="time"
//                           name="breakfastStart"
//                           value={hotel.breakfast.start || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />

//                         <label>до</label>
//                         <input
//                           type="time"
//                           name="breakfastEnd"
//                           value={hotel.breakfast.end || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Обед</label>
//                       <div className={classes.mealTime}>
//                         <label>с</label>
//                         <input
//                           type="time"
//                           name="lunchStart"
//                           value={hotel.lunch.start || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />

//                         <label>до</label>
//                         <input
//                           type="time"
//                           name="lunchEnd"
//                           value={hotel.lunch.end || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     </div>
//                     <div className={classes.hotelAbout_info_item}>
//                       <label>Ужин</label>
//                       <div className={classes.mealTime}>
//                         <label>с</label>
//                         <input
//                           type="time"
//                           name="dinnerStart"
//                           value={hotel.dinner.start || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />

//                         <label>до</label>
//                         <input
//                           type="time"
//                           name="dinnerEnd"
//                           value={hotel.dinner.end || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>
//             ) : displayInfo == "requisites" && !user?.airlineId ? (
//               <div className={classes.hotelAbout_info_block}>
//                 {/* <div className={classes.hotelAbout_info_label}>Реквизиты</div> */}
//                 <div className={classes.hotelAbout_info_item}>
//                   <label>ИНН</label>
//                   <input
//                     type="text"
//                     name="inn"
//                     value={hotel.information?.inn || ""}
//                     onChange={handleChange}
//                     disabled={!isEditing}
//                     className={classes.hotelAbout_info_input}
//                   />
//                 </div>
//                 <div className={classes.hotelAbout_info_item}>
//                   <label>ОГРН</label>
//                   <input
//                     type="text"
//                     name="ogrn"
//                     value={hotel.information?.ogrn || ""}
//                     onChange={handleChange}
//                     disabled={!isEditing}
//                     className={classes.hotelAbout_info_input}
//                   />
//                 </div>
//                 <div className={classes.hotelAbout_info_item}>
//                   <label>Р/С</label>
//                   <input
//                     type="text"
//                     name="rs"
//                     value={hotel.information?.rs || ""}
//                     onChange={handleChange}
//                     disabled={!isEditing}
//                     className={classes.hotelAbout_info_input}
//                   />
//                 </div>
//                 <div className={classes.hotelAbout_info_item}>
//                   <label>В БАНКЕ</label>
//                   <input
//                     type="text"
//                     name="bank"
//                     value={hotel.information?.bank || ""}
//                     onChange={handleChange}
//                     disabled={!isEditing}
//                     className={classes.hotelAbout_info_input}
//                   />
//                 </div>
//                 <div className={classes.hotelAbout_info_item}>
//                   <label>БИК</label>
//                   <input
//                     type="text"
//                     name="bik"
//                     value={hotel.information?.bik || ""}
//                     onChange={handleChange}
//                     disabled={!isEditing}
//                     className={classes.hotelAbout_info_input}
//                   />
//                 </div>
//               </div>
//             ) : displayInfo === "rooms" ? (
//               <div
//                 className={
//                   user?.role === roles.airlineAdmin
//                     ? classes.hotelAbout_rooms_block__hotel
//                     : classes.hotelAbout_rooms_block
//                 }
//               >
//                 <div
//                   className={`${classes.rooms_wrapper} ${
//                     menuOpen && width <= 1578 ? classes.fb30 : ""
//                   }`}
//                 >
//                   {hotel.rooms?.map((room) => (
//                     <HotelAboutRoomBlock key={room.id} {...room} />
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div
//                 className={
//                   user?.airlineId
//                     ? classes.hotelAbout_info__contacts___airline
//                     : classes.hotelAbout_info__contacts
//                 }
//                 style={
//                   menuOpen && width <= 1650
//                     ? { flexDirection: "column" }
//                     : {}
//                 }
//               >
//                 <div
//                   className={classes.hotelAbout_info_block}
//                   style={menuOpen ? { width: "70%" } : {}}
//                 >
//                   <div className={classes.hotelAbout_info_label}>Адрес</div>
//                   {user?.airlineId &&
//                   user?.role !== roles.hotelAdmin &&
//                   user?.role !== roles.dispatcerAdmin &&
//                   user?.role !== roles.superAdmin ? (
//                     <>
//                       {renderField({
//                         label: "Страна",
//                         value: hotel.information?.country,
//                       })}
//                       {renderField({
//                         label: "Город",
//                         value: hotel.information?.city,
//                       })}
//                       {renderField({
//                         label: "Улица",
//                         value: hotel.information?.address,
//                       })}
//                       {renderField({
//                         label: "Индекс",
//                         value: hotel.information?.index,
//                       })}
//                       {/* {renderField({
//                         label: "Расстояние до аэропорта",
//                         value: hotel?.airportDistance,
//                       })} */}
//                     </>
//                   ) : (
//                     <>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Страна</label>
//                         <input
//                           type="text"
//                           name="country"
//                           value={hotel.information?.country || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Город</label>
//                         <MUIAutocomplete
//                           dropdownWidth={"400px"}
//                           isDisabled={!isEditing}
//                           options={cities}
//                           getOptionLabel={(option) => option.label}
//                           value={
//                             cities.find(
//                               (option) =>
//                                 option.value === hotel.information?.city
//                             ) || ""
//                           }
//                           onChange={(event, newValue) => {
//                             setHotel((prevHotel) => ({
//                               ...prevHotel,
//                               information: {
//                                 ...prevHotel.information,
//                                 city: newValue ? newValue.value : "", // Обновляем поле `city`
//                               },
//                             }));
//                           }}
//                         />

//                         {/* <input
//                       type="text"
//                       name="city"
//                       value={hotel.information?.city || ""}
//                       onChange={handleChange}
//                       disabled={!isEditing}
//                       className={classes.hotelAbout_info_input}
//                     /> */}
//                       </div>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Улица</label>
//                         <input
//                           type="text"
//                           name="address"
//                           value={hotel.information?.address || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Индекс</label>
//                         <input
//                           type="text"
//                           name="index"
//                           value={hotel.information?.index || ""}
//                           onChange={handleChange}
//                           disabled={!isEditing}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     </>
//                   )}
//                 </div>
//                 <div
//                   className={classes.hotelAbout_info_block}
//                   style={menuOpen ? { width: "70%" } : {}}
//                 >
//                   <div className={classes.hotelAbout_info_label}>Контакты</div>
//                   {user?.airlineId ? (
//                     <>
//                       {renderField({
//                         label: "Почта",
//                         value: "KarsAvia",
//                       })}
//                       {renderField({
//                         label: "Телефон",
//                         value: "8-818-888-88-88",
//                       })}
//                       {renderField({
//                         label: "Ссылка",
//                         value: "KarsAvia",
//                       })}
//                     </>
//                   ) : (
//                     <>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Почта</label>
//                         <input
//                           type="email"
//                           name="email"
//                           // value={hotel.email || ""}
//                           value={"KarsAvia"}
//                           // onChange={handleChange}
//                           disabled={true}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Телефон</label>
//                         <input
//                           type="tel"
//                           name="number"
//                           // value={hotel.number || ""}
//                           value={"8-818-888-88-88"}
//                           // onChange={handleChange}
//                           disabled={true}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                       <div className={classes.hotelAbout_info_item}>
//                         <label>Ссылка</label>
//                         <input
//                           type="tel"
//                           name="link"
//                           // value={hotel.link || ""}
//                           value={"KarsAvia"}
//                           // onChange={handleChange}
//                           disabled={true}
//                           className={classes.hotelAbout_info_input}
//                         />
//                       </div>
//                     </>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//           <Logs
//             type={"hotel"}
//             queryLog={GET_HOTEL_LOGS}
//             queryID={"hotelId"}
//             id={id}
//             show={showLogsSidebar}
//             onClose={toggleLogsSidebar}
//             name={hotel?.name}
//           />
//           {notifications.map((n, index) => (
//             <Notification
//               key={n.id}
//               text={n.text}
//               status={n.status}
//               index={index}
//               time={notifyTime}
//               onClose={() => {
//                 setNotifications((prev) =>
//                   prev.filter((notif) => notif.id !== n.id)
//                 );
//               }}
//             />
//           ))}
//         </div>
//       )}
//     </>
//   );
// }

// export default HotelAbout_tabComponent;
