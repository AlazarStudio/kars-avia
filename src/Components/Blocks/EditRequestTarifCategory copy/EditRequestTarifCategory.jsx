import React, { useState, useRef, useEffect } from "react";
import classes from "./EditRequestTarifCategory.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  getCookie,
  REORDER_ROOM_KIND_IMAGES,
  server,
  UPDATE_HOTEL_TARIF,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import TextEditor from "../TextEditor/TextEditor.jsx";

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

  const [coverImage, setCoverImage] = useState(tarif && tarif?.images[0]);
  const [coverImage2, setCoverImage2] = useState(null);

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
      setCoverImage(tarif?.images[0]);
    }
  }, [show, tarif]);

  const [isEditing, setIsEditing] = useState(false);

  //   console.log(formData);

  const closeButton = () => {
    let success = confirm("Вы уверены, все несохраненные данные будут удалены");
    if (success) {
      onClose();
      setCoverImage(tarif && tarif?.images[0]);
      setIsEditing(false);
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

    const fileArray = Array.from(files);

    // Если есть выбранное изображение, ставим его первым в массиве
    const updatedImages = coverImage2 ? [coverImage2, ...fileArray] : fileArray;

    setFormData((prevState) => ({
      ...prevState,
      images: updatedImages,
    }));
  };

  const handleCoverImageChange = (image) => {
    if (isEditing) {
      setCoverImage(image);
    }
    // setIsEditing(!isEditing);
  };

  const handleCoverImageChange2 = (image) => {
    if (isEditing) {
      setCoverImage2(image);
    }
    // setIsEditing(!isEditing);
  };

  const [reorderRoomKindImages] = useMutation(REORDER_ROOM_KIND_IMAGES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // "Apollo-Require-Preflight": "true",
      },
    },
  });

  const imagesArray = coverImage
    ? [coverImage, ...tarif?.images.filter((img) => img !== coverImage)]
    : tarif?.images;

  const handleReorderImages = async () => {
    try {
      await reorderRoomKindImages({
        variables: {
          reorderRoomKindImagesId: formData.id,
          imagesArray: imagesArray,
        },
      });
      // addNotification("Обложка обновлена успешно.", "success");
    } catch (error) {
      console.error("Ошибка при обновлении обложки:", error);
      // addNotification("Не удалось обновить обложку.", "error");
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  const imagesArray2 = coverImage2
    ? [coverImage2, ...formData?.images?.filter((img) => img !== coverImage2)]
    : formData.images;

  // console.log(imagesArray2);

  const handleSubmit = async (e) => {
    if (isEditing) {
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
                  square: formData.square,
                },
              ],
            },
            roomKindImages: imagesArray2,
          },
        });
        !imagesArray2 ? await handleReorderImages() : null;
        onClose();
        setIsLoading(false);
        setCoverImage(null);
        setCoverImage2(null);
        addNotification("Редактирование тарифа прошло успешно.", "success");
      } catch (error) {
        setIsLoading(false);
        console.error("Произошла ошибка при выполнении запроса:", error);
        alert("Произошло ошибка при редактировании тарифа.");
        setCoverImage(null);
        setCoverImage2(null);
      }
    }
    setIsEditing(!isEditing);
  };

  const [tarifNames, setTarifNames] = useState([]);

  useEffect(() => {
    const names = addTarif?.map((tarif) => tarif.name);
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
                isDisabled={!isEditing}
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
                disabled={!isEditing}
              />

              <label>Стоимость</label>
              <input
                type="number"
                name="price"
                value={formData.price || 0}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />

              <label>Квадратура</label>
              <input
                type="text"
                name="square"
                value={formData.square || ""}
                onChange={handleChange}
                placeholder="м²"
                disabled={!isEditing}
              />

              <label>Описание</label>
              <TextEditor
                hotel={null}
                anotherDescription={formData.description || ""}
                isEditing={isEditing}
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
                value={formData.description || ""}
                onChange={handleChange}
                disabled={!isEditing}
              ></textarea> */}

              <label>Изображения</label>
              <input
                type="file"
                name="images"
                onChange={handleFileChange}
                disabled={!isEditing}
                multiple
              />
              <div className={classes.imageList}>
                {formData?.images?.map((image, index) => (
                  <div
                    key={`${image.name}-${index}`} // Используйте `image.name` для уникальности ключа
                    className={`${classes.imageItem} ${
                      coverImage2 === image ? classes.selected : ""
                    }`}
                    onClick={() => handleCoverImageChange2(image)}
                  >
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Image ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className={classes.imageList}>
                {tarif?.images?.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className={`${classes.imageItem} ${
                      coverImage === image ? classes.selected : ""
                    } ${!isEditing && classes.disImage}`}
                    onClick={() => handleCoverImageChange(image)}
                  >
                    <img src={`${server}${image}`} alt={`Image ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button
              type="submit"
              onClick={handleSubmit}
              backgroundcolor={!isEditing ? "#3CBC6726" : "#0057C3"}
              color={!isEditing ? "#3B6C54" : "#fff"}
            >
              {isEditing ? (
                <>
                  Сохранить <img src="/saveDispatcher.png" alt="" />
                </>
              ) : (
                <>
                  Изменить <img src="/editDispetcher.png" alt="" />
                </>
              )}
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
