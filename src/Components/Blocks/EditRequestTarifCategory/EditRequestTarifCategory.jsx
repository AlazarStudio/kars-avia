import React, { useState, useRef, useEffect } from "react";
import classes from "./EditRequestTarifCategory.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, UPDATE_HOTEL_TARIF } from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";

function EditRequestTarifCategory({
  show,
  onClose,
  tarif,
  onSubmit,
  addTarif,
  id,
  setAddTarif,
  user,
  type,
  addNotification,
}) {
  const token = getCookie("token");

  const [formData, setFormData] = useState({
    images: null,
  });

    // console.log(tarif);

  const sidebarRef = useRef();

  const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  useEffect(() => {
    if (show && tarif) {
      setFormData({ ...tarif, images: null });
    }
  }, [show, tarif]);

//   console.log(formData);
  

  const closeButton = () => {
    let success = confirm("Вы уверены, все несохраненные данные будут удалены");
    if (success) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 8) {
      alert("Вы можете загрузить не более 8 изображений.");
      e.target.value = null;
      return;
    }

    // Преобразуем файлы в массив
    const fileArray = Array.from(files);

    setFormData((prevState) => ({
      ...prevState,
      images: fileArray, // Сохраняем массив файлов
    }));
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response_update_tarif = await updateHotelTarif({
        variables: {
          updateHotelId: id,
          input: {
            roomKind: [
              {
                id: formData.id,
                category: formData.category,
                name: formData.name,
                price: parseFloat(formData.price),
                description: formData.description,
              },
            ],
          },
          roomKindImages: formData.images,
        },
      });
      onClose();
      setIsLoading(false);
      addNotification("Редактирование тарифа прошло успешно.", "success");
    } catch (error) {
      setIsLoading(false);
      console.error("Произошла ошибка при выполнении запроса:", error);
      alert("Произошло ошибка при редактировании тарифа.");
    }
  };

  const [tarifNames, setTarifNames] = useState([]);

  useEffect(() => {
    const names = addTarif.map((tarif) => tarif.name);
    setTarifNames(names);
  }, [addTarif]);

  useEffect(() => {
    if (show) {
      const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
          closeButton();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [show]);

  const categories = [
    {
      value: "onePlace",
      label: "Одноместный",
    },
    {
      value: "twoPlace",
      label: "Двухместный",
    },
    {
      value: "threePlace",
      label: "Трехместный",
    },
    {
      value: "fourPlace",
      label: "Четырехместный",
    },
    {
      value: "fivePlace",
      label: "Пятиместный",
    },
    {
      value: "sixPlace",
      label: "Шестиместный",
    },
    {
      value: "sevenPlace",
      label: "Семиместный",
    },
    {
      value: "eightPlace",
      label: "Восьмиместный",
    },
  ];

  const apartmentCategories = [
    {
      value: "apartment",
      label: "Апартаменты",
    },
    {
      value: "studio",
      label: "Студия",
    },
  ];

  const useCategories = type === "apartment" ? apartmentCategories : categories;

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Редактировать тариф</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="close" />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Выберите категорию</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите категорию"}
                options={useCategories.map((category) => category.label)}
                value={
                  useCategories.find(
                    (category) => category.value === formData?.category
                  ) || ""
                }
                onChange={(event, newValue) => {
                  const selectedCategory = useCategories.find(
                    (category) => category.label === newValue
                  );
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    category: selectedCategory.value,
                  }));
                  //   setIsEdited(true);
                }}
              />

              <label>Название тарифа</label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="Например: Стандарт, Люкс"
              />

              <label>Стоимость</label>
              <input
                type="number"
                name="price"
                value={formData.price || 0}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />

              <label>Описание</label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
              ></textarea>

              <label>Изображения</label>
              <input
                type="file"
                name="images"
                onChange={handleFileChange}
                multiple
              />
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Изменить
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestTarifCategory;

// import React, { useState, useRef, useEffect } from "react";
// import classes from './EditRequestTarifCategory.module.css';
// import Button from "../../Standart/Button/Button";
// import Sidebar from "../Sidebar/Sidebar";

// import { getCookie, UPDATE_HOTEL_TARIF } from '../../../../graphQL_requests.js';
// import { useMutation, useQuery } from "@apollo/client";

// function EditRequestTarifCategory({ show, onClose, tarif, onSubmit, addTarif, id, setAddTarif, user }) {
//     const token = getCookie('token');

//     const [formData, setFormData] = useState({});

//     const sidebarRef = useRef();

//     const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
//         context: {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 // 'Apollo-Require-Preflight': 'true',
//             },
//         },
//     });

//     useEffect(() => {
//         if (show && tarif) {
//             setFormData(tarif.data);
//         }
//     }, [show, tarif]);

//     const closeButton = () => {
//         let success = confirm("Вы уверены, все несохраненные данные будут удалены");
//         if (success) {
//             onClose();
//         }
//     };

//     const handleChange = (e) => {
//         const { name, value } = e.target;

//         if (name === 'tarifName') {
//             const selectedTarif = addTarif.find(tarif => tarif.name === value);
//             setFormData(prevState => ({
//                 ...prevState,
//                 tarif: selectedTarif
//             }));
//         } else if (name === 'type') {
//             setFormData(prevState => ({
//                 ...prevState,
//                 category: {
//                     ...prevState.category,
//                     name: value,
//                 },
//             }));
//         } else if (name === 'price' || name === 'price_airline') {
//             setFormData(prevState => ({
//                 ...prevState,
//                 category: {
//                     ...prevState.category,
//                     prices: [
//                         {
//                             ...prevState.category?.prices?.[0],
//                             [name === 'price' ? 'amount' : 'amountair']: value,
//                         }
//                     ],
//                 },
//             }));
//         } else {
//             setFormData(prevState => ({
//                 ...prevState,
//                 [name]: value,
//             }));
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         let response_update_category = await updateHotelTarif({
//             variables: {
//                 updateHotelId: id,
//                 input: {
//                     "categories": [
//                         {
//                             "name": formData.category.name,
//                             "id": formData.category.id
//                         }
//                     ]
//                 }
//             }
//         });

//         let response_update_prices = await updateHotelTarif({
//             variables: {
//                 updateHotelId: id,
//                 input: {
//                     "prices": [
//                         {
//                             "id": formData.category.prices[0].id,
//                             "amount": Number(formData.category.prices[0].amount),
//                             "amountair": Number(formData.category.prices[0].amountair),
//                             "categoryId": formData.category.id,
//                             "tariffId": formData.tarif.id
//                         }
//                     ]
//                 }
//             }
//         });

//         if (response_update_category && response_update_prices) {
//             setAddTarif(response_update_prices.data.updateHotel.tariffs)
//             onClose();
//         }
//     };

//     const [tarifNames, setTarifNames] = useState([]);

//     useEffect(() => {
//         const names = addTarif.map(tarif => tarif.name);
//         setTarifNames(names);
//     }, [addTarif]);

//     useEffect(() => {
//         if (show) {
//             const handleClickOutside = (event) => {
//                 if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
//                     closeButton();
//                 }
//             };
//             document.addEventListener('mousedown', handleClickOutside);

//             return () => {
//                 document.removeEventListener('mousedown', handleClickOutside);
//             };
//         }
//     }, [show]);

//     return (
//         <Sidebar show={show} sidebarRef={sidebarRef}>
//             <div className={classes.requestTitle}>
//                 <div className={classes.requestTitle_name}>Редактировать</div>
//                 <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="close" /></div>
//             </div>

//             <div className={classes.requestMiddle}>
//                 <div className={classes.requestData}>
//                     {/* <label>Выберите тариф</label>
//                     <select name="tarifName" value={formData?.tarif?.name} onChange={handleChange}>
//                         <option value="">Выберите тариф</option>
//                         {tarifNames.map((name, index) => (
//                             <option key={index} value={name}>{name}</option>
//                         ))}
//                     </select> */}

//                     <label>Тип номера</label>
//                     <input
//                         type="text"
//                         name="type"
//                         value={formData?.category?.name || ''}
//                         onChange={handleChange}
//                         placeholder="Введите тип номера"
//                     />

//                     {user?.role != "AIRLINEADMIN" &&
//                         <>
//                             <label>Стоимость</label>
//                             <input
//                                 type="text"
//                                 name="price"
//                                 value={formData?.category?.prices?.[0]?.amount || ''}
//                                 onChange={handleChange}
//                                 placeholder="Введите стоимость"
//                             />
//                         </>
//                     }

//                     {user?.role != "HOTELADMIN" &&
//                         <>
//                             <label>Стоимость для авиакомпании</label>
//                             <input
//                                 type="text"
//                                 name="price_airline"
//                                 value={formData?.category?.prices?.[0]?.amountair || ''}
//                                 onChange={handleChange}
//                                 placeholder="Введите стоимость для авиакомпании"
//                             />
//                         </>
//                     }
//                 </div>
//             </div>

//             <div className={classes.requestButton}>
//                 <Button type="submit" onClick={handleSubmit}>Изменить</Button>
//             </div>
//         </Sidebar>
//     );
// }

// export default EditRequestTarifCategory;
