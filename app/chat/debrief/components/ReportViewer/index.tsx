"use client";

import { useEffect } from 'react';
import MainCard from './sections/MainCard';
import NavigationMenu from './sections/NavigationMenu';
import Frame from './sections/Frame';
import DbMainCard from './sections/DbMainCard';
import { ParsedReport } from '@/lib/utils/report-parser';

interface ReportViewerProps {
  reportType: 'TMP' | 'QO2' | 'TeamSignals';
  reportData: ParsedReport;
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

  return (
    <div className="flex flex-col gap-2.5">
      <MainCard credits={reportData.credits} />
      <NavigationMenu profile={reportData.profile} scores={reportData.scores} />
      <Frame recommendations={reportData.recommendations} />
      <DbMainCard title={reportData.profile.name} insights={reportData.insights} />
    </div>
  );
}