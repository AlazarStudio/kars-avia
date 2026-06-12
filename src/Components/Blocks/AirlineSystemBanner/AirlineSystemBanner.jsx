import { useAuth } from "../../../AuthContext";
import { isAirlineRole } from "../../../utils/access";
import classes from "./AirlineSystemBanner.module.css";

// Чтобы убрать баннер — поставить false.
export const SHOW_AIRLINE_SYSTEM_BANNER = false;

function AirlineSystemBanner() {
  const { user } = useAuth();

  if (!SHOW_AIRLINE_SYSTEM_BANNER || !isAirlineRole(user)) return null;

  return (
    <div
      className={classes.blocker}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="airlineSystemBannerTitle"
    >
      <div className={classes.card}>
        <div className={classes.accent} />

        <div className={classes.body}>
          <div className={classes.head}>
            <div className={classes.icon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div className={classes.eyebrow}>Системное уведомление</div>
              <div className={classes.title} id="airlineSystemBannerTitle">
                Проблемы с доступностью сайтов в рунете
              </div>
            </div>
          </div>

          <p className={classes.text}>
            В рунете наблюдаются частичные проблемы с доступностью сайтов / VPS на крупных хостинг-площадках. 
            {/* включая <b>Бегет</b>. */} {" "}
             Причина в работе ТСПУ и новых правилах фильтрации трафика, которые затрагивают работу сайтов.
          </p>

          {/* <div className={classes.footer}>
            <a
              className={classes.link}
              href="https://vk.ru/wall-2782733_26252"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Подробнее
            </a>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default AirlineSystemBanner;
