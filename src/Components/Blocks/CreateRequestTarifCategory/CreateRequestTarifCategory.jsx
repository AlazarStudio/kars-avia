import React, { useState, useRef, useEffect } from "react";
import classes from "./CreateRequestTarifCategory.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, UPDATE_HOTEL_TARIF } from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import TextEditor from "../TextEditor/TextEditor.jsx";
function CreateRequestTarifCategory({
  show,
  id,
  onClose,
  refetch,
  user,
  type,
  addNotification,
}) {
  const token = getCookie("token");

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    priceForAirline: "",
    priceForAirReq: false,
    description: "",
    square: "",
    images: null,
  });
  const [coverImage, setCoverImage] = useState(null);

  const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  // const [tarifNames, setTarifNames] = useState([]);
  const sidebarRef = useRef();

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      price: "",
      priceForAirline: "",
      priceForAirReq: false,
      description: "",
      square: "",
      images: null,
    });
    setCoverImage(null);
  };

  const closeButton = () => {
    let success = confirm(
      "Вы уверены, все несохраненные данные будут удалены?"
    );
    if (success) {
      resetForm();
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
  const handleCoverImageChange = (image) => {
    setCoverImage(image);
  };

  // const handleFileChange = (e) => {
  //   const files = e.target.files;
  //   if (files.length > 8) {
  //     alert("Вы можете загрузить не более 8 изображений.");
  //     e.target.value = null;
  //     return;
  //   }

  //   // Преобразуем файлы в массив
  //   const fileArray = Array.from(files);

  //   setFormData((prevState) => ({
  //     ...prevState,
  //     images: fileArray, // Сохраняем массив файлов
  //   }));
  // };
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 8) {
      alert("Вы можете загрузить не более 8 изображений.");
      e.target.value = null;
      return;
    }

    const fileArray = Array.from(files);

    // Если есть выбранное изображение, ставим его первым в массиве
    const updatedImages = coverImage ? [coverImage, ...fileArray] : fileArray;

    setFormData((prevState) => ({
      ...prevState,
      images: updatedImages,
    }));
  };
  const imagesArray = coverImage
    ? [coverImage, ...formData.images?.filter((img) => img !== coverImage)]
    : formData.images;

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
                category: formData.category,
                name: formData.name,
                price: parseFloat(formData.price),
                priceForAirline: parseFloat(formData.priceForAirline),
                priceForAirReq: formData.priceForAirReq,
                description: formData.description,
                square: formData.square,
              },
            ],
          },
          roomKindImages: imagesArray,
        },
      });
      resetForm();
      onClose();
      setIsLoading(false);
      addNotification("Добавление тарифа прошло успешно.", "success");
      refetch();
    } catch (error) {
      setIsLoading(false);
      alert("Произошло ошибка при добавлении тарифа.");
      console.error("Произошла ошибка при выполнении запроса:", error);
    }
  };

  useEffect(() => {
    if (show) {
      resetForm();
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

  // useEffect(() => {
  //   const names = addTarif?.map((tarif) => ({
  //     id: tarif.id,
  //     name: tarif.name,
  //   }));
  //   setTarifNames(names);
  // }, [addTarif]);

  const categories = [
    {
      value: "luxe",
      label: "Люкс",
    },
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
        <div className={classes.requestTitle_name}>Добавить тариф</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
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
                    (category) => category.value === formData.category
                  ) || ""
                }
                onChange={(event, newValue) => {
                  const selectedCategory = useCategories.find(
                    (category) => category.label === newValue
                  ) || "";
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
                value={formData.name}
                onChange={handleChange}
                placeholder="Например: Стандарт, Люкс"
              />

              <label>Стоимость</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              {!user?.hotelId && (
                <>
                  <label>Стоимость для авиакомпании</label>
                  <input
                    type="number"
                    name="priceForAirline"
                    value={formData.priceForAirline}
                    onChange={handleChange}
                    placeholder="Введите стоимость для авиакомпании"
                  />
                  <label className={classes.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.priceForAirReq)}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priceForAirReq: e.target.checked,
                        }))
                      }
                    />
                    <span style={{ marginLeft: 8 }}>Стоимость по запросу</span>
                  </label>
                </>
              )}

              <label>Квадратура</label>
              <input
                type="text"
                name="square"
                value={formData.square || ""}
                onChange={handleChange}
                placeholder="м²"
              />

              <label>Описание</label>
              <TextEditor
                hotel={null}
                anotherDescription={formData.description || ""}
                isEditing={true}
                onChange={(newDescription) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: newDescription,
                  }))
                }
              />
              {/* <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              ></textarea> */}

              <label>Изображения</label>
              <input
                type="file"
                name="images"
                onChange={handleFileChange}
                multiple
              />
              <div className={classes.imageList}>
                {formData?.images?.map((image, index) => (
                  <div
                    key={`${image.name}-${index}`} // Используйте `image.name` для уникальности ключа
                    className={`${classes.imageItem} ${
                      coverImage === image ? classes.selected : ""
                    }`}
                    onClick={() => handleCoverImageChange(image)}
                  >
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Image ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Добавить тариф
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestTarifCategory;

// import React, { useState, useRef, useEffect } from "react";
// import classes from './CreateRequestTarifCategory.module.css';
// import Button from "../../Standart/Button/Button";
// import Sidebar from "../Sidebar/Sidebar";

// import { getCookie, UPDATE_HOTEL_TARIF } from '../../../../graphQL_requests.js';
// import { useMutation, useQuery } from "@apollo/client";
// function CreateRequestTarifCategory({ show, id, onClose, addTarif, setAddTarif, user }) {
//     const token = getCookie('token');

//     const [formData, setFormData] = useState({
//         tarifName: '',
//         type: '',
//         price: '',
//         price_airline: '',
//     });

//     const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
//         context: {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 // 'Apollo-Require-Preflight': 'true',
//             },
//         },
//     });

//     const [tarifNames, setTarifNames] = useState([]);
//     const sidebarRef = useRef();

//     const resetForm = () => {
//         setFormData({
//             tarifName: '',
//             type: '',
//             price: '',
//             price_airline: '',
//         });
//     };

//     const closeButton = () => {
//         let success = confirm("Вы уверены, все несохраненные данные будут удалены?");
//         if (success) {
//             resetForm();
//             onClose();
//         }
//     };

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prevState => ({
//             ...prevState,
//             [name]: value
//         }));
//     };

//     const add_prices = async (categoryID) => {
//         let response_update_prices = await updateHotelTarif({
//             variables: {
//                 updateHotelId: id,
//                 input: {
//                     "prices": [
//                         {
//                             "amount": Number(formData.price),
//                             "amountair": Number(formData.price_airline),
//                             "categoryId": categoryID,
//                             "tariffId": formData.tarifName
//                         }
//                     ]
//                 }
//             }
//         });

//         return response_update_prices
//     }

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         try {
//             let response_update_tarif = await updateHotelTarif({
//                 variables: {
//                     updateHotelId: id,
//                     input: {
//                         "categories": [
//                             {
//                                 "name": formData.type,
//                                 "tariffId": formData.tarifName
//                             }
//                         ]
//                     }
//                 }
//             });

//             if (response_update_tarif && response_update_tarif.data && response_update_tarif.data.updateHotel) {
//                 response_update_tarif.data.updateHotel.tariffs.map((tarif) => {
//                     if (tarif.id == formData.tarifName) {
//                         tarif.category.map(async (category) => {
//                             if (category.name == formData.type) {
//                                 let info = await add_prices(category.id);

//                                 if (info && info.data && info.data.updateHotel) {
//                                     setAddTarif(info.data.updateHotel.tariffs);
//                                     resetForm();
//                                     onClose();
//                                 } else {
//                                     console.error("Ошибка при обновлении данных тарифов");
//                                 }
//                             }
//                         });
//                     }
//                 });
//             } else {
//                 console.error("Ответ не содержит данных по отелям.");
//             }
//         } catch (error) {
//             console.error("Произошла ошибка при выполнении запроса:", error);
//         }
//     };

//     useEffect(() => {
//         if (show) {
//             resetForm();
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

//     useEffect(() => {
//         const names = addTarif.map(tarif => ({
//             id: tarif.id,
//             name: tarif.name
//         })
//         );
//         setTarifNames(names);
//     }, [addTarif]);

//     return (
//         <Sidebar show={show} sidebarRef={sidebarRef}>
//             <div className={classes.requestTitle}>
//                 <div className={classes.requestTitle_name}>Добавить категорию</div>
//                 <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="" /></div>
//             </div>

//             <div className={classes.requestMiddle}>
//                 <div className={classes.requestData}>
//                     <label>Выберите тариф</label>
//                     <select name="tarifName" value={formData.tarifName} onChange={handleChange}>
//                         <option value="" disabled>Выберите тариф</option>
//                         {tarifNames.map((name, index) => (
//                             <option key={index} value={name.id}>{name.name}</option>
//                         ))}
//                     </select>

//                     <label>Название категории</label>
//                     <input
//                         type="text"
//                         name="type"
//                         value={formData.type}
//                         onChange={handleChange}
//                         placeholder="Введите название категории"
//                     />

//                     {user?.role != "AIRLINEADMIN" &&
//                         <>
//                             <label>Стоимость</label>
//                             <input
//                                 type="number"
//                                 name="price"
//                                 value={formData.price}
//                                 onChange={handleChange}
//                                 placeholder="Введите стоимость"
//                             />
//                         </>
//                     }

//                     {user?.role != "HOTELADMIN" &&
//                         <>
//                             <label>Стоимость для авиакомпании</label>
//                             <input
//                                 type="number"
//                                 name="price_airline"
//                                 value={formData.price_airline}
//                                 onChange={handleChange}
//                                 placeholder="Введите стоимость для авиакомпании"
//                             />
//                         </>
//                     }
//                 </div>
//             </div>

//             <div className={classes.requestButton}>
//                 <Button type="submit" onClick={handleSubmit}>Добавить категорию</Button>
//             </div>
//         </Sidebar>
//     );
// }

// export default CreateRequestTarifCategory;
