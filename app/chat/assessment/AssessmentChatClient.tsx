"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from 'ai/react';
import AssessmentLayout from './components/AssessmentLayout';
import { Loader2 } from 'lucide-react';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

interface AssessmentSubscription {
  subscriptionId: string;
  workflowId: string;
  workflowName: string;
  assessmentType: string;
  status: string;
}

interface WorkflowState {
  subscriptionId: string;
  workflowId: string;
  currentPageId: number;
  currentSectionId: number;
  baseContentId: number;
  questions: any[];
  navigationInfo: any;
  completionPercentage: number;
}

export default function AssessmentChatClient() {
  const searchParams = useSearchParams();
  const agentName = searchParams.get('agent') || 'AssessmentAgent';
  const assessmentType = searchParams.get('assessmentType');
  const directSubscriptionId = searchParams.get('subscriptionId');
  
  const [availableAssessments, setAvailableAssessments] = useState<AssessmentSubscription[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentSubscription | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleSection, setVisibleSection] = useState('assessment');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);

  // Track answers for the current page
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, string>>({});

  // Memoize the body object to prevent unnecessary re-renders
  const chatBody = useMemo(() => ({
    conversationId,
    agentName,
    selectedAssessment,
    workflowState,
    visibleSection,
    currentAnswers
  }), [conversationId, agentName, selectedAssessment, workflowState, visibleSection, currentAnswers]);

  // Use the useChat hook for streaming
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat/assessment',
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

  // Load available assessments on mount
  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setLoading(true);
        
        // Get JWT token from auth
        const token = await mockTMSClient.getAuthToken();
        
        if (directSubscriptionId) {
          // If direct subscription ID provided, skip dashboard and start workflow
          // This would be implemented with actual API calls
          setError('Direct subscription start not yet implemented');
        } else {
          // Get available assessments from dashboard
          const response = await mockTMSClient.callTool('tms_get_dashboard_subscriptions', {});
          
          if (response.subscriptions) {
            setAvailableAssessments(response.subscriptions);
            
            // If assessment type specified, auto-select matching assessment
            if (assessmentType) {
              const matching = response.subscriptions.find(
                (sub: AssessmentSubscription) => sub.assessmentType === assessmentType
              );
              if (matching) {
                setSelectedAssessment(matching);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading assessments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
  }, [directSubscriptionId, assessmentType]);

  // Start workflow when assessment is selected
  useEffect(() => {
    if (selectedAssessment && !workflowState) {
      startWorkflow(selectedAssessment);
    }
  }, [selectedAssessment]);

  // Send initial greeting when ready
  useEffect(() => {
    if (!loading && messages.length === 0 && !isLoading) {
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
  }, [loading, messages.length, isLoading, append]);

  const startWorkflow = async (assessment: AssessmentSubscription) => {
    try {
      const response = await mockTMSClient.callTool('tms_start_workflow', {
        workflowId: assessment.workflowId,
        subscriptionId: assessment.subscriptionId
      });
      
      if (response.success && response.firstPageUrl) {
        // Parse the first page URL and get the workflow process
        const urlParts = response.firstPageUrl.split('/');
        const [, , , subscriptionId, baseContentId, sectionId, pageId] = urlParts;
        
        await getWorkflowPage(
          subscriptionId,
          parseInt(baseContentId),
          parseInt(sectionId),
          parseInt(pageId)
        );
      }
    } catch (err) {
      console.error('Error starting workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to start workflow');
    }
  };

  const getWorkflowPage = async (
    subscriptionId: string,
    baseContentId: number,
    sectionId: number,
    pageId: number
  ) => {
    try {
      const response = await mockTMSClient.callTool('tms_get_workflow_process', {
        subscriptionId,
        baseContentId: baseContentId.toString(),
        sectionId: sectionId.toString(),
        pageId: pageId.toString()
      });
      
      setWorkflowState({
        subscriptionId,
        workflowId: selectedAssessment?.workflowId || '',
        currentPageId: pageId,
        currentSectionId: sectionId,
        baseContentId,
        questions: response.questions || [],
        navigationInfo: response.navigationInfo || {},
        completionPercentage: response.completionPercentage || 0
      });
      
      // Reset answers for new page
      setCurrentAnswers({});
    } catch (err) {
      console.error('Error getting workflow page:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    }
  };

  const handleAnswerChange = useCallback((questionId: number, value: string) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const submitCurrentPage = async () => {
    if (!workflowState) return;
    
    try {
      // Format answers for API
      const questions = Object.entries(currentAnswers).map(([questionId, value]) => ({
        questionID: parseInt(questionId),
        value
      }));
      
      const response = await mockTMSClient.callTool('tms_update_workflow', {
        subscriptionID: parseInt(workflowState.subscriptionId),
        pageID: workflowState.currentPageId,
        questions
      });
      
      if (response === true) {
        // Check if there's a next page
        const nav = workflowState.navigationInfo;
        if (nav?.canGoForward && nav?.nextPageId) {
          await getWorkflowPage(
            workflowState.subscriptionId,
            nav.nextBaseContentId || workflowState.baseContentId,
            nav.nextSectionId || workflowState.currentSectionId,
            nav.nextPageId
          );
        } else if (workflowState.completionPercentage >= 100) {
          // Assessment complete - generate report
          await generateReport();
        }
      }
    } catch (err) {
      console.error('Error submitting page:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit answers');
    }
  };

  const generateReport = async () => {
    if (!selectedAssessment) return;
    
    try {
      // Map assessment type to template ID
      const templateMap: Record<string, string> = {
        'TMP': '6',
        'QO2': '10',
        'Team Signals': '2'
      };
      
      const templateId = templateMap[selectedAssessment.assessmentType] || '6';
      
      const response = await mockTMSClient.callTool('tms_generate_html_report', {
        subscriptionId: selectedAssessment.subscriptionId,
        templateId
      });
      
      // TODO: Handle report generation and transition to debrief
      console.log('Report generated:', response);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AssessmentLayout
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isLoading={isLoading}
      availableAssessments={availableAssessments}
      selectedAssessment={selectedAssessment}
      onSelectAssessment={setSelectedAssessment}
      workflowState={workflowState}
      currentAnswers={currentAnswers}
      onAnswerChange={handleAnswerChange}
      onSubmitPage={submitCurrentPage}
      onSectionChange={setVisibleSection}
      visibleSection={visibleSection}
    />
  );
}