import React, { useState, useEffect, useMemo } from "react";
import classes from "./DriversList.module.css";
import Header from "../Header/Header";
import { useQuery, useSubscription } from "@apollo/client";
import {
  DRIVERS_QUERY,
  DRIVER_UPDATED_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import Notification from "../../Notification/Notification";
import { fullNotifyTime, notifyTime } from "../../../roles";
import { useLocation, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import InfoTableDataDriversCompany from "../InfoTableDataDriversCompany/InfoTableDataDriversCompany";
import ConfirmDriver from "../ConfirmDriver/ConfirmDriver";

function DriversList({ children, user, disAdmin, ...props }) {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  // Получение текущей страницы из URL
  const pageNumber = new URLSearchParams(location.search).get("page");
  const currentPage = pageNumber ? parseInt(pageNumber) - 1 : 0;

  const [pageInfo, setPageInfo] = useState({ skip: currentPage, take: 20 });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false); // Флаг, указывающий, идёт ли поиск
  const [allFilteredData, setAllFilteredData] = useState([]); // Хранилище всех данных для поиска

  const { loading, error, data, refetch } = useQuery(DRIVERS_QUERY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { pagination: { skip: pageInfo.skip, take: pageInfo.take } },
  });

  const { data: subscriptionData, error: subCreateError } = useSubscription(
    DRIVER_UPDATED_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: ({ data }) => {
        refetch(); // Обновляем данные
      },
      onError: (error) => {
        console.error("Ошибка подписки на обновление водителя:", error);
      },
    }
  );

  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [chooseObject, setChooseObject] = useState(null);

  const [companyData, setCompanyData] = useState([]);

  useEffect(() => {
    if (data && data.drivers) {
      const sortedDrivers = [...data.drivers.drivers].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setCompanyData(sortedDrivers);
    }
    refetch();
  }, [data, subscriptionData, refetch]);

  const updateDriver = (updatedDriver, index) => {
    const newData = [...companyData];
    newData[index] = updatedDriver;
    setCompanyData(newData.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
  };


  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() == "") {
      // Если строка поиска пуста, возвращаемся к стандартному режиму
      setIsSearching(false);
      refetch({
        pagination: { skip: currentPage, take: 20 }, // Загрузить большое количество данных для поиска
      }); // Запускаем повторный запрос с пагинацией
      return;
    }

    setIsSearching(true); // Активируем режим поиска

    try {
      const { data } = await refetch({
        pagination: { all: true }, // Загрузить большое количество данных для поиска
      });

      if (data && data.drivers?.drivers) {
        setAllFilteredData(data.drivers.drivers); // Сохраняем все данные для локального поиска
      }
    } catch (err) {
      console.error("Ошибка при поиске:", err);
    }
  };

  // Фильтрация запросов по имени водителя, машине, номеру прав
  const filteredRequests = useMemo(() => {
    const dataSource = isSearching ? allFilteredData : companyData; // Используем данные из поиска или стандартные
    return dataSource.filter((request) =>
      request.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.car?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.driverLicenseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [isSearching, allFilteredData, companyData, searchQuery]);

  // Пагинация: общее количество страниц
  const totalPages = data?.drivers?.totalPages || 1;

  // Корректировка текущей страницы
  const validCurrentPage = currentPage < totalPages ? currentPage : 0;

  // Обработчик для изменения текущей страницы при клике на элементы пагинации
  const handlePageClick = (event) => {
    const selectedPage = event.selected;
    setPageInfo((prev) => ({ ...prev, skip: selectedPage }));
    navigate(`?page=${selectedPage + 1}`);
  };

  return (
    <>
      <div className={classes.section} style={disAdmin ? { padding: "0" } : {}}>
        {!disAdmin && <Header>Водители</Header>}

        <div className={classes.section_searchAndFilter}>
          <MUITextField
            label={"Поиск"}
            className={classes.mainSearch}
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {loading && <MUILoader fullHeight={"70vh"} />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <>
            <InfoTableDataDriversCompany
              user={user}
              toggleRequestSidebar={toggleRequestSidebar}
              requests={filteredRequests.map((request, index) => ({
                ...request,
                order: pageInfo.skip * pageInfo.take + index + 1, // Добавляем порядковый номер
              }))}
              setChooseObject={setChooseObject}
              choosePersonId={chooseObject?.id}
              disAdmin={disAdmin}
            />

            {totalPages > 0 && (
              <div className={classes.pagination}>
                <ReactPaginate
                  previousLabel={"←"}
                  nextLabel={"→"}
                  breakLabel={"..."}
                  pageCount={totalPages}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={5}
                  onPageChange={handlePageClick}
                  forcePage={validCurrentPage}
                  containerClassName={classes.pagination}
                  activeClassName={classes.activePaginationNumber}
                  pageLinkClassName={classes.paginationNumber}
                />
              </div>
            )}
          </>
        )}

        <ConfirmDriver
          show={showRequestSidebar}
          confirm={true}
          onClose={toggleRequestSidebar}
          chooseObject={chooseObject}
          updateDriver={updateDriver}
          addNotification={addNotification}
        />
        {notifications.map((n, index) => (
          <Notification
            key={n.id}
            text={n.text}
            status={n.status}
            index={index}
            time={notifyTime}
            onClose={() => {
              setNotifications((prev) =>
                prev.filter((notif) => notif.id !== n.id)
              );
            }}
          />
        ))}
      </div>
    </>
  );
}

export default DriversList;
