import React from "react";
import classes from "./InfoTableDataReports.module.css";
import InfoTable from "../InfoTable/InfoTable";
import Button from "../../Standart/Button/Button";
import { convertToDate, getMediaUrl } from "../../../../graphQL_requests";
import { roles } from "../../../roles";
import DeleteIcon from "../../../shared/icons/DeleteIcon";

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

        <div
          className={classes.bottom}
          style={
            (user?.airlineId || user?.hotelId) && {
              height: "calc(100vh - 270px)",
            }
          }
        >
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
                        src={getMediaUrl(image) ?? "/no-avatar.png"}
                        alt=""
                        style={{ borderRadius: "50%", userSelect: "none" }}
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
                    {convertToDate(item?.createdAt)}{" "}
                    {convertToDate(item?.createdAt, true)}
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
                  <a href={getMediaUrl(item.url)} target="_blank">
                    {" "}
                    <svg
                      width="14"
                      height="22"
                      viewBox="0 0 14 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0.543334 19.3577C0.617723 19.9892 1.25833 20.3812 2.05783 20.424C2.98733 20.4737 4.53289 20.5234 7 20.5234C9.46711 20.5234 11.0127 20.4737 11.9422 20.424C12.7409 20.3812 13.3823 19.9892 13.4559 19.3583C13.4827 19.1309 13.5 18.8554 13.5 18.5234C13.5 18.192 13.4827 17.916 13.4567 17.6892C13.3823 17.0577 12.7417 16.6657 11.9422 16.6229C11.0127 16.5732 9.46711 16.5234 7 16.5234C4.53289 16.5234 2.98733 16.5732 2.05783 16.6229C1.25906 16.6657 0.617722 17.0577 0.544055 17.6886C0.517333 17.916 0.5 18.1914 0.5 18.5234C0.5 18.8549 0.517334 19.1309 0.543334 19.3577Z"
                        stroke="#545873"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M13.3065 8.60571C13.7804 7.89217 13.3371 7.07095 12.4839 7.00078C11.8058 6.94519 10.8964 6.88961 9.72497 6.85348C9.69112 5.42521 9.63136 3.99768 9.54572 2.57158C9.47972 1.48772 8.74673 0.578957 7.66288 0.518511C7.22111 0.49383 6.77831 0.49383 6.33655 0.518511C5.2527 0.578957 4.51971 1.48772 4.4537 2.57158C4.38978 3.61791 4.31753 5.08458 4.27445 6.85348C3.10306 6.88961 2.19429 6.94519 1.51619 7.00078C0.662307 7.07095 0.219734 7.89287 0.693572 8.60571C1.14379 9.28381 1.82953 10.2044 2.85433 11.3661C4.04795 12.7174 5.06024 13.5449 5.78628 14.0389C6.14234 14.2868 6.56582 14.4198 6.99971 14.4198C7.43361 14.4198 7.85708 14.2868 8.21314 14.0389C8.93918 13.5449 9.95147 12.7174 11.1451 11.3661C12.1706 10.2044 12.8563 9.28381 13.3065 8.60571Z"
                        stroke="#545873"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </a>
                  <DeleteIcon
                    cursor="pointer"
                    onClick={() => openDeleteComponent(item.id)}
                  />
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
