"use client";

import { useMemo, memo } from 'react';
import RawReportViewer from './RawReportViewer';
import styles from './StyledReportViewer.module.css';

interface StyledReportViewerProps {
  html: string;
  onSectionChange?: (section: string) => void;
}

const StyledReportViewer = memo(function StyledReportViewer({ html, onSectionChange }: StyledReportViewerProps) {
  // Enhance HTML with additional classes for styling
  const enhancedHtml = useMemo(() => {
    let enhanced = html;
    
    // Add classes to sections for styling
    enhanced = enhanced.replace(
      /<section id="([^"]+)">/g, 
      '<section id="$1" class="report-section">'
    );
    
    // Add classes to bordered divs (often used for cards in TMP reports)
    enhanced = enhanced.replace(
      /<div class="border">/g,
      '<div class="border report-card">'
    );
    
    // Add classes to main content areas
    enhanced = enhanced.replace(
      /<div class="introductionsummary">/g,
      '<div class="introductionsummary report-intro-summary">'
    );
    
    // Enhance table styling
    enhanced = enhanced.replace(
      /<div class="rolestable">/g,
      '<div class="rolestable report-roles-table">'
    );
    
    // Add wrapper class to bargraph sections
    enhanced = enhanced.replace(
      /<div class="bargraph">/g,
      '<div class="bargraph report-bar-graph">'
    );
    
    return enhanced;
  }, [html]);
  
  return (
    <div className={styles.reportContainer}>
      <RawReportViewer 
        html={enhancedHtml}
        onSectionChange={onSectionChange}
      />
    </div>
  );
});

export default StyledReportViewer;