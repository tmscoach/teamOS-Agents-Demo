"use client";

import React from "react";

interface ProfileDisplayProps {
  userName?: string;
  userRole?: string;
}

export default function ProfileDisplay({ userName, userRole }: ProfileDisplayProps) {
  // Extract first name if full name is provided
  const displayName = userName ? userName.split(' ')[0] : "";
  
  return (
    <div className="flex flex-col items-center">
      {/* Avatar */}
      <div className="w-[118px] h-[118px] items-center justify-center bg-[color:var(--radix-colours-slate-4)] rounded-[100px] overflow-hidden border border-dashed border-[color:var(--shadcn-ui-border)] shadow-[var(--shadow-md)] flex">
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <svg className="w-14 h-14 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      </div>

      {/* Name and Role */}
      <div className="mt-8 text-center">
        <div className="font-bold text-black text-2xl text-center tracking-[-0.48px] leading-6 min-h-[24px]">
          {displayName || "\u00A0"} {/* Non-breaking space to maintain height */}
        </div>
        <div className="mt-2 font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-sm text-center tracking-[-0.28px] leading-6 whitespace-nowrap">
          {userRole || "..."}
        </div>
      </div>
    </div>
  );
}