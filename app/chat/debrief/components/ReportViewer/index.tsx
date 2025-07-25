"use client";

import { useEffect } from 'react';
import MainCard from './sections/MainCard';
import NavigationMenu from './sections/NavigationMenu';
import Frame from './sections/Frame';
import DbMainCard from './sections/DbMainCard';

interface ReportViewerProps {
  reportType: 'TMP' | 'QO2' | 'TeamSignals';
  reportData: any;
  onSectionChange: (section: string) => void;
}

export default function ReportViewer({ reportType, reportData, onSectionChange }: ReportViewerProps) {
  useEffect(() => {
    // Track visible section on scroll
    const handleScroll = () => {
      // TODO: Implement section tracking
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onSectionChange]);

  // For Phase 1, we'll show mock data
  // In Phase 2, this will parse actual report HTML
  return (
    <div className="flex flex-col gap-2.5">
      <MainCard />
      <NavigationMenu reportType={reportType} />
      <Frame />
      <DbMainCard reportType={reportType} />
    </div>
  );
}