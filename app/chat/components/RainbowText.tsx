"use client";

import React from "react";

interface RainbowTextProps {
  children: React.ReactNode;
  className?: string;
}

export default function RainbowText({ children, className = "" }: RainbowTextProps) {
  return (
    <span 
      className={`font-semibold bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: 'linear-gradient(to right, #FFF303 0%, #FBA93D 15%, #ED0191 30%, #A763AD 45%, #0185C6 60%, #02B5E6 75%, #01A172 90%, #A2D36F 100%)'
      }}
    >
      {children}
    </span>
  );
}