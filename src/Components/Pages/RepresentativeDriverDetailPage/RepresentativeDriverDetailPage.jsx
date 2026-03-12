import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import classes from "../ReservePlacementRepresentative/ReservePlacementRepresentative.module.css";
import confirmDriverClasses from "../../Blocks/ConfirmDriver/ConfirmDriver.module.css";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header";
import Sidebar from "../../Blocks/Sidebar/Sidebar";
import Button from "../../Standart/Button/Button";
import { useCookies } from "../../../hooks/useCookies";
import CookiesNotice from "../../Blocks/CookiesNotice/CookiesNotice";
import { GET_PASSENGER_REQUEST, getCookie } from "../../../../graphQL_requests";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon";
import Message from "../../Blocks/Message/Message";

function RepresentativeDriverDetailPage({ user }) {
  const token = getCookie("token");
  const { id, idRequest, driverIndex } = useParams();
  const navigate = useNavigate();
  const { cookiesAccepted, acceptCookies, isInitialized } = useCookies();
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const sidebarRef = useRef(null);

  const { loading, error, data } = useQuery(GET_PASSENGER_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { passengerRequestId: idRequest },
  });

  const request = data?.passengerRequest ?? null;
  const idx = driverIndex !== undefined ? Number(driverIndex) : -1;
  const driver = useMemo(() => {
    const list = request?.transferService?.drivers ?? [];
    if (idx < 0 || idx >= list.length) return null;
    return list[idx];
  }, [request?.transferService?.drivers, idx]);

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
        <MenuDispetcher id="reserve" accessMenu={{}} />
        <div className={classes.section}>
          <MUILoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.main}>
        <MenuDispetcher id="reserve" accessMenu={{}} />
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
      <MenuDispetcher id="reserve" accessMenu={{}} />
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
          <div />
          <Button onClick={() => setShowInfoSidebar(true)}>
            Информация о водителе
          </Button>
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
                <div className={classes.driverPassengersColSeat}>Место</div>
                <div className={classes.driverPassengersColAddressFrom}>
                  Адрес отправления
                </div>
                <div className={classes.driverPassengersColAddressTo}>
                  Адрес прибытия
                </div>
              </div>
              <div className={classes.driverPassengersTableCard}>
                {(driver.people ?? []).map((person, rowIndex) => (
                  <div key={rowIndex} className={classes.driverPassengersTableRow}>
                    <div className={classes.driverPassengersColId}>{rowIndex + 1}</div>
                    <div className={classes.driverPassengersColFio}>
                      {person.fullName ?? "—"}
                    </div>
                    <div className={classes.driverPassengersColPhone}>
                      {person.phone ?? "—"}
                    </div>
                    <div className={classes.driverPassengersColSeat}>
                      {person.seat ?? "—"}
                    </div>
                    <div className={classes.driverPassengersColAddressFrom}>
                      {driver.addressFrom ?? "—"}
                    </div>
                    <div className={classes.driverPassengersColAddressTo}>
                      {driver.addressTo ?? "—"}
                    </div>
                  </div>
                ))}
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
