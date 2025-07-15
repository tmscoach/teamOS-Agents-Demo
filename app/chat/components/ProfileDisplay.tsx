"use client";

import React from "react";

interface ProfileDisplayProps {
  userName?: string;
  userRole?: string;
}

// Constants for styling
const AVATAR_SIZE = 118;
const AVATAR_ICON_SIZE = 56; // w-14 h-14 = 3.5rem = 56px
const NAME_MARGIN_TOP = 32; // mt-8 = 2rem = 32px
const NAME_FONT_SIZE = 24; // text-2xl
const NAME_TRACKING = -0.48;
const NAME_LINE_HEIGHT = 24; // leading-6 = 1.5rem = 24px
const ROLE_MARGIN_TOP = 8; // mt-2 = 0.5rem = 8px
const ROLE_FONT_SIZE = 14; // text-sm
const ROLE_TRACKING = -0.28;
const ROLE_LINE_HEIGHT = 24; // leading-6 = 1.5rem = 24px

export default function ProfileDisplay({ userName, userRole }: ProfileDisplayProps) {
  // Extract first name if full name is provided
  const displayName = userName ? userName.split(' ')[0] : "";
  
  return (
    <div className="flex flex-col items-center">
      {/* Avatar */}
      <div 
        className="items-center justify-center bg-[color:var(--radix-colours-slate-4)] rounded-full overflow-hidden border border-dashed border-[color:var(--shadcn-ui-border)] shadow-[var(--shadow-md)] flex"
        style={{
          width: `${AVATAR_SIZE}px`,
          height: `${AVATAR_SIZE}px`
        }}
      >
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <svg 
            className="text-gray-400" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            style={{
              width: `${AVATAR_ICON_SIZE}px`,
              height: `${AVATAR_ICON_SIZE}px`
            }}
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      </div>

      {/* Name and Role */}
      <div className="text-center" style={{ marginTop: `${NAME_MARGIN_TOP}px` }}>
        <div 
          className="font-bold text-black text-center"
          style={{
            fontSize: `${NAME_FONT_SIZE}px`,
            letterSpacing: `${NAME_TRACKING}px`,
            lineHeight: `${NAME_LINE_HEIGHT}px`,
            minHeight: `${NAME_LINE_HEIGHT}px`
          }}
        >
          {displayName || "\u00A0"} {/* Non-breaking space to maintain height */}
        </div>
        <div 
          className="font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-center whitespace-nowrap"
          style={{
            marginTop: `${ROLE_MARGIN_TOP}px`,
            fontSize: `${ROLE_FONT_SIZE}px`,
            letterSpacing: `${ROLE_TRACKING}px`,
            lineHeight: `${ROLE_LINE_HEIGHT}px`
          }}
        >
          {userRole || "..."}
        </div>
      </div>
    </div>
  );
}