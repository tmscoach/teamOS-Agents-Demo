"use client";

import { useState } from 'react';
import ReportViewer from './ReportViewer';
import ChatInterface from './ChatInterface';

interface DebriefLayoutProps {
  agentName: string;
  reportType: 'TMP' | 'QO2' | 'TeamSignals';
  reportData: any;
}

export default function DebriefLayout({ agentName, reportType, reportData }: DebriefLayoutProps) {
  const [chatExpanded, setChatExpanded] = useState(false);
  const [visibleSection, setVisibleSection] = useState('overview');

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-10 h-[108px] bg-white border-b border-[var(--shadcn-ui-border,#e5e7eb)]">
        <div className="flex h-[50px] items-center justify-between mt-8 mx-6">
          <header className="flex flex-col gap-1.5 px-4">
            <h1 className="text-2xl font-semibold tracking-[-0.72px] text-gray-900">
              {reportType === 'TMP' && 'Team Management Profile'}
              {reportType === 'QO2' && 'QO² Assessment'}
              {reportType === 'TeamSignals' && 'Team Signals Report'}
            </h1>
            <p className="text-sm text-gray-500">
              Here's a summary of your {reportType} profile.
            </p>
          </header>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Done
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="pt-[108px] pb-20 h-full overflow-y-auto bg-[#f1f5f94c]">
        <div className="max-w-[1280px] mx-auto px-10 py-8">
          <ReportViewer 
            reportType={reportType} 
            reportData={reportData}
            onSectionChange={setVisibleSection}
          />
        </div>
      </div>

      {/* Chat Interface */}
      <ChatInterface
        agentName={agentName}
        reportType={reportType}
        visibleSection={visibleSection}
        expanded={chatExpanded}
        onToggle={() => setChatExpanded(!chatExpanded)}
      />
    </div>
  );
}