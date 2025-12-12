import React from "react";
import classes from "./OrderInfoSidebar.module.css";

function OrderInfoSidebar({ data, loading }) {
  const fallback = {
    name: "",
    rating: "",
    avatar: "",
    fromAddress: "",
    toAddress: "",
    orderTime: "",
  };

  const info = { ...fallback, ...(data || {}) };

  return (
    <aside className={classes.sidebar}>
      <div className={classes.card}>
        <p className={classes.title}>Информация о заказе</p>

        {/* аватар + имя + рейтинг */}
        <div className={classes.clientBlock}>
          <img
            className={classes.clientAvatar}
            src={info.avatar}
            alt={info.name}
          />
          <div className={classes.clientName}>{info.name}</div>
          {/* <div className={classes.clientRating}>★{mock.rating}</div> */}
        </div>

        {/* блок маршрута */}
        <div className={classes.routeCard}>
          <div className={classes.routeLine} />
          <div className={classes.routeRow}>
            <span className={`${classes.routeDot} ${classes.routeDotEmpty}`} />
            <span className={classes.routeText}>{info.fromAddress}</span>
          </div>
          <div
            style={{
              backgroundColor: "#E8EDF1",
              height: "1px",
              margin: "10px 0px",
            }}
          />
          <div className={classes.routeRow}>
            <span className={`${classes.routeDot} ${classes.routeDotFilled}`} />
            <span className={`${classes.routeText}`}>{info.toAddress}</span>
          </div>
        </div>

        {/* время заказа */}
        <div className={classes.metaRow}>
          <span className={classes.metaLabel}>Дата заказа</span>
          <span className={classes.metaValue}>{info.orderDate}</span>
        </div>

        <div className={classes.metaRow}>
          <span className={classes.metaLabel}>Время заказа</span>
          <span className={classes.metaValue}>{info.orderTime}</span>
        </div>

        {/* комментарий */}
        <div className={classes.fieldGroup}>
          <span className={classes.metaLabel}>Комментарий</span>
          <div className={classes.fakeInput}>{info.description}</div>
          {/* <div className={classes.fakeInput} /> */}
        </div>

        {/* багаж */}
        <div className={classes.fieldGroup}>
          <span className={classes.metaLabel}>Информация о багаже</span>
          {/* <div className={classes.fakeInput} /> */}
          <div className={classes.fakeInput}>{info.baggage}</div>
        </div>
      </div>
    </aside>
  );
}

export default OrderInfoSidebar;
