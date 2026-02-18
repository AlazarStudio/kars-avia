import React, { useState, useRef, useEffect } from "react";
import classes from "./TransferCompany.module.css";
import Filter from "../Filter/Filter";
import CreateRequestTransferCompany from "../CreateRequestTransferCompany/CreateRequestTransferCompany";
import { requestsCompany } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataCompany from "../InfoTableDataCompany/InfoTableDataCompany";
import ExistRequestTransferCompany from "../ExistRequestTransferCompany/ExistRequestTransferCompany";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  DELETE_DISPATCHER_USER,
  GET_DISPATCHER_POSITIONS,
  GET_DISPATCHERS,
  GET_DISPATCHERS_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import Notification from "../../Notification/Notification";
import { fullNotifyTime, notifyTime } from "../../../roles";
import { useLocation, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";

function TransferCompany({ children, user, disAdmin, ...props }) {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  // Инициализация текущей страницы на основе параметров URL или по умолчанию
  const pageNumberRelay = new URLSearchParams(location.search).get("page");
  const currentPageRelay = pageNumberRelay ? parseInt(pageNumberRelay) - 1 : 0;

  const [pageInfo, setPageInfo] = useState({
    skip: currentPageRelay,
    take: 20,
  });

  const { loading, error, data, refetch } = useQuery(GET_DISPATCHERS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: {
        skip: pageInfo.skip,
        take: pageInfo.take,
        category: "transfer",
      },
    },
  });

  const { data: dataSubscription } = useSubscription(
    GET_DISPATCHERS_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const {
    loading: positionsLoading,
    error: positionsError,
    data: positionsData,
  } = useQuery(GET_DISPATCHER_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [chooseObject, setChooseObject] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [totalPages, setTotalPages] = useState(1);

  const deleteComponentRef = useRef();

  const [companyData, setCompanyData] = useState([]);

  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (data) {
      const sortedDispatchers = [...data.dispatcherUsers.users].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setCompanyData(sortedDispatchers);
      setTotalPages(data.dispatcherUsers.totalPages);
    }
    refetch();
  }, [data, dataSubscription, refetch]);

  useEffect(() => {
    if (positionsData) {
      const filteredPositions = positionsData?.getDispatcherPositions?.filter(
        (position) => position.category === "transfer"
      ) || [];
      setPositions(filteredPositions);
    }
  }, [positionsData]);

  const addDispatcher = (newDispatcher) => {
    setCompanyData(
      [...companyData, newDispatcher].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
  };

  const updateDispatcher = (updatedDispatcher, index) => {
    const newData = [...companyData];
    newData[index] = updatedDispatcher;
    setCompanyData(newData.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const [deleteDispatcherUser] = useMutation(DELETE_DISPATCHER_USER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });

  const deleteDispatcher = async (index, userID) => {
    try {
      let response_delete_user = await deleteDispatcherUser({
        variables: {
          deleteUserId: userID,
        },
      });
      if (response_delete_user) {
        setCompanyData(companyData.filter((_, i) => i !== index));
        setShowDelete(false);
        setShowRequestSidebar(false);
        addNotification("Удаление диспетчера прошло успешно.", "success");
      }
    } catch (error) {
      console.error("Ошибка при удалении пользователя", error);
      // addNotification(
      //   "Ошибка, у вас недостаточно прав для удаления диспетчера.",
      //   "error"
      // );
      alert("Ошибка при удалении пользователя");
    }
  };

  const toggleCreateSidebar = () => {
    setShowCreateSidebar(!showCreateSidebar);
  };

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
  };

  const openDeleteComponent = (index, userID) => {
    setShowDelete(true);
    setDeleteIndex({ index, userID });
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
  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };
  // Обработчик для изменения текущей страницы при клике на элементы пагинации
  const handlePageClick = (event) => {
    const selectedPage = event.selected;
    setPageInfo((prev) => ({ ...prev, skip: selectedPage }));
    navigate(`?page=${selectedPage + 1}`);
  };

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

  const filteredRequests = companyData.filter((request) => {
    return (
      (filterData.filterSelect === "" ||
        request.role.includes(filterData.filterSelect)) &&
      (request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.position?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  let filterList = ["Модератор", "Администратор"];
  const validCurrentPage = currentPageRelay < totalPages ? currentPageRelay : 0;

  return (
    <>
      <div
        className={classes.section}
        style={disAdmin ? { padding: "0px" } : {}}
      >
        {!disAdmin && <Header>Пользователи</Header>}

        <div className={classes.section_searchAndFilter}>
          <MUITextField
            label={"Поиск"}
            className={classes.mainSearch}
            value={searchQuery}
            onChange={handleSearch}
          />
          <Filter
            toggleSidebar={toggleCreateSidebar}
            handleChange={handleChange}
            filterData={filterData}
            buttonTitle={"Добавить аккаунт диспетчера"}
            filterList={filterList}
            needDate={false}
          />
        </div>
        {loading && <MUILoader />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <>
            <InfoTableDataCompany
              toggleRequestSidebar={toggleRequestSidebar}
              requests={filteredRequests.map((request, index) => ({
                ...request,
                order: pageInfo.skip * pageInfo.take + index + 1, // Добавляем порядковый номер
              }))}
              setChooseObject={setChooseObject}
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

        <CreateRequestTransferCompany
          show={showCreateSidebar}
          onClose={toggleCreateSidebar}
          addDispatcher={addDispatcher}
          positions={positions}
          addNotification={addNotification}
        />

        <ExistRequestTransferCompany
          show={showRequestSidebar}
          onClose={toggleRequestSidebar}
          chooseObject={chooseObject}
          updateDispatcher={updateDispatcher}
          openDeleteComponent={openDeleteComponent}
          deleteComponentRef={deleteComponentRef}
          filterList={filterList}
          positions={positions}
          addNotification={addNotification}
        />

        {showDelete && (
          <DeleteComponent
            ref={deleteComponentRef}
            remove={() =>
              deleteDispatcher(deleteIndex.index, deleteIndex.userID)
            }
            close={closeDeleteComponent}
            title={`Вы действительно хотите удалить диспетчера?`}
          />
        )}
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

export default TransferCompany;

