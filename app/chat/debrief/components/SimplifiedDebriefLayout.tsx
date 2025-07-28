"use client";

import { useState } from 'react';
import RawReportViewer from './RawReportViewer';
import ChatInterface from './ChatInterface';
import { ParsedReport } from '@/src/lib/utils/report-parser';

interface SimplifiedDebriefLayoutProps {
  agentName: string;
  reportType: 'TMP' | 'QO2' | 'TeamSignals';
  reportHtml: string;
  reportData: ParsedReport;
}

export default function SimplifiedDebriefLayout({ agentName, reportType, reportHtml, reportData }: SimplifiedDebriefLayoutProps) {
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

      {/* Scrollable Content Area - Display raw HTML */}
      <div className="pt-[108px] pb-20 h-full overflow-y-auto bg-white">
        <div className="w-full max-w-[900px] mx-auto px-6 py-8">
          <RawReportViewer 
            html={reportHtml}
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
        reportData={reportData}
      />
    </div>
  );
}