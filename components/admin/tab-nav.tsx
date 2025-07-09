"use client";

import { cn } from "@/lib/utils";
import React, { useState } from "react";

interface Tab {
  id: string;
  label: string;
}

interface TabNavProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export function TabNav({ tabs, defaultTab, onTabChange, className }: TabNavProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={cn("flex gap-6 border-b border-[var(--teams-ui-border)] mb-6", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            "py-3 border-b-2 transition-all font-medium text-sm",
            activeTab === tab.id
              ? "border-[var(--teams-primary)] text-[var(--teams-text-primary)]"
              : "border-transparent text-[var(--teams-text-secondary)] hover:text-[var(--teams-text-primary)]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}