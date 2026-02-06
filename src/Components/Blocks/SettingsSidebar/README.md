# SettingsSidebar - Компонент настроек через боковое меню

## Описание

Универсальный компонент для управления настройками доступа и уведомлений департаментов через боковое меню (Sidebar). Поддерживает два типа пользователей: авиакомпании и диспетчеры.

## Структура компонентов

```
SettingsSidebar/
├── SettingsSidebar.jsx           # Основной компонент
├── AccessPermissionsPanel.jsx     # Панель настроек доступа
├── NotificationsPermissionsPanel.jsx  # Панель настроек уведомлений
├── SettingsSidebar.module.css    # Стили
└── README.md                      # Документация
```

## Использование

### Для диспетчеров (Company.jsx)

```jsx
import SettingsSidebar from "../SettingsSidebar/SettingsSidebar";

// В компоненте
const [showSettingsSidebar, setShowSettingsSidebar] = useState(false);
const [selectedDepartment, setSelectedDepartment] = useState(null);
const settingsSidebarRef = useRef(null);

const openAccessDepartment = (department) => {
  setSelectedDepartment(department);
  setShowSettingsSidebar(true);
};

// Рендер
<SettingsSidebar
  show={showSettingsSidebar}
  sidebarRef={settingsSidebarRef}
  onClose={() => {
    setShowSettingsSidebar(false);
    setSelectedDepartment(null);
  }}
  user={user}
  departmentId={selectedDepartment?.id}
  departmentItem={selectedDepartment}
  type="dispatcher"
/>
```

### Для авиакомпаний (AirlineCompany_tabComponent.jsx)

```jsx
<SettingsSidebar
  show={showSettingsSidebar}
  sidebarRef={settingsSidebarRef}
  onClose={() => {
    setShowSettingsSidebar(false);
    setSelectedDepartmentForSettings(null);
  }}
  user={user}
  airlineId={id}
  departmentItem={selectedDepartmentForSettings}
  type="airline"
/>
```

## Пропсы

| Проп | Тип | Обязательный | Описание |
|------|-----|--------------|----------|
| `show` | boolean | Да | Показывать/скрывать Sidebar |
| `sidebarRef` | React.Ref | Да | Реф для управления Sidebar |
| `onClose` | function | Да | Колбэк для закрытия |
| `user` | object | Да | Объект текущего пользователя |
| `departmentId` | string | Для диспетчеров | ID департамента диспетчера |
| `airlineId` | string | Для авиакомпаний | ID авиакомпании |
| `departmentItem` | object | Да | Объект департамента с настройками |
| `type` | "airline" \| "dispatcher" | Да | Тип пользователя |

## Функциональность

### Вкладки
- **Доступ** - настройка прав доступа к разделам системы
- **Уведомления** - настройка уведомлений на почту и в браузере

### Режимы
- **Просмотр** - отображение текущих настроек (по умолчанию)
- **Редактирование** - возможность изменения настроек (активируется кнопкой "Изменить")

### Настройки доступа

Для обоих типов:
- Эскадрилья (доступ, создание, чат, редактирование)
- Трансфер (доступ, создание, чат, редактирование)
- Пассажиры (доступ, создание, редактирование)
- Пользователи (доступ, добавление, редактирование)
- Сотрудники (доступ, добавление, редактирование)
- Реестр договоров (доступ)
- Аналитика (доступ, выгрузка - только для авиакомпаний)
- Об авиакомпании (доступ, редактирование)
- Отчёты (доступ, создание)

**Дополнительно для авиакомпаний:**
- Выбор должностей через MultiSelectAutocomplete

### Настройки уведомлений

Для обоих типов:
- **Заявки**: создание, изменение дат, смена размещения, отмена
- **Брони**: создание, изменение дат, обновление, смена размещения
- **Сообщения**: новое сообщение в чате

Каждое уведомление поддерживает два канала:
1. На почту
2. Уведомление в браузере

## GraphQL запросы

### Используемые запросы
- `GET_AIRLINE_COMPANY` - получение данных авиакомпании
- `GET_DISPATCHER_DEPARTMENTS` - получение департаментов диспетчеров
- `GET_AIRLINE_POSITIONS` - получение должностей авиакомпании

### Используемые мутации
- `UPDATE_AIRLINE` - обновление настроек авиакомпании
- `UPDATE_DISPATCHER_DEPARTMENT` - обновление настроек департамента диспетчера

## Обратная совместимость

Существующие страницы настроек (`/access`, `/notifications`, `/dispatcherAccess`, `/dispatcherNotifications`) сохранены и продолжают работать. Настройки можно открыть двумя способами:
1. Через Sidebar (из таблицы департаментов по клику на иконку настроек)
2. Через URL (старый способ, через навигацию)

## Стилизация

Дизайн соответствует макетам с двумя вкладками и адаптирован под существующий UI проекта:
- Использует компонент `Sidebar` из `../Sidebar/Sidebar`
- Интегрирован с `MUISwitch` для переключателей
- Использует `Button` для кнопок действий
- Поддерживает систему уведомлений через `Notification`

## Обработка ошибок

- При ошибке сохранения показывается уведомление "Ошибка при сохранении. Попробуйте позже."
- При успешном сохранении показывается уведомление "Изменения сохранены."
- Все ошибки логируются в консоль для отладки
