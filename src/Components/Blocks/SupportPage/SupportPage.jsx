import React, { useState, useEffect, useMemo } from "react";
import classes from "./SupportPage.module.css";
import Filter from "../Filter/Filter";
import {
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_DISPATCHER,
  GET_USER_SUPPORT_CHATS,
  getCookie,
  MESSAGE_SENT_SUBSCRIPTION,
  NEW_UNREAD_MESSAGE_SUBSCRIPTION,
} from "../../../../graphQL_requests";
import { useQuery, useSubscription } from "@apollo/client";
import Header from "../Header/Header";
import ReactPaginate from "react-paginate";
import { useLocation, useNavigate } from "react-router-dom";
import Support from "../Support/Support";
import InfoTableDataSupport from "../InfoTableDataSupport/InfoTableDataSupport";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";

function SupportPage({ children, user, ...props }) {
  const token = getCookie("token");

  const {
    loading: userLoading,
    error: userError,
    data: userData,
  } = useQuery(GET_DISPATCHER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { userId: user.userId },
    skip: !user.userId,
  });

  const { loading, error, data, refetch } = useQuery(GET_USER_SUPPORT_CHATS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  //   console.log(userData?.user);

  // const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  // const [companyData, setCompanyData] = useState([]);
  // const [filterData, setFilterData] = useState({ filterSelect: "" });
  const [searchQuery, setSearchQuery] = useState("");
  // const [isSearching, setIsSearching] = useState(false); // Флаг, указывающий, идёт ли поиск
  // const [allFilteredData, setAllFilteredData] = useState([]); // Хранилище всех данных для поиска

  // const { data: dataSubscription } = useSubscription(
  //   GET_AIRLINES_SUBSCRIPTION,
  //   {
  //     context: {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     },
  //   }
  // );
  const { data: dataSubscriptionUpd } = useSubscription(MESSAGE_SENT_SUBSCRIPTION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    onData: () => {
      refetch();
    },
  });

  // console.log(dataSubscriptionUpd);
  

  const location = useLocation();
  // const navigate = useNavigate();

  // Получение текущей страницы из URL
  const pageNumber = new URLSearchParams(location.search).get("page");
  const currentPage = pageNumber ? parseInt(pageNumber) - 1 : 0;

  const [pageInfo, setPageInfo] = useState({ skip: currentPage, take: 20 });

  const handleSelectId = (id) => {
    setSelectedId(id);
    toggleRequestSidebar(); // Открытие боковой панели
  };

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
  };

  //   const handleSearch = async (e) => {
  //     const query = e.target.value;
  //     setSearchQuery(query);

  //     if (query.trim() == "") {
  //       // Если строка поиска пуста, возвращаемся к стандартному режиму
  //       setIsSearching(false);
  //       refetch({
  //         pagination: { skip: currentPage, take: 20 }, // Загрузить большое количество данных для поиска
  //       }); // Запускаем повторный запрос с пагинацией
  //       return;
  //     }

  //     setIsSearching(true); // Активируем режим поиска

  //     try {
  //       const { data } = await refetch({
  //         pagination: { all: true }, // Загрузить большое количество данных для поиска
  //       });

  //       if (data && data.airlines?.airlines) {
  //         setAllFilteredData(data.airlines.airlines); // Сохраняем все данные для локального поиска
  //       }
  //     } catch (err) {
  //       console.error("Ошибка при поиске:", err);
  //     }
  //   };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRequests = useMemo(() => {
    const dataSource = data?.supportChats || []; // Если data?.supportChats - undefined, используем пустой массив
    return dataSource.filter((request) =>
      request.participants[0]?.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]); // Не забудьте добавить `data` в зависимости

  // Пагинация: общее количество страниц
  //   const totalPages = data?.airlines?.totalPages;

  // Корректировка текущей страницы
  //   const validCurrentPage = currentPage < totalPages ? currentPage : 0;

  // Пагинация: вычисляем элементы для отображения на текущей странице
  // const paginatedRequests = useMemo(() => {
  //     const start = pageInfo.skip * pageInfo.take;
  //     const end = start + pageInfo.take;
  //     return filteredRequests.slice(start, end);
  // }, [filteredRequests, pageInfo]);

  //   const handlePageClick = (event) => {
  //     const selectedPage = event.selected;
  //     setPageInfo((prev) => ({ ...prev, skip: selectedPage }));
  //     navigate(`?page=${selectedPage + 1}`);
  //   };

  // let filterList = ["Москва", "Санкт-Петербург"];

  return (
    <>
      <div className={classes.section}>
        <Header>Поддержка</Header>

        <div className={classes.section_searchAndFilter}>
          <MUITextField
            label={"Поиск"}
            className={classes.mainSearch}
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {loading && <MUILoader fullHeight={"100vh"} />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <>
            <InfoTableDataSupport
              toggleRequestSidebar={toggleRequestSidebar}
              requests={filteredRequests.map((request, index) => ({
                ...request,
                order: pageInfo.skip * pageInfo.take + index + 1, // Добавляем порядковый номер
              }))}
              pageInfo={pageInfo.skip}
              onSelectId={handleSelectId}
              user={userData?.user}
            />

            {/* {totalPages > 0 && (
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
                        )} */}
          </>
        )}

        <Support
          show={showRequestSidebar}
          onClose={toggleRequestSidebar}
          user={userData?.user}
          selectedId={selectedId}
          supportRefetch={refetch}
        />
      </div>
    </>
  );
}

export default SupportPage;
