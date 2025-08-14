import React, { useState, useRef, useEffect } from "react";
import classes from "./EditRequestAllTarifCategory.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  GET_AIRPORTS_RELAY,
  GET_ALL_COMPANIES,
  getCookie,
  UPDATE_AIRLINE_TARIF,
  UPDATE_HOTEL_TARIF,
  UPDATE_PRICE_TARIFFS,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";

function EditRequestAllTarifCategory({
  show,
  onClose,
  tarif,
  onSubmit,
  addTarif,
  id,
  setAddTarif,
  refetchAllCategories,
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
  // });

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

  // console.log(tarif);
  const [companies, setCompanies] = useState([]); // Список авиакомпаний
  // const [selectedCompany, setSelectedCompany] = useState(null); // Выбранная авиакомпания

  const [formData, setFormData] = useState({
    id: tarif?.id || "",
    name: tarif?.name || "",
    companyId: tarif?.company?.id || "",
  });

  // const [airports, setAirports] = useState([]); // Список аэропортов

  // const [updateAirlineTariff] = useMutation(UPDATE_AIRLINE_TARIF, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   },
  // });

  const [updateTariffCategory] = useMutation(UPDATE_PRICE_TARIFFS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // useEffect(() => {
  //   if (infoAirports.data) {
  //     setAirports(infoAirports.data.airports || []);
  //   }
  // }, [infoAirports.data]);

  // const airportOptions = airports.map((airport) => ({
  //   value: String(airport.id), // используем value вместо id
  //   label: `${airport.code} ${airport.name}, город: ${airport.city}`,
  //   city: airport.city,
  // }));

  const [tarifNames, setTarifNames] = useState([]);
  const sidebarRef = useRef();

  const resetForm = () => {
    setFormData({
      id: tarif?.id || "",
      name: tarif?.name || "",
      companyId: tarif?.company?.id || "",
    });
  };

  const [isEditing, setIsEditing] = useState(false);

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
    if (isEditing) {
      e.preventDefault();
      setIsLoading(true);

      try {
        let response_update_tariff = await updateTariffCategory({
          variables: {
            input: {
              id: tarif?.id,
              name: formData.name,
              companyId: formData.companyId,
            },
          },
        });
        resetForm();
        onClose();
        setIsLoading(false);
        addNotification("Изменение договора прошло успешно.", "success");
        refetchAllCategories();
      } catch (error) {
        setIsLoading(false);
        alert("Произошло ошибка при изменении договора.");
        console.error("Произошла ошибка при выполнении запроса:", error);
      }
    }
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    if (show) {
      setCompanies(companiesData?.getAllCompany);
      companyRefetch();
    }
  }, [show, companiesData, companyRefetch]);

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

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Изменить договор</div>
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
                disabled={!isEditing}
              />

              <label>Компания</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Введите компанию"}
                options={companies?.map((item) => item.name)}
                value={
                  companies.find((item) => item.id === formData.companyId)?.name ||
                  null
                }
                onChange={(event, newValue) => {
                  const selectedCompany = companies.find(
                    (item) => item.name === newValue
                  );
                  // setSelectedCompany(selectedCompany);
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    companyId: selectedCompany?.id || "",
                  }));
                  // setIsEdited(true);
                }}
                isDisabled={!isEditing}
              />
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

export default EditRequestAllTarifCategory;
