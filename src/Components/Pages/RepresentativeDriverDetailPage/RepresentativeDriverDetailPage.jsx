import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "../ReservePlacementRepresentative/ReservePlacementRepresentative.module.css";
import confirmDriverClasses from "../../Blocks/ConfirmDriver/ConfirmDriver.module.css";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header";
import Sidebar from "../../Blocks/Sidebar/Sidebar";
import Button from "../../Standart/Button/Button";
import { useCookies } from "../../../hooks/useCookies";
import CookiesNotice from "../../Blocks/CookiesNotice/CookiesNotice";
import {
  GET_PASSENGER_REQUEST,
  GET_AIRLINE_DEPARTMENT,
  GET_DISPATCHER_DEPARTMENTS,
  getCookie,
  ADD_PASSENGER_REQUEST_DRIVER_PERSON,
  UPDATE_PASSENGER_REQUEST_DRIVER_PERSON,
  REMOVE_PASSENGER_REQUEST_DRIVER_PERSON,
} from "../../../../graphQL_requests";
import {
  isAirlineRole as isAirlineRoleCheck,
  isDispatcherRole as isDispatcherRoleCheck,
} from "../../../utils/access";
import MUITextField from "../../Blocks/MUITextField/MUITextField";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon";
import dialogFormClasses from "../../Blocks/AddRepresentativeBooking/AddRepresentativeBooking.module.css";
import Message from "../../Blocks/Message/Message";
import DeleteComponent from "../../Blocks/DeleteComponent/DeleteComponent";
import Notification from "../../Notification/Notification";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";

function RepresentativeDriverDetailPage({ user }) {
  const token = getCookie("token");
  const { id, idRequest, driverIndex } = useParams();
  const navigate = useNavigate();
  const { cookiesAccepted, acceptCookies, isInitialized } = useCookies();
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const sidebarRef = useRef(null);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [editingPersonIndex, setEditingPersonIndex] = useState(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);
  const [personForm, setPersonForm] = useState({
    fullName: "",
    phone: "",
  });
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [accessMenu, setAccessMenu] = useState({});
  const isDispatcherRole = isDispatcherRoleCheck(user);
  const isAirlineRole = isAirlineRoleCheck(user);
  const dispatcherDepartmentId = user?.dispatcherDepartmentId;

  const addNotification = useCallback((text, status) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text, status }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 4000);
  }, []);

  const { loading, error, data, refetch } = useQuery(GET_PASSENGER_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { passengerRequestId: idRequest },
  });

  const { data: airlineDepartmentData } = useQuery(GET_AIRLINE_DEPARTMENT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      airlineDepartmentId: user?.airlineDepartmentId,
    },
    skip: !isAirlineRole || !user?.airlineDepartmentId,
  });

  const { data: dispatcherDepartmentsData } = useQuery(GET_DISPATCHER_DEPARTMENTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: { all: true },
    },
  });

  useEffect(() => {
    if (isDispatcherRole) {
      const department =
        dispatcherDepartmentsData?.dispatcherDepartments?.departments?.find(
          (item) => item.id === dispatcherDepartmentId
        );
      setAccessMenu(department?.accessMenu || {});
      return;
    }
    if (isAirlineRole) {
      setAccessMenu(airlineDepartmentData?.airlineDepartment?.accessMenu || {});
      return;
    }
    setAccessMenu({});
  }, [
    isDispatcherRole,
    isAirlineRole,
    dispatcherDepartmentId,
    dispatcherDepartmentsData,
    airlineDepartmentData,
  ]);

  const request = data?.passengerRequest ?? null;
  const idx = driverIndex !== undefined ? Number(driverIndex) : -1;
  const driver = useMemo(() => {
    const list = request?.transferService?.drivers ?? [];
    if (idx < 0 || idx >= list.length) return null;
    return list[idx];
  }, [request?.transferService?.drivers, idx]);

  const people = driver?.people ?? [];
  const driverCapacity = driver?.peopleCount ?? null;
  const canAddPassenger =
    driverCapacity == null || people.length < driverCapacity;

  const filteredPeople = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return people.map((person, i) => ({ person, originalIndex: i }));
    }
    return people
      .map((person, i) => ({ person, originalIndex: i }))
      .filter(
        ({ person: p }) =>
          (p.fullName ?? "").toLowerCase().includes(q) ||
          (p.phone ?? "").toLowerCase().includes(q)
      );
  }, [people, searchQuery]);

  const refetchQuery = useMemo(
    () => ({
      query: GET_PASSENGER_REQUEST,
      variables: { passengerRequestId: idRequest },
    }),
    [idRequest]
  );

  const [addDriverPerson, { loading: addingPerson }] = useMutation(
    ADD_PASSENGER_REQUEST_DRIVER_PERSON,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      refetchQueries: [refetchQuery],
      awaitRefetchQueries: true,
    }
  );

  const [updateDriverPerson, { loading: updatingPerson }] = useMutation(
    UPDATE_PASSENGER_REQUEST_DRIVER_PERSON,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      refetchQueries: [refetchQuery],
      awaitRefetchQueries: true,
    }
  );

  const [removeDriverPerson, { loading: removingPerson }] = useMutation(
    REMOVE_PASSENGER_REQUEST_DRIVER_PERSON,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      refetchQueries: [refetchQuery],
      awaitRefetchQueries: true,
    }
  );

  const openAddPerson = useCallback(() => {
    setPersonForm({ fullName: "", phone: "" });
    setEditingPersonIndex(null);
    setShowPersonModal(true);
  }, []);

  const openEditPerson = useCallback((index) => {
    const p = people[index];
    setPersonForm({
      fullName: p?.fullName ?? "",
      phone: p?.phone ?? "",
    });
    setEditingPersonIndex(index);
    setShowPersonModal(true);
  }, [people]);

  const closePersonModal = useCallback(() => {
    setShowPersonModal(false);
    setEditingPersonIndex(null);
    setPersonForm({ fullName: "", phone: "" });
  }, []);

  const handlePersonSubmit = useCallback(async () => {
    const fullName = personForm.fullName?.trim();
    if (!fullName) {
      addNotification("Укажите ФИО пассажира.", "error");
      return;
    }
    const person = {
      fullName,
      phone: personForm.phone?.trim() || null,
    };
    try {
      if (editingPersonIndex !== null) {
        await updateDriverPerson({
          variables: {
            requestId: idRequest,
            driverIndex: idx,
            personIndex: editingPersonIndex,
            person,
          },
        });
        addNotification("Пассажир обновлён.", "success");
      } else {
        await addDriverPerson({
          variables: {
            requestId: idRequest,
            driverIndex: idx,
            person,
          },
        });
        addNotification("Пассажир добавлен.", "success");
      }
      closePersonModal();
    } catch (err) {
      addNotification(
        err?.graphQLErrors?.[0]?.message || err?.message || "Ошибка операции.",
        "error"
      );
    }
  }, [
    personForm,
    editingPersonIndex,
    idRequest,
    idx,
    addDriverPerson,
    updateDriverPerson,
    addNotification,
    closePersonModal,
  ]);

  const handleRemovePerson = useCallback(
    async (personIndex) => {
      try {
        await removeDriverPerson({
          variables: {
            requestId: idRequest,
            driverIndex: idx,
            personIndex,
          },
        });
        addNotification("Пассажир удалён.", "success");
        setDeleteConfirmIndex(null);
      } catch (err) {
        addNotification(
          err?.graphQLErrors?.[0]?.message || err?.message || "Ошибка удаления.",
          "error"
        );
        setDeleteConfirmIndex(null);
      }
    },
    [idRequest, idx, removeDriverPerson, addNotification]
  );

  useEffect(() => {
    if (loading || request === undefined) return;
    if (!request || !driver) {
      navigate(`/${id}/representativeRequestsPlacement/${idRequest}`, {
        replace: true,
        state: { tab: "transferAccommodation" },
      });
    }
  }, [loading, request, driver, id, idRequest, navigate]);

  const closeSidebar = useCallback(() => {
    setShowInfoSidebar(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showInfoSidebar) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeSidebar();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInfoSidebar, closeSidebar]);

  const backUrl = `/${id}/representativeRequestsPlacement/${idRequest}`;
  const backState = { tab: "transferAccommodation" };

  if (loading || !request) {
    return (
      <div className={classes.main}>
        <MenuDispetcher id="representativeRequests" accessMenu={accessMenu} />
        <div className={classes.section}>
          <MUILoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.main}>
        <MenuDispetcher id="representativeRequests" accessMenu={accessMenu} />
        <div className={classes.section}>
          <p>Ошибка: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  return (
    <div className={classes.main}>
      <MenuDispetcher id="representativeRequests" accessMenu={accessMenu} />
      {isInitialized && !cookiesAccepted && (
        <CookiesNotice onAccept={acceptCookies} />
      )}
      <div className={classes.section}>
        <Header>
          <div className={classes.titleHeader}>
            <Link to={backUrl} state={backState} className={classes.backButton}>
              <img src="/arrow.png" alt="" />
            </Link>
            Заявка {request.flightNumber}
          </div>
        </Header>

        <div className={classes.section_searchAndFilter}>
          <MUITextField
            className={classes.mainSearch}
            label="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {canAddPassenger && (
              <Button onClick={openAddPerson} disabled={addingPerson}>
                Добавить пассажира
              </Button>
            )}
            <Button onClick={() => setShowInfoSidebar(true)}>
              Информация о водителе
            </Button>
          </div>
        </div>

        <div className={classes.contentWithChat}>
          <div
            className={classes.tabContent}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div className={classes.driverPassengersTableWrap}>
              <div className={classes.driverPassengersTableHead}>
                <div className={classes.driverPassengersColId}>ID</div>
                <div className={classes.driverPassengersColFio}>
                  ФИО пассажиров
                </div>
                <div className={classes.driverPassengersColPhone}>Телефон</div>
                <div className={classes.driverPassengersColAddressFrom}>
                  Адрес отправления
                </div>
                <div className={classes.driverPassengersColAddressTo}>
                  Адрес прибытия
                </div>
                <div className={classes.driverPassengersColActions} />
              </div>
              <div className={classes.driverPassengersTableCard}>
                {filteredPeople.length === 0 ? (
                  <div className={classes.driverPassengersTableRow}>
                    <div
                      className={classes.driverPassengersColId}
                      style={{ gridColumn: "1 / -1", padding: 16, textAlign: "center" }}
                    >
                      {people.length === 0
                        ? "Нет пассажиров"
                        : "Нет совпадений по поиску"}
                    </div>
                  </div>
                ) : (
                  filteredPeople.map(({ person, originalIndex }) => (
                    <div key={originalIndex} className={classes.driverPassengersTableRow}>
                      <div className={classes.driverPassengersColId}>
                        {originalIndex + 1}
                      </div>
                      <div className={classes.driverPassengersColFio}>
                        {person.fullName ?? "—"}
                      </div>
                      <div className={classes.driverPassengersColPhone}>
                        {person.phone ?? "—"}
                      </div>
                      <div className={classes.driverPassengersColAddressFrom}>
                        {driver.addressFrom ?? "—"}
                      </div>
                      <div className={classes.driverPassengersColAddressTo}>
                        {driver.addressTo ?? "—"}
                      </div>
                      <div className={classes.driverPassengersColActions}>
                        <button
                          type="button"
                          onClick={() => openEditPerson(originalIndex)}
                          disabled={updatingPerson}
                          aria-label="Редактировать пассажира"
                          title="Редактировать"
                        >
                          <EditPencilIcon cursor="pointer" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmIndex(originalIndex)}
                          disabled={removingPerson}
                          aria-label="Удалить пассажира"
                          title="Удалить"
                        >
                          <DeleteIcon cursor="pointer" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className={classes.chatWrapper}>
            <Message
              activeTab="Комментарий"
              setIsHaveTwoChats={() => {}}
              setHotelChats={() => {}}
              chooseRequestID=""
              chooseReserveID={request.id}
              filteredPlacement={[]}
              token={token}
              user={user}
              chatPadding="0"
              chatHeight="calc(100vh - 295px)"
              separator="airline"
              hotelChatId={null}
            />
          </div>
        </div>
      </div>

      {notifications.map((n, i) => (
        <Notification
          key={n.id}
          text={n.text}
          status={n.status}
          index={i}
          time={4000}
          onClose={() =>
            setNotifications((prev) => prev.filter((x) => x.id !== n.id))
          }
        />
      ))}

      <Dialog
        open={showPersonModal}
        onClose={closePersonModal}
        PaperProps={{ sx: { borderRadius: "15px" } }}
      >
        <DialogTitle className={dialogFormClasses.title}>
          {editingPersonIndex !== null ? "Редактировать пассажира" : "Добавить пассажира"}
        </DialogTitle>
        <DialogContent className={dialogFormClasses.content}>
          <label className={dialogFormClasses.label}>ФИО *</label>
          <input
            type="text"
            name="fullName"
            value={personForm.fullName}
            onChange={(e) =>
              setPersonForm((p) => ({ ...p, [e.target.name]: e.target.value }))
            }
            placeholder="ФИО"
            className={dialogFormClasses.input}
          />
          <label className={dialogFormClasses.label}>Телефон</label>
          <input
            type="text"
            name="phone"
            value={personForm.phone}
            onChange={(e) =>
              setPersonForm((p) => ({ ...p, [e.target.name]: e.target.value }))
            }
            placeholder="Телефон"
            className={dialogFormClasses.input}
          />
        </DialogContent>
        <DialogActions className={dialogFormClasses.actions}>
          <Button onClick={closePersonModal}>Отмена</Button>
          <Button
            onClick={handlePersonSubmit}
            disabled={addingPerson || updatingPerson}
          >
            {editingPersonIndex !== null ? "Сохранить" : "Добавить"}
          </Button>
        </DialogActions>
      </Dialog>

      {deleteConfirmIndex !== null && (
        <DeleteComponent
          remove={handleRemovePerson}
          index={deleteConfirmIndex}
          close={() => setDeleteConfirmIndex(null)}
          title="Вы действительно хотите удалить пассажира?"
        />
      )}

      <Sidebar show={showInfoSidebar} sidebarRef={sidebarRef}>
        <div className={confirmDriverClasses.requestTitle}>
          <div className={confirmDriverClasses.requestTitle_name}>
            Информация о водителе
          </div>
          <div
            className={confirmDriverClasses.requestTitle_close}
            onClick={closeSidebar}
          >
            <CloseIcon />
          </div>
        </div>
        <div
          className={confirmDriverClasses.requestMiddle}
          style={{ height: "calc(100% - 90px)", overflowY: "auto" }}
        >
          <div className={confirmDriverClasses.requestData}>
            <div className={confirmDriverClasses.section}>
              <div className={confirmDriverClasses.sectionTitle}>Водитель</div>
              <div className={confirmDriverClasses.requestDataInfo}>
                <div className={confirmDriverClasses.requestDataInfo_title}>
                  ФИО
                </div>
                <div className={confirmDriverClasses.requestDataInfo_desc}>
                  {driver.fullName ?? "—"}
                </div>
              </div>
              <div className={confirmDriverClasses.requestDataInfo}>
                <div className={confirmDriverClasses.requestDataInfo_title}>
                  Телефон
                </div>
                <div className={confirmDriverClasses.requestDataInfo_desc}>
                  {driver.phone ?? "—"}
                </div>
              </div>
              <div className={confirmDriverClasses.requestDataInfo}>
                <div className={confirmDriverClasses.requestDataInfo_title}>
                  Количество мест
                </div>
                <div className={confirmDriverClasses.requestDataInfo_desc}>
                  {driver.peopleCount ?? "—"}
                </div>
              </div>
              <div className={confirmDriverClasses.requestDataInfo}>
                <div className={confirmDriverClasses.requestDataInfo_title}>
                  Ссылка
                </div>
                <div className={confirmDriverClasses.requestDataInfo_desc}>
                  {driver.link ? (
                    <a
                      href={driver.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="blueText"
                    >
                      {driver.link}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>

            <div className={confirmDriverClasses.section}>
              <div className={confirmDriverClasses.sectionTitle}>Заявка</div>
              <div className={confirmDriverClasses.requestDataInfo}>
                <div className={confirmDriverClasses.requestDataInfo_title}>
                  Номер рейса
                </div>
                <div className={confirmDriverClasses.requestDataInfo_desc}>
                  {request.flightNumber ?? "—"}
                </div>
              </div>
              <div className={confirmDriverClasses.requestDataInfo}>
                <div className={confirmDriverClasses.requestDataInfo_title}>
                  Адрес отправления
                </div>
                <div className={confirmDriverClasses.requestDataInfo_desc}>
                  {driver.addressFrom ?? "—"}
                </div>
              </div>
              <div className={confirmDriverClasses.requestDataInfo}>
                <div className={confirmDriverClasses.requestDataInfo_title}>
                  Адрес прибытия
                </div>
                <div className={confirmDriverClasses.requestDataInfo_desc}>
                  {driver.addressTo ?? "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Sidebar>
    </div>
  );
}

export default RepresentativeDriverDetailPage;
