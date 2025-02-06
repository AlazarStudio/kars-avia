import { useState } from "react";
import classes from "./Notifications.module.css";
import { useNavigate } from "react-router-dom";
import { roles } from "../../../roles";

function Notifications({ onRequestClick, user }) {
  const navigate = useNavigate();

  const [separator, setSeparator] = useState("All");

  const notifyData = [
    {
      notifyTitle: "Название оповещения",
      notifyText:
        "Какое-то действие совершенное кем-то, касающееся какой-то заявки.",
      notifyTime: "13:36",
      requestId: "679b6f61178473d1c88d2ebd",
      requestNumber: "0190-ABA-30.01.2025",
      client: "Петров П.П.",
      clientId: "67444ca096ee539bb5c14666",
      chooseCityRequest: "Абакан",
      reserve: false,
    },
    {
      notifyTitle: "Название оповещения",
      notifyText:
        "Какое-то действие совершенное кем-то, касающееся какой-то заявки В РЕЗЕРВЕ.",
      notifyTime: "13:36",
      requestId: "679b51ab178473d1c88d2ead",
      requestNumber: "0014-ABA-30.01.2025",
      reserve: true,
    },
    {
      notifyTitle: "Название оповещения",
      notifyText:
        "Какое-то действие совершенное кем-то, касающееся какой-то заявки.",
      notifyTime: "13:36",
      requestId: "679b6f61178473d1c88d2ebd",
      requestNumber: "0190-ABA-30.01.2025",
      client: "Петров П.П.",
      clientId: "67444ca096ee539bb5c14666",
      chooseCityRequest: "Абакан",
      reserve: false,
    },
    {
      notifyTitle: "Название оповещения",
      notifyText:
        "Какое-то действие совершенное кем-то, касающееся какой-то заявки.",
      notifyTime: "13:36",
      requestId: "679b6f61178473d1c88d2ebd",
      requestNumber: "0190-ABA-30.01.2025",
      client: "Петров П.П.",
      clientId: "67444ca096ee539bb5c14666",
      chooseCityRequest: "Абакан",
      reserve: false,
    },
    {
      notifyTitle: "Название оповещения",
      notifyText:
        "Какое-то действие совершенное кем-то, касающееся какой-то заявки.",
      notifyTime: "13:36",
      requestId: "679b6f61178473d1c88d2ebd",
      requestNumber: "0190-ABA-30.01.2025",
      client: "Петров П.П.",
      clientId: "67444ca096ee539bb5c14666",
      chooseCityRequest: "Абакан",
      reserve: false,
    },
    {
      notifyTitle: "Название оповещения",
      notifyText:
        "Какое-то действие совершенное кем-то, касающееся какой-то заявки.",
      notifyTime: "13:36",
      requestId: "679b6f61178473d1c88d2ebd",
      requestNumber: "0190-ABA-30.01.2025",
      client: "Петров П.П.",
      clientId: "67444ca096ee539bb5c14666",
      chooseCityRequest: "Абакан",
      reserve: false,
    },
  ];

  const filteredNotifyData = notifyData.filter((notify) => {
    if (separator === "All") return true; // Показываем все
    if (separator === "request") return notify.reserve === false; // Только обычные заявки
    if (separator === "reserve") return notify.reserve === true; // Только заявки в резерве
    return false;
  });
  

  console.log(filteredNotifyData);
  

  return (
    <div className={classes.notifyWrapper}>
      <div className={classes.separatorWrapper}>
        <button
          onClick={() => setSeparator("All")}
          className={separator === "All" ? classes.active : null}
        >
          Все
        </button>
        <button
          onClick={() => setSeparator("request")}
          className={separator === "request" ? classes.active : null}
        >
          Эскадрилья
        </button>
        <button
          onClick={() => setSeparator("reserve")}
          className={separator === "reserve" ? classes.active : null}
        >
          Резерв
        </button>
      </div>
      {filteredNotifyData.map((notify, index) => {
        const isHotelAdmin = user?.role === roles.hotelAdmin;
        const isReserve = notify.reserve === true;
        const requestLink = `/reserve/reservePlacement/${notify.requestId}`;

        return (
          <div className={classes.notifyMessageWrapper} key={index}>
            <div className={classes.notifyMessageHeader}>
              <p>{notify.notifyTitle}</p>
              <p>{notify.notifyTime}</p>
            </div>
            <div className={classes.notifyMessageText}>
              <p>{notify.notifyText}</p>

              {isHotelAdmin && isReserve && (
                <p onClick={() => navigate(requestLink)}>
                  {`Перейти к заявке №${notify.requestNumber}`}
                </p>
              )}

              {!isHotelAdmin && (
                <p
                  onClick={() =>
                    isReserve ? navigate(requestLink) : onRequestClick(notify)
                  }
                >
                  {`Перейти к заявке №${notify.requestNumber}`}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Notifications;
