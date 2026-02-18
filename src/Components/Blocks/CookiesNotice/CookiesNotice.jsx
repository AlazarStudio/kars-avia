import React from "react";
import classes from "./CookiesNotice.module.css";

const CookiesNotice = ({ onAccept }) => {
  return (
    <div className={classes.cookiesWrapper}>
      <p>Сайт использует cookies</p>
      <div className={classes.cookiesButtons}>
        <button className={classes.acceptButton} onClick={onAccept}>
          Принять
        </button>
      </div>
    </div>
    // <div className={classes.cookiesWrapper}>
    //   <div className={classes.cookiesContent}>
    //     <p>
    //       Мы используем файлы cookie для улучшения работы сайта, анализа
    //       трафика и персонализации контента. Оставаясь на сайте, вы соглашаетесь
    //       с нашей <a href="/privacy-policy" target="_blank">Политикой конфиденциальности</a>.
    //     </p>
    //     <div className={classes.cookiesButtons}>
    //       <button
    //         className={classes.acceptButton}
    //         onClick={onAccept}
    //       >
    //         Принять
    //       </button>
    //       <a
    //         href="/privacy-policy"
    //         className={classes.moreInfoButton}
    //         target="_blank"
    //       >
    //         Подробнее
    //       </a>
    //     </div>
    //   </div>
    // </div>
  );
};

export default CookiesNotice;
