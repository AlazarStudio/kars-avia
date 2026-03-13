import React, { useEffect, useRef } from "react";
import classes from "../InfoTableData/InfoTableData.module.css";
import localClasses from "./InfoTableDataTransferOrders.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { convertToDate, getMediaUrl } from "../../../../graphQL_requests";
import { statusLabels } from "../../../roles";
import ReportTimer from "./ReportTimer";

function InfoTableDataTransferOrders({
  user,
  token,
  disAdmin,
  toggleRequestSidebar,
  onSelectTransfer,
  scrollToId,
  requests,
  setChooseObject,
  chooseRequestID,
  setChooseRequestID,
  pageInfo,
}) {
  const listContainerRef = useRef(null);

  useEffect(() => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
  }, [pageInfo]);

  return (
    <InfoTable>
      <div className={classes.InfoTable_title}>
        <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>№</div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>
          Пассажиры
        </div>
        <div
          className={`${classes.InfoTable_title_elem} ${classes.w10}`}
        // style={{ justifyContent: "center" }}
        >
          Авиакомпания
        </div>
        <div
          className={`${classes.InfoTable_title_elem} ${classes.w12}`}
          style={{ justifyContent: "center" }}
        >
          Дата и время
        </div>
        <div
          className={`${classes.InfoTable_title_elem} ${classes.w20}`}
        >
          Подача
        </div>
        <div
          className={`${classes.InfoTable_title_elem} ${classes.w20}`}
        >
          Пункт назначения
        </div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>
          Статус
        </div>
      </div>

      <div className={classes.bottom} ref={listContainerRef}>
        {requests.map((item, index) => (
          <div
            key={item.id}
            className={`${classes.InfoTable_data} ${chooseRequestID === item.id ? classes.InfoTable_data_active : ""
              }`}
            style={{
              opacity:
                item.status !== "COMPLETED" && item.status !== "CANCELLED"
                  ? 1
                  : 0.5,
            }}
            onClick={() => onSelectTransfer?.(item.id)}
          >
            <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>
              <div className={classes.InfoTable_data_elem_information}>
                <div className={classes.InfoTable_data_elem_title}>
                  № {index + 1}
                </div>
                <ReportTimer item={item} />
              </div>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
              <div className={classes.InfoTable_data_elem_information}>
                {item.persons?.length > 0 ? (
                  <div className={classes.InfoTable_data_elem_title}>
                    {item.persons[0]?.name}
                    {item.persons.length > 1 &&
                      ` + ${item.persons.length - 1}`}
                  </div>
                ) : (
                  "Предварительная бронь"
                )}
              </div>
            </div>
            <div
              className={`${classes.InfoTable_data_elem} ${classes.w10}`}
            >
              {item.airline ? (
                <>
                  {item.airline.images?.[0] && (
                    <div className={classes.InfoTable_data_elem_img}>
                      <img
                        src={getMediaUrl(item.airline.images[0])}
                        alt=""
                      />
                    </div>
                  )}
                  {item.airline.name || "—"}
                </>
              ) : (
                "—"
              )}
            </div>
            <div
              className={`${classes.InfoTable_data_elem} ${classes.w12}`}
              style={{ justifyContent: "center", padding: "0 0 0 10px" }}
            >
              <div className={classes.InfoTable_data_elem_moreInfo}>
                <span>
                  <img src="/calendar.png" alt="" />{" "}
                  {item.scheduledPickupAt
                    ? convertToDate(item.scheduledPickupAt)
                    : "—"}
                </span>
                <span>
                  <img src="/time.png" alt="" />{" "}
                  {item.scheduledPickupAt
                    ? convertToDate(item.scheduledPickupAt, true)
                    : "—"}
                </span>
              </div>
            </div>
            <div
              className={`${classes.InfoTable_data_elem} ${classes.w20}`}
            >
              <span className={localClasses.addressClamp}>
                {item.fromAddress || "—"}
              </span>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
              <span className={localClasses.addressClamp}>
                {item.toAddress || "—"}
              </span>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
              <div className={classes.InfoTable_data_elem_position}>
                <div className={(item.status || "").toLowerCase()}></div>
                {statusLabels[item.status] || item.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </InfoTable>
  );
}

export default InfoTableDataTransferOrders;
