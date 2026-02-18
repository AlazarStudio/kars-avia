import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import classes from "./ChooseHotel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_CITIES,
  GET_HOTEL,
  GET_HOTELS_RELAY,
  getCookie,
  UPDATE_REQUEST_RELAY,
} from "../../../../graphQL_requests";
import DropDownList from "../DropDownList/DropDownList"; // Импортируем кастомный компонент DropDownList
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUILoader from "../MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon";

function ChooseHotel({
  show,
  onClose,
  chooseObject,
  id,
  chooseRequestID,
  chooseCityRequest,
}) {
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    city: "",
    hotel: "",
    request: chooseRequestID,
  });
  const [hotels, setHotels] = useState([]);
  const sidebarRef = useRef();
  const token = getCookie("token");
  // Получаем данные о гостиницах
  const { data: hotelsData, loading: hotelsLoading } = useQuery(
    GET_HOTELS_RELAY,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  // const { data: citiesData, loading: citiesLoading } = useQuery(GET_CITIES);

  useEffect(() => {
    if (!hotelsLoading && hotelsData && show) {
      setHotels(hotelsData.hotels.hotels || []);
    }
  }, [hotelsLoading, hotelsData, show]);

  // 2) When a hotel ID is chosen, fetch its details (including `access`):
  const {
    data: chosenHotelData,
    loading: loadingChosenHotel,
    error: errorChosenHotel,
  } = useQuery(GET_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { hotelId: formData.hotel },
    skip: !formData.hotel, // don’t run until we have an ID
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (chooseCityRequest && show) {
      setFormData((prevState) => ({
        ...prevState,
        city: chooseCityRequest,
        hotel: "",
        request: chooseRequestID,
      }));
    }
  }, [chooseCityRequest, show]);

  // Получаем уникальные города и фильтруем отели по выбранному городу
  // const uniqueCities = useMemo(
  //   () =>
  //     [
  //       ...new Set(hotels.map((hotel) => hotel.information?.city? hotel.information.city.trim() : '')),
  //     ].sort(),
  //   [hotels]
  // );
  // const uniqueCities = useMemo(
  //   () =>
  //     [
  //       ...new Set(
  //         citiesData?.citys.map((item) =>
  //           item.city ? item.city.trim() : "kdsjf"
  //         )
  //       ),
  //     ].sort(),
  //   [citiesData]
  // );

  // const filteredHotels = useMemo(() => {
  //   return formData.city
  //     ? hotels.filter(
  //         (hotel) => hotel.information?.city?.trim() === formData.city.trim()
  //       )
  //     : [];
  // }, [formData.city, hotels]);

  // 3) Prepare your city list and filtered hotel list:
  const uniqueCities = useMemo(
    () =>
      [...new Set(hotels.map((h) => h.information?.city?.trim() || ""))].sort(),
    [hotels]
  );
  const filteredHotels = useMemo(
    () =>
      formData.city
        ? hotels.filter(
          (h) => h.information?.city?.trim() === formData.city.trim()
        )
        : [],
    [formData.city, hotels]
  );

  // console.log(hotelsData?.hotels?.hotels);

  const resetForm = useCallback(() => {
    setFormData({ city: "", hotel: "", request: chooseRequestID });
    setIsEdited(false);
  }, [chooseRequestID]);
  const closeButton = useCallback(() => {
    if (
      !isEdited ||
      window.confirm("Все несохранённые данные будут утеряны. Закрыть?")
    ) {
      resetForm();
      onClose();
    }
  }, [isEdited, onClose, resetForm]);

  const handleCitySelect = (value) => {
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      city: value,
      hotel: "",
      request: chooseRequestID,
    })); // Сброс отеля при изменении города
  };

  const handleHotelSelect = (value) => {
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      hotel: value,
      request: chooseRequestID,
    }));
  };

  // 5) Mutation for self-placement:
  const [updateRequest] = useMutation(UPDATE_REQUEST_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    onCompleted: () => {
      onClose();
    },
    onError: (err) => {
      console.error("Ошибка размещения:", err);
      alert("Не удалось разместить заявку у отеля.");
    },
  });
  const handleSubmit = () =>
    updateRequest({
      variables: {
        updateRequestId: formData.request,
        input: { hotelId: formData.hotel },
      },
    });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current?.contains(event.target) // Клик в боковой панели
      ) {
        return; // Если клик внутри, ничего не делаем
      }

      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, closeButton]);

  // console.log("Выбор города:", chooseCityRequest);
  // console.log("ID запроса:", chooseRequestID);
  // console.log("FormData:", formData);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Выбрать гостиницу</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      <div className={classes.requestMiddle}>
        <div className={classes.requestData}>
          <label>Город</label>
          {/* <DropDownList
            placeholder="Выберите город"
            options={uniqueCities}
            initialValue={formData.city}
            onSelect={handleCitySelect}
          /> */}
          {show && (
            <MUIAutocomplete
              dropdownWidth={"100%"}
              label={"Введите город"}
              options={uniqueCities}
              value={formData.city}
              onChange={(event, newValue) => {
                handleCitySelect(newValue);
              }}
            />
          )}

          <label>Гостиница</label>
          {/* <DropDownList
            placeholder="Выберите гостиницу"
            options={filteredHotels.map((hotel) => hotel.name)}
            initialValue={
              filteredHotels.find((hotel) => hotel.id === formData.hotel)
                ?.name || ""
            }
            onSelect={(value) => {
              const selectedHotel = filteredHotels.find(
                (hotel) => hotel.name === value
              );
              handleHotelSelect(selectedHotel?.id || "");
            }}
          /> */}
          <MUIAutocomplete
            dropdownWidth={"100%"}
            label={"Введите гостиницу"}
            options={filteredHotels.map((hotel) => hotel.name)}
            value={
              filteredHotels.find((hotel) => hotel.id === formData.hotel)
                ?.name || ""
            }
            onChange={(event, newValue) => {
              const selectedHotel = filteredHotels.find(
                (hotel) => hotel.name === newValue
              );
              handleHotelSelect(selectedHotel?.id || "");
            }}
          />
        </div>
      </div>

      {formData.city && formData.hotel && (
        <div className={classes.requestButton}>
          {loadingChosenHotel ? (
            <Button disabled>
              <MUILoader loadSize={"28px"} color={"#fff"} />
            </Button>
          ) : errorChosenHotel ? (
            <Button disabled>Ошибка загрузки</Button>
          ) : chosenHotelData?.hotel?.access ? (
            // Hotel can self-place → use mutation
            <Button onClick={handleSubmit} dataObject={chooseObject}>
              Отправить на размещение{" "}
              <img
                style={{ width: "25px", height: "25px" }}
                src="/user-check.png"
                alt="check"
              />
            </Button>
          ) : (
            // Hotel can’t self-place → navigate to dispatcher flow
            <Button
              link={`/hotels/${formData.hotel}/${formData.request}`}
              dataObject={chooseObject}
              disabled
            >
              Разместить{" "}
              <img
                style={{ width: "25px", height: "25px" }}
                src="/user-check.png"
                alt="check"
              />
            </Button>
          )}
        </div>
      )}
    </Sidebar>
  );
}

export default ChooseHotel;

// import React, {
//   useState,
//   useRef,
//   useEffect,
//   useCallback,
//   useMemo,
// } from "react";
// import classes from "./ChooseHotel.module.css";
// import Button from "../../Standart/Button/Button";
// import Sidebar from "../Sidebar/Sidebar";
// import { useQuery } from "@apollo/client";
// import { GET_CITIES, GET_HOTELS_RELAY } from "../../../../graphQL_requests";
// import DropDownList from "../DropDownList/DropDownList"; // Импортируем кастомный компонент DropDownList
// import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";

// function ChooseHotel({
//   show,
//   onClose,
//   chooseObject,
//   id,
//   chooseRequestID,
//   chooseCityRequest,
// }) {
//   const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
//   const [formData, setFormData] = useState({
//     city: "",
//     hotel: "",
//     request: chooseRequestID,
//   });
//   const [hotels, setHotels] = useState([]);
//   const sidebarRef = useRef();

//   // Получаем данные о гостиницах
//   const { data: hotelsData, loading: hotelsLoading } =
//     useQuery(GET_HOTELS_RELAY);

//   const { data: citiesData, loading: citiesLoading } = useQuery(GET_CITIES);

//   useEffect(() => {
//     if (!hotelsLoading && hotelsData && show) {
//       setHotels(hotelsData.hotels.hotels || []);
//     }
//   }, [hotelsLoading, hotelsData, show]);

//   useEffect(() => {
//     if (chooseCityRequest && show) {
//       setFormData((prevState) => ({
//         ...prevState,
//         city: chooseCityRequest,
//         hotel: "",
//         request: chooseRequestID,
//       }));
//     }
//   }, [chooseCityRequest, show]);

//   // Получаем уникальные города и фильтруем отели по выбранному городу
//   const uniqueCities = useMemo(
//     () =>
//       [
//         ...new Set(hotels.map((hotel) => hotel.information?.city? hotel.information.city.trim() : '')),
//       ].sort(),
//     [hotels]
//   );
//   // const uniqueCities = useMemo(
//   //   () =>
//   //     [
//   //       ...new Set(
//   //         citiesData?.citys.map((item) =>
//   //           item.city ? item.city.trim() : "kdsjf"
//   //         )
//   //       ),
//   //     ].sort(),
//   //   [citiesData]
//   // );
//   const filteredHotels = useMemo(() => {
//     return formData.city
//       ? hotels.filter(
//           (hotel) => hotel.information?.city?.trim() === formData.city.trim()
//         )
//       : [];
//   }, [formData.city, hotels]);

//   // console.log(hotelsData?.hotels?.hotels);

//   const resetForm = useCallback(() => {
//     setFormData({ city: "", hotel: "", request: chooseRequestID });
//     setIsEdited(false);
//   }, []);

//   const closeButton = useCallback(() => {
//     if (!isEdited) {
//       resetForm();
//       onClose();
//       return;
//     }

//     if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
//       resetForm();
//       onClose();
//     }
//   }, [isEdited, onClose]);

//   const handleCitySelect = (value) => {
//     setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
//     setFormData((prevState) => ({
//       ...prevState,
//       city: value,
//       hotel: "",
//       request: chooseRequestID,
//     })); // Сброс отеля при изменении города
//   };

//   const handleHotelSelect = (value) => {
//     setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
//     setFormData((prevState) => ({
//       ...prevState,
//       hotel: value,
//       request: chooseRequestID,
//     }));
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         sidebarRef.current?.contains(event.target) // Клик в боковой панели
//       ) {
//         return; // Если клик внутри, ничего не делаем
//       }

//       closeButton();
//     };

//     if (show) {
//       document.addEventListener("mousedown", handleClickOutside);
//     } else {
//       document.removeEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [show, closeButton]);

//   // console.log("Выбор города:", chooseCityRequest);
//   // console.log("ID запроса:", chooseRequestID);
//   // console.log("FormData:", formData);

//   return (
//     <Sidebar show={show} sidebarRef={sidebarRef}>
//       <div className={classes.requestTitle}>
//         <div className={classes.requestTitle_name}>Выбрать гостиницу</div>
//         <div className={classes.requestTitle_close} onClick={closeButton}>
//           <img src="/close.png" alt="" />
//         </div>
//       </div>

//       <div className={classes.requestMiddle}>
//         <div className={classes.requestData}>
//           <label>Город</label>
//           {/* <DropDownList
//             placeholder="Выберите город"
//             options={uniqueCities}
//             initialValue={formData.city}
//             onSelect={handleCitySelect}
//           /> */}
//           <MUIAutocomplete
//             dropdownWidth={"100%"}
//             label={"Введите город"}
//             options={uniqueCities}
//             value={formData.city}
//             onChange={(event, newValue) => {
//               handleCitySelect(newValue);
//             }}
//           />

//           <label>Гостиница</label>
//           {/* <DropDownList
//             placeholder="Выберите гостиницу"
//             options={filteredHotels.map((hotel) => hotel.name)}
//             initialValue={
//               filteredHotels.find((hotel) => hotel.id === formData.hotel)
//                 ?.name || ""
//             }
//             onSelect={(value) => {
//               const selectedHotel = filteredHotels.find(
//                 (hotel) => hotel.name === value
//               );
//               handleHotelSelect(selectedHotel?.id || "");
//             }}
//           /> */}
//           <MUIAutocomplete
//             dropdownWidth={"100%"}
//             label={"Введите гостиницу"}
//             options={filteredHotels.map((hotel) => hotel.name)}
//             value={
//               filteredHotels.find((hotel) => hotel.id === formData.hotel)
//                 ?.name || ""
//             }
//             onChange={(event, newValue) => {
//               const selectedHotel = filteredHotels.find(
//                 (hotel) => hotel.name === newValue
//               );
//               handleHotelSelect(selectedHotel?.id || "");
//             }}
//           />
//         </div>
//       </div>

//       {formData.city && formData.hotel && (
//         <div className={classes.requestButton}>
//           <Button
//             link={`/hotels/${formData.hotel}/${formData.request}`}
//             dataObject={chooseObject}
//             disabled={true}
//             onClick={() => {
//               onClose();
//             }}
//           >
//             {/* {console.log(formData)} */}
//             Разместить{" "}
//             <img
//               style={{ width: "fit-content", height: "fit-content" }}
//               src="/user-check.png"
//               alt=""
//             />
//           </Button>
//         </div>
//       )}
//     </Sidebar>
//   );
// }

// export default ChooseHotel;
