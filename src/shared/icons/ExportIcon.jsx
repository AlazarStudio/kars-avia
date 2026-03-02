import React from "react";
import Svg from "./Svg.jsx";

export default function ExportIcon(props) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.125 6.875L13.25 1.75" stroke="var(--main-gray)" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.75 4.25V1.25H10.75" stroke="var(--main-gray)" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.875 1.25H5.625C2.5 1.25 1.25 2.5 1.25 5.625V9.375C1.25 12.5 2.5 13.75 5.625 13.75H9.375C12.5 13.75 13.75 12.5 13.75 9.375V8.125" stroke="var(--main-gray)" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
