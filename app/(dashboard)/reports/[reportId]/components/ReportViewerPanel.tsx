'use client';

import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import StyledReportViewer from '@/app/chat/debrief/components/StyledReportViewer';
import { FileText, FileSearch } from 'lucide-react';

interface ReportViewerPanelProps {
  summaryHtml: string;
  fullHtml: string;
  reportType: string;
}

export function ReportViewerPanel({ 
  summaryHtml, 
  fullHtml, 
  reportType 
}: ReportViewerPanelProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');
  const [currentSection, setCurrentSection] = useState<string>('');

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    console.log('[ReportViewerPanel] Section changed to:', section);
  };

  // Get report type display name
  const reportTypeNames: Record<string, string> = {
    TMP: 'Team Management Profile',
    QO2: 'Quadrant of Opportunity',
    TEAM_SIGNALS: 'Team Signals',
    TEAM_SIGNALS_360: 'Team Signals 360'
  };

  const displayName = reportTypeNames[reportType] || reportType;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with toggle */}
      <div className="border-b bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
          </div>
          
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as 'summary' | 'full')}
            className="bg-white border border-gray-200 rounded-lg p-1"
          >
            <ToggleGroupItem 
              value="summary" 
              className="data-[state=on]:bg-gray-900 data-[state=on]:text-white px-3 py-1.5 text-sm"
            >
              <FileSearch className="h-4 w-4 mr-1.5" />
              Summary
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="full"
              className="data-[state=on]:bg-gray-900 data-[state=on]:text-white px-3 py-1.5 text-sm"
            >
              <FileText className="h-4 w-4 mr-1.5" />
              Full Report
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {currentSection && (
          <p className="mt-2 text-sm text-gray-500">
            Viewing: <span className="font-medium">{currentSection}</span>
          </p>
        )}
      </div>
      
      {/* Report content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'summary' ? (
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Summary view - centered and constrained width */}
            <div className="prose prose-sm max-w-none">
              <h3 className="text-xl font-semibold mb-4">Report Summary</h3>
              <StyledReportViewer 
                html={summaryHtml}
                onSectionChange={handleSectionChange}
              />
            </div>
            
            {/* Prompt to view full report */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 Switch to "Full Report" above for detailed analysis and complete assessment results.
              </p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-8">
            {/* Full report view */}
            <StyledReportViewer 
              html={fullHtml}
              onSectionChange={handleSectionChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}