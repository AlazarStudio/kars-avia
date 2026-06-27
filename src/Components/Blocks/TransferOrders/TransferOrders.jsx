import React, { useEffect, useState, useMemo } from "react";
import classes from "./TransferOrders.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import Filter from "../Filter/Filter.jsx";
import FilterPopoverButton from "../FilterPopoverButton/FilterPopoverButton.jsx";
import Header from "../Header/Header.jsx";
import {
  GET_AIRLINE,
  getCookie,
  GET_TRANSFER_REQUESTS,
  UPDATE_TRANSFER_REQUEST_MUTATION,
  TRANSFER_CREATED_SUBSCRIPTION,
  TRANSFER_UPDATED_SUBSCRIPTION,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import ReactPaginate from "react-paginate";
import MUITextField from "../MUITextField/MUITextField.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
import { useDebounce } from "../../../hooks/useDebounce.jsx";
import InfoTableDataTransferOrders from "../InfoTableDataTransferOrders/InfoTableDataTransferOrders.jsx";
import Button from "../../Standart/Button/Button.jsx";
import CreateTransferRequest from "../CreateTransferRequest/CreateTransferRequest.jsx";
import ExistRequestTransfer from "../ExistRequestTransfer/ExistRequestTransfer.jsx";
import { hasAccessMenu } from "../../../utils/access";

// Основной компонент страницы, отображающий список заявок с возможностью фильтрации, поиска и пагинации
function TransferOrders({ user, disAdmin, accessMenu }) {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  const { search, pathname } = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  // Инициализация текущей страницы на основе параметров URL или по умолчанию
  const pageNumberTransfer = new URLSearchParams(location.search).get("page");
  const currentPageTransfer = pageNumberTransfer
    ? parseInt(pageNumberTransfer) - 1
    : 0;

  // Состояние для фильтрации по статусу. Получаем фильтр из localStorage или устанавливаем значение по умолчанию
  const [statusFilterTransfer, setStatusFilter] = useState(() => {
    const raw = localStorage.getItem("statusFilterTransfer");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // старое строковое значение ("all" / одиночный статус)
    }
    return raw && raw !== "all" ? [raw] : [];
  });

  const [selectedAirline, setSelectedAirline] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Состояние для хранения информации о странице (для пагинации)
  const [pageInfo, setPageInfo] = useState({
    skip: currentPageTransfer,
    take: 50,
  });

  // Запрос на получение списка заявок с использованием параметров пагинации
  const { loading, error, data, refetch } = useQuery(GET_TRANSFER_REQUESTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: {
        // skip — смещение строк (индекс страницы * размер), а не номер страницы
        skip: pageInfo.skip * pageInfo.take,
        take: pageInfo.take,
        search: debouncedSearch?.trim() || undefined,
        status: statusFilterTransfer.length ? statusFilterTransfer : undefined,
        airlineId: selectedAirline?.id || undefined,
        organizationId: selectedOrganization?.id || undefined,
        driverId: selectedDriver?.id || undefined,
        scheduledFrom: dateRange.startDate
          ? dateRange.startDate.toISOString()
          : undefined,
        scheduledTo: dateRange.endDate
          ? dateRange.endDate.toISOString()
          : undefined,
      },
    },
  });

  // Подписки для отслеживания создания и обновления заявок
  const { data: subscriptionData, error: subCreateError } = useSubscription(
    TRANSFER_CREATED_SUBSCRIPTION,
    {
      onData: ({ data }) => {
        // console.log("Новая заявка создана:", data.data?.transferCreated);
        refetch(); // Обновляем данные
      },
      onError: (error) => {
        console.error("Ошибка подписки на создание:", error);
      },
    },
  );
  const { data: subscriptionUpdateData } = useSubscription(
    TRANSFER_UPDATED_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
    },
  );

  // Локальное состояние для хранения новых заявок и всех заявок
  const [newRequests, setNewRequests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // Обновление списка заявок на основе данных запроса и новых заявок
  useEffect(() => {
    if (data && data.transfers?.transfers) {
      let nextRequests = [...data.transfers.transfers];
      if (currentPageTransfer === 0 && newRequests.length > 0) {
        nextRequests = [...newRequests, ...nextRequests];
        setNewRequests([]);
      }

      setRequests(nextRequests);
      setTotalPages(data.transfers.totalPages);
    }
  }, [data, currentPageTransfer, newRequests, refetch]);

  const resetToFirstPage = () => {
    setPageInfo((prev) => ({ ...prev, skip: 0 }));
    navigate("?page=1", { replace: true });
  };

  // Обновление состояния фильтрации по статусу
  const handleStatusChange = (values) => {
    const arr = Array.isArray(values) ? values : [];
    setStatusFilter(arr);
    localStorage.setItem("statusFilterTransfer", JSON.stringify(arr));
    resetToFirstPage();
  };

  // Управление состоянием боковых панелей для создания и просмотра заявок
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [existRequestData, setExistRequestData] = useState(null); // Для хранения данных match
  const [chooseObject, setChooseObject] = useState([]);
  const [chooseRequestID, setChooseRequestID] = useState();

  // Функции для переключения видимости боковых панелей
  const toggleCreateSidebar = () => setShowCreateSidebar(!showCreateSidebar);
  const toggleRequestSidebar = () => setShowRequestSidebar(!showRequestSidebar);

  const canCreateTransfer = accessMenu
    ? hasAccessMenu(accessMenu, "transferCreate")
    : true;
  const canChatTransfer = accessMenu
    ? hasAccessMenu(accessMenu, "transferChat")
    : true;
  const canUpdateTransfer = accessMenu
    ? hasAccessMenu(accessMenu, "transferUpdate")
    : true;

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    resetToFirstPage();
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    resetToFirstPage();
  };

  const handleAirlineChange = (airline) => {
    setSelectedAirline(airline);
    resetToFirstPage();
  };

  const handleOrganizationChange = (organization) => {
    setSelectedOrganization(organization);
    resetToFirstPage();
  };

  const handleDriverChange = (driver) => {
    setSelectedDriver(driver);
    resetToFirstPage();
  };

  const activeFilterCount =
    (statusFilterTransfer.length ? 1 : 0) +
    (dateRange.startDate || dateRange.endDate ? 1 : 0) +
    (selectedAirline ? 1 : 0) +
    (selectedOrganization ? 1 : 0) +
    (selectedDriver ? 1 : 0);

  const handleResetFilters = () => {
    setStatusFilter([]);
    localStorage.setItem("statusFilterTransfer", JSON.stringify([]));
    setDateRange({ startDate: null, endDate: null });
    setSelectedAirline(null);
    setSelectedOrganization(null);
    setSelectedDriver(null);
    resetToFirstPage();
  };

  const handleOpenExistRequest = (matchData) => {
    const transferId =
      typeof matchData === "object" && matchData?.id ? matchData.id : matchData;
    setExistRequestData(matchData);
    setChooseRequestID(transferId);
    setShowRequestSidebar(true);
  };

  const handleSelectTransfer = (transferId) => {
    navigate(`/orders/${transferId}`);
  };

  const [showDelete, setShowDelete] = useState(false);

  const [requestId, setRequestId] = useState();

  const setChooseRequestId = (id) => {
    setRequestId(id);
  };

  // Отмена трансфера через updateTransfer (смена статуса)
  const [updateTransferMutation] = useMutation(
    UPDATE_TRANSFER_REQUEST_MUTATION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );

  const handleCancelRequest = async (id) => {
    if (!canUpdateTransfer) return;
    try {
      await updateTransferMutation({
        variables: {
          updateTransferId: id,
          input: {
            status: "CANCELLED",
          },
        },
      });
      await refetch();
    } catch (error) {
      console.error("Ошибка при отмене заявки:", JSON.stringify(error));
    }
  };

  const openDeleteComponent = () => {
    setShowDelete(true);
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
  };

  // Запрос для получения имени авиакомпании пользователя
  const [airlineName, setAirlineName] = useState();
  const { data: airlineData } = useQuery(GET_AIRLINE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { airlineId: user.airlineId },
  });

  useEffect(() => {
    if (airlineData) setAirlineName(airlineData.airline.name);
  }, [airlineData]);

  // Фильтрация выполняется на сервере; на клиенте остаётся только сортировка текущей страницы.
  // Сортировка: сначала заявки до которых < 2 часов, потом на сегодня, потом остальные по scheduledPickupAt
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const aScheduledTime = a.scheduledPickupAt
        ? new Date(a.scheduledPickupAt)
        : null;
      const bScheduledTime = b.scheduledPickupAt
        ? new Date(b.scheduledPickupAt)
        : null;

      // Если нет времени начала, помещаем в конец
      if (!aScheduledTime && !bScheduledTime) return 0;
      if (!aScheduledTime) return 1;
      if (!bScheduledTime) return -1;

      const now = new Date();
      const twoHoursInMs = 2 * 60 * 60 * 1000;

      // Проверяем, до заявки меньше 2 часов
      const aTimeDiff = aScheduledTime.getTime() - now.getTime();
      const bTimeDiff = bScheduledTime.getTime() - now.getTime();

      const aIsLessThan2Hours = aTimeDiff > 0 && aTimeDiff < twoHoursInMs;
      const bIsLessThan2Hours = bTimeDiff > 0 && bTimeDiff < twoHoursInMs;

      // Если одна заявка до которой < 2 часов, а другая нет - та что < 2 часов вверху
      if (aIsLessThan2Hours && !bIsLessThan2Hours) return -1;
      if (!aIsLessThan2Hours && bIsLessThan2Hours) return 1;

      // Если обе до которых < 2 часов - сортируем по времени (ближайшие вверху)
      if (aIsLessThan2Hours && bIsLessThan2Hours) {
        return aScheduledTime.getTime() - bScheduledTime.getTime();
      }

      // Проверяем, является ли заявка сегодняшней
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const aDate = new Date(aScheduledTime);
      aDate.setHours(0, 0, 0, 0);
      const bDate = new Date(bScheduledTime);
      bDate.setHours(0, 0, 0, 0);

      const aIsToday = aDate.getTime() === today.getTime();
      const bIsToday = bDate.getTime() === today.getTime();

      // Если одна заявка на сегодня, а другая нет - сегодняшняя вверху
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;

      // Если обе на сегодня или обе не на сегодня - сортируем по времени (новые вверху)
      return bScheduledTime.getTime() - aScheduledTime.getTime();
    });
  }, [requests]);

  // Текущая страница из URL (0-based)
  const urlPage = useMemo(() => {
    const p = Number(new URLSearchParams(search).get("page") || "1");
    return Math.max(0, p - 1);
  }, [search]);

  // Синхронизируем внутренний стейт пагинации со значением из URL
  useEffect(() => {
    setPageInfo((prev) =>
      prev.skip === urlPage ? prev : { ...prev, skip: urlPage },
    );
  }, [urlPage]);

  // Если открыли /orders без ?page — проставим ?page=1
  useEffect(() => {
    if (pathname === "/orders" && !new URLSearchParams(search).has("page")) {
      navigate("?page=1", { replace: true });
    }
  }, [pathname, search, navigate]);

  // Обработчик для изменения текущей страницы при клике на элементы пагинации
  const handlePageClick = (event) => {
    const selectedPage = event.selected;
    setPageInfo((prev) => ({ ...prev, skip: selectedPage }));
    navigate(`?page=${selectedPage + 1}`);
  };

  // Корректировка текущей страницы
  const validCurrentPage = urlPage < totalPages ? urlPage : 0;

  return (
    <div
      className={classes.section}
      style={disAdmin ? { padding: "0px", overflow: "visible" } : {}}
    >
      {!disAdmin && <Header>Трансфер</Header>}
      <div className={classes.section_searchAndFilter}>
        <FilterPopoverButton
          activeCount={activeFilterCount}
          onReset={handleResetFilters}
        >
          <Filter
            vertical
            user={user}
            isEstafeta={true}
            isVisibleAirFiler={true}
            transfer={true}
            toggleSidebar={toggleCreateSidebar}
            statusValues={statusFilterTransfer}
            handleStatusChange={handleStatusChange}
            initialRange={dateRange}
            onRangeChange={handleDateRangeChange}
            selectedAirline={selectedAirline}
            onAirlineChange={handleAirlineChange}
            selectedOrganization={selectedOrganization}
            onOrganizationChange={handleOrganizationChange}
            selectedDriver={selectedDriver}
            onDriverChange={handleDriverChange}
          />
        </FilterPopoverButton>
        <MUITextField
          className={classes.mainSearch}
          label={"Поиск"}
          value={searchQuery}
          onChange={handleSearch}
        />
        {canCreateTransfer && (
          <Button onClick={toggleCreateSidebar}>Создать заявку</Button>
        )}
      </div>
      {loading && <MUILoader fullHeight={"70vh"} />}
      {error && <p>Error: {error.message}</p>}

      {/* Отображение таблицы заявок и компонентов пагинации */}
      {!loading && !error && (
        <>
          <InfoTableDataTransferOrders
            user={user}
            disAdmin={disAdmin}
            token={token}
            canChat={canChatTransfer}
            toggleRequestSidebar={toggleRequestSidebar}
            onSelectTransfer={handleSelectTransfer}
            requests={sortedRequests}
            chooseRequestID={chooseRequestID}
            setChooseObject={setChooseObject}
            setChooseRequestID={setChooseRequestID}
            pageInfo={pageInfo.skip}
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
      {/* Боковые панели для создания и выбора заявок */}
      <CreateTransferRequest
        show={showCreateSidebar}
        onClose={toggleCreateSidebar}
        onMatchFound={handleOpenExistRequest}
        user={user}
      />
      <ExistRequestTransfer
        show={showRequestSidebar}
        onClose={toggleRequestSidebar}
        chooseRequestID={chooseRequestID}
        user={user}
        accessMenu={accessMenu}
        setChooseRequestID={setChooseRequestID}
        canChat={canChatTransfer}
        canUpdate={canUpdateTransfer}
        openDeleteComponent={openDeleteComponent}
        setRequestId={setChooseRequestId}
      />
      {showDelete && (
        <DeleteComponent
          remove={() => {
            handleCancelRequest(requestId);
            closeDeleteComponent();
            setShowRequestSidebar(false);
          }}
          index={requestId}
          close={closeDeleteComponent}
          title={`Вы действительно хотите отменить заявку? `}
          isCancel={true}
        />
      )}
    </div>
  );
}

export default TransferOrders;
