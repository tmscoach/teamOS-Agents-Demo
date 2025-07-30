import React from "react";

interface Oscar1Props {
  className?: string;
}

export const Oscar1 = ({ className }: Oscar1Props) => {
  return (
    <svg
      className={className}
      fill="none"
      height="41"
      viewBox="0 0 41 41"
      width="41"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M35.875 19.6459C35.8809 21.9007 35.3541 24.1249 34.3375 26.1375C33.1322 28.5493 31.2792 30.5778 28.9861 31.9959C26.693 33.414 24.0503 34.1657 21.3542 34.1667C19.0994 34.1726 16.8751 33.6458 14.8625 32.6292L5.125 35.875L8.37083 26.1375C7.35426 24.1249 6.82745 21.9007 6.83333 19.6459C6.83438 16.9497 7.58604 14.3071 9.00414 12.014C10.4222 9.72089 12.4508 7.86789 14.8625 6.66255C16.8751 5.64597 19.0994 5.11917 21.3542 5.12505H22.2083C25.7691 5.32149 29.1323 6.82443 31.6539 9.3461C34.1756 11.8678 35.6786 15.231 35.875 18.7917V19.6459Z"
        stroke="url(#paint0_linear_2845_8744)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />

      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint0_linear_2845_8744"
          x1="-26"
          x2="-0.481183"
          y1="5"
          y2="-22.6302"
        >
          <stop stopColor="#FFF303" />
          <stop offset="0.15" stopColor="#FBA93D" />
          <stop offset="0.3" stopColor="#ED0191" />
          <stop offset="0.45" stopColor="#A763AD" />
          <stop offset="0.6" stopColor="#0185C6" />
          <stop offset="0.75" stopColor="#02B5E6" />
          <stop offset="0.9" stopColor="#01A172" />
          <stop offset="1" stopColor="#A2D36F" />
        </linearGradient>
      </defs>
    </svg>
  );
};