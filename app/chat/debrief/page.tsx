"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import DebriefLayout from './components/DebriefLayout';

function DebriefPageLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export default function DebriefPage() {
  const searchParams = useSearchParams();
  const agentName = searchParams.get('agent') || 'DebriefAgent';
  const reportType = searchParams.get('reportType') || 'TMP';
  const subscriptionId = searchParams.get('subscriptionId');
  
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For now, we'll simulate loading
    // In Phase 4, this will call the actual report loading API
    const loadReport = async () => {
      try {
        setIsLoading(true);
        // TODO: Implement actual report loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        setReportData({
          type: reportType,
          subscriptionId: subscriptionId || '21989', // Default test subscription
          loaded: true
        });
      } catch (err) {
        setError('Failed to load report');
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [reportType, subscriptionId]);

  if (isLoading) {
    return <DebriefPageLoading />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">
          <p className="text-lg font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<DebriefPageLoading />}>
      <DebriefLayout 
        agentName={agentName}
        reportType={reportType as 'TMP' | 'QO2' | 'TeamSignals'}
        reportData={reportData}
      />
    </Suspense>
  );
}