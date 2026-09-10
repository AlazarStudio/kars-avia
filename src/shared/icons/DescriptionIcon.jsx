// Лист со строками текста — в стиле иконок вкладок настроек гостиницы
// (20×20, штрих #545873; активную вкладку перекрашивает .tabActive svg path).
export default function DescriptionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.5 2.5H12L15.5 6V17C15.5 17.2761 15.2761 17.5 15 17.5H4.5C4.22386 17.5 4 17.2761 4 17V3C4 2.72386 4.22386 2.5 4.5 2.5Z"
        stroke="#545873"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M12 2.5V6H15.5" stroke="#545873" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M7 6.5H9" stroke="#545873" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M7 9.5H12.5" stroke="#545873" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M7 12.5H12.5" stroke="#545873" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
