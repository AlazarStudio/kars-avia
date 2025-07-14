import React, { useEffect, useRef } from "react";
import classes from "./InfoTableDataPatchNotes.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";
import { convertToDate, server } from "../../../../graphQL_requests";

function InfoTableDataPatchNotes({
  children,
  toggleRequestSidebar,
  requests,
  pageInfo,
  ...props
}) {
  const handleObject = (item, index) => {
    toggleRequestSidebar();
  };

  // Ref для контейнера списка
  const listContainerRef = useRef(null);

  // Прокрутка наверх при изменении `pageInfo`
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
      {/* <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w30}`}>Название</div>
            </div> */}

      <div className={classes.bottom} ref={listContainerRef}>
        {requests.map((item, index) => (
          <div
            className={classes.InfoTable_data}
            onClick={() => toggleRequestSidebar(item)}
            key={index}
          >
            {/* <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>
              {item.order}
            </div> */}
            <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
              <div className={classes.InfoTable_data_elem_userInfo}>
                {/* <div className={classes.InfoTable_data_elem_avatar}>
                                    <img src={`${server}${item.images[0]}`} alt="" />
                                    </div> */}
                <div
                  className={`${classes.InfoTable_data_elem_title} ${classes.InfoTable_data__fw600}`}
                  style={{ color: "#000" }}
                >
                  {item.name}
                </div>
              </div>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w40}`}>
              <span className={`${classes.lineClamp}`}>{item.description}</span>
            </div>
            <div
              className={`${classes.InfoTable_data_elem} ${classes.InfoTable_data__date} ${classes.w40} ${classes.InfoTable_data__fw600}`}
              style={{ color: "#999999" }}
            >
              {convertToDate(item.date, false)}
            </div>
          </div>
        ))}
      </div>
    </InfoTable>
  );
}

export default InfoTableDataPatchNotes;
