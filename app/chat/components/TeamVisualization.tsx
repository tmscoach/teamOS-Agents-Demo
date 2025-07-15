"use client";

import React from "react";

interface TeamVisualizationProps {
  managerName?: string;
  managerRole?: string;
  teamSize?: number;
}

export default function TeamVisualization({ 
  managerName, 
  managerRole = "Manager", 
  teamSize = 0 
}: TeamVisualizationProps) {
  // Extract first name if full name is provided
  const displayName = managerName ? managerName.split(' ')[0] : "Manager";
  
  // Define team member colors from the mockups
  const memberColors = ['#f8dcb8', '#edbbd2', '#cfbcd9', '#a7c0e3'];
  
  // Create array of team members (up to 4 for display)
  const teamMembers = Array.from({ length: Math.min(teamSize, 4) }, (_, i) => ({
    id: i,
    color: memberColors[i % memberColors.length]
  }));

  return (
    <div className="flex flex-col items-center">
      {/* Manager avatar at the top */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-[118px] h-[118px] items-center justify-center bg-[color:var(--radix-colours-slate-4)] rounded-[100px] overflow-hidden border border-dashed border-[color:var(--shadcn-ui-border)] shadow-[var(--shadow-md)] flex">
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <svg className="w-14 h-14 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
        <div className="mt-6 text-center">
          <div className="font-bold text-black text-2xl text-center tracking-[-0.48px] leading-6">
            {displayName}
          </div>
          <div className="mt-1 font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-sm text-center tracking-[-0.28px] leading-6">
            {managerRole}
          </div>
        </div>
      </div>

      {/* Team members visualization */}
      {teamSize > 0 && (
        <div className="relative">
          {/* Grid background pattern */}
          <div className="absolute w-full h-[113px] top-0 left-0 pointer-events-none">
            <svg width="100%" height="113" viewBox="0 0 650 113" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M325 0V113" stroke="#E5E7EB" strokeDasharray="4 4"/>
              <path d="M0 56.5H650" stroke="#E5E7EB" strokeDasharray="4 4"/>
              {teamMembers.map((_, i) => (
                <path key={i} d={`M${73 + (i * 146)} 56.5V113`} stroke="#E5E7EB" strokeDasharray="4 4"/>
              ))}
            </svg>
          </div>
          
          {/* Team member avatars */}
          <div className="relative inline-flex items-center gap-16 pt-[102px]">
            {teamMembers.map((member) => (
              <div key={member.id} className="w-[146px]">
                <div 
                  className={`w-[76px] h-[76px] mx-auto flex items-center justify-center rounded-[100px] overflow-hidden border border-dashed border-[color:var(--shadcn-ui-border)] shadow-shadow-sm`}
                  style={{ backgroundColor: member.color }}
                >
                  <svg className="w-10 h-10" fill="#020617" opacity="0.5" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className="mt-3 text-center">
                  <div className="font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-xs">
                    Team Member {member.id + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Show additional count if team is larger than 4 */}
          {teamSize > 4 && (
            <div className="mt-4 text-center text-sm text-[color:var(--shadcn-ui-muted-foreground)]">
              +{teamSize - 4} more team member{teamSize > 5 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}