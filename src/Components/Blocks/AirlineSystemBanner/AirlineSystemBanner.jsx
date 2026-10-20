import { useAuth } from "../../../AuthContext";
import { isAirlineRole } from "../../../utils/access";
import SystemBlocker from "./SystemBlocker";

// Чтобы убрать баннер — поставить false.
export const SHOW_AIRLINE_SYSTEM_BANNER = false;

function AirlineSystemBanner() {
  const { user } = useAuth();

  if (!SHOW_AIRLINE_SYSTEM_BANNER || !isAirlineRole(user)) return null;

  // Ссылка «Подробнее» — передать в footer (classes из ./AirlineSystemBanner.module.css):
  // <a
  //   className={classes.link}
  //   href="https://vk.ru/wall-2782733_26252"
  //   target="_blank"
  //   rel="noopener noreferrer"
  // >
  //   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //     <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  //     <polyline points="15 3 21 3 21 9" />
  //     <line x1="10" y1="14" x2="21" y2="3" />
  //   </svg>
  //   Подробнее
  // </a>

  return (
    <SystemBlocker title="Проблемы с доступностью сайтов в рунете">
      В рунете наблюдаются частичные проблемы с доступностью сайтов / VPS на крупных хостинг-площадках.
      {/* включая <b>Бегет</b>. */} {" "}
       Причина в работе ТСПУ и новых правилах фильтрации трафика, которые затрагивают работу сайтов.
    </SystemBlocker>
  );
}

export default AirlineSystemBanner;
