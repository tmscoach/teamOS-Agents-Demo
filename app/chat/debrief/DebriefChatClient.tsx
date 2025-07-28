"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from 'ai/react';
import DebriefChatLayout from './components/DebriefChatLayout';
import { Loader2 } from 'lucide-react';
import { ReportLoader } from '@/src/lib/services/report-loader';
import { ParsedReport } from '@/src/lib/utils/report-parser';

export default function DebriefChatClient() {
  const searchParams = useSearchParams();
  const agentName = searchParams.get('agent') || 'DebriefAgent';
  const reportType = searchParams.get('reportType') || 'TMP';
  const subscriptionId = searchParams.get('subscriptionId');
  
  const [reportData, setReportData] = useState<ParsedReport | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const [visibleSection, setVisibleSection] = useState('overview');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);

  // Memoize the body object to prevent unnecessary re-renders
  const chatBody = useMemo(() => ({
    conversationId,
    agentName,
    reportType,
    subscriptionId,
    reportData,
    visibleSection
  }), [conversationId, agentName, reportType, subscriptionId, reportData, visibleSection]);

  // Use the useChat hook for streaming
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat/debrief',
    body: chatBody,
    onResponse(response) {
      // Extract conversation ID from headers
      const newConversationId = response.headers.get('X-Conversation-ID');
      if (newConversationId) {
        currentConversationIdRef.current = newConversationId;
        if (newConversationId !== conversationId) {
          setConversationId(newConversationId);
        }
      }
    },
    onError(error) {
      console.error('Chat error:', error);
    }
  });

  // Load the report
  useEffect(() => {
    const loadReport = async () => {
      try {
        setReportLoading(true);
        
        // Load the report using ReportLoader service
        const report = await ReportLoader.loadReport({
          subscriptionId: subscriptionId || '21989', // Default test subscription
          reportType: reportType as 'TMP' | 'QO2' | 'TeamSignals'
        });
        
        setReportData(report);
      } catch (err) {
        console.error('Error loading report:', err);
        setReportError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setReportLoading(false);
      }
    };

    loadReport();
  }, [reportType, subscriptionId]);

  // Send initial greeting when report loads
  useEffect(() => {
    if (reportData && messages.length === 0 && !isLoading) {
      // Add a small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        // Send an empty message to trigger the agent's greeting
        append({
          role: 'user',
          content: ''
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [reportData, messages.length, isLoading, append]);

  // Memoize the report HTML to prevent unnecessary re-processing
  const reportHtml = useMemo(() => reportData?.rawHtml || '', [reportData?.rawHtml]);
  
  // Memoize the section change callback
  const handleSectionChange = useCallback((section: string) => {
    setVisibleSection(section);
  }, []);

  if (reportLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (reportError || !reportData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">
          <p className="text-lg font-semibold">Error</p>
          <p>{reportError || 'Failed to load report data'}</p>
        </div>
      </div>
    );
  }

  return (
    <DebriefChatLayout
      messages={messages}
      input={input}
      isLoading={isLoading}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      reportHtml={reportHtml}
      reportData={reportData}
      reportType={reportType as 'TMP' | 'QO2' | 'TeamSignals'}
      onSectionChange={handleSectionChange}
    />
  );
}