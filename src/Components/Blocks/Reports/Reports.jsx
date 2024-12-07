import React, { useState, useRef, useEffect } from "react";
import classes from "./Reports.module.css";
import Filter from "../Filter/Filter";
import CreateRequestCompany from "../CreateRequestCompany/CreateRequestCompany";
import { requestsReports } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataCompany from "../InfoTableDataCompany/InfoTableDataCompany";
import ExistRequestCompany from "../ExistRequestCompany/ExistRequestCompany";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import InfoTableDataReports from "../InfoTableDataReports/InfoTableDataReports";
import CreateRequestReport from "../CreateRequestReport/CreateRequestReport";
import ExistRequestReport from "../ExistRequestReport/ExistRequestReport";
import { useQuery } from "@apollo/client";
import {
  convertToDate,
  decodeJWT,
  GET_AIRLINE_REPORT,
  GET_HOTEL_REPORT,
  getCookie,
} from "../../../../graphQL_requests";
import { roles } from "../../../roles";

function Reports({ children, ...props }) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [chooseObject, setChooseObject] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [reports, setReports] = useState([]);

  // Получаем значение isAirline из localStorage, если оно существует
  const savedIsAirline = localStorage.getItem("isAirline");
  const initialIsAirline = savedIsAirline ? JSON.parse(savedIsAirline) : true;

  const [isAirline, setIsAirline] = useState(initialIsAirline);

  // Проверяем роль пользователя и обновляем isAirline
  useEffect(() => {
    if (user.role === roles.hotelAdmin) {
      setIsAirline(false);
    }
    if (user.role === roles.airlineAdmin) {
      setIsAirline(true);
    }
    if (user.role === roles.superAdmin || user.role === roles.dispatcerAdmin) {
      setIsAirline(isAirline);
    }
  }, [user.role]);

  // Сохраняем isAirline в localStorage при его изменении
  useEffect(() => {
    if (isAirline !== null) {
      localStorage.setItem("isAirline", JSON.stringify(isAirline));
    }
  }, [isAirline]);

  // {
  //   user.role !== roles.superAdmin || user.role !== roles.dispatcerAdmin
  // }
  // useEffect(() => {
  //   user.role === roles.hotelAdmin ? setIsAirline(false) : setIsAirline(true);
  // }, [user]);

  const deleteComponentRef = useRef();

  // Получаем текущий год
  const currentYear = new Date().getFullYear();

  // Устанавливаем endDate как последний день текущего года
  const endDate1 = new Date(currentYear, 11, 31).toISOString().split("T")[0];

  const { data: companyData } = useQuery(
    isAirline ? GET_AIRLINE_REPORT : GET_HOTEL_REPORT,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        filter: {
          startDate: "0000-00-00T12:00:00.000Z",
          endDate: endDate1,
          airlineId: null,
          hotelId: null,
          personId: null,
        },
      },
    }
  );

  // const addDispatcher = (newDispatcher) => {
  //     setCompanyData([...companyData, newDispatcher]);
  // };

  // const updateDispatcher = (updatedDispatcher, index) => {
  //     const newData = [...companyData];
  //     newData[index] = updatedDispatcher;
  //     setCompanyData(newData);
  // };

  // const deleteDispatcher = (index) => {
  //     setCompanyData(companyData.filter((_, i) => i !== index));
  //     setShowDelete(false);
  //     setShowRequestSidebar(false);
  // };

  const toggleCreateSidebar = () => {
    setShowCreateSidebar(!showCreateSidebar);
  };

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
  };

  const openDeleteComponent = (index) => {
    setShowDelete(true);
    setDeleteIndex(index);
    setShowRequestSidebar(false); // Закрываем боковую панель при открытии компонента удаления
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
    setShowRequestSidebar(true); // Открываем боковую панель при закрытии компонента удаления
  };

  const [filterData, setFilterData] = useState({
    filterSelect: "",
  });

  const [searchQuery, setSearchQuery] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilterData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    if (companyData && companyData) {
      setReports(
        isAirline
          ? companyData.getAirlineReport[0].reports
          : companyData.getHotelReport[0].reports
      );
    }
  }, [companyData]);

  const filteredRequests = reports.filter((request) => {
    const name = isAirline ? request?.airline?.name : request?.hotel?.name;
    const createTime = convertToDate(request?.createdAt);
    const startTime = convertToDate(request?.startDate);
    const endTime = convertToDate(request?.endDate);
    return (
      name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      createTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endTime.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // console.log(reports);

  let filterList = ["Азимут"];

  return (
    <>
      <div className={classes.section}>
        <Header>Отчеты</Header>

        <div className={classes.section_searchAndFilter}>
          <input
            type="text"
            placeholder="Поиск"
            style={{ width: "500px" }}
            value={searchQuery}
            onChange={handleSearch}
          />
          <Filter
            toggleSidebar={toggleCreateSidebar}
            handleChange={handleChange}
            filterData={filterData}
            buttonTitle={"Создать отчет"}
            filterList={filterList}
            needDate={false}
          />
        </div>

        <InfoTableDataReports
          user={user}
          toggleRequestSidebar={toggleRequestSidebar}
          requests={filteredRequests}
          isAirline={isAirline}
          setIsAirline={setIsAirline}
          setChooseObject={setChooseObject}
          openDeleteComponent={openDeleteComponent}
        />

        <CreateRequestReport
          show={showCreateSidebar}
          onClose={toggleCreateSidebar}
          //   addDispatcher={addDispatcher}
        />
        {/* 
                <ExistRequestReport 
                    show={showRequestSidebar} 
                    onClose={toggleRequestSidebar} 
                    chooseObject={chooseObject} 
                    updateDispatcher={updateDispatcher} 
                    openDeleteComponent={openDeleteComponent} 
                    deleteComponentRef={deleteComponentRef}
                    filterList={filterList}
                /> */}

        {showDelete && (
          <DeleteComponent
            ref={deleteComponentRef}
            remove={() => deleteDispatcher(deleteIndex)}
            close={closeDeleteComponent}
            title={`Вы действительно хотите удалить отчет?`}
          />
        )}
      </div>
    </>
  );
}

export default Reports;
