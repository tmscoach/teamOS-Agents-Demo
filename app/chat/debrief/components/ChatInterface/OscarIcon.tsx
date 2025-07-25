"use client";

export default function OscarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="oscar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF303" />
          <stop offset="15%" stopColor="#FBA93D" />
          <stop offset="30%" stopColor="#ED0191" />
          <stop offset="45%" stopColor="#A763AD" />
          <stop offset="60%" stopColor="#0185C6" />
          <stop offset="75%" stopColor="#02B5E6" />
          <stop offset="90%" stopColor="#01A172" />
          <stop offset="100%" stopColor="#A2D36F" />
        </linearGradient>
      </defs>
      
      {/* Oscar trophy icon shape */}
      <path
        d="M10 2C10.5523 2 11 2.44772 11 3V5H13C13.5523 5 14 5.44772 14 6V8C14 9.10457 13.1046 10 12 10H11V12C11 12.5523 10.5523 13 10 13C9.44772 13 9 12.5523 9 12V10H8C6.89543 10 6 9.10457 6 8V6C6 5.44772 6.44772 5 7 5H9V3C9 2.44772 9.44772 2 10 2ZM9 15C9 14.4477 9.44772 14 10 14C10.5523 14 11 14.4477 11 15V17C11 17.5523 10.5523 18 10 18C9.44772 18 9 17.5523 9 17V15Z"
        fill="url(#oscar-gradient)"
      />
    </svg>
  );
}