import React from "react";
import classes from "./InfoTableDataReports.module.css";
import InfoTable from "../InfoTable/InfoTable";
import Button from "../../Standart/Button/Button";
import { convertToDate, server } from "../../../../graphQL_requests";
import { roles } from "../../../roles";

function InfoTableDataReports({
  children,
  user,
  toggleRequestSidebar,
  requests,
  isAirline,
  setIsAirline,
  setChooseObject,
  openDeleteComponent,
  ...props
}) {
  const handleObject = (item, index) => {
    setChooseObject({ ...item, index });
    toggleRequestSidebar();
  };

  return (
    <>
      {user.role === roles.superAdmin || user.role === roles.dispatcerAdmin ? (
        <div className={classes.filter_wrapper}>
          <button
            onClick={() => setIsAirline(true)}
            className={isAirline === true ? classes.activeButton : null}
          >
            Авиакомпании
          </button>
          <button
            onClick={() => setIsAirline(false)}
            className={isAirline === false ? classes.activeButton : null}
          >
            Гостиницы
          </button>
        </div>
      ) : null}

      <InfoTable>
        <div className={classes.InfoTable_title}>
          <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>
            ID
          </div>
          <div className={`${classes.InfoTable_title_elem} ${classes.w30}`}>
            {isAirline ? "Авиакомпания" : "Гостиница"}
          </div>
          <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>
            Дата формирования
          </div>
          <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>
            Период
          </div>
        </div>

        <div className={classes.bottom}>
          {requests?.map((item, index) => {
            const image = isAirline
              ? item?.airline?.images[0]
              : item?.hotel?.images[0];

            return (
              <div
                className={classes.InfoTable_data}
                onClick={() => handleObject(item, index)}
                key={index}
              >
                <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>
                  {index + 1}
                </div>
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w30}`}
                >
                  <div className={classes.InfoTable_data_elem_userInfo}>
                    <div className={classes.InfoTable_data_elem_avatar}>
                      <img
                        src={image ? `${server}${image}` : "/no-avatar.png"}
                        alt=""
                        style={{ borderRadius: "50%" }}
                      />
                    </div>
                    <div className={classes.InfoTable_data_elem_title}>
                      {isAirline ? item?.airline?.name : item?.hotel?.name}
                    </div>
                  </div>
                </div>
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                >
                  <div className={classes.InfoTable_data_elem_title}>
                    {convertToDate(item?.createdAt)}
                  </div>
                </div>
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                >
                  <div className={classes.InfoTable_data_elem_title}>
                    {convertToDate(item?.startDate)} -{" "}
                    {convertToDate(item?.endDate)}
                  </div>
                </div>
                <div className={classes.InfoTable_data_elem_download}>
                  <a href={`${server}${item.url}`} target="_blank">
                    {" "}
                    <img src="/download.png" alt="" />{" "}
                  </a>
                  {/* <img src="/deleteReport.png" alt=""  onClick={() => openDeleteComponent(index)}/> */}
                </div>
              </div>
            );
          })}
        </div>
      </InfoTable>
    </>
  );
}

export default InfoTableDataReports;
