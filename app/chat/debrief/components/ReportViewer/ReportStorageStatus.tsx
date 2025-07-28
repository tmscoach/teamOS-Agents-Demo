"use client";

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface ReportStorageStatusProps {
  reportId?: string;
  subscriptionId: string;
}

export default function ReportStorageStatus({ reportId, subscriptionId }: ReportStorageStatusProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | 'none'>('none');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (reportId) {
      // TODO: Check actual storage status
      setStatus('completed');
    }
  }, [reportId]);

  const statusConfig = {
    none: {
      icon: <AlertCircle className="w-4 h-4" />,
      text: 'Not stored',
      color: 'text-gray-500'
    },
    pending: {
      icon: <Clock className="w-4 h-4" />,
      text: 'Pending',
      color: 'text-yellow-600'
    },
    processing: {
      icon: <RefreshCw className="w-4 h-4 animate-spin" />,
      text: 'Processing',
      color: 'text-blue-600'
    },
    completed: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      text: 'Stored',
      color: 'text-green-600'
    },
    failed: {
      icon: <AlertCircle className="w-4 h-4" />,
      text: 'Failed',
      color: 'text-red-600'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors ${config.color}`}
      >
        {config.icon}
        <span className="text-sm font-medium">{config.text}</span>
      </button>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
          <h4 className="font-semibold text-sm mb-2">Storage Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${config.color}`}>{config.text}</span>
            </div>
            {reportId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Report ID:</span>
                <span className="font-mono text-xs">{reportId.slice(0, 8)}...</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Subscription:</span>
              <span className="font-mono text-xs">{subscriptionId}</span>
            </div>
          </div>
          
          {status === 'completed' && (
            <p className="mt-3 text-xs text-gray-500">
              This report is permanently stored and available for search.
            </p>
          )}
        </div>
      )}
    </div>
  );
}