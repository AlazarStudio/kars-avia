import React, { useEffect, useRef } from "react";
import classes from "./InfoTableDataDriversCompanies.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";
import { server } from "../../../../graphQL_requests";

function InfoTableDataDriversCompanies({
  children,
  toggleRequestSidebar,
  requests,
  pageInfo,
  disAdmin,
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
      <div className={classes.InfoTable_title}>
        <div
          className={`${classes.InfoTable_title_elem} ${classes.w5}`}
          style={{ justifyContent: "center" }}
        >
          ID
        </div>
        <div
          className={`${classes.InfoTable_title_elem} ${classes.w30}`}
          style={{ paddingLeft: "40px" }}
        >
          Название
        </div>
      </div>
      <div className={classes.bottom} ref={listContainerRef} style={disAdmin ? { height: "calc(100vh - 427px)" } : {}}>
        {requests.map((item, index) => (
          <Link
            to={`/driversCompany/${item.id}`}
            className={classes.InfoTable_data}
            onClick={() => handleObject(item, index)}
            key={index}
          >
            <div
              className={`${classes.InfoTable_data_elem} ${classes.w5}`}
              style={{ justifyContent: "center" }}
            >
              {item.order}
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
              <div className={classes.InfoTable_data_elem_userInfo}>
                <div className={classes.InfoTable_data_elem_avatar}>
                  {(item?.images && item.images.length > 0) ? <img src={`${server}${item?.images[0]}`} alt="" /> : <img src="/no-avatar.png"/>}
                </div>
                <div className={classes.InfoTable_data_elem_title}>
                  {item.name}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </InfoTable>
  );
}

export default InfoTableDataDriversCompanies;
