import React from "react";

interface ArrowRightCircle1Props {
  className?: string;
}

export const ArrowRightCircle1 = ({ className }: ArrowRightCircle1Props) => {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_arrow_right)">
        <path
          d="M8.00004 14.6666C11.6819 14.6666 14.6667 11.6818 14.6667 7.99992C14.6667 4.31802 11.6819 1.33325 8.00004 1.33325C4.31814 1.33325 1.33337 4.31802 1.33337 7.99992C1.33337 11.6818 4.31814 14.6666 8.00004 14.6666Z"
          stroke="#020617"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="0.833333"
        />

        <path
          d="M8 10.6666L10.6667 7.99992L8 5.33325"
          stroke="#020617"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="0.833333"
        />

        <path
          d="M5.33337 8H10.6667"
          stroke="#020617"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="0.833333"
        />
      </g>

      <defs>
        <clipPath id="clip0_arrow_right">
          <rect fill="white" height="16" width="16" />
        </clipPath>
      </defs>
    </svg>
  );
};