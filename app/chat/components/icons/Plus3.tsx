import React from "react";

export const Plus3 = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 3.33325V12.6666"
        stroke="#020617"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.833333"
      />

      <path
        d="M3.3335 8H12.6668"
        stroke="#020617"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.833333"
      />
    </svg>
  );
};