import { useState } from "react";
import classes from "./Notifications.module.css";

function Notifications({ onRequestClick }) {
  const [logHui, setLogHui] = useState(false);
  //   console.log(logHui);

  const notifyData = [
    {
        notifyTitle: 'Название оповещения',
        notifyText: 'Какое-то действие совершенное кем-то, касающееся какой-то заявки.',
        notifyTime: '13:36',
        requestId: '679a0e7c7ea14f2001c5d4d3',
        requestNumber: '0187-ABA-29.01.2025'
    },
    {
        notifyTitle: 'Название оповещения',
        notifyText: 'Какое-то действие совершенное кем-то, касающееся какой-то заявки.',
        notifyTime: '13:36',
        requestId: '6794ef8025e9958aa9bab2cd',
        requestNumber: '0175-ABA-25.01.2025'
    },
    {
        notifyTitle: 'Название оповещения',
        notifyText: 'Какое-то действие совершенное кем-то, касающееся какой-то заявки.',
        notifyTime: '13:36',
        requestId: '6794ef8025e9958aa9bab2cd',
        requestNumber: '0175-ABA-25.01.2025'
    },
    {
        notifyTitle: 'Название оповещения',
        notifyText: 'Какое-то действие совершенное кем-то, касающееся какой-то заявки.',
        notifyTime: '13:36',
        requestId: '6794ef8025e9958aa9bab2cd',
        requestNumber: '0175-ABA-25.01.2025'
    },
    {
        notifyTitle: 'Название оповещения',
        notifyText: 'Какое-то действие совершенное кем-то, касающееся какой-то заявки.',
        notifyTime: '13:36',
        requestId: '6794ef8025e9958aa9bab2cd',
        requestNumber: '0175-ABA-25.01.2025'
    },
    {
        notifyTitle: 'Название оповещения',
        notifyText: 'Какое-то действие совершенное кем-то, касающееся какой-то заявки.',
        notifyTime: '13:36',
        requestId: '6794ef8025e9958aa9bab2cd',
        requestNumber: '0175-ABA-25.01.2025'
    },
  ];

  return (
    <div className={classes.notifyWrapper}>
      {/* <button
        onClick={() => {
            setLogHui(true);
        }}
      >
        HUI
      </button> */}
      {notifyData.map((notify, index) => (
        <div className={classes.notifyMessageWrapper} key={index}>
            <div className={classes.notifyMessageHeader}>
                <p>{notify.notifyTitle}</p>
                <p>{notify.notifyTime}</p>
            </div>
            <div className={classes.notifyMessageText}>
                <p>{notify.notifyText}</p>
                <p onClick={() => {onRequestClick(notify.requestId)}}>{`Перейти к заявке №${notify.requestNumber}`}</p>
            </div>
        </div>
      ))}
    </div>
  );
}

export default Notifications;
