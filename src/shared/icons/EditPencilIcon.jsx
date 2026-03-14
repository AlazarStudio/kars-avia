import React from "react";

export default function EditPencilIcon({ onClick, ...props }) {
  const strokeWidth = props.strokeWidth ?? "var(--svg-stroke-width)";
  return (
    <svg
      width="19"
      height="20"
      viewBox="0 0 19 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick ?? null}
      cursor={props.cursor ?? "default"}
    >
      <path
        d="M7.10571 3.44238C5.86286 3.49953 4.64571 3.63381 3.45857 3.77095C2.78945 3.84986 2.16656 4.15235 1.69079 4.62942C1.21502 5.10648 0.914232 5.73019 0.837143 6.39953C0.665714 7.93953 0.5 9.53238 0.5 11.161C0.5 12.791 0.665714 14.3838 0.837143 15.9252C0.991429 17.2967 2.08714 18.3924 3.45857 18.551C5.00714 18.7295 6.60714 18.9081 8.24429 18.9081C9.88286 18.9081 11.4829 18.7295 13.0314 18.551C13.6999 18.4719 14.3221 18.1697 14.7975 17.6932C15.273 17.2167 15.5738 16.5938 15.6514 15.9252C15.7871 14.7953 15.8881 13.6614 15.9543 12.5252"
        stroke="#545873"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.906 0.729364L8.64171 6.70079L7.92171 10.0936C7.80457 10.6394 8.37457 11.1565 8.90742 10.9879L12.2817 9.92794L17.7189 4.20651C18.6231 3.25651 18.4646 1.66651 17.3717 0.699364C16.3046 -0.243493 14.7531 -0.230635 13.906 0.729364Z"
        stroke="#545873"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
