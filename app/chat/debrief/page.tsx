"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import SimplifiedDebriefLayout from './components/SimplifiedDebriefLayout';
import { ReportLoader } from '@/src/lib/services/report-loader';
import { ParsedReport } from '@/src/lib/utils/report-parser';

function DebriefPageLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

function DebriefPageContent() {
  const searchParams = useSearchParams();
  const agentName = searchParams.get('agent') || 'DebriefAgent';
  const reportType = searchParams.get('reportType') || 'TMP';
  const subscriptionId = searchParams.get('subscriptionId');
  
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ParsedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setIsLoading(true);
        
        // Load the report using ReportLoader service
        const report = await ReportLoader.loadReport({
          subscriptionId: subscriptionId || '21989', // Default test subscription
          reportType: reportType as 'TMP' | 'QO2' | 'TeamSignals'
        });
        
        setReportData(report);
      } catch (err) {
        console.error('Error loading report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [reportType, subscriptionId]);

  if (isLoading) {
    return <DebriefPageLoading />;
  }

  if (error || !reportData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">
          <p className="text-lg font-semibold">Error</p>
          <p>{error || 'Failed to load report data'}</p>
        </div>
      </div>
    );
  }

  return (
    <SimplifiedDebriefLayout 
      agentName={agentName}
      reportType={reportType as 'TMP' | 'QO2' | 'TeamSignals'}
      reportHtml={reportData.rawHtml || ''}
      reportData={reportData}
    />
  );
}

export default function DebriefPage() {
  return (
    <Suspense fallback={<DebriefPageLoading />}>
      <DebriefPageContent />
    </Suspense>
  );
}