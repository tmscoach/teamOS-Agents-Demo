"use client";

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ReportSection as ReportSectionType } from '@/src/lib/utils/report-parser';

interface ReportSectionProps {
  section: ReportSectionType;
  sectionNumber?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function ReportSection({ section, sectionNumber, isExpanded = true, onToggle }: ReportSectionProps) {
  const [localExpanded, setLocalExpanded] = useState(isExpanded);
  const expanded = onToggle ? isExpanded : localExpanded;
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  // Process HTML to handle images and base URLs
  let processedHtml = section.html;
  
  // Replace BASE_URL placeholders
  const baseUrl = process.env.NEXT_PUBLIC_TMS_BASE_URL || 'https://api-test.tms.global';
  processedHtml = processedHtml.replace(/{{BASE_URL}}/g, baseUrl);
  
  // Proxy images to avoid CORS issues and ensure proper display
  processedHtml = processedHtml.replace(
    /src="([^"]+)"/g,
    (match, url) => {
      if (url.includes('api-test.tms.global') || url.includes('GetGraph') || url.includes('Asset')) {
        return `src="/api/tms-proxy/image?url=${encodeURIComponent(url)}"`;
      }
      return match;
    }
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
          {sectionNumber && <span className="section-number">{sectionNumber}</span>}
          {section.title}
        </h3>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      {expanded && (
        <div className="px-6 py-4 border-t border-gray-200">
          {/* Render HTML content safely */}
          <div 
            className="tms-report-content prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />
        </div>
      )}
    </div>
  );
}