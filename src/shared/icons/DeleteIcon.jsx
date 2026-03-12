import React from "react";
import Svg from "./Svg.jsx";

export default function DeleteIcon({ onClick, ...props }) {
  const strokeWidth = props.strokeWidth ?? "1";
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick ?? null}
      cursor={props.cursor ?? "default"}
    >
      <path
        d="M1.81641 5.85086C2.18599 11.6071 2.53974 14.6017 2.74974 16.0271C2.85641 16.7479 3.32974 17.3354 4.03849 17.5054C5.00307 17.7375 6.66432 18 9.24141 18C11.8185 18 13.4793 17.7375 14.4443 17.5059C15.1527 17.3359 15.626 16.7484 15.7327 16.0275C15.9431 14.6017 16.2964 11.6071 16.666 5.84961"
        stroke="#545873"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.1722 2.24C13.6555 2.2675 14.8114 2.3125 15.6397 2.35458C16.6355 2.40458 17.5605 2.935 17.8389 3.8925C17.8805 4.03625 17.9197 4.18833 17.9539 4.34958C18.118 5.11625 17.5443 5.775 16.763 5.84125C15.5047 5.9475 13.2018 6.06833 9.23095 6.06833C5.26053 6.06833 2.9572 5.9475 1.69928 5.84125C0.917615 5.77542 0.340531 5.11208 0.542615 4.35458C0.615531 4.08167 0.705115 3.8325 0.799281 3.61125C1.13803 2.81833 1.95345 2.40917 2.81428 2.36167C3.60928 2.31833 4.76637 2.26917 6.30887 2.24C6.53709 1.72236 6.91094 1.28226 7.38486 0.973317C7.85877 0.664375 8.41231 0.499926 8.97803 0.5H9.50387C10.0695 0.500006 10.623 0.664494 11.0968 0.973431C11.5706 1.28237 11.9444 1.72242 12.1726 2.24H12.1722Z"
        stroke="#545873"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.74023 9.66699L7.1569 13.8337"
        stroke="#545873"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.7409 9.66699L11.3242 13.8337"
        stroke="#545873"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
