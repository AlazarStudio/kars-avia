export const DAY_WIDTH = 44;
export const ROW_HEIGHT = 52;
export const CAT_HEADER_HEIGHT = 38;
export const LEFT_PANEL_WIDTH = 210;
export const TIMELINE_HEADER_HEIGHT = 64;

export const BOOKING_STATUS = {
  new:         { label: 'Новое',        color: '#66BB6A', text: '#fff' },
  confirmed:   { label: 'Подтверждено', color: '#FFA726', text: '#fff' },
  checked_in:  { label: 'Заселён',      color: '#42A5F5', text: '#fff' },
  checked_out: { label: 'Выехал',       color: '#B0BEC5', text: '#fff' },
  cancelled:   { label: 'Отменено',     color: '#EF5350', text: '#fff' },
  no_show:     { label: 'Не явился',    color: '#8D6E63', text: '#fff' },
};

export const HK_STATUS = {
  dirty:    { label: 'Грязный',   color: '#EF5350', bg: '#FFEBEE' },
  cleaning: { label: 'Убирается', color: '#FF9800', bg: '#FFF3E0' },
  checking: { label: 'Проверка',  color: '#9C27B0', bg: '#F3E5F5' },
  clean:    { label: 'Чистый',    color: '#43A047', bg: '#E8F5E9' },
  ready:    { label: 'Готов',     color: '#1E88E5', bg: '#E3F2FD' },
};

export const BOOKING_SOURCE = {
  direct:      'Стойка',
  online:      'Онлайн',
  phone:       'Телефон',
  ota:         'ОТА',
  corporate:   'Корпоратив',
};

export const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Дашборд',        icon: 'dashboard' },
  { id: 'timeline',     label: 'Шахматка',       icon: 'timeline' },
  { id: 'bookings',     label: 'Бронирования',   icon: 'bookings' },
  { id: 'rooms',        label: 'Номерной фонд',  icon: 'rooms' },
  { id: 'housekeeping', label: 'Уборка',         icon: 'housekeeping' },
  { id: 'tariffs',      label: 'Тарифы',         icon: 'tariffs' },
  { id: 'reports',      label: 'Отчёты',         icon: 'reports' },
];
