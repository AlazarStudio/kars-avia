// Расширение .js обязательно: модуль импортируется тестом под node --test,
// а он не резолвит extensionless-пути (в src/utils/access.js та же причина
// у `../roles.js`).
import { hasAccessMenu, isSuperAdmin } from "../../../../utils/access.js";

// Вкладки страницы «Аналитика» и права, которыми они гейтятся. Ключи равные:
// раздел открыт, если доступна хотя бы одна вкладка (см. canSeeAnalytics).
export const ANALYTICS_TABS = [
  { key: "squadron", label: "Эскадрилья", accessKey: "analyticsMenu" },
  { key: "passengers", label: "Пассажиры", accessKey: "analyticsPassengerMenu" },
];

// Суперадмин приходит без accessMenu — SuperAdminContent рендерит страницу как
// <Analytics user={user} />. Проверяем роль до ключей, иначе у него не осталось
// бы ни одной вкладки.
export const visibleAnalyticsTabs = (accessMenu, user) =>
  ANALYTICS_TABS.filter(
    (tab) => isSuperAdmin(user) || hasAccessMenu(accessMenu, tab.accessKey),
  );
