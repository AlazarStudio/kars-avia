import React, { useState, useRef, useEffect } from "react";
import classes from "./CreateRequestAllTarifCategory.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  CREATE_PRICE_TARIFFS,
  GET_AIRLINES_RELAY,
  GET_AIRPORTS_RELAY,
  GET_ALL_COMPANIES,
  GET_ALL_TARIFFS,
  getCookie,
  UPDATE_AIRLINE_TARIF,
  UPDATE_HOTEL_TARIF,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
function CreateRequestAllTarifCategory({
  show,
  id,
  onClose,
  refetchAllCategories,
  addTarif,
  setAddTarif,
  user,
  type,
  addNotification,
}) {
  const token = getCookie("token");
  // const infoAirports = useQuery(GET_AIRPORTS_RELAY, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   },
  //   skip: !show,
  // });

  // Запрос данных авиакомпаний и аэропортов
  const { data, refetch } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });

  const {
    loading,
    error,
    data: companiesData,
    refetch: companyRefetch,
  } = useQuery(GET_ALL_COMPANIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // console.log(show);

  const [airlines, setAirlines] = useState([]); // Список авиакомпаний
  const [companies, setCompanies] = useState([]); // Список авиакомпаний
  const [selectedAirline, setSelectedAirline] = useState(null); // Выбранная авиакомпания
  const [selectedCompany, setSelectedCompany] = useState(null); // Выбранная авиакомпания

  const [formData, setFormData] = useState({
    name: "",
    airlineId: "",
    companyId: "",
  });

  // const [airports, setAirports] = useState([]); // Список аэропортов

  const [createTariff] = useMutation(CREATE_PRICE_TARIFFS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // "Apollo-Require-Preflight": "true",
      },
    },
  });

  // useEffect(() => {
  //   if (infoAirports.data) {
  //     setAirports(infoAirports.data.airports || []);
  //   }
  // }, [infoAirports.data]);

  // const airportOptions = airports.map((airport) => ({
  //   label: `${airport.code} ${airport.name}, город: ${airport.city}`,
  //   id: airport.id,
  //   city: airport.city,
  //   // можно добавить и другие свойства, если понадобится
  // }));

  // useEffect(() => {
  //   setAirlines(data?.airlines?.airlines);
  //   if (show) {
  //     refetch();
  //   }
  // }, [show, data, refetch]);

  useEffect(() => {
    if (show) {
      setCompanies(companiesData?.getAllCompany);
      companyRefetch();
    }
  }, [show, companiesData, companyRefetch]);

  const [tarifNames, setTarifNames] = useState([]);
  const sidebarRef = useRef();

  const resetForm = () => {
    setFormData({
      name: "",
    });
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
      let response_update_tariff = await createTariff({
        variables: {
          updateAirlineId: id,
          input: {
            name: formData.name,
            airlineId: id,
            companyId: formData.companyId,
          },
        },
        // refetchQueries: [{ query: GET_ALL_TARIFFS }],
      });
      refetchAllCategories();
      resetForm();
      onClose();
      setIsLoading(false);
      addNotification("Добавление договора прошло успешно.", "success");
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
  //   const names = addTarif.map((tarif) => ({
  //     id: tarif.id,
  //     name: tarif.name,
  //   }));
  //   setTarifNames(names);
  // }, [addTarif]);

  // const categories = [
  //   {
  //     value: "onePlace",
  //     label: "Одноместный",
  //   },
  //   {
  //     value: "twoPlace",
  //     label: "Двухместный",
  //   },
  //   {
  //     value: "threePlace",
  //     label: "Трехместный",
  //   },
  //   {
  //     value: "fourPlace",
  //     label: "Четырехместный",
  //   },
  //   {
  //     value: "fivePlace",
  //     label: "Пятиместный",
  //   },
  //   {
  //     value: "sixPlace",
  //     label: "Шестиместный",
  //   },
  //   {
  //     value: "sevenPlace",
  //     label: "Семиместный",
  //   },
  //   {
  //     value: "eightPlace",
  //     label: "Восьмиместный",
  //   },
  // ];

  // const apartmentCategories = [
  //   {
  //     value: "apartment",
  //     label: "Апартаменты",
  //   },
  //   {
  //     value: "studio",
  //     label: "Студия",
  //   },
  // ];

  // const useCategories = type === "apartment" ? apartmentCategories : categories;

  // console.log(formData)

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить договор</div>
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
              <label>Название договора</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Например: Договор №1"
              />

              <label>Компания</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Введите компанию"}
                options={companies?.map((item) => item.name)}
                value={selectedCompany ? selectedCompany?.name : ""}
                onChange={(event, newValue) => {
                  const selectedCompany = companies.find(
                    (item) => item.name === newValue
                  );
                  setSelectedCompany(selectedCompany);
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    companyId: selectedCompany?.id || "",
                  }));
                  // setIsEdited(true);
                }}
              />
            </div>
          </div>
          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Добавить договор
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestAllTarifCategory;
