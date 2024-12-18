import React from "react";
import classes from "./InfoTableDataHotels.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";
import { server } from "../../../../graphQL_requests";

function InfoTableDataHotels({
  children,
  toggleRequestSidebar,
  requests,
  ...props
}) {
  const handleObject = (item, index) => {
    toggleRequestSidebar();
  };

  return (
    <InfoTable>
      <div className={classes.InfoTable_title}>
        <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>
          ID
        </div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w25}`}>
          Название
        </div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>
          Город
        </div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>
          Рейтинг
        </div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>
          Адрес
        </div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w11}`}>
          До аэропорта
        </div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w7}`}>
          Квота
        </div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w7}`}>
          Резерв
        </div>
        {/* <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Квота</div> */}
      </div>

      <div className={classes.bottom}>
        {requests.map((item, index) => (
          <Link
            to={`/hotels/${item.id}`}
            className={classes.InfoTable_data}
            onClick={() => handleObject(item, index)}
            key={index}
          >
            <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>
              {index + 1}
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w25}`}>
              <div className={classes.InfoTable_data_elem_userInfo}>
                <div className={classes.InfoTable_data_elem_avatar}>
                  <img
                    src={
                      item.images.length != 0
                        ? `${server}${item.images}`
                        : "/no-avatar.png"
                    }
                    alt=""
                  />
                </div>
                <div className={classes.InfoTable_data_elem_title}>
                  {item.name}
                </div>
              </div>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
              <div className={classes.InfoTable_data_elem_title}>
                {item.city}
              </div>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>
              <div className={classes.InfoTable_data_elem_title}>
                {Array.from({ length: 5 }, (_, index) => (
                  <img
                    key={index}
                    src={index < item.stars ? "/star.png" : "/op_star.png"}
                    className={classes.star}
                  />
                ))}
                {/* {Array.from({ length: 5 }, (_, index) =>
                  index < item.stars ? (
                    <img
                      key={index}
                      src="/star.png"
                      alt="star"
                      className={classes.star}
                    />
                  ) : null
                )} */}
              </div>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
              <div className={classes.InfoTable_data_elem_title}>
                {item.address}
              </div>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w11}`}>
              <div className={classes.InfoTable_data_elem_title}>
                {item.airportDistance}
              </div>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w7}`}>
              <div className={classes.InfoTable_data_elem_title}>
                {item.quote ? item.quote : "0"}
              </div>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w7}`}>
              <div className={classes.InfoTable_data_elem_title}>
                {item.provision ? item.provision : "0"}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </InfoTable>
  );
}

export default InfoTableDataHotels;
