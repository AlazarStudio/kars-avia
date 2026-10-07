// Шаблон релиза «Что нового» (systemUpdate) для кнопки «Заполнить из шаблона»
// в редакторе src/Components/Blocks/SystemUpdate/SystemUpdateSettings.jsx.
// Формат массива аудиторий — тот, что принимает audiencesArrayToState:
// [{ audience: "AIRLINE" | "DISPATCHER" | "HOTEL", sections: { new, updates, fixes } }],
// пункт = { title, description }. Пустая секция — просто пустой массив.
// Шаблон только заполняет форму, ничего не сохраняет.

export const version = "4.4.9";

export const title = "Что нового в версии 4.4.9";

export const audiences = [
  {
    audience: "AIRLINE",
    sections: {
      new: [],
      updates: [
        {
          title: "Главная страница: сразу ФАП",
          description:
            "Если вам доступны только заявки на пассажиров, главная страница открывает раздел ФАП вместо устаревшего списка «Пассажиры».",
        },
        {
          title: "Инструкции: документы Word скачиваются",
          description:
            "Файлы .doc и .docx в «Инструкциях» по клику скачиваются, как таблицы и презентации; встроенного просмотра у них больше нет.",
        },
      ],
      fixes: [
        {
          title: "Безопасность",
          description:
            "Усилена защита персональных данных.",
        },
      ],
    },
  },
  {
    audience: "DISPATCHER",
    sections: {
      new: [],
      updates: [
        {
          title: "Главная страница: сразу ФАП",
          description:
            "Если в отделе нет доступа к «Эскадрилье», главная страница открывает раздел ФАП вместо устаревшего списка «Пассажиры».",
        },
        {
          title: "Инструкции: документы Word скачиваются",
          description:
            "Файлы .doc и .docx в «Инструкциях» по клику скачиваются, как таблицы и презентации; встроенного просмотра у них больше нет.",
        },
      ],
      fixes: [
        {
          title: "Безопасность",
          description:
            "Усилена защита персональных данных.",
        },
      ],
    },
  },
  {
    audience: "HOTEL",
    sections: {
      new: [],
      updates: [
        {
          title: "Инструкции: документы Word скачиваются",
          description:
            "Файлы .doc и .docx в «Инструкциях» по клику скачиваются, как таблицы и презентации; встроенного просмотра у них больше нет.",
        },
      ],
      fixes: [
        {
          title: "Безопасность",
          description:
            "Усилена защита персональных данных.",
        },
      ],
    },
  },
];

export default { version, title, audiences };
